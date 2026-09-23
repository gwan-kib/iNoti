import controlStyles from './monitoring-control.css?inline';
import type { MonitoringStatus } from './pip-controller';
import { logger } from '../shared/logging';

export function createMonitoringControl(document: Document, toggle: () => void) {
  const host = document.createElement('div');
  host.id = 'inoti-monitoring-control';
  // Shadow DOM isolates our button from the site's generated styles. Only the button
  // captures pointer input; no page-sized overlay obstructs iClicker controls.
  host.style.cssText = 'all:initial;position:fixed;right:12px;bottom:12px;z-index:2147483647;max-width:calc(100vw - 24px);';
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  // The closed shadow root needs its own copy of the shared palette and styles.
  style.textContent = controlStyles;
  const button = document.createElement('button');
  button.type = 'button';
  button.addEventListener('click', toggle);
  root.append(style, button);
  return {
    show() {
      if (!host.isConnected) {
        document.body.append(host);
        logger('content')('monitoring control shown');
      }
    },
    hide() { host.remove(); },
    render(status: MonitoringStatus) {
      const active = status.state !== 'UNMONITORED';
      button.disabled = status.opening || status.issue === 'unsupported';
      button.textContent = status.issue === 'unsupported' ? 'iNoti: Document PiP unavailable'
        : status.issue === 'failed' ? 'PiP failed · Start Monitoring again'
        : status.opening ? '● Starting Monitoring…' : active ? '● Monitoring' : '● Start Monitoring';
      button.title = status.issue === 'unsupported' ? 'Monitoring requires desktop Chrome 116+ with Document Picture-in-Picture available.'
        : status.issue === 'failed' ? 'Could not open Picture-in-Picture. Click to try again.'
          : active ? 'Stop monitoring' : 'Open iNoti Picture-in-Picture';
      button.setAttribute('aria-label', status.issue === 'failed' ? 'Could not open Picture-in-Picture. Start Monitoring again'
        : active ? 'Monitoring. Stop monitoring' : button.textContent);
      button.setAttribute('aria-pressed', String(active));
    },
  };
}
