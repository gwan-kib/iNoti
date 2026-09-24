import { logger, safeError } from '../shared/logging';
import { pipDimensionsInPixels } from '../shared/pip-dimensions';
import { createPipView, type PipView } from './pip-view';

export interface DocumentPip {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
}
export type MonitoringState = 'UNMONITORED' | 'MONITORING_IDLE' | 'MONITORING_QUESTION_ACTIVE';
export interface MonitoringStatus {
  state: MonitoringState;
  opening: boolean;
  issue?: 'unsupported' | 'failed';
}

export function documentPip(page: Window): DocumentPip | undefined {
  const api = (page as Window & { documentPictureInPicture?: DocumentPip }).documentPictureInPicture;
  return typeof api?.requestWindow === 'function' ? api : undefined;
}

export function createPipController(
  api: DocumentPip | undefined,
  changed: (status: MonitoringStatus) => void,
  makeView: (document: Document) => PipView = createPipView,
  rootFontSize: () => number = () => parseFloat(getComputedStyle(document.documentElement).fontSize),
) {
  const log = logger('pip');
  let status: MonitoringStatus = { state: 'UNMONITORED', opening: false };
  let pip: Window | undefined;
  let view: PipView | undefined;
  let generation = 0;
  const update = (next: MonitoringStatus) => { status = next; changed(status); };
  const stop = () => {
    // Invalidate pending opens too: navigation can leave the session before resolution.
    generation++;
    const old = pip;
    pip = undefined;
    view = undefined;
    update({ state: 'UNMONITORED', opening: false });
    old?.close();
    log('monitoring stopped');
  };
  return {
    stop,
    async start() {
      if (status.opening || status.state !== 'UNMONITORED') return;
      log('start monitoring requested');
      if (!api) {
        log('PiP support unavailable');
        update({ state: 'UNMONITORED', opening: false, issue: 'unsupported' });
        return;
      }
      const request = ++generation;
      update({ state: 'UNMONITORED', opening: true });
      let opened: Window | undefined;
      try {
        // No await before this call: preserve the button's transient user activation.
        opened = await api.requestWindow(pipDimensionsInPixels(rootFontSize()));
        if (request !== generation) { opened.close(); return; }
        if (opened.closed) throw new Error('PiP closed before initialization');
        pip = opened;
        opened.addEventListener('pagehide', () => {
          if (pip !== opened) return;
          log('PiP closed');
          stop();
        }, { once: true });
        view = makeView(opened.document);
        view.idle();
        update({ state: 'MONITORING_IDLE', opening: false });
        log('PiP opened');
        log('monitoring started');
        log('PiP -> idle');
      } catch (error) {
        if (request !== generation) { opened?.close(); return; }
        pip = undefined;
        view = undefined;
        opened?.close();
        log('PiP opening failed', { reason: safeError(error) });
        update({ state: 'UNMONITORED', opening: false, issue: 'failed' });
      }
    },
    question(detectedAt: number) {
      if (!pip || !view || status.state !== 'MONITORING_IDLE') return;
      if (pip.closed) { stop(); return; }
      view.question(detectedAt);
      update({ state: 'MONITORING_QUESTION_ACTIVE', opening: false });
      log('PiP -> question active');
    },
    idle() {
      if (!pip || !view || status.state !== 'MONITORING_QUESTION_ACTIVE') return;
      if (pip.closed) { stop(); return; }
      view.idle();
      update({ state: 'MONITORING_IDLE', opening: false });
      log('PiP -> idle');
    },
  };
}
