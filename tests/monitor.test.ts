import { afterEach, expect, it, vi } from 'vitest';
import { DocumentFake } from './dom-fake';
import { pipDimensionsInPixels } from '../src/shared/pip-dimensions';

const base = '#/class/11111111-1111-4111-8111-111111111111';
const closed = `${base}/question/22222222-2222-4222-8222-222222222222`;
const monitoringCopy = 'iNoti is monitoring this class. Open the notification window for visual alerts.';
const alertsOpenCopy = 'iNoti is monitoring this class. Visual alerts are open.';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function start(hash: string, supported = true) {
  vi.resetModules();
  const document = new DocumentFake();
  const pipDocument = new DocumentFake();
  const pip = Object.assign(new EventTarget(), { document: pipDocument, closed: false, close: vi.fn() });
  pip.close.mockImplementation(() => { pip.closed = true; pip.dispatchEvent(new Event('pagehide')); });
  const requestWindow = vi.fn().mockResolvedValue(pip);
  const page = Object.assign(new EventTarget(), { location: { hash }, documentPictureInPicture: supported ? { requestWindow } : undefined });
  const addListener = vi.fn();
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('getComputedStyle', () => ({ fontSize: '16px' }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', page);
  vi.stubGlobal('chrome', { runtime: { id: 'test-extension', onMessage: { addListener }, sendMessage } });
  await import('../src/content/monitor');
  const host = document.elements.find(el => el.id === 'inoti-monitoring-control')!;
  const explanation = () => host.shadow!.children[1]!.children[1]!;
  const button = host.shadow!.children[1]!.children[2]!;
  const navigate = (hash: string) => {
    page.location.hash = hash;
    page.dispatchEvent(Object.assign(new Event('hashchange'), { newURL: `https://student.iclicker.com/${hash}` }));
  };
  const receive = (message: unknown, sender: unknown = { id: 'test-extension' }) => {
    const respond = vi.fn();
    addListener.mock.calls[0]?.[0](message, sender, respond);
    return respond;
  };
  const navigation = (hash: string) => receive({ type: 'NAVIGATION_CHANGED', hash });
  const click = () => button.dispatchEvent(new Event('click'));
  const open = async () => { click(); await Promise.resolve(); };
  const active = () => pipDocument.body.attributes.get('data-question-active') === 'true';
  return { host, button, explanation, navigate, navigation, receive, click, open, active, requestWindow, sendMessage, pip, pipDocument, page, document };
}

it('shows the monitoring panel only on supported routes and reflects the window state', async () => {
  const app = await start('#/home');
  expect(app.host.isConnected).toBe(false);
  app.navigation(base);
  expect(app.host.isConnected).toBe(true);
  expect(app.explanation().textContent).toBe(monitoringCopy);
  expect(app.explanation().attributes.get('data-state')).toBe('monitoring');
  expect(app.button.hidden).toBe(false);
  expect(app.button.textContent).toBe('Open notification window');
  app.navigation('');
  expect(app.host.isConnected).toBe(false);
});

it('opens the window synchronously once per user action, suppressing duplicate pending clicks', async () => {
  const app = await start(base);
  app.click();
  expect(app.requestWindow).toHaveBeenCalledExactlyOnceWith(pipDimensionsInPixels(16));
  app.click();
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
  await Promise.resolve();
  expect(app.active()).toBe(false);
  expect(app.button.textContent).toBe('Close notification window');
  expect(app.explanation().textContent).toBe(alertsOpenCopy);
  expect(app.explanation().attributes.get('data-state')).toBe('pip-open');
});

it('keeps monitoring and requests exactly one sound when a new question arrives with the window closed', async () => {
  const app = await start(base);
  app.navigation(`${base}/poll`);
  expect(app.requestWindow).not.toHaveBeenCalled();
  expect(app.active()).toBe(false);
  expect(app.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: 'NEW_QUESTION_DETECTED' });
  expect(app.explanation().textContent).toBe(monitoringCopy);
});

it('still requests a sound after the window is closed and never stops monitoring', async () => {
  const app = await start(base);
  await app.open();
  app.navigation(`${base}/poll`);
  expect(app.active()).toBe(true);
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
  app.click();
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
  expect(app.button.textContent).toBe('Open notification window');
  app.navigation(base);
  app.navigation(`${base}/poll`);
  expect(app.sendMessage).toHaveBeenCalledTimes(2);
  // The window stayed closed: no new PiP was opened for the next question.
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
  expect(app.button.textContent).toBe('Open notification window');
});

it('does not replay a sound or alert when the window opens during an active question', async () => {
  const app = await start(base);
  app.navigation(`${base}/poll`);
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
  await app.open();
  expect(app.active()).toBe(false);
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
});

it.each([base, closed])('shows the question end time in the same PiP: %s', async end => {
  const app = await start(base);
  await app.open();
  app.navigate(`${base}/poll`);
  expect(app.active()).toBe(true);
  const center = () => app.pipDocument.body.children[0]!.children[1]!;
  const time = center().children[1]!.children[0]!.textContent;
  app.navigate(`${base}/poll`);
  expect(center().children[1]!.children[0]!.textContent).toBe(time);
  const now = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_060_000);
  app.navigate(end);
  expect(app.active()).toBe(false);
  const main = app.pipDocument.body.children[0]!;
  expect(main.children[1]!.children[0]!.textContent).toBe('Question ended');
  expect(main.children[1]!.children[0]!.hidden).toBe(false);
  const endedText = `Ended at ${new Date(Date.now()).toLocaleTimeString()}`;
  expect(main.children[1]!.children[1]!.textContent).toBe(endedText);
  now.mockReturnValue(1_700_000_120_000);
  app.navigation(end);
  app.navigate(base);
  expect(main.children[1]!.children[1]!.textContent).toBe(endedText);
  app.navigate(`${base}/poll`);
  expect(app.active()).toBe(true);
  expect(main.children[1]!.children[0]!.textContent).toBe('iClicker question detected');
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
  expect(app.pip.close).not.toHaveBeenCalled();
  // One accepted question per transition: the replay of the poll route is silent.
  expect(app.sendMessage).toHaveBeenCalledTimes(2);
});

it.each(['worker-first', 'hashchange-first'])('suppresses duplicate source reports: %s', async order => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  const app = await start(base);
  await app.open();
  for (const source of order === 'worker-first' ? [app.navigation, app.navigate] : [app.navigate, app.navigation]) source(`${base}/poll`);
  expect(log.mock.calls.filter(call => call[0] === '[iNoti][pip] PiP -> question active')).toHaveLength(1);
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/11111111|student.iclicker.com/);
});

it('suppresses initial active baselines across reloads and unsupported-to-active', async () => {
  for (const initial of ['', `${base}/poll`, `${base}/poll`]) {
    const app = await start(initial);
    app.navigation(`${base}/poll`);
    expect(app.sendMessage).not.toHaveBeenCalled();
    await app.open();
    app.navigation(`${base}/poll`);
    expect(app.active()).toBe(false);
    expect(app.sendMessage).not.toHaveBeenCalled();
  }
});

it('does not request a sound for waiting/end transitions', async () => {
  const app = await start(base);
  await app.open();
  app.navigation(`${base}/poll`);
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
  app.navigation(base);
  app.navigation(closed);
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
});

it('closes the window and keeps monitoring when leaving for another supported class', async () => {
  const app = await start(base); await app.open();
  app.navigation('#/class/22222222-2222-4222-8222-222222222222/poll');
  expect(app.pip.close).toHaveBeenCalledTimes(1);
  expect(app.sendMessage).not.toHaveBeenCalled();
  expect(app.host.isConnected).toBe(true);
  expect(app.button.textContent).toBe('Open notification window');
});

it('hides the panel and closes the window on an unsupported route', async () => {
  const app = await start(base); await app.open();
  app.navigation('');
  expect(app.pip.close).toHaveBeenCalledTimes(1);
  expect(app.host.isConnected).toBe(false);
});

it('keeps monitoring after opener pagehide and BFCache restore without reopening the window', async () => {
  const app = await start(base); await app.open();
  app.page.dispatchEvent(new Event('pagehide'));
  expect(app.pip.close).toHaveBeenCalledTimes(1);
  expect(app.host.isConnected).toBe(false);
  app.page.location.hash = base;
  app.page.dispatchEvent(new Event('pageshow'));
  expect(app.host.isConnected).toBe(true);
  expect(app.button.textContent).toBe('Open notification window');
  app.requestWindow.mockClear();
  app.navigation(`${base}/poll`);
  expect(app.requestWindow).not.toHaveBeenCalled();
  expect(app.sendMessage).toHaveBeenCalledTimes(1);
});

it('handles unavailable Document PiP without changing iClicker or opening a fallback', async () => {
  const app = await start(base, false); await app.open();
  expect(app.button.textContent).toContain('Document PiP unavailable');
  expect(app.button.disabled).toBe(true);
  expect(app.requestWindow).not.toHaveBeenCalled();
  expect(app.page.location.hash).toBe(base);
});

it.each([
  null, { type: 'NEW_POLL', detectedAt: 0 }, { type: 'NAVIGATION_CHANGED', hash: 7 },
  { type: 'NAVIGATION_CHANGED', hash: `https://student.iclicker.com/${base}/poll` },
  { type: 'NAVIGATION_CHANGED', hash: `${base}/poll`, extra: 'private' },
  { type: 'NAVIGATION_CHANGED', hash: '#/' + 'a'.repeat(300) },
  { type: 'NAVIGATION_CHANGED', hash: '#/class/\n' },
])('rejects malformed/wrong-direction message %j', async message => {
  const app = await start(base); await app.open();
  expect(app.receive(message)).not.toHaveBeenCalled();
  expect(app.active()).toBe(false);
  expect(app.sendMessage).not.toHaveBeenCalled();
});

it.each([{ id: 'other-extension' }, { id: 'test-extension', tab: { id: 1 } }])('rejects untrusted navigation sender %j', async sender => {
  const app = await start(base); await app.open();
  expect(app.receive({ type: 'NAVIGATION_CHANGED', hash: `${base}/poll` }, sender)).not.toHaveBeenCalled();
  expect(app.active()).toBe(false);
  expect(app.sendMessage).not.toHaveBeenCalled();
});

it('does not request a sound for opening, closing, or reopening the window', async () => {
  const app = await start(base);
  await app.open();
  expect(app.sendMessage).not.toHaveBeenCalled();
  app.click();
  expect(app.sendMessage).not.toHaveBeenCalled();
  const reopened = Object.assign(new EventTarget(), { document: app.pipDocument, closed: false, close: vi.fn() });
  app.requestWindow.mockResolvedValueOnce(reopened);
  await app.open();
  expect(app.sendMessage).not.toHaveBeenCalled();
});

it('shows an opening failure and permits explicit retry', async () => {
  const app = await start(base);
  app.requestWindow.mockRejectedValueOnce(new Error('private route'));
  await app.open();
  expect(app.button.textContent).toContain('PiP failed');
  expect(app.button.disabled).toBe(false);
  await app.open();
  expect(app.button.textContent).toBe('Close notification window');
});
