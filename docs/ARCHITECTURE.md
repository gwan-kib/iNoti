# Architecture

## Implemented Phase 1

A TypeScript/Vite MV3 extension with no framework or runtime dependencies. Route parsing is unchanged. Monitoring is page-owned and requires a user click; a supported route alone does not enable monitoring.

| Component | Responsibility |
| --- | --- |
| `manifest.json` | Chrome 116 minimum, exact student-site match, webNavigation permission, classic worker, local icon |
| `src/content/detector.ts` | Pure route parser and same-class transition decision |
| `src/content/monitor.ts` | Per-page baseline, shared hashchange/navigation evaluation, monitoring coordination, opener lifecycle |
| `src/content/monitoring-control.ts` | Namespaced floating button in a closed shadow root, status and accessible stop/retry controls |
| `src/content/pip-controller.ts` | API detection, user-gesture request, pending-open guard, PiP reference, state, close and cleanup |
| `src/content/pip-view.ts` | Dependency-free generic idle/alert DOM and local time rendering |
| `src/shared/messages.ts` | Validated NAVIGATION_CHANGED contract |
| `src/shared/logging.ts` | Privacy-safe content/worker/pip diagnostics |
| `src/background/service-worker.ts` | Filtered navigation forwarding only; no session state or alert creation |
| `src/popup/popup.ts` | Development toolbar popup; opens the extension-owned tester tab only |
| `src/dev-testing/dev-testing.ts` | Development-only PiP state simulator and local event log; reuses the production PiP controller/view |

## Event flow and lifecycle

1. At document_start the content script reads a baseline. Initial active routes never alert. The control mounts after body exists (DOMContentLoaded if needed), only on supported class routes.
2. The worker synchronously registers history/fragment listeners with a student-host filter. Before logging or forwarding it checks top frame, tab target, and exact HTTPS student origin. It forwards a supported hash or an empty unsupported marker to the originating document when available. No full URLs, arbitrary route content, or history are retained.
3. The content receiver validates the contract and worker sender. It shares one evaluation function with hashchange event URLs. Previous state advances before rendering, preserving consecutive duplicate suppression in either source order.
4. The button directly calls the controller's start method, which calls requestWindow before its first await. Only this user action opens PiP. An in-flight guard suppresses repeated clicks. Successful initialization always begins idle; events before completion are not replayed.
5. Same-class WAITING/QUESTION_CLOSED to QUESTION_ACTIVE changes an already-open idle PiP to the alert with Date.now(). Repeated active events do nothing. Closed/results/waiting returns the same window to idle.
6. PiP pagehide, the active button, leaving supported routes, changing class, or opener pagehide stops monitoring and clears references. A generation token closes stale pending opens after session exit. A late old-window close cannot stop a newer session. BFCache restoration establishes a fresh baseline without reopening PiP.
7. Unsupported API or opening failure leaves monitoring inactive with a clear control state. Failure can be retried only by another click. No worker NEW_POLL contract or notification fallback remains.

The toolbar popup and `dev-testing/` extension page are development tooling, not part of live detection. The popup opens `dev-testing/index.html`; that page can render the shared PiP view in an inline preview, open the real Document PiP surface from a user click, and manually drive idle/question/stop states. Once opened, the preview follows the actual PiP content viewport via a development-only resize listener, removed when monitoring stops. It never sends synthetic events into the content script or worker, so it cannot change or falsely validate iClicker detection.

Monitoring state is UNMONITORED -> MONITORING_IDLE -> MONITORING_QUESTION_ACTIVE -> MONITORING_IDLE, with any session-ending event returning to UNMONITORED. Opening is a transient guard, not active monitoring. Detection continues while unmonitored so enabling monitoring does not invent a question transition.

## PiP and build

Request the footprint from `PIP_DIMENSIONS` in `src/shared/pip-dimensions.ts` once. The development preview uses those same dimensions for its content area. Chrome controls placement, chrome, and size clamping. Idle content is a dot and iNoti; active content adds the question title and local time. No resize calls, screen coordinates, history, auto-dismiss, sound, or stacking. PiP cannot outlive its opener. It is same-origin with the student page, not a separate extension-origin security boundary, so it contains no sensitive data.

Four standalone Vite IIFE builds emit content, worker, toolbar-popup, and dev-tester code. The content build clears dist and copies the manifest/icon; later builds preserve output and copy their local HTML/CSS. Production PiP DOM/CSS is still bundled into content.js; the dev tester bundles the same PiP controller/view code for isolated testing.

```text
dist/
  manifest.json
  content.js
  background.js
  assets/icon-128.png
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
