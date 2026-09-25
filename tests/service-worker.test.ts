import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const addListener = vi.fn();
const historyListener = vi.fn();
const fragmentListener = vi.fn();
const tabsSendMessage = vi.fn();
const runtimeSendMessage = vi.fn();
const getContexts = vi.fn();
const createDocument = vi.fn();
const storageGet = vi.fn();
const getURL = vi.fn((path: string) => `chrome-extension://test-extension/${path}`);

const contentSender = { id: 'test-extension', tab: { id: 7 } };
const testerSender = { id: 'test-extension', url: 'chrome-extension://test-extension/dev-testing/index.html' };

function messageListener() {
  return addListener.mock.calls[0]?.[0] as (message: unknown, sender: unknown, respond?: unknown) => boolean;
}

beforeEach(async () => {
  vi.resetModules();
  addListener.mockClear();
  historyListener.mockClear();
  fragmentListener.mockClear();
  tabsSendMessage.mockReset().mockResolvedValue({ ok: true });
  runtimeSendMessage.mockReset().mockResolvedValue(undefined);
  getContexts.mockReset().mockResolvedValue([]);
  createDocument.mockReset().mockResolvedValue(undefined);
  storageGet.mockReset().mockResolvedValue({});
  getURL.mockClear();
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'test-extension',
      onMessage: { addListener },
      getURL,
      getContexts,
      sendMessage: runtimeSendMessage,
    },
    tabs: { sendMessage: tabsSendMessage },
    offscreen: { createDocument },
    storage: { local: { get: storageGet } },
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
  expect(tabsSendMessage).toHaveBeenCalledExactlyOnceWith(7, { type: 'NAVIGATION_CHANGED', hash }, { frameId: 0, documentId: 'synthetic-document' });
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
  expect(tabsSendMessage).not.toHaveBeenCalled();
});

it('forwards an empty unsupported marker instead of unknown route content', () => {
  historyListener.mock.calls[0]?.[0]({ ...navigation, url: 'https://student.iclicker.com/#/quiz/private-data' });
  expect(tabsSendMessage.mock.calls[0]?.[1]).toEqual({ type: 'NAVIGATION_CHANGED', hash: '' });
});

it('logs forwarding errors without leaking URLs or retrying', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  tabsSendMessage.mockRejectedValue(new Error(`Receiving end does not exist: ${navigation.url}`));
  historyListener.mock.calls[0]?.[0](navigation);
  await Promise.resolve();
  expect(tabsSendMessage).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(log.mock.calls)).toContain('failed to forward navigation update');
  expect(JSON.stringify(log.mock.calls)).not.toContain('11111111');
  log.mockRestore();
});

it('ignores malformed sound/new-question requests and untrusted senders', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  for (const message of [null, { type: 'PLAY_SOUND', target: 'offscreen', soundId: 'default-chime' }, { type: 'NEW_QUESTION_DETECTED', extra: 'private' }]) {
    expect(messageListener()(message, contentSender)).toBe(false);
  }
  expect(messageListener()({ type: 'NEW_QUESTION_DETECTED' }, { id: 'other-extension' })).toBe(false);
  expect(storageGet).not.toHaveBeenCalled();
  expect(createDocument).not.toHaveBeenCalled();
  expect(runtimeSendMessage).not.toHaveBeenCalled();
  log.mockRestore();
});

it('plays the registered default sound for an accepted new question', async () => {
  expect(messageListener()({ type: 'NEW_QUESTION_DETECTED' }, contentSender)).toBe(false);
  await vi.waitFor(() => expect(runtimeSendMessage).toHaveBeenCalledWith({ type: 'PLAY_SOUND', target: 'offscreen', soundId: 'default-chime' }));
  expect(storageGet).toHaveBeenCalledWith(['soundEnabled', 'selectedSoundId']);
  expect(createDocument).toHaveBeenCalledWith({
    url: 'offscreen/offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: expect.stringContaining('new iClicker question'),
  });
});

it('does not create the offscreen document when sound is disabled', async () => {
  storageGet.mockResolvedValue({ soundEnabled: false });
  messageListener()({ type: 'NEW_QUESTION_DETECTED' }, contentSender);
  await vi.waitFor(() => expect(storageGet).toHaveBeenCalled());
  await Promise.resolve();
  expect(createDocument).not.toHaveBeenCalled();
  expect(runtimeSendMessage).not.toHaveBeenCalled();
});

it('reuses an existing offscreen document instead of creating another', async () => {
  getContexts.mockResolvedValue([{ documentUrl: getURL('offscreen/offscreen.html') }]);
  messageListener()({ type: 'NEW_QUESTION_DETECTED' }, contentSender);
  await vi.waitFor(() => expect(runtimeSendMessage).toHaveBeenCalled());
  expect(createDocument).not.toHaveBeenCalled();
});

it('prevents concurrent offscreen creation for simultaneous requests', async () => {
  let release!: () => void;
  createDocument.mockReturnValue(new Promise<void>((resolve) => { release = resolve; }));
  messageListener()({ type: 'NEW_QUESTION_DETECTED' }, contentSender);
  messageListener()({ type: 'NEW_QUESTION_DETECTED' }, contentSender);
  await vi.waitFor(() => expect(createDocument).toHaveBeenCalledTimes(1));
  release();
  await vi.waitFor(() => expect(runtimeSendMessage).toHaveBeenCalledTimes(2));
  expect(createDocument).toHaveBeenCalledTimes(1);
});

it('plays a manual preview even when sound is disabled', async () => {
  storageGet.mockResolvedValue({ soundEnabled: false, selectedSoundId: 'soft-bell' });
  messageListener()({ type: 'PREVIEW_SOUND' }, testerSender);
  await vi.waitFor(() => expect(runtimeSendMessage).toHaveBeenCalledWith({ type: 'PLAY_SOUND', target: 'offscreen', soundId: 'soft-bell' }));
  expect(createDocument).toHaveBeenCalledTimes(1);
});

it('ignores malformed and untrusted preview requests', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  expect(messageListener()({ type: 'PREVIEW_SOUND', soundId: 'soft-bell' }, testerSender)).toBe(false);
  expect(messageListener()({ type: 'PREVIEW_SOUND' }, { id: 'other-extension' })).toBe(false);
  expect(storageGet).not.toHaveBeenCalled();
  expect(createDocument).not.toHaveBeenCalled();
  expect(runtimeSendMessage).not.toHaveBeenCalled();
  log.mockRestore();
});

it('falls back to the default sound id for an unknown persisted value', async () => {
  storageGet.mockResolvedValue({ selectedSoundId: '../../etc/passwd' });
  messageListener()({ type: 'NEW_QUESTION_DETECTED' }, testerSender);
  await vi.waitFor(() => expect(runtimeSendMessage).toHaveBeenCalledWith({ type: 'PLAY_SOUND', target: 'offscreen', soundId: 'default-chime' }));
});

it('logs preference read failures without leaking details or playing audio', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  storageGet.mockRejectedValue(new Error('private storage failure'));
  messageListener()({ type: 'NEW_QUESTION_DETECTED' }, contentSender);
  await vi.waitFor(() => expect(JSON.stringify(log.mock.calls)).toContain('sound preference read failed'));
  expect(JSON.stringify(log.mock.calls)).not.toContain('private storage failure');
  expect(createDocument).not.toHaveBeenCalled();
  expect(runtimeSendMessage).not.toHaveBeenCalled();
  log.mockRestore();
});

afterEach(() => vi.unstubAllGlobals());
