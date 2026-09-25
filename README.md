# iNoti

iNoti is an early Chrome extension for students using iClicker. While a supported iClicker class/session tab is open, iNoti monitors it automatically and plays a short sound when the class moves into a new live poll. You can also open an optional Picture-in-Picture (PiP) notification window that shows **iClicker question detected** with the local detection time and an elapsed timer. The timer measures time since iNoti detected the question, not the instructor's exact start time.

Monitoring does not depend on the notification window. Closing that window only closes the visual surface; iNoti keeps listening for the next question as long as the iClicker tab stays open on a supported class.

## Availability and usage

This is an unpacked development version, not a Chrome Web Store release. Use desktop Chrome 123 or newer with Document Picture-in-Picture available. Real Chrome/iClicker verification of this monitoring experience is still pending.

1. Follow the [build and load-unpacked instructions](CONTRIBUTING.md).
2. Open one iClicker student tab and join a supported class. Monitoring starts automatically for that class; a sound plays on each genuinely new question while the tab stays open. Use the toolbar popup to turn **Play sound** off or on, choose a **Sound** from the dropdown (Default, Bubble, Pop, Success, Start, and Timer), and click **Preview sound** to preview the selected chime.
3. Optionally click **Open notification window** in the panel on the right side of the page to add the visual PiP surface. It starts with a Monitoring badge and a waiting status. Keep the iClicker page open so iNoti can detect new questions.
4. With the window open, a new supported poll transition displays the alert; closing/results or waiting after a detected question shows **Question ended** with an **Ended at** time. This is when iNoti detected the end, not the instructor's exact end time. That screen returns to the waiting screen about two minutes later, or sooner if the next question is detected or the window closes.
5. Close the notification window from its own title bar to remove the visual surface only; monitoring, the sound alert, and the panel continue. While the window is open the panel hides its button, so the window's title bar is the only close control. Leaving the class stops monitoring for that session.

The **Settings** gear button at the top right of the monitoring panel opens Alert Preferences in the toolbar popup on Chrome 127+. On older versions, or if opening fails, use the iNoti toolbar icon instead. Dismiss the guidance with its close button.

**Go to Question** appears during an active alert. Click it to focus the original iClicker tab while PiP stays open; the elapsed timer and monitoring continue. **Answered** appears beside it and returns PiP to its idle screen once you have answered; monitoring stays on and the next detected question alerts as usual.

Document PiP is an always-on-top browser surface. Chrome controls its position and may clamp its size; iNoti requests one small footprint for idle and alert content. Visibility across tabs, minimizing Chrome, and application switching must still be verified for this build on your system. If the API is unavailable, the panel says so and monitoring plus sound continue without a visual window. There is no separate-tab, popup-window, or native-notification fallback.

New-question alerts gently pulse by default: a soft lavender circle grows outward from the middle of the question title over the pink alert surface. Open the iNoti toolbar popup to turn off **Pulse background** for a solid soft pink alert, or turn off **Play sound**. Both preferences apply immediately and are saved on this device. System reduced-motion preferences also keep the background solid. Idle and ended screens do not pulse. The elapsed timer stops and hides when the question ends.

You still answer questions yourself in iClicker. Volume control, other settings, quiz alerts, and cross-tab deduplication are not implemented.

### Development tester

The unpacked development build includes a small toolbar popup with an **Dev tester** button. It opens an extension-owned tab where the idle and new-question PiP states can be previewed and the real PiP surface can be opened manually without joining an iClicker class. Use **Idle** to return both views to waiting, and toggle **Pulse new-question background** to preview a solid background. **New Question** also exercises the real sound path, so it plays the configured chime when **Sound notification** is enabled even with the window closed. The tester's **Sound** section shows and updates the same saved sound on/off and sound-choice preferences and has a **Test sound** button for the production playback path. This tester override lasts until the page reloads and does not change your saved toolbar preference. The tester is development tooling only: it verifies the alert UI/lifecycle in isolation and does not prove that live iClicker detection works.

## Privacy

iNoti uses static content-script access only to `https://student.iclicker.com/*` and the `webNavigation` permission for SPA route changes. The `storage` permission saves only your local preferences (pulse, sound on/off, selected sound id). The `offscreen` permission exists only to play the bundled notification sound through an audio offscreen document; no external audio is loaded. It reads routes, never question text, choices, answers, grades, or unrelated browsing. The notification window displays only generic status, local detection time, and elapsed time. The interface icons, including the panel settings gear, load from Google Fonts, requiring a network request to Google; the stylesheet request omits the page referrer. No telemetry, navigation history, or stored class/question data is added. Logs omit URLs and identifiers. See [privacy](docs/PRIVACY.md).

## Expected limitations

Use a single tab. An already-active question present when the page loads is intentionally ignored as a baseline. A poll URL has no question ID: revisiting an old poll can alert again, and a new question without a route change cannot be detected. Opening the notification window during an already-active question does not replay the alert or sound. Reloading the iClicker page ends monitoring until it loads again; leaving the class or closing the tab stops it. Memory Saver, frozen/discarded pages, reconnects, and rapid event ordering can affect delivery and remain unverified. Sound while the iClicker tab is in the background, Chrome is minimized, or another desktop application is active is an intended target but still needs real-Chrome verification; a discarded or frozen page may behave differently from an ordinary background tab.

## Project documentation

- [Contributing and developer setup](CONTRIBUTING.md)
- [Development roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Detection strategy](docs/DETECTION_STRATEGY.md)
- [Testing](docs/TESTING.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Agent instructions](AGENTS.md)
- [Changelog](CHANGELOG.md)
