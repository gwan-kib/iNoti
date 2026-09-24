import { afterEach, expect, it, vi } from 'vitest';
import { DocumentFake } from './dom-fake';
import { pipDimensionsInPixels } from '../src/shared/pip-dimensions';

const base = '#/class/11111111-1111-4111-8111-111111111111';
const closed = `${base}/question/22222222-2222-4222-8222-222222222222`;
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
  vi.stubGlobal('getComputedStyle', () => ({ fontSize: '16px' }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', page);
  vi.stubGlobal('chrome', { runtime: { id: 'test-extension', onMessage: { addListener } } });
  await import('../src/content/monitor');
  const host = document.elements.find(el => el.id === 'inoti-monitoring-control')!;
  const button = host.shadow!.children[1]!;
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
  return { host, button, navigate, navigation, receive, click, open, active, requestWindow, pip, pipDocument, page, document };
}

it('shows an isolated Start Monitoring control only on supported routes', async () => {
  const app = await start('#/home');
  expect(app.host.isConnected).toBe(false);
  app.navigation(base);
  expect(app.host.isConnected).toBe(true);
  expect(app.button.textContent).toBe('Start Monitoring');
  app.navigation('');
  expect(app.host.isConnected).toBe(false);
});
it('calls requestWindow synchronously once per user action, suppressing duplicate pending clicks', async () => {
  const app = await start(base);
  app.click();
  expect(app.requestWindow).toHaveBeenCalledExactlyOnceWith(pipDimensionsInPixels(16));
  app.click();
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
  await Promise.resolve();
  expect(app.active()).toBe(false);
  expect(app.button.textContent).toBe('Monitoring');
});
it.each([base, closed])('shows the question end time in the same PiP: %s', async end => {
  const app = await start(base);
  await app.open();
  app.navigate(`${base}/poll`);
  expect(app.active()).toBe(true);
  const time = app.pipDocument.body.children[0]!.children[2]!.children[0]!.textContent;
  app.navigate(`${base}/poll`);
  expect(app.pipDocument.body.children[0]!.children[2]!.children[0]!.textContent).toBe(time);
  const now = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_060_000);
  app.navigate(end);
  expect(app.active()).toBe(false);
  const main = app.pipDocument.body.children[0]!;
  expect(main.children[1]!.textContent).toBe('Question Ended');
  expect(main.children[1]!.hidden).toBe(false);
  const endedText = `Ended at ${new Date(Date.now()).toLocaleTimeString()}`;
  expect(main.children[2]!.textContent).toBe(endedText);
  now.mockReturnValue(1_700_000_120_000);
  app.navigation(end);
  app.navigate(base);
  expect(main.children[2]!.textContent).toBe(endedText);
  app.navigate(`${base}/poll`);
  expect(app.active()).toBe(true);
  expect(main.children[1]!.textContent).toBe('New iClicker Question');
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
  expect(app.pip.close).not.toHaveBeenCalled();
});
it.each(['worker-first', 'hashchange-first'])('suppresses duplicate source reports: %s', async order => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  const app = await start(base);
  await app.open();
  for (const source of order === 'worker-first' ? [app.navigation, app.navigate] : [app.navigate, app.navigation]) source(`${base}/poll`);
  expect(log.mock.calls.filter(call => call[0] === '[iNoti][pip] PiP -> question active')).toHaveLength(1);
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/11111111|student.iclicker.com/);
});
it('never opens or alerts from question events before a click or after PiP closes', async () => {
  const app = await start(base);
  app.navigation(`${base}/poll`);
  expect(app.requestWindow).not.toHaveBeenCalled();
  await app.open();
  expect(app.active()).toBe(false);
  app.pip.close();
  expect(app.button.textContent).toBe('Start Monitoring');
  app.navigation(base); app.navigation(`${base}/poll`);
  expect(app.active()).toBe(false);
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
});
it('suppresses initial active baselines across reloads and unsupported-to-active', async () => {
  for (const initial of ['', `${base}/poll`, `${base}/poll`]) {
    const app = await start(initial);
    app.navigation(`${base}/poll`);
    await app.open();
    app.navigation(`${base}/poll`);
    expect(app.active()).toBe(false);
  }
});
it.each(['', '#/class/22222222-2222-4222-8222-222222222222/poll'])('stops on leaving the monitored class: %s', async next => {
  const app = await start(base); await app.open();
  app.navigation(next);
  expect(app.pip.close).toHaveBeenCalledTimes(1);
  expect(app.button.textContent).toBe('Start Monitoring');
});
it('requires a fresh click after opener pagehide and BFCache restore', async () => {
  const app = await start(base); await app.open();
  app.page.dispatchEvent(new Event('pagehide'));
  expect(app.pip.close).toHaveBeenCalledTimes(1);
  expect(app.host.isConnected).toBe(false);
  app.page.location.hash = `${base}/poll`;
  app.page.dispatchEvent(new Event('pageshow'));
  expect(app.button.textContent).toBe('Start Monitoring');
  app.navigation(`${base}/poll`);
  expect(app.requestWindow).toHaveBeenCalledTimes(1);
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
});
it.each([{ id: 'other-extension' }, { id: 'test-extension', tab: { id: 1 } }])('rejects untrusted navigation sender %j', async sender => {
  const app = await start(base); await app.open();
  expect(app.receive({ type: 'NAVIGATION_CHANGED', hash: `${base}/poll` }, sender)).not.toHaveBeenCalled();
  expect(app.active()).toBe(false);
});
it('active control stops monitoring and later transitions remain silent', async () => {
  const app = await start(base); await app.open();
  app.click();
  expect(app.pip.close).toHaveBeenCalledOnce();
  expect(app.button.textContent).toBe('Start Monitoring');
  app.navigation(`${base}/poll`);
  expect(app.active()).toBe(false);
  expect(app.requestWindow).toHaveBeenCalledOnce();
});
it('shows an opening failure and permits explicit retry', async () => {
  const app = await start(base);
  app.requestWindow.mockRejectedValueOnce(new Error('private route'));
  await app.open();
  expect(app.button.textContent).toContain('PiP failed');
  expect(app.button.disabled).toBe(false);
  await app.open();
  expect(app.button.textContent).toBe('Monitoring');
});
