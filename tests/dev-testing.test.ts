import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { bindDevTestingButton, openDevTestingTab } from "../src/popup/popup";
import { DEV_TESTING_ENABLED } from "../src/shared/dev-settings";
import { ElementFake } from "./dom-fake";

it("opens the extension-owned dev tester path", () => {
  const createTab = vi.fn();
  const getUrl = vi.fn((path: string) => "chrome-extension://test/" + path);
  openDevTestingTab(createTab, getUrl);
  expect(getUrl).toHaveBeenCalledExactlyOnceWith("dev-testing/index.html");
  expect(createTab).toHaveBeenCalledExactlyOnceWith({ url: "chrome-extension://test/dev-testing/index.html" });
});

it("exposes the dev tester button as a boolean build flag", () => {
  expect(typeof DEV_TESTING_ENABLED).toBe("boolean");
});

it("removes the dev tester button entirely when the build flag is off", () => {
  const button = new ElementFake();
  const remove = vi.spyOn(button, "remove");
  const onClick = vi.fn();
  bindDevTestingButton(button as unknown as HTMLButtonElement, false, onClick);
  expect(remove).toHaveBeenCalledOnce();
  button.dispatchEvent(new Event("click"));
  expect(onClick).not.toHaveBeenCalled();
});

it("wires the dev tester button when the build flag is on", () => {
  const button = new ElementFake();
  const remove = vi.spyOn(button, "remove");
  const onClick = vi.fn();
  bindDevTestingButton(button as unknown as HTMLButtonElement, true, onClick);
  expect(remove).not.toHaveBeenCalled();
  button.dispatchEvent(new Event("click"));
  expect(onClick).toHaveBeenCalledOnce();
});

it("wires the toolbar popup with only navigation, storage, and offscreen permissions", () => {
  const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8")) as {
    permissions?: string[];
    action?: { default_popup?: string };
  };
  expect(manifest.action?.default_popup).toBe("popup/popup.html");
  expect(manifest.permissions).toEqual(["webNavigation", "storage", "offscreen"]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("previews monitoring/window panel states and exercises the production question path", async () => {
  vi.resetModules();
  const { DocumentFake, ElementFake } = await import("./dom-fake");
  const preview = new DocumentFake();
  const pipDocument = new DocumentFake();
  const ids = [
    "pip-status",
    "event-log",
    "preview",
    "pulse-alerts",
    "sound-alerts",
    "sound-choice",
    "sound-status",
    "test-sound",
    "open-pip",
    "idle",
    "question",
    "ended",
    "stop",
    "clear-log",
    "panel-preview",
    "panel-unmonitored",
    "panel-monitoring",
    "panel-opening",
    "panel-unsupported",
    "panel-failed",
  ];
  const elements = Object.fromEntries(
    ids.map((id) => [id, Object.assign(new ElementFake(), { checked: false, contentDocument: preview })]),
  );
  const panelDocument = new DocumentFake();
  elements["panel-preview"]!.contentDocument = panelDocument;
  const doc = Object.assign(new DocumentFake(), { getElementById: (id: string) => elements[id] });
  const pip = Object.assign(new EventTarget(), { document: pipDocument, closed: false, close: vi.fn() });
  const requestWindow = vi.fn().mockResolvedValue(pip);
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const storageGet = vi.fn().mockResolvedValue({ soundEnabled: true, selectedSoundId: "default" });
  const storageSet = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("document", doc);
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), { focus: vi.fn(), documentPictureInPicture: { requestWindow } }),
  );
  vi.stubGlobal("chrome", {
    runtime: { id: "test-extension", sendMessage },
    storage: {
      local: { get: storageGet, set: storageSet },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  });
  vi.stubGlobal("getComputedStyle", () => ({ fontSize: "16px" }));
  await import("../src/dev-testing/dev-testing");
  const click = (id: string) => elements[id]!.dispatchEvent(new Event("click"));
  const panelButton = () => panelDocument.body.children[0]!.shadow!.children[1]!.children[2]!;
  const panelLabel = () => panelButton().children[0]!.textContent;
  const panelExplanation = () => panelDocument.body.children[0]!.shadow!.children[1]!.children[1]!;
  const monitoringCopy = "iNoti is monitoring this class. Open the notification window for visual alerts.";
  const alertsOpenCopy = "iNoti is monitoring this class. Do not close the iClicker tab.";

  // Default tester state: monitoring with the window closed.
  expect(panelButton().hidden).toBe(false);
  expect(panelLabel()).toBe("Open notification window");
  expect(panelExplanation().textContent).toBe(monitoringCopy);
  expect(panelExplanation().attributes.get("data-state")).toBe("monitoring");

  click("panel-unmonitored");
  expect(panelExplanation().attributes.get("data-state")).toBe("unmonitored");
  expect(panelExplanation().textContent).toContain("Open a supported iClicker class");
  click("panel-monitoring");
  expect(panelExplanation().attributes.get("data-state")).toBe("monitoring");
  click("panel-opening");
  expect(panelLabel()).toBe("Opening notification window...");
  expect(panelExplanation().textContent).toBe("Opening the Notification window…");
  click("panel-unsupported");
  expect(panelLabel()).toBe("Document PiP unavailable");
  expect(panelExplanation().textContent).toBe("Notification window needs desktop Chrome 123 or newer.");
  expect(panelExplanation().attributes.get("data-state")).toBe("unsupported");
  click("panel-failed");
  expect(panelLabel()).toBe("PiP failed - Try again");
  expect(panelExplanation().textContent).toBe("The Notification window could not open. Click the button to try again.");
  expect(panelExplanation().attributes.get("data-state")).toBe("failed");
  click("panel-monitoring");
  expect(panelLabel()).toBe("Open notification window");

  const pulse = elements["pulse-alerts"]!;
  expect(pulse.checked).toBe(true);
  pulse.checked = false;
  pulse.dispatchEvent(new Event("change"));
  expect(preview.body.attributes.get("data-pulse")).toBe("false");
  click("idle");
  expect(requestWindow).not.toHaveBeenCalled();
  click("open-pip");
  await Promise.resolve();
  expect(pipDocument.body.attributes.get("data-pulse")).toBe("false");
  // No close action in the panel: the toggle is gone while the window is open.
  expect(panelButton().hidden).toBe(true);
  expect(panelExplanation().textContent).toBe(alertsOpenCopy);
  expect(panelExplanation().attributes.get("data-state")).toBe("pip-open");
  // Opening the window alone must not request a sound.
  expect(sendMessage).not.toHaveBeenCalled();

  for (const from of ["question", "ended"]) {
    click("question");
    if (from === "ended") click("ended");
    click("idle");
    expect(preview.body.children[0]!.children[1]!.children[0]!.textContent).toBe("Waiting for a question");
    expect(pipDocument.body.children[0]!.children[1]!.children[0]!.textContent).toBe("Waiting for a question");
    expect(elements["pip-status"]!.textContent).toContain("idle");
    click("question");
    expect(pipDocument.body.attributes.get("data-question-active")).toBe("true");
  }
  expect(sendMessage).toHaveBeenCalledWith({ type: "NEW_QUESTION_DETECTED" });

  click("stop");
  expect(panelLabel()).toBe("Open notification window");
  sendMessage.mockClear();
  // With the window closed the production sound path still runs.
  click("question");
  expect(sendMessage).toHaveBeenCalledExactlyOnceWith({ type: "NEW_QUESTION_DETECTED" });

  pulse.checked = true;
  pulse.dispatchEvent(new Event("change"));
  expect(preview.body.attributes.get("data-pulse")).toBe("true");
  click("open-pip");
  await Promise.resolve();
  expect(pipDocument.body.attributes.get("data-pulse")).toBe("true");

  // Sound section loads the saved preference and exercises the real request path.
  await vi.waitFor(() => expect(elements["sound-status"]!.textContent).toContain("Default"));
  expect(elements["sound-alerts"]!.checked).toBe(true);
  const soundToggle = elements["sound-alerts"]!;
  soundToggle.checked = false;
  soundToggle.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(storageSet).toHaveBeenCalledWith({ soundEnabled: false }));
  expect(elements["sound-status"]!.textContent).toContain("off");

  // The sound picker is populated from the registry and saves the selected id.
  const soundChoice = elements["sound-choice"]!;
  expect(soundChoice.children.map((option) => option.textContent)).toEqual([
    "Default",
    "Bubble",
    "Locked",
    "Motion detected",
    "Chime",
    "Aura",
  ]);
  expect(soundChoice.value).toBe("default");
  soundChoice.value = "bubble";
  soundChoice.dispatchEvent(new Event("change"));
  await vi.waitFor(() => expect(storageSet).toHaveBeenCalledWith({ selectedSoundId: "bubble" }));
  expect(elements["sound-status"]!.textContent).toContain("Bubble");

  sendMessage.mockClear();
  click("test-sound");
  expect(sendMessage).toHaveBeenCalledExactlyOnceWith({ type: "NEW_QUESTION_DETECTED" });
});
