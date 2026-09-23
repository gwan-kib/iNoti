import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { openDevTestingTab } from '../src/popup/popup';

it('opens the extension-owned dev tester path', () => {
  const createTab = vi.fn();
  const getUrl = vi.fn((path: string) => 'chrome-extension://test/' + path);
  openDevTestingTab(createTab, getUrl);
  expect(getUrl).toHaveBeenCalledExactlyOnceWith('dev-testing/index.html');
  expect(createTab).toHaveBeenCalledExactlyOnceWith({ url: 'chrome-extension://test/dev-testing/index.html' });
});

it('wires the toolbar popup without broadening extension permissions', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')) as {
    permissions?: string[];
    action?: { default_popup?: string };
  };
  expect(manifest.action?.default_popup).toBe('popup/popup.html');
  expect(manifest.permissions).toEqual(['webNavigation']);
});
