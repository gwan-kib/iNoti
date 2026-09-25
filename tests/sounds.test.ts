import { expect, it } from 'vitest';
import { DEFAULT_SOUND_ID, SOUND_OPTIONS, isSoundId, resolveSoundId, soundPathFor } from '../src/shared/sounds';

it('registers exactly the bundled default chime', () => {
  expect(SOUND_OPTIONS).toEqual([
    { id: 'default-chime', label: 'Default Chime', path: 'assets/sounds/default-chime.wav' },
  ]);
  expect(DEFAULT_SOUND_ID).toBe('default-chime');
});

it('resolves registered ids and rejects arbitrary strings', () => {
  expect(isSoundId('default-chime')).toBe(true);
  expect(isSoundId('../../etc/passwd')).toBe(false);
  expect(isSoundId(7)).toBe(false);
  expect(resolveSoundId('default-chime')).toBe('default-chime');
  expect(resolveSoundId('soft-bell')).toBe('default-chime');
  expect(resolveSoundId(undefined)).toBe('default-chime');
  expect(soundPathFor('default-chime')).toBe('assets/sounds/default-chime.wav');
});
