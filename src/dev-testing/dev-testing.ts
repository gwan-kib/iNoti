import { createPipController, documentPip, type MonitoringStatus } from '../content/pip-controller';
import { createPipView } from '../content/pip-view';
import { createMonitoringControl } from '../content/monitoring-control';
import { watchPulsePreference } from '../shared/alert-preference';
import { PIP_DIMENSIONS_REM } from '../shared/pip-dimensions';
import { followPipSize } from './preview-size';

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing dev tester element: ' + id);
  return element as T;
}

function statusText(status: MonitoringStatus, supported: boolean) {
  if (!supported) return 'PiP: unavailable in this extension page';
  if (status.opening) return 'PiP: opening…';
  if (status.issue === 'failed') return 'PiP: opening failed — retry from Open PiP';
  if (status.state === 'MONITORING_IDLE') return 'PiP: open — idle';
  if (status.state === 'MONITORING_QUESTION_ENDED') return 'PiP: open — question ended';
  if (status.state === 'MONITORING_QUESTION_ACTIVE') return 'PiP: open — question active';
  return 'PiP: available — not open';
}

function initDevTester() {
  const statusElement = required<HTMLElement>('pip-status');
  const logElement = required<HTMLOListElement>('event-log');
  const previewFrame = required<HTMLIFrameElement>('preview');
  previewFrame.style.width = `${PIP_DIMENSIONS_REM.width}rem`;
  previewFrame.style.height = `${PIP_DIMENSIONS_REM.height}rem`;
  const previewDocument = previewFrame.contentDocument;
  if (!previewDocument) throw new Error('Inline preview document unavailable');

  const pulseToggle = required<HTMLInputElement>('pulse-alerts');
  let pipView: ReturnType<typeof createPipView> | undefined;
  const preview = createPipView(previewDocument, () => window.focus(), () => {
    preview.idle();
    controller.answered();
    appendLog('question answered');
  });
  preview.idle();
  const applyPulse = () => {
    preview.setPulseEnabled(pulseToggle.checked);
    pipView?.setPulseEnabled(pulseToggle.checked);
  };
  // Follow the saved preference until this tester explicitly overrides it.
  // The override is session-only and never changes the production preference.
  const unwatchPulse = watchPulsePreference(enabled => {
    pulseToggle.checked = enabled;
    applyPulse();
  });
  window.addEventListener('pagehide', unwatchPulse, { once: true });
  pulseToggle.addEventListener('change', () => {
    unwatchPulse();
    applyPulse();
  });

  const api = documentPip(window);
  let current: MonitoringStatus = { state: 'UNMONITORED', opening: false };
  const appendLog = (event: string, details?: Record<string, string | number | boolean>) => {
    const time = new Date().toLocaleTimeString();
    const summary = details ? ' ' + JSON.stringify(details) : '';
    const item = document.createElement('li');
    item.textContent = time + ' ' + event + summary;
    logElement.append(item);
    logElement.scrollTop = logElement.scrollHeight;
    console.info('[iNoti][dev] ' + event, details ?? {});
  };
  const renderStatus = () => { statusElement.textContent = statusText(current, Boolean(api)); };

  // Render the real on-page control inside a mock page in its own document, so
  // each monitoring state can be inspected without an iClicker tab.
  const panelFrame = required<HTMLIFrameElement>('panel-preview');
  const panelDocument = panelFrame.contentDocument;
  if (!panelDocument) throw new Error('Monitoring panel preview document unavailable');
  const panelControl = createMonitoringControl(panelDocument, () => appendLog('monitoring panel toggle clicked'));
  panelControl.show();
  panelControl.render(current);
  const showPanelState = (status: MonitoringStatus, state: string) => {
    panelControl.render(status);
    appendLog('monitoring panel state', { state });
  };

  let stopFollowingSize: (() => void) | undefined;
  const controller = createPipController(api, (next) => {
    if (next.state === 'UNMONITORED') {
      pipView = undefined;
      stopFollowingSize?.();
      stopFollowingSize = undefined;
    }
    current = next;
    renderStatus();
    panelControl.render(next);
    appendLog('PiP state changed', { state: next.state, opening: next.opening, issue: next.issue ?? 'none' });
  }, (pipDocument, onAnswered) => {
    const view = createPipView(pipDocument, () => window.focus(), () => {
      preview.idle();
      onAnswered();
    });
    pipView = view;
    applyPulse();
    if (pipDocument.defaultView) {
      stopFollowingSize = followPipSize(previewFrame, pipDocument.defaultView);
    }
    return view;
  });

  renderStatus();
  appendLog('tester loaded', { documentPipAvailable: Boolean(api) });

  required<HTMLButtonElement>('open-pip').addEventListener('click', () => {
    preview.idle();
    appendLog('Open PiP requested');
    void controller.start();
  });

  required<HTMLButtonElement>('idle').addEventListener('click', () => {
    preview.idle();
    controller.idle();
    appendLog('simulated idle');
  });

  required<HTMLButtonElement>('question').addEventListener('click', () => {
    const detectedAt = Date.now();
    preview.question(detectedAt);
    controller.question(detectedAt);
    appendLog('simulated question active', { pipWasOpen: current.state !== 'UNMONITORED' });
  });

  required<HTMLButtonElement>('ended').addEventListener('click', () => {
    const endedAt = Date.now();
    preview.ended(endedAt);
    controller.ended(endedAt);
    appendLog('simulated question ended');
  });

  required<HTMLButtonElement>('stop').addEventListener('click', () => {
    preview.idle();
    controller.stop();
    appendLog('stop requested');
  });

  required<HTMLButtonElement>('panel-unmonitored').addEventListener('click', () =>
    showPanelState({ state: 'UNMONITORED', opening: false }, 'not monitoring'));
  required<HTMLButtonElement>('panel-idle').addEventListener('click', () =>
    showPanelState({ state: 'MONITORING_IDLE', opening: false }, 'monitoring'));
  required<HTMLButtonElement>('panel-opening').addEventListener('click', () =>
    showPanelState({ state: 'UNMONITORED', opening: true }, 'opening'));
  required<HTMLButtonElement>('panel-unsupported').addEventListener('click', () =>
    showPanelState({ state: 'UNMONITORED', opening: false, issue: 'unsupported' }, 'unsupported'));
  required<HTMLButtonElement>('panel-failed').addEventListener('click', () =>
    showPanelState({ state: 'UNMONITORED', opening: false, issue: 'failed' }, 'failed'));

  required<HTMLButtonElement>('clear-log').addEventListener('click', () => {
    logElement.replaceChildren();
    console.info('[iNoti][dev] event log cleared');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDevTester, { once: true });
else initDevTester();
