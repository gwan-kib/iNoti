# Changelog

No version has been released. This file is initialized early as part of the requested documentation set; the source roadmap requires release entries when the first version approaches release.

## Unreleased

### Added

- Filtered Chrome webNavigation history/fragment events forwarded to per-page detection, addressing owner-reported missed SPA navigation. Adds only webNavigation permission, preserves hashchange and custom alerts, and suppresses consecutive duplicate reports from both sources. Live delivery of the fix remains unverified.

- Minimal MV3 development extension: same-class hash-route transitions into a poll open a focused, extension-owned HTML alert window with local detection time and a close button. Initial active routes establish a baseline. Native notification delivery and its permission have been removed.
- Privacy-safe content, worker, and alert console diagnostics; timestamp/rendering and popup-window tests. Browser validation remains pending.

- Initial project documentation covering MVP scope, architecture, detection research, testing, privacy, decisions, contribution rules, and pull request review.

The development manifest uses version 0.1.0 for unpacked loading; this is not a published release. Sound, settings, click focus, quiz support, cross-tab deduplication, and recovery remain deferred. Browser validation is pending.
