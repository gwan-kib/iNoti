import { expect, it, vi } from 'vitest';
import { SOUND_ENABLED_KEY, SELECTED_SOUND_KEY, soundEnabled, soundPreferences } from '../src/shared/sound-preference';
import { bindSoundSetting } from '../src/popup/popup';
import type { PreferenceStorage } from '../src/shared/alert-preference';
import { ElementFake } from './dom-fake';

it.each([undefined, true, false, 'false', 1])('defaults sound to enabled for %s', value => {
  expect(soundEnabled(value)).toBe(value === false ? false : true);
});

it('resolves the selected sound and falls back for unknown ids', () => {
  expect(soundPreferences({})).toEqual({ enabled: true, soundId: 'default-chime' });
  expect(soundPreferences({ [SOUND_ENABLED_KEY]: false, [SELECTED_SOUND_KEY]: 'default-chime' }))
    .toEqual({ enabled: false, soundId: 'default-chime' });
  expect(soundPreferences({ [SELECTED_SOUND_KEY]: '../../etc/passwd' }))
    .toEqual({ enabled: true, soundId: 'default-chime' });
});

function fixture() {
  return {
    local: {
      get: vi.fn<PreferenceStorage['local']['get']>().mockResolvedValue({}),
      set: vi.fn<PreferenceStorage['local']['set']>().mockResolvedValue(),
    },
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  } satisfies PreferenceStorage;
}

it('loads and saves the popup sound toggle through the shared storage key', async () => {
  const storage = fixture();
  const input = Object.assign(new ElementFake(), { checked: false });
  const status = new ElementFake();
  await bindSoundSetting(input as unknown as HTMLInputElement, status as unknown as HTMLElement, storage);
  expect(input.checked).toBe(true);
  input.checked = false;
  input.dispatchEvent(new Event('change'));
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(storage.local.set).toHaveBeenCalledWith({ soundEnabled: false });
});

it('rolls the sound toggle back when the write fails', async () => {
  const storage = fixture();
  const input = Object.assign(new ElementFake(), { checked: false });
  const status = new ElementFake();
  await bindSoundSetting(input as unknown as HTMLInputElement, status as unknown as HTMLElement, storage);
  storage.local.set.mockRejectedValue(new Error('private'));
  input.checked = false;
  input.dispatchEvent(new Event('change'));
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(input.checked).toBe(true);
  expect(status.textContent).toContain('Could not save');
  expect(status.textContent).not.toContain('private');
});

it('keeps the sound toggle disabled if loading fails', async () => {
  const storage = fixture();
  storage.local.get.mockRejectedValue(new Error('private'));
  const input = new ElementFake();
  const status = new ElementFake();
  await bindSoundSetting(input as unknown as HTMLInputElement, status as unknown as HTMLElement, storage);
  expect(input.disabled).toBe(true);
  expect(status.textContent).toContain('Could not load');
});
