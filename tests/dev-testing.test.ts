import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { openDevTestingTab } from '../src/popup/popup';

it('opens the extension-owned dev tester path', () => {
  const createTab = vi.fn();
  const getUrl = vi.fn((path: string) => 'chrome-extension://test/' + path);
  openDevTestingTab(createTab, getUrl);
  expect(getUrl).toHaveBeenCalledExactlyOnceWith('dev-testing/index.html');
  expect(createTab).toHaveBeenCalledExactlyOnceWith({ url: 'chrome-extension://test/dev-testing/index.html' });
});

it('wires the toolbar popup with only navigation, storage, and offscreen permissions', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')) as {
    permissions?: string[];
    action?: { default_popup?: string };
  };
  expect(manifest.action?.default_popup).toBe('popup/popup.html');
  expect(manifest.permissions).toEqual(['webNavigation', 'storage', 'offscreen']);
});


afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('previews monitoring/window panel states and exercises the production question path', async () => {
  vi.resetModules();
  const { DocumentFake, ElementFake } = await import('./dom-fake');
  const preview = new DocumentFake();
  const pipDocument = new DocumentFake();
  const ids = ['pip-status', 'event-log', 'preview', 'pulse-alerts', 'open-pip', 'idle', 'question', 'ended', 'stop', 'clear-log', 'panel-preview', 'panel-unmonitored', 'panel-monitoring', 'panel-opening', 'panel-unsupported', 'panel-failed'];
  const elements = Object.fromEntries(ids.map(id => [id, Object.assign(new ElementFake(), { checked: false, contentDocument: preview })]));
  const panelDocument = new DocumentFake();
  elements['panel-preview']!.contentDocument = panelDocument;
  const doc = Object.assign(new DocumentFake(), { getElementById: (id: string) => elements[id] });
  const pip = Object.assign(new EventTarget(), { document: pipDocument, closed: false, close: vi.fn() });
  const requestWindow = vi.fn().mockResolvedValue(pip);
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', Object.assign(new EventTarget(), { focus: vi.fn(), documentPictureInPicture: { requestWindow } }));
  vi.stubGlobal('chrome', { runtime: { id: 'test-extension', sendMessage } });
  vi.stubGlobal('getComputedStyle', () => ({ fontSize: '16px' }));
  await import('../src/dev-testing/dev-testing');
  const click = (id: string) => elements[id]!.dispatchEvent(new Event('click'));
  const panelButton = () => panelDocument.body.children[0]!.shadow!.children[1]!.children[2]!;
  const panelLabel = () => panelButton().children[0]!.textContent;
  const panelExplanation = () => panelDocument.body.children[0]!.shadow!.children[1]!.children[1]!;
  const monitoringCopy = 'iNoti is monitoring this class. Open the notification window for visual alerts.';
  const alertsOpenCopy = 'iNoti is monitoring this class. Visual alerts are open.';

  // Default tester state: monitoring with the window closed.
  expect(panelButton().hidden).toBe(false);
  expect(panelLabel()).toBe('Open notification window');
  expect(panelExplanation().textContent).toBe(monitoringCopy);
  expect(panelExplanation().attributes.get('data-state')).toBe('monitoring');

  click('panel-unmonitored');
  expect(panelExplanation().attributes.get('data-state')).toBe('unmonitored');
  expect(panelExplanation().textContent).toContain('Open a supported iClicker class');
  click('panel-monitoring');
  expect(panelExplanation().attributes.get('data-state')).toBe('monitoring');
  click('panel-opening');
  expect(panelLabel()).toBe('Opening notification window...');
  expect(panelExplanation().textContent).toBe('Opening the Notification window…');
  click('panel-unsupported');
  expect(panelLabel()).toBe('Document PiP unavailable');
  expect(panelExplanation().textContent).toBe('Notification window needs desktop Chrome 123 or newer.');
  expect(panelExplanation().attributes.get('data-state')).toBe('unsupported');
  click('panel-failed');
  expect(panelLabel()).toBe('PiP failed - Try again');
  expect(panelExplanation().textContent).toBe('The Notification window could not open. Click the button to try again.');
  expect(panelExplanation().attributes.get('data-state')).toBe('failed');
  click('panel-monitoring');
  expect(panelLabel()).toBe('Open notification window');

  const pulse = elements['pulse-alerts']!;
  expect(pulse.checked).toBe(true);
  pulse.checked = false;
  pulse.dispatchEvent(new Event('change'));
  expect(preview.body.attributes.get('data-pulse')).toBe('false');
  click('idle');
  expect(requestWindow).not.toHaveBeenCalled();
  click('open-pip');
  await Promise.resolve();
  expect(pipDocument.body.attributes.get('data-pulse')).toBe('false');
  expect(panelLabel()).toBe('Close notification window');
  expect(panelExplanation().textContent).toBe(alertsOpenCopy);
  expect(panelExplanation().attributes.get('data-state')).toBe('pip-open');
  // Opening the window alone must not request a sound.
  expect(sendMessage).not.toHaveBeenCalled();

  for (const from of ['question', 'ended']) {
    click('question');
    if (from === 'ended') click('ended');
    click('idle');
    expect(preview.body.children[0]!.children[1]!.children[0]!.textContent).toBe('Waiting for a question');
    expect(pipDocument.body.children[0]!.children[1]!.children[0]!.textContent).toBe('Waiting for a question');
    expect(elements['pip-status']!.textContent).toContain('idle');
    click('question');
    expect(pipDocument.body.attributes.get('data-question-active')).toBe('true');
  }
  expect(sendMessage).toHaveBeenCalledWith({ type: 'NEW_QUESTION_DETECTED' });

  click('stop');
  expect(panelLabel()).toBe('Open notification window');
  sendMessage.mockClear();
  // With the window closed the production sound path still runs.
  click('question');
  expect(sendMessage).toHaveBeenCalledExactlyOnceWith({ type: 'NEW_QUESTION_DETECTED' });

  pulse.checked = true;
  pulse.dispatchEvent(new Event('change'));
  expect(preview.body.attributes.get('data-pulse')).toBe('true');
  click('open-pip');
  await Promise.resolve();
  expect(pipDocument.body.attributes.get('data-pulse')).toBe('true');
});
