# Contributing

Start with [README.md](README.md) for scope and status and [AGENTS.md](AGENTS.md) for implementation constraints. This checkout has documentation only; build tooling and application code are pending.

## Solo development workflow

1. Choose the next small task from the [development roadmap](docs/ROADMAP.md). No individual issue is required. Stay within the MVP unless the project owner explicitly expands scope.
2. Work directly on `main` by default. Use a separate branch or PR only when useful for an experiment, a larger change, or collaboration; neither is required for every feature.
3. Implement one focused change. Ground detector changes in evidence and add or update relevant tests and fixtures before notification polish.
4. Run the documented lint, type-check, tests, and production build once available, plus applicable browser checks. Review the diff and update affected documentation with the code.
5. Commit a coherent, working checkpoint with a descriptive message, such as `feat: detect answerable question state` or `test: add duplicate-question fixtures`. Include documentation updates in the same commit where practical.

Issues, feature branches, PRs, and branch protection are optional for solo development. The PR template is available if a PR is useful. CI remains planned to automate checks on pushes to `main` and on optional PRs; it does not require a branch-and-merge workflow. Local checks remain the immediate validation step.

## Setup and required checks

There is no package manifest, lockfile, runtime version selection, test harness, build output, or CI workflow yet. No installation, lint, type-check, test, or build command is currently available.

The tooling change must select and document supported runtime/package-manager versions, exact installation commands, each check command, production output directory, and equivalent CI jobs. Update this document and docs/TESTING.md together. Update README.md only for installation or usage steps users need. Do not add empty or always-passing tests to suggest validation exists.

Once a production build exists, the planned manual load flow is to open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the verified build directory. These steps cannot be completed with the current checkout. Document the exact build directory and prerequisites when tooling is implemented.

For this documentation-only stage, inspect all changed text, validate relative links and required files, and check whitespace. Record application checks as not applicable because the implementation and tooling do not exist. This exception does not waive future code checks.

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
