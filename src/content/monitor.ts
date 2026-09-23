import { isNewPoll, parseRoute } from './detector';
import { isNavigationChangedMessage } from '../shared/messages';
import { logger } from '../shared/logging';
import { createPipController, documentPip, type MonitoringStatus } from './pip-controller';
import { createMonitoringControl } from './monitoring-control';

const log = logger('content');
log('loaded');

// Startup on /poll is only a baseline, including after refresh.
let previous = parseRoute(window.location.hash);
let status: MonitoringStatus = { state: 'UNMONITORED', opening: false };
let suspended = false;
const control = createMonitoringControl(document, () => {
  if (suspended || previous.state === 'UNSUPPORTED') return;
  if (status.state !== 'UNMONITORED') controller.stop();
  else void controller.start();
});
const controller = createPipController(documentPip(window), (next) => {
  status = next;
  control.render(status);
});
control.render(status);
log('baseline state', { state: previous.state });

function syncControl() {
  if (suspended || previous.state === 'UNSUPPORTED') control.hide();
  else if (document.body) control.show();
}
// document_start can precede body creation; no DOM observer or polling is needed.
document.addEventListener('DOMContentLoaded', syncControl, { once: true });
syncControl();

function evaluateHash(hash: string, source: 'hashchange' | 'webNavigation') {
  if (suspended) return;
  const next = parseRoute(hash);
  const notify = isNewPoll(previous, next);
  log('navigation update received', { source, previous: previous.state, next: next.state, eligibleNewPoll: notify });
  if (next.state === 'UNSUPPORTED' || (previous.state !== 'UNSUPPORTED' && previous.classId !== next.classId)) {
    controller.stop();
  }
  previous = next;
  syncControl();
  if (next.state !== 'QUESTION_ACTIVE') controller.idle();
  else if (notify) controller.question(Date.now());
}

window.addEventListener('hashchange', (event) => {
  // Event URLs preserve the order of rapid, queued route changes.
  evaluateHash(new URL(event.newURL).hash, 'hashchange');
});
window.addEventListener('pagehide', () => {
  suspended = true;
  controller.stop();
  control.hide();
});
window.addEventListener('pageshow', () => {
  // A BFCache restore must also establish a fresh baseline and require a click.
  if (!suspended) return;
  suspended = false;
  previous = parseRoute(window.location.hash);
  syncControl();
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Only our worker may supply navigation state; page scripts cannot use this channel.
  if (sender.id !== chrome.runtime.id || sender.tab || !isNavigationChangedMessage(message)) {
    log('rejected navigation update');
    return false;
  }
  evaluateHash(message.hash, 'webNavigation');
  sendResponse({ ok: true });
  return false;
});
