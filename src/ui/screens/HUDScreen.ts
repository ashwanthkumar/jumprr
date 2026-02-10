import type { GameStateData } from '../../types';

export function createHUDScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.id = 'hud-screen';

  screen.innerHTML = `
    <div class="hud-top">
      <div>
        <div class="hud-score" id="hud-score">0</div>
        <div class="hud-combo" id="hud-combo">Combo x0</div>
      </div>
      <div class="hud-info">
        <div class="hud-timer" id="hud-timer">0:00</div>
        <div class="hud-jumps" id="hud-jumps">Jumps: 0</div>
        <div class="hud-distance" id="hud-distance">0m</div>
      </div>
    </div>
    <div class="hud-jump-countdown" id="hud-jump-countdown"></div>
  `;

  return screen;
}

export function updateHUD(screen: HTMLElement, state: GameStateData): void {
  const scoreEl = screen.querySelector('#hud-score') as HTMLElement;
  const comboEl = screen.querySelector('#hud-combo') as HTMLElement;
  const timerEl = screen.querySelector('#hud-timer') as HTMLElement;
  const jumpsEl = screen.querySelector('#hud-jumps') as HTMLElement;
  const distEl = screen.querySelector('#hud-distance') as HTMLElement;
  const countdownEl = screen.querySelector('#hud-jump-countdown') as HTMLElement;

  scoreEl.textContent = String(state.score);

  if (state.combo > 0) {
    comboEl.textContent = `Combo x${state.combo}`;
    comboEl.classList.add('visible');
  } else {
    comboEl.classList.remove('visible');
  }

  // Elapsed time counting up
  const elapsed = state.sessionTimeRemaining; // now stores elapsed time
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  timerEl.classList.remove('warning');

  jumpsEl.textContent = `Jumps: ${state.jumpCount}`;
  distEl.textContent = `${Math.floor(state.distance)}m`;

  // Jump countdown
  const t = state.timeToNextObstacle;
  if (t < Infinity && t > 0) {
    countdownEl.style.display = '';
    if (t <= 1) {
      countdownEl.textContent = 'JUMP!';
      countdownEl.classList.remove('warning');
      countdownEl.classList.add('urgent');
    } else if (t <= 3) {
      countdownEl.textContent = `JUMP IN ${t.toFixed(1)}s`;
      countdownEl.classList.add('warning');
      countdownEl.classList.remove('urgent');
    } else {
      countdownEl.textContent = `JUMP IN ${t.toFixed(1)}s`;
      countdownEl.classList.remove('warning', 'urgent');
    }
  } else {
    countdownEl.style.display = 'none';
    countdownEl.classList.remove('warning', 'urgent');
  }
}
