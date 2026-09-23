import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const message = { type: 'NEW_POLL', detectedAt: 1_700_000_000_000 };
const sender = { id: 'test-extension', frameId: 0, tab: { id: 7 }, url: 'https://student.iclicker.com/' };
const create = vi.fn();
const addListener = vi.fn();
const historyListener = vi.fn();
const fragmentListener = vi.fn();
const sendMessage = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  create.mockReset().mockResolvedValue({ id: 42 });
  addListener.mockClear();
  historyListener.mockClear();
  fragmentListener.mockClear();
  sendMessage.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-extension', onMessage: { addListener }, getURL: (path: string) => `chrome-extension://test-extension/${path}` },
    windows: { create },
    tabs: { sendMessage },
    webNavigation: {
      onHistoryStateUpdated: { addListener: historyListener },
      onReferenceFragmentUpdated: { addListener: fragmentListener },
    },
  });
  await import('../src/background/service-worker');
});

const hash = '#/class/11111111-1111-4111-8111-111111111111/poll';
const navigation = { frameId: 0, tabId: 7, documentId: 'synthetic-document', url: `https://student.iclicker.com/${hash}` };

it.each(['history', 'fragment'])('forwards filtered %s updates to the originating top-frame document', async (source) => {
  const register = source === 'history' ? historyListener : fragmentListener;
  expect(register).toHaveBeenCalledTimes(1);
  expect(register.mock.calls[0]?.[1]).toEqual({ url: [{ hostEquals: 'student.iclicker.com' }] });
  register.mock.calls[0]?.[0](navigation);
  await Promise.resolve();
  expect(sendMessage).toHaveBeenCalledExactlyOnceWith(7, { type: 'NAVIGATION_CHANGED', hash }, { frameId: 0, documentId: 'synthetic-document' });
  expect(create).not.toHaveBeenCalled();
});

it.each([
  { ...navigation, frameId: 1 }, { ...navigation, tabId: -1 },
  { ...navigation, url: 'https://example.com/' },
  { ...navigation, url: 'https://student.iclicker.com.example.com/' },
  { ...navigation, url: 'http://student.iclicker.com/' },
  { ...navigation, url: 'https://student.iclicker.com:444/' },
  { ...navigation, url: 'invalid' },
])('ignores unrelated origins, subframes, and invalid targets %j', (event) => {
  historyListener.mock.calls[0]?.[0](event);
  fragmentListener.mock.calls[0]?.[0](event);
  expect(sendMessage).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

it('forwards an empty unsupported marker instead of unknown route content', () => {
  historyListener.mock.calls[0]?.[0]({ ...navigation, url: 'https://student.iclicker.com/#/quiz/private-data' });
  expect(sendMessage.mock.calls[0]?.[1]).toEqual({ type: 'NAVIGATION_CHANGED', hash: '' });
});

it('logs forwarding errors without leaking URLs or retrying', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  sendMessage.mockRejectedValue(new Error(`Receiving end does not exist: ${navigation.url}`));
  historyListener.mock.calls[0]?.[0](navigation);
  await Promise.resolve();
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(log.mock.calls)).toContain('failed to forward navigation update');
  expect(JSON.stringify(log.mock.calls)).not.toContain('11111111');
  log.mockRestore();
});

it('never interprets NAVIGATION_CHANGED as NEW_POLL', () => {
  expect(addListener.mock.calls[0]?.[0]({ type: 'NAVIGATION_CHANGED', hash }, sender, vi.fn())).toBe(false);
  expect(create).not.toHaveBeenCalled();
  expect(sendMessage).not.toHaveBeenCalled();
});
afterEach(() => vi.unstubAllGlobals());

it('registers on startup and creates one compact focused popup with only the timestamp', async () => {
  const respond = vi.fn();
  expect(addListener).toHaveBeenCalledTimes(1);
  expect(addListener.mock.calls[0]?.[0](message, sender, respond)).toBe(true);
  await Promise.resolve();
  expect(create).toHaveBeenCalledExactlyOnceWith({
    url: `chrome-extension://test-extension/alert.html?detectedAt=${message.detectedAt}`,
    type: 'popup', width: 400, height: 180, focused: true,
  });
  expect(respond).toHaveBeenCalledWith({ ok: true });
});

it.each([null, {}, { type: 'OTHER', detectedAt: 0 }, { ...message, detectedAt: 'today' },
  { ...message, detectedAt: NaN }, { ...message, detectedAt: Infinity }, { ...message, detectedAt: -1 },
  { ...message, detectedAt: 8_640_000_000_000_001 }, { ...message, tabId: 7 },
])('rejects invalid payload %j', (payload) => {
  expect(addListener.mock.calls[0]?.[0](payload, sender, vi.fn())).toBe(false);
  expect(create).not.toHaveBeenCalled();
});

it.each([
  { ...sender, url: 'https://example.com/' }, { ...sender, url: 'https://student.iclicker.com.example.com/' },
  { ...sender, url: 'http://student.iclicker.com/' }, { ...sender, url: 'invalid' },
  { ...sender, frameId: 1 }, { ...sender, tab: undefined }, { ...sender, id: 'other-extension' },
])('rejects unsupported sender %j', (source) => {
  expect(addListener.mock.calls[0]?.[0](message, source, vi.fn())).toBe(false);
  expect(create).not.toHaveBeenCalled();
});

it('reports a creation failure without retrying', async () => {
  create.mockRejectedValue(new Error('Window creation failed'));
  const respond = vi.fn();
  addListener.mock.calls[0]?.[0](message, sender, respond);
  await Promise.resolve();
  expect(respond).toHaveBeenCalledWith({ ok: false });
  expect(create).toHaveBeenCalledTimes(1);
});

it('reports synchronous window API failures', () => {
  create.mockImplementation(() => { throw new Error('No current window'); });
  const respond = vi.fn();
  addListener.mock.calls[0]?.[0](message, sender, respond);
  expect(respond).toHaveBeenCalledWith({ ok: false });
});
