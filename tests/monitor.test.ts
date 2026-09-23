import { afterEach, expect, it, vi } from 'vitest';

const base = '#/class/11111111-1111-4111-8111-111111111111';
const closed = `${base}/question/22222222-2222-4222-8222-222222222222`;

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function start(hash: string) {
  vi.resetModules();
  const page = Object.assign(new EventTarget(), { location: { hash } });
  const sendMessage = vi.fn((_message, callback: (response: unknown) => void) => callback({ ok: true }));
  const addListener = vi.fn();
  vi.stubGlobal('window', page);
  vi.stubGlobal('chrome', { runtime: { id: 'test-extension', sendMessage, onMessage: { addListener } } });
  await import('../src/content/monitor');
  const navigate = (next: string) => {
    // The location may already reflect a later queued event.
    const event = Object.assign(new Event('hashchange'), { newURL: `https://student.iclicker.com/${next}` });
    page.dispatchEvent(event);
  };
  const receive = (message: unknown, sender: unknown = { id: 'test-extension' }) => {
    const respond = vi.fn();
    addListener.mock.calls[0]?.[0](message, sender, respond);
    return respond;
  };
  const navigation = (hash: string) => receive({ type: 'NAVIGATION_CHANGED', hash });
  return { sendMessage, navigate, navigation, receive };
}

it('emits once for each supported poll transition through a normal sequence', async () => {
  const { sendMessage, navigate } = await start(base);
  expect(sendMessage).not.toHaveBeenCalled();
  navigate(`${base}/poll`);
  navigate(`${base}/poll`);
  navigate(closed);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  navigate(`${base}/poll`);
  expect(sendMessage).toHaveBeenCalledTimes(2);
  expect(sendMessage.mock.calls[0]?.[0]).toEqual({ type: 'NEW_POLL', detectedAt: expect.any(Number) });
});

it('does not notify on initial poll or after refresh', async () => {
  for (let refresh = 0; refresh < 2; refresh++) {
    const { sendMessage, navigate } = await start(`${base}/poll`);
    navigate(`${base}/poll`);
    navigate(closed);
    expect(sendMessage).not.toHaveBeenCalled();
  }
});

it('requires a supported baseline after unrelated and quiz routes', async () => {
  const { sendMessage, navigate } = await start('#/home');
  navigate(`${base}/poll`);
  navigate(`${base}/quiz/22222222-2222-4222-8222-222222222222`);
  navigate(`${base}/poll`);
  expect(sendMessage).not.toHaveBeenCalled();
  navigate(base);
  navigate(`${base}/poll`);
  expect(sendMessage).toHaveBeenCalledTimes(1);
});

it('logs the detection and acknowledgement path without route identifiers', async () => {
  const output = vi.spyOn(console, 'info').mockImplementation(() => {});
  const { navigate } = await start(base);
  navigate(`${base}/poll`);
  const text = JSON.stringify(output.mock.calls);
  expect(text).toContain('loaded');
  expect(text).toContain('baseline state');
  expect(text).toContain('navigation update received');
  expect(text).toContain('sending NEW_POLL');
  expect(text).toContain('NEW_POLL acknowledged by worker');
  expect(text).not.toContain('11111111');
  expect(text).not.toContain('student.iclicker.com');
});

it('learns waiting from an unsupported startup then detects a History API poll', async () => {
  const { navigation, sendMessage } = await start('');
  expect(navigation(base)).toHaveBeenCalledWith({ ok: true });
  expect(sendMessage).not.toHaveBeenCalled();
  navigation(`${base}/poll`);
  expect(sendMessage).toHaveBeenCalledTimes(1);
});

it('does not alert for unsupported directly to active or an initially active page', async () => {
  for (const initial of ['', `${base}/poll`]) {
    const { navigation, sendMessage } = await start(initial);
    navigation(`${base}/poll`);
    expect(sendMessage).not.toHaveBeenCalled();
  }
});

it.each(['worker-first', 'hashchange-first'])('suppresses duplicate event sources: %s', async (order) => {
  const { navigation, navigate, sendMessage } = await start(base);
  const sources = order === 'worker-first' ? [navigation, navigate] : [navigate, navigation];
  for (const source of sources) source(`${base}/poll`);
  expect(sendMessage).toHaveBeenCalledTimes(1);
});

it('resets the baseline on sanitized unsupported routes', async () => {
  const { navigation, sendMessage } = await start(base);
  navigation('');
  navigation(`${base}/poll`);
  expect(sendMessage).not.toHaveBeenCalled();
  navigation(closed);
  navigation(`${base}/poll`);
  expect(sendMessage).toHaveBeenCalledTimes(1);
});

it.each([
  null, { type: 'NEW_POLL', detectedAt: 0 }, { type: 'NAVIGATION_CHANGED', hash: 7 },
  { type: 'NAVIGATION_CHANGED', hash: `https://student.iclicker.com/${base}/poll` },
  { type: 'NAVIGATION_CHANGED', hash: `${base}/poll`, extra: 'private' },
  { type: 'NAVIGATION_CHANGED', hash: '#/' + 'a'.repeat(300) },
  { type: 'NAVIGATION_CHANGED', hash: '#/class/\n' },
])('ignores malformed or wrong-direction message %j', async (message) => {
  const { receive, sendMessage } = await start(base);
  expect(receive(message)).not.toHaveBeenCalled();
  expect(sendMessage).not.toHaveBeenCalled();
});

it.each([{ id: 'other-extension' }, { id: 'test-extension', tab: { id: 1 } }])('rejects untrusted navigation sender %j', async (sender) => {
  const { receive, sendMessage } = await start(base);
  receive({ type: 'NAVIGATION_CHANGED', hash: `${base}/poll` }, sender);
  expect(sendMessage).not.toHaveBeenCalled();
});

it('logs synchronous send failures without retrying or leaking the error payload', async () => {
  const output = vi.spyOn(console, 'info').mockImplementation(() => {});
  const { navigate, sendMessage } = await start(base);
  sendMessage.mockImplementation(() => { throw new Error('Extension context invalidated: private data'); });
  navigate(`${base}/poll`);
  navigate(`${base}/poll`);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(output.mock.calls)).toContain('NEW_POLL delivery failed');
  expect(JSON.stringify(output.mock.calls)).not.toContain('private data');
});
