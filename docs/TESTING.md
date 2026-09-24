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
- Toolbar popup wiring to the extension-owned dev tester and manifest permission regression coverage.

Small EventTarget/DOM fakes and injected window/view boundaries keep tests dependency-free. These do not emulate user activation enforcement, isolated-world API exposure, CSP, layout, browser size clamping, or always-on-top behavior. Removed NEW_POLL worker sender tests belonged to the deleted receiver; active worker-origin/navigation sender validation remains covered.

## Build inspection

After CSS sizing changes, check the popup, tester, PiP, and monitoring control at default and increased browser font sizes and narrow viewports. Static lengths use `rem`; verify text wrapping, focus outlines, and control visibility. The shadow control inherits the host document root size. The preview must still match the actual PiP content viewport in CSS pixels.

Confirm `dist/shared/brand-colors.css` exists for popup/tester stylesheet imports. After palette edits, rebuild and reload; check the popup, inline preview, real PiP, and on-page monitoring button for consistent colors and legible focus/disabled states.

After building, dist must contain manifest.json, content.js, background.js, assets/inoti-logo.png, popup/{popup.html,popup.css,popup.js}, and dev-testing/{index.html,dev-testing.css,dev-testing.js}. Verify no legacy alert-window HTML/JS/CSS remains, including when building over an old dist. The first stage clears output. Verify only webNavigation and storage permissions, exact student-site content match, minimum_chrome_version 123, the toolbar popup includes the pulse preference and links to the extension-owned dev tester, and no remote scripts. PiP icons load the Google Fonts stylesheet and font. Source and bundles must contain no Chrome window/native-notification alert path. dist remains ignored and untracked.

## Hot reload smoke check

Run `npm run dev` and open the local tester. Switch the inline preview to a question, open real PiP, and edit `src/content/pip-view.css`: both views should update styles without resetting their state. Edit tester CSS to check its live styling. HTML/TypeScript changes should reload the page; reopen PiP with a click. After stopping the server, confirm `npm run check` still builds the standalone extension. Localhost testing does not establish live iClicker compatibility.

## Development tester

Change `PIP_DIMENSIONS_REM` in `src/shared/pip-dimensions.ts` to size the real PiP request and the initial inline preview in rem. Each user-started request converts the rem footprint using the opener root font size; verify 288 x 128 CSS pixels at 16px and 360 x 160 at 20px before browser clamping. Font changes do not resize an already-open PiP. Rebuild, reload the extension, and refresh the tester after editing. After **Open PiP**, verify the preview matches the actual PiP content viewport, including Chrome's size clamping, and follows manual window resizing. Closing PiP detaches the resize listener and retains the last preview size; reopening synchronizes again. The preview does not reproduce Chrome's title bar or window frame.

Both surfaces render `src/content/pip-view.ts` directly for markup, text, and idle/question rendering, with styles imported from `src/content/pip-view.css`. Edit `.question-title-text` or `.detection-time-text` in that stylesheet to style the named text spans; no separate tester view needs updating. The toolbar popup uses `src/popup/popup.css`, including `.popup-title-text`. The preview wrapper scrolls on narrow screens instead of shrinking the PiP viewport and adds no border or rounding to the view. **Open PiP** also uses the production controller for real window lifecycle testing; the inline preview's simulation buttons are not a browser lifecycle emulation.

After building and reloading the unpacked extension, click the iNoti toolbar icon and choose **Open Dev Tester**. The tester must work without an iClicker tab. Confirm the inline preview can switch between idle and New iClicker Question, the displayed time updates locally, the active alert's **Go to Question** and **Question Answered** controls behave in both the preview and the real PiP, **Open PiP** opens the shared PiP view from the click, **End Question** shows Question Ended and the local end time, stops the elapsed timer, and removes pulsing, and **Stop PiP** closes it. Confirm the on-page event log and DevTools `[iNoti][dev]` output contain only generic state/capability information. Clearing the log affects only the tester page.

The tester is not evidence that route detection, background delivery, reconnect behavior, or authenticated iClicker compatibility works. Those still require the real-browser matrix below. Optional local console captures belong under `dev-testing/logs/`, which is intentionally ignored by Git.

## Go to Question checks

`npm run check` passed lint, type-check, all 98 tests, and all four production builds. Browser inventory returned no connected browsers or apps, so real focus, retained PiP visibility, keyboard, and layout checks were not run.

From a real PiP active alert, switch to another tab/application and click Go to Question (also test Tab then Enter/Space). Verify the original iClicker tab gains focus, PiP stays open, and the timer and monitoring continue without reset. Idle and ended screens must hide the button. Repeat on the next question and after stopping/restarting monitoring. In the development tester, the button focuses the tester opener only. Check button visibility, wrapping, and keyboard focus at the clamped window size and increased font sizes. Chrome 123+ is required. Automated callback/visibility tests cannot establish real browser focus or cross-application behavior.

## Question Answered checks

On a real PiP active alert, click Question Answered (also test Tab then Enter/Space). Verify both action buttons sit below the alert content without overlapping it in the clamped window, PiP returns to the idle monitoring screen, the elapsed timer and pulse stop, and monitoring stays started with the control still reading Monitoring. Confirm the later route change to waiting/results does not replace the idle screen with Question Ended, and that the next detected question alerts again in the same window. Idle and ended screens must hide the button, and a stale click after close or stop must do nothing. In the development tester, Question Answered resets both the inline preview and the real PiP. Automated view/controller tests cover visibility and the idle transition; layout, keyboard, and live iClicker behavior remain browser checks.

`npm run check` passed lint, type-check, all 102 tests, and all four production builds. Layout, keyboard, and live behavior were not run because no connected browser or authenticated class session is available.

## Question ended screen checks

In the tester, open PiP, choose New Question, then End Question. Verify the neutral background, Question Ended title, local Ended at time, and hidden elapsed timer. In a controlled class, check both active-to-waiting and active-to-results routes. Repeated end reports must retain the first end time. The next question must restore the active title, pulse preference, and fresh elapsed timer in the same window. Initial waiting/closed routes and monitoring started on an already-active question must not invent an ended alert. Leaving the class or closing PiP still stops monitoring.

`npm run check` passed lint, type-check, all 96 tests, and all four builds. Automated controller, route integration, and view tests cover ended transitions and cleanup. Live iClicker and visual browser verification remain pending; no connected browser or authenticated class session is available in this session.

## Elapsed timer checks

`npm run check` passed lint, type-check, all 94 tests, and all four builds for this update. The concurrent 10 x 10 rem footprint was preserved and its size expectations updated. No connected browser or controlled live class was available for visual/live verification.

Automated tests cover immediate 0:00, delayed ticks, minute/hour formatting, reset on the next question, replacement of an existing interval, cleanup on idle/pagehide, and nonnegative elapsed time. In Chrome, simulate a question in the tester and confirm preview/PiP count up, stay readable at the clamped window size, and return to idle without a timer. Toggle pulsing while counting and verify no timer reset. Close/reopen PiP and verify the next alert starts fresh. Background the opener and verify the display catches up after delayed execution. A controlled live class is still needed to verify actual detection timing.

## Alert background manual checks

Reload the built extension and refresh the tester/student pages after the new storage permission is recognized. In the extension-owned tester, open PiP and simulate a question: both views should pulse a soft lavender circle that grows outward from the middle of the question title over the pink alert surface. Toggle **Pulse new-question background** off in the toolbar popup while the question remains active: both views should immediately become solid soft pink without changing the detection time. Re-enable it, return to idle, and simulate the next question. Idle must never pulse. Close/reopen the popup and PiP and restart Chrome to check persistence. Enable OS reduced motion and confirm active alerts stay solid even with the toggle on. Check readability throughout the animation. The localhost tester uses the enabled default because it has no extension storage; test popup synchronization using the extension-owned tester.

Automated preference tests cover defaults, malformed values, local live updates, stale initial reads, disposal, read/write failure, popup save rollback, and active/idle rendering. Browser animation, reduced-motion behavior, persistence across Chrome restarts, and live iClicker delivery still require the manual checks.

## Real unpacked Chrome manual matrix

Build, reload the extension in chrome://extensions, refresh the student tab, and record build revision, date, desktop Chrome version, OS, display scaling, and actual results. Use an authorized authenticated class/instructor session; synthetic route changes are not evidence of live poll compatibility. Never submit answers or retain identifiers for this test.

All rows below are **pending for this PiP migration**.

| Scenario | Expected result |
| --- | --- |
| Join supported waiting/closed/active class route | Small Start Monitoring control; keyboard accessible and does not cover important iClicker controls at normal/narrow widths |
| Unsupported/home/quiz route | No monitoring control or question alert |
| Click Start Monitoring / activate with keyboard | One PiP opens idle; no separate Chrome alert window |
| Rapid repeat clicks during opening | Only one request/window; no duplicate monitor |
| Idle content | Logo and iNoti, legible at browser-clamped size |
| Switch Chrome tabs | PiP remains visible above windows |
| Background/minimize Chrome with iClicker open | PiP remains visible; record any OS-specific difference |
| Switch to another desktop application | PiP remains visible; record focus behavior |
| Authorized instructor opens new poll from waiting | Existing PiP displays New iClicker Question and correct local detection time exactly once |
| Duplicate hashchange and webNavigation reports | One alert update total |
| Stay on same active poll | No repeat alert, new window, resize, or timer dismissal |
| Poll ends/submitted/results route or waiting | Same PiP shows Question Ended and its local end-detection time; no pulse, timer, new window, or close |
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

Pulse preference update: `npm run check` passed lint, type-check, all 92 tests across nine files, and all four production builds. Initial sandbox execution hit Vite `spawn EPERM`; the approved run with process access passed. Browser inventory exposed no connected browsers or native apps, so animation, reduced-motion, real popup/PiP synchronization, and authenticated iClicker checks were not run.

The migration has local automated verification on Windows with Node 22.17.1 and npm 11.12.1. On 2026-09-23, npm run lint, npm run typecheck, npm test (74 tests across five files), npm run build, and npm run check all passed. Artifact inspection confirmed the exact four-file package, narrow permissions/site match, Chrome 123 minimum, and no legacy alert delivery in source/bundles. Relative documentation links and whitespace were checked. Initial sandboxed Vite execution hit spawn EPERM; validation was rerun with the required process access. A nested local .kilo worktree initially confused lint discovery; configuration now isolates this checkout without changing that worktree.

No real Chrome/iClicker PiP matrix rows were run in that implementation session. No authenticated, controlled instructor/student poll session was supplied for live transition verification. Cross-application/minimize visibility, actual content-script API access, layout, and background behavior remain manual checks. Earlier owner evidence established injection/worker startup but missed hashchange navigation on a prior build; it does not verify this migration. The development tester is also not a substitute for these checks. The current dev-tester/popup change still requires a fresh `npm run check`, unpacked-build inspection, and browser smoke test after this commit; hosted CI should be checked separately.

## Deferred work

Sound, other persistent settings, quiz support, cross-tab identity/deduplication, history, stacking, progress, auto-dismiss, positioning, session storage, telemetry, polling, DOM observation, and network interception remain absent. Recovery and full MVP release evidence remain future work.

## Compact PiP redesign

Check idle, active, and ended at the requested 18rem by 8rem viewport, Chrome-clamped sizes, manually narrowed windows, and increased fonts. Confirm the status badge, Google Fonts clock/hourglass symbols, timing row, and side-by-side Go to Question/Answered buttons fit without clipping. Check keyboard focus, pulse on/off and reduced motion, long elapsed times, and local 12/24-hour time formats. Idle and ended retain monitoring guidance with no actions.

Browser layout and live iClicker verification remain pending: the browser inventory for this redesign returned no connected browsers or apps, and no authenticated class session is available.

Redesign automated verification: `npm run check` passed lint, type-check, all 102 tests, and all four builds. The previous SVG assets have since been replaced by a Google Fonts stylesheet link.

Tester controls: click Idle from both active and ended; both views should return to waiting without closing PiP, and the next New Question should work. Toggle Pulse new-question background before/after opening PiP, stop/reopen, and verify both views retain the selection. Reload resets the override to the saved preference (or enabled on localhost). System reduced motion still prevents animation. Automated tester wiring covers idle transitions and pulse propagation; browser verification remains pending.

Google Symbols check: inspect the PiP/preview HTML head for the Google Fonts stylesheet link, verify rounded schedule/hourglass glyphs load in both localhost and extension testers and live iClicker PiP, and check inherited CSP/network failures. Confirm times and controls remain usable if the font is unavailable. No browser is connected to verify remote font rendering in this session.
