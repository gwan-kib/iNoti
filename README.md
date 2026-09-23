# iNoti

iNoti is a planned browser extension for students using iClicker. It aims to alert you when a new question is ready to answer, so you can work in another tab or application while keeping your iClicker session open.

## Availability

**iNoti is in early development and is not available to install yet.** The project currently has documentation only. Its planned features have not been tested in live iClicker sessions.

Installation instructions and supported browser details will be added when a usable version is ready.

## What it will do

- Notify you when a new answerable question appears, with the time it was detected.
- Play a sound that you can turn on or off.
- Take you back to the correct iClicker tab when you click the notification.
- Show whether it is monitoring a session and let you turn monitoring on or off.
- Remember your settings and avoid repeated alerts for the same question.

The first version is planned for Chrome. You will need to keep the iClicker session open. iNoti will alert you to questions; you will still answer them yourself in iClicker.

## Privacy

iNoti is designed to monitor only the supported iClicker student pages. It must not collect your answers, submit answers for you, monitor unrelated websites, or save question text and answer choices. See the [privacy plan](docs/PRIVACY.md) for details.

## Expected limitations

Background alerts are a core goal, but reliability still needs testing. If Chrome suspends or unloads the iClicker page to save resources, monitoring may stop until the page resumes. How notifications appear and how long they stay visible may also depend on your operating system.

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
