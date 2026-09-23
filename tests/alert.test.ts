import { afterEach, expect, it, vi } from 'vitest';
import { detectionTime } from '../src/alert/time';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('formats a valid detection timestamp in local time', () => {
  expect(detectionTime('?detectedAt=1700000000000')).toBe(new Date(1_700_000_000_000).toLocaleTimeString());
  expect(detectionTime('?detectedAt=0')).toBe(new Date(0).toLocaleTimeString());
});

it.each(['', '?detectedAt=', '?detectedAt=-1', '?detectedAt=1.5', '?detectedAt=NaN',
  '?detectedAt=Infinity', '?detectedAt=8640000000000001', '?detectedAt=1&detectedAt=2',
  '?detectedAt=%3Cscript%3E', '?detectedAt=1e3', '?detectedAt=+1',
])('rejects missing or malformed timestamp %s', (search) => {
  expect(detectionTime(search)).toBeNull();
});

it.each(['?detectedAt=1700000000000', '?detectedAt=%3Cimg%20src=x%3E'])('renders safe text and closes only its own window: %s', async (search) => {
  vi.resetModules();
  const time = { textContent: '' };
  const button = new EventTarget();
  const close = vi.fn();
  vi.stubGlobal('document', { getElementById: (id: string) => id === 'time' ? time : button });
  vi.stubGlobal('window', { location: { search }, close });
  await import('../src/alert/alert');
  expect(time.textContent).toBe(search.includes('1700000000000')
    ? `Detected at ${new Date(1_700_000_000_000).toLocaleTimeString()}` : 'Detection time unavailable');
  expect(close).not.toHaveBeenCalled();
  button.dispatchEvent(new Event('click'));
  expect(close).toHaveBeenCalledTimes(1);
});
