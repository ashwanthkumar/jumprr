export function createCalibrationScreen(onReady: () => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'calibration-screen';

  screen.innerHTML = `
    <div class="panel">
      <div class="title" style="font-size: 1.8em">Calibration</div>
      <p class="subtitle">Stand still and face the camera</p>
      <div class="calibration-circle" id="calibration-circle" style="display: none;">
        <div class="calibration-fill" id="calibration-fill"></div>
        <div class="calibration-text" id="calibration-text">5</div>
      </div>
      <div id="calibration-instructions">
        <p style="color: rgba(255,255,255,0.6); font-size: 0.9em;">
          Stand in your play area, arms relaxed at your sides.<br>
          Make sure your upper body is visible.
        </p>
        <p style="color: #ffd93d; font-size: 0.85em; margin-top: 8px;">
          Mark your position on the floor. Stand at the same spot each time you play.
        </p>
        <button class="btn btn-primary" id="btn-calibrate-ready" style="margin-top: 16px;">I'm Ready</button>
      </div>
      <p id="calibration-hold-msg" style="color: rgba(255,255,255,0.6); font-size: 0.9em; display: none;">
        Hold still...
      </p>
      <div class="loading-spinner" id="calibration-loading" style="display: none;"></div>
    </div>
  `;

  screen.querySelector('#btn-calibrate-ready')!.addEventListener('click', onReady);

  return screen;
}

export function resetCalibrationScreen(screen: HTMLElement): void {
  const instructions = screen.querySelector('#calibration-instructions') as HTMLElement;
  const circle = screen.querySelector('#calibration-circle') as HTMLElement;
  const holdMsg = screen.querySelector('#calibration-hold-msg') as HTMLElement;
  const fill = screen.querySelector('#calibration-fill') as HTMLElement;
  const text = screen.querySelector('#calibration-text') as HTMLElement;

  if (instructions) instructions.style.display = '';
  if (circle) circle.style.display = 'none';
  if (holdMsg) holdMsg.style.display = 'none';
  if (fill) fill.style.setProperty('--progress', '0%');
  if (text) text.textContent = '5';
}

export function startCalibrationCountdown(screen: HTMLElement): void {
  const instructions = screen.querySelector('#calibration-instructions') as HTMLElement;
  const circle = screen.querySelector('#calibration-circle') as HTMLElement;
  const holdMsg = screen.querySelector('#calibration-hold-msg') as HTMLElement;

  if (instructions) instructions.style.display = 'none';
  if (circle) circle.style.display = '';
  if (holdMsg) holdMsg.style.display = '';
}

export function updateCalibrationProgress(screen: HTMLElement, progress: number): void {
  const fill = screen.querySelector('#calibration-fill') as HTMLElement;
  const text = screen.querySelector('#calibration-text') as HTMLElement;

  if (fill) {
    fill.style.setProperty('--progress', `${progress * 100}%`);
  }
  if (text) {
    const remaining = Math.ceil(5 * (1 - progress));
    text.textContent = remaining > 0 ? String(remaining) : '!';
  }
}
