import pipStyles from './pip-view.css?inline';

export interface PipView {
  idle(): void;
  question(detectedAt: number): void;
}

export function createPipView(document: Document): PipView {
  document.title = 'iNoti';
  document.documentElement.lang = 'en';
  const style = document.createElement('style');
  // PiP owns a dynamic document; bundle the separate stylesheet for local injection.
  style.textContent = pipStyles;
  const main = document.createElement('main');
  main.setAttribute('role', 'status');
  main.setAttribute('aria-live', 'polite');
  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.textContent = '● iNoti';
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
