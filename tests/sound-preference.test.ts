import { expect, it, vi } from "vitest";
import {
  SOUND_ENABLED_KEY,
  SELECTED_SOUND_KEY,
  soundEnabled,
  soundPreferences,
} from "../src/shared/sound-preference";
import { bindSoundChoice, bindSoundSetting } from "../src/popup/popup";
import type { PreferenceStorage } from "../src/shared/alert-preference";
import { ElementFake } from "./dom-fake";

it.each([undefined, true, false, "false", 1])(
  "defaults sound to enabled for %s",
  (value) => {
    expect(soundEnabled(value)).toBe(value === false ? false : true);
  },
);

it("resolves the selected sound and falls back for unknown ids", () => {
  expect(soundPreferences({})).toEqual({
    enabled: true,
    soundId: "default",
  });
  expect(
    soundPreferences({
      [SOUND_ENABLED_KEY]: false,
      [SELECTED_SOUND_KEY]: "default",
    }),
  ).toEqual({ enabled: false, soundId: "default" });
  expect(soundPreferences({ [SELECTED_SOUND_KEY]: "bubble" })).toEqual({
    enabled: true,
    soundId: "bubble",
  });
  expect(
    soundPreferences({ [SELECTED_SOUND_KEY]: "../../etc/passwd" }),
  ).toEqual({ enabled: true, soundId: "default" });
});

function fixture() {
  return {
    local: {
      get: vi.fn<PreferenceStorage["local"]["get"]>().mockResolvedValue({}),
      set: vi.fn<PreferenceStorage["local"]["set"]>().mockResolvedValue(),
    },
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  } satisfies PreferenceStorage;
}

it("loads and saves the popup sound toggle through the shared storage key", async () => {
  const storage = fixture();
  const input = Object.assign(new ElementFake(), { checked: false });
  const status = new ElementFake();
  await bindSoundSetting(
    input as unknown as HTMLInputElement,
    status as unknown as HTMLElement,
    storage,
  );
  expect(input.checked).toBe(true);
  input.checked = false;
  input.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(storage.local.set).toHaveBeenCalledWith({ soundEnabled: false });
});

it("rolls the sound toggle back when the write fails", async () => {
  const storage = fixture();
  const input = Object.assign(new ElementFake(), { checked: false });
  const status = new ElementFake();
  await bindSoundSetting(
    input as unknown as HTMLInputElement,
    status as unknown as HTMLElement,
    storage,
  );
  storage.local.set.mockRejectedValue(new Error("private"));
  input.checked = false;
  input.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(input.checked).toBe(true);
  expect(status.textContent).toContain("Could not save");
  expect(status.textContent).not.toContain("private");
});

it("keeps the sound toggle disabled if loading fails", async () => {
  const storage = fixture();
  storage.local.get.mockRejectedValue(new Error("private"));
  const input = new ElementFake();
  const status = new ElementFake();
  await bindSoundSetting(
    input as unknown as HTMLInputElement,
    status as unknown as HTMLElement,
    storage,
  );
  expect(input.disabled).toBe(true);
  expect(status.textContent).toContain("Could not load");
});

it("loads and saves the selected sound through the shared key", async () => {
  const storage = fixture();
  storage.local.get.mockResolvedValue({ [SELECTED_SOUND_KEY]: "bubble" });
  const select = new ElementFake();
  const status = new ElementFake();
  await bindSoundChoice(
    select as unknown as HTMLSelectElement,
    status as unknown as HTMLElement,
    storage,
  );
  expect(select.value).toBe("bubble");
  select.value = "success";
  select.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(select.disabled).toBe(false));
  expect(storage.local.set).toHaveBeenCalledWith({
    selectedSoundId: "success",
  });
});

it("falls back to the default sound and rolls back a failed selection write", async () => {
  const storage = fixture();
  storage.local.get.mockResolvedValue({
    [SELECTED_SOUND_KEY]: "../../etc/passwd",
  });
  const select = new ElementFake();
  const status = new ElementFake();
  await bindSoundChoice(
    select as unknown as HTMLSelectElement,
    status as unknown as HTMLElement,
    storage,
  );
  expect(select.value).toBe("default");
  storage.local.set.mockRejectedValue(new Error("private"));
  select.value = "pop";
  select.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(select.disabled).toBe(false));
  expect(select.value).toBe("default");
  expect(status.textContent).toContain("Could not save");
  expect(status.textContent).not.toContain("private");
});
