# iNoti

iNoti is a planned lightweight Manifest V3 browser extension that alerts a student when a new answerable iClicker question appears while the student tab is open, including under normal background-tab conditions.

## Development status

**Documentation only; no installable extension or released version exists yet.** This repository starts the documentation portion of Phase 0. Package/build configuration, linting, type-checking, tests, CI, and all extension components remain to be implemented. Live iClicker behavior has not been investigated or verified.

These documents are adapted from the [iNoti implementation plan and documentation roadmap](https://docs.google.com/document/d/1t_shCi1Xmq2bixpmZxJfVJfxEwGP-gudvI6dxPf0xcg/edit). As implementation begins, repository documentation becomes the day-to-day source of truth and must change with the code.

## Local setup and loading

For now, open this checkout and read the documentation below. There is no `package.json`, dependency installation step, build command, manifest, or unpacked extension to load. Node/package-manager versions and build output location are not yet selected.

When tooling is added, this section must specify exact prerequisites, installation and production-build commands, and the generated extension directory. The planned manual load flow is to open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that verified build directory. These steps cannot be completed with the current checkout.

## MVP scope and intended usage

1. Open the supported iClicker student page and join a valid session. Exact supported origins are pending investigation.
2. Enable monitoring in the popup. Show **Idle** with no valid session and **Monitoring iClicker** while monitoring a valid session.
3. Leave the iClicker tab open while using another tab, minimizing Chrome, or working in another application.
4. Receive one native notification per genuinely new answerable question: **New iClicker Question**, with **Detected at [local time]**. Play one bundled sound when sound is enabled.
5. Click the notification to activate the correct existing iClicker tab and focus its window.

Monitoring enabled and sound enabled are the planned persistent settings; their defaults are not yet selected. Submission, results, closure, repeated rendering, and duplicate tabs must not produce additional alerts for the same question. Refresh, route changes, ordinary reconnects, and service-worker restarts must recover without a manual extension restart.

Custom positioning, stacked cards, progress bars, multiple sounds, volume control, notification history, themes, additional platforms, and cross-browser packaging are post-MVP work.

## Planned architecture

Use TypeScript, a lightweight build, and plain HTML/CSS for the popup. A content script interprets iClicker page state; a disposable service worker owns session coordination, duplicate suppression, notifications, and settings. The popup reads current status when opened. An optional offscreen document handles sound if testing establishes that it is needed. See [architecture](docs/ARCHITECTURE.md).

## Permissions and privacy

No permissions are requested by this documentation-only checkout. The planned minimum is `storage`, `notifications`, and access limited to confirmed iClicker student origins. `offscreen` is conditional on the audio decision. Broad `tabs`, `scripting`, `webRequest`, and `<all_urls>` access are not defaults.

The design prohibits collecting student answers, submitting answers, monitoring unrelated websites, and retaining question text or answer choices. Settings stay local by default; only minimal session/deduplication metadata belongs in ephemeral extension storage. See [privacy](docs/PRIVACY.md) for boundaries and permission review requirements.

## Limitations and troubleshooting

- The extension cannot currently be installed or used; implementation and validation are pending.
- Exact student origins, stable DOM signals, session/question identifiers, supported operating systems, and minimum Chrome version remain unverified.
- Ordinary background tabs are a required test target. Frozen or discarded pages may stop executing; uninterrupted monitoring under those conditions is not a promise. Do not disable tab discarding by default.
- Notification presentation and persistence depend on the operating system. Custom sound and notification focus require browser validation.
- Unknown page states must fail closed without alerting. Before release, add verified troubleshooting for missing signals, OS notification settings, sound delivery, and monitoring recovery.

## Solo workflow and roadmap

Work directly on `main` most of the time. Choose one small task from the roadmap, implement it, run the relevant checks, update affected docs, and commit a working checkpoint. Individual issues are not required; branches and PRs are optional when useful. See [CONTRIBUTING.md](CONTRIBUTING.md). This solo workflow supersedes the original plan's mandatory issue/branch/PR process.

| Phase | Work and exit criterion | Status |
| --- | --- | --- |
| 0 | Documentation plus build/check scripts and CI; contributors can start and validate the repo | Documentation created; tooling pending |
| 1 | Investigate real iClicker states; record evidence and synthetic fixtures before production detection code | Pending |
| 2 | Extension skeleton, settings, shared messages; load unpacked and exchange mocked status | Pending |
| 3 | Session detection and popup controls; joining/leaving updates status without notifications | Pending |
| 4 | Detector, keys, reducer, dedupe; one new-question event per new answerable question in fixtures | Pending |
| 5 | Native notification, sound, focus; one alert while backgrounded | Pending |
| 6 | Recovery and multiple tabs; no false/duplicate alerts or manual restart after ordinary disruptions | Pending |
| 7 | Simulator and real-session validation, privacy review, release documentation | Pending |
| 8 | Separately authorized post-MVP work after the MVP consistently passes | Deferred |

The MVP is complete only when a clean Chrome installation passes the [release checks](docs/TESTING.md), including exactly one notification and one enabled sound per new question, correct click focus, persistent settings, and recovery in both simulated and real iClicker usage.

## Documentation

- [Agent instructions](AGENTS.md)
- [Contributing and documentation maintenance](CONTRIBUTING.md)
- [Architecture and message flow](docs/ARCHITECTURE.md)
- [Detection strategy and investigation backlog](docs/DETECTION_STRATEGY.md)
- [Testing and release procedures](docs/TESTING.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Privacy and permissions](docs/PRIVACY.md)
- [Changelog](CHANGELOG.md)
- [Pull request template](.github/pull_request_template.md)
