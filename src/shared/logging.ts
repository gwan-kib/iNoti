// Enabled for the current real-browser diagnostic phase; disable before quiet builds.
const DEBUG = true;

export function logger(scope: 'content' | 'worker' | 'pip' | 'offscreen') {
  return (event: string, details?: Record<string, string | number | boolean | undefined>) => {
    if (DEBUG) console.info(`[iNoti][${scope}] ${event}`, details ?? {});
  };
}

export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message
    : typeof error === 'object' && error !== null && 'message' in error ? error.message : error;
  // Only known API failure categories are safe to echo; arbitrary errors can contain URLs/data.
  if (typeof message === 'string') {
    if (message.includes('Extension context invalidated')) return 'extension context invalidated; refresh the student page';
    if (message.includes('Receiving end does not exist')) return 'message receiving end does not exist';
    if (message.includes('message port closed') || message.includes('message channel closed')) return 'response channel closed';
    if (message.includes('No current window')) return 'no current browser window';
    if (message.includes('Invalid value for bounds')) return 'invalid window bounds';
  }
  return 'API error (unrecognized details withheld for privacy)';
}
