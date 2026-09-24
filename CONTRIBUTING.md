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
| `npm run dev` | Local hot-reloading UI tester at http://127.0.0.1:5173/src/dev-testing/index.html |
| `npm run lint` | ESLint recommended JavaScript and TypeScript rules; warnings fail the check |
| `npm run typecheck` | Strict TypeScript validation without emitting files |
| `npm test` | Vitest single run of route, transition, messaging, PiP, and development-tool wiring tests |
| `npm run build` | Vite production build into `dist/` |
| `npm run check` | Lint, type-check, tests, then build; stops on failure |

Lint and type-checking cover configuration, source, and tests. Strict TypeScript includes DOM and Chrome API types. Chrome APIs are mocked at component boundaries in tests; no runtime dependency or UI framework is needed.

Vite builds an unpacked MV3 extension into `dist/`: the manifest/icon, content and worker bundles, a small toolbar popup, and a development-test page. Four standalone IIFE builds run in sequence; the content build clears output, later builds preserve it, and the popup/tester builds copy their local HTML/CSS. The production PiP DOM/styles remain bundled into content.js; the dev tester reuses the same PiP controller/view code in its own bundle. Generated output and dependencies are ignored by Git. The manifest requires desktop Chrome 116 for Document PiP, with runtime feature detection; this minimum is not inferred from ES2022.

Vitest has real application tests with no no-tests allowance. Synthetic checks establish route policy, monitoring lifecycle, mocked PiP opening, DOM rendering, and safe logging; they do not establish authenticated iClicker compatibility or always-on-top visibility. Test discovery is scoped to tests/ and lint excludes the local .kilo worktree directory so unrelated nested checkouts are not validated as this package.

CI uses the same Node line, `npm ci`, and the four individual validation scripts with npm caching. Hosted CI results must be checked after pushing; local success does not establish a successful GitHub Actions run.

## Hot-reloading UI development

Run `npm run dev` once and leave the terminal running. Vite opens the local tester at http://127.0.0.1:5173/src/dev-testing/index.html. Save source edits to see updates without rebuilding: tester CSS updates directly, and PiP CSS updates in the inline preview and any open PiP window while preserving their current state. HTML and TypeScript changes reload the tester; click **Open PiP** again if needed. Stop the server with Ctrl+C.

This local tester uses the shared production PiP view/controller but does not load the extension worker or iClicker content script. It needs no extension permissions. Use `npm run build`, reload the unpacked extension, and refresh iClicker for actual extension behavior. Production builds contain no development server or hot-reload client.

## Load unpacked for development

1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Choose **Load unpacked** and select this checkout's `dist/` directory.
4. Confirm the updated build has `webNavigation` permission enabled, check the iNoti card for errors, and inspect the service worker for startup errors.
5. For UI-only testing, click the iNoti toolbar icon and choose **Open Dev Tester**. The extension-owned tab can preview idle/question states and open the same Document PiP surface without an iClicker class.
6. For live detection testing, open or refresh `https://student.iclicker.com/` so the static content script starts. Use a single tab and click Start Monitoring on a supported class page. PiP starts idle; OS notification settings are not involved.
7. After code changes, rebuild, reload iNoti on the extensions page, and refresh any student or dev-tester tabs. Loading while already on a poll intentionally produces no alert.

Follow the manual scenarios in docs/TESTING.md and record browser/OS versions and actual results. This development build is not a Web Store release; no live-session verification is implied by a successful build. For documentation-only changes, inspect text, relative links, required files, consistency, and whitespace.

For diagnosis, open the student page's DevTools console and the extension service-worker console before starting an instructor poll. Enable Info-level console messages and filter by `[iNoti]`. Look for [iNoti][pip] open, state, close, and failure events in the content context. The dev tester also writes `[iNoti][dev]` events and mirrors them in its on-page event log. `src/shared/logging.ts` has a single `DEBUG` constant, currently enabled for this testing phase; set it to false and rebuild to silence production diagnostic output. Logs deliberately omit raw URLs, UUIDs, payloads, and unrecognized error text. If you save local captures, put them under `dev-testing/logs/`; that directory is ignored except for its placeholder. See docs/TESTING.md for expected log stages.

Join a class after the page refresh: initial `UNSUPPORTED` is expected before SPA initialization. Look for worker `webNavigation history update observed` or `webNavigation fragment update observed`, forwarding/delivery logs, and content `navigation update received` with source `webNavigation` or `hashchange`. `UNSUPPORTED` to `WAITING` sets the baseline; a later same-class `QUESTION_ACTIVE` should change the already-open PiP to its alert state once. Injection was verified in the owner's Chrome test; this updated end-to-end flow still needs live verification.

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
