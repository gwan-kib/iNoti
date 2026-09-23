# Testing and verification

## Commands

Use Node 22.13+ within 22.x and npm 10 or 11; see [setup](../CONTRIBUTING.md).

| Command | Check |
| --- | --- |
| `npm ci` | Reproducible installation |
| `npm run lint` | Source, tests, configuration |
| `npm run typecheck` | Strict TypeScript and Chrome types |
| `npm test` | Real Vitest tests |
| `npm run build` | Three-surface extension package in dist |
| `npm run check` | Lint, type-check, tests, build |

CI runs the same checks; hosted CI results remain separate from local verification.

## Automated coverage

- Existing route parser/transition matrix and monitor sequences, including baseline/refresh and unsupported routes.
- History/fragment forwarding, top-frame/exact-origin filtering, document targeting, unsupported route sanitization, and safe forwarding failures.
- UNSUPPORTED to WAITING to ACTIVE through worker messages; unsupported/initial active suppression; duplicate hashchange/webNavigation reports in both orders; invalid navigation payloads/senders and wrong-direction messages.
- Worker validation and exactly one compact focused popup with timestamp-only URL; success/failure acknowledgements, rejected payloads/senders, synchronous and asynchronous API failures.
- Timestamp parsing: valid local time, missing/empty/duplicate values, negative/fractional/out-of-range values, nonnumeric or HTML input.
- Alert rendering through textContent and close affecting only its own window.
- Diagnostic prefixes, safe error classification, positive content logs, and delivery failures without retry or private data leakage.

No native-notification API tests remain. Chrome and document boundaries are mocked; these checks do not prove actual window visibility or layout.

## Build inspection

Confirm manifest, content.js, background.js, alert.html, icon, and every alert JS/CSS reference exist inside dist. The sole API permission must be webNavigation; the content match remains the exact student site. No source path or remote dependency may remain. Check no notifications permission/API, action.default_popup, unnecessary permission, inline script, or inline event handler exists. Confirm dist is ignored and untracked. Generated script execution with mocked browser APIs is distinct from a browser test.

## Manual diagnosis procedure

1. Build, reload iNoti in `chrome://extensions`, confirm the new webNavigation permission, and refresh the student page. Record build, Chrome/OS versions, and date. Check extension errors.
2. Open student-page DevTools and the iNoti service-worker console. Enable Info-level messages; filter by `[iNoti]`. Startup should show content `loaded` and `baseline state`, and worker `service worker started` (which may repeat on worker restart).
3. Join a class. An initial document_start UNSUPPORTED baseline is acceptable. Worker should log `webNavigation history update observed` or `webNavigation fragment update observed`, `forwarding navigation update to content script`, and `navigation update delivered`. Content should log `navigation update received` with source webNavigation, UNSUPPORTED to WAITING, eligibility false. Then start a poll from an authorized instructor session. Do not alter routes to claim real-poll evidence or submit student answers.
4. Content should log `navigation update received` with source webNavigation or hashchange, WAITING to QUESTION_ACTIVE, eligibleNewPoll true, then `sending NEW_POLL`. A duplicate from the other source should log active-to-active, eligibility false, with no second alert.
5. Worker should log `message received`, `sender accepted`, `creating alert window`, and `alert window created`. Content should log `NEW_POLL acknowledged by worker`.
6. Verify a compact iNoti card shows the title and local detection time without scrollbars at normal display scaling. Focus may move to it. It is not guaranteed always-on-top; changing applications can cover it.
7. Inspect that alert page's console: `loaded`, then `detection time rendered`. Click ×: `close requested` should occur and only this window should close. Other alerts/student tabs must remain.
8. Verify it stays open without automatic dismissal, contains no sound/settings, and works independently of OS notification permission. Repeat with the student tab unfocused and Chrome minimized, recording actual behavior.

| Last observed stage | Investigate |
| --- | --- |
| No content loaded | Extension reload, site match/access, student-page refresh |
| Baseline UNSUPPORTED with visible route changes but no worker navigation log | Check the updated permission, worker registration, top frame, and exact origin; record event-source evidence |
| Worker forwarding log but no delivery/content update | Check the content receiver, student-page refresh, document target, and safe forwarding error category |
| Navigation update but eligibility false | Previous/next states, source, and same-class transition policy |
| Sending but no worker receipt | Worker startup and safe delivery failure category |
| Rejected message | Invalid payload versus unsupported sender |
| Creating window then failure | Safe window API error category |
| Window created but no alert loaded/rendered | Packaged HTML/JS/CSS references, CSP/runtime errors in alert console |

Acknowledgement proves only API completion, not visual rendering. Errors log categories rather than arbitrary objects to avoid private URLs or content. Set the shared logger's DEBUG constant to false and rebuild to silence diagnostics.

## Regression matrix

| Scenario | Additional alert windows |
| --- | --- |
| Initial waiting or active, including refresh on poll | 0 |
| Same-class waiting to poll | 1 |
| Same-class closed/results to poll | 1 |
| Remaining on poll/repeated event, poll to closed | 0 |
| Quiz/unrelated route or unsupported directly to poll | 0 |
| Unsupported to waiting then same-class poll | 1 at the last transition |
| Poll reported via webNavigation then hashchange, or reverse | 1 total |
| Direct change into another class's poll | 0 |
| Two tabs in same class | Independent alerts; known limitation |

Open the extension alert URL with a missing/malformed timestamp during manual UI testing: it should show “Detection time unavailable”, never HTML from input, and still close normally. Do not include live IDs in evidence.

## Verification status

Local checks on Windows with Node 22.17.1 and npm 11.12.1 passed: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run check`. Vitest ran 96 tests across five files. Build inspection confirmed only webNavigation permission, exact student-site matching, local manifest/HTML asset references, and ignored/untracked dist output. Generated bundles executed together with mocked Chrome APIs: unsupported startup, waiting navigation, a worker restart, and active navigation produced one popup despite duplicate hashchange/fragment reports. This is automated evidence, not a real Chrome test.

The owner verified content injection and worker startup in Chrome on the prior build. The content baseline was UNSUPPORTED, and visible SPA navigation did not emit the expected hashchange log or alert. This is evidence of the old failure, not successful alert delivery or a live test of this fix. History API use is inferred, not directly inspected.

No connected browser/native app is available here, so post-fix Chrome loading and authenticated iClicker delivery must be re-tested using the procedure above. Automated mocks/package inspection do not establish live success. Hosted CI is unverified here.

## Deferred work

No sound, toolbar settings, monitoring toggle, quiz alerts, cross-tab gate, stacking, progress, auto-dismiss, positioning, always-on-top companion, click-to-focus, identity system, storage, telemetry, polling, DOM observation, or network interception is implemented. Recovery and full MVP release evidence remain future work.
