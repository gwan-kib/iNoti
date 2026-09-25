import { createBrandLogo } from "../shared/brand-logo";
import controlStyles from "./monitoring-control.css?inline";
import { type PipStatus } from "./pip-controller";
import { logger } from "../shared/logging";

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
  return "iNoti is monitoring this class. Visual alerts are open.";
}

// Lets the stylesheet target each state without separate elements.
function stateKey({ monitoring, pip }: MonitoringPanelStatus): string {
  if (pip.issue) return pip.issue;
  if (pip.opening) return "opening";
  if (!monitoring) return "unmonitored";
  return pip.state === "CLOSED" ? "monitoring" : "pip-open";
}

export function createMonitoringControl(document: Document, toggle: () => void) {
  const host = document.createElement("div");
  host.id = "inoti-monitoring-control";
  // Keep the panel and its positioning isolated in the shadow stylesheet.
  // Only the panel captures input; there is no page-sized overlay.
  const root = host.attachShadow({ mode: "closed" });
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
  root.append(style, panel);

  return {
    show() {
      if (!host.isConnected) {
        document.body.append(host);
        logger("content")("monitoring control shown");
      }
    },
    hide() {
      host.remove();
    },
    render(status: MonitoringPanelStatus) {
      const open = status.pip.state !== "CLOSED";
      button.disabled = status.pip.opening || status.pip.issue === "unsupported";
      label.textContent =
        status.pip.issue === "unsupported"
          ? "Document PiP unavailable"
          : status.pip.issue === "failed"
            ? "PiP failed - Try again"
            : status.pip.opening
              ? "Opening notification window..."
              : open
                ? "Close notification window"
                : "Open notification window";
      button.title =
        status.pip.issue === "unsupported"
          ? "Notification window needs desktop Chrome 123+."
          : status.pip.issue === "failed"
            ? "Could not open the Notification window. Click to try again."
            : open
              ? "Close the notification window"
              : "Open the notification window for visual alerts";
      button.setAttribute(
        "aria-label",
        status.pip.issue === "failed" ? "Could not open the Notification window. Try again" : label.textContent,
      );
      button.setAttribute("aria-pressed", String(open));
      explanation.textContent = explanationFor(status);
      explanation.setAttribute("data-state", stateKey(status));
    },
  };
}
