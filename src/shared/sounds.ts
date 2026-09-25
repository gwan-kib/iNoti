// Central registry for selectable notification sounds. The worker and the
// offscreen player resolve file paths only through this module, so an arbitrary
// stored string can never become an audio URL.
//
// To add another sound later: drop the file under assets/sounds/ (the build
// copies the whole directory) and add one entry below with a stable id. No
// message, worker, or playback code needs to change.
export type SoundId =
  "default-chime" | "soft-bell" | "bright-ping" | "calm-echo";

export interface SoundOption {
  id: SoundId;
  label: string;
  // Extension-root-relative path; playback resolves it with chrome.runtime.getURL.
  path: string;
}

export const SOUND_OPTIONS: readonly SoundOption[] = [
  {
    id: "default-chime",
    label: "Default Chime",
    path: "assets/sounds/default-chime.wav",
  },
  { id: "soft-bell", label: "Soft Bell", path: "assets/sounds/soft-bell.wav" },
  {
    id: "bright-ping",
    label: "Bright Ping",
    path: "assets/sounds/bright-ping.wav",
  },
  { id: "calm-echo", label: "Calm Echo", path: "assets/sounds/calm-echo.wav" },
];

export const DEFAULT_SOUND_ID: SoundId = SOUND_OPTIONS[0]!.id;

export function isSoundId(value: unknown): value is SoundId {
  return (
    typeof value === "string" &&
    SOUND_OPTIONS.some((option) => option.id === value)
  );
}

// Stored preferences use this lenient resolver: unknown or malformed values fall
// back to the default sound instead of surfacing an error.
export function resolveSoundId(value: unknown): SoundId {
  return isSoundId(value) ? value : DEFAULT_SOUND_ID;
}

// Strict lookup used before playback; an unregistered id returns undefined.
export function soundPathFor(id: SoundId): string | undefined {
  return SOUND_OPTIONS.find((option) => option.id === id)?.path;
}
