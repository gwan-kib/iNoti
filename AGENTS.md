# Agent instructions

## Scope and priorities

- Read README.md and the relevant technical documents before changes. Phase 1 uses route detection and extension-owned HTML alert windows; distinguish automated results from unverified browser behavior and later features.
- Stay inside the MVP unless the project owner explicitly authorizes post-MVP work. An issue is not required. Question detection, duplicate prevention, and recovery take priority over UI polish.
- Inspect the checkout and existing changes before editing. Preserve unrelated work and keep changes focused on the requested task.
- Follow CONTRIBUTING.md for the solo workflow: work on `main` by default, keep changes focused, validate, and update documentation. Do not require individual issues, feature branches, or PRs; use them only when requested or useful.

## Architecture rules

- Keep iClicker route parsing centralized in `src/content/detector.ts`; use the confirmed route evidence in docs/DETECTION_STRATEGY.md. The previous live investigation spike is superseded.
- Prefer `hashchange` and pure route/transition functions. Initial active routes establish a baseline; only same-class waiting/closed to active transitions notify.
- Do not invent DOM selectors or add DOM observation, polling, or network/WebSocket interception without new evidence and authorization.
- Keep Chrome APIs at component boundaries and notification delivery out of the detector. Phase 1 is single-tab only; do not prematurely add question fingerprints or cross-tab registries.
- Treat the worker as disposable and register listeners synchronously. It currently stores no session state. Storage/recovery, toolbar popup/settings, sound, click focus, and quiz support remain later work.
- Use `chrome.windows.create` with a local alert page, not native notifications. No API permissions or toolbar popup are needed. The current focused window is a testing choice, not an always-on-top guarantee.
- Keep `[iNoti][content]`, `[iNoti][worker]`, and `[iNoti][alert]` logs useful and private: normalized states, boolean decisions, failure categories, and optional window ID only. Never dump raw hashes, sender objects, payloads, or arbitrary errors. Do not add detection fallbacks to hide missing hashchange events.

## Privacy and permissions

- Never collect student answers, auto-submit answers, or inspect unrelated websites.
- Never persist question text or answer choices. A necessary fingerprint may use transient local content only, without transmitting or retaining that content.
- Use minimum permissions and confirmed iClicker origins only. Every new permission needs a written reason, a decision record, and matching README.md and docs/PRIVACY.md updates.
- Do not commit secrets, student data, live session identifiers, or unnecessary production-page dumps. Use synthetic fixtures and privacy-safe logs.

## Comments and verification

- Explain why non-obvious behavior exists, particularly fragile iClicker signals, browser lifecycle handling, deduplication, and workarounds. Avoid comments that only restate code.
- Add or update tests whenever detection, state transitions, deduplication, messaging, settings, or recovery changes. Use docs/TESTING.md to choose relevant automated and manual checks.
- Before a code change is considered complete, run the documented lint, type-check, test, and production-build commands. Browser-dependent behavior also needs applicable manual verification.
- **Current command status:** run `npm run check` for lint, type-check, real Vitest tests, and the unpacked extension build. Exact setup and individual commands are in CONTRIBUTING.md and docs/TESTING.md; CI runs equivalent checks. Do not create placeholder tests or reinstate the no-tests allowance.
- For documentation-only changes, check required files, relative links, consistency with the revised roadmap and checkout, and whitespace. Report browser checks not run with the concrete environment limitation; mocks do not establish live compatibility.

## Documentation maintenance

- Keep README.md primarily for users: explain what iNoti is, who it helps, its intended use, availability, installation/usage when supported, and practical limitations/privacy. It is not a technical overview of the project.
- Put architecture, implementation plans, development setup, build/check commands, and contributor workflow in CONTRIBUTING.md or the relevant docs/ files. Keep links to these technical documents near the end of README.md. When simplifying the README, move useful technical information rather than discarding it.

- Update relevant documents alongside behavior, architecture, permissions, setup, testing, or user-facing changes, in the same commit where practical. Use the maintenance matrix in CONTRIBUTING.md.
- Keep evidence, proposals, accepted decisions, and implemented behavior distinct. Record unresolved research explicitly.
- If using an optional PR and documentation is not affected, mark it not applicable and explain why. Direct commits need no separate documentation-impact form.
- Report what changed, what was verified, and what remains unverified. Never infer live iClicker behavior from synthetic tests alone.
