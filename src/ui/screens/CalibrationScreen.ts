export function createCalibrationScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'calibration-screen';

  screen.innerHTML = `
    <div class="panel">
      <div class="title" style="font-size: 1.8em">Calibration</div>
      <p class="subtitle">Stand still and face the camera</p>
      <div class="calibration-circle">
        <div class="calibration-fill" id="calibration-fill"></div>
        <div class="calibration-text" id="calibration-text">3</div>
      </div>
      <p style="color: rgba(255,255,255,0.6); font-size: 0.9em;">
        Stand in your play area, arms relaxed at your sides.<br>
        Make sure your full body is visible.
      </p>
      <div class="loading-spinner" id="calibration-loading" style="display: none;"></div>
    </div>
  `;

  return screen;
}

export function updateCalibrationProgress(screen: HTMLElement, progress: number): void {
  const fill = screen.querySelector('#calibration-fill') as HTMLElement;
  const text = screen.querySelector('#calibration-text') as HTMLElement;

  if (fill) {
    fill.style.setProperty('--progress', `${progress * 100}%`);
  }
  if (text) {
    const remaining = Math.ceil(3 * (1 - progress));
    text.textContent = remaining > 0 ? String(remaining) : '!';
  }
}
