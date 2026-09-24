import { afterEach, expect, it, vi } from 'vitest';
import { createPipController, documentPip } from '../src/content/pip-controller';
import { createPipView } from '../src/content/pip-view';
import { DocumentFake } from './dom-fake';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
function fixture(rootFontSize = () => 16) {
  const pip = Object.assign(new EventTarget(), { document: {} as Document, closed: false, close: vi.fn() });
  const requestWindow = vi.fn<() => Promise<Window>>();
  const changed = vi.fn();
  const view = { idle: vi.fn(), question: vi.fn(), ended: vi.fn() };
  const controller = createPipController({ requestWindow }, changed, () => view, rootFontSize);
  return { pip, requestWindow, changed, view, controller };
}
it('discards pending opens after stop without claiming monitoring started', async () => {
  const f = fixture();
  let resolve!: (pip: Window) => void;
  f.requestWindow.mockReturnValue(new Promise(done => { resolve = done; }));
  const pending = f.controller.start();
  f.controller.stop();
  resolve(f.pip as unknown as Window);
  await pending;
  expect(f.pip.close).toHaveBeenCalledOnce();
  expect(f.view.idle).not.toHaveBeenCalled();
  expect(f.changed).toHaveBeenLastCalledWith({ state: 'UNMONITORED', opening: false });
});
it.each(['sync', 'async'])('handles %s request failures privately and permits explicit retry', async kind => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  const f = fixture();
  if (kind === 'sync') f.requestWindow.mockImplementation(() => { throw new Error('private URL'); });
  else f.requestWindow.mockRejectedValue(new Error('private URL'));
  await f.controller.start();
  expect(f.changed).toHaveBeenLastCalledWith({ state: 'UNMONITORED', opening: false, issue: 'failed' });
  expect(JSON.stringify(log.mock.calls)).not.toContain('private URL');
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.start();
  expect(f.view.idle).toHaveBeenCalledOnce();
});
it('ignores a late close from an old PiP after a new monitoring session starts', async () => {
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.start(); f.controller.stop();
  const next = Object.assign(new EventTarget(), { document: {} as Document, closed: false, close: vi.fn() });
  f.requestWindow.mockResolvedValue(next as unknown as Window);
  await f.controller.start();
  f.pip.dispatchEvent(new Event('pagehide'));
  f.controller.question(123);
  expect(f.view.question).toHaveBeenCalledExactlyOnceWith(123);
});
it('stays idle if a question transition occurs while opening', async () => {
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  const pending = f.controller.start();
  f.controller.question(123);
  await pending;
  expect(f.view.question).not.toHaveBeenCalled();
  expect(f.view.idle).toHaveBeenCalledOnce();
});
it('feature-detects a callable requestWindow', () => {
  expect(documentPip({ documentPictureInPicture: {} } as unknown as Window)).toBeUndefined();
});
it('renders minimal idle content and local detection time without HTML insertion', () => {
  const document = new DocumentFake();
  const view = createPipView(document as unknown as Document);
  view.idle();
  const main = document.body.children[0]!;
  expect(main.children[0]!.textContent).toBe('iNoti');
  expect(main.children[1]!.hidden).toBe(true);
  view.question(1_700_000_000_000);
  expect(main.children[1]!.children[0]!.textContent).toBe('New iClicker Question');
  expect(main.children[1]!.hidden).toBe(false);
  expect(main.children[2]!.children[0]!.textContent).toBe(`Detected at ${new Date(1_700_000_000_000).toLocaleTimeString()}`);
  view.idle();
  expect(main.children[2]!.children[0]!.textContent).toBe('');
});
it('cleans up when rendering fails, even if close emits pagehide synchronously', async () => {
  const pip = Object.assign(new EventTarget(), { document: {} as Document, closed: false, close: vi.fn() });
  pip.close.mockImplementation(() => pip.dispatchEvent(new Event('pagehide')));
  const changed = vi.fn();
  const controller = createPipController({ requestWindow: async () => pip as unknown as Window }, changed, () => { throw new Error('private'); }, () => 16);
  await controller.start();
  expect(pip.close).toHaveBeenCalledOnce();
  expect(changed).toHaveBeenLastCalledWith({ state: 'UNMONITORED', opening: false, issue: 'failed' });
});

it('converts rem dimensions synchronously on each user-started open', async () => {
  let fontSize = 16;
  const f = fixture(() => fontSize);
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  const first = f.controller.start();
  expect(f.requestWindow).toHaveBeenLastCalledWith({ width: 160, height: 160 });
  await first;
  f.controller.stop();
  fontSize = 20;
  const second = f.controller.start();
  expect(f.requestWindow).toHaveBeenLastCalledWith({ width: 200, height: 200 });
  await second;
});

it('shows elapsed time, catches up after delayed ticks, and resets for the next question', () => {
  vi.useFakeTimers();
  const started = 1_700_000_000_000;
  vi.setSystemTime(started);
  let tick!: () => void;
  const page = Object.assign(new EventTarget(), {
    setInterval: vi.fn((callback: () => void) => { tick = callback; return 42; }),
    clearInterval: vi.fn(),
  });
  const document = Object.assign(new DocumentFake(), { defaultView: page });
  const view = createPipView(document as unknown as Document);
  const elapsed = document.body.children[0]!.children[3]!;
  view.idle();
  expect(elapsed.hidden).toBe(true);
  expect(page.setInterval).not.toHaveBeenCalled();
  view.question(started);
  expect(elapsed.textContent).toBe('Elapsed: 0:00');
  expect(elapsed.attributes.get('aria-live')).toBe('off');
  expect(page.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
  vi.setSystemTime(started + 65_900);
  tick();
  expect(elapsed.textContent).toBe('Elapsed: 1:05');
  vi.setSystemTime(started + 3_661_000);
  tick();
  expect(elapsed.textContent).toBe('Elapsed: 1:01:01');
  view.setPulseEnabled(false);
  expect(elapsed.textContent).toBe('Elapsed: 1:01:01');
  view.idle();
  expect(page.clearInterval).toHaveBeenCalledWith(42);
  expect(elapsed.hidden).toBe(true);
  expect(elapsed.textContent).toBe('');
  view.question(Date.now());
  expect(elapsed.textContent).toBe('Elapsed: 0:00');
  page.dispatchEvent(new Event('pagehide'));
  expect(page.clearInterval).toHaveBeenCalledTimes(2);
});

it('replaces an existing timer and never shows negative elapsed time', () => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  const page = Object.assign(new EventTarget(), { setInterval: vi.fn(() => 7), clearInterval: vi.fn() });
  const document = Object.assign(new DocumentFake(), { defaultView: page });
  const view = createPipView(document as unknown as Document);
  view.question(1000);
  view.question(2000);
  expect(page.clearInterval).toHaveBeenCalledExactlyOnceWith(7);
  expect(document.body.children[0]!.children[3]!.textContent).toBe('Elapsed: 0:00');
  view.idle();
});


it('only ends a detected active question once and accepts the next question', async () => {
  const f = fixture();
  f.controller.ended(1);
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.start();
  f.controller.ended(2);
  expect(f.view.ended).not.toHaveBeenCalled();
  f.controller.question(3);
  f.controller.ended(4);
  f.controller.ended(5);
  expect(f.view.ended).toHaveBeenCalledExactlyOnceWith(4);
  expect(f.changed).toHaveBeenLastCalledWith({ state: 'MONITORING_QUESTION_ENDED', opening: false });
  f.controller.question(6);
  expect(f.view.question).toHaveBeenLastCalledWith(6);
  f.controller.stop();
  f.controller.ended(7);
  expect(f.view.ended).toHaveBeenCalledOnce();
});

it('stops the elapsed timer and pulse on end, then restores the next alert', () => {
  const page = Object.assign(new EventTarget(), { setInterval: vi.fn(() => 7), clearInterval: vi.fn() });
  const document = Object.assign(new DocumentFake(), { defaultView: page });
  const view = createPipView(document as unknown as Document);
  view.setPulseEnabled(true);
  view.question(Date.now());
  view.ended(1_700_000_000_000);
  const main = document.body.children[0]!;
  expect(page.clearInterval).toHaveBeenCalledExactlyOnceWith(7);
  expect(document.body.attributes.get('data-question-active')).toBe('false');
  expect(main.children[1]!.textContent).toBe('Question Ended');
  expect(main.children[2]!.textContent).toBe(`Ended at ${new Date(1_700_000_000_000).toLocaleTimeString()}`);
  expect(main.children[3]!.hidden).toBe(true);
  expect(main.children[3]!.textContent).toBe('');
  view.question(Date.now());
  expect(main.children[1]!.textContent).toBe('New iClicker Question');
  expect(main.children[3]!.hidden).toBe(false);
  expect(document.body.attributes.get('data-question-active')).toBe('true');
  expect(page.setInterval).toHaveBeenCalledTimes(2);
  view.idle();
});
