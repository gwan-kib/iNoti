# Testing and verification

## Commands

Use Node 22.13+ within 22.x and npm 10 or 11; see [setup](../CONTRIBUTING.md).

| Command | Check |
| --- | --- |
| `npm ci` | Reproducible installation |
| `npm run lint` | Source, tests, configuration; excludes local nested .kilo worktrees |
| `npm run typecheck` | Strict TypeScript and Chrome types |
| `npm test` | Real Vitest tests under tests/ |
| `npm run build` | Five-stage extension package (content, worker, popup, tester, offscreen) plus copied sounds |
| `npm run check` | Lint, type-check, tests, build |

CI runs equivalent checks; hosted CI results remain separate from local verification.

## Automated coverage

- Unchanged pure route parser/transition matrix, initial active/refresh baseline, unsupported and cross-class safeguards.
- History/fragment forwarding, top-frame/exact-origin filtering, document targeting, unsupported sanitization, private error handling.
- Supported-route control visibility, synchronous user-action PiP request, duplicate-click guard, idle startup, same-window alert/idle transitions, local time rendering, and the panel Open/Close window toggle.
- Consecutive hashchange/webNavigation deduplication in both orders, malformed contracts, wrong-direction messages and untrusted navigation senders.
- Monitoring/window separation: monitoring continues with the window closed, opening the window neither starts nor requires monitoring, closing it neither stops monitoring nor blocks later sounds, leaving the class stops the old session, and unsupported routes produce no alerts or sounds.
- One accepted new question produces one sound request and at most one window transition; the window closed still requests exactly one sound; opening the window during an active question, reopening it, and closing it produce no sound; baselines, waiting/ended transitions, duplicates, and repeated active events stay silent.
- Sound registry (default entry, strict/lenient resolution), local `soundEnabled`/`selectedSoundId` defaults/malformed fallback, and popup load/save/rollback.
- Service worker sound delivery: malformed requests and untrusted senders ignored, enabled requests ensure/reuse the offscreen document, disabled requests create none, a `PREVIEW_SOUND` request plays even while disabled, concurrent requests create once, registered/default id forwarded, unknown persisted ids fall back, and failures log safely.
- Sound requests send only a generic message: `NEW_QUESTION_DETECTED` for a question and `PREVIEW_SOUND` for the popup preview, with rejected sends logged safely.
- Offscreen player: registered ids resolve to the expected extension URL, invalid messages/ids do not play, replay stops the previous chime, and rejected `play()` promises are handled.
- Unsupported API, sync/async request failures with explicit retry, late pending-open cleanup, and stale close events.
- Toolbar popup wiring to the extension-owned dev tester and manifest permission regression coverage.
- Icon rule guard: the popup HTML and PiP view use `material-symbols-rounded` with the Rounded Google Fonts link and no inline SVG.

Small EventTarget/DOM fakes and injected window/view boundaries keep tests dependency-free. These do not emulate user activation enforcement, isolated-world API exposure, CSP, layout, browser size clamping, always-on-top behavior, real audio output, or background/minimized execution. Removed NEW_POLL worker sender tests belonged to the deleted receiver; active worker-origin/navigation sender validation remains covered.

## Build inspection

After CSS sizing changes, check the popup, tester, PiP, and monitoring control at default and increased browser font sizes and narrow viewports. Static lengths use `rem`; verify text wrapping, focus outlines, and control visibility. The shadow control inherits the host document root size. The preview must still match the actual PiP content viewport in CSS pixels.

Confirm `dist/shared/brand-colors.css` exists for popup/tester stylesheet imports. After palette edits, rebuild and reload; check the popup, inline preview, real PiP, and on-page monitoring button for consistent colors and legible focus/disabled states.

After building, dist must contain manifest.json, content.js, background.js, assets/inoti-logo.png, assets/sounds/default-chime.wav, popup/{popup.html,popup.css,popup.js}, dev-testing/{index.html,dev-testing.css,dev-testing.js}, and offscreen/{offscreen.html,offscreen.js}. Verify no legacy alert-window HTML/JS/CSS or generation scripts remain, including when building over an old dist. The first stage clears output and copies the whole `assets/sounds/` directory. Verify only webNavigation, storage, and offscreen permissions, exact student-site content match, minimum_chrome_version 123, the toolbar popup includes the pulse and sound preferences and links to the extension-owned dev tester, and no remote scripts (icon fonts load over a Google Fonts stylesheet link, not a script). PiP and popup icons load that stylesheet and font; sound uses only the bundled local asset. Source and bundles must contain no Chrome window/native-notification alert path. dist remains ignored and untracked.

## Hot reload smoke check

Run `npm run dev` and open the local tester. Switch the inline preview to a question, open real PiP, and edit `src/content/pip-view.css`: both views should update styles without resetting their state. Edit tester CSS to check its live styling. HTML/TypeScript changes should reload the page; reopen PiP with a click. After stopping the server, confirm `npm run check` still builds the standalone extension. Localhost testing does not establish live iClicker compatibility.

## Development tester

Change `PIP_DIMENSIONS_REM` in `src/shared/pip-dimensions.ts` to size the real PiP request and the initial inline preview in rem. Each user-started request converts the rem footprint using the opener root font size; verify 288 x 128 CSS pixels at 16px and 360 x 160 at 20px before browser clamping. Font changes do not resize an already-open PiP. Rebuild, reload the extension, and refresh the tester after editing. After **Open PiP**, verify the preview matches the actual PiP content viewport, including Chrome's size clamping, and follows manual window resizing. Closing PiP detaches the resize listener and retains the last preview size; reopening synchronizes again. The preview does not reproduce Chrome's title bar or window frame.

Both surfaces render `src/content/pip-view.ts` directly for markup, text, and idle/question rendering, with styles imported from `src/content/pip-view.css`. Edit `.question-title-text` or `.detection-time-text` in that stylesheet to style the named text spans; no separate tester view needs updating. The toolbar popup uses `src/popup/popup.css`, including `.popup-title-text`. The preview wrapper scrolls on narrow screens instead of shrinking the PiP viewport and adds no border or rounding to the view. **Open PiP** also uses the production controller for real window lifecycle testing; the inline preview's simulation buttons are not a browser lifecycle emulation.

After building and reloading the unpacked extension, click the iNoti toolbar icon and choose **Open Dev Tester**. The tester must work without an iClicker tab. Confirm the inline preview can switch between idle and New iClicker Question, the displayed time updates locally, the active alert's **Go to Question** and **Question Answered** controls behave in both the preview and the real PiP, **Open PiP** opens the shared PiP view from the click, **End Question** shows Question Ended and the local end time, stops the elapsed timer, and removes pulsing, and **Close PiP** closes it. In the Monitoring panel section, confirm the embedded on-page control renders in a mock page and that **Not monitoring**, **Monitoring**, **Opening**, **Unsupported**, and **Failed** show the matching labels and disabled states, and that the panel also follows the real controller as **Open PiP** and **Close PiP** are used. In the Sound section, confirm the checkbox loads the saved `soundEnabled` value and that changing it writes the same local preference the popup and worker use; confirm the **Notification sound** dropdown lists Default Chime, Soft Bell, Bright Ping, and Calm Echo, reflects the saved `selectedSoundId`, and writes a registered id only. With sound on, **Test sound** should produce one audible chime of the selected sound through the real worker → offscreen path, and with sound off it should log `sound disabled` in the worker without creating the offscreen document. Confirm the on-page event log and DevTools `[iNoti][dev]`/`[iNoti][worker]` output contain only generic state/capability information. Clearing the log affects only the tester page.

The tester is not evidence that route detection, background delivery, reconnect behavior, or authenticated iClicker compatibility works. Those still require the real-browser matrix below. Optional local console captures belong under `dev-testing/logs/`, which is intentionally ignored by Git.

## Go to Question checks

`npm run check` passed lint, type-check, all 98 tests, and all four production builds. Browser inventory returned no connected browsers or apps, so real focus, retained PiP visibility, keyboard, and layout checks were not run.

From a real PiP active alert, switch to another tab/application and click Go to Question (also test Tab then Enter/Space). Verify the original iClicker tab gains focus, PiP stays open, and the timer and monitoring continue without reset. Idle and ended screens must hide the button. Repeat on the next question and after stopping/restarting monitoring. In the development tester, the button focuses the tester opener only. Check button visibility, wrapping, and keyboard focus at the clamped window size and increased font sizes. Chrome 123+ is required. Automated callback/visibility tests cannot establish real browser focus or cross-application behavior.

## Question Answered checks

On a real PiP active alert, click Question Answered (also test Tab then Enter/Space). Verify both action buttons sit below the alert content without overlapping it in the clamped window, PiP returns to the idle monitoring screen, the elapsed timer and pulse stop, and monitoring stays started with the control still reading Monitoring. Confirm the later route change to waiting/results does not replace the idle screen with Question Ended, and that the next detected question alerts again in the same window. Idle and ended screens must hide the button, and a stale click after close or stop must do nothing. In the development tester, Question Answered resets both the inline preview and the real PiP. Automated view/controller tests cover visibility and the idle transition; layout, keyboard, and live iClicker behavior remain browser checks.

`npm run check` passed lint, type-check, all 102 tests, and all four production builds. Layout, keyboard, and live behavior were not run because no connected browser or authenticated class session is available.

## Question ended screen checks

In the tester, open PiP, choose New Question, then End Question. Verify the neutral background, Question Ended title, local Ended at time, and hidden elapsed timer. Confirm the ended screen returns to the waiting screen about two minutes later (a fresh `End Question` should idle the real window then the inline preview), and that a new question before the timeout cancels it. In a controlled class, check both active-to-waiting and active-to-results routes. Repeated end reports must retain the first end time and must not restart the timeout. The next question must restore the active title, pulse preference, and fresh elapsed timer in the same window. Initial waiting/closed routes and opening the window on an already-active question must not invent an ended alert. Leaving the class ends monitoring; closing the window does not. Automated controller tests cover the timeout and its cancellation with fake timers.

`npm run check` passed lint, type-check, all 96 tests, and all four builds. Automated controller, route integration, and view tests cover ended transitions and cleanup. Live iClicker and visual browser verification remain pending; no connected browser or authenticated class session is available in this session.

## Elapsed timer checks

`npm run check` passed lint, type-check, all 94 tests, and all four builds for this update. The concurrent 10 x 10 rem footprint was preserved and its size expectations updated. No connected browser or controlled live class was available for visual/live verification.

Automated tests cover immediate 0:00, delayed ticks, minute/hour formatting, reset on the next question, replacement of an existing interval, cleanup on idle/pagehide, and nonnegative elapsed time. In Chrome, simulate a question in the tester and confirm preview/PiP count up, stay readable at the clamped window size, and return to idle without a timer. Toggle pulsing while counting and verify no timer reset. Close/reopen PiP and verify the next alert starts fresh. Background the opener and verify the display catches up after delayed execution. A controlled live class is still needed to verify actual detection timing.

## Alert background manual checks

Reload the built extension and refresh the tester/student pages after the new storage permission is recognized. In the extension-owned tester, open PiP and simulate a question: both views should pulse a soft lavender circle that grows outward from the middle of the question title over the pink alert surface. Toggle **Pulse new-question background** off in the toolbar popup while the question remains active: both views should immediately become solid soft pink without changing the detection time. Re-enable it, return to idle, and simulate the next question. Idle must never pulse. Close/reopen the popup and PiP and restart Chrome to check persistence. Enable OS reduced motion and confirm active alerts stay solid even with the toggle on. Check readability throughout the animation. The localhost tester uses the enabled default because it has no extension storage; test popup synchronization using the extension-owned tester.

Automated preference tests cover defaults, malformed values, local live updates, stale initial reads, disposal, read/write failure, popup save rollback, and active/idle rendering. Browser animation, reduced-motion behavior, persistence across Chrome restarts, and live iClicker delivery still require the manual checks.

## Sound preference checks

Open the toolbar popup and confirm **Sound** lists Default Chime, Soft Bell, Bright Ping, and Calm Echo, with Default Chime selected on a fresh profile. Pick each option and click **Preview sound** to confirm the selected chime previews; confirm the preview also plays while **Play sound** is off (it is an explicit user action), then close and reopen the popup and confirm the selection persists. In the extension-owned tester, set the same dropdown and click **Test sound** after each change; the selected chime should play once through the offscreen document while sound is on. Tamper with `chrome.storage.local` (`selectedSoundId`) to an unknown value in DevTools and confirm the next load falls back to Default Chime rather than requesting a missing file. Turn **Sound notification** off and confirm **Test sound** logs `sound disabled` in the worker with no offscreen document created, then re-enable and confirm the next question or **Test sound** plays again. Actual audible output still requires a machine with working audio and is not established by the automated tests.

## Real unpacked Chrome manual matrix

Build, reload the extension in chrome://extensions, refresh the student tab, and record build revision, date, desktop Chrome version, OS, display scaling, and actual results. Use an authorized authenticated class/instructor session; synthetic route changes are not evidence of live poll compatibility. Never submit answers or retain identifiers for this test.

All rows below are **pending real-browser verification**.

| Scenario | Expected result |
| --- | --- |
| Enable **Play sound**, join a supported class, leave the window closed | Monitoring runs automatically; panel reads `iNoti is monitoring this class. Open the notification window for visual alerts.` |
| Authorized instructor opens a new poll from waiting with the window closed | Exactly one sound plays; no window opens; no page navigation or fallback alert |
| Open the window, then a new poll from waiting | Exactly one sound and one visual alert with the correct local detection time |
| Duplicate hashchange + webNavigation reports for one transition | One sound and one alert update total |
| Stay on the same active poll | No repeat sound, alert, window, resize, or timer dismissal |
| Poll ends/submitted/results route or waiting | No sound; an open window shows Question Ended with its local end-detection time, then returns to waiting about two minutes later |
| Next closed/waiting to active transition | Fresh sound and, if open, a fresh alert in the same window |
| Initial load/refresh on an active poll | No sound and no fake new question; the panel offers Open notification window |
| Open the window during an already-active question | No sound replay and no retroactive alert; the window starts idle |
| Close the window (panel or title bar) | Only the window closes; monitoring continues; next new question still sounds |
| Reopen the window | No sound merely because it opened |
| Disable **Play sound** while monitoring stays active | No sound; monitoring and visual alerts continue; no offscreen audio document is created |
| Re-enable **Play sound** | The next new question plays a sound again |
| Unsupported/home/quiz route | No monitoring panel, question alert, or sound |
| Leave supported session/change class | Old window closes; the old session stops alerting; unsupported pages hide the control |
| Navigate away while the window is opening | Late opened window is closed |
| Full refresh/close opener | Window closes; monitoring resumes automatically for a supported route after the page loads |
| Back/forward cache restoration | Fresh route baseline, no duplicate active alert or sound |
| Missing API (controlled unsupported environment) | Clear unavailable window state; monitoring and sound continue without a visual window |
| Request denied/fails | Visible retry state; another explicit click can retry |
| Extension/worker restart | Worker listeners return; offscreen audio is recreated on demand when the next sound is requested |
| Switch Chrome tabs with iClicker in the background, then a new poll | Record whether exactly one sound plays; PiP (if open) remains visible |
| Minimize Chrome, then a new poll | Record whether exactly one sound plays through the backgrounded tab |
| Use another desktop application, then a new poll | Record whether exactly one sound plays |
| Memory Saver, background freeze/discard, reconnect | Record missed updates/closure and whether a frozen/discarded page still alerts; no reliability guarantee or discard override |

Also test Chrome Memory Saver/discard separately: a discarded or fully frozen iClicker page may not run the content script at all and must not be conflated with an ordinary background tab.

Check both PiP states at normal and increased display scaling, keyboard focus, live-region announcement, and site CSP/style compatibility. PiP is a same-origin web-platform window accessed from the isolated content script: confirm requestWindow and DOM access in this exact extension context. Do not substitute a console call in the main world for this check.

## Diagnosis

Enable Info logs in student-page, service-worker, and offscreen DevTools, filtered by [iNoti]. Expected stages: content loaded/baseline; worker history/fragment observed -> forwarding -> delivered; content navigation update with normalized states and eligibility; on a new question `new question accepted` -> `sound requested` -> worker `new question accepted by content` -> `sound playback requested` (or `sound disabled`), with the offscreen document logging playback; panel control shown -> Open notification window -> PiP opened -> idle -> (if open) question active -> idle -> closed, while monitoring stays active throughout.

A route candidate that is not a same-class waiting/closed-to-active transition intentionally produces no alert or sound. If the window fails to open, inspect the safe failure category and browser API availability/user activation. If sound is missing, check the popup `soundEnabled` value, worker `sound disabled`/`sound preference read failed`, offscreen creation, and `audio.play()` rejection. If a route update is missing, check permission, exact top-frame origin, originating document target, and receiver acknowledgement. A successful mock, build, or forwarding acknowledgement does not establish visual rendering or audible output. No arbitrary exceptions, URLs, IDs, question text, or answers belong in shared evidence. DEBUG in the shared logger silences diagnostics on rebuild.

## Verification status

Monitoring/PiP separation + sound: `npm run check` passed lint, type-check, 132 tests across twelve files, and all five production builds. Artifact inspection confirmed `dist/offscreen/offscreen.{html,js}`, `dist/assets/sounds/default-chime.wav`, the three-permission manifest, and no source maps, generation scripts, or legacy alert delivery in source/bundles. Background/minimized audio, actual playback, Memory Saver/discard, and authenticated iClicker detection were not run: the environment has no connected browser or authenticated class session, and the development tester does not produce real audio output evidence. The intended background/minimized behavior has not been verified and must not be documented as reliable until it is.

Pulse preference update: `npm run check` passed lint, type-check, all 92 tests across nine files, and all four production builds. Initial sandbox execution hit Vite `spawn EPERM`; the approved run with process access passed. Browser inventory exposed no connected browsers or native apps, so animation, reduced-motion, real popup/PiP synchronization, and authenticated iClicker checks were not run.

The migration has local automated verification on Windows with Node 22.17.1 and npm 11.12.1. On 2026-09-23, npm run lint, npm run typecheck, npm test (74 tests across five files), npm run build, and npm run check all passed. Artifact inspection confirmed the exact four-file package, narrow permissions/site match, Chrome 123 minimum, and no legacy alert delivery in source/bundles. Relative documentation links and whitespace were checked. Initial sandboxed Vite execution hit spawn EPERM; validation was rerun with the required process access. A nested local .kilo worktree initially confused lint discovery; configuration now isolates this checkout without changing that worktree.

No real Chrome/iClicker PiP matrix rows were run in that implementation session. No authenticated, controlled instructor/student poll session was supplied for live transition verification. Cross-application/minimize visibility, actual content-script API access, layout, and background behavior remain manual checks. Earlier owner evidence established injection/worker startup but missed hashchange navigation on a prior build; it does not verify this migration. The development tester is also not a substitute for these checks. The current dev-tester/popup change still requires a fresh `npm run check`, unpacked-build inspection, and browser smoke test after this commit; hosted CI should be checked separately.

## Deferred work

Volume control, other persistent settings, quiz support, cross-tab identity/deduplication, history, stacking, progress, auto-dismiss, positioning, session storage, telemetry, polling, DOM observation, and network interception remain absent. Recovery, background/minimized audio verification, and full MVP release evidence remain future work.

## Compact PiP redesign

Check idle, active, and ended at the requested 18rem by 8rem viewport, Chrome-clamped sizes, manually narrowed windows, and increased fonts. Confirm the status badge, Google Fonts clock/hourglass symbols, timing row, and side-by-side Go to Question/Answered buttons fit without clipping. Check keyboard focus, pulse on/off and reduced motion, long elapsed times, and local 12/24-hour time formats. Idle and ended retain monitoring guidance with no actions.

Browser layout and live iClicker verification remain pending: the browser inventory for this redesign returned no connected browsers or apps, and no authenticated class session is available.

Redesign automated verification: `npm run check` passed lint, type-check, all 102 tests, and all four builds. The previous SVG assets have since been replaced by a Google Fonts stylesheet link.

Tester controls: click Idle from both active and ended; both views should return to waiting without closing PiP, and the next New Question should work. Toggle Pulse new-question background before/after opening PiP, stop/reopen, and verify both views retain the selection. Reload resets the override to the saved preference (or enabled on localhost). System reduced motion still prevents animation. Automated tester wiring covers idle transitions and pulse propagation; browser verification remains pending.

Google Symbols check: confirm every icon in the app uses the rounded variant `<span class="material-symbols-rounded">icon_name</span>` with no inline SVGs remaining. Inspect the PiP/preview and popup HTML heads for the `Material+Symbols+Rounded` Google Fonts stylesheet link, verify rounded schedule/hourglass glyphs load in both localhost and extension testers and live iClicker PiP, and that the popup renders its blur_circular/volume_up/music_note/expand_more/play_arrow/open_in_new symbols instead of ligature text. Check inherited CSP/network failures, and confirm times, controls, and popup settings remain usable if the font is unavailable. No browser is connected to verify remote font rendering in this session.

Monitoring panel layout: verify a 15rem wide by 10rem tall panel vertically centered 5rem from the right edge on a supported iClicker route. Confirm the brand row is pinned to the top, the button is anchored to the bottom, and the explanation centers vertically in the remaining space across all copy lengths. Check Open/Close notification window, opening, retry, unsupported, and unmonitored labels and their matching explanation text, keyboard focus, and increased root font sizes. Confirm the button remains visible while the window is open and reads Close notification window. Automated tests cover each explanation and its `data-state`; confirm the copy carries no raw errors or page data. At widths at or below 21.5rem, confirm the 0.75rem right inset keeps it visible. Only the panel should intercept clicks. This placement still needs browser verification; no connected browser or authenticated session is available.

Verify the monitoring copy states that iNoti is monitoring independently and that the button only opens/closes the visual window. Route detection and the requirement to open the window for visual notifications are unchanged; sound does not require the window.

## Popup appearance

Check the Alert Preferences popup for the lavender card layout, one-sentence descriptions under Pulse background and Play sound, a Sound dropdown with no helper paragraph, and stacked Preview sound / Dev tester buttons. Verify keyboard focus, switch toggling with Space, saved values after reopening, all four sound choices, and preference failure messages. Confirm the compact layout fits without clipping at normal and increased display scaling. Visual browser verification is pending: no connected browser or native app was available during this change.

Popup restyle automated verification: `npm run check` passed lint, type-check, all 145 tests across 13 files, and all five production builds. The initial sandbox run hit Vite's process-spawn restriction; the run with process access passed.
