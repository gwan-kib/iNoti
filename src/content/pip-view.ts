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
}

export function createPipView(document: Document): PipView {
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
  main.append(brand, title, time);
  document.head.append(style);
  if (import.meta.hot) liveStyles.add(style);
  document.body.replaceChildren(main);
  return {
    idle() {
      title.hidden = time.hidden = true;
      timeText.textContent = '';
      main.setAttribute('aria-label', 'iNoti monitoring: waiting for a new question');
    },
    question(detectedAt) {
      title.hidden = time.hidden = false;
      main.removeAttribute('aria-label');
      timeText.textContent = `Detected at ${new Date(detectedAt).toLocaleTimeString()}`;
    },
  };
}
