import { expect, it, vi } from "vitest";
import { createOffscreenPlayer } from "../src/offscreen/offscreen";

function audioFixture(play: () => Promise<void> = () => Promise.resolve()) {
  return { pause: vi.fn(), play: vi.fn(play) };
}

function player(audio = audioFixture()) {
  const getUrl = vi.fn(
    (path: string) => `chrome-extension://test-extension/${path}`,
  );
  const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement);
  return {
    player: createOffscreenPlayer(getUrl, createAudio),
    getUrl,
    createAudio,
    audio,
  };
}

it.each([
  ["default", "assets/sounds/default.wav"],
  ["bubble", "assets/sounds/bubble.wav"],
  ["pop", "assets/sounds/pop.wav"],
  ["success", "assets/sounds/success.wav"],
  ["start", "assets/sounds/start.wav"],
  ["timer", "assets/sounds/timer.wav"],
])("plays registered sound %s through its extension URL", (soundId, path) => {
  const { player: subject, getUrl, createAudio } = player();
  subject.handleMessage({ type: "PLAY_SOUND", target: "offscreen", soundId });
  expect(getUrl).toHaveBeenCalledExactlyOnceWith(path);
  expect(createAudio).toHaveBeenCalledExactlyOnceWith(
    `chrome-extension://test-extension/${path}`,
  );
});

it.each([
  { type: "NEW_QUESTION_DETECTED" },
  { type: "PLAY_SOUND", target: "offscreen", soundId: "../../etc/passwd" },
  { type: "PLAY_SOUND", target: "page", soundId: "default" },
  null,
])("ignores an invalid or unregistered message %j", (message) => {
  const { player: subject, getUrl, createAudio } = player();
  subject.handleMessage(message);
  expect(getUrl).not.toHaveBeenCalled();
  expect(createAudio).not.toHaveBeenCalled();
});

it("stops the previous chime so a rapid next question restarts cleanly", () => {
  const first = audioFixture();
  const second = audioFixture();
  const getUrl = vi.fn((path: string) => path);
  const createAudio = vi
    .fn()
    .mockReturnValueOnce(first as unknown as HTMLAudioElement)
    .mockReturnValueOnce(second as unknown as HTMLAudioElement);
  const subject = createOffscreenPlayer(getUrl, createAudio);
  subject.handleMessage({
    type: "PLAY_SOUND",
    target: "offscreen",
    soundId: "default",
  });
  subject.handleMessage({
    type: "PLAY_SOUND",
    target: "offscreen",
    soundId: "default",
  });
  expect(first.pause).toHaveBeenCalledOnce();
  expect(second.play).toHaveBeenCalledOnce();
});

it("handles a rejected play promise without throwing", async () => {
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const { player: subject } = player(
    audioFixture(() => Promise.reject(new Error("private"))),
  );
  subject.handleMessage({
    type: "PLAY_SOUND",
    target: "offscreen",
    soundId: "default",
  });
  await Promise.resolve();
  expect(JSON.stringify(log.mock.calls)).not.toContain("private");
  log.mockRestore();
});
