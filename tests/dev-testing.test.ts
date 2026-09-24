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

it('wires the toolbar popup with only navigation and preference storage permissions', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')) as {
    permissions?: string[];
    action?: { default_popup?: string };
  };
  expect(manifest.action?.default_popup).toBe('popup/popup.html');
  expect(manifest.permissions).toEqual(['webNavigation', 'storage']);
});


afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('simulates idle from active and ended, and keeps the pulse override across PiP reopen', async () => {
  vi.resetModules();
  const { DocumentFake, ElementFake } = await import('./dom-fake');
  const preview = new DocumentFake();
  const pipDocument = new DocumentFake();
  const ids = ['pip-status', 'event-log', 'preview', 'pulse-alerts', 'open-pip', 'idle', 'question', 'ended', 'stop', 'clear-log', 'panel-preview', 'panel-unmonitored', 'panel-idle', 'panel-question', 'panel-opening', 'panel-unsupported', 'panel-failed'];
  const elements = Object.fromEntries(ids.map(id => [id, Object.assign(new ElementFake(), { checked: false, contentDocument: preview })]));
  const panelDocument = new DocumentFake();
  elements['panel-preview']!.contentDocument = panelDocument;
  const doc = Object.assign(new DocumentFake(), { getElementById: (id: string) => elements[id] });
  const pip = Object.assign(new EventTarget(), { document: pipDocument, closed: false, close: vi.fn() });
  const requestWindow = vi.fn().mockResolvedValue(pip);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', Object.assign(new EventTarget(), { focus: vi.fn(), documentPictureInPicture: { requestWindow } }));
  vi.stubGlobal('chrome', undefined);
  vi.stubGlobal('getComputedStyle', () => ({ fontSize: '16px' }));
  await import('../src/dev-testing/dev-testing');
  const click = (id: string) => elements[id]!.dispatchEvent(new Event('click'));
  const panelLabel = () => panelDocument.body.children[0]!.shadow!.children[1]!.children[2]!.children[0]!.textContent;
  const panelExplanation = () => panelDocument.body.children[0]!.shadow!.children[1]!.children[1]!;
  expect(panelLabel()).toBe('Open notification window');
  expect(panelExplanation().textContent).toBe('Monitoring is on. Keep this iClicker page open so iNoti can detect new questions.');
  expect(panelExplanation().attributes.get('data-state')).toBe('unmonitored');
  click('panel-idle');
  expect(panelLabel()).toBe('Close notification window');
  expect(panelExplanation().textContent).toBe('Monitoring is on. Keep this iClicker page open so iNoti can detect new questions.');
  expect(panelExplanation().attributes.get('data-state')).toBe('idle');
  click('panel-question');
  expect(panelExplanation().textContent).toBe('A new question is active in the Notification window.');
  expect(panelExplanation().attributes.get('data-state')).toBe('question-active');
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
  click('panel-unmonitored');
  expect(panelLabel()).toBe('Open notification window');
  expect(panelExplanation().attributes.get('data-state')).toBe('unmonitored');
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
  pulse.checked = true;
  pulse.dispatchEvent(new Event('change'));
  expect(preview.body.attributes.get('data-pulse')).toBe('true');
  expect(pipDocument.body.attributes.get('data-pulse')).toBe('true');
  click('stop');
  click('open-pip');
  await Promise.resolve();
  expect(pipDocument.body.attributes.get('data-pulse')).toBe('true');
});
