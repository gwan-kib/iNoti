<p align="center">
  <img src="assets/inoti-logo.png" alt="iNoti logo" width="120" />
</p>

<h1 align="center">iNoti</h1>

iNoti is a Chrome extension that tells you the moment a new iClicker question opens, so you don't miss it while you're looking at another tab or window. It watches the iClicker class page you already have open, plays a short sound when a new poll appears, and can show an optional always-on-top notification window with the detected time, a live elapsed timer, and a shortcut back to your iClicker tab.

> **Install from the Chrome Web Store** — _link coming soon._
>
> Until the listing is live, you can build and load iNoti as an unpacked extension. See [Contributing](CONTRIBUTING.md) for the build commands.

## Why iNoti

iClicker questions open inside the class page, but you may be reading notes, a textbook, or another window when they appear. By the time you switch back, the poll may already be closed. iNoti runs quietly alongside the iClicker tab and alerts you as soon as a question starts.

## Features

- **Automatic monitoring.** While a supported iClicker class tab is open, iNoti starts monitoring by itself. There is no start button.
- **Sound alerts.** A short chime plays for each new question. Choose from six sounds and preview any of them from the popup.
- **Optional notification window.** A small, always-on-top window shows when iNoti detected the question, an elapsed timer, and, during a question, **Go to Question** and **Answered** controls. It is optional: monitoring and sound keep working when it is closed.
- **Question-ended notice.** When a question closes, the window shows the local end time and returns to waiting about two minutes later.
- **Alert animation.** The alert gently pulses by default, with an option for a solid background. System reduced-motion settings are respected.

## Installation

iNoti requires desktop Chrome 123 or newer.

- **Chrome Web Store:** link coming soon.
- **Unpacked build:** build the extension and load its `dist/` folder from `chrome://extensions` with Developer mode enabled. Build steps are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Using iNoti

1. Open `https://student.iclicker.com` and join a supported class. Monitoring starts automatically, and a small panel on the page confirms it.
2. When the class moves to a new question, iNoti plays the selected sound. If the notification window is open, it also shows the alert.
3. To add the visual alert, click **Open notification window** in the on-page panel. Close it from its own title bar whenever you like; monitoring, the sound, and the panel continue.
4. Answer questions in iClicker as usual. During an active alert, **Go to Question** focuses your iClicker tab without closing the window, and **Answered** returns the window to its waiting screen.
5. Open the iNoti toolbar icon (or the Settings gear in the panel on Chrome 127+) to change your preferences.

## Settings

| Setting                    | Default | What it does                                                                                     |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| **Pulse iNoti background** | On      | Animates the alert background; turn it off for a solid background. Reduced motion also disables it. |
| **Play sound**             | On      | Plays a chime for each new question. Turning it off keeps monitoring and visual alerts working.  |
| **Sound**                  | Default | Picks the chime: Default, Bubble, Locked, Motion detected, Chime, or Aura.                       |
| **Test sound**             | —       | Previews the selected sound.                                                                     |

Preferences are saved on this device and apply immediately.

## Permissions

iNoti requests only what it needs:

- **Site access** to `https://student.iclicker.com/*` and nothing else.
- **`webNavigation`** to observe iClicker's in-page route changes so new questions can be detected.
- **`storage`** to save your local preferences.
- **`offscreen`** to play the bundled notification sound.

It does not request `tabs`, `scripting`, `webRequest`, or broad host access. See [Privacy](docs/PRIVACY.md).

## Privacy

iNoti reads only iClicker URL/hash routes to recognize when a question starts. It never reads or stores question text, answer choices, your answers, grades, or unrelated browsing, and it never submits answers. Preferences stay local to your device and are not synced. The only external requests are the Google Fonts stylesheet and font used for interface icons; no iClicker data is sent. Full details are in [docs/PRIVACY.md](docs/PRIVACY.md).

## Known limitations

- Desktop Chrome 123 or newer, single iClicker tab.
- An already-active question present when the page loads is intentionally ignored as the baseline.
- Detection is route-based: an iClicker poll URL has no per-question ID, so revisiting an old poll can alert again, and a new question without a route change cannot be detected.
- Opening the notification window during an already-active question does not replay the alert or sound.
- Reloading the iClicker page resumes monitoring once the page loads; leaving the class or closing the tab stops it.
- Memory Saver, frozen or discarded pages, reconnects, and sound while the iClicker tab is backgrounded or Chrome is minimized are not verified across every system.
- Not implemented: volume control, quiz alerts, cross-tab deduplication, notification history/stacking, and session recovery.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the development workflow, build and test commands, and loading the unpacked extension.

## License

iNoti is released under the [MIT License](LICENSE).

## Documentation

- [Contributing](CONTRIBUTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Detection strategy](docs/DETECTION_STRATEGY.md)
- [Testing](docs/TESTING.md)
- [Privacy](docs/PRIVACY.md)
- [Architecture decisions](docs/DECISIONS.md)
