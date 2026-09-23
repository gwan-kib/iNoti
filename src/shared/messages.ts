export interface NewPollMessage {
  type: 'NEW_POLL';
  detectedAt: number;
}

export function isNewPollMessage(value: unknown): value is NewPollMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return Object.keys(message).length === 2
    && message['type'] === 'NEW_POLL'
    && typeof message['detectedAt'] === 'number'
    && Number.isSafeInteger(message['detectedAt'])
    && message['detectedAt'] >= 0
    && message['detectedAt'] <= 8_640_000_000_000_000;
}
