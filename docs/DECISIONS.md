# Architecture decisions

These records distinguish implemented choices from future directions. **Accepted direction does not mean browser-verified.** D009 defines route policy, D013 defines Document PiP monitoring, and D012 defines navigation observation/permissions. D011 records superseded popup delivery. D005 and D010 record superseded native-delivery choices.

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

## D006: Offscreen audio for the bundled notification sound

Status: accepted and implemented at the owner's request; real background/minimized reliability still requires manual verification. Implemented alongside D017.

Choice: play the notification sound through a Manifest V3 offscreen document created on demand with the `AUDIO_PLAYBACK` reason. Add only the `offscreen` permission. The worker never assumes the document persists: it checks `chrome.runtime.getContexts`, creates the document when absent, guards concurrent creation with one in-flight promise, and lets Chrome dispose it normally. The offscreen page resolves the file through `chrome.runtime.getURL` from the central `src/shared/sounds.ts` registry, stops any previous chime, and creates a fresh audio element per alert. `.wav`, `.mp3`, or any browser-supported file uses the same path. The `Audio`/URL boundary stays injectable so playback is unit-testable without real audio.

Permissions: `offscreen` is required because a service worker cannot play audio directly and the alert must work with no page/opener. No `tabs`, `scripting`, `webRequest`, `<all_urls>`, or external audio is used. Chrome 123 (the existing minimum) supports `runtime.getContexts` and `offscreen.createDocument`, so the minimum is unchanged.

Evidence: offscreen player, worker delivery, registry, and preference tests; build inspection confirms `offscreen/offscreen.js`, `offscreen/offscreen.html`, and the bundled sound asset. Actual playback while Chrome is backgrounded/minimized, OS audio routing, and discard behavior remain unverified in a real browser.

## D007: Minimum permissions and no default discard override

Status: accepted constraints; current Phase 1 permissions are defined in D012, D014, D016, and D017. Storage is implemented for local preferences; offscreen is implemented only for the bundled sound (D006).

Request only currently needed access: D011 removed notifications; D012 adds webNavigation for SPA observation; D014 adds storage for local preferences; D006/D017 add offscreen for the bundled notification sound. Do not default to `<all_urls>`, `tabs`, `scripting`, or `webRequest`; document a specific unmet capability before adding a permission.

Do not disable tab discarding by default. If evidence justifies an active-session-only override, record the resource tradeoff, required access, cleanup/restoration behavior, and tests before adding it. See [privacy](PRIVACY.md).

## D008: Minimal Node, TypeScript, and Vite tooling

Status: accepted and implemented for Phase 0; hosted CI execution remains unverified.

Context: contributors need reproducible local checks and equivalent CI before application behavior exists. Phase 0 must not introduce an extension skeleton or fake tests.

Choice: Node 22.13+ within 22.x, selected by `.nvmrc`, with npm 10 or 11 and a committed npm lockfile. Use TypeScript 5.9, ESLint 10 with typescript-eslint, Vitest 5, and Vite 8. Exact direct dependency versions are pinned in `package.json`. TypeScript 5.9 stays within typescript-eslint's supported peer range. Use strict ES2022/bundler settings with DOM types and no compiler output. ESLint covers real configuration files and future source; Vitest runs once in Node with explicit imports. GitHub Actions runs the same scripts after `npm ci` and caches npm downloads.

Alternatives: a UI framework, extension-specific plugin, or monorepo would add unnecessary infrastructure. Vite supports the planned plain HTML/CSS and TypeScript direction. D013 now defines the current Phase 1 delivery and packaging.

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

## D011: Custom HTML alert windows and development diagnostics (historical)

Status: superseded by D013 for delivery/build/lifecycle and D012 for navigation/permissions. The original popup-window decision below is retained as historical evidence.

Context: the owner wants a visible proof-of-concept alert independent of OS notification banners and detailed evidence of where route detection or delivery fails. Route parsing and hashchange observation remain unchanged.

Choice: open local `alert.html?detectedAt=<timestamp>` using `chrome.windows.create`, type popup, 400 by 180 pixels, focused. The page uses packaged HTML/CSS/JS, validates the timestamp, renders with textContent, and closes its own window on Ãƒâ€”. It remains open until closed. This is not an action popup, OS overlay, or always-on-top window; focus stealing is intentional for this testing stage.

Permissions: remove notifications with no replacement API permissions. Keep only the exact student-site static content-script match. The [Chrome windows API](https://developer.chrome.com/docs/extensions/reference/api/windows) requires tabs permission for sensitive tab properties, not this window creation. No tab content inspection, storage, external resources, or telemetry is introduced.

Alternatives: native notifications remain subject to OS presentation and permissions. Injected page UI would not provide a separate window. Native companions, stacking, position controls, audio, and non-focus-stealing behavior exceed this proof of concept and remain deferred.

Diagnostics: `[iNoti][content]` covers startup, normalized route transition/eligibility, send/acknowledgement/failure. `[iNoti][worker]` covers startup, receipt, payload/sender validation, and window creation. `[iNoti][alert]` covers load, timestamp rendering/validation failure, missing elements, and close. A shared DEBUG switch is enabled. Only safe API failure categories are logged; arbitrary error objects may contain private URLs or data and are withheld. No raw hash, class/question UUID, sender object, payload, or query-string dump is logged.

Consequences: acknowledgement indicates window API completion, not page rendering. A third Vite HTML build packages the alert after the two script builds. Tests cover popup creation and failures, parsing/rendering/close, and logging privacy. Multiple alerts can remain open, without stacking or cross-tab coordination. Missing hashchange events must be diagnosed from real logs rather than hidden with a new observer.

Evidence: automated mocks and package inspection are documented in [testing](TESTING.md). Actual display, focus, and authenticated route behavior are not established by those checks.

## D012: Chrome navigation events forwarded to per-page state

Status: navigation observation accepted and implemented; the NEW_POLL/custom-window delivery described below was superseded by D013. Live delivery still requires re-testing.

Context: content injection, baseline UNSUPPORTED at document_start, and worker startup were observed in real Chrome. Visible class-to-poll SPA navigation produced no hashchange log and no alert. History API navigation is a plausible explanation, not a directly verified site implementation detail.

Choice: add only `webNavigation`. Register onHistoryStateUpdated and onReferenceFragmentUpdated synchronously with a student-host filter. Immediately reject non-top frames, invalid tab targets, and any origin other than exact HTTPS student.iclicker.com before logging/processing. Forward a supported hash or empty unsupported marker with NAVIGATION_CHANGED to that tab's top frame and originating document when available. Full URLs and unknown route data never enter the payload.

The content script validates the message and extension sender, and shares one evaluateHash function with hashchange. Its existing per-page previous-route state remains authoritative. Unsupported-to-waiting updates baseline without alert; waiting/closed-to-active in the same class emits NEW_POLL. Unsupported-to-active and initial active remain silent. Consecutive duplicate source reports become active-to-active without cooldowns. The worker only accepts NEW_POLL for alert creation, avoiding a feedback loop.

Alternatives: worker-held transition state would be lost on suspension. Page History API patching, polling, DOM selectors, and WebSocket/API interception are unnecessary for this evidence-driven fix. No tabs, scripting, notifications, webRequest, storage, alarms, or broad host matches are added. The custom alert is unchanged.

Privacy and consequences: webNavigation is a broad browser capability, constrained here with event filters and exact runtime checks. No navigation history, raw URL/hash logs, identifiers in logs, page content, or telemetry. Hashes contain route identifiers transiently, only between worker and that page. Delivery failures are logged safely without retries. Document targeting avoids sending stale updates to a reloaded page; rapid cross-source ordering and real browser delivery remain manual verification items.

Evidence: [Chrome webNavigation documentation](https://developer.chrome.com/docs/extensions/reference/api/webNavigation) specifies history/fragment events and its permission; [tabs messaging](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-sendMessage) supports targeting content scripts. Tests cover filtering, forwarding, message validation, initial baseline recovery, duplicate source orders, and existing popup behavior. See [testing](TESTING.md).

## D013: User-started Document Picture-in-Picture monitoring

Status: accepted and implemented at the owner's request; real Chrome/iClicker validation pending. Supersedes D011 delivery/build/lifecycle and D012's NEW_POLL delivery path. D009 route policy and D012 navigation filtering remain unchanged. Superseded in part by D017, which makes monitoring independent of the window and redefines closing PiP as closing only the visual surface.

Context: a persistent small surface should show idle status and new questions while the student works in other tabs/applications. A normal popup window cannot provide the intended always-on-top behavior.

Choice: show Start Monitoring only on supported class/session routes. Its click calls documentPictureInPicture.requestWindow directly within the user-activation chain. No question event opens a window. A successful open starts idle; only later eligible route transitions show an alert. Question end returns the same PiP to idle. Closing PiP means stop monitoring; re-enable always requires a click. Session exit, class switch, and opener pagehide clean up, including pending opens.

The API provides always-on-top behavior and cannot outlive its opener. Chrome chooses placement and may clamp dimensions. Request 300 by 160 once for both minimal idle and compact alert content. Do not use arbitrary coordinates or automatic resizing; resizeTo/resizeBy require user activation. No separate-tab, Chrome popup, or native-notification fallback is offered. Unavailable API and opening failures leave monitoring inactive with a visible explanation.

Browser support: desktop Chrome 116 is the minimum for requestWindow with width/height and pagehide cleanup, reflected in the manifest. Runtime feature detection remains necessary. Newer optional placement/return-button features are not used. No permission is added; the narrow content match and webNavigation remain. The page owns the Window reference, not the disposable worker. No MAIN-world bridge, scripting permission, DOM detection, or page-content inspection is introduced.

Alternatives: opening on NEW_POLL violates the user-gesture requirement. Literal dot-sized windows and automatic expansion depend on browser sizing/activation constraints. Separate-tab/native/popup alternatives do not meet the requested experience. Cross-tab identity, sound, settings, and recovery are separate future work.

Consequences: refreshing requires another click and suppresses an initial active poll. PiP is same-origin with its opener and contains only generic status/local time. Always-on-top does not establish reliable execution under Memory Saver/discard. Control placement, isolated-world API availability, site CSP/style compatibility, background delivery, and tab/application switching need real unpacked-extension verification.

Evidence: [Chrome Document PiP documentation](https://developer.chrome.com/docs/web-platform/document-picture-in-picture) documents desktop support from Chrome 116, user activation, fixed initial dimensions, browser-controlled placement, opener lifetime, pagehide, and resize activation requirements. Synthetic tests cover lifecycle, UI rendering, safe failures, route safeguards, and source deduplication; they do not establish browser visibility. See [testing](TESTING.md).

## D014: Local alert-animation preference

Status: accepted and implemented at the owner's explicit request. Expands the popup scope only for pulse versus solid alert appearance.

Choice: active-question backgrounds gently pulse by default, using a 2.4-second CSS cycle in which a soft lavender circle grows outward from the middle of the question title over the pink alert surface and fades as it expands. The popup can disable motion, retaining a solid soft pink alert. System reduced-motion preferences also disable animation. Idle stays unchanged. Save only boolean `pulseAlerts` in `chrome.storage.local` and subscribe to local changes in open views. No session state is persisted, and the worker still only forwards navigation.

Permission reason: add `storage` to retain the preference across popup closure/browser restarts and share changes with content-owned PiP. Page localStorage would belong to iClicker and extension-page localStorage cannot directly serve content scripts; an in-memory setting would be lost. No tabs permission, broader hosts, sync, or student data is needed. See [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage).

Verification: automated settings and rendering coverage plus the [manual checks](TESTING.md). Actual animation, popup/PiP synchronization, and live iClicker behavior remain browser verification items.

## D015: Focus the opener while retaining PiP

Status: accepted and implemented at the owner's request. Active alerts expose Go to Question; idle and ended screens hide it. Use the opener's synchronous window.focus() within the click's user activation, without closing PiP or changing routes/state. Raise the Chrome minimum to 123 for this feature. No tabs permission or worker-mediated focus is needed. The tester focuses its own opener. Real Chrome focus and retained visibility require manual verification.

Evidence: [Chrome Document PiP documentation](https://developer.chrome.com/docs/web-platform/document-picture-in-picture#focus_the_opener_window) documents opener focusing from Chrome 123. This supersedes the deferred click-focus scope and Chrome 116 minimum of D013.

## D016: Manual answer returns PiP to idle

Status: accepted and implemented at the owner's request. Adds one control to the active alert only.

Choice: show Question Answered below Go to Question during an active question. The click calls `view.idle()` and moves the controller from MONITORING_QUESTION_ACTIVE to MONITORING_IDLE without stopping monitoring, closing PiP, or navigating. It is deliberately idle rather than ended so the next detected question stays eligible and the later route change to waiting/results does not synthesize an ended screen. Idle and ended screens hide the button, and the callback ignores the click unless a question is active and PiP is open.

Consequences: the manual answer is local to the PiP session; it does not submit, grade, or otherwise interact with iClicker, and no answer content is read or sent. The worker, detection, permissions, and storage are unchanged. Layout and readability of the second button require the existing manual browser checks.

## D017: Monitoring independent of the PiP window with one accepted new-question event

Status: accepted and implemented at the owner's request. Supersedes D013's "closing PiP stops monitoring" semantics and refines D014/D016 around the same PiP surface.

Context: the previous implementation treated opening PiP as starting monitoring and closing it as stopping monitoring, so no alerts (including sound) could occur while the window was closed. The product goal is the opposite: the window is an optional visual surface, and iNoti must keep listening for genuinely new questions whenever the extension is enabled and a supported iClicker session tab is open.

Choice: monitoring is page-owned and route-derived in `src/content/monitor.ts`. A supported class route on a live, non-suspended page is monitored automatically; the notification window is not a monitoring gate. The PiP controller keeps only presentation state (CLOSED/OPEN_IDLE/QUESTION_ACTIVE/QUESTION_ENDED) and its `open`/`close` methods are pure window lifecycle. The panel button toggles the window and its copy states that monitoring is independent of the window. Monitoring stops only on session-ending conditions: leaving the class/session, an unsupported route, opener pagehide, tab close, or disabling the extension.

Alert delivery has exactly one acceptance point: `isNewPoll` (same-class WAITING/QUESTION_CLOSED to QUESTION_ACTIVE). `createNewQuestionAlerts` fans that accepted event out to `requestNewQuestionSound()` and to the optional window. The sound request carries only `NEW_QUESTION_DETECTED`; the worker owns the enabled preference and the registered sound id and forwards only `PLAY_SOUND` with a registry id to the offscreen document. There is no separate sound dedupe, so one genuine question yields at most one sound request and at most one window transition. Baselines, waiting/ended transitions, duplicates, unsupported routes, leaving a class, opening/closing the window, and opening the window during an already-active question produce no sound.

Preferences: local `soundEnabled` (default true) and `selectedSoundId` (default `DEFAULT_SOUND_ID`) in `chrome.storage.local`, with malformed/unknown values falling back safely. Disabling sound does not disable monitoring or visual alerts and does not create an offscreen document. The popup (and the dev tester) renders a **Notification sound** dropdown from `SOUND_OPTIONS` and writes only registered ids; four bundled sounds ship (Default Chime, Soft Bell, Bright Ping, Calm Echo). The popup's **Play test sound** sends a separate `PREVIEW_SOUND` request that plays the selected sound through the same offscreen path even when `soundEnabled` is off, because it is an explicit user preview rather than a question alert. Volume control and arbitrary user-uploaded audio remain out of scope.

Alternatives: keeping the window as the monitoring switch (rejected — defeats the required behavior); a separate sound-specific dedupe path (rejected — risks sound and PiP disagreeing); native notifications or external audio (out of scope and privacy-negative); picking sounds from arbitrary user storage (rejected — paths must come only from the registry).

Consequences: the panel shows an Open notification window button that is removed while the window is open, plus monitoring-first copy. `minimum_chrome_version` stays 123 (getContexts/offscreen are supported). Sound while the iClicker tab is backgrounded or Chrome is minimized is an intended target but must be manually verified; a discarded/frozen page is a separate lifecycle concern and is not conflated with ordinary background tabs.

Evidence: automated tests cover monitoring/window separation, the single acceptance point and duplicate suppression, registry and preference fallback, worker offscreen lifecycle and disabled-sound skip, and offscreen playback/replay/rejection. Live browser, background/minimized, and Memory Saver checks remain manual.

## D018: Ended screen returns to idle after two minutes

Status: accepted and implemented at the owner's request.

Choice: when a question ends and the notification window is open, the ended screen starts a fixed two-minute timer (`QUESTION_END_IDLE_MS` in `src/content/pip-controller.ts`). On expiry the controller calls `view.idle()` and moves to the idle window state, logging `PiP -> idle after end timeout`. The timer is cleared by a new question, a manual answer, an explicit idle, a close, and window pagehide, so it cannot override a newer state or fire against a closed window. Duplicate end reports do not restart it because `ended()` only acts from the active state.

Consequences: the ended screen is no longer persistent; the window returns to the waiting screen about two minutes after the end was detected. Monitoring, sound, the elapsed timer, and manual-answer behavior are unchanged. The duration is fixed with no setting. Real timing/screenshot verification remains manual.

## Decisions still required

- Per-question identity, cross-tab duplicate handling, and any future fingerprint policy.
- Stale cross-tab event ordering, dedupe retention, and delivery retries.
- Persistent preference defaults and the supported OS verification matrix.
- Measured background/minimized audio, OS audio routing, and discard limitations.
