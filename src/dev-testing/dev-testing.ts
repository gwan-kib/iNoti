import { createPipController, documentPip, type PipStatus } from '../content/pip-controller';
import { createPipView } from '../content/pip-view';
import { createMonitoringControl, type MonitoringPanelStatus } from '../content/monitoring-control';
import { watchPulsePreference } from '../shared/alert-preference';
import { createNewQuestionAlerts } from '../shared/new-question';
import { requestNewQuestionSound } from '../shared/sound-request';
import { DEFAULT_SOUND_ID, SOUND_OPTIONS, resolveSoundId } from '../shared/sounds';
import { loadSoundPreferences, saveSelectedSoundId, saveSoundEnabled } from '../shared/sound-preference';
import { PIP_DIMENSIONS_REM } from '../shared/pip-dimensions';
import { followPipSize } from './preview-size';

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing dev tester element: ' + id);
  return element as T;
}

function statusText(pip: PipStatus, supported: boolean) {
  if (!supported) return 'PiP: unavailable in this extension page';
  if (pip.opening) return 'PiP: opening…';
  if (pip.issue === 'failed') return 'PiP: opening failed — retry from Open PiP';
  if (pip.state === 'OPEN_IDLE') return 'PiP: open — idle';
  if (pip.state === 'QUESTION_ENDED') return 'PiP: open — question ended';
  if (pip.state === 'QUESTION_ACTIVE') return 'PiP: open — question active';
  return 'PiP: available — not open';
}

function initDevTester() {
  const statusElement = required<HTMLElement>('pip-status');
  const logElement = required<HTMLOListElement>('event-log');
  const previewFrame = required<HTMLIFrameElement>('preview');
  previewFrame.style.width = `${PIP_DIMENSIONS_REM.width}rem`;
  previewFrame.style.height = `${PIP_DIMENSIONS_REM.height}rem`;
  const previewDocument = previewFrame.contentDocument;
  if (!previewDocument) throw new Error('Inline preview document unavailable');

  const pulseToggle = required<HTMLInputElement>('pulse-alerts');
  let pipView: ReturnType<typeof createPipView> | undefined;
  const preview = createPipView(previewDocument, () => window.focus(), () => {
    preview.idle();
    controller.answered();
    appendLog('question answered');
  });
  preview.idle();
  const applyPulse = () => {
    preview.setPulseEnabled(pulseToggle.checked);
    pipView?.setPulseEnabled(pulseToggle.checked);
  };
  // Follow the saved preference until this tester explicitly overrides it.
  // The override is session-only and never changes the production preference.
  const unwatchPulse = watchPulsePreference(enabled => {
    pulseToggle.checked = enabled;
    applyPulse();
  });
  window.addEventListener('pagehide', unwatchPulse, { once: true });
  pulseToggle.addEventListener('change', () => {
    unwatchPulse();
    applyPulse();
  });

  const api = documentPip(window);
  let pipStatus: PipStatus = { state: 'CLOSED', opening: false };
  // The tester pretends to be on a supported class so the panel and the
  // independent monitoring/window distinction can be exercised.
  let monitoring = true;
  const appendLog = (event: string, details?: Record<string, string | number | boolean>) => {
    const time = new Date().toLocaleTimeString();
    const summary = details ? ' ' + JSON.stringify(details) : '';
    const item = document.createElement('li');
    item.textContent = time + ' ' + event + summary;
    logElement.append(item);
    logElement.scrollTop = logElement.scrollHeight;
    console.info('[iNoti][dev] ' + event, details ?? {});
  };
  const panelState = (): MonitoringPanelStatus => ({ monitoring, pip: pipStatus });
  const renderStatus = () => { statusElement.textContent = statusText(pipStatus, Boolean(api)); };

  // Render the real on-page control inside a mock page in its own document, so
  // each monitoring/window state can be inspected without an iClicker tab.
  const panelFrame = required<HTMLIFrameElement>('panel-preview');
  const panelDocument = panelFrame.contentDocument;
  if (!panelDocument) throw new Error('Monitoring panel preview document unavailable');
  const panelControl = createMonitoringControl(panelDocument, () => appendLog('monitoring panel toggle clicked'));
  panelControl.show();
  panelControl.render(panelState());
  const showPanelState = (next: MonitoringPanelStatus, state: string) => {
    monitoring = next.monitoring;
    pipStatus = next.pip;
    panelControl.render(panelState());
    renderStatus();
    appendLog('monitoring panel state', { state });
  };

  let stopFollowingSize: (() => void) | undefined;
  const controller = createPipController(api, (next) => {
    if (next.state === 'CLOSED') {
      pipView = undefined;
      stopFollowingSize?.();
      stopFollowingSize = undefined;
    }
    // Mirror controller-driven idle (including the ended-screen timeout) in the preview.
    if (next.state === 'OPEN_IDLE') preview.idle();
    pipStatus = next;
    renderStatus();
    panelControl.render(panelState());
    appendLog('PiP state changed', { state: next.state, opening: next.opening, issue: next.issue ?? 'none' });
  }, (pipDocument, onAnswered) => {
    const view = createPipView(pipDocument, () => window.focus(), () => {
      preview.idle();
      onAnswered();
    });
    pipView = view;
    applyPulse();
    if (pipDocument.defaultView) {
      stopFollowingSize = followPipSize(previewFrame, pipDocument.defaultView);
    }
    return view;
  });

  // Exercise the real new-question acceptance path: the production sound request
  // and the optional PiP window. The inline preview is visual only.
  const alerts = createNewQuestionAlerts({
    requestSound: () => requestNewQuestionSound(),
    showQuestion: (detectedAt) => { preview.question(detectedAt); controller.question(detectedAt); },
    showEnded: (endedAt) => { preview.ended(endedAt); controller.ended(endedAt); },
  }, appendLog);

  // Sound section: exercises the real request -> worker -> offscreen path and
  // reflects the saved preference the worker reads, without a fake player.
  const soundToggle = required<HTMLInputElement>('sound-alerts');
  const soundChoice = required<HTMLSelectElement>('sound-choice');
  const soundStatus = required<HTMLElement>('sound-status');
  for (const option of SOUND_OPTIONS) {
    const element = document.createElement('option');
    element.value = option.id;
    element.textContent = option.label;
    soundChoice.append(element);
  }
  let soundEnabledValue = true;
  let soundIdValue = DEFAULT_SOUND_ID;
  const renderSound = () => {
    soundToggle.checked = soundEnabledValue;
    soundChoice.value = soundIdValue;
    const label = SOUND_OPTIONS.find(option => option.id === soundIdValue)?.label ?? soundIdValue;
    soundStatus.textContent = `Saved: ${soundEnabledValue ? 'on' : 'off'} · ${label}`;
  };
  renderSound();
  void loadSoundPreferences().then(preferences => {
    if (!preferences) {
      soundStatus.textContent = 'Extension storage unavailable here; the worker still owns the sound decision.';
      return;
    }
    soundEnabledValue = preferences.enabled;
    soundIdValue = preferences.soundId;
    renderSound();
  }).catch(() => { soundStatus.textContent = 'Could not load the sound preference.'; });
  soundToggle.addEventListener('change', () => {
    const next = soundToggle.checked;
    const previous = soundEnabledValue;
    soundEnabledValue = next;
    renderSound();
    void saveSoundEnabled(next).then(() => {
      appendLog('sound preference saved', { enabled: next });
    }).catch(() => {
      soundEnabledValue = previous;
      renderSound();
      soundStatus.textContent = 'Could not save the sound preference.';
    });
  });
  soundChoice.addEventListener('change', () => {
    const previous = soundIdValue;
    soundIdValue = resolveSoundId(soundChoice.value);
    renderSound();
    void saveSelectedSoundId(soundIdValue).then(() => {
      appendLog('sound selection saved', { soundId: soundIdValue });
    }).catch(() => {
      soundIdValue = previous;
      renderSound();
      soundStatus.textContent = 'Could not save the sound selection.';
    });
  });
  required<HTMLButtonElement>('test-sound').addEventListener('click', () => {
    appendLog('test sound requested', { savedEnabled: soundEnabledValue, soundId: soundIdValue });
    requestNewQuestionSound();
  });

  renderStatus();
  appendLog('tester loaded', { documentPipAvailable: Boolean(api) });

  required<HTMLButtonElement>('open-pip').addEventListener('click', () => {
    preview.idle();
    appendLog('Open PiP requested');
    void controller.open();
  });

  required<HTMLButtonElement>('idle').addEventListener('click', () => {
    preview.idle();
    controller.idle();
    appendLog('simulated idle');
  });

  required<HTMLButtonElement>('question').addEventListener('click', () => {
    // Routed through the shared acceptance point so sound and PiP share one decision.
    alerts.accepted(Date.now());
  });

  required<HTMLButtonElement>('ended').addEventListener('click', () => {
    alerts.ended(Date.now());
    appendLog('simulated question ended');
  });

  required<HTMLButtonElement>('stop').addEventListener('click', () => {
    preview.idle();
    controller.close();
    appendLog('close PiP requested');
  });

  required<HTMLButtonElement>('panel-unmonitored').addEventListener('click', () =>
    showPanelState({ monitoring: false, pip: { state: 'CLOSED', opening: false } }, 'not monitoring'));
  required<HTMLButtonElement>('panel-monitoring').addEventListener('click', () =>
    showPanelState({ monitoring: true, pip: { state: 'CLOSED', opening: false } }, 'monitoring, window closed'));
  required<HTMLButtonElement>('panel-opening').addEventListener('click', () =>
    showPanelState({ monitoring: true, pip: { state: 'CLOSED', opening: true } }, 'opening'));
  required<HTMLButtonElement>('panel-unsupported').addEventListener('click', () =>
    showPanelState({ monitoring: true, pip: { state: 'CLOSED', opening: false, issue: 'unsupported' } }, 'unsupported'));
  required<HTMLButtonElement>('panel-failed').addEventListener('click', () =>
    showPanelState({ monitoring: true, pip: { state: 'CLOSED', opening: false, issue: 'failed' } }, 'failed'));

  required<HTMLButtonElement>('clear-log').addEventListener('click', () => {
    logElement.replaceChildren();
    console.info('[iNoti][dev] event log cleared');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDevTester, { once: true });
else initDevTester();
