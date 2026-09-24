import { createBrandLogo } from '../shared/brand-logo';
import pipStyles from './pip-view.css?inline';

// Inline styles need explicit HMR because they live in preview/PiP documents.
const liveStyles = new Set<HTMLStyleElement>();
let currentStyles = pipStyles;
if (import.meta.hot) {
  import.meta.hot.accept('./pip-view.css?inline', (updated) => {
    if (!updated) return;
    currentStyles = updated.default;
    for (const style of liveStyles) {
      if (style.isConnected) style.textContent = updated.default;
      else liveStyles.delete(style);
    }
  });
  import.meta.hot.dispose(() => liveStyles.clear());
}

export interface PipView {
  idle(): void;
  question(detectedAt: number): void;
  ended(endedAt: number): void;
}

export function createPipView(document: Document): PipView & { setPulseEnabled(enabled: boolean): void } {
  document.title = 'iNoti';
  document.documentElement.lang = 'en';
  const style = document.createElement('style');
  // PiP owns a dynamic document; bundle the separate stylesheet for local injection.
  style.textContent = currentStyles;
  const main = document.createElement('main');
  main.setAttribute('role', 'status');
  main.setAttribute('aria-live', 'polite');
  const brand = document.createElement('div');
  brand.className = 'brand';
  const brandText = document.createElement('span');
  brandText.className = 'brand-text';
  brandText.textContent = 'iNoti';
  brand.append(createBrandLogo(document), brandText);
  const title = document.createElement('h1');
  title.className = 'question-title';
  const titleText = document.createElement('span');
  titleText.className = 'question-title-text';
  titleText.textContent = 'New iClicker Question';
  title.append(titleText);
  const time = document.createElement('p');
  time.className = 'detection-time';
  const timeText = document.createElement('span');
  timeText.className = 'detection-time-text';
  time.append(timeText);
  const elapsed = document.createElement('p');
  elapsed.className = 'elapsed-time';
  // Announce the question once, not every second as the timer changes.
  elapsed.setAttribute('role', 'timer');
  elapsed.setAttribute('aria-live', 'off');
  const elapsedText = document.createElement('span');
  elapsedText.className = 'elapsed-time-text';
  elapsed.append(elapsedText);
  main.append(brand, title, time, elapsed);
  document.head.append(style);
  if (import.meta.hot) liveStyles.add(style);
  document.body.replaceChildren(main);
  const page = document.defaultView;
  let interval: number | undefined;
  const stopTimer = () => {
    if (interval !== undefined) page?.clearInterval(interval);
    interval = undefined;
  };
  page?.addEventListener('pagehide', stopTimer, { once: true });
  return {
    setPulseEnabled(enabled) {
      document.body.setAttribute('data-pulse', String(enabled));
    },
    idle() {
      stopTimer();
      document.body.setAttribute('data-question-active', 'false');
      title.hidden = time.hidden = elapsed.hidden = true;
      timeText.textContent = '';
      elapsedText.textContent = '';
      main.setAttribute('aria-label', 'iNoti monitoring: waiting for a new question');
    },
    question(detectedAt) {
      stopTimer();
      titleText.textContent = 'New iClicker Question';
      document.body.setAttribute('data-question-active', 'true');
      title.hidden = time.hidden = elapsed.hidden = false;
      main.removeAttribute('aria-label');
      timeText.textContent = `Detected at ${new Date(detectedAt).toLocaleTimeString()}`;
      const updateElapsed = () => {
        // Recompute from the detection timestamp so delayed background ticks catch up.
        const seconds = Math.max(0, Math.floor((Date.now() - detectedAt) / 1000));
        const minutes = Math.floor(seconds / 60);
        const clock = minutes < 60
          ? `${minutes}:${String(seconds % 60).padStart(2, '0')}`
          : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        elapsedText.textContent = `Elapsed: ${clock}`;
      };
      updateElapsed();
      interval = page?.setInterval(updateElapsed, 1000);
    },
    ended(endedAt) {
      stopTimer();
      document.body.setAttribute('data-question-active', 'false');
      main.removeAttribute('aria-label');
      titleText.textContent = 'Question Ended';
      title.hidden = time.hidden = false;
      timeText.textContent = `Ended at ${new Date(endedAt).toLocaleTimeString()}`;
      elapsed.hidden = true;
      elapsedText.textContent = '';
    },
  };
}
