# Architecture

## Implemented Phase 1

iNoti is a minimal Manifest V3 extension built with TypeScript and Vite, without a UI framework or runtime dependency.

| Component | Responsibility |
| --- | --- |
| `manifest.json` | Exact student-site static content-script match, classic worker, local icon; no API permissions or action popup |
| `src/content/detector.ts` | Unchanged pure hash-route parser and same-class transition decision |
| `src/content/monitor.ts` | Startup baseline, hashchange events, diagnostic logs, one message per eligible transition |
| `src/shared/messages.ts` | Small `NEW_POLL` contract and runtime validation |
| `src/shared/logging.ts` | Scope prefixes, development logging switch, safe API error categories |
| `src/background/service-worker.ts` | Sender validation, popup creation, completion response |
| `src/alert/` | Local HTML/CSS, timestamp validation/rendering, own-window close button |

## Event flow

1. The top-frame content script starts at `document_start` on `https://student.iclicker.com/*`. It logs startup and the normalized baseline.
2. Initial active state never alerts. Each `hashchange` logs previous/next states and eligibility; only same-class waiting/closed to active produces `{ type: 'NEW_POLL', detectedAt }`.
3. The worker logs receipt, validates the payload and Chrome sender (same extension, top frame, a tab ID, exact origin), and logs acceptance or rejection category. It does not trust message-supplied tab identity.
4. The worker calls `chrome.windows.create` with local `alert.html?detectedAt=<timestamp>`, `type: 'popup'`, width 400, height 180, and `focused: true`.
5. The worker logs success/window ID or a safe failure category and responds with `{ ok: true }` or `{ ok: false }`. Returning `true` keeps the response channel open. The content script logs acknowledgement/failure without retry.
6. The alert logs load, validates its timestamp, and writes local time using `textContent`. Missing/invalid values display “Detection time unavailable” and are logged without echoing input. The close button calls `window.close()`, affecting only that alert.

The worker registers listeners synchronously and stores no session state. Its acknowledgement means the window API completed, not that HTML rendered; alert-page logs diagnose rendering separately. Content state advances before sending, preserving duplicate suppression even on delivery failure.

## Alert surface and build

The card has iNoti branding, title, time, and a close button. It stays open until closed. Focus is requested for visibility and can interrupt another app. This is a Chrome popup window, not a toolbar popup or OS always-on-top overlay. It does not depend on OS notification permission, banners, or Do Not Disturb. There is no positioning policy, stacking, auto-dismiss, sound, drag behavior, or settings.

`npm run build` performs two standalone IIFE builds for content/worker, then a Vite HTML build for the alert. Only the first stage clears output. All assets stay in `dist/`; the HTML references its generated local JS/CSS. MV3 uses external scripts, with no inline JavaScript/event handlers or external resources.

```text
dist/
  manifest.json
  content.js
  background.js
  alert.html
  assets/
    icon-128.png
    alert-<hash>.js
    alert-<hash>.css
```

## Diagnostics and deferred work

Logging is enabled through `DEBUG` in the shared logger. Logs contain normalized states, eligibility, event names, safe error categories, and optionally the created window ID. They never dump hashes, identifiers, sender objects, payloads, arbitrary error objects, or query strings.

Hashchange remains the only observer. Missing events during real usage are evidence for a separate fix; no History API, DOM, polling, or network fallback is included. Settings, sound, focus-iClicker behavior, question identity, cross-tab deduplication, storage, and recovery remain deferred. See [testing](TESTING.md), [privacy](PRIVACY.md), and [decisions](DECISIONS.md).
