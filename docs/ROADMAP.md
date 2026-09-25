ï»¿# Development roadmap

Status: Phase 1 uses page-owned monitoring with the existing route detector and filtered webNavigation forwarding; the user-started Document PiP window is an optional visual surface plus an offscreen sound alert (D017). Automated lifecycle and sound checks are implemented; real Chrome/iClicker exit and background-audio evidence remain pending. This is not release-ready.

The project owner's revised route evidence supersedes the investigation spike in the [original plan](https://docs.google.com/document/d/1t_shCi1Xmq2bixpmZxJfVJfxEwGP-gudvI6dxPf0xcg/edit). Repository docs are the maintained source of truth. Follow the [solo workflow](../CONTRIBUTING.md); issues, branches, and PRs are optional.

| Phase | Work and exit criterion | Status |
| --- | --- | --- |
| 0 | Reproducible tooling, validation commands, and equivalent CI | Implemented; hosted CI results not verified here |
| 1 | Route detector, diagnostics, page-owned monitoring, and an optional user-started PiP visual surface | Implemented; automated verification complete, browser exit evidence pending |
| 2 | Production toolbar/settings and persistent preferences; page monitoring control is already in Phase 1 | Alert pulse and sound preferences implemented; broader settings pending |
| 3 | Notification click-to-focus and optional sound with validated browser/OS behavior | Go to Question and offscreen sound implemented; browser focus and background-audio checks pending |
| 4 | Question identity, worker-owned cross-tab deduplication, and multiple-session policy | Pending |
| 5 | Recovery, reconnect, refresh, worker suspension, and discard limitations | Pending |
| 6 | Full MVP browser validation, privacy review, release and installation evidence | Pending |
| 7 | Separately authorized post-MVP features | Deferred |

The Phase 1 monitoring migration is explicitly owner-authorized. The initial migration added no permissions; the owner-requested pulse preference added storage for local booleans (D014), and the owner-requested sound alert adds the offscreen permission plus local sound preferences (D006/D017). The exact student-site content match remains. Desktop Chrome 123+ is required. Monitoring is automatic on supported class routes and does not depend on the window; PiP opens from a user click, remains at one requested size, and closes with its opener or title bar. No separate-tab/native notification fallback exists. The toolbar popup includes the pulse preference and opens an extension-owned tester tab so PiP states can be exercised without iClicker; it is tooling and does not satisfy the pending production toolbar/settings phase. The old investigation spike is not a prerequisite. [Detection strategy](DETECTION_STRATEGY.md) records route evidence and remaining limitations.

## Later MVP requirements

The full MVP still requires correct click focus, cross-tab duplicate suppression, tested recovery, and real-browser verification of background/minimized sound. Phase 1 does not satisfy those requirements. Identity must be resolved before promising one alert per question across tabs or reconnects.

Quiz notifications, custom positioning, notification stacks/progress bars/history, themes, volume control, cross-browser packaging, mobile notifications, and backend integrations remain deferred. DOM or network observation is not planned without new evidence.

See [architecture](ARCHITECTURE.md), [decisions](DECISIONS.md), [privacy](PRIVACY.md), and [testing](TESTING.md).
