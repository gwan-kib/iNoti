# Architecture

## Implemented Phase 1

A TypeScript/Vite MV3 extension with no framework or runtime dependencies. Route parsing is unchanged. Monitoring is page-owned and requires a user click; a supported route alone does not enable monitoring.

| Component | Responsibility |
| --- | --- |
| `manifest.json` | Chrome 123 minimum, exact student-site match, webNavigation and storage permissions, classic worker, local icon |
| `src/content/detector.ts` | Pure route parser and same-class transition decision |
| `src/content/monitor.ts` | Per-page baseline, shared hashchange/navigation evaluation, monitoring coordination, opener lifecycle |
| `src/content/monitoring-control.ts` | Namespaced floating button in a closed shadow root, status and accessible stop/retry controls |
| `src/content/pip-controller.ts` | API detection, user-gesture request, pending-open guard, PiP reference, state, close and cleanup |
| `src/content/pip-view.ts` and `pip-view.css` | Generic idle/alert DOM and local time rendering, with a separate stylesheet bundled for injection into the dynamic PiP document |
| `src/shared/messages.ts` | Validated NAVIGATION_CHANGED contract |
| `src/shared/logging.ts` | Privacy-safe content/worker/pip diagnostics |
| `src/background/service-worker.ts` | Filtered navigation forwarding only; no session state or alert creation |
| `src/popup/popup.ts` | Alert-animation preference and link to the extension-owned tester tab |
| `src/dev-testing/dev-testing.ts` | Development-only PiP state simulator and local event log; reuses the production PiP controller/view |

## Event flow and lifecycle

1. At document_start the content script reads a baseline. Initial active routes never alert. The control mounts after body exists (DOMContentLoaded if needed), only on supported class routes.
2. The worker synchronously registers history/fragment listeners with a student-host filter. Before logging or forwarding it checks top frame, tab target, and exact HTTPS student origin. It forwards a supported hash or an empty unsupported marker to the originating document when available. No full URLs, arbitrary route content, or history are retained.
3. The content receiver validates the contract and worker sender. It shares one evaluation function with hashchange event URLs. Previous state advances before rendering, preserving consecutive duplicate suppression in either source order.
4. The button directly calls the controller's start method, which calls requestWindow before its first await. Only this user action opens PiP. An in-flight guard suppresses repeated clicks. Successful initialization always begins idle; events before completion are not replayed.
5. Same-class WAITING/QUESTION_CLOSED to QUESTION_ACTIVE changes an already-open idle PiP to the alert with Date.now(). Repeated active events do nothing. Closed/results/waiting after an alerted question changes the same window to Question Ended with the local end-detection time. Duplicate end reports retain the original time; initial waiting/closed routes remain idle.
6. PiP pagehide, the active button, leaving supported routes, changing class, or opener pagehide stops monitoring and clears references. A generation token closes stale pending opens after session exit. A late old-window close cannot stop a newer session. BFCache restoration establishes a fresh baseline without reopening PiP.
7. Unsupported API or opening failure leaves monitoring inactive with a clear control state. Failure can be retried only by another click. No worker NEW_POLL contract or notification fallback remains.

The toolbar popup saves the alert-animation preference and links to the development-only `dev-testing/` extension page. The popup opens `dev-testing/index.html`; that page can render the shared PiP view in an inline preview, open the real Document PiP surface from a user click, and manually drive idle/question/stop states. Once opened, the preview follows the actual PiP content viewport via a development-only resize listener, removed when monitoring stops. It never sends synthetic events into the content script or worker, so it cannot change or falsely validate iClicker detection.

Monitoring state is UNMONITORED -> MONITORING_IDLE -> MONITORING_QUESTION_ACTIVE -> MONITORING_QUESTION_ENDED -> MONITORING_QUESTION_ACTIVE, with any session-ending event returning to UNMONITORED. A manual answer returns MONITORING_QUESTION_ACTIVE -> MONITORING_IDLE. Opening is a transient guard, not active monitoring. Detection continues while unmonitored so enabling monitoring does not invent a question transition.

## Alert appearance preference

`src/shared/alert-preference.ts` owns the Chrome storage boundary for the boolean `pulseAlerts` preference (default true). `configured-pip-view.ts` subscribes each PiP/preview view and detaches on pagehide. A live storage change wins over a pending initial read; disposal ignores late reads. Views remain solid until the preference loads, and on read failure. The localhost tester has no extension storage and uses the enabled default. The extension-owned tester follows the saved setting.

Only active questions receive the pink alert surface. On a 2.4-second CSS cycle a soft lavender circle grows outward from the middle of the question title over that surface and fades as it expands, using shared palette colors. The pulse is clipped to the window so its overflow never adds scrollbars or changes the PiP footprint. Disabling the preference or enabling system reduced motion leaves a solid soft pink alert. Idle rendering removes the active state. The pulse uses no JavaScript animation timers, detection changes, or worker state.

## Return to the question

The active alert shows Go to Question outside the status live region. `configured-pip-view.ts` supplies an opener-owned callback that synchronously calls `window.focus()` from the button click. Chrome 123+ supports focusing the Document PiP opener. The action does not close PiP, navigate, reset the timer, or change monitoring state. Idle and ended screens hide the button. The development tester focuses its own opener rather than an iClicker tab. No worker message, tab registry, or extra permission is needed.

## Manual answer

Question Answered sits below Go to Question for the active alert only. Its click reaches `pip-controller.ts` through the same opener-owned callback channel, calls `view.idle()`, and moves the controller from MONITORING_QUESTION_ACTIVE to MONITORING_IDLE without stopping monitoring. Treating the manual answer as idle, not ended, keeps the next detected question eligible; the route eventually reaching waiting/results is ignored while idle, so no synthetic ended screen appears. The callback still checks that a question is active and that PiP is open, so a stale click cannot change state after close.

## PiP and build

Static surface styles use `rem` lengths, converted at a default 16px root size, and retain relative viewport/percentage units. The on-page shadow control follows the iClicker document root font size; standalone extension and PiP documents follow their own root. The PiP footprint is defined in rem and converted using the opener root font size at each user-started open. The API receives rounded CSS pixels; measured preview dimensions remain CSS pixels to preserve the exact viewport match.

`assets/inoti-logo.png` is the original shared logo, used for the extension icon, popup, tester header, and extension-page favicons. PiP and the monitoring control import an inline copy through `src/shared/brand-logo.ts`, avoiding web-accessible resources or new permissions. Decorative images accompany existing accessible text labels.

`src/shared/brand-colors.css` is the shared logo-inspired purple/pink color palette, with pale lavender surfaces, purple buttons, and soft pink active alerts. Surface styles use its `--inoti-*` custom properties. Popup and tester styles import the packaged `shared/brand-colors.css`; PiP and monitoring-control styles bundle the same palette for injection into their dynamic document or shadow root. Change palette values there to recolor all consumers, then rebuild and reload.

Request the footprint from `PIP_DIMENSIONS_REM` in `src/shared/pip-dimensions.ts` once. The development preview initially uses those same rem dimensions for its content area. Chrome controls placement, chrome, and size clamping. Idle content is the logo and iNoti; active content adds the question title, local detection time, and elapsed time. The shared view refreshes elapsed time once per second from Date.now() minus the detection timestamp, so delayed ticks catch up instead of drifting. Idle, question end, and PiP pagehide clear the interval; each new alert resets it. The timer uses aria-live=off to avoid announcing every tick. This is a display timer only, not detection polling. No resize calls, screen coordinates, history, auto-dismiss, sound, or stacking. PiP cannot outlive its opener. It is same-origin with the student page, not a separate extension-origin security boundary, so it contains no sensitive data.

Four standalone Vite IIFE builds emit content, worker, toolbar-popup, and dev-tester code. The content build clears dist and copies the manifest/icon; later builds preserve output and copy their local HTML/CSS. Production PiP DOM/CSS is still bundled into content.js; the dev tester bundles the same PiP controller/view code for isolated testing.

```text
dist/
  manifest.json
  content.js
  background.js
  assets/inoti-logo.png
  popup/
    popup.html
    popup.css
    popup.js
  dev-testing/
    index.html
    dev-testing.css
    dev-testing.js
```

## Diagnostics and limits

DEBUG enables `[iNoti][content]`, `[iNoti][worker]`, and `[iNoti][pip]` logs. The development tester additionally emits `[iNoti][dev]` events and shows the same safe event summary on-page. Only event names, normalized states, boolean decisions, and safe error categories are logged. No raw routes, IDs, payloads, arbitrary exceptions, or page content.

The worker remains disposable. Failed navigation delivery is not replayed; no DOM observation, polling, history patching, or network interception is added. Always-on-top is an API property, not evidence of tested background detection or this build's UI compatibility. See [testing](TESTING.md), [privacy](PRIVACY.md), and D013 in [decisions](DECISIONS.md).
