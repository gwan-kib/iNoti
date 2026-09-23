# Privacy and permissions

## Implemented Phase 1

The extension inspects only iClicker URL/hash routes on `https://student.iclicker.com`. It does not inspect question text, choices, selected answers, grades, student information, or unrelated browsing. It does not answer questions or submit anything.

| Permission/access | Reason |
| --- | --- |
| `notifications` | Create a native desktop notification for a supported poll transition |
| Static content-script match `https://student.iclicker.com/*` | Observe the student page's hash changes; manifest matching cannot select fragment routes |

There is no separate `host_permissions` entry: the static content-script declaration provides the required site scope. No `storage`, `tabs`, `scripting`, `activeTab`, `alarms`, `offscreen`, `webRequest`, broad domain access, or `<all_urls>` is requested. See D010 in [decisions](DECISIONS.md).

## Data flow and retention

- The content script holds the previous route state and normalized class ID in memory. Question IDs are validated only; no question content is read.
- The message contains only an event type and local detection timestamp. Class/question IDs and student data are not sent.
- The worker checks Chrome-provided sender context without storing it or reading other tabs.
- No extension storage, analytics, backend, or network transmission is implemented.
- Notifications contain a generic title and local time. Chrome/the OS controls their display and retention in notification history.
- Delivery errors produce a generic console warning without URL, identifiers, payload, or page content.

Closing/reloading the page discards its detector state. Disable or remove iNoti through `chrome://extensions` to stop monitoring. There are no saved extension settings to reset.

## Future changes

Storage, click focus, sound, and multi-tab coordination are deferred. Any new permission or host access needs a written reason, consideration of narrower alternatives, a decision record, and matching manifest/README/privacy updates. Never retain question text, answers, credentials, live session identifiers, or production-page dumps in tests or logs.

Before release, recheck the built manifest, reads, messages, logs, notification text, and assets against this document. Automated mocks do not establish browser privacy or notification behavior; follow [testing](TESTING.md).
