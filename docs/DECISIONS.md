# Architecture decisions

These records distinguish implemented choices from future directions. **Accepted direction does not mean browser-verified.** D009 defines route policy, D011 defines custom alerts, and D012 updates navigation observation/permissions. D005 and D010 record superseded native-delivery choices.

For each future record include an ID, status (proposed, accepted, or superseded), context, choice, alternatives, consequences, and evidence. Link an issue only if one exists. Update a record or supersede it when new evidence changes the choice.

## D001: Small MV3 extension with separated responsibilities

Status: accepted design direction; popup and coordination remain later work.

Reliable question alerts are the MVP. Use a content script for iClicker interpretation, a disposable service worker for coordination and delivery, and a popup for current status/settings. Use TypeScript, a lightweight build, and plain HTML/CSS instead of a UI framework for the small popup.

This keeps detector changes isolated and avoids depending on an open popup or long-lived worker globals. Cross-browser packaging and advanced notification UI remain deferred. Tooling is recorded in D008.

## D002: Evidence-based DOM observation first

Status: superseded by D009. The historical DOM-first strategy below is not used by Phase 1.

Prefer stable local identifiers, semantic attributes, and structural signals with narrow event-driven observation. Avoid generated CSS classes, continuous polling, and undocumented network APIs as the default.

DOM assumptions can still change, so centralize them, document observed evidence, and cover them with synthetic fixtures. Network inspection requires proof of a material reliability benefit and review of permission/coupling costs. No selector has been chosen.

## D003: Worker-owned cross-tab deduplication

Status: deferred hardening direction; no cross-tab gate is implemented in Phase 1.

Per-tab suppression alone cannot prevent two tabs from alerting for the same question. The worker owns a registry and a duplicate gate scoped by session/question identity. Store reconstructable runtime metadata in ephemeral extension storage to survive worker suspension.

Tests must cover concurrency, stale events, refresh/reconnect, and separate sessions. Identity derivation, expiry, and interrupted-delivery handling must be specified before implementation.

## D004: Persistent settings and ephemeral monitoring state

Status: proposed storage selection.

Use `chrome.storage.local` for monitoring/sound preferences and `chrome.storage.session` for registry, dedupe, and notification mappings. This separates user preferences from short-lived session data. Avoid sync unless cross-device settings are explicitly desired.

Never persist question text, choices, or student answers. Defaults, exact schemas, retention, and browser-restart behavior remain open. Selecting sync would require a privacy update because settings would no longer be local-only.

## D005: Native notifications for V1 (historical)

Status: superseded by D011; native delivery is no longer implemented.

Native notifications support alerting while another application is active. Keep them separate from detection and tie actions to session/question identity. Request interaction persistence where supported without promising OS-independent placement or duration.

Injected overlays work inside a page; positioned browser windows are not equivalent to desktop toasts. Arbitrary desktop overlays may require a native companion. Custom positioning is a separate post-MVP decision.

## D006: Offscreen audio only if testing supports it

Status: proposed; validation required.

Use an offscreen document with the `AUDIO_PLAYBACK` reason if it is the reliable choice for the bundled sound. Keep a small audio abstraction so a demonstrably simpler and equally reliable approach can replace it.

Adding `offscreen`, selecting the minimum Chrome version, and claiming reliable audio require lifecycle/browser evidence. No audio mechanism or asset is implemented; current HTML alerts have no sound.

## D007: Minimum permissions and no default discard override

Status: accepted constraints; current Phase 1 permissions are defined in D012. Storage and offscreen remain deferred.

Request only currently needed access: D011 removed notifications; D012 adds webNavigation specifically for SPA observation. Storage and offscreen require later implemented uses. Do not default to `<all_urls>`, `tabs`, `scripting`, or `webRequest`; document a specific unmet capability before adding a permission.

Do not disable tab discarding by default. If evidence justifies an active-session-only override, record the resource tradeoff, required access, cleanup/restoration behavior, and tests before adding it. See [privacy](PRIVACY.md).

## D008: Minimal Node, TypeScript, and Vite tooling

Status: accepted and implemented for Phase 0; hosted CI execution remains unverified.

Context: contributors need reproducible local checks and equivalent CI before application behavior exists. Phase 0 must not introduce an extension skeleton or fake tests.

Choice: Node 22.13+ within 22.x, selected by `.nvmrc`, with npm 10 or 11 and a committed npm lockfile. Use TypeScript 5.9, ESLint 10 with typescript-eslint, Vitest 5, and Vite 8. Exact direct dependency versions are pinned in `package.json`. TypeScript 5.9 stays within typescript-eslint's supported peer range. Use strict ES2022/bundler settings with DOM types and no compiler output. ESLint covers real configuration files and future source; Vitest runs once in Node with explicit imports. GitHub Actions runs the same scripts after `npm ci` and caches npm downloads.

Alternatives: a UI framework, extension-specific plugin, or monorepo would add unnecessary infrastructure. Vite supports the planned plain HTML/CSS and TypeScript direction. D010 now defines the revised Phase 1 packaging.

Consequences: production output remains `dist/`, ignored by Git. Phase 0 originally used `tooling/index.html` and allowed zero tests. Revised Phase 1 removes both, adds Chrome API types and real tests, and emits the MV3 package. The build target does not establish the minimum supported Chrome version.

Evidence: dependency compatibility was checked against npm metadata; [Vite's build documentation](https://vite.dev/guide/build) describes library builds. Local results and browser/hosted-CI limitations are recorded in [testing](TESTING.md).

## D009: Hash-route detection and initial baseline

Status: route policy accepted and implemented; hashchange-only observation is superseded by D012. Supersedes D002 and the investigation-spike prerequisite.

Context: the owner confirmed the student origin, waiting/poll/question hash routes, background route changes, and refresh retaining the poll route. The poll URL has no per-question UUID. See [route evidence](DETECTION_STRATEGY.md).

Choice: parse only confirmed UUID-shaped class routes; listen to `hashchange`. Initial state never alerts. Only same-class waiting/closed to active transitions produce candidates. Unsupported and quiz routes fail closed; changing directly into another class's poll does not establish a safe transition. The message carries only event type and detection time.

Alternatives: DOM mutation observation, text/selector heuristics, polling, network/API inspection, and WebSocket interception add complexity without a current need. None is used. Quiz IDs may represent an entire quiz; per-question quiz support is deferred.

Consequences: refresh avoids duplicate alerts, but an already-active question is intentionally missed on startup. Route-only detection cannot distinguish revisiting an old poll or new questions on an unchanged poll URL. Cross-tab deduplication and recovery remain deferred, not approximated with cooldown timers.

Evidence: supplied project observations and synthetic parser, transition, and content-script tests. Real-session behavior of this build remains unverified.

## D010: Minimal Phase 1 MV3 delivery and permissions (historical)

Status: delivery, permission, and packaging choices superseded by D011. The original decision below is retained as history, not current behavior.

Context: prove the smallest route-to-desktop-notification path before adding controls, audio, or lifecycle coordination.

Choice: static top-frame content script matching only `https://student.iclicker.com/*`, plus the `notifications` permission. No separate host permission, storage, tabs, scripting, activeTab, alarms, offscreen, webRequest, or broad origin access is needed. Chrome's [static content-script declarations](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) supply the site scope. The worker validates payload/sender and calls the [notifications API](https://developer.chrome.com/docs/extensions/reference/api/notifications) with a bundled icon, generic title, local time, and `silent: true`.

Alternatives: dynamic injection would require unnecessary permissions; popup, audio, storage, and a registry exceed this phase. A small two-stage Vite library build emits standalone IIFE scripts and copies the manifest/icon without an extension plugin. The infrastructure HTML entry is removed.

Consequences: one create request per accepted message, no retries, no click behavior, no stacking system, no persistent worker state. Chrome supplies notification IDs and controls display. Message completion keeps the response channel open; delivery failures return failure and produce a generic content-script warning. Multiple tabs can independently alert. The original bell icon is generated from simple geometry, with no external artwork or runtime asset fetch.

Evidence: mocked worker tests cover notification options, sender/payload rejection, and failed creation; build inspection checks referenced assets and scope. Loading unpacked and real notifications remain manual evidence requirements.

## D011: Custom HTML alert windows and development diagnostics

Status: custom alert delivery accepted and implemented; no-permission and hashchange-only assumptions superseded by D012. Supersedes native delivery in D005/D010. Actual alert delivery remains unverified.

Context: the owner wants a visible proof-of-concept alert independent of OS notification banners and detailed evidence of where route detection or delivery fails. Route parsing and hashchange observation remain unchanged.

Choice: open local `alert.html?detectedAt=<timestamp>` using `chrome.windows.create`, type popup, 400 by 180 pixels, focused. The page uses packaged HTML/CSS/JS, validates the timestamp, renders with textContent, and closes its own window on ×. It remains open until closed. This is not an action popup, OS overlay, or always-on-top window; focus stealing is intentional for this testing stage.

Permissions: remove notifications with no replacement API permissions. Keep only the exact student-site static content-script match. The [Chrome windows API](https://developer.chrome.com/docs/extensions/reference/api/windows) requires tabs permission for sensitive tab properties, not this window creation. No tab content inspection, storage, external resources, or telemetry is introduced.

Alternatives: native notifications remain subject to OS presentation and permissions. Injected page UI would not provide a separate window. Native companions, stacking, position controls, audio, and non-focus-stealing behavior exceed this proof of concept and remain deferred.

Diagnostics: `[iNoti][content]` covers startup, normalized route transition/eligibility, send/acknowledgement/failure. `[iNoti][worker]` covers startup, receipt, payload/sender validation, and window creation. `[iNoti][alert]` covers load, timestamp rendering/validation failure, missing elements, and close. A shared DEBUG switch is enabled. Only safe API failure categories are logged; arbitrary error objects may contain private URLs or data and are withheld. No raw hash, class/question UUID, sender object, payload, or query-string dump is logged.

Consequences: acknowledgement indicates window API completion, not page rendering. A third Vite HTML build packages the alert after the two script builds. Tests cover popup creation and failures, parsing/rendering/close, and logging privacy. Multiple alerts can remain open, without stacking or cross-tab coordination. Missing hashchange events must be diagnosed from real logs rather than hidden with a new observer.

Evidence: automated mocks and package inspection are documented in [testing](TESTING.md). Actual display, focus, and authenticated route behavior are not established by those checks.

## D012: Chrome navigation events forwarded to per-page state

Status: accepted and implemented in response to owner-supplied Chrome evidence; live alert delivery must be re-tested.

Context: content injection, baseline UNSUPPORTED at document_start, and worker startup were observed in real Chrome. Visible class-to-poll SPA navigation produced no hashchange log and no alert. History API navigation is a plausible explanation, not a directly verified site implementation detail.

Choice: add only `webNavigation`. Register onHistoryStateUpdated and onReferenceFragmentUpdated synchronously with a student-host filter. Immediately reject non-top frames, invalid tab targets, and any origin other than exact HTTPS student.iclicker.com before logging/processing. Forward a supported hash or empty unsupported marker with NAVIGATION_CHANGED to that tab's top frame and originating document when available. Full URLs and unknown route data never enter the payload.

The content script validates the message and extension sender, and shares one evaluateHash function with hashchange. Its existing per-page previous-route state remains authoritative. Unsupported-to-waiting updates baseline without alert; waiting/closed-to-active in the same class emits NEW_POLL. Unsupported-to-active and initial active remain silent. Consecutive duplicate source reports become active-to-active without cooldowns. The worker only accepts NEW_POLL for alert creation, avoiding a feedback loop.

Alternatives: worker-held transition state would be lost on suspension. Page History API patching, polling, DOM selectors, and WebSocket/API interception are unnecessary for this evidence-driven fix. No tabs, scripting, notifications, webRequest, storage, alarms, or broad host matches are added. The custom alert is unchanged.

Privacy and consequences: webNavigation is a broad browser capability, constrained here with event filters and exact runtime checks. No navigation history, raw URL/hash logs, identifiers in logs, page content, or telemetry. Hashes contain route identifiers transiently, only between worker and that page. Delivery failures are logged safely without retries. Document targeting avoids sending stale updates to a reloaded page; rapid cross-source ordering and real browser delivery remain manual verification items.

Evidence: [Chrome webNavigation documentation](https://developer.chrome.com/docs/extensions/reference/api/webNavigation) specifies history/fragment events and its permission; [tabs messaging](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-sendMessage) supports targeting content scripts. Tests cover filtering, forwarding, message validation, initial baseline recovery, duplicate source orders, and existing popup behavior. See [testing](TESTING.md).

## Decisions still required

- Per-question identity, cross-tab duplicate handling, and any future fingerprint policy.
- Monitoring re-enable, stale cross-tab event ordering, dedupe retention, and delivery retries.
- Setting defaults, supported OS matrix, and minimum Chrome version.
- Audio implementation, notification focus without broad `tabs` access, and any measured discard limitation.
