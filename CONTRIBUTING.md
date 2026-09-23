# Contributing

Start with [README.md](README.md) for scope and status and [AGENTS.md](AGENTS.md) for implementation constraints. This checkout has documentation and development tooling; application code is pending.

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
| `npm test` | Vitest single run; currently reports no test files and exits successfully |
| `npm run build` | Vite production build into `dist/` |
| `npm run check` | Lint, type-check, tests, then build; stops on failure |

Lint checks existing JavaScript/TypeScript configuration and future source/tests. Type-checking currently checks the TypeScript configuration files and automatically includes future `src/**/*.ts` and `tests/**/*.ts`. DOM types are enabled; Chrome-specific types and runtime wrappers remain deferred until needed.

Vite currently builds only `tooling/index.html`, a static infrastructure entry, into `dist/index.html`. It is not a popup, simulator, or installable extension. The build clears `dist/`; generated output and dependencies are ignored by Git. Phase 2 must replace this entry with actual extension packaging, including a manifest and appropriate worker/content-script outputs. No minimum Chrome version is implied by the ES2022 syntax target.

Vitest has no application tests yet. `passWithNoTests` explicitly permits this infrastructure-only stage; remove that setting when the first real tests arrive. A successful test command now establishes runner setup, not application coverage. No fake tests or fixtures are included.

CI uses the same Node line, `npm ci`, and the four individual validation scripts with npm caching. Hosted CI results must be checked after pushing; local success does not establish a successful GitHub Actions run.

Loading unpacked in Chrome and all extension/browser checks remain unavailable until Phase 2 supplies an extension skeleton. For documentation-only changes, inspect changed text, relative links, required files, consistency, and whitespace.

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
