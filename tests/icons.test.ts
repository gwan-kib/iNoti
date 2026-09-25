import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { createPipView } from "../src/content/pip-view";
import { DocumentFake } from "./dom-fake";

// Guards the "rounded Material Symbols only" rule from AGENTS.md: no inline SVG
// and the material-symbols-rounded class everywhere a glyph is rendered.

it("keeps the popup on the rounded Google Fonts symbol link with no inline SVG", () => {
  const html = readFileSync(
    new URL("../src/popup/popup.html", import.meta.url),
    "utf8",
  );
  expect(html).toContain("family=Material+Symbols+Rounded");
  expect(html).toContain('class="material-symbols-rounded"');
  expect(html).not.toContain("<svg");
  expect(html).not.toMatch(/class="material-symbol"/);
});

it("renders PiP icons with the rounded symbol class", () => {
  const document = new DocumentFake();
  createPipView(document as unknown as Document);
  const main = document.body.children[0]!;
  const center = main.children[1]!;
  const time = center.children[1]!;
  const elapsed = center.children[2]!;
  expect(time.children[1]!.className).toBe(
    "material-symbols-rounded clock-icon",
  );
  expect(elapsed.children[1]!.className).toBe(
    "material-symbols-rounded timer-icon",
  );
  expect(document.head.children[0]!.attributes.get("href")).toContain(
    "family=Material+Symbols+Rounded",
  );
});
