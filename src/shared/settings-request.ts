import type { OpenSettingsMessage } from "./messages";

export async function requestSettingsPopup(): Promise<boolean> {
  try {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage)
      return false;
    const response: unknown = await chrome.runtime.sendMessage({
      type: "OPEN_SETTINGS",
    } satisfies OpenSettingsMessage);
    return (
      typeof response === "object" &&
      response !== null &&
      "ok" in response &&
      response.ok === true
    );
  } catch {
    return false;
  }
}
