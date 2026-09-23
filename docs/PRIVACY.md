# Privacy and permissions

## Status

This is the privacy contract for the planned MVP, not a claim about an implemented or audited extension. The repository currently contains documentation only: there is no running extension, manifest, storage implementation, or telemetry. Verify this document against the production build before release.

## Allowed reading and prohibited behavior

The planned content script may read only the confirmed iClicker student page signals necessary to identify a valid session, determine whether a question is answerable, and distinguish a genuinely new question from an already-notified one. Exact origins and selectors are still unverified.

- Do not collect or retain student answers, automate responses, or submit answers.
- Do not inspect unrelated websites, browsing history, or unrelated tabs' contents.
- Do not persist question text or answer choices. If a local content fingerprint is proven necessary, normalize/hash the minimum necessary content transiently and discard the source immediately; do not transmit it.
- Do not add analytics, remote reporting, or external transmission of observed page data as part of this MVP design.
- Do not place question text, answer content, or unnecessary student/session information in notifications or logs. Notifications contain a generic title and local detection time.

## Planned data handling

| Data | Purpose and planned location | Retention boundary |
| --- | --- | --- |
| Monitoring enabled, sound enabled | User preferences in `chrome.storage.local` by proposed decision | Persistent preferences; defaults/reset behavior to be documented when implemented |
| Minimal session/question identifiers or hashes | Duplicate suppression in `chrome.storage.session` | Ephemeral; exact expiry policy pending |
| Tab registry: tab ID, session key, state, last question key, update time | Coordinate monitored sessions in `chrome.storage.session` | Remove stale tab entries after closure/navigation; reconcile on restart |
| Notification-to-tab/window mapping | Focus correct existing tab/window on click | Ephemeral; remove stale target mappings |
| Raw question/choice text | Not stored; transient processing only if needed for an approved fingerprint | Discard after local calculation |
| Student answers, credentials, unrelated browsing | Never collected by iNoti | No storage or transmission |

Hashes and session identifiers are still data that should be minimized; hashing is not a reason to retain them indefinitely. Dedupe retention must be reconciled with session/tab cleanup to avoid replaying alerts. Full browser restart behavior is not equivalent to worker suspension and remains to be specified.

Cross-device sync is not selected. If `storage.sync` is adopted, update this document and README.md to explain that change before release. User-facing reset/removal instructions must be added and verified once storage exists.

## Permission plan

No permissions are currently requested. The future manifest must be checked against this table.

| Permission/access | Planned rationale and constraint |
| --- | --- |
| `storage` | Persist settings and ephemeral coordination/dedupe metadata |
| `notifications` | Create native new-question notifications and handle user interaction |
| Confirmed student origins only | Allow monitoring only where needed; exact host permissions and content-script matches await investigation |
| `offscreen` | Conditional: only if the validated sound implementation uses an offscreen document |
| `scripting` | Not planned when a statically declared content script is sufficient |
| `tabs` | Not a default; verify whether sender context, scoped host access, and ordinary tab/window operations satisfy focus and cleanup needs |
| `webRequest` | Not planned; require evidence that a necessary reliable signal cannot be obtained through the narrower design |
| `<all_urls>` | Outside the MVP's minimum-origin design |

Any new permission or host access requires a written reason, assessment of narrower alternatives, matching manifest/README/privacy changes, a [decision record](DECISIONS.md), and relevant tests. Do not add broad permissions just because an API namespace is used.

## Development evidence and release review

Use synthetic fixtures. Never commit secrets, captured student data, live session identifiers, or unnecessary production-page dumps. Debug logging should identify state transitions and missing signals without raw private content; production logging must be easy to disable.

Before release, inspect actual reads, message payloads, storage writes, log output, notification text, build assets, and permissions. Confirm no unrelated browsing access or answer submission and document exact retention/reset behavior. Follow the [release checklist](TESTING.md).
