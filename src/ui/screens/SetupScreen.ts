import { AgeGroup, FitnessLevel } from '../../types';
import type { HealthProfile } from '../../health/HealthProfile';
import { AGE_GROUP_DEFAULTS, FITNESS_MULTIPLIERS } from '../../constants';

export function createSetupScreen(
  profile: HealthProfile,
  onStart: () => void,
): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen screen-overlay';
  screen.id = 'setup-screen';

  const settings = profile.settings;

  screen.innerHTML = `
    <div class="panel">
      <div class="title" style="font-size: 1.8em">Setup</div>
      <p class="subtitle">Customize your workout</p>

      <div class="form-row">
        <div class="form-group">
          <label>Age</label>
          <input type="number" id="input-age" value="${settings.age}" min="6" max="100">
        </div>
        <div class="form-group">
          <label>Weight (kg)</label>
          <input type="number" id="input-weight" value="${settings.weight}" min="20" max="200">
        </div>
      </div>

      <div class="form-group">
        <label>Fitness Level</label>
        <select id="select-fitness">
          <option value="${FitnessLevel.BEGINNER}" ${settings.fitnessLevel === FitnessLevel.BEGINNER ? 'selected' : ''}>Beginner</option>
          <option value="${FitnessLevel.INTERMEDIATE}" ${settings.fitnessLevel === FitnessLevel.INTERMEDIATE ? 'selected' : ''}>Intermediate</option>
          <option value="${FitnessLevel.ADVANCED}" ${settings.fitnessLevel === FitnessLevel.ADVANCED ? 'selected' : ''}>Advanced</option>
        </select>
      </div>

      <div class="form-group">
        <label>Session Duration: <span class="slider-value" id="duration-value">${formatTime(settings.sessionDuration)}</span></label>
        <input type="range" id="slider-duration" min="60" max="1200" step="30" value="${settings.sessionDuration}">
      </div>

      <div class="form-group">
        <label>Jump Target: <span class="slider-value" id="target-value">${settings.jumpTarget}</span></label>
        <input type="range" id="slider-target" min="10" max="300" step="5" value="${settings.jumpTarget}">
      </div>

      <div style="margin-top: 20px">
        <button class="btn btn-primary" id="btn-setup-start">Start Camera</button>
      </div>
    </div>
  `;

  // Event handlers
  const ageInput = screen.querySelector('#input-age') as HTMLInputElement;
  const weightInput = screen.querySelector('#input-weight') as HTMLInputElement;
  const fitnessSelect = screen.querySelector('#select-fitness') as HTMLSelectElement;
  const durationSlider = screen.querySelector('#slider-duration') as HTMLInputElement;
  const targetSlider = screen.querySelector('#slider-target') as HTMLInputElement;
  const durationValue = screen.querySelector('#duration-value') as HTMLSpanElement;
  const targetValue = screen.querySelector('#target-value') as HTMLSpanElement;

  ageInput.addEventListener('change', () => {
    profile.setAge(parseInt(ageInput.value) || 25);
    updateFromProfile();
  });

  weightInput.addEventListener('change', () => {
    profile.setWeight(parseInt(weightInput.value) || 70);
  });

  fitnessSelect.addEventListener('change', () => {
    profile.setFitnessLevel(fitnessSelect.value as FitnessLevel);
    updateFromProfile();
  });

  durationSlider.addEventListener('input', () => {
    const val = parseInt(durationSlider.value);
    profile.setSessionDuration(val);
    durationValue.textContent = formatTime(val);
  });

  targetSlider.addEventListener('input', () => {
    const val = parseInt(targetSlider.value);
    profile.setJumpTarget(val);
    targetValue.textContent = String(val);
  });

  function updateFromProfile() {
    const s = profile.settings;
    durationSlider.value = String(s.sessionDuration);
    durationValue.textContent = formatTime(s.sessionDuration);
    targetSlider.value = String(s.jumpTarget);
    targetValue.textContent = String(s.jumpTarget);
  }

  screen.querySelector('#btn-setup-start')!.addEventListener('click', onStart);

  return screen;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
