# iNoti

iNoti is an early Chrome extension for students using iClicker. It opens a small iNoti alert window when an open student tab moves from a class waiting or results route into a live poll.

## Availability

**A minimal development version is implemented.** It can be built for loading unpacked, but browser loading and real-session alert delivery have not yet been verified for this implementation. It is not release-ready or available in the Chrome Web Store.

For development installation, follow the [build and load-unpacked instructions](CONTRIBUTING.md). Keep one iClicker student tab open. Alerts use an extension-owned HTML window and do not rely on Chrome/OS notification permission, OS banners, or Do Not Disturb settings. Disable the extension through `chrome://extensions` to stop it.

## Current behavior

- Open one compact alert with “New iClicker Question,” local detection time, and a close button for a supported same-class transition into `/poll`.
- Ignore waiting, submitted/results, quiz, and unrelated routes as notification triggers.
- Treat initial load on a poll as a baseline, preventing an extra alert on refresh.

Alerts remain open until closed. This testing version requests focus and may interrupt your current application. It is a normal Chrome popup window, not an OS always-on-top overlay. There is no toolbar/action popup.

You still answer questions yourself in iClicker. Sound, settings, quiz alerts, click-to-focus iClicker, and cross-tab deduplication are not implemented. Positioning, stacking, and non-focus-stealing behavior remain future work.

## Privacy

iNoti uses static content-script access only to `https://student.iclicker.com/*` and requests no additional API permissions. It reads URL/hash routes, not question text, answers, choices, grades, or unrelated browsing. Alerts receive only the detection timestamp. Development console logs show normalized states and failure categories, without private URLs or UUIDs. It has no storage, external resources, or telemetry. See [privacy](docs/PRIVACY.md).

## Expected limitations

Use a single tab: multiple tabs may each alert. A poll URL has no question ID, so revisiting an old poll can alert again and a new question without a route change cannot be detected. An already-open poll intentionally produces no initial alert. Frozen/discarded pages and reconnects are not handled; delivery failures are logged without retry. Background route changes have been observed, but this build's route events and window visibility still need real-browser testing.

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
