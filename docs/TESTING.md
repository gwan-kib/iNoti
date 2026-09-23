# Testing and verification

## Commands

Use Node 22.13+ within 22.x and npm 10 or 11. See [setup](../CONTRIBUTING.md).

| Command | Check |
| --- | --- |
| `npm ci` | Reproducible lockfile installation |
| `npm run lint` | JavaScript/TypeScript source, tests, and configuration |
| `npm run typecheck` | Strict TypeScript, including Chrome API types; no emission |
| `npm test` | Real Vitest tests; no-tests allowance removed |
| `npm run build` | Manifest, standalone scripts, and icon in `dist/` |
| `npm run check` | Lint, type-check, tests, build in order |

CI runs the same individual checks on pushes to main and PRs targeting main. Hosted CI results are separate from local results.

## Automated coverage

- Route parser: waiting, active, closed, malformed UUIDs/routes, unrelated and quiz routes, extra path/query segments.
- Transition matrix: initial active baseline, every pair of supported/unsupported states, and cross-class suppression.
- Content-script boundary: normal repeated poll/closed sequence, initial poll and refresh, unrelated/quiz baseline, queued event URLs.
- Worker boundary: synchronous registration, exactly one create call, title/local time/icon/silence, malformed messages, untrusted senders, and notification failure without retries.

Tests use synthetic UUIDs and mocked Chrome APIs. They prove route policy and API requests, not a visible desktop notification or live iClicker compatibility.

## Build inspection

After building, confirm `dist/manifest.json`, `content.js`, `background.js`, and `assets/icon-128.png` exist. Check every manifest reference, verify the PNG, and confirm neither JavaScript bundle needs external imports. There must be no infrastructure HTML, popup, audio, or extra permissions. Confirm `dist/` is ignored and absent from the tracked diff.

## Manual Phase 1 procedure

1. Build and load `dist/` using [the unpacked procedure](../CONTRIBUTING.md). Record commit/build, Chrome/OS versions, date, and notification permissions. Check extension errors and worker startup.
2. Open or refresh the supported iClicker student page after loading/reloading the extension. Use one tab for this phase and allow Chrome notifications in the OS.
3. During an authorized real class session, observe the scenarios below. Do not submit answers on someone's behalf or modify the application's route to manufacture evidence of a real poll.
4. Record notification counts and errors without recording live IDs, question content, or student data. Repeat with Chrome minimized and another app focused where possible.

| Scenario | Expected additional notifications |
| --- | --- |
| Initial waiting route | 0 |
| Waiting to same-class poll | 1 |
| Repeated event or remaining on poll | 0 |
| Poll to question/results | 0 |
| Question/results to same-class poll | 1 |
| Initial load or refresh on poll | 0 |
| Quiz or unrelated route; unsupported directly to poll | 0 |
| Unsupported to waiting, then same-class poll | 1 on the last transition |
| Direct change to another class's poll | 0 |
| Supported transition while tab unfocused | 1; verify actual OS display |
| Notification click | No focus behavior promised |
| Two tabs in same class | Duplicate notifications are a known limitation |

Confirm no sound is requested and no popup/settings exist. A supported route transition may still correspond to manually revisiting an old poll; unchanged poll URLs cannot reveal a new question.

## Verification status

Local verification on Windows with Node 22.17.1 and npm 11.12.1: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run check` succeeded. Vitest ran 51 tests across three files. Build inspection verified all manifest references, exact permissions/site scope, a 128-by-128 PNG, absence of the old HTML entry, and ignored output. Both generated scripts also executed together in a Node VM with mocked Chrome APIs: two eligible transitions produced two create calls. This bundle check is not a browser test.

The Phase 1 automated suite and local build are verified separately from browser behavior. This environment exposes no connected browser or native app surface, so loading unpacked, checking Chrome runtime errors, and displaying a real authenticated iClicker notification were not performed. The supplied background-route observations remain project evidence, not a browser test of this build. Hosted GitHub Actions execution is also unverified here.

## Deferred release checks

Before a full MVP release, add relevant automated and real-session evidence for settings, sound, click focus, cross-tab duplicates, question identity, concurrent sessions, reconnects, worker suspension, and Memory Saver/discard behavior. Review permissions and data retention again with those changes. No simulator, DOM fixtures, or lifecycle recovery harness is included in Phase 1. No release is claimed.
