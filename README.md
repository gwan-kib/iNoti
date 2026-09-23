# iNoti

iNoti is an early Chrome extension for students using iClicker. It requests a desktop notification when an open student tab moves from a class waiting or results route into a live poll.

## Availability

**A minimal development version is implemented.** It can be built for loading unpacked, but browser loading and real-session notification delivery have not yet been verified for this implementation. It is not release-ready or available in the Chrome Web Store.

For development installation, follow the [build and load-unpacked instructions](CONTRIBUTING.md). Keep one iClicker student tab open and allow Chrome notifications in your operating system. Disable the extension through `chrome://extensions` to stop it.

## Current behavior

- Request one silent native notification, with local detection time, for a supported same-class transition into `/poll`.
- Ignore waiting, submitted/results, quiz, and unrelated routes as notification triggers.
- Treat initial load on a poll as a baseline, preventing an extra alert on refresh.

You still answer questions yourself in iClicker. Sound, popup/settings, quiz alerts, notification click-to-focus, and cross-tab deduplication are not implemented.

## Privacy

iNoti requests the `notifications` permission and static content-script access only to `https://student.iclicker.com/*`. It reads URL/hash routes, not question text, answers, choices, grades, or unrelated browsing. It has no storage or telemetry. See [privacy](docs/PRIVACY.md).

## Expected limitations

Use a single tab: multiple tabs may each notify. A poll URL has no question ID, so revisiting an old poll can alert again and a new question without a route change cannot be detected. An already-open poll intentionally produces no initial alert. Frozen/discarded pages, reconnects, and notification delivery failures are not handled yet. Background route changes have been observed, but this build's background delivery still needs testing. Notification presentation and retention depend on Chrome and the operating system.

## Project documentation

For development plans and technical details:

- [Development roadmap](docs/ROADMAP.md)
- [Contributing and developer setup](CONTRIBUTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Detection strategy](docs/DETECTION_STRATEGY.md)
- [Testing](docs/TESTING.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Agent instructions](AGENTS.md)
- [Changelog](CHANGELOG.md)
