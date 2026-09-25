import { createBrandLogo } from "../shared/brand-logo";
import controlStyles from "./monitoring-control.css?inline";
import { type PipStatus } from "./pip-controller";
import { logger } from "../shared/logging";
import { requestSettingsPopup } from "../shared/settings-request";

export interface MonitoringPanelStatus {
  // True while this page is observing a supported iClicker class/session. It is
  // independent of the optional notification window.
  monitoring: boolean;
  // Notification-window presentation state only.
  pip: PipStatus;
}

// Copy stays a normalized state/failure category: never surface arbitrary errors,
// routes, or identifiers from the page.
function explanationFor({ monitoring, pip }: MonitoringPanelStatus): string {
  if (pip.issue === "unsupported") return "Notification window needs desktop Chrome 123 or newer.";
  if (pip.issue === "failed") return "The Notification window could not open. Click the button to try again.";
  if (pip.opening) return "Opening the Notification window…";
  if (!monitoring) return "Open a supported iClicker class to monitor for new questions.";
  // Monitoring is deliberately not tied to the window: the copy states both.
  if (pip.state === "CLOSED") return "iNoti is monitoring this class. Open the notification window for visual alerts.";
  return "iNoti is monitoring this class. Do not close the iClicker tab.";
}

// Lets the stylesheet target each state without separate elements.
function stateKey({ monitoring, pip }: MonitoringPanelStatus): string {
  if (pip.issue) return pip.issue;
  if (pip.opening) return "opening";
  if (!monitoring) return "unmonitored";
  return pip.state === "CLOSED" ? "monitoring" : "pip-open";
}

export function createMonitoringControl(document: Document, toggle: () => void, openSettings = requestSettingsPopup) {
  const host = document.createElement("div");
  host.id = "inoti-monitoring-control";
  // Keep the panel and its positioning isolated in the shadow stylesheet.
  // Only the panel captures input; there is no page-sized overlay.
  const root = host.attachShadow({ mode: "closed" });
  // Font faces must load in the owner document; the shadow stylesheet supplies
  // the isolated glyph styling without depending on iClicker's styles.
  const symbols = document.createElement("link");
  symbols.setAttribute("rel", "stylesheet");
  symbols.setAttribute(
    "href",
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=close,settings&display=block",
  );
  symbols.setAttribute("referrerpolicy", "no-referrer");
  const style = document.createElement("style");
  // The closed shadow root needs its own copy of the shared palette and styles.
  style.textContent = controlStyles;
  const panel = document.createElement("section");
  panel.className = "monitoring-panel";
  panel.setAttribute("aria-label", "iNoti notifications");
  const brand = document.createElement("div");
  brand.className = "monitoring-brand";
  const brandText = document.createElement("span");
  brandText.className = "monitoring-brand-text";
  brandText.textContent = "iNoti";
  brand.append(createBrandLogo(document), brandText);
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "monitoring-settings";
  settings.setAttribute("aria-label", "Settings");
  const settingsLabel = document.createElement("span");
  settingsLabel.className = "material-symbols-rounded monitoring-settings-icon";
  settingsLabel.textContent = "settings";
  settingsLabel.setAttribute("aria-hidden", "true");
  settings.append(settingsLabel);
  brand.append(settings);
  const settingsStatus = document.createElement("div");
  settingsStatus.className = "monitoring-settings-status";
  settingsStatus.setAttribute("role", "status");
  const settingsNotice = document.createElement("div");
  settingsNotice.className = "monitoring-settings-notice";
  settingsNotice.hidden = true;
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "monitoring-settings-dismiss";
  dismiss.setAttribute("aria-label", "Dismiss settings message");
  const dismissIcon = document.createElement("span");
  dismissIcon.className = "material-symbols-rounded monitoring-settings-icon";
  dismissIcon.textContent = "close";
  dismissIcon.setAttribute("aria-hidden", "true");
  dismiss.append(dismissIcon);
  settingsNotice.append(settingsStatus, dismiss);
  const clearSettingsNotice = () => {
    settingsStatus.textContent = "";
    settingsNotice.hidden = true;
  };
  dismiss.addEventListener("click", () => {
    clearSettingsNotice();
    settings.focus();
  });
  settings.addEventListener("click", async () => {
    settings.disabled = true;
    clearSettingsNotice();
    try {
      if (!(await openSettings())) settingsStatus.textContent = "Couldn't open settings, use toolbar icon.";
    } catch {
      settingsStatus.textContent = "Couldn't open settings, use toolbar icon.";
    } finally {
      settingsNotice.hidden = !settingsStatus.textContent;
      settings.disabled = false;
    }
  });
  const explanation = document.createElement("div");
  explanation.className = "monitoring-explanation";
  explanation.textContent = "Open a supported iClicker class to monitor for new questions.";
  const button = document.createElement("button");
  button.type = "button";
  const label = document.createElement("span");
  label.className = "monitoring-label";
  button.append(label);
  button.addEventListener("click", toggle);
  panel.append(brand, explanation, button);
  panel.append(settingsNotice);
  root.append(style, panel);

  return {
    show() {
      if (!host.isConnected) {
        document.head.append(symbols);
        document.body.append(host);
        logger("content")("monitoring control shown");
      }
    },
    hide() {
      host.remove();
      symbols.remove();
    },
    render(status: MonitoringPanelStatus) {
      // The window is closed from its own title bar, so the panel offers no close
      // action: remove the button entirely while the window is open.
      const open = status.pip.state !== "CLOSED";
      button.hidden = open;
      button.disabled = status.pip.opening || status.pip.issue === "unsupported";
      label.textContent =
        status.pip.issue === "unsupported"
          ? "Document PiP unavailable"
          : status.pip.issue === "failed"
            ? "PiP failed - Try again"
            : status.pip.opening
              ? "Opening notification window..."
              : "Open notification window";
      button.title =
        status.pip.issue === "unsupported"
          ? "Notification window needs desktop Chrome 123+."
          : status.pip.issue === "failed"
            ? "Could not open the Notification window. Click to try again."
            : "Open the notification window for visual alerts";
      button.setAttribute(
        "aria-label",
        status.pip.issue === "failed" ? "Could not open the Notification window. Try again" : label.textContent,
      );
      explanation.textContent = explanationFor(status);
      explanation.setAttribute("data-state", stateKey(status));
    },
  };
}
