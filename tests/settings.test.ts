import { afterEach, expect, it, vi } from "vitest";
import { createMonitoringControl } from "../src/content/monitoring-control";
import { requestSettingsPopup } from "../src/shared/settings-request";
import { DocumentFake } from "./dom-fake";

afterEach(() => vi.unstubAllGlobals());

it.each([true, false])(
  "opens settings independently of the PiP toggle and reports failures: %s",
  async (ok) => {
    const document = new DocumentFake();
    const toggle = vi.fn();
    const open = vi.fn().mockResolvedValue(ok);
    createMonitoringControl(document as unknown as Document, toggle, open);
    const settings = document.elements.find(
      (element) => element.className === "monitoring-settings",
    )!;
    const status = document.elements.find(
      (element) => element.className === "monitoring-settings-status",
    )!;
    settings.dispatchEvent(new Event("click"));
    expect(settings.disabled).toBe(true);
    await vi.waitFor(() => expect(settings.disabled).toBe(false));
    expect(open).toHaveBeenCalledOnce();
    expect(toggle).not.toHaveBeenCalled();
    expect(status.textContent).toBe(
      ok ? "" : "Couldn't open settings, use toolbar icon.",
    );
  },
);

it("sends only the settings action and checks the acknowledgement", async () => {
  const sendMessage = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("chrome", { runtime: { sendMessage } });
  expect(await requestSettingsPopup()).toBe(true);
  expect(sendMessage).toHaveBeenCalledExactlyOnceWith({
    type: "OPEN_SETTINGS",
  });
  sendMessage.mockResolvedValue(undefined);
  expect(await requestSettingsPopup()).toBe(false);
  sendMessage.mockRejectedValue(new Error("unavailable"));
  expect(await requestSettingsPopup()).toBe(false);
});

it("dismisses a settings error and allows a later failure to appear again", async () => {
  const document = new DocumentFake();
  const open = vi.fn().mockResolvedValue(false);
  createMonitoringControl(document as unknown as Document, vi.fn(), open);
  const settings = document.elements.find(
    (element) => element.className === "monitoring-settings",
  )!;
  const focus = vi.fn();
  Object.assign(settings, { focus });
  const notice = document.elements.find(
    (element) => element.className === "monitoring-settings-notice",
  )!;
  const dismiss = document.elements.find(
    (element) => element.className === "monitoring-settings-dismiss",
  )!;
  const status = document.elements.find(
    (element) => element.className === "monitoring-settings-status",
  )!;
  expect(notice.hidden).toBe(true);
  settings.dispatchEvent(new Event("click"));
  await vi.waitFor(() => expect(notice.hidden).toBe(false));
  dismiss.dispatchEvent(new Event("click"));
  expect(notice.hidden).toBe(true);
  expect(status.textContent).toBe("");
  expect(focus).toHaveBeenCalledOnce();
  expect(open).toHaveBeenCalledOnce();
  settings.dispatchEvent(new Event("click"));
  await vi.waitFor(() => expect(notice.hidden).toBe(false));
});
