import { logger } from "./logging";

export interface NewQuestionTargets {
  // Ask the worker for the configured sound alert.
  requestSound(): void;
  // Update the optional notification window; a no-op when it is closed.
  showQuestion(detectedAt: number): void;
  showEnded(endedAt: number): void;
}

// The single point where a detected transition is confirmed as an accepted new
// question. Sound and the optional PiP window both run after this decision, so
// they can never disagree about what counts as a new question or replay it twice.
export function createNewQuestionAlerts(
  targets: NewQuestionTargets,
  log: (event: string) => void = logger("content"),
) {
  return {
    accepted(detectedAt: number) {
      log("new question accepted");
      targets.requestSound();
      targets.showQuestion(detectedAt);
    },
    ended(endedAt: number) {
      targets.showEnded(endedAt);
    },
  };
}
