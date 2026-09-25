import { logger } from './logging';
import type { NewQuestionDetectedMessage } from './messages';

export type MessageSender = (message: unknown) => Promise<unknown> | void;

function defaultSender(message: unknown): Promise<unknown> | void {
  // The content script and the extension-owned tester share this path. The local
  // hot-reload tester has no chrome runtime, so a missing channel is not an error.
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
  return chrome.runtime.sendMessage(message);
}

// Ask the worker to consider a sound alert. The worker owns the enabled
// preference and the registered sound id, so no audio path or user data ever
// crosses this boundary — only the fact that a genuine question was accepted.
export function requestNewQuestionSound(send: MessageSender = defaultSender, log = logger('content')) {
  log('sound requested');
  const message: NewQuestionDetectedMessage = { type: 'NEW_QUESTION_DETECTED' };
  try {
    const result = send(message);
    if (result && typeof result.catch === 'function') {
      void result.catch(() => log('sound request failed'));
    }
  } catch {
    log('sound request failed');
  }
}
