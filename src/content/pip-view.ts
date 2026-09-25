import { createBrandLogo } from "../shared/brand-logo";
import pipStyles from "./pip-view.css?inline";

// Inline styles need explicit HMR because they live in preview/PiP documents.
const liveStyles = new Set<HTMLStyleElement>();
let currentStyles = pipStyles;
if (import.meta.hot) {
  import.meta.hot.accept("./pip-view.css?inline", (updated) => {
    if (!updated) return;
    currentStyles = updated.default;
    for (const style of liveStyles) {
      if (style.isConnected) style.textContent = updated.default;
      else liveStyles.delete(style);
    }
  });
  import.meta.hot.dispose(() => liveStyles.clear());
}

export interface PipView {
  idle(): void;
  question(detectedAt: number): void;
  ended(endedAt: number): void;
}

export function createPipView(
  document: Document,
  focusQuestion: () => void = () => {},
  answerQuestion: () => void = () => {},
): PipView & { setPulseEnabled(enabled: boolean): void } {
  document.title = "iNoti";
  document.documentElement.lang = "en";
  // PiP and the iframe preview have separate HTML documents, so each needs
  // its own Google Fonts stylesheet link rather than the opener's styles.
  const symbols = document.createElement("link");
  symbols.setAttribute("rel", "stylesheet");
  symbols.setAttribute(
    "href",
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=hourglass_empty,schedule&display=block",
  );
  symbols.setAttribute("referrerpolicy", "no-referrer");
  const style = document.createElement("style");
  // PiP owns a dynamic document; bundle the separate stylesheet for local injection.
  style.textContent = currentStyles;
  const main = document.createElement("main");
  main.setAttribute("role", "status");
  main.setAttribute("aria-live", "polite");
  const brand = document.createElement("div");
  brand.className = "brand";
  const brandText = document.createElement("span");
  brandText.className = "brand-text";
  brandText.textContent = "iNoti";
  const identity = document.createElement("div");
  identity.className = "brand-identity";
  identity.append(createBrandLogo(document), brandText);
  const badge = document.createElement("span");
  badge.className = "status-badge";
  brand.append(identity, badge);
  // Brand stays pinned at the top; this group centers below it.
  const center = document.createElement("div");
  center.className = "pip-center";
  const title = document.createElement("h1");
  title.className = "question-title";
  const titleText = document.createElement("span");
  titleText.className = "question-title-text";
  titleText.textContent = "iClicker question detected";
  title.append(titleText);
  const time = document.createElement("p");
  time.className = "detection-time";
  const timeText = document.createElement("span");
  timeText.className = "detection-time-text";
  const clockIcon = document.createElement("span");
  clockIcon.className = "material-symbols-rounded clock-icon";
  clockIcon.setAttribute("aria-hidden", "true");
  time.append(timeText, clockIcon);
  const elapsed = document.createElement("p");
  elapsed.className = "elapsed-time";
  // Announce the question once, not every second as the timer changes.
  elapsed.setAttribute("role", "timer");
  elapsed.setAttribute("aria-live", "off");
  const elapsedText = document.createElement("span");
  elapsedText.className = "elapsed-time-text";
  const timerIcon = document.createElement("span");
  timerIcon.className = "material-symbols-rounded timer-icon";
  timerIcon.setAttribute("aria-hidden", "true");
  elapsed.append(elapsedText, timerIcon);
  const detail = document.createElement("p");
  detail.className = "status-detail";
  detail.textContent = "Monitoring stays on for the next question.";
  center.append(title, time, elapsed, detail);
  const goToQuestion = document.createElement("button");
  goToQuestion.type = "button";
  goToQuestion.className = "go-to-question";
  goToQuestion.hidden = true;
  const buttonText = document.createElement("span");
  buttonText.className = "go-to-question-text";
  buttonText.textContent = "Go to Question";
  goToQuestion.append(buttonText);
  goToQuestion.addEventListener("click", () => {
    if (!goToQuestion.hidden) focusQuestion();
  });
  const answered = document.createElement("button");
  answered.type = "button";
  answered.className = "question-answered";
  answered.hidden = true;
  const answeredText = document.createElement("span");
  answeredText.className = "question-answered-text";
  answeredText.textContent = "Answered";
  answered.setAttribute("aria-label", "Question answered");
  answered.append(answeredText);
  answered.addEventListener("click", () => {
    if (!answered.hidden) answerQuestion();
  });
  const actions = document.createElement("div");
  actions.className = "pip-actions";
  actions.append(goToQuestion, answered);
  center.append(actions);
  main.append(brand, center);
  document.head.append(symbols, style);
  if (import.meta.hot) liveStyles.add(style);
  document.body.replaceChildren(main);
  const page = document.defaultView;
  let interval: number | undefined;
  const stopTimer = () => {
    if (interval !== undefined) page?.clearInterval(interval);
    interval = undefined;
  };
  page?.addEventListener("pagehide", stopTimer, { once: true });
  return {
    setPulseEnabled(enabled) {
      document.body.setAttribute("data-pulse", String(enabled));
    },
    idle() {
      goToQuestion.hidden = true;
      answered.hidden = true;
      stopTimer();
      document.body.setAttribute("data-question-active", "false");
      title.hidden = false;
      titleText.textContent = "Waiting for a question";
      badge.textContent = "Monitoring";
      detail.hidden = false;
      detail.textContent = "Monitoring is on. Do not close the iClicker tab.";
      time.hidden = elapsed.hidden = true;
      timeText.textContent = "";
      elapsedText.textContent = "";
      main.setAttribute(
        "aria-label",
        "iNoti monitoring: waiting for a new question",
      );
    },
    question(detectedAt) {
      goToQuestion.hidden = false;
      answered.hidden = false;
      stopTimer();
      titleText.textContent = "iClicker question detected";
      document.body.setAttribute("data-question-active", "true");
      title.hidden = time.hidden = elapsed.hidden = false;
      badge.textContent = "New Question";
      detail.hidden = true;
      main.removeAttribute("aria-label");
      timeText.textContent = new Date(detectedAt).toLocaleTimeString();
      time.setAttribute("aria-label", `Detected at ${timeText.textContent}`);
      const updateElapsed = () => {
        // Recompute from the detection timestamp so delayed background ticks catch up.
        const seconds = Math.max(
          0,
          Math.floor((Date.now() - detectedAt) / 1000),
        );
        const minutes = Math.floor(seconds / 60);
        const clock =
          minutes < 60
            ? `${minutes}:${String(seconds % 60).padStart(2, "0")}`
            : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        elapsedText.textContent = clock;
        elapsed.setAttribute("aria-label", `Elapsed: ${clock}`);
      };
      updateElapsed();
      interval = page?.setInterval(updateElapsed, 1000);
    },
    ended(endedAt) {
      goToQuestion.hidden = true;
      answered.hidden = true;
      stopTimer();
      document.body.setAttribute("data-question-active", "false");
      main.removeAttribute("aria-label");
      titleText.textContent = "Question ended";
      badge.textContent = "Monitoring";
      detail.hidden = false;
      detail.textContent = "Monitoring is on. Do not close the iClicker tab.";
      title.hidden = time.hidden = false;
      timeText.textContent = `Ended at ${new Date(endedAt).toLocaleTimeString()}`;
      time.setAttribute("aria-label", timeText.textContent);
      elapsed.hidden = true;
      elapsedText.textContent = "";
    },
  };
}
