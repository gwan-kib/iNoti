# Development testing

This folder is for local testing evidence and notes that should not become production behavior.

## Built-in tester

1. Run `npm run build` and reload the unpacked `dist/` extension in Chrome.
2. Click the iNoti toolbar icon.
3. Click **Dev testing** in the popup.
4. Use the inline preview for quick visual state checks.
5. Click **Open PiP** to test the real shared Document Picture-in-Picture view, then drive **New Question**, **Idle**, **End Question**, and **Close PiP** manually. **End Question** shows the ended screen, which returns to waiting about two minutes later (a new question or **Close PiP** cancels that timeout).
6. Use the **Monitoring panel** section to check the on-page control in a mock page and force each state (Not monitoring, Monitoring, Opening, Unsupported, Failed).
7. Use the **Sound** section to load/save the real `soundEnabled` preference, pick a **Notification sound** (Default, Bubble, Locked, Motion detected, Chime, Aura), and click **Test sound**. This sends the production `NEW_QUESTION_DETECTED` request to the service worker, which plays the registered selected sound through the offscreen document when enabled. The saved preferences are shared with the popup and the worker.

The tester never sends synthetic route events to the iClicker content script, so it cannot prove live route detection, reconnect handling, or class compatibility. Its **Test sound** button does exercise the real service-worker → offscreen playback path; actual audible output and backgrounded/minimized behavior still require a real browser.

## Toggling the popup entry

`src/shared/dev-settings.ts` exports `DEV_TESTING_ENABLED`. It is `true` by default. Set it to `false` and the toolbar popup removes the **Dev tester** button from the DOM entirely (it is not merely hidden), so the popup cannot open the tester. Rebuild and reload the unpacked extension to apply the change.

## Console logs

The tester writes generic diagnostics as `[iNoti][dev]` in its DevTools console and mirrors them in the on-page event log. Production diagnostics remain `[iNoti][content]`, `[iNoti][worker]`, `[iNoti][pip]`, and `[iNoti][offscreen]`.

If you save console output, screenshots, or manual notes, put local captures under `dev-testing/logs/`. Everything in that folder is ignored by Git except `.gitkeep`.

Do not save or commit question text, answer choices, student answers, class/session identifiers, raw URLs containing identifiers, credentials, or other student data. Prefer short sanitized excerpts that show only state transitions and failure categories.
