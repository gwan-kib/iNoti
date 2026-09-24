# Changelog

No version has been released. The development manifest version 0.1.0 is for unpacked loading.

## Unreleased

### Changed

- Matched the app to the logo with a purple/pink palette across the popup, PiP, monitoring control, and dev tester. Active alerts pulse between soft pink and lavender.

- Converted static CSS pixel lengths to rem units so typography and spacing follow the root font size. The requested PiP footprint also scales from rem at each user-started open.

- Applied the iNoti logo to the extension icon, popup, tester, PiP, and monitoring control.

- Replaced the focused Chrome popup alert with user-started Document PiP monitoring. One window switches between minimal idle status and a new-question alert with local detection time.
- Closing PiP, leaving the class, or destroying the opener stops monitoring. Refresh requires a new click. Unsupported API and opening failures are shown on the page.
- Removed the standalone alert page/assets, third build, NEW_POLL delivery contract, and obsolete popup tests. Added monitoring/PiP lifecycle coverage and a real-browser manual matrix.
- Declared desktop Chrome 116 minimum; retained only webNavigation permission and exact student-site access.

### Added

- Active-alert Go to Question button focuses the existing iClicker tab without closing PiP or resetting monitoring. Chrome 123+ is now required for opener focusing; no permission added.

- Question Ended screen with the local end-detection time, shown after an active alert closes and retained until the next question or monitoring stops.

- Elapsed time since question detection in PiP and the shared dev preview, updated each second and cleared on idle/close.

- Gentle green pulsing for active-question PiP alerts, with a popup toggle for a solid green background and automatic reduced-motion support. The storage permission saves only this local preference; open PiP and extension tester views update immediately.

- Local hot-reloading UI tester via `npm run dev`, including live PiP stylesheet updates.

- Development-only toolbar popup and extension-owned dev tester for manually previewing idle/question PiP states without an iClicker class. The tester includes an on-page safe event log and a Git-ignored local log-capture folder.
- Route-based detection with initial-active baseline and consecutive duplicate suppression across hashchange and filtered webNavigation history/fragment events.
- Privacy-safe content, worker, and PiP diagnostics; no question/answer content, telemetry, or persistent state.
- Project documentation, local checks, and CI configuration.

Real Chrome/iClicker validation of PiP remains pending. The development tester does not replace live compatibility checks. Sound, production settings, click focus, quiz support, cross-tab deduplication, and recovery remain deferred.
