# Agent instructions

## Scope and priorities

- Read README.md and the relevant technical documents before changes. The repository currently contains documentation only; do not describe planned functionality or checks as implemented.
- Stay inside the MVP unless the project owner explicitly authorizes post-MVP work. An issue is not required. Question detection, duplicate prevention, and recovery take priority over UI polish.
- Inspect the checkout and existing changes before editing. Preserve unrelated work and keep changes focused on the requested task.
- Follow CONTRIBUTING.md for the solo workflow: work on `main` by default, keep changes focused, validate, and update documentation. Do not require individual issues, feature branches, or PRs; use them only when requested or useful.

## Architecture rules

- Keep iClicker-specific selectors and signals centralized in the detection layer, planned as `src/content/detector.ts`. Do not invent selectors before live investigation supplies evidence.
- Prefer stable identifiers and semantic/structural signals over generated CSS classes and styling details.
- Use event-driven observation of the smallest stable subtree. Do not introduce high-frequency polling without a documented reason.
- Separate page parsing, a pure state reducer, question-key derivation, and the service worker's authoritative cross-tab duplicate gate.
- Treat the service worker and popup as disposable. Correctness must survive worker suspension; reconstruct session state from ephemeral storage and fresh content-script events.
- Keep notification UI out of the detector. Native notifications are the MVP delivery mechanism; offscreen audio remains conditional on testing.

## Privacy and permissions

- Never collect student answers, auto-submit answers, or inspect unrelated websites.
- Never persist question text or answer choices. A necessary fingerprint may use transient local content only, without transmitting or retaining that content.
- Use minimum permissions and confirmed iClicker origins only. Every new permission needs a written reason, a decision record, and matching README.md and docs/PRIVACY.md updates.
- Do not commit secrets, student data, live session identifiers, or unnecessary production-page dumps. Use synthetic fixtures and privacy-safe logs.

## Comments and verification

- Explain why non-obvious behavior exists, particularly fragile iClicker signals, browser lifecycle handling, deduplication, and workarounds. Avoid comments that only restate code.
- Add or update tests whenever detection, state transitions, deduplication, messaging, settings, or recovery changes. Use docs/TESTING.md to choose relevant automated and manual checks.
- Before a code change is considered complete, run the documented lint, type-check, test, and production-build commands. Browser-dependent behavior also needs applicable manual verification.
- **Current command status:** none of these commands exists yet. The tooling change must define exact developer commands in CONTRIBUTING.md and docs/TESTING.md (update README.md only for installation or usage information users need) and configure equivalent CI checks. Do not invent passing commands, create placeholder tests to imply coverage, or claim the tooling portion of Phase 0 is complete.
- For documentation-only changes at this stage, check required files, relative links, consistency with the source plan and checkout, and whitespace. Report executable checks as unavailable, not passed.

## Documentation maintenance

- Keep README.md primarily for users: explain what iNoti is, who it helps, its intended use, availability, installation/usage when supported, and practical limitations/privacy. It is not a technical overview of the project.
- Put architecture, implementation plans, development setup, build/check commands, and contributor workflow in CONTRIBUTING.md or the relevant docs/ files. Keep links to these technical documents near the end of README.md. When simplifying the README, move useful technical information rather than discarding it.

- Update relevant documents alongside behavior, architecture, permissions, setup, testing, or user-facing changes, in the same commit where practical. Use the maintenance matrix in CONTRIBUTING.md.
- Keep evidence, proposals, accepted decisions, and implemented behavior distinct. Record unresolved research explicitly.
- If using an optional PR and documentation is not affected, mark it not applicable and explain why. Direct commits need no separate documentation-impact form.
- Report what changed, what was verified, and what remains unverified. Never infer live iClicker behavior from synthetic tests alone.
