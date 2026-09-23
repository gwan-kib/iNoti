export interface NewPollMessage {
  type: 'NEW_POLL';
  detectedAt: number;
}

export interface NavigationChangedMessage {
  type: 'NAVIGATION_CHANGED';
  // Empty hash represents an unsupported route, without forwarding unrelated route data.
  hash: string;
}

export function isNavigationChangedMessage(value: unknown): value is NavigationChangedMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return Object.keys(message).length === 2
    && message['type'] === 'NAVIGATION_CHANGED'
    && typeof message['hash'] === 'string'
    && message['hash'].length <= 256
    && (message['hash'] === '' || /^#\/[^\s?#]*$/.test(message['hash']));
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
