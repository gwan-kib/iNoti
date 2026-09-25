import { expect, it } from 'vitest';
import { DEFAULT_SOUND_ID, SOUND_OPTIONS, isSoundId, resolveSoundId, soundPathFor } from '../src/shared/sounds';

it('registers the bundled selectable sounds with unique ids and paths', () => {
  expect(SOUND_OPTIONS).toEqual([
    { id: 'default-chime', label: 'Default Chime', path: 'assets/sounds/default-chime.wav' },
    { id: 'soft-bell', label: 'Soft Bell', path: 'assets/sounds/soft-bell.wav' },
    { id: 'bright-ping', label: 'Bright Ping', path: 'assets/sounds/bright-ping.wav' },
    { id: 'calm-echo', label: 'Calm Echo', path: 'assets/sounds/calm-echo.wav' },
  ]);
  expect(new Set(SOUND_OPTIONS.map(option => option.id)).size).toBe(SOUND_OPTIONS.length);
  expect(new Set(SOUND_OPTIONS.map(option => option.path)).size).toBe(SOUND_OPTIONS.length);
  expect(DEFAULT_SOUND_ID).toBe('default-chime');
});

it('resolves registered ids and rejects arbitrary strings', () => {
  expect(isSoundId('default-chime')).toBe(true);
  expect(isSoundId('soft-bell')).toBe(true);
  expect(isSoundId('../../etc/passwd')).toBe(false);
  expect(isSoundId(7)).toBe(false);
  expect(resolveSoundId('bright-ping')).toBe('bright-ping');
  expect(resolveSoundId('unknown-tone')).toBe('default-chime');
  expect(resolveSoundId(undefined)).toBe('default-chime');
  expect(soundPathFor('calm-echo')).toBe('assets/sounds/calm-echo.wav');
});
