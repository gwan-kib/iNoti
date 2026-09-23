# Development roadmap

Status: Phase 0 tooling and CI configuration implemented; local verification and hosted CI status are documented in [testing](TESTING.md). Extension components and live iClicker investigation remain pending. There is no installable extension or released version.

The documentation is adapted from the [original implementation plan](https://docs.google.com/document/d/1t_shCi1Xmq2bixpmZxJfVJfxEwGP-gudvI6dxPf0xcg/edit). Repository docs are the maintained source of truth as implementation advances. Follow the [solo workflow](../CONTRIBUTING.md): work on `main` by default, choose small tasks directly from this roadmap, validate, update docs, and commit. Issues, branches, and PRs are optional.

## Implementation order

| Phase | Work and exit criterion | Status |
| --- | --- | --- |
| 0 | Documentation plus build/check scripts and CI; contributors can start and validate the repo | Implemented and locally verified; hosted CI execution pending verification |
| 1 | Investigate real iClicker states; record evidence and synthetic fixtures before production detection code | Pending |
| 2 | Extension skeleton, settings, shared messages; load unpacked and exchange mocked status | Pending |
| 3 | Session detection and popup controls; joining/leaving updates status without notifications | Pending |
| 4 | Detector, keys, reducer, dedupe; one new-question event per new answerable question in fixtures | Pending |
| 5 | Native notification, sound, focus; one alert while backgrounded | Pending |
| 6 | Recovery and multiple tabs; no false/duplicate alerts or manual restart after ordinary disruptions | Pending |
| 7 | Simulator and real-session validation, privacy review, release documentation | Pending |
| 8 | Separately authorized post-MVP work after the MVP consistently passes | Deferred |

The MVP is complete only when a clean Chrome installation passes the [release checks](TESTING.md), including exactly one notification and one enabled sound per new question, correct click focus, persistent settings, and recovery in both simulated and real iClicker usage.


## MVP requirements and deferred scope

Detect a valid session and each genuinely new answerable question. Show Idle/Monitoring status, persist monitoring and sound settings, deliver one native notification and one enabled sound, and focus the correct existing tab/window on click. Setting defaults remain undecided.

Submission, results, closure, repeated rendering, and duplicate tabs must not produce additional alerts for the same question. Refresh, SPA route changes, ordinary reconnects, and service-worker restarts must recover without a manual extension restart.

Before release, provide verified user installation, usage, supported browser/OS details, and troubleshooting for missing alerts, notification settings, sound, and recovery.

Custom positioning, stacked cards, progress bars, multiple sounds, volume control, notification history, themes, additional platforms, and cross-browser packaging remain post-MVP work.

## Technical details and open questions

- [Architecture](ARCHITECTURE.md): component responsibilities, messages, storage, notification text, and lifecycle recovery.
- [Detection strategy](DETECTION_STRATEGY.md): unverified origins, DOM signals, session/question identity, investigation, and deduplication.
- [Decisions](DECISIONS.md): chosen tooling and design directions; pending audio, settings, minimum Chrome version, and OS support decisions.
- [Privacy](PRIVACY.md): exact permission plan and data boundaries.
- [Testing](TESTING.md): background behavior, sound/focus validation, unsupported-state handling, and Memory Saver/discard investigation.
