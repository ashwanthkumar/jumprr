export function createRestScreen(onSkip: () => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'rest-screen';

  screen.innerHTML = `
    <div class="panel">
      <div class="title" style="font-size: 1.8em">Rest Break</div>
      <p class="subtitle">Catch your breath! Shake out your legs.</p>
      <div class="rest-timer" id="rest-timer">30</div>
      <p style="color: rgba(255,255,255,0.6); font-size: 0.9em; margin-bottom: 20px;">
        Stay hydrated! Take a sip of water.
      </p>
      <button class="btn btn-secondary" id="btn-skip-rest">Skip Rest</button>
    </div>
  `;

  screen.querySelector('#btn-skip-rest')!.addEventListener('click', onSkip);

  return screen;
}

export function updateRestTimer(screen: HTMLElement, seconds: number): void {
  const timerEl = screen.querySelector('#rest-timer') as HTMLElement;
  timerEl.textContent = String(Math.ceil(seconds));
}
