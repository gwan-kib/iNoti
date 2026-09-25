import { logger } from '../shared/logging';
import { isPlaySoundMessage } from '../shared/messages';
import { isSoundId, soundPathFor } from '../shared/sounds';

const log = logger('offscreen');

export interface OffscreenPlayer {
  handleMessage(message: unknown): void;
}

// The offscreen document has one job: play a registered sound on a validated
// internal message. Injected here so the audio boundary stays mockable.
export function createOffscreenPlayer(
  getUrl: (path: string) => string,
  createAudio: (src: string) => HTMLAudioElement,
): OffscreenPlayer {
  let current: HTMLAudioElement | undefined;
  return {
    handleMessage(message) {
      if (!isPlaySoundMessage(message)) return;
      const { soundId } = message;
      // A message can only name a registry id; unknown ids never reach the file system.
      if (!isSoundId(soundId)) {
        log('rejected unregistered sound');
        return;
      }
      const path = soundPathFor(soundId);
      if (!path) {
        log('rejected unregistered sound');
        return;
      }
      // Stop the previous chime so a rapid next question restarts cleanly instead
      // of stacking overlapping audio. Each alert gets a fresh element.
      current?.pause();
      const audio = createAudio(getUrl(path));
      current = audio;
      // play() rejects when autoplay/audio output is unavailable; never surface it.
      void Promise.resolve(audio.play()).catch(() => log('sound playback failed'));
    },
  };
}

function defaultPlayer(): OffscreenPlayer {
  return createOffscreenPlayer(
    (path) => chrome.runtime.getURL(path),
    (src) => new Audio(src),
  );
}

export function registerOffscreenPlayer(player: OffscreenPlayer = defaultPlayer()) {
  chrome.runtime.onMessage.addListener((message) => {
    player.handleMessage(message);
    return false;
  });
}

// Only the real offscreen document registers itself; tests inject a player.
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  registerOffscreenPlayer();
}
