# Testing and release verification

## Current status and commands

No implementation, tests, fixtures, simulator, package scripts, or CI exists yet. No runtime checks or manual browser scenarios have passed. This document defines future verification requirements.

| Check | Command/status |
| --- | --- |
| Dependency installation | Not configured; runtime and package manager pending |
| Lint | Not configured |
| Type-check | Not configured |
| Unit and integration tests | Not configured |
| Production build | Not configured; output directory pending |
| CI | Not configured; planned to run lint, type-check, tests, and production build on pushes to `main` and optional PRs |

The tooling change must replace these entries with exact working commands and update CONTRIBUTING.md. Update README.md only when user installation or usage changes. Run the local checks before committing a completed code change; CI automates verification after pushing without requiring a PR. Do not use placeholder tests or report unavailable checks as passing. For documentation-only work now, verify required files, relative links, whitespace, the agreed project plan, and the distinction between planned and implemented behavior.

## Automated coverage

| Area | Required cases |
| --- | --- |
| Pure reducer | Every valid/invalid transition; unknown state; active-to-active replacement; submitted/results/closed never create alerts |
| Question keys | Session scoping, stable IDs, fallback normalization if needed, same-question re-render, distinct questions with identical content, collision/uncertainty policy |
| Duplicate gate | Repeated and concurrent candidates, duplicate tabs, separate sessions, stale/out-of-order messages, retention and restart behavior |
| Registry | One tab, multiple tabs, distinct sessions, tab closure, navigation away, missing notification target, worker reconstruction |
| Settings | Chosen defaults, persistence, monitoring on/off, sound on/off, updates while popup closed, re-enable policy |
| Messaging | Validated contracts, malformed/unsupported payloads, sender identity, worker/popup request-response behavior |
| Delivery and recovery | Notification creation failure, audio request failure, retries without duplicate delivery, refresh/reconnect, worker restart |

Mock Chrome messaging, notifications, storage, tabs/windows, and offscreen APIs at component boundaries. Tests must establish behavior rather than merely repeat implementation details. Browser tests remain necessary for lifecycle and OS-dependent behavior.

## Detector fixtures and simulator

Create synthetic fixtures under `tests/fixtures/` for waiting, active, submitted, closed, results, disconnected, inactive/no-session, unsupported markup, and route-changed states. Add iframe/Shadow DOM fixtures only when investigation shows they are relevant. Associate fixtures with documented signals and expected normalized state, synthetic session/question keys, and candidate count.

A development-only simulator must support state transitions, rapid re-renders, duplicate mutations, reopening the same question, new questions, disconnect/reconnect, delayed updates, and container/route changes. Confirm one new-question event per genuinely new answerable question and zero for submission, results, closure, or repeated rendering before notification polish.

Keep simulator access isolated from production host permissions. Do not broaden production access to run a local test page. No real student/session data, question content, or answers belong in fixtures.

## Manual browser procedure

Use the production build loaded unpacked in a clean Chrome profile. Record commit/build, Chrome version, OS version, monitoring/sound settings, test date, scenario, expected/actual notification and sound counts, focus result, and pass/fail or not-run with a reason. Run the matrix in the synthetic harness and applicable real iClicker usage; synthetic success does not establish live compatibility.

Start with a known waiting state, introduce a new synthetic question, then submit, reveal results, close, and re-render it. With monitoring and sound enabled, require one notification and one sound total. For each next genuinely new question, require one additional pair. With sound disabled, require the notification and zero sound; with monitoring disabled, require no new alerts.

| Scenario | Expected result |
| --- | --- |
| iClicker focused | One alert for a new question |
| iClicker unfocused / another Chrome tab active | Same alert behavior |
| Chrome minimized | Same alert behavior; click returns to the correct window/tab |
| Another desktop application active | Same alert behavior; verify OS presentation and focus |
| Submit, results, close, unrelated mutations | No additional alert |
| Re-render/reopen same question repeatedly | No duplicate alert |
| Two tabs for the same session | One alert across both; correct session target |
| Two distinct sessions | Independent alerts and correct per-session focus |
| Refresh while waiting or active | Automatic registration; no replay of already-notified question |
| SPA route/container change | Correct observation and status without extension restart |
| Offline then reconnect | No uncertain alert; only proven new question alerts on recovery |
| Worker stopped/restarted | State reconstructs; no duplicate or missed next question |
| Sound enabled/disabled | Exactly one/zero bundled sounds; no second OS sound |
| Monitoring disabled/enabled | No alerts while disabled; documented re-enable policy |
| Notification clicked with backgrounded tab/window | Existing correct tab activated and window focused |
| Tab closed or navigated away | Registry/target cleanup; stale click handled safely |
| Popup closed then reopened | Current status and persisted settings; no reliance on popup staying open |
| Memory Saver, frozen or discarded tab | Record actual limitation and recovery; do not equate with ordinary background behavior |
| Production build in clean profile | Loads without extension errors and passes applicable matrix |

For worker lifecycle testing, stop/restart the worker through extension tooling where available, then repeat with its inspector closed and allow ordinary suspension; a debugging session can affect lifecycle behavior. Record the actual procedure used. Browser restart, first-active observation, re-enable, and dedupe-retention expectations must be finalized before claiming their tests pass.

## Debug logging

Use a small logger with development logging and an easy way to disable production logging. Useful events include session discovery, monitoring start, state transition, new-question candidate, duplicate suppression, notification creation, sound request, question closure, disconnect/reconnect, and missing/uncertain detector signals.

Never log answers, question/choice content, credentials, or unnecessary student/session data. Prefer synthetic evidence in bug reports. Record diagnostic signal names rather than raw page dumps.

## Release gate

- [ ] Automated lint, type-check, tests, and production build pass on the release candidate and in CI.
- [ ] Production build loads in a clean Chrome installation/profile with verified setup instructions.
- [ ] Simulator and real-session manual evidence covers the supported Chrome/OS matrix.
- [ ] Exactly one native notification and one enabled sound arrive for each new answerable question in ordinary background conditions.
- [ ] Submission, results, closure, repeated rendering, and duplicate tabs produce no extra alerts.
- [ ] Notification clicks focus the correct existing tab/window; stale targets are handled safely.
- [ ] Settings persist and refresh, route change, reconnect, and worker suspension recover automatically.
- [ ] Memory Saver/discard behavior and any remaining limitations are documented honestly.
- [ ] Permissions, exact origins, audio choice, minimum Chrome version, and privacy behavior have been reviewed against the build.
- [ ] README, architecture, detection, testing, privacy, decisions, and changelog match the released behavior.
- [ ] No known critical missed/duplicate notification issue remains; unresolved risks are recorded.

No release is currently claimed. Post-MVP UI work begins only after this definition consistently passes.
