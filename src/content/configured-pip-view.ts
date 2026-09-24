import { watchPulsePreference } from '../shared/alert-preference';
import { createPipView } from './pip-view';

export function createConfiguredPipView(document: Document) {
  const view = createPipView(document);
  const unsubscribe = watchPulsePreference(enabled => view.setPulseEnabled(enabled));
  document.defaultView?.addEventListener('pagehide', unsubscribe, { once: true });
  return view;
}
