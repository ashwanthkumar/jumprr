export function createPauseScreen(onResume: () => void, onQuit: () => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'pause-screen';

  screen.innerHTML = `
    <div class="panel">
      <div class="title" style="font-size: 2em">Paused</div>
      <p class="subtitle">Press ESC to resume</p>
      <div style="margin-top: 20px">
        <button class="btn btn-primary" id="btn-resume">Resume</button>
        <button class="btn btn-secondary" id="btn-quit">End Session</button>
      </div>
    </div>
  `;

  screen.querySelector('#btn-resume')!.addEventListener('click', onResume);
  screen.querySelector('#btn-quit')!.addEventListener('click', onQuit);

  return screen;
}
