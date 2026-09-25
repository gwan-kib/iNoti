import { PULSE_KEY, preferenceStorage, pulsePreference, type PreferenceStorage } from '../shared/alert-preference';
import { SELECTED_SOUND_KEY, SOUND_ENABLED_KEY, soundEnabled } from '../shared/sound-preference';
import { DEFAULT_SOUND_ID, SOUND_OPTIONS, resolveSoundId } from '../shared/sounds';
import { requestSoundPreview } from '../shared/sound-request';
import { DEV_TESTING_ENABLED } from '../shared/dev-settings';

type BooleanReader = (value: unknown) => boolean;

async function bindBooleanSetting(
  input: HTMLInputElement,
  status: HTMLElement,
  storage: PreferenceStorage,
  key: string,
  read: BooleanReader,
) {
  let saved = true;
  input.disabled = true;
  try {
    saved = read((await storage.local.get(key))[key]);
    input.checked = saved;
    input.disabled = false;
  } catch {
    status.textContent = 'Could not load preference. Reopen the popup to retry.';
    return;
  }
  input.addEventListener('change', async () => {
    input.disabled = true;
    const next = input.checked;
    status.textContent = '';
    try {
      await storage.local.set({ [key]: next });
      saved = next;
    } catch {
      input.checked = saved;
      status.textContent = 'Could not save preference. Please try again.';
    } finally {
      input.disabled = false;
    }
  });
}

export function bindPulseSetting(input: HTMLInputElement, status: HTMLElement, storage: PreferenceStorage) {
  return bindBooleanSetting(input, status, storage, PULSE_KEY, pulsePreference);
}

export function bindSoundSetting(input: HTMLInputElement, status: HTMLElement, storage: PreferenceStorage) {
  return bindBooleanSetting(input, status, storage, SOUND_ENABLED_KEY, soundEnabled);
}

export function populateSoundOptions(select: HTMLSelectElement) {
  for (const option of SOUND_OPTIONS) {
    const element = document.createElement('option');
    element.value = option.id;
    element.textContent = option.label;
    select.append(element);
  }
}

export async function bindSoundChoice(select: HTMLSelectElement, status: HTMLElement, storage: PreferenceStorage) {
  let saved = DEFAULT_SOUND_ID;
  select.disabled = true;
  try {
    saved = resolveSoundId((await storage.local.get(SELECTED_SOUND_KEY))[SELECTED_SOUND_KEY]);
    select.value = saved;
    select.disabled = false;
  } catch {
    status.textContent = 'Could not load preference. Reopen the popup to retry.';
    return;
  }
  select.addEventListener('change', async () => {
    select.disabled = true;
    // Only registered ids can be stored, so storage can never hold a raw path.
    const next = resolveSoundId(select.value);
    status.textContent = '';
    try {
      await storage.local.set({ [SELECTED_SOUND_KEY]: next });
      saved = next;
      select.value = next;
    } catch {
      select.value = saved;
      status.textContent = 'Could not save preference. Please try again.';
    } finally {
      select.disabled = false;
    }
  });
}

export type TabCreator = (properties: { url: string }) => unknown;
export type UrlResolver = (path: string) => string;

export function openDevTestingTab(createTab: TabCreator, getUrl: UrlResolver) {
  createTab({ url: getUrl('dev-testing/index.html') });
}

// Gates the dev tester entry by the DEV_TESTING_ENABLED build flag. When off the
// button is removed from the DOM so it cannot exist or be focused.
export function bindDevTestingButton(
  button: HTMLButtonElement | null,
  enabled: boolean,
  onClick: () => void,
) {
  if (!button) return;
  if (!enabled) {
    button.remove();
    return;
  }
  button.addEventListener('click', onClick);
}

function initPopup() {
  const status = document.querySelector<HTMLElement>('#preference-status');
  const storage = preferenceStorage();
  const pulseInput = document.querySelector<HTMLInputElement>('#pulse-alerts');
  if (pulseInput && status && storage) void bindPulseSetting(pulseInput, status, storage);
  const soundInput = document.querySelector<HTMLInputElement>('#sound-alerts');
  if (soundInput && status && storage) void bindSoundSetting(soundInput, status, storage);
  const soundChoice = document.querySelector<HTMLSelectElement>('#sound-choice');
  if (soundChoice && status && storage) {
    populateSoundOptions(soundChoice);
    void bindSoundChoice(soundChoice, status, storage);
  }
  const testSound = document.querySelector<HTMLButtonElement>('#test-sound');
  if (testSound) testSound.addEventListener('click', () => requestSoundPreview());
  bindDevTestingButton(document.querySelector<HTMLButtonElement>('#open-dev-tester'), DEV_TESTING_ENABLED, () => {
    openDevTestingTab(
      (properties) => chrome.tabs.create(properties),
      (path) => chrome.runtime.getURL(path),
    );
    window.close();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPopup, { once: true });
  else initPopup();
}
