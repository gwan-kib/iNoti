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

## Implemented detector

`src/content/detector.ts` parses the hash with anchored route patterns and hexadecimal UUID-shaped identifiers (8-4-4-4-12). Extra segments, trailing slashes, query suffixes, malformed IDs, and quiz routes fail closed. Class identifiers normalize to lowercase; question IDs are validated but not retained in normalized state.

`src/content/monitor.ts` reads the initial hash as a baseline, then listens for `hashchange`. It processes each event's new URL to preserve queued transition order. No timers, DOM observation, text inspection, iframe/Shadow DOM inspection, API inspection, or WebSocket interception is used.

| Transition | Candidate |
| --- | --- |
| Initial active route, including refresh | No |
| Same-class waiting to active | Yes |
| Same-class closed to active | Yes |
| Active to closed, active to active, waiting to waiting | No |
| Unsupported to active, or changing classes directly into active | No |
| Unsupported to waiting/closed, then same-class active | Yes, on the later supported transition |

Previous state advances before sending a candidate. Staying on a route and duplicate events cannot resend it. Messages contain only `NEW_POLL` and detection time, not class/question IDs or page content.

## Boundaries

This is route-transition detection, not question identity. Manually navigating back into a poll from waiting/closed can alert again; an unchanged poll URL cannot reveal a new question. Initial active observation deliberately misses the already-open question to avoid refresh alerts.

Multiple tabs may each alert; there is no global deduplication, reconnect policy, or persistent state. Routes changed through mechanisms that do not emit `hashchange` are not observed. Quiz UUIDs may identify a whole quiz, so quiz question notifications are deferred. DOM/network detection would require new evidence and a separate decision, not speculative fallback code.

See [tests and manual verification](TESTING.md), [architecture](ARCHITECTURE.md), and D009 in [decisions](DECISIONS.md).
