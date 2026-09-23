# Detection strategy

## Evidence status

**No live iClicker investigation has been performed for this repository.** No origin, selector, stable identifier, or network signal is confirmed, and no detector or fixture has been implemented. The following is the investigation and implementation contract, not a record of observed behavior.

Do not hard-code production selectors until the Phase 1 spike establishes an evidence-backed design.

## Investigation checklist

| Question | Evidence to record | Current status |
| --- | --- | --- |
| Which student origins are needed? | Exact origin and narrow matching scope, excluding credentials and private URLs | Unverified |
| How are waiting, active, submitted, closed, results, inactive, and disconnected states exposed? | Semantic attributes, roles, structural relationships, and enabled/disabled controls per state | Unverified |
| Are session/class and question IDs stable? | Stability across transitions, refresh, duplicate tabs, and reconnect; synthetic examples only | Unverified |
| Ordinary DOM, iframe, or Shadow DOM? | Boundary and access requirements, stable observation root | Unverified |
| Full navigation or SPA routing? | Route transitions, container replacement, observer reattachment requirements | Unverified |
| Does background rendering continue? | Chrome/OS versions and observed focused, unfocused, minimized behavior | Unverified |
| What happens under Memory Saver/discard? | Freeze/discard behavior and recovery evidence | Unverified |
| Is network inspection necessary? | Specific DOM failure and evidence that a narrower alternative cannot work | Unverified; last resort only |

For each finding record the date, environment, state transition, sanitized signal description, confidence/fragility, and corresponding synthetic fixture/test. Do not commit production page dumps, live identifiers, student data, question text, or answers. Record limitations as well as successful observations.

## Preferred signals and observer design

1. Prefer a stable question/session identifier or semantic state attribute already exposed in the DOM.
2. Otherwise use stable structural relationships, accessibility roles/attributes, and control state that distinguish an answerable question without relying on styling or localized text.
3. Observe the smallest stable state container using a MutationObserver. A mutation requests re-evaluation; it is not itself a new question.
4. If stable identity is absent, investigate a local fingerprint. Prefer session identity plus a stable DOM identifier. Only if needed, hash normalized question content transiently; never transmit or retain the source content.
5. Consider API/network/WebSocket observation only if documented DOM limitations justify the coupling and permission cost.

Centralize page selectors and signal interpretation in `src/content/detector.ts`; isolate key construction in `question-key.ts`. Batch bursts into an evaluation when necessary without high-frequency polling. Re-evaluate on startup, relevant navigation, and container replacement. Document iframe/Shadow DOM handling and add fixture coverage if observed.

## State and notification rules

| Observed meaning | Normalized state | Alert eligibility |
| --- | --- | --- |
| No valid active session | `NO_SESSION` | None |
| Valid session waiting | `WAITING` | None |
| Confidently answerable question | `QUESTION_ACTIVE` | Candidate only with proven session/question identity |
| Submitted, closed, or results | `QUESTION_CLOSED` | None |
| Connection lost or session uncertain | `DISCONNECTED` | None |

Unsupported markup must fail closed: do not notify without confident answerability. Keep the reducer pure where possible; parsing determines meaning and the reducer decides whether a meaningful transition warrants a candidate.

## Question keys and deduplication

- Prefer stable session and question IDs; define fallback normalization only after investigation. Scope every question key to its session.
- The content script avoids repeated identical state events. The service worker is the authoritative cross-tab gate.
- Alert only when state establishes a new answerable question whose identity has not already produced an alert for that session. A different key alone is not proof if the page is closed, showing results, or uncertain.
- Answer submission, results, closure, unrelated mutations, same-question re-render, duplicate tabs, and recovery of the same question must produce zero additional alerts.
- Preserve sufficient ephemeral dedupe metadata through worker suspension and refresh/reconnect. Keep distinct sessions independent even when their local question identifiers coincide.
- Test simultaneous duplicate candidates and delayed/stale events. Comparing only a single last key may be insufficient if an older question arrives after a newer one; define ordering and retained-key policy before implementation.

The exact fingerprint algorithm, collision strategy, dedupe retention/expiry, and notification delivery/retry ordering are unresolved. Document and test the chosen behavior before claiming exactly-once delivery across lifecycle disruptions.

## Open behavior decisions

- Whether a first-ever observation of an already-active question alerts, and how that differs from a recovered already-notified question.
- Whether re-enabling monitoring during a question alerts or establishes a baseline.
- How two separate questions with identical text are distinguished without stable IDs.
- How an older tab reporting stale state is rejected, and how session identity survives navigation safely.
- How identity is renewed when a session ends or a class starts another session.
- How refresh/reconnect and a full browser restart differ when ephemeral metadata is absent.

The source plan does not resolve these details. They must be settled with evidence, recorded in [DECISIONS.md](DECISIONS.md), and represented in tests.

## Phase 1 exit criterion

A written design identifies supported origins, confident state signals, observation boundaries, identity strategy, failure modes, and synthetic fixtures for all required states. Real background behavior has been recorded, and unknowns that prevent reliable detection are resolved before production detection code. See [TESTING.md](TESTING.md).
