# iNoti

iNoti is an early Chrome extension for students using iClicker. Start monitoring a supported class to keep a small Picture-in-Picture (PiP) status window visible while working elsewhere. When the class moves into a new live poll, that same window shows **New iClicker Question** and the local detection time.

## Availability and usage

This is an unpacked development version, not a Chrome Web Store release. Use desktop Chrome 116 or newer with Document Picture-in-Picture available. Real Chrome/iClicker verification of this monitoring experience is still pending.

1. Follow the [build and load-unpacked instructions](CONTRIBUTING.md).
2. Open one iClicker student tab and join a supported class.
3. Click **Start Monitoring** on the page to open PiP. It starts with a minimal iNoti status indicator.
4. Keep PiP open. A new supported poll transition displays the alert; closing/results or waiting returns it to idle.
5. Close PiP or click **Monitoring** to stop. Leaving the class also stops monitoring. After refreshing, click Start Monitoring again.

Document PiP is an always-on-top browser surface. Chrome controls its position and may clamp its size; iNoti requests one small footprint for idle and alert content. Visibility across tabs, minimizing Chrome, and application switching must still be verified for this build on your system. If the API is unavailable, the control explains this. There is no separate-tab, popup-window, or native-notification fallback.

You still answer questions yourself in iClicker. Sound, settings, quiz alerts, click-to-focus iClicker, and cross-tab deduplication are not implemented.

### Development tester

The unpacked development build includes a small toolbar popup with an **Open Dev Tester** button. It opens an extension-owned tab where the idle and new-question PiP states can be previewed and the real PiP surface can be opened manually without joining an iClicker class. This is development tooling only: it verifies the alert UI/lifecycle in isolation and does not prove that live iClicker detection works.

## Privacy

iNoti uses static content-script access only to `https://student.iclicker.com/*` and the `webNavigation` permission for SPA route changes. It reads routes, never question text, choices, answers, grades, or unrelated browsing. PiP displays only generic status and local detection time. No telemetry, navigation history, or persistent storage is added. Logs omit URLs and identifiers. See [privacy](docs/PRIVACY.md).

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
