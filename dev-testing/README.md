# Development testing

This folder is for local testing evidence and notes that should not become production behavior.

## Built-in tester

1. Run `npm run build` and reload the unpacked `dist/` extension in Chrome.
2. Click the iNoti toolbar icon.
3. Click **Open Dev Tester**.
4. Use the inline preview for quick visual state checks.
5. Click **Open PiP** to test the real shared Document Picture-in-Picture view, then drive **New Question**, **Return to Idle**, and **Stop PiP** manually.

The tester does not talk to the iClicker content script or service worker, so it cannot prove live route detection, background delivery, reconnect handling, or class compatibility.

## Console logs

The tester writes generic diagnostics as `[iNoti][dev]` in its DevTools console and mirrors them in the on-page event log. Production diagnostics remain `[iNoti][content]`, `[iNoti][worker]`, and `[iNoti][pip]`.

If you save console output, screenshots, or manual notes, put local captures under `dev-testing/logs/`. Everything in that folder is ignored by Git except `.gitkeep`.

Do not save or commit question text, answer choices, student answers, class/session identifiers, raw URLs containing identifiers, credentials, or other student data. Prefer short sanitized excerpts that show only state transitions and failure categories.
