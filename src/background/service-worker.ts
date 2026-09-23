import { isNewPollMessage } from '../shared/messages';

function isSupportedSender(sender: chrome.runtime.MessageSender): boolean {
  if (sender.id !== chrome.runtime.id || sender.frameId !== 0
    || !Number.isInteger(sender.tab?.id) || !sender.url) return false;
  try {
    return new URL(sender.url).origin === 'https://student.iclicker.com';
  } catch {
    return false;
  }
}

// Register synchronously on every worker start; no worker-owned session state.
chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!isNewPollMessage(message) || !isSupportedSender(sender)) return false;

  void chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
    title: 'New iClicker Question',
    message: `Detected at ${new Date(message.detectedAt).toLocaleTimeString()}`,
    silent: true,
  }).then(
    () => sendResponse({ ok: true }),
    () => sendResponse({ ok: false }),
  );
  // Keep the response channel open until notification creation completes.
  return true;
});
