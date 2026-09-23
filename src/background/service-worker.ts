import { isNewPollMessage } from '../shared/messages';
import { logger, safeError } from '../shared/logging';

const log = logger('worker');
log('service worker started');

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
  log('message received', { type: isNewPollMessage(message) ? 'NEW_POLL' : 'unrecognized' });
  if (!isNewPollMessage(message)) {
    log('rejected message: invalid payload');
    return false;
  }
  if (!isSupportedSender(sender)) {
    log('rejected message: unsupported sender');
    return false;
  }
  log('sender accepted');

  log('creating alert window');
  const failed = (error: unknown) => {
    log('failed to create alert window', { reason: safeError(error) });
    sendResponse({ ok: false });
  };
  try {
    void chrome.windows.create({
      url: chrome.runtime.getURL(`alert.html?detectedAt=${message.detectedAt}`),
      type: 'popup', width: 400, height: 180,
      // Visibility first for this proof of concept; this can take focus from another app.
      focused: true,
    }).then((created) => {
      log('alert window created', { windowId: created?.id });
      sendResponse({ ok: true });
    }, failed);
  } catch (error) {
    failed(error);
  }
  // Keep the response channel open until window creation completes.
  return true;
});
