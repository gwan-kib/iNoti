# Development roadmap

Status: Phase 1 now supplements hashchange with filtered webNavigation. The owner verified injection/worker startup in Chrome, but saw an initial UNSUPPORTED baseline and missed visible SPA navigation. Automated checks cover the fix; live alert delivery must be re-tested. This is not a release-ready extension.

The project owner's revised route evidence supersedes the investigation spike in the [original plan](https://docs.google.com/document/d/1t_shCi1Xmq2bixpmZxJfVJfxEwGP-gudvI6dxPf0xcg/edit). Repository docs are the maintained source of truth. Follow the [solo workflow](../CONTRIBUTING.md); issues, branches, and PRs are optional.

| Phase | Work and exit criterion | Status |
| --- | --- | --- |
| 0 | Reproducible tooling, validation commands, and equivalent CI | Implemented; hosted CI results not verified here |
| 1 | Route detector, detailed diagnostics, and custom HTML alert window: supported transition into poll creates one focused popup without initial-load/refresh duplicates | Implemented; automated verification complete, browser exit evidence pending |
| 2 | Toolbar popup/status and persistent monitoring controls with documented defaults | Pending |
| 3 | Notification click-to-focus and optional sound with validated browser/OS behavior | Pending |
| 4 | Question identity, worker-owned cross-tab deduplication, and multiple-session policy | Pending |
| 5 | Recovery, reconnect, refresh, worker suspension, and discard limitations | Pending |
| 6 | Full MVP browser validation, privacy review, release and installation evidence | Pending |
| 7 | Separately authorized post-MVP features | Deferred |

The extension skeleton and custom alert path are part of Phase 1. The only API permission is webNavigation for SPA route observation; alert windows do not need notifications permission. They may steal focus, are not always-on-top, and have no sound or auto-dismiss. Positioning, stacking, and non-focus behavior remain future work. The old investigation spike is no longer a prerequisite. [Detection strategy](DETECTION_STRATEGY.md) records the Chrome evidence, new event forwarding, and remaining verification limits.

## Later MVP requirements

The full MVP still requires persistent controls, sound, correct click focus, cross-tab duplicate suppression, and tested recovery. Phase 1 does not satisfy those requirements. Identity must be resolved before promising one alert per question across tabs or reconnects.

Quiz notifications, custom positioning, notification stacks/progress bars/history, themes, extra sounds, cross-browser packaging, mobile notifications, and backend integrations remain deferred. DOM or network observation is not planned without new evidence.

See [architecture](ARCHITECTURE.md), [decisions](DECISIONS.md), [privacy](PRIVACY.md), and [testing](TESTING.md).
