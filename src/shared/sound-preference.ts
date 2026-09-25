import { preferenceStorage, type PreferenceStorage } from "./alert-preference";
import { resolveSoundId, type SoundId } from "./sounds";

// Local-only sound settings, stored with chrome.storage.local alongside the
// pulse preference. No session, question, or student data is ever persisted.
export const SOUND_ENABLED_KEY = "soundEnabled";
export const SELECTED_SOUND_KEY = "selectedSoundId";

export interface SoundPreferences {
  enabled: boolean;
  soundId: SoundId;
}

// Boolean-only with an enabled default, matching the pulse preference policy.
export function soundEnabled(value: unknown): boolean {
  return typeof value === "boolean" ? value : true;
}

export function soundPreferences(
  values: Record<string, unknown>,
): SoundPreferences {
  return {
    enabled: soundEnabled(values[SOUND_ENABLED_KEY]),
    soundId: resolveSoundId(values[SELECTED_SOUND_KEY]),
  };
}

// Shared read used by the popup and dev tester so preference parsing stays in
// one module. Returns undefined when extension storage is unavailable.
export async function loadSoundPreferences(
  storage: PreferenceStorage | undefined = preferenceStorage(),
): Promise<SoundPreferences | undefined> {
  if (!storage) return undefined;
  return soundPreferences(
    await storage.local.get([SOUND_ENABLED_KEY, SELECTED_SOUND_KEY]),
  );
}

export async function saveSoundEnabled(
  enabled: boolean,
  storage: PreferenceStorage | undefined = preferenceStorage(),
): Promise<void> {
  await storage?.local.set({ [SOUND_ENABLED_KEY]: enabled });
}

export async function saveSelectedSoundId(
  soundId: SoundId,
  storage: PreferenceStorage | undefined = preferenceStorage(),
): Promise<void> {
  await storage?.local.set({ [SELECTED_SOUND_KEY]: soundId });
}
