# Architecture

Status: planned design derived from the source roadmap; no components are implemented. See [decisions](DECISIONS.md) for accepted directions and provisional choices.

## Components and state ownership

| Component | Responsibility | State ownership |
| --- | --- | --- |
| Content script | Runs only on approved iClicker student origins; observes session/question DOM, normalizes state, derives local keys, emits meaningful changes | Page-local observation and prior evaluation only; no notification UI or global authority |
| MV3 service worker | Validates messages, coordinates tabs, suppresses duplicates, creates/clears notifications, handles click focus and settings | Authoritative session registry, duplicate gate, notification mapping; reconstructable after suspension |
| Popup | Displays Idle/Monitoring iClicker and monitoring/sound controls; requests status on opening | Transient presentation; never an always-running coordinator |
| Optional offscreen document | Plays one bundled sound on a deduplicated request | Audio lifecycle only; use AUDIO_PLAYBACK if selected after testing |

Use TypeScript and a lightweight build with plain HTML/CSS for the popup. React is unnecessary for the MVP. Put browser APIs behind small wrappers where that improves testing or later portability without prematurely adding cross-browser packaging.

## Event and message flow

1. Content-script startup immediately evaluates the page and registers its state. A narrowly scoped MutationObserver triggers later evaluations, with mutation bursts batched if needed.
2. The detector maps observed signals to normalized states; a pure reducer determines meaningful transitions. It must fail closed on ambiguous evidence.
3. The worker receives a candidate, checks effective settings and session/question identity, and applies the authoritative duplicate gate across tabs.
4. An accepted candidate produces one native notification and one sound request if sound is enabled. The notification is silent so the OS and bundled sound do not both play.
5. A notification click resolves its stored tab/window mapping, activates that tab, and focuses its Chrome window. A missing target must be handled safely rather than selecting an unrelated tab.

Planned shared contracts in `src/shared/messages.ts`:

| Direction | Messages |
| --- | --- |
| Content script to worker | `SESSION_STATUS`, `STATE_CHANGED`, `NEW_QUESTION_CANDIDATE`, `DISCONNECTED` |
| Worker to offscreen document | `PLAY_SOUND` |
| Popup to worker | `GET_STATUS`, `SET_MONITORING_ENABLED`, `GET_SETTINGS`, `UPDATE_SETTINGS` |
| Worker to popup | Current monitoring state and effective settings |

Exact payload schemas and runtime validation are pending implementation. Use only minimal state, identifiers, and timing metadata; do not include question text, answer choices, or student answers. Derive the sender's tab identity from the browser-provided context.

## Normalized states

| State | Meaning and transitions |
| --- | --- |
| `NO_SESSION` | No valid session; session discovery moves to `WAITING` or a confidently established current state |
| `WAITING` | Valid session without an answerable question; a new question moves to `QUESTION_ACTIVE` |
| `QUESTION_ACTIVE` | Answerable question; notify only for a genuinely new session/question key |
| `QUESTION_CLOSED` | Submitted, closed, or results state; no new alert; may return to waiting |
| `DISCONNECTED` | Lost connection or invalid/uncertain session; no alert until valid state returns |

Reconnect may return to waiting or active, but the same question must not alert again. Page parsing and transition policy remain separate. See [detection strategy](DETECTION_STRATEGY.md) for identity and unresolved edge cases.

## Storage and multiple tabs

- Proposed persistent preferences: monitoring enabled and sound enabled in `chrome.storage.local`. Defaults remain open. Use `sync` only after explicitly choosing cross-device settings and updating privacy documentation.
- Planned `chrome.storage.session`: tab/session registry, minimal dedupe metadata, and notification-to-tab/window mappings. This state must survive worker restarts; it is not a promise of persistence across a full browser restart.
- Registry entries are keyed by `tabId` and contain `sessionKey`, normalized state, last question key, and last update time. Stable session identity must be established by investigation.
- Suppress duplicates by `sessionKey + questionKey` across tabs, while keeping genuinely different sessions separately addressable. Do not assume the newest or focused tab is the correct target.
- Remove tab registry entries and target mappings when tabs close or leave iClicker. Refresh registration after navigation/restart. Define dedupe retention and expiry before implementation so tab cleanup does not accidentally replay an already-notified question.
- Never persist question text, choices, or student answers. Question-key algorithm, concurrency handling, storage schema, and dedupe expiry remain design tasks.

## Notifications and recovery

Use the title **New iClicker Question** and message **Detected at [local time]**. Notification IDs should be tied deterministically to session/question identity. Request `requireInteraction` where supported, but treat placement and persistence as OS-controlled behavior.

On full refresh, recompute and re-register. On SPA route or container changes, re-evaluate and reattach observation as needed. On worker restart, load ephemeral metadata and reconcile fresh content messages. During disconnection or unsupported states, suppress uncertain alerts. On reconnect, require evidence of a genuinely new question.

Normal background tabs, minimized Chrome, and another foreground app are required test cases. Frozen/discarded tabs are a separate limitation to investigate. Do not disable discarding by default; any active-session-only exception needs evidence, a decision, tests, and restoration of normal behavior after monitoring ends.

## Proposed source structure

These paths describe future extension files; they do not exist yet. Package metadata, TypeScript/build/test/lint configuration, and CI already exist; see [developer setup](../CONTRIBUTING.md). The current `tooling/index.html` build entry is infrastructure only and will be replaced during Phase 2.

```text
manifest.json
src/
  background/
    service-worker.ts
    notifications.ts
    session-registry.ts
  content/
    iclicker-monitor.ts
    detector.ts
    question-key.ts
  offscreen/
    offscreen.html
    offscreen.ts
  popup/
    popup.html
    popup.ts
    popup.css
  shared/
    messages.ts
    state.ts
    settings.ts
    constants.ts
assets/
  icons/
  sounds/
tests/
  fixtures/
  unit/
  integration/
```

The offscreen subtree is conditional. Exact origins, OS support, minimum Chrome version, and final audio implementation remain open. Tooling choices are recorded in D008 in [decisions](DECISIONS.md). Permission boundaries are maintained in [PRIVACY.md](PRIVACY.md).
