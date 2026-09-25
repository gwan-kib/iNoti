export interface NavigationChangedMessage {
  type: "NAVIGATION_CHANGED";
  // Empty hash represents an unsupported route, without forwarding unrelated route data.
  hash: string;
}

export interface OpenSettingsMessage {
  type: "OPEN_SETTINGS";
}

export function isOpenSettingsMessage(
  value: unknown,
): value is OpenSettingsMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 1 && message["type"] === "OPEN_SETTINGS"
  );
}

export function isNavigationChangedMessage(
  value: unknown,
): value is NavigationChangedMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 2 &&
    message["type"] === "NAVIGATION_CHANGED" &&
    typeof message["hash"] === "string" &&
    message["hash"].length <= 256 &&
    (message["hash"] === "" || /^#\/[^\s?#]*$/.test(message["hash"]))
  );
}

// Content script or dev tester -> service worker. Carries only the fact that a
// question was accepted; the worker decides whether and which sound to play.
export interface NewQuestionDetectedMessage {
  type: "NEW_QUESTION_DETECTED";
}

export function isNewQuestionDetectedMessage(
  value: unknown,
): value is NewQuestionDetectedMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 1 &&
    message["type"] === "NEW_QUESTION_DETECTED"
  );
}

// Popup -> service worker. An explicit user preview of the selected sound; it
// bypasses the enabled preference but still goes through the same offscreen path.
export interface PreviewSoundMessage {
  type: "PREVIEW_SOUND";
}

export function isPreviewSoundMessage(
  value: unknown,
): value is PreviewSoundMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 1 && message["type"] === "PREVIEW_SOUND"
  );
}

// Service worker -> offscreen document. Only a registered sound id is sent; the
// offscreen player resolves the file through the shared sound registry.
export interface PlaySoundMessage {
  type: "PLAY_SOUND";
  target: "offscreen";
  soundId: string;
}

export function isPlaySoundMessage(value: unknown): value is PlaySoundMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 3 &&
    message["type"] === "PLAY_SOUND" &&
    message["target"] === "offscreen" &&
    typeof message["soundId"] === "string"
  );
}
