export function createWelcomeScreen(onStart: () => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'welcome-screen';

  screen.innerHTML = `
    <div class="panel">
      <div class="logo">JUMPRR</div>
      <div class="title">Fitness Runner</div>
      <p class="subtitle">Jump your way to fitness with webcam motion tracking</p>
      <div class="disclaimer">
        <div class="disclaimer-title">Health Disclaimer</div>
        <p>This game involves physical jumping. Consult your physician before starting any exercise program.
        Stop immediately if you feel dizzy, pain, or shortness of breath. Ensure you have adequate space
        and a safe surface for jumping. Not a substitute for professional medical advice.</p>
      </div>
      <button class="btn btn-primary" id="btn-start">I Understand - Let's Go!</button>
    </div>
  `;

  screen.querySelector('#btn-start')!.addEventListener('click', onStart);

  return screen;
}
