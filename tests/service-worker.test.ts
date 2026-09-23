import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const message = { type: 'NEW_POLL', detectedAt: 1_700_000_000_000 };
const sender = { id: 'test-extension', frameId: 0, tab: { id: 7 }, url: 'https://student.iclicker.com/' };
const create = vi.fn();
const addListener = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  create.mockReset().mockResolvedValue('notification');
  addListener.mockClear();
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-extension', onMessage: { addListener }, getURL: (path: string) => `chrome-extension://test-extension/${path}` },
    notifications: { create },
  });
  await import('../src/background/service-worker');
});
afterEach(() => vi.unstubAllGlobals());

it('registers on startup and creates one silent notification with local time', async () => {
  const respond = vi.fn();
  expect(addListener).toHaveBeenCalledTimes(1);
  expect(addListener.mock.calls[0]?.[0](message, sender, respond)).toBe(true);
  await Promise.resolve();
  expect(create).toHaveBeenCalledExactlyOnceWith({
    type: 'basic', iconUrl: 'chrome-extension://test-extension/assets/icon-128.png',
    title: 'New iClicker Question', message: `Detected at ${new Date(message.detectedAt).toLocaleTimeString()}`, silent: true,
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
  create.mockRejectedValue(new Error('OS notification failure'));
  const respond = vi.fn();
  addListener.mock.calls[0]?.[0](message, sender, respond);
  await Promise.resolve();
  expect(respond).toHaveBeenCalledWith({ ok: false });
  expect(create).toHaveBeenCalledTimes(1);
});
