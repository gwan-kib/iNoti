import { expect, it, vi } from "vitest";
import {
  PULSE_KEY,
  watchPulsePreference,
  type PreferenceStorage,
} from "../src/shared/alert-preference";
import { bindPulseSetting } from "../src/popup/popup";
import { createPipView } from "../src/content/pip-view";
import { DocumentFake, ElementFake } from "./dom-fake";

function fixture() {
  const storage = {
    local: {
      get: vi.fn<PreferenceStorage["local"]["get"]>().mockResolvedValue({}),
      set: vi.fn<PreferenceStorage["local"]["set"]>().mockResolvedValue(),
    },
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  };
  const changed = vi.fn();
  const emit = (value: unknown, area = "local") => {
    storage.onChanged.addListener.mock.calls[0]![0](
      { [PULSE_KEY]: { newValue: value } },
      area,
    );
  };
  return { storage, changed, emit };
}

it.each([undefined, true, false, "false"])(
  "loads preference %s with boolean-only defaults",
  async (value) => {
    const f = fixture();
    f.storage.local.get.mockResolvedValue({ [PULSE_KEY]: value });
    const stop = watchPulsePreference(f.changed, f.storage);
    await vi.waitFor(() =>
      expect(f.changed).toHaveBeenCalledWith(value === false ? false : true),
    );
    stop();
    expect(f.storage.onChanged.removeListener).toHaveBeenCalledWith(
      f.storage.onChanged.addListener.mock.calls[0]![0],
    );
  },
);

it("keeps live local changes ahead of stale reads and ignores updates after cleanup", async () => {
  const f = fixture();
  let resolve!: (value: Record<string, unknown>) => void;
  f.storage.local.get.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const stop = watchPulsePreference(f.changed, f.storage);
  f.emit(false, "sync");
  expect(f.changed).not.toHaveBeenCalled();
  f.emit(false);
  resolve({ [PULSE_KEY]: true });
  await Promise.resolve();
  expect(f.changed).toHaveBeenCalledExactlyOnceWith(false);
  f.emit(undefined);
  expect(f.changed).toHaveBeenLastCalledWith(true);
  stop();
  f.emit(false);
  expect(f.changed).toHaveBeenCalledTimes(2);
});

it("uses a solid background after read failure and ignores a read after disposal", async () => {
  const f = fixture();
  f.storage.local.get.mockRejectedValue(new Error("private"));
  const stop = watchPulsePreference(f.changed, f.storage);
  await vi.waitFor(() => expect(f.changed).toHaveBeenCalledWith(false));
  stop();
  f.changed.mockClear();
  f.storage.local.get.mockResolvedValue({ [PULSE_KEY]: true });
  watchPulsePreference(f.changed, f.storage)();
  await Promise.resolve();
  expect(f.changed).not.toHaveBeenCalled();
});

it("saves the popup toggle and restores its saved value on write failure", async () => {
  const f = fixture();
  const input = Object.assign(new ElementFake(), { checked: false });
  const status = new ElementFake();
  await bindPulseSetting(
    input as unknown as HTMLInputElement,
    status as unknown as HTMLElement,
    f.storage,
  );
  expect(input.checked).toBe(true);
  input.checked = false;
  input.dispatchEvent(new Event("change"));
  expect(input.disabled).toBe(true);
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(f.storage.local.set).toHaveBeenCalledWith({ pulseAlerts: false });
  f.storage.local.set.mockRejectedValue(new Error("private"));
  input.checked = true;
  input.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(input.checked).toBe(false);
  expect(status.textContent).toContain("Could not save");
  expect(status.textContent).not.toContain("private");
});

it("keeps the popup disabled if loading fails", async () => {
  const f = fixture();
  f.storage.local.get.mockRejectedValue(new Error("private"));
  const input = new ElementFake();
  const status = new ElementFake();
  await bindPulseSetting(
    input as unknown as HTMLInputElement,
    status as unknown as HTMLElement,
    f.storage,
  );
  expect(input.disabled).toBe(true);
  expect(status.textContent).toContain("Could not load");
});

it("changes motion during an active question without changing content or alert state", () => {
  const document = new DocumentFake();
  const view = createPipView(document as unknown as Document);
  view.setPulseEnabled(true);
  view.idle();
  expect(document.body.attributes.get("data-question-active")).toBe("false");
  view.question(123);
  const text = document.body.textContent;
  view.setPulseEnabled(false);
  expect(document.body.attributes.get("data-pulse")).toBe("false");
  expect(document.body.attributes.get("data-question-active")).toBe("true");
  expect(document.body.textContent).toBe(text);
  view.idle();
  expect(document.body.attributes.get("data-question-active")).toBe("false");
  view.question(456);
  expect(document.body.attributes.get("data-pulse")).toBe("false");
});
