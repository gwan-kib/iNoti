# Privacy and permissions

## Implemented Phase 1

iNoti reads only supported iClicker URL/hash routes. It never reads or persists question text, choices, responses, grades, student identity, or unrelated browsing, and does not submit answers.

The manifest requests no API permissions. The previous `notifications` permission has been removed. Static content-script access remains exactly `https://student.iclicker.com/*`. There are no separate host permissions, broad domains, storage, tabs, scripting, activeTab, alarms, offscreen, webRequest, or all-URLs access.

Creating an extension-owned popup with `chrome.windows.create` does not need broad tab-data access. No toolbar/action popup is declared. See D011 in [decisions](DECISIONS.md).

## Data flow and retention

- The content script holds only its previous normalized route/class ID in memory. Question IDs are validated, not retained.
- Messages contain only `NEW_POLL` and detection time; no class/question UUID or student information.
- The worker validates Chrome sender context without storing it or inspecting other tabs.
- The alert URL contains only `detectedAt`. The page validates it and renders text safely. It is visible in that alert's local address/DevTools context until closed; there is no extension-managed persistent storage or history.
- The title, detection time, and close control use bundled HTML/CSS/JS only. No external fonts, assets, telemetry, network requests, or backend are used.
- Development logs include state names, boolean decisions, known error categories, and optionally a window ID. They exclude URLs, UUIDs, arbitrary payloads/error text, and page content. Inspect logs before sharing them alongside other DevTools output.
- `DEBUG` in `src/shared/logging.ts` can disable diagnostics on rebuild.

Alerts may take focus, remain open until closed, and are not always-on-top. OS notification settings are not involved. Reloading/closing the student page discards detector state; disable/remove iNoti in `chrome://extensions` to stop future monitoring and close any existing alert windows separately.

## Future changes

Storage, sound, focus-iClicker actions, and multi-tab coordination remain deferred. New permissions need a written reason, narrower-alternative review, a decision, and matching manifest/README/privacy changes. Keep tests synthetic and never commit live identifiers or production-page dumps. Verify real-browser behavior using [testing](TESTING.md).
