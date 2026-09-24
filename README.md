# iNoti

iNoti is an early Chrome extension for students using iClicker. Start monitoring a supported class to keep a small Picture-in-Picture (PiP) status window visible while working elsewhere. When the class moves into a new live poll, that same window shows **New iClicker Question** with the local detection time and an elapsed timer. The timer measures time since iNoti detected the question, not the instructor's exact start time.

## Availability and usage

This is an unpacked development version, not a Chrome Web Store release. Use desktop Chrome 123 or newer with Document Picture-in-Picture available. Real Chrome/iClicker verification of this monitoring experience is still pending.

1. Follow the [build and load-unpacked instructions](CONTRIBUTING.md).
2. Open one iClicker student tab and join a supported class.
3. Click **Start Monitoring** on the page to open PiP. It starts with a minimal iNoti status indicator.
4. Keep PiP open. A new supported poll transition displays the alert; closing/results or waiting after a detected question shows **Question Ended** with an **Ended at** time. This is when iNoti detected the end, not the instructor's exact end time. The screen stays until the next detected question or monitoring stops.
5. Close PiP or click **Monitoring** to stop. Leaving the class also stops monitoring. After refreshing, click Start Monitoring again.

**Go to Question** appears during an active alert. Click it to focus the original iClicker tab while PiP stays open; the elapsed timer and monitoring continue.

Document PiP is an always-on-top browser surface. Chrome controls its position and may clamp its size; iNoti requests one small footprint for idle and alert content. Visibility across tabs, minimizing Chrome, and application switching must still be verified for this build on your system. If the API is unavailable, the control explains this. There is no separate-tab, popup-window, or native-notification fallback.

New-question alerts gently pulse by default: a soft lavender circle grows outward from the middle of the question title over the pink alert surface. Open the iNoti toolbar popup and turn off **Pulse new-question background** for a solid soft pink alert. Changes apply to an open PiP immediately and are saved on this device. System reduced-motion preferences also keep the background solid. Idle and ended screens do not pulse. The elapsed timer stops and hides when the question ends.

You still answer questions yourself in iClicker. Sound, other settings, quiz alerts, and cross-tab deduplication are not implemented.

### Development tester

The unpacked development build includes a small toolbar popup with an **Open Dev Tester** button. It opens an extension-owned tab where the idle and new-question PiP states can be previewed and the real PiP surface can be opened manually without joining an iClicker class. The tester is development tooling only: it verifies the alert UI/lifecycle in isolation and does not prove that live iClicker detection works.

## Privacy

iNoti uses static content-script access only to `https://student.iclicker.com/*` and the `webNavigation` permission for SPA route changes. The `storage` permission saves only your alert-animation preference locally. It reads routes, never question text, choices, answers, grades, or unrelated browsing. PiP displays only generic status, local detection time, and elapsed time. No telemetry, navigation history, or stored class/question data is added. Logs omit URLs and identifiers. See [privacy](docs/PRIVACY.md).

## Expected limitations

Use a single tab. An already-active question is intentionally ignored when loading the page or starting monitoring. A poll URL has no question ID: revisiting an old poll can alert again, and a new question without a route change cannot be detected. Questions arriving before PiP finishes opening are not replayed. Reloading or closing the opener ends monitoring. Memory Saver, frozen/discarded pages, reconnects, and rapid event ordering can affect delivery and remain unverified. PiP does not guarantee that the background page keeps running.

## Project documentation

- [Contributing and developer setup](CONTRIBUTING.md)
- [Development roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Detection strategy](docs/DETECTION_STRATEGY.md)
- [Testing](docs/TESTING.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Agent instructions](AGENTS.md)
- [Changelog](CHANGELOG.md)
