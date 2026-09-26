# iNoti Privacy Policy

**Effective date:** September 25, 2026

iNoti is a Chrome extension that alerts users when a new answerable iClicker question becomes active. This Privacy Policy explains what information iNoti accesses, how that information is used, what is stored, and what is shared.

## Summary

iNoti is designed to minimize data access.

- iNoti only runs on `https://student.iclicker.com/*`.
- iNoti processes supported iClicker URL/hash routes locally to determine whether a class is waiting, a question is active, or a question has ended.
- iNoti does not read or store question text, answer choices, submitted answers, grades, student identity, or unrelated browsing activity.
- iNoti does not submit answers or otherwise act on a user's behalf in iClicker.
- iNoti does not use analytics, advertising, tracking, or developer-operated data collection servers.
- User preferences are stored locally on the user's device.

## Information iNoti accesses

### iClicker navigation information

To detect new questions, iNoti processes navigation changes on `student.iclicker.com`, including supported URL/hash routes. These routes may temporarily contain iClicker class or question identifiers.

This information is used only to determine the current iClicker state and whether a new question should trigger an alert.

iNoti does not store a browsing history, query Chrome's history database, or monitor navigation on unrelated websites.

### Extension preferences

iNoti stores the following preferences in `chrome.storage.local`:

- whether sound alerts are enabled;
- which bundled notification sound is selected; and
- whether the visual alert uses a pulsing background.

These settings remain on the user's device and are not synced by iNoti to an external server.

### Local alert timing

When a question is detected or ends, iNoti may use the local detection time to display the alert state and elapsed time in its notification window. These values are used locally and are not transmitted to the developer.

## Information iNoti does not collect

iNoti does not collect or store:

- names, email addresses, student numbers, or other identity information;
- passwords or authentication credentials;
- question text or answer choices;
- answers submitted by the user;
- grades or course results;
- personal communications;
- financial, health, or payment information;
- precise location information;
- keyboard input, mouse movement, scrolling activity, or general click activity;
- browsing activity outside the supported iClicker Student site; or
- analytics or advertising identifiers.

iNoti does not maintain user accounts or a developer-operated database.

## How information is used

The limited information processed by iNoti is used only to provide the extension's core functionality:

1. determine whether the user is on a supported iClicker class route;
2. detect a transition into a new answerable question;
3. play the user's selected notification sound;
4. update the optional visual notification window; and
5. remember the user's local extension preferences.

Information accessed for these purposes is not used for advertising, profiling, creditworthiness, lending, or any unrelated purpose.

## Browser permissions

iNoti requests only the permissions required for its functionality.

### Site access

iNoti's content script is limited to:

`https://student.iclicker.com/*`

This access allows iNoti to monitor supported iClicker class and question routes and display its monitoring interface. iNoti does not request access to all websites.

### `webNavigation`

The `webNavigation` permission is used to detect iClicker's single-page application route and fragment changes when ordinary page events are not sufficient.

Navigation events are filtered to the top-level `https://student.iclicker.com` origin before they are processed. iNoti does not store navigation history.

### `storage`

The `storage` permission is used only to save local extension preferences such as sound selection, sound enabled/disabled state, and the visual pulse setting.

### `offscreen`

The `offscreen` permission is used only to create a Manifest V3 audio playback document for bundled notification sounds.

The offscreen document receives only the selected sound identifier. It does not receive question text, answers, class content, or browsing history.

## Sound files

Notification sounds are bundled with the extension and loaded locally using Chrome extension URLs. iNoti does not download notification audio from an external service.

## Third-party resources

Some iNoti interface icons currently use Material Symbols Rounded loaded from Google Fonts through `fonts.googleapis.com` and `fonts.gstatic.com`.

As with normal requests to an external web service, these requests may expose standard network information such as the user's IP address to Google. The font request does not include iClicker question content, answers, class identifiers, or other iClicker data. iNoti also uses `referrerpolicy="no-referrer"` for these stylesheet requests.

Google's handling of requests to its services is governed by Google's own privacy policies.

Other than these font asset requests, iNoti does not send user or iClicker data to third-party services.

## Data sharing and sale

iNoti does not sell user data.

iNoti does not transfer user data to advertisers, data brokers, or other third parties for advertising, profiling, lending, or unrelated purposes.

iNoti does not use or transfer information for purposes unrelated to its single purpose of detecting new iClicker questions and alerting the user.

## Data retention

iNoti does not operate a server-side user database.

Extension preferences remain in Chrome's local extension storage until they are changed, cleared, or the extension is removed.

Supported iClicker route information is processed transiently while monitoring and is not retained as a browsing-history record by iNoti.

## Remote code

iNoti does not download or execute remote JavaScript or WebAssembly. Executable extension code is included in the extension package.

## Security and data minimization

iNoti is designed to minimize the information it accesses and stores. It restricts site access to the iClicker Student origin and avoids broad permissions such as access to all websites.

Logs are limited to normalized states, event names, boolean decisions, and safe failure categories. iNoti is designed not to log question content, answers, route payloads, or unnecessary student information.

## Chrome Web Store Limited Use

iNoti's use of information received from Chrome and Google APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Changes to this policy

This Privacy Policy may be updated when iNoti's functionality, permissions, or data practices change. Material changes will be reflected in this document and, where appropriate, in the extension's release documentation.

The effective date at the top of this page identifies the current version of the policy.

## Contact

Questions or concerns about iNoti's privacy practices can be submitted through the project's GitHub repository:

https://github.com/gwan-kib/iNoti/issues
