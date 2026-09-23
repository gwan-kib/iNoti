import { isNewPollMessage } from '../shared/messages';

export function detectionTime(search: string): string | null {
  const values = new URLSearchParams(search).getAll('detectedAt');
  const value = values[0];
  if (values.length !== 1 || !value || !/^\d+$/.test(value)) return null;
  const detectedAt = Number(value);
  if (!isNewPollMessage({ type: 'NEW_POLL', detectedAt })) return null;
  return new Date(detectedAt).toLocaleTimeString();
}
