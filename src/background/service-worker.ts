import { logger, safeError } from "../shared/logging";
import { parseRoute } from "../content/detector";
import {
  isNewQuestionDetectedMessage,
  isPreviewSoundMessage,
  isOpenSettingsMessage,
  type NavigationChangedMessage,
  type PlaySoundMessage,
} from "../shared/messages";
import { resolveSoundId, type SoundId } from "../shared/sounds";
import {
  SOUND_ENABLED_KEY,
  SELECTED_SOUND_KEY,
  soundEnabled,
} from "../shared/sound-preference";

const log = logger("worker");
log("service worker started");

type NavigationDetails = {
  frameId: number;
  tabId: number;
  url: string;
  documentId?: string;
};

function forwardNavigation(
  details: NavigationDetails,
  source: "history" | "fragment",
) {
  // Filter before logging or extracting route data. API filters alone do not enforce origin.
  if (details.frameId !== 0 || details.tabId < 0) return;
  let url: URL;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }
  if (url.origin !== "https://student.iclicker.com") return;

  log(`webNavigation ${source} update observed`, {
    frameId: 0,
    routeKind: "student",
  });
  const message: NavigationChangedMessage = {
    type: "NAVIGATION_CHANGED",
    hash: parseRoute(url.hash).state === "UNSUPPORTED" ? "" : url.hash,
  };
  log("forwarding navigation update to content script");
  const failed = (error: unknown) =>
    log("failed to forward navigation update", { reason: safeError(error) });
  try {
    // Target the originating document when available, so delayed events cannot reach a reload.
    const target = details.documentId
      ? { frameId: 0, documentId: details.documentId }
      : { frameId: 0 };
    void chrome.tabs
      .sendMessage(details.tabId, message, target)
      .then((response: unknown) => {
        if (
          response &&
          typeof response === "object" &&
          "ok" in response &&
          response.ok === true
        ) {
          log("navigation update delivered");
        } else {
          log("failed to forward navigation update", {
            reason: "content script did not acknowledge",
          });
        }
      }, failed);
  } catch (error) {
    failed(error);
  }
}

const navigationFilter = { url: [{ hostEquals: "student.iclicker.com" }] };
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => forwardNavigation(details, "history"),
  navigationFilter,
);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(
  (details) => forwardNavigation(details, "fragment"),
  navigationFilter,
);

// --- Sound alert delivery ---

const OFFSCREEN_PATH = "offscreen/offscreen.html";
let creatingOffscreen: Promise<void> | undefined;

function isTrustedSoundSender(sender: chrome.runtime.MessageSender): boolean {
  // Our content script runs in a tab; the extension tester and offscreen page are
  // extension-origin documents. Anything else is ignored.
  if (sender.id !== chrome.runtime.id) return false;
  if (sender.tab) return true;
  return (sender.url ?? "").startsWith(chrome.runtime.getURL(""));
}

async function hasOffscreenDocument(): Promise<boolean> {
  if (!chrome.runtime.getContexts) return false;
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  return contexts.some(
    (context) => context.documentUrl === chrome.runtime.getURL(OFFSCREEN_PATH),
  );
}

async function ensureOffscreenDocument(): Promise<void> {
  // The worker is disposable, so never assume the document exists; let Chrome
  // dispose it normally and recreate on demand. A single in-flight promise
  // prevents concurrent createDocument races without persistent state.
  if (await hasOffscreenDocument()) return;
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }
  creatingOffscreen = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: ["AUDIO_PLAYBACK"],
      justification:
        "Play the configured notification sound when a genuinely new iClicker question is detected. No page content, routes, or identifiers are involved.",
    })
    .finally(() => {
      creatingOffscreen = undefined;
    });
  await creatingOffscreen;
}

async function readSoundPreferences(): Promise<
  { enabled: boolean; soundId: SoundId } | undefined
> {
  try {
    const values = await chrome.storage.local.get([
      SOUND_ENABLED_KEY,
      SELECTED_SOUND_KEY,
    ]);
    return {
      enabled: soundEnabled(values[SOUND_ENABLED_KEY]),
      soundId: resolveSoundId(values[SELECTED_SOUND_KEY]),
    };
  } catch (error) {
    // A failed preference read must not surprise the user with audio.
    log("sound preference read failed", { reason: safeError(error) });
    return undefined;
  }
}

async function playRegisteredSound(soundId: SoundId): Promise<void> {
  try {
    await ensureOffscreenDocument();
    const message: PlaySoundMessage = {
      type: "PLAY_SOUND",
      target: "offscreen",
      soundId,
    };
    await chrome.runtime.sendMessage(message);
    log("sound playback requested", { soundId });
  } catch (error) {
    log("sound playback request failed", { reason: safeError(error) });
  }
}

async function playSoundForNewQuestion(): Promise<void> {
  const preferences = await readSoundPreferences();
  if (!preferences) return;
  if (!preferences.enabled) {
    // No offscreen document is created solely for a disabled alert.
    log("sound disabled");
    return;
  }
  await playRegisteredSound(preferences.soundId);
}

async function playSelectedSoundPreview(): Promise<void> {
  // An explicit popup preview plays regardless of the enabled preference.
  const preferences = await readSoundPreferences();
  if (!preferences) return;
  await playRegisteredSound(preferences.soundId);
}

async function settingsPopupIsOpen(windowId: number): Promise<boolean> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["POPUP"],
    windowIds: [windowId],
    documentUrls: [chrome.runtime.getURL("popup/popup.html")],
  });
  return contexts.length > 0;
}

chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
  if (isOpenSettingsMessage(message)) {
    // Only our top-frame student content script or extension tester may open
    // the toolbar popup, and always in the requesting browser window.
    let trusted = false;
    try {
      trusted =
        sender.id === chrome.runtime.id &&
        sender.frameId === 0 &&
        typeof sender.tab?.windowId === "number" &&
        (new URL(sender.url ?? "").origin === "https://student.iclicker.com" ||
          sender.url === chrome.runtime.getURL("dev-testing/index.html"));
    } catch {
      /* Malformed sender URLs are not trusted. */
    }
    if (!trusted) return false;
    // Chrome 123-126 may expose the method but reject it for unpacked installs.
    void (async () => {
      try {
        const windowId = sender.tab!.windowId;
        // Clicking back onto the page dismisses Chrome's popup. Do not issue a
        // second open request while that popup still exists or is dismissing.
        // Query live contexts rather than caching popup state in this worker.
        if (await settingsPopupIsOpen(windowId)) {
          respond({ ok: true });
          return;
        }
        await chrome.action.openPopup({ windowId });
        respond({ ok: true });
      } catch {
        log("settings popup unavailable");
        respond({ ok: false });
      }
    })();
    return true;
  }
  if (isPreviewSoundMessage(message)) {
    if (!isTrustedSoundSender(sender)) {
      log("rejected sound request");
      return false;
    }
    log("sound preview requested");
    void playSelectedSoundPreview();
    return false;
  }
  if (!isNewQuestionDetectedMessage(message)) return false;
  if (!isTrustedSoundSender(sender)) {
    log("rejected sound request");
    return false;
  }
  log("new question accepted by content");
  void playSoundForNewQuestion();
  return false;
});
