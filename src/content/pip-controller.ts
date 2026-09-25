import { logger, safeError } from '../shared/logging';
import { pipDimensionsInPixels } from '../shared/pip-dimensions';
import { type PipView } from './pip-view';
import { createConfiguredPipView } from './configured-pip-view';

export interface DocumentPip {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
}
// PiP presentation state only. Monitoring whether iClicker is observed lives in
// monitor.ts; a closed window never stops monitoring.
export type PipState = 'CLOSED' | 'OPEN_IDLE' | 'QUESTION_ACTIVE' | 'QUESTION_ENDED';
export interface PipStatus {
  state: PipState;
  opening: boolean;
  issue?: 'unsupported' | 'failed';
}

// An ended screen is only useful briefly; return the window to idle afterwards
// so a later question is not shown against a stale "Question ended" state.
export const QUESTION_END_IDLE_MS = 2 * 60 * 1000;

export function documentPip(page: Window): DocumentPip | undefined {
  const api = (page as Window & { documentPictureInPicture?: DocumentPip }).documentPictureInPicture;
  return typeof api?.requestWindow === 'function' ? api : undefined;
}

export function createPipController(
  api: DocumentPip | undefined,
  changed: (status: PipStatus) => void,
  makeView: (document: Document, answerQuestion: () => void) => PipView = createConfiguredPipView,
  rootFontSize: () => number = () => parseFloat(getComputedStyle(document.documentElement).fontSize),
) {
  const log = logger('pip');
  let status: PipStatus = { state: 'CLOSED', opening: false };
  let pip: Window | undefined;
  let view: PipView | undefined;
  let generation = 0;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const clearIdleTimer = () => {
    if (idleTimer !== undefined) clearTimeout(idleTimer);
    idleTimer = undefined;
  };
  const update = (next: PipStatus) => { status = next; changed(status); };
  const close = () => {
    // Invalidate pending opens too: leaving the session can race an in-flight request.
    generation++;
    clearIdleTimer();
    const old = pip;
    pip = undefined;
    view = undefined;
    update({ state: 'CLOSED', opening: false });
    old?.close();
    log('notification window closed');
  };
  const answered = () => {
    // Manual dismissal returns the window to idle while monitoring stays on; the
    // next detected question remains eligible.
    if (!pip || !view || status.state !== 'QUESTION_ACTIVE') return;
    if (pip.closed) { close(); return; }
    clearIdleTimer();
    view.idle();
    update({ state: 'OPEN_IDLE', opening: false });
    log('PiP -> idle after answer');
  };
  // The ended screen is transient: after a fixed delay it returns to idle unless
  // a new question or a close already replaced it.
  const scheduleIdleAfterEnd = () => {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      idleTimer = undefined;
      if (!pip || !view || status.state !== 'QUESTION_ENDED') return;
      if (pip.closed) { close(); return; }
      view.idle();
      update({ state: 'OPEN_IDLE', opening: false });
      log('PiP -> idle after end timeout');
    }, QUESTION_END_IDLE_MS);
  };
  return {
    close,
    answered,
    idle() {
      if (!pip || !view) return;
      if (pip.closed) { close(); return; }
      clearIdleTimer();
      view.idle();
      update({ state: 'OPEN_IDLE', opening: false });
      log('PiP -> idle');
    },
    async open() {
      if (status.opening || status.state !== 'CLOSED') return;
      log('open notification window requested');
      clearIdleTimer();
      if (!api) {
        log('PiP support unavailable');
        update({ state: 'CLOSED', opening: false, issue: 'unsupported' });
        return;
      }
      const request = ++generation;
      update({ state: 'CLOSED', opening: true });
      let opened: Window | undefined;
      try {
        // No await before this call: preserve the button's transient user activation.
        opened = await api.requestWindow(pipDimensionsInPixels(rootFontSize()));
        if (request !== generation) { opened.close(); return; }
        if (opened.closed) throw new Error('PiP closed before initialization');
        pip = opened;
        opened.addEventListener('pagehide', () => {
          if (pip !== opened) return;
          log('PiP window closed');
          close();
        }, { once: true });
        view = makeView(opened.document, answered);
        view.idle();
        update({ state: 'OPEN_IDLE', opening: false });
        log('PiP opened');
      } catch (error) {
        if (request !== generation) { opened?.close(); return; }
        pip = undefined;
        view = undefined;
        opened?.close();
        log('PiP opening failed', { reason: safeError(error) });
        update({ state: 'CLOSED', opening: false, issue: 'failed' });
      }
    },
    question(detectedAt: number) {
      // Optional surface: with no window open this is a no-op, not an error.
      if (!pip || !view || (status.state !== 'OPEN_IDLE' && status.state !== 'QUESTION_ENDED')) return;
      if (pip.closed) { close(); return; }
      clearIdleTimer();
      view.question(detectedAt);
      update({ state: 'QUESTION_ACTIVE', opening: false });
      log('PiP -> question active');
    },
    ended(endedAt: number) {
      if (!pip || !view || status.state !== 'QUESTION_ACTIVE') return;
      if (pip.closed) { close(); return; }
      view.ended(endedAt);
      update({ state: 'QUESTION_ENDED', opening: false });
      log('PiP -> question ended');
      scheduleIdleAfterEnd();
    },
  };
}
