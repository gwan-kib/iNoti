export type TabCreator = (properties: { url: string }) => unknown;
export type UrlResolver = (path: string) => string;

export function openDevTestingTab(createTab: TabCreator, getUrl: UrlResolver) {
  createTab({ url: getUrl('dev-testing/index.html') });
}

function initPopup() {
  const button = document.querySelector<HTMLButtonElement>('#open-dev-tester');
  if (!button) return;
  button.addEventListener('click', () => {
    openDevTestingTab(
      (properties) => chrome.tabs.create(properties),
      (path) => chrome.runtime.getURL(path),
    );
    window.close();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPopup, { once: true });
  else initPopup();
}
