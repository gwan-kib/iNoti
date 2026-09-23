import { detectionTime } from './time';
import { logger } from '../shared/logging';

const log = logger('alert');
log('loaded');
const time = document.getElementById('time');
const close = document.getElementById('close');
const formatted = detectionTime(window.location.search);
if (!time || !close) {
  log('rendering failed: required elements missing');
} else {
  if (formatted === null) {
    time.textContent = 'Detection time unavailable';
    log('invalid or missing detectedAt');
  } else {
    time.textContent = `Detected at ${formatted}`;
    log('detection time rendered');
  }
  close.addEventListener('click', () => {
    log('close requested');
    window.close();
  });
}
