# Architecture

## Overview

iNoti is a TypeScript/Vite Manifest V3 Chrome extension with no framework or runtime dependencies. It detects new iClicker questions from the student page's URL/hash route, then delivers an offscreen sound alert and, optionally, a Document Picture-in-Picture (PiP) visual alert.

Three ideas shape the design:

1. **The page owns detection and monitoring.** The content script keeps the previous-route baseline in the page, so worker suspension cannot erase it. A supported class route on a live page is monitored automatically, whether or not the PiP window is open.
2. **The service worker is disposable.** It registers listeners synchronously, stores no session state, and recreates the offscreen audio document on demand.
3. **There is one acceptance point.** A single same-class waiting/closed-to-active transition (`isNewPoll`) fans out to sound and the optional window, so the two can never disagree or replay.

## Project structure

```text
iNoti/
├── src/
│   ├── background/
│   │   └── service-worker.ts          # filtered navigation forwarding, sound delivery, popup open
│   ├── content/
│   │   ├── detector.ts                # pure route parser and transition decision
│   │   ├── monitor.ts                 # page-owned baseline, evaluation, acceptance
│   │   ├── pip-controller.ts          # optional Document PiP lifecycle and state
│   │   ├── pip-view.ts                # shared idle/alert/ended DOM view
│   │   ├── pip-view.css               # PiP document styles
│   │   ├── configured-pip-view.ts     # view + opener callbacks (Go to Question / Answered)
│   │   ├── monitoring-control.ts      # on-page shadow-root panel
│   │   └── monitoring-control.css     # panel styles
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts                   # preference binding and actions
│   ├── offscreen/
│   │   ├── offscreen.html
│   │   └── offscreen.ts               # bundled-sound playback
│   ├── dev-testing/
│   │   ├── index.html                 # extension-owned tester page
│   │   ├── dev-testing.ts
│   │   ├── dev-testing.css
│   │   └── preview-size.ts            # development-only viewport sync
│   └── shared/
│       ├── alert-preference.ts        # pulse preference storage boundary
│       ├── sound-preference.ts        # sound on/off + selected id
│       ├── sounds.ts                  # the only source of sound ids/paths
│       ├── sound-request.ts           # content/tester -> worker sound request
│       ├── settings-request.ts        # content -> worker OPEN_SETTINGS request
│       ├── new-question.ts            # the single acceptance fan-out
│       ├── messages.ts                # validated message contracts
│       ├── pip-dimensions.ts          # shared rem footprint
│       ├── logging.ts                 # privacy-safe diagnostics
│       ├── brand-colors.css           # shared palette custom properties
│       ├── brand-logo.ts              # inlined logo for page-owned documents
│       └── dev-settings.ts            # DEV_TESTING_ENABLED gate
├── assets/
│   ├── inoti-logo.png                 # shared full-size logo
│   ├── icon-128.png                   # scaled 128px extension icon
│   └── sounds/                        # six bundled WAV chimes
├── tests/                             # Vitest suites and DOM fakes
├── docs/                              # architecture, detection, testing, privacy, decisions
├── dev-testing/                       # local Git-ignored capture folder
├── manifest.json                      # MV3 manifest, Chrome 123 minimum
├── vite.config.ts                     # five-stage extension packaging
├── vitest.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

The optional `dev-testing/` folder at the repository root holds local, Git-ignored console/screenshot captures; it is separate from the built `src/dev-testing/` tester page. `tooling/` is not tracked.

## Components and responsibilities

| Component                             | Responsibility and interactions                                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json`                       | Chrome 123 minimum, exact student-site match, `webNavigation`/`storage`/`offscreen` permissions, classic worker, local icon.                                            |
| `src/content/detector.ts`             | Pure route parser and same-class transition decision. No Chrome APIs, no DOM.                                                                                          |
| `src/content/monitor.ts`              | Per-page route baseline, shared `hashchange`/message evaluation, monitoring lifecycle, single new-question acceptance point, panel and controller wiring.              |
| `src/content/monitoring-control.ts`   | Namespaced 15rem × 10rem panel in a closed shadow root; reports monitoring and window state; only opens/closes the window.                                             |
| `src/content/pip-controller.ts`       | Optional-window API detection, user-gesture request, pending-open guard, window reference, presentation state, close and cleanup. Never decides monitoring.            |
| `src/content/pip-view.ts`, `pip-view.css`, `configured-pip-view.ts` | Generic idle/alert/ended DOM and local time rendering; `configured-pip-view.ts` adds opener-owned callbacks for Go to Question and Answered. Stylesheet is injected into the dynamic PiP document. |
| `src/shared/new-question.ts`          | The one accepted-new-question fan-out to sound and the optional PiP window.                                                                                              |
| `src/shared/messages.ts`              | Validated `NAVIGATION_CHANGED`, `NEW_QUESTION_DETECTED`, `PREVIEW_SOUND`, `PLAY_SOUND`, and `OPEN_SETTINGS` contracts.                                                  |
| `src/shared/sounds.ts`                | Central sound registry; the only source of sound file paths and ids.                                                                                                    |
| `src/shared/sound-preference.ts`      | Local `soundEnabled`/`selectedSoundId` schema and lenient fallback.                                                                                                     |
| `src/shared/sound-request.ts`         | Content/tester → worker sound request; sends no path or user data.                                                                                                      |
| `src/shared/settings-request.ts`      | Content → worker `OPEN_SETTINGS` request.                                                                                                                               |
| `src/shared/logging.ts`               | Privacy-safe content/worker/pip/offscreen diagnostics.                                                                                                                  |
| `src/background/service-worker.ts`    | Filtered navigation forwarding plus new-question sound delivery through the offscreen document; no session state.                                                      |
| `src/offscreen/offscreen.ts`          | Plays a validated registered sound id through `chrome.runtime.getURL`.                                                                                                  |
| `src/popup/popup.ts`                  | Alert-animation and sound preferences, sound preview, and the development-tester link.                                                                                  |
| `src/dev-testing/dev-testing.ts`      | Development-only PiP state simulator and local event log; reuses the production PiP controller/view and sound request.                                                  |

## Runtime flow

```text
iClicker page (supported class route)
        │  hashchange
        ▼
Content script (src/content/)
  detector.ts  →  monitor.ts  (page-owned previous-route baseline,
                               monitoring lifecycle, single acceptance point)
        ▲                                  │ accepted new question (isNewPoll)
        │ NAVIGATION_CHANGED (route hash)   ▼
Service worker ◄── filtered          new-question.ts fan-out
  webNavigation events              ├──► sound-request.ts ──► Service worker ──► Offscreen player
  (history + fragment)              └──► pip-controller.ts / pip-view.ts ──► optional PiP window

Content script ── OPEN_SETTINGS ──► Service worker ──► chrome.action.openPopup (toolbar popup)
Toolbar popup  ── PREVIEW_SOUND ──► Service worker ──► Offscreen player
Toolbar popup, worker, and PiP views share chrome.storage.local preferences.
```

The worker has no monitoring state: it only forwards route changes and delivers sound. The popup and PiP window read and write the same local preferences.

## State and responsibilities

- **Previous route and monitoring state** live in the content page (`src/content/monitor.ts`) and survive worker suspension. Leaving the class, an unsupported route, or `pagehide` ends monitoring for that page; a supported class route resumes it after a refresh.
- **PiP presentation state** is per page in `src/content/pip-controller.ts`: `CLOSED → OPEN_IDLE → QUESTION_ACTIVE → QUESTION_ENDED`, with any close returning to `CLOSED`. It is independent of monitoring.
- **Preferences** live in `chrome.storage.local`: the booleans `pulseAlerts` and `soundEnabled`, and the registered `selectedSoundId`. They are not synced and contain no session or student data.
- **Worker state** is limited to an in-flight offscreen-creation promise. No registry or session data is kept.

## Event flow and lifecycle

1. At `document_start` the content script reads a route baseline. Initial active routes never alert. Monitoring is active whenever the current route is a supported class and the page is not suspended; the panel mounts after the body exists (DOMContentLoaded if needed), only on supported class routes.
2. The worker synchronously registers history/fragment listeners with a student-host filter. Before logging or forwarding it checks top frame, tab target, and exact HTTPS student origin. It forwards a supported hash or an empty unsupported marker to the originating document when available. No full URLs, arbitrary route content, or history are retained.
3. The content receiver validates the contract and worker sender. It shares one evaluation function with `hashchange` event URLs. Previous state advances before rendering, preserving consecutive duplicate suppression in either source order.
4. The panel button opens or closes only the optional window. `open()` calls `requestWindow` before its first await; only this user action opens PiP, and an in-flight guard suppresses repeated clicks. Successful initialization begins idle; events before completion are not replayed. Closing the window (title bar, pagehide, class change, or unsupported route) never stops monitoring.
5. The single acceptance point is a same-class `WAITING`/`QUESTION_CLOSED` → `QUESTION_ACTIVE` transition (`isNewPoll`). `createNewQuestionAlerts` fans it out exactly once: `requestNewQuestionSound()` asks the worker for the configured sound, and `controller.question(detectedAt)` updates the window only if it is open. Repeated active events, duplicate reports, waiting/closed transitions, and initial baselines never reach the acceptance point.
6. With the window open, the accepted question changes it to the alert with `Date.now()`; closed/results/waiting after an alerted question changes the same window to Question Ended with the local end-detection time. Duplicate end reports retain the original time. The ended screen returns to idle after a fixed two-minute timer (`QUESTION_END_IDLE_MS`), cleared by a new question, a manual answer, an explicit idle, or a close.
7. Leaving the class/session, changing class, an unsupported route, or opener `pagehide` closes the window and clears references. A generation token closes stale pending opens; a late old-window close cannot affect a newer window. BFCache restoration re-establishes the route baseline without reopening the window. Unsupported Document PiP or an opening failure shows a clear panel state while monitoring and sound continue; failure can be retried with another click.

## Sound alerts

Sound is enabled by default (`soundEnabled`) and is requested after the same acceptance decision that feeds the window, so there is no separate sound dedupe. The content script or tester sends a generic `NEW_QUESTION_DETECTED` message; the worker reads the local preference, resolves the registered `selectedSoundId` (falling back to `DEFAULT_SOUND_ID`), and ensures the offscreen audio document exists. Only then does it send `PLAY_SOUND` with a registered id. The offscreen document resolves the file with `chrome.runtime.getURL`, stops any previous chime, and creates a fresh audio element per alert. No path, question text, route, class id, or student data crosses a message boundary, and no external audio is loaded.

Disabling sound skips offscreen creation entirely while monitoring and the visual window keep working. Six sounds ship and are selectable from the popup: Default, Bubble, Locked, Motion detected, Chime, and Aura. Malformed or unknown stored values fall back to `DEFAULT_SOUND_ID`, so storage can never become an audio URL. The popup's **Test sound** button sends a `PREVIEW_SOUND` request that plays the selected sound through the same offscreen path even when `soundEnabled` is off, because it is an explicit user preview. Adding another sound only needs the file under `assets/sounds/` plus one registry entry in `src/shared/sounds.ts` — playback, worker, and message code do not change.

## Alert appearance preference

`src/shared/alert-preference.ts` owns the Chrome storage boundary for the boolean `pulseAlerts` preference (default true). `configured-pip-view.ts` subscribes each PiP/preview view and detaches on `pagehide`. A live storage change wins over a pending initial read; disposal ignores late reads. Views remain solid until the preference loads, and on read failure. The localhost tester has no extension storage and uses the enabled default.

Only active questions receive the pink alert surface. On a 1.75-second CSS cycle a soft lavender circle grows outward from the middle of the question title over that surface and fades as it expands, using shared palette colors. The pulse is clipped to the window so its overflow never adds scrollbars or changes the PiP footprint. Disabling the preference or enabling system reduced motion leaves a solid soft pink alert. The pulse uses no JavaScript animation timers, detection changes, or worker state.

## Go to Question and Answered

The active alert shows **Go to Question** and **Answered** outside the status live region. `configured-pip-view.ts` supplies opener-owned callbacks that run synchronously from the button click.

- **Go to Question** calls `window.focus()` on the opener (Chrome 123+), without closing PiP, navigating, resetting the timer, or changing monitoring state. Idle and ended screens hide it. No worker message, tab registry, or extra permission is needed.
- **Answered** calls `view.idle()` and moves the controller from `MONITORING_QUESTION_ACTIVE` to `MONITORING_IDLE` without stopping monitoring or closing PiP. Treating it as idle rather than ended keeps the next question eligible and avoids a synthetic ended screen from the later route change. The callback ignores stale clicks once no question is active or PiP is closed.

## PiP window and build

Static surface styles use `rem` lengths, converted at a default 16px root size, and retain relative viewport/percentage units. The on-page shadow control follows the iClicker document root font size; standalone extension and PiP documents follow their own root. The PiP footprint is defined in `src/shared/pip-dimensions.ts` and converted using the opener root font size at each user-started open (18rem × 8rem, i.e. 288 × 128 CSS pixels at a 16px root). Chrome controls placement, chrome, and size clamping; there is no automatic resize, positioning, or fallback alert.

The shared view refreshes elapsed time once per second from `Date.now()` minus the detection timestamp, so delayed ticks catch up instead of drifting. Idle, question end, and PiP `pagehide` clear the interval; each new alert resets it. This is a display timer only, not detection polling.

`assets/inoti-logo.png` is the shared logo used for the popup, tester, and extension-page favicons. `assets/icon-128.png` is its transparent 128 × 128 variant used by the manifest for the extension icon. PiP and the monitoring control import an inline copy through `src/shared/brand-logo.ts`, avoiding web-accessible resources or new permissions. `src/shared/brand-colors.css` is the shared palette (pale lavender surfaces, purple buttons, soft pink active alerts) exposed as `--inoti-*` custom properties.

Five standalone Vite IIFE builds emit content, worker, toolbar-popup, dev-tester, and offscreen code. The content build clears `dist/` and copies the manifest, icon, shared palette, and the entire `assets/sounds/` directory; later builds preserve output and copy their local HTML/CSS. Production PiP DOM/CSS is bundled into `content.js`; the dev tester bundles the same PiP controller/view code for isolated testing.

```text
dist/
  manifest.json
  content.js
  background.js
  assets/inoti-logo.png
  assets/icon-128.png
  assets/sounds/{default,bubble,pop,bell,ring,tone}.wav
  shared/brand-colors.css
  popup/{popup.html,popup.css,popup.js}
  dev-testing/{index.html,dev-testing.css,dev-testing.js}
  offscreen/{offscreen.html,offscreen.js}
```

## Diagnostics and limits

`DEBUG` in `src/shared/logging.ts` enables `[iNoti][content]`, `[iNoti][worker]`, `[iNoti][pip]`, and `[iNoti][offscreen]` logs. The development tester additionally emits `[iNoti][dev]` events and shows a safe event summary on-page. Only event names, normalized states, boolean decisions, and safe error categories are logged — no raw routes, IDs, payloads, arbitrary exceptions, or page content.

The worker remains disposable. Failed navigation delivery is not replayed; no DOM observation, polling, history patching, or network interception is used. The offscreen audio document is created on demand and never assumed to persist. Always-on-top is an API property, not evidence of tested background detection or UI compatibility. See [testing](TESTING.md) and [privacy](PRIVACY.md).

The on-page monitoring panel contains branding, a state-specific explanation, and an **Open notification window** button, sized 15rem × 10rem, vertically centered and inset 5rem from the right viewport edge. The brand row stays pinned at the top, the button is anchored to the bottom, and the explanation centers in the remaining space. The button only opens the optional window: while the window is open the button is removed (`hidden`), so the window's title bar is the only close control, and closing it leaves monitoring active. On viewports at or below 21.5rem wide, the right inset becomes 0.75rem.

## Panel settings shortcut

The monitoring brand row aligns the logo/name left and a rounded Settings gear button right (accessible name: Settings; no tooltip). An explicit click sends the payload-free `OPEN_SETTINGS` message to the worker, which validates the extension id, top-frame student origin (or extension tester), and sender window before calling `chrome.action.openPopup` for that window. It first queries live `POPUP` contexts for this popup URL and window; if one still exists (including while the page click is dismissing it), the request is acknowledged without trying to open it again. No cached popup lifecycle state is kept, and the reply reports only success/failure. Chrome 127+ supports this for unpacked extensions; older versions and rejected calls leave an inline message directing the user to the toolbar icon.
