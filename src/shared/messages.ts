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
