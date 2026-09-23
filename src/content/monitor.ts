import { isNewPoll, parseRoute } from './detector';
import type { NewPollMessage } from '../shared/messages';
import { logger, safeError } from '../shared/logging';

const log = logger('content');
log('loaded');

// Startup on /poll is only a baseline, including after refresh.
let previous = parseRoute(window.location.hash);
log('baseline state', { state: previous.state });

window.addEventListener('hashchange', (event) => {
  // Event URLs preserve the order of rapid, queued route changes.
  const next = parseRoute(new URL(event.newURL).hash);
  const notify = isNewPoll(previous, next);
  log('hashchange detected', { previous: previous.state, next: next.state, eligibleNewPoll: notify });
  previous = next;
  if (!notify) return;

  const message: NewPollMessage = { type: 'NEW_POLL', detectedAt: Date.now() };
  log('sending NEW_POLL');
  try {
    chrome.runtime.sendMessage(message, (response: unknown) => {
      const error = chrome.runtime.lastError;
      if (error || !response || typeof response !== 'object'
        || !('ok' in response) || response.ok !== true) {
        log('NEW_POLL delivery failed', { reason: error ? safeError(error) : 'worker rejected event or failed to create alert' });
        return;
      }
      log('NEW_POLL acknowledged by worker');
    });
  } catch (error) {
    // An extension reload can invalidate this content script before sendMessage.
    log('NEW_POLL delivery failed', { reason: safeError(error) });
  }
  // No retry: without question identity, retrying could duplicate an alert.
});
