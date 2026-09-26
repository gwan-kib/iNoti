import { afterEach, expect, it, vi } from "vitest";
import { createPipController, documentPip, QUESTION_END_IDLE_MS } from "../src/content/pip-controller";
import { createPipView } from "../src/content/pip-view";
import { createConfiguredPipView } from "../src/content/configured-pip-view";
import { DocumentFake } from "./dom-fake";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
// The brand row stays at the top; content and actions share the centered group.
function parts(document: DocumentFake) {
  const main = document.body.children[0]!;
  const center = main.children[1]!;
  const actions = center.children[4]!;
  return {
    brand: main.children[0]!,
    title: center.children[0]!,
    time: center.children[1]!,
    elapsed: center.children[2]!,
    detail: center.children[3]!,
    goToQuestion: actions.children[0]!,
    answered: actions.children[1]!,
  };
}
function fixture(rootFontSize = () => 16) {
  const pip = Object.assign(new EventTarget(), {
    document: {} as Document,
    closed: false,
    close: vi.fn(),
  });
  const requestWindow = vi.fn<() => Promise<Window>>();
  const changed = vi.fn();
  const view = { idle: vi.fn(), question: vi.fn(), ended: vi.fn() };
  const controller = createPipController({ requestWindow }, changed, () => view, rootFontSize);
  return { pip, requestWindow, changed, view, controller };
}
it("discards pending opens after close without claiming the window opened", async () => {
  const f = fixture();
  let resolve!: (pip: Window) => void;
  f.requestWindow.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const pending = f.controller.open();
  f.controller.close();
  resolve(f.pip as unknown as Window);
  await pending;
  expect(f.pip.close).toHaveBeenCalledOnce();
  expect(f.view.idle).not.toHaveBeenCalled();
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "CLOSED",
    opening: false,
  });
});
it.each(["sync", "async"])("handles %s request failures privately and permits explicit retry", async (kind) => {
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const f = fixture();
  if (kind === "sync")
    f.requestWindow.mockImplementation(() => {
      throw new Error("private URL");
    });
  else f.requestWindow.mockRejectedValue(new Error("private URL"));
  await f.controller.open();
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "CLOSED",
    opening: false,
    issue: "failed",
  });
  expect(JSON.stringify(log.mock.calls)).not.toContain("private URL");
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.open();
  expect(f.view.idle).toHaveBeenCalledOnce();
});
it("ignores a late close from an old PiP after a new monitoring session starts", async () => {
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.open();
  f.controller.close();
  const next = Object.assign(new EventTarget(), {
    document: {} as Document,
    closed: false,
    close: vi.fn(),
  });
  f.requestWindow.mockResolvedValue(next as unknown as Window);
  await f.controller.open();
  f.pip.dispatchEvent(new Event("pagehide"));
  f.controller.question(123);
  expect(f.view.question).toHaveBeenCalledExactlyOnceWith(123);
});
it("stays idle if a question transition occurs while opening", async () => {
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  const pending = f.controller.open();
  f.controller.question(123);
  await pending;
  expect(f.view.question).not.toHaveBeenCalled();
  expect(f.view.idle).toHaveBeenCalledOnce();
});
it("feature-detects a callable requestWindow", () => {
  expect(documentPip({ documentPictureInPicture: {} } as unknown as Window)).toBeUndefined();
});
it("renders minimal idle content and local detection time without HTML insertion", () => {
  const document = new DocumentFake();
  const view = createPipView(document as unknown as Document);
  const p = parts(document);
  view.idle();
  expect(p.brand.textContent).toBe("iNotiMonitoring");
  expect(p.title.textContent).toBe("Waiting for a question");
  view.question(1_700_000_000_000);
  expect(p.title.children[0]!.textContent).toBe("New iClicker question!");
  expect(p.title.hidden).toBe(false);
  expect(p.brand.textContent).toBe("iNotiNew Question");
  expect(p.detail.hidden).toBe(true);
  expect(p.time.children[0]!.textContent).toBe(new Date(1_700_000_000_000).toLocaleTimeString());
  view.idle();
  expect(p.time.children[0]!.textContent).toBe("");
});
it("cleans up when rendering fails, even if close emits pagehide synchronously", async () => {
  const pip = Object.assign(new EventTarget(), {
    document: {} as Document,
    closed: false,
    close: vi.fn(),
  });
  pip.close.mockImplementation(() => pip.dispatchEvent(new Event("pagehide")));
  const changed = vi.fn();
  const controller = createPipController(
    { requestWindow: async () => pip as unknown as Window },
    changed,
    () => {
      throw new Error("private");
    },
    () => 16,
  );
  await controller.open();
  expect(pip.close).toHaveBeenCalledOnce();
  expect(changed).toHaveBeenLastCalledWith({
    state: "CLOSED",
    opening: false,
    issue: "failed",
  });
});

it("converts rem dimensions synchronously on each user-started open", async () => {
  let fontSize = 16;
  const f = fixture(() => fontSize);
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  const first = f.controller.open();
  expect(f.requestWindow).toHaveBeenLastCalledWith({ width: 288, height: 128 });
  await first;
  f.controller.close();
  fontSize = 20;
  const second = f.controller.open();
  expect(f.requestWindow).toHaveBeenLastCalledWith({ width: 360, height: 160 });
  await second;
});

it("shows elapsed time, catches up after delayed ticks, and resets for the next question", () => {
  vi.useFakeTimers();
  const started = 1_700_000_000_000;
  vi.setSystemTime(started);
  let tick!: () => void;
  const page = Object.assign(new EventTarget(), {
    setInterval: vi.fn((callback: () => void) => {
      tick = callback;
      return 42;
    }),
    clearInterval: vi.fn(),
  });
  const document = Object.assign(new DocumentFake(), { defaultView: page });
  const view = createPipView(document as unknown as Document);
  const elapsed = parts(document).elapsed;
  view.idle();
  expect(elapsed.hidden).toBe(true);
  expect(page.setInterval).not.toHaveBeenCalled();
  view.question(started);
  expect(elapsed.textContent).toBe("0:00");
  expect(elapsed.attributes.get("aria-live")).toBe("off");
  expect(page.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
  vi.setSystemTime(started + 65_900);
  tick();
  expect(elapsed.textContent).toBe("1:05");
  vi.setSystemTime(started + 3_661_000);
  tick();
  expect(elapsed.textContent).toBe("1:01:01");
  view.setPulseEnabled(false);
  expect(elapsed.textContent).toBe("1:01:01");
  view.idle();
  expect(page.clearInterval).toHaveBeenCalledWith(42);
  expect(elapsed.hidden).toBe(true);
  expect(elapsed.textContent).toBe("");
  view.question(Date.now());
  expect(elapsed.textContent).toBe("0:00");
  page.dispatchEvent(new Event("pagehide"));
  expect(page.clearInterval).toHaveBeenCalledTimes(2);
});

it("replaces an existing timer and never shows negative elapsed time", () => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  const page = Object.assign(new EventTarget(), {
    setInterval: vi.fn(() => 7),
    clearInterval: vi.fn(),
  });
  const document = Object.assign(new DocumentFake(), { defaultView: page });
  const view = createPipView(document as unknown as Document);
  view.question(1000);
  view.question(2000);
  expect(page.clearInterval).toHaveBeenCalledExactlyOnceWith(7);
  expect(parts(document).elapsed.textContent).toBe("0:00");
  view.idle();
});

it("only ends a detected active question once and accepts the next question", async () => {
  const f = fixture();
  f.controller.ended(1);
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.open();
  f.controller.ended(2);
  expect(f.view.ended).not.toHaveBeenCalled();
  f.controller.question(3);
  f.controller.ended(4);
  f.controller.ended(5);
  expect(f.view.ended).toHaveBeenCalledExactlyOnceWith(4);
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "QUESTION_ENDED",
    opening: false,
  });
  f.controller.question(6);
  expect(f.view.question).toHaveBeenLastCalledWith(6);
  f.controller.close();
  f.controller.ended(7);
  expect(f.view.ended).toHaveBeenCalledOnce();
});

it("stops the elapsed timer and pulse on end, then restores the next alert", () => {
  const page = Object.assign(new EventTarget(), {
    setInterval: vi.fn(() => 7),
    clearInterval: vi.fn(),
  });
  const document = Object.assign(new DocumentFake(), { defaultView: page });
  const view = createPipView(document as unknown as Document);
  view.setPulseEnabled(true);
  view.question(Date.now());
  view.ended(1_700_000_000_000);
  const p = parts(document);
  expect(page.clearInterval).toHaveBeenCalledExactlyOnceWith(7);
  expect(document.body.attributes.get("data-question-active")).toBe("false");
  expect(p.title.textContent).toBe("Question ended");
  expect(p.brand.textContent).toBe("iNotiMonitoring");
  expect(p.detail.hidden).toBe(false);
  expect(p.time.textContent).toBe(`Ended at ${new Date(1_700_000_000_000).toLocaleTimeString()}`);
  expect(p.elapsed.hidden).toBe(true);
  expect(p.elapsed.textContent).toBe("");
  view.question(Date.now());
  expect(p.title.textContent).toBe("New iClicker question!");
  expect(p.elapsed.hidden).toBe(false);
  expect(document.body.attributes.get("data-question-active")).toBe("true");
  expect(page.setInterval).toHaveBeenCalledTimes(2);
  view.idle();
});

it("shows Go to Question only for active alerts and focuses without altering the alert", () => {
  const document = new DocumentFake();
  const focus = vi.fn();
  const view = createPipView(document as unknown as Document, focus);
  const button = parts(document).goToQuestion;
  expect(button.textContent).toBe("Go to Question");
  view.idle();
  expect(button.hidden).toBe(true);
  button.dispatchEvent(new Event("click"));
  expect(focus).not.toHaveBeenCalled();
  view.question(Date.now());
  expect(button.hidden).toBe(false);
  const text = document.body.textContent;
  button.dispatchEvent(new Event("click"));
  expect(focus).toHaveBeenCalledOnce();
  expect(document.body.textContent).toBe(text);
  expect(document.body.attributes.get("data-question-active")).toBe("true");
  view.ended(Date.now());
  expect(button.hidden).toBe(true);
  button.dispatchEvent(new Event("click"));
  expect(focus).toHaveBeenCalledOnce();
  view.question(Date.now());
  expect(button.hidden).toBe(false);
  view.idle();
  expect(button.hidden).toBe(true);
});

it("shows Question Answered only for active alerts and reports the click", () => {
  const document = new DocumentFake();
  const answered = vi.fn();
  const view = createPipView(document as unknown as Document, () => {}, answered);
  const button = parts(document).answered;
  expect(button.textContent).toBe("Answered");
  view.idle();
  expect(button.hidden).toBe(true);
  button.dispatchEvent(new Event("click"));
  expect(answered).not.toHaveBeenCalled();
  view.question(Date.now());
  expect(button.hidden).toBe(false);
  button.dispatchEvent(new Event("click"));
  expect(answered).toHaveBeenCalledOnce();
  view.ended(Date.now());
  expect(button.hidden).toBe(true);
  button.dispatchEvent(new Event("click"));
  expect(answered).toHaveBeenCalledOnce();
});

it("forwards the answered control through the configured view", () => {
  vi.stubGlobal("chrome", undefined);
  const document = new DocumentFake();
  const answered = vi.fn();
  const view = createConfiguredPipView(document as unknown as Document, answered);
  view.question(Date.now());
  parts(document).answered.dispatchEvent(new Event("click"));
  expect(answered).toHaveBeenCalledOnce();
  view.idle();
});

it("returns to idle after an answer and keeps the next question eligible", async () => {
  const pip = Object.assign(new EventTarget(), {
    document: {} as Document,
    closed: false,
    close: vi.fn(),
  });
  const changed = vi.fn();
  const view = { idle: vi.fn(), question: vi.fn(), ended: vi.fn() };
  let onAnswered!: () => void;
  const controller = createPipController(
    { requestWindow: async () => pip as unknown as Window },
    changed,
    (_document, answer) => {
      onAnswered = answer;
      return view;
    },
    () => 16,
  );
  await controller.open();
  controller.question(100);
  onAnswered();
  expect(view.idle).toHaveBeenCalledTimes(2);
  expect(changed).toHaveBeenLastCalledWith({
    state: "OPEN_IDLE",
    opening: false,
  });
  controller.question(200);
  expect(view.question).toHaveBeenLastCalledWith(200);
});

it("ignores an answer when no question is active", async () => {
  const pip = Object.assign(new EventTarget(), {
    document: {} as Document,
    closed: false,
    close: vi.fn(),
  });
  const changed = vi.fn();
  const view = { idle: vi.fn(), question: vi.fn(), ended: vi.fn() };
  let onAnswered!: () => void;
  const controller = createPipController(
    { requestWindow: async () => pip as unknown as Window },
    changed,
    (_document, answer) => {
      onAnswered = answer;
      return view;
    },
    () => 16,
  );
  await controller.open();
  onAnswered();
  expect(view.idle).toHaveBeenCalledOnce();
  expect(changed).toHaveBeenLastCalledWith({
    state: "OPEN_IDLE",
    opening: false,
  });
});

it("wires the configured view to focus the opener synchronously without closing PiP", () => {
  const opener = { focus: vi.fn(), close: vi.fn() };
  vi.stubGlobal("window", opener);
  vi.stubGlobal("chrome", undefined);
  const pip = Object.assign(new EventTarget(), {
    setInterval: vi.fn(() => 1),
    clearInterval: vi.fn(),
    close: vi.fn(),
  });
  const document = Object.assign(new DocumentFake(), { defaultView: pip });
  const view = createConfiguredPipView(document as unknown as Document);
  view.question(Date.now());
  parts(document).goToQuestion.dispatchEvent(new Event("click"));
  expect(opener.focus).toHaveBeenCalledOnce();
  expect(opener.close).not.toHaveBeenCalled();
  expect(pip.close).not.toHaveBeenCalled();
  expect(pip.clearInterval).not.toHaveBeenCalled();
  view.idle();
});

it("returns the ended screen to idle two minutes after a question ends", async () => {
  vi.useFakeTimers();
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.open();
  f.controller.question(1);
  f.controller.ended(2);
  expect(f.view.ended).toHaveBeenCalledExactlyOnceWith(2);
  expect(f.view.idle).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(QUESTION_END_IDLE_MS - 1);
  expect(f.view.idle).toHaveBeenCalledOnce();
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "QUESTION_ENDED",
    opening: false,
  });
  vi.advanceTimersByTime(1);
  expect(f.view.idle).toHaveBeenCalledTimes(2);
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "OPEN_IDLE",
    opening: false,
  });
});

it("cancels the ended-screen timeout when a new question arrives", async () => {
  vi.useFakeTimers();
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.open();
  f.controller.question(1);
  f.controller.ended(2);
  f.controller.question(3);
  vi.advanceTimersByTime(QUESTION_END_IDLE_MS);
  expect(f.view.question).toHaveBeenLastCalledWith(3);
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "QUESTION_ACTIVE",
    opening: false,
  });
});

it("cancels the ended-screen timeout when the window closes", async () => {
  vi.useFakeTimers();
  const f = fixture();
  f.requestWindow.mockResolvedValue(f.pip as unknown as Window);
  await f.controller.open();
  f.controller.question(1);
  f.controller.ended(2);
  f.controller.close();
  vi.advanceTimersByTime(QUESTION_END_IDLE_MS);
  expect(f.view.idle).toHaveBeenCalledOnce();
  expect(f.changed).toHaveBeenLastCalledWith({
    state: "CLOSED",
    opening: false,
  });
});

it("adds a subset Google Rounded Symbols stylesheet link to each view document", () => {
  const document = new DocumentFake();
  createPipView(document as unknown as Document);
  const link = document.head.children[0]!;
  expect(link.attributes.get("rel")).toBe("stylesheet");
  expect(link.attributes.get("href")).toBe(
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=hourglass_empty,schedule&display=block",
  );
  expect(link.attributes.get("referrerpolicy")).toBe("no-referrer");
});
