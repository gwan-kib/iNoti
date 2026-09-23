import { afterEach, expect, it, vi } from 'vitest';

const base = '#/class/11111111-1111-4111-8111-111111111111';
const closed = `${base}/question/22222222-2222-4222-8222-222222222222`;

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function start(hash: string) {
  vi.resetModules();
  const page = Object.assign(new EventTarget(), { location: { hash } });
  const sendMessage = vi.fn((_message, callback: (response: unknown) => void) => callback({ ok: true }));
  vi.stubGlobal('window', page);
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
  await import('../src/content/monitor');
  const navigate = (next: string) => {
    // The location may already reflect a later queued event.
    const event = Object.assign(new Event('hashchange'), { newURL: `https://student.iclicker.com/${next}` });
    page.dispatchEvent(event);
  };
  return { sendMessage, navigate };
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
  expect(text).toContain('hashchange detected');
  expect(text).toContain('sending NEW_POLL');
  expect(text).toContain('NEW_POLL acknowledged by worker');
  expect(text).not.toContain('11111111');
  expect(text).not.toContain('student.iclicker.com');
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
