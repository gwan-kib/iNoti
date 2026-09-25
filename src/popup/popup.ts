import { PULSE_KEY, preferenceStorage, pulsePreference, type PreferenceStorage } from '../shared/alert-preference';
import { SOUND_ENABLED_KEY, soundEnabled } from '../shared/sound-preference';

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

export type TabCreator = (properties: { url: string }) => unknown;
export type UrlResolver = (path: string) => string;

export function openDevTestingTab(createTab: TabCreator, getUrl: UrlResolver) {
  createTab({ url: getUrl('dev-testing/index.html') });
}

function initPopup() {
  const status = document.querySelector<HTMLElement>('#preference-status');
  const storage = preferenceStorage();
  const pulseInput = document.querySelector<HTMLInputElement>('#pulse-alerts');
  if (pulseInput && status && storage) void bindPulseSetting(pulseInput, status, storage);
  const soundInput = document.querySelector<HTMLInputElement>('#sound-alerts');
  if (soundInput && status && storage) void bindSoundSetting(soundInput, status, storage);
  const button = document.querySelector<HTMLButtonElement>('#open-dev-tester');
  if (!button) return;
  button.addEventListener('click', () => {
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
