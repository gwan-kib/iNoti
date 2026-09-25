import { resolveSoundId, type SoundId } from './sounds';

// Local-only sound settings, stored with chrome.storage.local alongside the
// pulse preference. No session, question, or student data is ever persisted.
export const SOUND_ENABLED_KEY = 'soundEnabled';
export const SELECTED_SOUND_KEY = 'selectedSoundId';

export interface SoundPreferences {
  enabled: boolean;
  soundId: SoundId;
}

// Boolean-only with an enabled default, matching the pulse preference policy.
export function soundEnabled(value: unknown): boolean {
  return typeof value === 'boolean' ? value : true;
}

export function soundPreferences(values: Record<string, unknown>): SoundPreferences {
  return {
    enabled: soundEnabled(values[SOUND_ENABLED_KEY]),
    soundId: resolveSoundId(values[SELECTED_SOUND_KEY]),
  };
}
