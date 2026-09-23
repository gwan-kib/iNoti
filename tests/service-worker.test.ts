import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const message = { type: 'NEW_POLL', detectedAt: 1_700_000_000_000 };
const sender = { id: 'test-extension', frameId: 0, tab: { id: 7 }, url: 'https://student.iclicker.com/' };
const create = vi.fn();
const addListener = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  create.mockReset().mockResolvedValue({ id: 42 });
  addListener.mockClear();
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-extension', onMessage: { addListener }, getURL: (path: string) => `chrome-extension://test-extension/${path}` },
    windows: { create },
  });
  await import('../src/background/service-worker');
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
