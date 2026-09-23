# Detection strategy

## Confirmed project evidence

The project owner supplied the following observations for revised Phase 1. They replace the previously required investigation spike; they are not a claim that this checkout has passed an authenticated browser test.

Supported origin: `https://student.iclicker.com`.

| Hash route | Normalized state |
| --- | --- |
| `#/class/<classId>` | `WAITING` |
| `#/class/<classId>/poll` | `QUESTION_ACTIVE` |
| `#/class/<classId>/question/<questionId>` | `QUESTION_CLOSED` |
| Everything else, including quiz routes | `UNSUPPORTED` |

The observed sequence is waiting, poll, question, poll, question. Closed question routes expose different question UUIDs, but the poll route has no question UUID. Hash routes were observed changing in a background tab. Refreshing on a poll leaves the URL on that poll.

Only placeholders and synthetic UUIDs belong in committed evidence or tests. Browser/OS versions and real-session verification of this implementation remain to be recorded.

Latest owner-supplied real Chrome evidence: the content console showed `loaded` and baseline `UNSUPPORTED` at document_start, and the worker showed startup. Joining a class and visibly entering `/poll` did not produce the expected hashchange log or alert. Injection is therefore verified for the previous build, but hashchange alone is insufficient. History API navigation is the likely explanation; the site's implementation was not directly inspected. The webNavigation fix and real alert delivery still require re-testing.

## Implemented detector

`src/content/detector.ts` parses the hash with anchored route patterns and hexadecimal UUID-shaped identifiers (8-4-4-4-12). Extra segments, trailing slashes, query suffixes, malformed IDs, and quiz routes fail closed. Class identifiers normalize to lowercase; question IDs are validated but not retained in normalized state.

`src/content/monitor.ts` reads the initial hash as a baseline. One evaluation function handles `hashchange` event URLs and validated `NAVIGATION_CHANGED` hashes from the worker. The worker uses Chrome `onHistoryStateUpdated` and `onReferenceFragmentUpdated`, filtered by hostname plus exact HTTPS origin and top frame. It forwards only supported route hashes; unsupported routes become an empty marker to reset the baseline without disclosing arbitrary route content. No timers, DOM observation, text inspection, History API patching, API inspection, or WebSocket interception is used.

| Transition | Candidate |
| --- | --- |
| Initial active route, including refresh | No |
| Same-class waiting to active | Yes |
| Same-class closed to active | Yes |
| Active to closed, active to active, waiting to waiting | No |
| Unsupported to active, or changing classes directly into active | No |
| Unsupported to waiting/closed, then same-class active | Yes, on the later supported transition |

Previous state advances before sending a candidate. Consecutive reports of the same route from either source cannot resend it, without cooldown timers. NEW_POLL contains only event type and detection time. NAVIGATION_CHANGED carries a transient route hash, potentially containing class/question IDs, only to the originating page; it is neither persisted nor logged. State stays in the content script so worker suspension cannot erase the baseline.

Content diagnostics log startup, baseline, navigation source, previous/next states, eligibility, and message delivery. Worker logs distinguish history/fragment observation, forwarding, delivery, and failure. Raw hashes and UUIDs are not logged. The custom HTML alert and route parser/transition policy are unchanged.

## Boundaries

This is route-transition detection, not question identity. Manually navigating back into a poll from waiting/closed can alert again; an unchanged poll URL cannot reveal a new question. Initial active observation deliberately misses the already-open question to avoid refresh alerts.

Multiple tabs may each alert; there is no global deduplication, reconnect policy, or persistent state. An event lost before the content receiver is ready is logged but not replayed; a later active route alone does not prove a new poll. Cross-source ordering across multiple rapid distinct transitions still needs browser testing. Quiz support remains deferred. DOM/network detection would require new evidence and a separate decision.

See [tests and manual verification](TESTING.md), [architecture](ARCHITECTURE.md), and D009/D012 in [decisions](DECISIONS.md).
