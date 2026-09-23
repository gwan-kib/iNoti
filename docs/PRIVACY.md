# Privacy and permissions

## Scope

iNoti reads only supported iClicker URL/hash routes. It never reads or persists question text, choices, responses, grades, student identity, or unrelated browsing, and does not submit answers.

The sole API permission remains `webNavigation`, needed because observed SPA navigation did not consistently emit hashchange. It is a browser-wide capability constrained here by student-host filters and immediate top-frame/exact `https://student.iclicker.com` origin checks before logging or forwarding. Other origins, subframes, HTTP, and non-default ports are ignored. No navigation history is stored or queried.

Static content-script access is exactly `https://student.iclicker.com/*`. No notifications, tabs, scripting, activeTab, webRequest, storage, offscreen, broad hosts, or separate host permissions are added. tabs.sendMessage targets a document without accessing sensitive tab properties. Document PiP is a web-platform API requiring a user gesture, not a new extension permission. See D012/D013 in [decisions](DECISIONS.md).

## Data flow and retention

- The page holds its previous normalized route/class ID and monitoring state in memory. Question IDs are validated, not retained in normalized state.
- NAVIGATION_CHANGED transiently carries a supported hash (possibly containing class/question UUIDs) or an empty marker to the originating page. The content receiver validates the extension sender. Payloads and document IDs are never logged or persisted.
- The worker has no alert receiver or session registry. NEW_POLL messaging is removed.
- PiP receives generic idle/active display calls and local detection time only. Text is rendered with textContent; no question content, identifiers, external fonts, network requests, or telemetry are introduced.
- PiP shares the opener's origin. It is not an extension-origin privacy boundary and must never contain secrets. No alert query URL or extension-managed persistent storage is used.
- Closing PiP, leaving the class, or destroying the opener ends monitoring. A refresh requires a fresh Start Monitoring click. The active control also stops monitoring.
- Logs contain normalized states, event names, boolean decisions, and safe failure categories only. DEBUG in the shared logger can disable them. Inspect other DevTools output before sharing evidence.

## Remaining work

Memory Saver/discard, background detection, real layout, and application-switch visibility require the [manual matrix](TESTING.md). No automatic discard override or recovery is implemented. Storage, sound, focus actions, and cross-tab coordination remain deferred. Any new permission requires a written reason, narrower-alternative review, a decision, and matching manifest/README/privacy changes. Keep fixtures synthetic.
