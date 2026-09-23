ï»¿# Development roadmap

Status: Phase 1 now uses user-started Document PiP monitoring with the existing route detector and filtered webNavigation forwarding. Automated lifecycle checks are implemented; real Chrome/iClicker exit evidence remains pending. This is not release-ready.

The project owner's revised route evidence supersedes the investigation spike in the [original plan](https://docs.google.com/document/d/1t_shCi1Xmq2bixpmZxJfVJfxEwGP-gudvI6dxPf0xcg/edit). Repository docs are the maintained source of truth. Follow the [solo workflow](../CONTRIBUTING.md); issues, branches, and PRs are optional.

| Phase | Work and exit criterion | Status |
| --- | --- | --- |
| 0 | Reproducible tooling, validation commands, and equivalent CI | Implemented; hosted CI results not verified here |
| 1 | Route detector, diagnostics, and user-started PiP: one persistent idle/alert surface with close/refresh cleanup | Implemented; automated verification complete, browser exit evidence pending |
| 2 | Production toolbar/settings and persistent preferences; page monitoring control is already in Phase 1 | Pending |
| 3 | Notification click-to-focus and optional sound with validated browser/OS behavior | Pending |
| 4 | Question identity, worker-owned cross-tab deduplication, and multiple-session policy | Pending |
| 5 | Recovery, reconnect, refresh, worker suspension, and discard limitations | Pending |
| 6 | Full MVP browser validation, privacy review, release and installation evidence | Pending |
| 7 | Separately authorized post-MVP features | Deferred |

The Phase 1 monitoring migration is explicitly owner-authorized. It adds no permissions: only webNavigation and the exact student-site content match remain. Desktop Chrome 116+ is required. PiP opens from a user click, remains at one requested size, and closes with its opener. No separate-tab/native notification fallback exists. A development-only toolbar popup now opens an extension-owned tester tab so PiP states can be exercised without iClicker; it is tooling and does not satisfy the pending production toolbar/settings phase. The old investigation spike is not a prerequisite. [Detection strategy](DETECTION_STRATEGY.md) records route evidence and remaining limitations.

## Later MVP requirements

The full MVP still requires persistent preferences, sound, correct click focus, cross-tab duplicate suppression, and tested recovery. Phase 1 does not satisfy those requirements. Identity must be resolved before promising one alert per question across tabs or reconnects.

Quiz notifications, custom positioning, notification stacks/progress bars/history, themes, extra sounds, cross-browser packaging, mobile notifications, and backend integrations remain deferred. DOM or network observation is not planned without new evidence.

See [architecture](ARCHITECTURE.md), [decisions](DECISIONS.md), [privacy](PRIVACY.md), and [testing](TESTING.md).
