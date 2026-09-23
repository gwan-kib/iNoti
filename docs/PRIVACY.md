# Privacy and permissions

## Implemented Phase 1

iNoti reads only supported iClicker URL/hash routes. It never reads or persists question text, choices, responses, grades, student identity, or unrelated browsing, and does not submit answers.

The only API permission is `webNavigation`, added because real Chrome testing showed visible SPA navigation without hashchange events. This is a browser-wide capability; iNoti limits its use with student-host listener filters and immediate top-frame/exact `https://student.iclicker.com` origin checks before logging or forwarding. Other sites, subframes, HTTP, and non-default ports are ignored. No navigation history is stored or queried.

Static content-script access remains exactly `https://student.iclicker.com/*`. No notifications, separate host permissions, broad domain matches, storage, tabs, scripting, activeTab, alarms, offscreen, webRequest, or all-URLs access is requested. `chrome.tabs.sendMessage` targets the originating tab/frame/document without reading sensitive tab properties or requiring tabs permission.

Creating an extension-owned popup with `chrome.windows.create` does not need broad tab-data access. No toolbar/action popup is declared. See D011/D012 in [decisions](DECISIONS.md).

## Data flow and retention

- The content script holds only its previous normalized route/class ID in memory. Question IDs are validated, not retained.
- NEW_POLL carries only detection time. Worker-to-content NAVIGATION_CHANGED carries only a supported hash (which can contain class/question UUIDs) or an empty unsupported marker, transiently to the affected page. Full URL, query parameters, unrelated route data, and student content are not forwarded. Navigation payloads and Chrome document IDs are never logged or persisted.
- The worker validates Chrome sender context without storing it or inspecting other tabs.
- The alert URL contains only `detectedAt`. The page validates it and renders text safely. It is visible in that alert's local address/DevTools context until closed; there is no extension-managed persistent storage or history.
- The title, detection time, and close control use bundled HTML/CSS/JS only. No external fonts, assets, telemetry, network requests, or backend are used.
- Development logs include state names, boolean decisions, known error categories, and optionally a window ID. They exclude URLs, UUIDs, arbitrary payloads/error text, and page content. Inspect logs before sharing them alongside other DevTools output.
- `DEBUG` in `src/shared/logging.ts` can disable diagnostics on rebuild.

Alerts may take focus, remain open until closed, and are not always-on-top. OS notification settings are not involved. Reloading/closing the student page discards detector state; disable/remove iNoti in `chrome://extensions` to stop future monitoring and close any existing alert windows separately.

## Future changes

Storage, sound, focus-iClicker actions, and multi-tab coordination remain deferred. New permissions need a written reason, narrower-alternative review, a decision, and matching manifest/README/privacy changes. Keep tests synthetic and never commit live identifiers or production-page dumps. Verify real-browser behavior using [testing](TESTING.md).
