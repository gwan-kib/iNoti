# Contributing

Start with [README.md](README.md) for scope and status and [AGENTS.md](AGENTS.md) for implementation constraints. This checkout implements the minimal Phase 1 route-to-notification path; later MVP features remain pending.

## Solo development workflow

1. Choose the next small task from the [development roadmap](docs/ROADMAP.md). No individual issue is required. Stay within the MVP unless the project owner explicitly expands scope.
2. Work directly on `main` by default. Use a separate branch or PR only when useful for an experiment, a larger change, or collaboration; neither is required for every feature.
3. Implement one focused change. Ground detector changes in evidence and add or update relevant tests and fixtures before notification polish.
4. Run `npm run check` before committing a completed code change, plus applicable browser checks. Review the diff and update affected documentation with the code.
5. Commit a coherent, working checkpoint with a descriptive message, such as `feat: detect answerable question state` or `test: add duplicate-question fixtures`. Include documentation updates in the same commit where practical.

Issues, feature branches, PRs, and branch protection are optional for solo development. The PR template is available if a PR is useful. CI is configured to automate checks on pushes to `main` and PRs targeting `main`; it does not require a branch-and-merge workflow. Local checks remain the immediate validation step.

## Setup and required checks

Use Node.js 22 (22.13.0 or newer within the 22.x line) and npm 10 or 11. `.nvmrc` selects Node 22 locally and in CI; `package.json` declares the supported ranges. With an nvm-compatible version manager, select the version using `.nvmrc`; otherwise install Node 22 directly. Check `node --version` and `npm --version` before installation.

```bash
git clone https://github.com/gwan-kib/iNoti.git
cd iNoti
npm ci
npm run check
```

Use `npm ci` for reproducible installation from `package-lock.json`. Use `npm install` when intentionally updating dependencies and commit the resulting manifest and lockfile together. Direct development dependencies are pinned; there are no runtime dependencies.

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint recommended JavaScript and TypeScript rules; warnings fail the check |
| `npm run typecheck` | Strict TypeScript validation without emitting files |
| `npm test` | Vitest single run of route, transition, messaging, and notification tests |
| `npm run build` | Vite production build into `dist/` |
| `npm run check` | Lint, type-check, tests, then build; stops on failure |

Lint and type-checking cover configuration, source, and tests. Strict TypeScript includes DOM and Chrome API types. Chrome APIs are mocked at component boundaries in tests; no runtime dependency or UI framework is needed.

Vite builds an unpacked MV3 extension into `dist/`: `manifest.json`, `content.js`, `background.js`, `alert.html`, hashed alert JS/CSS in `assets/`, and `assets/icon-128.png`. Two library builds produce standalone IIFEs; the first clears output and copies the manifest/icon, the second adds the classic worker. A third HTML build adds the local alert page and its assets without clearing earlier output. Run the full build command. Generated output and dependencies are ignored by Git. No minimum Chrome version is claimed from the ES2022 target alone.

Vitest has real application tests with no no-tests allowance. Synthetic tests establish route policy, mocked window creation, timestamp rendering, and safe logging; they do not establish authenticated iClicker or Chrome window behavior.

CI uses the same Node line, `npm ci`, and the four individual validation scripts with npm caching. Hosted CI results must be checked after pushing; local success does not establish a successful GitHub Actions run.

## Load unpacked for development

1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Choose **Load unpacked** and select this checkout's `dist/` directory.
4. Confirm the updated build has `webNavigation` permission enabled, check the iNoti card for errors, and inspect the service worker for startup errors.
5. Open or refresh `https://student.iclicker.com/` so the static content script starts. Use a single tab. OS notification settings are irrelevant to this alert window.
6. After code changes, rebuild, reload iNoti on the extensions page, and refresh the student page. Loading while already on a poll intentionally produces no alert.

Follow the manual scenarios in docs/TESTING.md and record browser/OS versions and actual results. This development build is not a Web Store release; no live-session verification is implied by a successful build. For documentation-only changes, inspect text, relative links, required files, consistency, and whitespace.

For diagnosis, open the student page's DevTools console and the extension service-worker console before starting an instructor poll. Enable Info-level console messages and filter by `[iNoti]`. Inspect the alert page's own console for render/close events. `src/shared/logging.ts` has a single `DEBUG` constant, currently enabled for this testing phase; set it to false and rebuild to silence diagnostic output. Logs deliberately omit raw URLs, UUIDs, payloads, and unrecognized error text. See docs/TESTING.md for expected log stages.

Join a class after the page refresh: initial `UNSUPPORTED` is expected before SPA initialization. Look for worker `webNavigation history update observed` or `webNavigation fragment update observed`, forwarding/delivery logs, and content `navigation update received` with source `webNavigation` or `hashchange`. `UNSUPPORTED` to `WAITING` sets the baseline; a later same-class `QUESTION_ACTIVE` should send one `NEW_POLL`. Injection was verified in the owner's Chrome test; this updated end-to-end flow still needs live verification.

See [testing](docs/TESTING.md) for fixture requirements, browser scenarios, and release evidence.

## Documentation maintenance matrix

README.md is primarily for users, with links to technical documentation near the end. Keep developer workflow, setup, architecture, and implementation details here or in docs/. Move useful technical content to its appropriate document when simplifying the README.

| Change | Required updates |
| --- | --- |
| Developer setup command, dependency, or build | CONTRIBUTING.md; docs/TESTING.md for check changes; README.md only if user installation or usage changes |
| Component responsibility or message flow | docs/ARCHITECTURE.md |
| Selector, state signal, fingerprint, or dedupe | docs/DETECTION_STRATEGY.md and detection tests/fixtures |
| Permission or host access | Manifest when present, README.md, docs/PRIVACY.md, and docs/DECISIONS.md |
| Harness, fixture, mock, or manual verification | docs/TESTING.md |
| User-facing behavior or setting | README.md; CHANGELOG.md for user-visible release changes |
| Production limitation | README limitations/troubleshooting and the relevant technical document |
| No documentation impact | No extra paperwork; if using a PR, mark documentation not applicable and explain why |

Repository documentation becomes the maintained source of truth once implementation begins. Keep the original plan linked in docs/ROADMAP.md for context, but do not leave corrected behavior only in an external document.

## Fixtures, comments, and privacy

Use synthetic or carefully sanitized evidence; never commit captured student data, live session identifiers, credentials, or unnecessary production-page dumps. Describe a signal's meaning and fragility without retaining private content. Logs must omit answer content and unnecessary session data.

Comments should explain non-obvious choices, browser lifecycle behavior, dedupe guarantees, fragile selectors, and workarounds. Permission additions require a written need and review of narrower alternatives. See [privacy](docs/PRIVACY.md) and [decisions](docs/DECISIONS.md).
