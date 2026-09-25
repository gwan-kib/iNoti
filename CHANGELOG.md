# Changelog

No version has been released. The development manifest version 0.1.0 is for unpacked loading.

## Unreleased

### Changed

- Left-aligned the popup brand in a header row and added GitHub repository and LinkedIn profile link buttons (brand-logo SVGs) to its right.

- Renamed the five non-default sound choices to Bubble, Locked, Motion detected, Chime, and Aura in popup order. Their stored ids and audio files remain the same.

- Switched Default to the former Start tone and renamed the remaining choices with sound-based names: Bubble, Pop, Bell, Tone, and Ring. Previous Start, Success, and Timer selections resolve to the matching sounds.

- Replaced the four bundled chimes with six recently downloaded WAV alerts: Default, Bubble, Pop, Bell, Tone, and Ring. Previously saved sound selections fall back to Default.

- Removed the monitoring panel's Close notification window action; while the window is open the panel hides its button entirely, so the window's title bar is the only close control.

- Added `DEV_TESTING_ENABLED` in `src/shared/dev-settings.ts` to gate the toolbar popup's **Dev tester** button; when it is `false` the button is removed from the DOM instead of hidden.

- Replaced the toolbar popup's on/off switches with plain checkboxes; the pulse and sound preferences both default to on.

- Removed the toolbar popup's "Alert Preferences" title, centered the brand row, and centered the Preview sound / Dev tester buttons as a group.

- Added a close button to dismiss settings failure guidance; the Settings gear has no tooltip.

- Replaced the monitoring panel's Settings text with the rounded settings symbol, retaining a Settings accessible label without a tooltip.

- Settings now checks for an existing toolbar popup before requesting another, avoiding a redundant open request during dismissal; failure guidance no longer assumes an older Chrome version.

- Added a right-aligned Settings badge to the monitoring panel that opens the toolbar popup on Chrome 127+, with toolbar-icon guidance if unavailable.

- Restyled the toolbar popup with lavender preference cards, icon tiles, switches, short toggle descriptions, and stacked Preview sound / Dev tester buttons; removed the sound-dropdown helper text.

- Monitoring is now page-owned and independent of the notification window: a supported class route is monitored automatically, and closing the window (or its title bar, or the panel) closes only the visual surface instead of stopping monitoring.

- Added sound alerts that play once per genuinely new question even when the notification window is closed, through an MV3 offscreen audio document. Sound is enabled by default and can be turned off in the popup; disabling sound keeps monitoring and visual alerts working and does not create the offscreen document.

- Added local sound preferences (`soundEnabled`, `selectedSoundId`) and a central sound registry with six bundled sounds: Default, Bubble, Pop, Bell, Tone, and Ring under `assets/sounds/`.

- Added a **Notification sound** dropdown to the popup and the dev tester; it writes only registered sound ids and falls back to Default for unknown stored values.

- Added a **Play test sound** button to the popup that previews the selected chime through the same worker → offscreen path, even while sound is turned off.

- The monitoring panel action is now an Open/Close notification window toggle with monitoring-first copy; the button is no longer hidden while the window is open.

- Replaced the toolbar popup's inline SVG icons with the rounded Google Material Symbols variant, loaded through a subsetted Google Fonts stylesheet link like the PiP icons. Every icon in the app now renders as `<span class="material-symbols-rounded">icon_name</span>`.

- The Question ended screen now returns the notification window to its waiting state about two minutes after the question ends; a new question, a manual answer, or closing the window cancels that timeout.

- Removed the monitoring panel's question-active state; a new question no longer changes the panel copy, which stays on the monitoring message while the notification window carries the alert.

- The monitoring panel now pins the brand row to the top, anchors the button to the bottom, and centers the explanation in the remaining space.

- Renamed the monitoring panel action to Open/Close notification window and updated its explanations and tooltips to say notification window instead of Picture-in-Picture.

- The monitoring panel explanation reflects the current state (monitoring, opening, unsupported, failed) via a `data-state` hook; failure copy stays a normalized category with no raw errors.

- Added a keep-iClicker-open reminder to the panel and relabeled its action.

- Changed the on-page monitoring control to a 15rem wide by 10rem tall panel, vertically centered and 5rem from the right edge, with a narrow-screen inset adjustment.

- Updated the shared logo across extension surfaces with the latest MediBang PNG export.

- Redesigned PiP as a compact landscape card across idle, active, and ended states, with status badges, Google Material Symbols Rounded loaded through a Google Fonts stylesheet link, a single timing row, and side-by-side Go to Question/Answered actions. Requested height is now 8rem instead of 15rem; Chrome controls final size.

- Matched the app to the logo with a purple/pink palette across the popup, PiP, monitoring control, and dev tester. Active alerts pulse a soft lavender circle that grows outward from the middle of the question title over the pink alert surface.

- Converted static CSS pixel lengths to rem units so typography and spacing follow the root font size. The requested PiP footprint also scales from rem at each user-started open.

- Applied the iNoti logo to the extension icon, popup, tester, PiP, and monitoring control.

- Replaced the focused Chrome popup alert with user-started Document PiP monitoring. One window switches between minimal idle status and a new-question alert with local detection time.
- Closing PiP, leaving the class, or destroying the opener stops monitoring. Refresh requires a new click. Unsupported API and opening failures are shown on the page.
- Removed the standalone alert page/assets, third build, NEW_POLL delivery contract, and obsolete popup tests. Added monitoring/PiP lifecycle coverage and a real-browser manual matrix.
- Declared desktop Chrome 116 minimum; retained only webNavigation permission and exact student-site access.

### Added

- `npm run dev` now hot-updates the monitoring-panel CSS in place and serves a live **Popup preview** frame from `src/popup/`, so popup CSS/HTML/script edits update without a rebuild. Development-server only; production output is unchanged.

- Bundled `assets/sounds/default.wav` with a build step that copies the whole sounds directory to `dist/assets/sounds/`, an `offscreen/` audio document build, and the `offscreen` permission.

- Popup **Sound notification** setting alongside the pulse preference; it persists locally and defaults to on, with a **Notification sound** selector for the six bundled sounds.

- Dev tester Sound section that reflects and writes the saved `soundEnabled` preference and has a **Test sound** button exercising the real worker → offscreen playback path, including the disabled skip.

- Dev tester Monitoring panel section that previews the real on-page control in a mock page and forces each of its states, while mirroring the live monitoring/window status.

- Dev tester Idle button and session-only pulse toggle, applied to the inline preview and open PiP.

- Active-alert Question Answered button below Go to Question returns PiP to its idle monitoring screen without stopping monitoring, so the next detected question still alerts.

- Active-alert Go to Question button focuses the existing iClicker tab without closing PiP or resetting monitoring. Chrome 123+ is now required for opener focusing; no permission added.

- Question Ended screen with the local end-detection time, shown after an active alert closes and retained until the next question or monitoring stops.

- Elapsed time since question detection in PiP and the shared dev preview, updated each second and cleared on idle/close.

- Gentle green pulsing for active-question PiP alerts, with a popup toggle for a solid green background and automatic reduced-motion support. The storage permission saves only this local preference; open PiP and extension tester views update immediately.

- Local hot-reloading UI tester via `npm run dev`, including live PiP stylesheet updates.

- Development-only toolbar popup and extension-owned dev tester for manually previewing idle/question PiP states without an iClicker class. The tester includes an on-page safe event log and a Git-ignored local log-capture folder.
- Route-based detection with initial-active baseline and consecutive duplicate suppression across hashchange and filtered webNavigation history/fragment events.
- Privacy-safe content, worker, and PiP diagnostics; no question/answer content, telemetry, or persistent state.
- Project documentation, local checks, and CI configuration.

Real Chrome/iClicker validation of PiP and audible sound remains pending; the development tester does not replace live compatibility checks. Quiz support, cross-tab deduplication, and recovery remain deferred.
