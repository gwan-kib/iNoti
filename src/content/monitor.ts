import { isNewPoll, parseRoute, type Route } from './detector';
import { isNavigationChangedMessage } from '../shared/messages';
import { logger } from '../shared/logging';
import { createPipController, documentPip, type PipStatus } from './pip-controller';
import { createMonitoringControl, type MonitoringPanelStatus } from './monitoring-control';
import { createNewQuestionAlerts } from '../shared/new-question';
import { requestNewQuestionSound } from '../shared/sound-request';

const log = logger('content');
log('loaded');

// Monitoring is page-owned and automatic: while this page is on a supported
// class route it keeps observing, whether or not the notification window is
// open. The window is an optional visual surface, not a monitoring switch.
let previous: Route = parseRoute(window.location.hash);
let suspended = false;
let pipStatus: PipStatus = { state: 'CLOSED', opening: false };

function panelStatus(): MonitoringPanelStatus {
  return { monitoring: !suspended && previous.state !== 'UNSUPPORTED', pip: pipStatus };
}

const controller = createPipController(documentPip(window), (next) => {
  pipStatus = next;
  control.render(panelStatus());
});

const control = createMonitoringControl(document, () => {
  if (suspended || previous.state === 'UNSUPPORTED') return;
  // The button only opens or closes the visual window; monitoring continues.
  if (pipStatus.state !== 'CLOSED') controller.close();
  else void controller.open();
});

const alerts = createNewQuestionAlerts({
  requestSound: () => requestNewQuestionSound(),
  showQuestion: (detectedAt) => controller.question(detectedAt),
  showEnded: (endedAt) => controller.ended(endedAt),
});

control.render(panelStatus());
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
  const accepted = isNewPoll(previous, next);
  log('navigation update received', { source, previous: previous.state, next: next.state, eligibleNewPoll: accepted });
  if (next.state === 'UNSUPPORTED' || (previous.state !== 'UNSUPPORTED' && previous.classId !== next.classId)) {
    // Leaving the class/session ends the old session and closes its window; a
    // supported replacement session stays monitored without a new user action.
    controller.close();
  }
  previous = next;
  syncControl();
  if (accepted) alerts.accepted(Date.now());
  else if (next.state === 'WAITING' || next.state === 'QUESTION_CLOSED') alerts.ended(Date.now());
  control.render(panelStatus());
}

window.addEventListener('hashchange', (event) => {
  // Event URLs preserve the order of rapid, queued route changes.
  evaluateHash(new URL(event.newURL).hash, 'hashchange');
});
window.addEventListener('pagehide', () => {
  suspended = true;
  controller.close();
  control.hide();
});
window.addEventListener('pageshow', () => {
  // A BFCache restore re-establishes the route baseline; monitoring resumes for
  // a supported route without reopening the window.
  if (!suspended) return;
  suspended = false;
  previous = parseRoute(window.location.hash);
  syncControl();
  control.render(panelStatus());
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
