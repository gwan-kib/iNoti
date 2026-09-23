# Architecture decisions

These short records capture the source plan's design direction and unresolved implementation choices. **Accepted direction does not mean implemented or browser-verified.** All components remain unimplemented.

For each future record include an ID, status (proposed, accepted, or superseded), context, choice, alternatives, consequences, and evidence. Link an issue only if one exists. Update a record or supersede it when new evidence changes the choice.

## D001: Small MV3 extension with separated responsibilities

Status: accepted design direction.

Reliable question alerts are the MVP. Use a content script for iClicker interpretation, a disposable service worker for coordination and delivery, and a popup for current status/settings. Use TypeScript, a lightweight build, and plain HTML/CSS instead of a UI framework for the small popup.

This keeps detector changes isolated and avoids depending on an open popup or long-lived worker globals. Cross-browser packaging and advanced notification UI remain deferred. Exact tooling and versions are pending.

## D002: Evidence-based DOM observation first

Status: accepted strategy; concrete signals pending investigation.

Prefer stable local identifiers, semantic attributes, and structural signals with narrow event-driven observation. Avoid generated CSS classes, continuous polling, and undocumented network APIs as the default.

DOM assumptions can still change, so centralize them, document observed evidence, and cover them with synthetic fixtures. Network inspection requires proof of a material reliability benefit and review of permission/coupling costs. No selector has been chosen.

## D003: Worker-owned cross-tab deduplication

Status: accepted design direction; key and retention policy pending.

Per-tab suppression alone cannot prevent two tabs from alerting for the same question. The worker owns a registry and a duplicate gate scoped by session/question identity. Store reconstructable runtime metadata in ephemeral extension storage to survive worker suspension.

Tests must cover concurrency, stale events, refresh/reconnect, and separate sessions. Identity derivation, expiry, and interrupted-delivery handling must be specified before implementation.

## D004: Persistent settings and ephemeral monitoring state

Status: proposed storage selection.

Use `chrome.storage.local` for monitoring/sound preferences and `chrome.storage.session` for registry, dedupe, and notification mappings. This separates user preferences from short-lived session data. Avoid sync unless cross-device settings are explicitly desired.

Never persist question text, choices, or student answers. Defaults, exact schemas, retention, and browser-restart behavior remain open. Selecting sync would require a privacy update because settings would no longer be local-only.

## D005: Native notifications for V1

Status: accepted design direction.

Native notifications support alerting while another application is active. Keep them separate from detection and tie actions to session/question identity. Request interaction persistence where supported without promising OS-independent placement or duration.

Injected overlays work inside a page; positioned browser windows are not equivalent to desktop toasts. Arbitrary desktop overlays may require a native companion. Custom positioning is a separate post-MVP decision.

## D006: Offscreen audio only if testing supports it

Status: proposed; validation required.

Use an offscreen document with the `AUDIO_PLAYBACK` reason if it is the reliable choice for the bundled sound. Keep a small audio abstraction so a demonstrably simpler and equally reliable approach can replace it.

Native notifications should be silent to prevent double sound. Adding `offscreen`, selecting the minimum Chrome version, and claiming reliable audio require lifecycle/browser evidence. No audio mechanism or asset is implemented.

## D007: Minimum permissions and no default discard override

Status: accepted constraints; concrete manifest pending.

Plan `storage`, `notifications`, and only confirmed student-origin access. Add `offscreen` only if used. Do not default to `<all_urls>`, `tabs`, `scripting`, or `webRequest`; document a specific unmet capability before adding a permission.

Do not disable tab discarding by default. If evidence justifies an active-session-only override, record the resource tradeoff, required access, cleanup/restoration behavior, and tests before adding it. See [privacy](PRIVACY.md).

## Decisions still required

- Confirmed origins, signal evidence, session/question identity and fingerprint collision handling.
- First-active observation, monitoring re-enable, stale event ordering, dedupe retention, and delivery retries.
- Setting defaults, tooling/commands, supported OS matrix, and minimum Chrome version.
- Audio implementation, notification focus without broad `tabs` access, and any measured discard limitation.
