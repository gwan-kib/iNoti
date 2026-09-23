# Architecture

## Implemented Phase 1

iNoti is a minimal Manifest V3 extension built with TypeScript and Vite, without a UI framework or runtime dependency.

| Component | Responsibility |
| --- | --- |
| `manifest.json` | Exact student-site static content-script match, webNavigation permission, classic worker, local icon; no action popup |
| `src/content/detector.ts` | Unchanged pure hash-route parser and same-class transition decision |
| `src/content/monitor.ts` | Per-page baseline, shared evaluation for hashchange/worker updates, diagnostic logs, one message per eligible transition |
| `src/shared/messages.ts` | Distinct validated `NEW_POLL` and `NAVIGATION_CHANGED` contracts |
| `src/shared/logging.ts` | Scope prefixes, development logging switch, safe API error categories |
| `src/background/service-worker.ts` | Filtered navigation forwarding, sender validation, popup creation, completion response |
| `src/alert/` | Local HTML/CSS, timestamp validation/rendering, own-window close button |

## Event flow

1. The top-frame content script starts at `document_start` on `https://student.iclicker.com/*`. It logs startup and the normalized baseline.
2. The worker registers `onHistoryStateUpdated` and `onReferenceFragmentUpdated` with a student-host filter. Before any event logging/forwarding, it requires frame 0, a valid tab target, and exact `https://student.iclicker.com` origin. It sends `{ type: 'NAVIGATION_CHANGED', hash }` to that top-frame content script, targeting the event's document ID when available to avoid delivery to a later reload. Unsupported routes become an empty hash marker; full URLs and arbitrary route data are not forwarded.
3. The content script validates the navigation contract and worker sender, then evaluates the hash through the same function used by `hashchange`. It logs source, previous/next states, and eligibility. Initial active and unsupported-to-active observations never alert. Unsupported-to-waiting establishes the baseline; only same-class waiting/closed to active sends `{ type: 'NEW_POLL', detectedAt }`. The first report advances state before sending, so an immediate duplicate from either source is active-to-active and emits nothing.
4. The worker validates NEW_POLL and Chrome sender (same extension, top frame, tab ID, exact origin). NAVIGATION_CHANGED is never a poll event, preventing feedback loops.
5. The worker calls `chrome.windows.create` with local `alert.html?detectedAt=<timestamp>`, `type: 'popup'`, width 400, height 180, and `focused: true`.
6. The worker logs success/window ID or safe failure and responds with `{ ok: true }` or `{ ok: false }`. Returning `true` keeps the response channel open. Forwarding has its own delivery acknowledgement/failure logs; failed delivery is not retried.
7. The unchanged alert validates its timestamp, renders local time using `textContent`, and closes only itself on the close button.

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

Owner-supplied Chrome evidence showed injection working, an initial UNSUPPORTED baseline, and visible navigation without hashchange logs. History API use is the likely explanation, not a directly observed implementation detail. Chrome webNavigation events now supplement hashchange; page History API methods are not patched. No DOM inspection, polling, or network interception is used. Live alert delivery must be re-tested. Settings, sound, click focus, identity, cross-tab coordination, storage, and recovery remain deferred. See [testing](TESTING.md), [privacy](PRIVACY.md), and [decisions](DECISIONS.md).
