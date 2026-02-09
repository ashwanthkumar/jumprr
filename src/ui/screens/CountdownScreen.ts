export function createCountdownScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'countdown-screen';

  screen.innerHTML = `
    <div class="countdown-number" id="countdown-number">3</div>
  `;

  return screen;
}

export function runCountdown(screen: HTMLElement, onComplete: () => void): void {
  const numEl = screen.querySelector('#countdown-number') as HTMLElement;
  let count = 3;

  function tick() {
    if (count > 0) {
      numEl.textContent = String(count);
      numEl.style.animation = 'none';
      void numEl.offsetHeight; // force reflow
      numEl.style.animation = 'countPulse 1s ease-in-out';
      count--;
      setTimeout(tick, 1000);
    } else {
      numEl.textContent = 'GO!';
      numEl.style.animation = 'none';
      void numEl.offsetHeight;
      numEl.style.animation = 'countPulse 1s ease-in-out';
      setTimeout(onComplete, 800);
    }
  }

  tick();
}
