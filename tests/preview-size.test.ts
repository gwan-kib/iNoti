import { expect, it } from "vitest";
import { followPipSize } from "../src/dev-testing/preview-size";

it("follows the actual content viewport on open and resize, then detaches on cleanup", () => {
  const frame = { style: { width: "150px", height: "100px" } };
  const pip = Object.assign(new EventTarget(), {
    innerWidth: 320,
    innerHeight: 240,
  });
  const stop = followPipSize(
    frame as HTMLIFrameElement,
    pip as unknown as Window,
  );
  expect(frame.style).toEqual({ width: "320px", height: "240px" });
  pip.innerWidth = 480;
  pip.innerHeight = 360;
  pip.dispatchEvent(new Event("resize"));
  expect(frame.style).toEqual({ width: "480px", height: "360px" });
  stop();
  pip.innerWidth = 600;
  pip.dispatchEvent(new Event("resize"));
  expect(frame.style.width).toBe("480px");
});
