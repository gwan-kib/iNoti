import { expect, it, vi } from "vitest";
import {
  requestNewQuestionSound,
  requestSoundPreview,
} from "../src/shared/sound-request";

it("sends a generic new-question sound request with no user data", () => {
  const send = vi.fn();
  requestNewQuestionSound(send, () => {});
  expect(send).toHaveBeenCalledExactlyOnceWith({
    type: "NEW_QUESTION_DETECTED",
  });
});

it("sends an explicit preview request", () => {
  const send = vi.fn();
  requestSoundPreview(send, () => {});
  expect(send).toHaveBeenCalledExactlyOnceWith({ type: "PREVIEW_SOUND" });
});

it("logs a rejected send without throwing or leaking details", async () => {
  const events: string[] = [];
  const send = vi.fn().mockRejectedValue(new Error("private route"));
  requestNewQuestionSound(send, (event) => events.push(event));
  await Promise.resolve();
  expect(events).toContain("sound request failed");
  expect(JSON.stringify(events)).not.toContain("private");
});
