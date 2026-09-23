import { isNewPoll, parseRoute } from './detector';
import type { NewPollMessage } from '../shared/messages';

// Startup on /poll is only a baseline, including after refresh.
let previous = parseRoute(window.location.hash);

window.addEventListener('hashchange', (event) => {
  // Event URLs preserve the order of rapid, queued route changes.
  const next = parseRoute(new URL(event.newURL).hash);
  const notify = isNewPoll(previous, next);
  previous = next;
  if (!notify) return;

  const message: NewPollMessage = { type: 'NEW_POLL', detectedAt: Date.now() };
  chrome.runtime.sendMessage(message, (response: unknown) => {
    if (chrome.runtime.lastError || !response || typeof response !== 'object'
      || !('ok' in response) || response.ok !== true) {
      // No retry: without question identity, retrying could duplicate an alert.
      console.warn('iNoti could not deliver a poll notification.');
    }
  });
});
