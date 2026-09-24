import { watchPulsePreference } from '../shared/alert-preference';
import { createPipView } from './pip-view';

export function createConfiguredPipView(document: Document) {
  // This module runs in the opener. Keep focus synchronous with the PiP click's
  // user activation; focusing alone preserves PiP and its monitoring state.
  const view = createPipView(document, () => window.focus());
  const unsubscribe = watchPulsePreference(enabled => view.setPulseEnabled(enabled));
  document.defaultView?.addEventListener('pagehide', unsubscribe, { once: true });
  return view;
}
