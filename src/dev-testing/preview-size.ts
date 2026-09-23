export function followPipSize(frame: HTMLIFrameElement, pip: Window): () => void {
  // Use the content viewport, excluding Chrome's window frame and title bar.
  const sync = () => {
    frame.style.width = `${pip.innerWidth}px`;
    frame.style.height = `${pip.innerHeight}px`;
  };
  sync();
  pip.addEventListener('resize', sync);
  return () => pip.removeEventListener('resize', sync);
}
