import type { SessionStats } from '../../types';
import type { Recommendation } from '../../health/RecommendationEngine';

export function createResultsScreen(
  onPlayAgain: () => void,
  onChangeSettings: () => void,
): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'results-screen';

  screen.innerHTML = `
    <div class="panel" style="max-width: 600px;">
      <div class="results-scroll">
        <div class="title" style="font-size: 2em">Session Complete!</div>
        <div class="results-grid" id="results-grid"></div>
        <div class="recommendations" id="recommendations"></div>
      </div>
      <div style="margin-top: 20px">
        <button class="btn btn-primary" id="btn-play-again">Play Again</button>
        <button class="btn btn-secondary" id="btn-change-settings">Settings</button>
      </div>
    </div>
  `;

  screen.querySelector('#btn-play-again')!.addEventListener('click', onPlayAgain);
  screen.querySelector('#btn-change-settings')!.addEventListener('click', onChangeSettings);

  return screen;
}

export function updateResults(
  screen: HTMLElement,
  stats: SessionStats,
  recommendations: Recommendation[],
): void {
  const grid = screen.querySelector('#results-grid') as HTMLElement;
  const recsEl = screen.querySelector('#recommendations') as HTMLElement;

  const minutes = Math.floor(stats.sessionDuration / 60);
  const seconds = Math.floor(stats.sessionDuration % 60);

  grid.innerHTML = `
    <div class="result-card">
      <div class="result-value">${stats.score}</div>
      <div class="result-label">Score</div>
    </div>
    <div class="result-card">
      <div class="result-value">${stats.totalJumps}</div>
      <div class="result-label">Total Jumps</div>
    </div>
    <div class="result-card">
      <div class="result-value">${stats.distance}m</div>
      <div class="result-label">Distance</div>
    </div>
    <div class="result-card">
      <div class="result-value">${stats.caloriesBurned.toFixed(0)}</div>
      <div class="result-label">Calories</div>
    </div>
    <div class="result-card">
      <div class="result-value">x${stats.maxCombo}</div>
      <div class="result-label">Best Combo</div>
    </div>
    <div class="result-card">
      <div class="result-value">${minutes}:${seconds.toString().padStart(2, '0')}</div>
      <div class="result-label">Duration</div>
    </div>
  `;

  recsEl.innerHTML = recommendations.map(r => `
    <div class="recommendation">
      <h4>${r.title}</h4>
      <p>${r.text}</p>
    </div>
  `).join('');
}
