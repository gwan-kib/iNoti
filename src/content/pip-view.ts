export interface PipView {
  idle(): void;
  question(detectedAt: number): void;
}

export function createPipView(document: Document): PipView {
  document.title = 'iNoti';
  document.documentElement.lang = 'en';
  const style = document.createElement('style');
  style.textContent = `
    body { margin: 0; background: #f6f8fb; color: #182338; font: 14px system-ui, sans-serif; }
    main { box-sizing: border-box; min-height: 100vh; padding: 16px; display: flex;
      flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .brand { color: #25634c; font-weight: 650; }
    h1 { font-size: 19px; line-height: 1.3; margin: 12px 0 6px; }
    p { margin: 0; color: #46536a; font-size: 12px; }
    [hidden] { display: none; }
  `;
  const main = document.createElement('main');
  main.setAttribute('role', 'status');
  main.setAttribute('aria-live', 'polite');
  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.textContent = '● iNoti';
  const title = document.createElement('h1');
  title.textContent = 'New iClicker Question';
  const time = document.createElement('p');
  main.append(brand, title, time);
  document.head.append(style);
  document.body.replaceChildren(main);
  return {
    idle() {
      title.hidden = time.hidden = true;
      time.textContent = '';
      main.setAttribute('aria-label', 'iNoti monitoring: waiting for a new question');
    },
    question(detectedAt) {
      title.hidden = time.hidden = false;
      main.removeAttribute('aria-label');
      time.textContent = `Detected at ${new Date(detectedAt).toLocaleTimeString()}`;
    },
  };
}
