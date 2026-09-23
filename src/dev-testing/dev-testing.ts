import { createPipController, documentPip, type MonitoringStatus } from '../content/pip-controller';
import { createPipView } from '../content/pip-view';

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
  if (status.state === 'MONITORING_QUESTION_ACTIVE') return 'PiP: open — question active';
  return 'PiP: available — not open';
}

function initDevTester() {
  const statusElement = required<HTMLElement>('pip-status');
  const logElement = required<HTMLOListElement>('event-log');
  const previewFrame = required<HTMLIFrameElement>('preview');
  const previewDocument = previewFrame.contentDocument;
  if (!previewDocument) throw new Error('Inline preview document unavailable');

  const preview = createPipView(previewDocument);
  preview.idle();

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
  const controller = createPipController(api, (next) => {
    current = next;
    renderStatus();
    appendLog('PiP state changed', { state: next.state, opening: next.opening, issue: next.issue ?? 'none' });
  });

  renderStatus();
  appendLog('tester loaded', { documentPipAvailable: Boolean(api) });

  required<HTMLButtonElement>('open-pip').addEventListener('click', () => {
    preview.idle();
    appendLog('Open PiP requested');
    void controller.start();
  });

  required<HTMLButtonElement>('question').addEventListener('click', () => {
    const detectedAt = Date.now();
    preview.question(detectedAt);
    controller.question(detectedAt);
    appendLog('simulated question active', { pipWasOpen: current.state !== 'UNMONITORED' });
  });

  required<HTMLButtonElement>('idle').addEventListener('click', () => {
    preview.idle();
    controller.idle();
    appendLog('simulated idle');
  });

  required<HTMLButtonElement>('stop').addEventListener('click', () => {
    preview.idle();
    controller.stop();
    appendLog('stop requested');
  });

  required<HTMLButtonElement>('clear-log').addEventListener('click', () => {
    logElement.replaceChildren();
    console.info('[iNoti][dev] event log cleared');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDevTester, { once: true });
else initDevTester();
