import { PULSE_KEY, preferenceStorage, pulsePreference, type PreferenceStorage } from '../shared/alert-preference';

export async function bindPulseSetting(input: HTMLInputElement, status: HTMLElement, storage: PreferenceStorage) {
  let saved = true;
  input.disabled = true;
  try {
    saved = pulsePreference((await storage.local.get(PULSE_KEY))[PULSE_KEY]);
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
      await storage.local.set({ [PULSE_KEY]: next });
      saved = next;
    } catch {
      input.checked = saved;
      status.textContent = 'Could not save preference. Please try again.';
    } finally {
      input.disabled = false;
    }
  });
}

export type TabCreator = (properties: { url: string }) => unknown;
export type UrlResolver = (path: string) => string;

export function openDevTestingTab(createTab: TabCreator, getUrl: UrlResolver) {
  createTab({ url: getUrl('dev-testing/index.html') });
}

function initPopup() {
  const input = document.querySelector<HTMLInputElement>('#pulse-alerts');
  const status = document.querySelector<HTMLElement>('#preference-status');
  const storage = preferenceStorage();
  if (input && status && storage) void bindPulseSetting(input, status, storage);
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
