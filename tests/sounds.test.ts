import { expect, it } from "vitest";
import {
  DEFAULT_SOUND_ID,
  SOUND_OPTIONS,
  isSoundId,
  resolveSoundId,
  soundPathFor,
} from "../src/shared/sounds";

it("registers the bundled selectable sounds with unique ids and paths", () => {
  expect(SOUND_OPTIONS).toEqual([
    {
      id: "default",
      label: "Default",
      path: "assets/sounds/default.wav",
    },
    {
      id: "bubble",
      label: "Bubble",
      path: "assets/sounds/bubble.wav",
    },
    {
      id: "pop",
      label: "Pop",
      path: "assets/sounds/pop.wav",
    },
    {
      id: "bell",
      label: "Bell",
      path: "assets/sounds/bell.wav",
    },
    { id: "tone", label: "Tone", path: "assets/sounds/tone.wav" },
    { id: "ring", label: "Ring", path: "assets/sounds/ring.wav" },
  ]);
  expect(new Set(SOUND_OPTIONS.map((option) => option.id)).size).toBe(
    SOUND_OPTIONS.length,
  );
  expect(new Set(SOUND_OPTIONS.map((option) => option.path)).size).toBe(
    SOUND_OPTIONS.length,
  );
  expect(DEFAULT_SOUND_ID).toBe("default");
});

it("resolves registered ids and rejects arbitrary strings", () => {
  expect(isSoundId("default")).toBe(true);
  expect(isSoundId("bubble")).toBe(true);
  expect(isSoundId("../../etc/passwd")).toBe(false);
  expect(isSoundId(7)).toBe(false);
  expect(resolveSoundId("pop")).toBe("pop");
  expect(resolveSoundId("unknown-tone")).toBe("default");
  expect(resolveSoundId(undefined)).toBe("default");
  expect(soundPathFor("tone")).toBe("assets/sounds/tone.wav");
  expect(resolveSoundId("start")).toBe("default");
  expect(resolveSoundId("success")).toBe("tone");
  expect(resolveSoundId("timer")).toBe("ring");
});
