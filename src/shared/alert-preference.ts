export const PULSE_KEY = 'pulseAlerts';

export interface PreferenceStorage {
  local: {
    get(key: string): Promise<Record<string, unknown>>;
    set(values: Record<string, unknown>): Promise<void>;
  };
  onChanged: {
    addListener(listener: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void): void;
    removeListener(listener: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void): void;
  };
}

export function preferenceStorage(): PreferenceStorage | undefined {
  return typeof chrome !== 'undefined' ? chrome.storage : undefined;
}

export function pulsePreference(value: unknown): boolean {
  return typeof value === 'boolean' ? value : true;
}

export function watchPulsePreference(changed: (enabled: boolean) => void, storage = preferenceStorage()): () => void {
  if (!storage) { changed(true); return () => {}; }
  let active = true;
  let revision = 0;
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (!active || area !== 'local' || !(PULSE_KEY in changes)) return;
    revision++;
    changed(pulsePreference(changes[PULSE_KEY]?.newValue));
  };
  storage.onChanged.addListener(listener);
  // A live change must win over an older, still-pending initial read.
  void storage.local.get(PULSE_KEY).then(values => {
    if (active && revision === 0) changed(pulsePreference(values[PULSE_KEY]));
  }).catch(() => {
    // Keep the solid background if a saved motion preference cannot be read.
    if (active && revision === 0) changed(false);
  });
  return () => { active = false; storage.onChanged.removeListener(listener); };
}
