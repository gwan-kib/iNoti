# Architecture

## Implemented Phase 1

iNoti is a minimal Manifest V3 extension built with TypeScript and Vite. No UI framework or runtime dependency is used.

| File | Responsibility |
| --- | --- |
| `manifest.json` | Notifications permission, exact student-site content-script match, classic service worker, local icon |
| `src/content/detector.ts` | Pure hash-route parser and same-class transition decision |
| `src/content/monitor.ts` | Startup baseline, hashchange events, one message per eligible transition |
| `src/shared/messages.ts` | Typed `NEW_POLL` contract and runtime payload validation |
| `src/background/service-worker.ts` | Sender validation, one native notification, completion response |
| `assets/icon-128.png` | Bundled original geometric bell icon |
| `tests/` | Synthetic route and transition cases, mocked content-script and Chrome boundaries |

## Event flow

1. A static top-frame content script starts at `document_start` on `https://student.iclicker.com/*`.
2. The initial hash establishes a baseline without notification, including when already on a poll.
3. Each `hashchange` event is parsed. Waiting or closed to active in the same class produces one `{ type: 'NEW_POLL', detectedAt }` message.
4. The worker validates the payload and Chrome sender: same extension, top frame, a tab ID, and exact supported origin. Tab identity comes only from Chrome; no tab ID is accepted in the message. The current route is not re-read in the worker because subsequent navigation may already have occurred.
5. The worker requests one basic native notification with the title **New iClicker Question**, local detection time, bundled icon, and `silent: true`.
6. The listener returns `true` to keep the asynchronous response channel open, then responds with success/failure. The content script logs only a generic delivery failure and does not retry.

The worker registers its listener synchronously on each start and keeps no session state. The content script stores only the previous normalized route in memory. Refresh creates a new baseline. Worker suspension therefore does not erase the content-script baseline, but full lifecycle reliability is not yet browser-verified.

## Build

`npm run build` runs two Vite library builds. Each emits a self-contained IIFE: static content scripts cannot rely on module imports, and the worker also uses a standalone classic script. The first build clears `dist/` and emits the manifest/icon; the second preserves those files and adds the worker.

```text
dist/
  manifest.json
  content.js
  background.js
  assets/icon-128.png
```

There is no HTML entry, popup, offscreen document, remote script, or web-accessible resource declaration. See [developer setup](../CONTRIBUTING.md).

## Later design directions, not implemented

The full MVP may add popup/settings, sound, click-to-focus, worker-owned cross-tab deduplication, storage, and recovery. A poll URL provides no question identity, so those features require explicit identity and lifecycle decisions. No registry, fingerprints, storage wrappers, or unused abstractions have been created in Phase 1.

Plain HTML/CSS remains the planned popup direction. An offscreen document remains conditional on later sound testing. See [roadmap](ROADMAP.md), [decisions](DECISIONS.md), and [privacy](PRIVACY.md).
