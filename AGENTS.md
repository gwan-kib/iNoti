# Agent instructions

## Scope and priorities

- Read README.md and the relevant technical documents before changes. Phase 1 uses route detection and user-started Document Picture-in-Picture monitoring; distinguish automated results from unverified browser behavior and later features.
- Stay inside the MVP unless the project owner explicitly authorizes post-MVP work. An issue is not required. Question detection, duplicate prevention, and recovery take priority over UI polish.
- Inspect the checkout and existing changes before editing. Preserve unrelated work and keep changes focused on the requested task.
- Follow CONTRIBUTING.md for the solo workflow: work on `main` by default, keep changes focused, validate, and update documentation. Do not require individual issues, feature branches, or PRs; use them only when requested or useful.

## Architecture rules

- Keep iClicker route parsing centralized in `src/content/detector.ts`; use the confirmed route evidence in docs/DETECTION_STRATEGY.md. The previous live investigation spike is superseded.
- Use filtered webNavigation history/fragment events plus `hashchange`, feeding one content-script evaluation function. Keep previous-route state in the page, not the disposable worker. Initial active routes establish a baseline; only same-class waiting/closed to active transitions notify.
- Do not invent DOM selectors or add DOM observation, polling, or network/WebSocket interception without new evidence and authorization.
- Keep Chrome APIs at component boundaries and notification delivery out of the detector. Phase 1 is single-tab only; do not prematurely add question fingerprints or cross-tab registries.
- Treat the worker as disposable and register listeners synchronously. It currently stores no session state. Session storage/recovery, broader toolbar settings, sound, click focus, and quiz support remain later work. The owner-authorized popup pulse preference saves only a local boolean and updates open PiP views; the dev-tester link remains development tooling.
- Use one user-started Document PiP surface owned by the page. Never open PiP from question events; close means stop monitoring. Use a fixed requested footprint, no positioning/automatic resize or fallback alerts. Only webNavigation and storage are requested; storage is limited to the alert-animation preference. The toolbar popup must not add broad tabs permission.
- Keep `[iNoti][content]`, `[iNoti][worker]`, and `[iNoti][pip]` logs useful and private: source, normalized states, boolean decisions, failure categories only. Never dump raw hashes, sender objects, payloads, or arbitrary errors. Filter navigation to top-frame exact `https://student.iclicker.com` before logging/forwarding; do not collect history or add speculative observers.

## UI styling

- Use `rem` instead of `px` for static CSS lengths, including font sizes, spacing, borders, shadows, dimensions, and media-query breakpoints. Convert existing pixel values using 16px = 1rem; do not fix the root font size in pixels. Keep unitless zero/line-height and responsive units such as `%`, `vw`, `vh`, and `em` where appropriate. Define the requested PiP footprint in rem and convert it to numeric CSS pixels at the browser API boundary using the opener root font size. Runtime viewport measurements remain in CSS pixels for an exact PiP/preview size match; document these exceptions.

- Define reusable colors in `src/shared/brand-colors.css` as named CSS custom properties. Whenever possible, use these variables in surface styles instead of hardcoding hex, RGB/HSL, or named colors elsewhere. Add new palette entries there, including shadow colors; keep the shared palette available in extension pages, PiP documents, and isolated shadow roots.

- Keep each surface's static styles in its own CSS file, including the popup and PiP. Whenever possible, do not write CSS inline in HTML, style attributes, or TypeScript template strings. Dynamic measured dimensions may be set in code. For dynamic PiP documents or shadow roots, inject CSS imported from a separate file when needed and explain why.
- Keep semantic elements such as headings and buttons, but wrap independently styled text in a named span or div (use spans inside headings, paragraphs, and buttons). Use descriptive classes for text size, color, and other visual edits instead of relying only on generic h1 or p selectors. A named div already containing text can serve as its own wrapper.

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
- For documentation-only changes, check required files, relative links, consistency with the revised roadmap and checkout, and whitespace. Report browser checks not run with the concrete environment limitation; mocks and the development tester do not establish live iClicker compatibility.

## Documentation maintenance

- Keep README.md primarily for users: explain what iNoti is, who it helps, its intended use, availability, installation/usage when supported, and practical limitations/privacy. It is not a technical overview of the project.
- Put architecture, implementation plans, development setup, build/check commands, and contributor workflow in CONTRIBUTING.md or the relevant docs/ files. Keep links to these technical documents near the end of README.md. When simplifying the README, move useful technical information rather than discarding it.

- Update relevant documents alongside behavior, architecture, permissions, setup, testing, or user-facing changes, in the same commit where practical. Use the maintenance matrix in CONTRIBUTING.md.
- Keep evidence, proposals, accepted decisions, and implemented behavior distinct. Record unresolved research explicitly.
- If using an optional PR and documentation is not affected, mark it not applicable and explain why. Direct commits need no separate documentation-impact form.
- Report what changed, what was verified, and what remains unverified. Never infer live iClicker behavior from synthetic tests alone.
