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
