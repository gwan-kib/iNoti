# Testing and verification

## Commands

Use Node 22.13+ within 22.x and npm 10 or 11; see [setup](../CONTRIBUTING.md).

| Command | Check |
| --- | --- |
| `npm ci` | Reproducible installation |
| `npm run lint` | Source, tests, configuration; excludes local nested .kilo worktrees |
| `npm run typecheck` | Strict TypeScript and Chrome types |
| `npm test` | Real Vitest tests under tests/ |
| `npm run build` | Two-stage content/worker extension package |
| `npm run check` | Lint, type-check, tests, build |

CI runs equivalent checks; hosted CI results remain separate from local verification.

## Automated coverage

- Unchanged pure route parser/transition matrix, initial active/refresh baseline, unsupported and cross-class safeguards.
- History/fragment forwarding, top-frame/exact-origin filtering, document targeting, unsupported sanitization, private error handling.
- Supported-route control visibility, synchronous user-action PiP request, duplicate-click guard, idle startup, same-window alert/idle transitions, local time rendering.
- Consecutive hashchange/webNavigation deduplication in both orders, malformed contracts, wrong-direction messages and untrusted navigation senders.
- No automatic opening from question events, no alerts before start/after stop, close restoring Start Monitoring, class/session exit and opener pagehide/BFCache cleanup.
- Unsupported API, sync/async request failures with explicit retry, late pending-open cleanup, and stale close events.

Small EventTarget/DOM fakes and injected window/view boundaries keep tests dependency-free. These do not emulate user activation enforcement, isolated-world API exposure, CSP, layout, browser size clamping, or always-on-top behavior. Removed NEW_POLL worker sender tests belonged to the deleted receiver; active worker-origin/navigation sender validation remains covered.

## Build inspection

After building, dist must contain exactly manifest.json, content.js, background.js, and assets/icon-128.png. Verify no legacy alert HTML/JS/CSS remains, including when building over an old dist. The first stage clears output. Verify only webNavigation permission, exact student-site content match, minimum_chrome_version 116, no action popup, and no remote dependencies. Source and bundles must contain no Chrome window/native-notification alert path. dist remains ignored and untracked.

## Real unpacked Chrome manual matrix

Build, reload the extension in chrome://extensions, refresh the student tab, and record build revision, date, desktop Chrome version, OS, display scaling, and actual results. Use an authorized authenticated class/instructor session; synthetic route changes are not evidence of live poll compatibility. Never submit answers or retain identifiers for this test.

All rows below are **pending for this PiP migration**.

| Scenario | Expected result |
| --- | --- |
| Join supported waiting/closed/active class route | Small Start Monitoring control; keyboard accessible and does not cover important iClicker controls at normal/narrow widths |
| Unsupported/home/quiz route | No monitoring control or question alert |
| Click Start Monitoring / activate with keyboard | One PiP opens idle; no separate Chrome alert window |
| Rapid repeat clicks during opening | Only one request/window; no duplicate monitor |
| Idle content | Minimal dot and iNoti, legible at browser-clamped size |
| Switch Chrome tabs | PiP remains visible above windows |
| Background/minimize Chrome with iClicker open | PiP remains visible; record any OS-specific difference |
| Switch to another desktop application | PiP remains visible; record focus behavior |
| Authorized instructor opens new poll from waiting | Existing PiP displays New iClicker Question and correct local detection time exactly once |
| Duplicate hashchange and webNavigation reports | One alert update total |
| Stay on same active poll | No repeat alert, new window, resize, or timer dismissal |
| Poll ends/submitted/results route or waiting | Same PiP returns idle; no new alert or close |
| Next closed/waiting to active transition | Same PiP alerts again once |
| Initial load/refresh on active poll | Start Monitoring; no automatic PiP or fake new question after click |
| Manually close PiP | Monitoring stops; Start Monitoring returns; later polls do not alert until another click |
| Click active Monitoring control | PiP closes and Start Monitoring returns |
| Leave supported session/change class | PiP closes; new class requires a fresh click; unsupported pages hide the control |
| Navigate away while PiP opening | Late opened window is closed; monitoring remains inactive |
| Full refresh/close opener | PiP closes; no automatic reopening |
| Back/forward cache restoration | Fresh baseline, inactive monitoring, no duplicate active alert |
| Missing API (controlled unsupported environment) | Clear unavailable state; no page navigation or fallback |
| Request denied/fails | Visible retry state; no active claim; another explicit click can retry |
| Extension/worker restart | Worker listeners return without owning PiP/state; rebuild/reload requires student-page refresh |
| Memory Saver, background freeze/discard, reconnect | Record missed updates/closure and recovery needs; no reliability guarantee or discard override |

Check both PiP states at normal and increased display scaling, keyboard focus, live-region announcement, and site CSP/style compatibility. PiP is a same-origin web-platform window accessed from the isolated content script: confirm requestWindow and DOM access in this exact extension context. Do not substitute a console call in the main world for this check.

## Diagnosis

Enable Info logs in student-page and service-worker DevTools, filtered by [iNoti]. Expected stages: content loaded/baseline; worker history/fragment observed -> forwarding -> delivered; content navigation update with normalized states and eligibility; control shown -> start requested -> PiP opened -> monitoring started -> idle -> question active -> idle -> closed/stopped.

A route candidate with inactive monitoring intentionally produces no alert. If PiP fails to open, inspect the safe failure category and browser API availability/user activation. If a route update is missing, check permission, exact top-frame origin, originating document target, and receiver acknowledgement. A successful mock, build, or forwarding acknowledgement does not establish visual rendering. No arbitrary exceptions, URLs, IDs, question text, or answers belong in shared evidence. DEBUG in the shared logger silences diagnostics on rebuild.

## Verification status

The migration has local automated verification on Windows with Node 22.17.1 and npm 11.12.1. On 2026-09-23, npm run lint, npm run typecheck, npm test (74 tests across five files), npm run build, and npm run check all passed. Artifact inspection confirmed the exact four-file package, narrow permissions/site match, Chrome 116 minimum, and no legacy alert delivery in source/bundles. Relative documentation links and whitespace were checked. Initial sandboxed Vite execution hit spawn EPERM; validation was rerun with the required process access. A nested local .kilo worktree initially confused lint discovery; configuration now isolates this checkout without changing that worktree.

No real Chrome/iClicker PiP matrix rows were run in this implementation session. No authenticated, controlled instructor/student poll session was supplied for live transition verification. Cross-application/minimize visibility, actual content-script API access, layout, and background behavior remain manual checks. Earlier owner evidence established injection/worker startup but missed hashchange navigation on a prior build; it does not verify this migration. Hosted CI is unverified.

## Deferred work

Sound, persistent settings, quiz support, cross-tab identity/deduplication, history, stacking, progress, auto-dismiss, positioning, click-to-focus, storage, telemetry, polling, DOM observation, and network interception remain absent. Recovery and full MVP release evidence remain future work.
