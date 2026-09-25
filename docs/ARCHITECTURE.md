# Architecture

## Implemented Phase 1

A TypeScript/Vite MV3 extension with no framework or runtime dependencies. Route parsing is unchanged. Monitoring is page-owned and automatic: while a supported class route is observed, the page keeps evaluating new questions whether or not the optional notification window is open.

| Component | Responsibility |
| --- | --- |
| `manifest.json` | Chrome 123 minimum, exact student-site match, webNavigation/storage/offscreen permissions, classic worker, local icon |
| `src/content/detector.ts` | Pure route parser and same-class transition decision |
| `src/content/monitor.ts` | Per-page route baseline, shared hashchange/navigation evaluation, monitoring lifecycle, and the single new-question acceptance point |
| `src/content/monitoring-control.ts` | Namespaced 15rem wide by 10rem tall panel in a closed shadow root; reports monitoring plus window state and toggles only the window |
| `src/content/pip-controller.ts` | Optional-window API detection, user-gesture request, pending-open guard, PiP reference, window state, close and cleanup. It never decides monitoring |
| `src/content/pip-view.ts` and `pip-view.css` | Generic idle/alert DOM and local time rendering, with a separate stylesheet bundled for injection into the dynamic PiP document |
| `src/shared/new-question.ts` | The one accepted-new-question fan-out to sound and the optional PiP window |
| `src/shared/messages.ts` | Validated NAVIGATION_CHANGED, NEW_QUESTION_DETECTED, and PLAY_SOUND contracts |
| `src/shared/sounds.ts` | Central sound registry; the only source of sound file paths and ids |
| `src/shared/sound-preference.ts` | Local `soundEnabled`/`selectedSoundId` schema and lenient fallback |
| `src/shared/sound-request.ts` | Content/tester → worker sound request; sends no path or user data |
| `src/shared/logging.ts` | Privacy-safe content/worker/pip/offscreen diagnostics |
| `src/background/service-worker.ts` | Filtered navigation forwarding plus new-question sound delivery through the offscreen document; no session state |
| `src/offscreen/offscreen.ts` | Plays a validated registered sound id through `chrome.runtime.getURL` |
| `src/popup/popup.ts` | Alert-animation and sound preferences, plus a link to the extension-owned tester tab |
| `src/dev-testing/dev-testing.ts` | Development-only PiP state simulator and local event log; reuses the production PiP controller/view and the production sound request |

## Event flow and lifecycle

1. At document_start the content script reads a route baseline. Initial active routes never alert. Monitoring is active whenever the current route is a supported class and the page is not suspended; the control mounts after body exists (DOMContentLoaded if needed), only on supported class routes.
2. The worker synchronously registers history/fragment listeners with a student-host filter. Before logging or forwarding it checks top frame, tab target, and exact HTTPS student origin. It forwards a supported hash or an empty unsupported marker to the originating document when available. No full URLs, arbitrary route content, or history are retained.
3. The content receiver validates the contract and worker sender. It shares one evaluation function with hashchange event URLs. Previous state advances before rendering, preserving consecutive duplicate suppression in either source order.
4. The panel button opens or closes only the optional window. `open()` calls requestWindow before its first await; only this user action opens PiP, and an in-flight guard suppresses repeated clicks. Successful initialization begins idle; events before completion are not replayed. Closing the window (via the title bar, the panel, pagehide, a class change, or the unsupported route) never stops monitoring.
5. The single acceptance point is a same-class WAITING/QUESTION_CLOSED to QUESTION_ACTIVE transition (`isNewPoll`). `createNewQuestionAlerts` fans it out exactly once: `requestNewQuestionSound()` asks the worker for the configured sound, and `controller.question(detectedAt)` updates the window only if it is open. Repeated active events, duplicate hashchange/webNavigation reports, waiting/closed transitions, and initial baselines never reach the acceptance point.
6. With the window open, the accepted question changes it to the alert with Date.now(); closed/results/waiting after an alerted question changes the same window to Question Ended with the local end-detection time. Duplicate end reports retain the original time. The ended screen is transient: a fixed two-minute timer (`QUESTION_END_IDLE_MS`) returns the same window to idle, and the timer is cleared by a new question, a manual answer, an explicit idle, or a close. A manual answer likewise returns the window to idle without affecting monitoring.
7. Leaving the class/session, changing class, an unsupported route, or opener pagehide closes the window and clears references. A generation token closes stale pending opens after session exit; a late old-window close cannot affect a newer window. BFCache restoration re-establishes the route baseline without reopening the window. Unsupported Document PiP or an opening failure shows a clear panel state while monitoring and sound continue; failure can be retried only by another click.

The toolbar popup saves the alert-animation and sound preferences and links to the development-only `dev-testing/` extension page. The popup opens `dev-testing/index.html`; that page can render the shared PiP view in an inline preview, open the real Document PiP surface from a user click, and manually drive idle/question/close states. **New Question** runs the real `createNewQuestionAlerts` path, so it requests the production sound and updates the real window if open. Its **Sound** section reflects and writes the saved `soundEnabled` preference and offers a **Test sound** button that sends the production `NEW_QUESTION_DETECTED` request, exercising the worker → offscreen path (including the disabled skip) with no fake player. The tester also mounts the real `monitoring-control.ts` control inside an iframe mock page, mirrors the window/monitoring state into it, and offers forced-state buttons for the unobserved unmonitored/opening/unsupported/failed states. Once opened, the preview follows the actual PiP content viewport via a development-only resize listener, removed when the window closes. It never sends synthetic route events into the content script, so it cannot change or falsely validate iClicker detection.

Monitoring is route-derived: supported class route + live page = monitoring. The PiP window has its own presentation state CLOSED -> OPEN_IDLE -> QUESTION_ACTIVE -> QUESTION_ENDED, with any close returning to CLOSED. The two are independent: the window can be CLOSED while monitoring is active, and a question accepted in that state still requests a sound without opening a window.

## Sound alerts

Sound is enabled by default (`soundEnabled`) and is requested after the same acceptance decision that feeds the window, so there is no separate sound dedupe. The content script or dev tester sends a generic `NEW_QUESTION_DETECTED` message; the worker reads the local preference, resolves the registered `selectedSoundId` (falling back to `DEFAULT_SOUND_ID`), and ensures the offscreen audio document exists. Only then does it send `PLAY_SOUND` with a registered id. The offscreen document resolves the file with `chrome.runtime.getURL`, stops any previous chime, and creates a fresh audio element per alert. No path, question text, route, class id, or student data crosses a message boundary, and no external audio is loaded. Disabling sound skips offscreen creation entirely while monitoring and the visual window keep working. Four sounds are bundled and selectable: the popup shows a **Sound** dropdown (the tester labels it **Notification sound**) built from `SOUND_OPTIONS` and writes the registered `selectedSoundId`; malformed or unknown stored values fall back to `DEFAULT_SOUND_ID`, so storage can never become an audio URL. The popup's **Preview sound** button sends a generic `PREVIEW_SOUND` request; because it is an explicit user action, the worker plays the selected sound through the same offscreen path even when `soundEnabled` is off. The tester's **Test sound** button instead sends the production `NEW_QUESTION_DETECTED` request, so it still honors the enabled preference and exercises the real gated path. Adding another sound only needs the file under `assets/sounds/` plus one registry entry in `src/shared/sounds.ts` — playback, worker, and message code do not change.

## Alert appearance preference

`src/shared/alert-preference.ts` owns the Chrome storage boundary for the boolean `pulseAlerts` preference (default true). `configured-pip-view.ts` subscribes each PiP/preview view and detaches on pagehide. A live storage change wins over a pending initial read; disposal ignores late reads. Views remain solid until the preference loads, and on read failure. The localhost tester has no extension storage and uses the enabled default. The extension-owned tester initially follows the saved setting; its pulse checkbox can override both tester views for the page session without saving. The tester Idle button resets the preview and open controller to idle from either active or ended.

Only active questions receive the pink alert surface. On a 1.75-second CSS cycle a soft lavender circle grows outward from the middle of the question title over that surface and fades as it expands, using shared palette colors. The pulse is clipped to the window so its overflow never adds scrollbars or changes the PiP footprint. Disabling the preference or enabling system reduced motion leaves a solid soft pink alert. Idle rendering removes the active state. The pulse uses no JavaScript animation timers, detection changes, or worker state.

## Return to the question

The active alert shows Go to Question outside the status live region. `configured-pip-view.ts` supplies an opener-owned callback that synchronously calls `window.focus()` from the button click. Chrome 123+ supports focusing the Document PiP opener. The action does not close PiP, navigate, reset the timer, or change monitoring state. Idle and ended screens hide the button. The development tester focuses its own opener rather than an iClicker tab. No worker message, tab registry, or extra permission is needed.

## Manual answer

Answered sits beside Go to Question for the active alert only. Its click reaches `pip-controller.ts` through the same opener-owned callback channel, calls `view.idle()`, and moves the controller from MONITORING_QUESTION_ACTIVE to MONITORING_IDLE without stopping monitoring. Treating the manual answer as idle, not ended, keeps the next detected question eligible; the route eventually reaching waiting/results is ignored while idle, so no synthetic ended screen appears. The callback still checks that a question is active and that PiP is open, so a stale click cannot change state after close.

## PiP and build

Static surface styles use `rem` lengths, converted at a default 16px root size, and retain relative viewport/percentage units. The on-page shadow control follows the iClicker document root font size; standalone extension and PiP documents follow their own root. The PiP footprint is defined in rem and converted using the opener root font size at each user-started open. The API receives rounded CSS pixels; measured preview dimensions remain CSS pixels to preserve the exact viewport match.

`assets/inoti-logo.png` is the original shared logo, used for the extension icon, popup, tester header, and extension-page favicons. PiP and the monitoring control import an inline copy through `src/shared/brand-logo.ts`, avoiding web-accessible resources or new permissions. Decorative images accompany existing accessible text labels.

`src/shared/brand-colors.css` is the shared logo-inspired purple/pink color palette, with pale lavender surfaces, purple buttons, and soft pink active alerts. Surface styles use its `--inoti-*` custom properties. Popup and tester styles import the packaged `shared/brand-colors.css`; PiP and monitoring-control styles bundle the same palette for injection into their dynamic document or shadow root. Change palette values there to recolor all consumers, then rebuild and reload.

Request the footprint from `PIP_DIMENSIONS_REM` in `src/shared/pip-dimensions.ts` once. The development preview initially uses those same rem dimensions for its content area. Chrome controls placement, chrome, and size clamping. Idle content is the logo and iNoti; active content adds the question title, local detection time, and elapsed time. The shared view refreshes elapsed time once per second from Date.now() minus the detection timestamp, so delayed ticks catch up instead of drifting. Idle, question end, and PiP pagehide clear the interval; each new alert resets it. The timer uses aria-live=off to avoid announcing every tick. This is a display timer only, not detection polling. No resize calls, screen coordinates, history, auto-dismiss, sound, or stacking. PiP cannot outlive its opener. It is same-origin with the student page, not a separate extension-origin security boundary, so it contains no sensitive data.

Five standalone Vite IIFE builds emit content, worker, toolbar-popup, dev-tester, and offscreen code. The content build clears dist and copies the manifest/icon and the entire `assets/sounds/` directory (so a new registered sound needs no build-config edit); later builds preserve output and copy their local HTML/CSS. Production PiP DOM/CSS is still bundled into content.js; the dev tester bundles the same PiP controller/view code for isolated testing.

```text
dist/
  manifest.json
  content.js
  background.js
  assets/inoti-logo.png
  assets/sounds/default-chime.wav
  popup/
    popup.html
    popup.css
    popup.js
  dev-testing/
    index.html
    dev-testing.css
    dev-testing.js
  offscreen/
    offscreen.html
    offscreen.js
```

## Diagnostics and limits

DEBUG enables `[iNoti][content]`, `[iNoti][worker]`, `[iNoti][pip]`, and `[iNoti][offscreen]` logs. The development tester additionally emits `[iNoti][dev]` events and shows the same safe event summary on-page. Only event names, normalized states, boolean decisions, and safe error categories are logged. No raw routes, IDs, payloads, arbitrary exceptions, or page content.

The worker remains disposable. Failed navigation delivery is not replayed; no DOM observation, polling, history patching, or network interception is added. The offscreen audio document is created on demand and never assumed to persist. Always-on-top is an API property, not evidence of tested background detection or this build's UI compatibility. See [testing](TESTING.md), [privacy](PRIVACY.md), and D013 in [decisions](DECISIONS.md).

The compact PiP requests a 18rem by 8rem landscape viewport (288 by 128 CSS pixels at a 16px opener root), subject to Chrome clamping. Idle, active, and ended states share the brand/status header pinned to the top row, keeping its identity-left, badge-right spacing. The title, timing pair, detail text, and side-by-side actions form one group centered vertically in the space below the brand. Active alerts pair local detection time with elapsed time in one centered row. Google Material Symbols Rounded are loaded through a Google Fonts stylesheet `<link>` in each generated PiP/preview HTML head, subset to schedule and hourglass_empty. Decorative CSS ligatures use that font. The link suppresses the referrer. Icons require access to Google Fonts and permission from the inherited page CSP; there is no bundled SVG fallback. The toolbar popup loads the same font through a static subsetted `<link>` (blur_circular, volume_up, music_note, expand_more, play_arrow, open_in_new) for its setting cards, select chevron, and action buttons, replacing the previous inline SVGs. Every icon glyph in the app is the rounded variant rendered as `<span class="material-symbols-rounded">icon_name</span>`; surface CSS (`popup.css`, `pip-view.css`) sets family and size on that class, and new surfaces must load the Rounded stylesheet link instead of inlining SVG.

The on-page monitoring panel contains branding, a state-specific explanation, and a semantic Open/Close notification window button, sized 15rem by 10rem, vertically centered and inset 5rem from the right viewport edge. Its static positioning and appearance live in `monitoring-control.css`. The brand row stays pinned at the top, the button is anchored to the bottom, and the explanation fills and centers in the remaining space. The button toggles only the optional window: while the window is open it reads Close notification window, and closing it leaves monitoring active. The explanation combines the two independent concerns: with the window closed it reads "iNoti is monitoring this class. Open the notification window for visual alerts."; with the window open it reads "iNoti is monitoring this class. Visual alerts are open."; unmonitored, opening, unsupported, and failed states have their own normalized copy. A new question does not change the panel copy; the window carries the per-question alert. Failure copy never surfaces raw errors, routes, question content, or identifiers, and each state carries a `data-state` hook. On viewports at or below 21.5rem wide, the right inset becomes 0.75rem to keep it reachable. Viewport maximum dimensions constrain it on very small screens.

The on-page button describes opening or closing the visual window, never starting or stopping route detection: monitoring runs whenever a supported class route is observed, independent of the window.
