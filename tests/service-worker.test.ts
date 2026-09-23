import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const addListener = vi.fn();
const historyListener = vi.fn();
const fragmentListener = vi.fn();
const sendMessage = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  addListener.mockClear();
  historyListener.mockClear();
  fragmentListener.mockClear();
  sendMessage.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-extension', onMessage: { addListener }, getURL: (path: string) => `chrome-extension://test-extension/${path}` },
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

afterEach(() => vi.unstubAllGlobals());
