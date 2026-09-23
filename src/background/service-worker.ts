import { isNewPollMessage } from '../shared/messages';
import { logger, safeError } from '../shared/logging';
import { parseRoute } from '../content/detector';
import type { NavigationChangedMessage } from '../shared/messages';

const log = logger('worker');
log('service worker started');

type NavigationDetails = { frameId: number; tabId: number; url: string; documentId?: string };

function forwardNavigation(details: NavigationDetails, source: 'history' | 'fragment') {
  // Filter before logging or extracting route data. API filters alone do not enforce origin.
  if (details.frameId !== 0 || details.tabId < 0) return;
  let url: URL;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }
  if (url.origin !== 'https://student.iclicker.com') return;

  log(`webNavigation ${source} update observed`, { frameId: 0, routeKind: 'student' });
  const message: NavigationChangedMessage = {
    type: 'NAVIGATION_CHANGED',
    hash: parseRoute(url.hash).state === 'UNSUPPORTED' ? '' : url.hash,
  };
  log('forwarding navigation update to content script');
  const failed = (error: unknown) => log('failed to forward navigation update', { reason: safeError(error) });
  try {
    // Target the originating document when available, so delayed events cannot reach a reload.
    const target = details.documentId ? { frameId: 0, documentId: details.documentId } : { frameId: 0 };
    void chrome.tabs.sendMessage(details.tabId, message, target).then((response: unknown) => {
      if (response && typeof response === 'object' && 'ok' in response && response.ok === true) {
        log('navigation update delivered');
      } else {
        log('failed to forward navigation update', { reason: 'content script did not acknowledge' });
      }
    }, failed);
  } catch (error) {
    failed(error);
  }
}

const navigationFilter = { url: [{ hostEquals: 'student.iclicker.com' }] };
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => forwardNavigation(details, 'history'), navigationFilter);
chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => forwardNavigation(details, 'fragment'), navigationFilter);

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
