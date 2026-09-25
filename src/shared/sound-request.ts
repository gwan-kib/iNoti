import { logger } from './logging';
import type { NewQuestionDetectedMessage, PreviewSoundMessage } from './messages';

export type MessageSender = (message: unknown) => Promise<unknown> | void;

function defaultSender(message: unknown): Promise<unknown> | void {
  // The content script, popup, and extension-owned tester share this path. The
  // local hot-reload tester has no chrome runtime, so a missing channel is not an error.
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
  return chrome.runtime.sendMessage(message);
}

function send(sender: MessageSender, message: unknown, log: (event: string) => void) {
  try {
    const result = sender(message);
    if (result && typeof result.catch === 'function') {
      void result.catch(() => log('sound request failed'));
    }
  } catch {
    log('sound request failed');
  }
}

// Ask the worker to consider a sound alert. The worker owns the enabled
// preference and the registered sound id, so no audio path or user data ever
// crosses this boundary — only the fact that a genuine question was accepted.
export function requestNewQuestionSound(sender: MessageSender = defaultSender, log = logger('content')) {
  log('sound requested');
  send(sender, { type: 'NEW_QUESTION_DETECTED' } satisfies NewQuestionDetectedMessage, log);
}

// Explicit popup preview of the selected sound. Unlike a new-question alert this
// is a direct user action, so the worker plays it even when sound is disabled.
export function requestSoundPreview(sender: MessageSender = defaultSender, log = logger('content')) {
  log('sound preview requested');
  send(sender, { type: 'PREVIEW_SOUND' } satisfies PreviewSoundMessage, log);
}
