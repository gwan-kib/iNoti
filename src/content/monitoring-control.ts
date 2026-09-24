import { createBrandLogo } from "../shared/brand-logo";
import controlStyles from "./monitoring-control.css?inline";
import type { MonitoringStatus } from "./pip-controller";
import { logger } from "../shared/logging";

// Copy stays a normalized state/failure category: never surface arbitrary errors,
// routes, or identifiers from the page.
function explanationFor(status: MonitoringStatus, active: boolean): string {
  if (status.issue === "unsupported") return "Notification window needs desktop Chrome 123 or newer.";
  if (status.issue === "failed") return "The Notification window could not open. Click the button to try again.";
  if (status.opening) return "Opening the Notification window…";
  if (status.state === "MONITORING_QUESTION_ACTIVE")
    return "A new question is active in the Notification window.";
  if (status.state === "MONITORING_QUESTION_ENDED") return "The question ended. Monitoring stays on for the next one.";
  if (active) return "Monitoring is on. Keep this iClicker page open so iNoti can detect new questions.";
  return "Monitoring is on. Keep this iClicker page open so iNoti can detect new questions.";
}

// Lets the stylesheet target each state without separate elements.
function stateKey(status: MonitoringStatus): string {
  if (status.issue) return status.issue;
  if (status.opening) return "opening";
  return status.state.toLowerCase().replace("monitoring_", "").replace(/_/g, "-");
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
  explanation.textContent = "Keep this iClicker page open so iNoti can detect new questions.";
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
    render(status: MonitoringStatus) {
      const active = status.state !== "UNMONITORED";
      button.disabled = status.opening || status.issue === "unsupported";
      label.textContent =
        status.issue === "unsupported"
          ? "Document PiP unavailable"
          : status.issue === "failed"
            ? "PiP failed - Try again"
            : status.opening
              ? "Opening notification window..."
              : active
                ? "Close notification window"
                : "Open notification window";
      button.title =
        status.issue === "unsupported"
          ? "Picture-in-Picture requires desktop Chrome 123+."
          : status.issue === "failed"
            ? "Could not open Picture-in-Picture. Click to try again."
            : active
              ? "Close on-screen notifications"
              : "Open on-screen notifications";
      button.setAttribute(
        "aria-label",
        status.issue === "failed" ? "Could not open Picture-in-Picture. Try again" : label.textContent,
      );
      button.setAttribute("aria-pressed", String(active));
      explanation.textContent = explanationFor(status, active);
      explanation.setAttribute("data-state", stateKey(status));
    },
  };
}
