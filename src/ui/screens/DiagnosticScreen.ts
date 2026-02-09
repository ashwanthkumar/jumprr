import type { PoseData, CalibrationData } from '../../types';
import { LM, JUMP_LAUNCH_THRESHOLD, SHOULDER_CONFIRM_RATIO, AUTO_LAND_MS } from '../../constants';
import type { JumpState } from '../../types';

// MediaPipe connections for skeleton
const CONNECTIONS: [number, number][] = [
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.NOSE, LM.LEFT_EYE],
  [LM.NOSE, LM.RIGHT_EYE],
  [LM.LEFT_EYE, LM.LEFT_EAR],
  [LM.RIGHT_EYE, LM.RIGHT_EAR],
  [LM.NOSE, LM.LEFT_SHOULDER],
  [LM.NOSE, LM.RIGHT_SHOULDER],
];

const FACE_LANDMARKS = new Set([
  LM.NOSE, LM.LEFT_EYE_INNER, LM.LEFT_EYE, LM.LEFT_EYE_OUTER,
  LM.RIGHT_EYE_INNER, LM.RIGHT_EYE, LM.RIGHT_EYE_OUTER,
  LM.LEFT_EAR, LM.RIGHT_EAR, LM.MOUTH_LEFT, LM.MOUTH_RIGHT,
]);
const SHOULDER_LANDMARKS = new Set([LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER]);

export function createDiagnosticScreen(
  onCalibrate: () => void,
  onClose: () => void,
): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.id = 'diagnostic-screen';

  screen.innerHTML = `
    <div class="diag-layout">
      <div class="diag-video-area">
        <div class="diag-video-container">
          <video class="diag-video" playsinline autoplay muted></video>
          <canvas class="diag-skeleton-canvas"></canvas>
          <div class="diag-state-badge" id="diag-state">IDLE</div>
        </div>
      </div>
      <div class="diag-panel">
        <div class="diag-title">Pose Diagnostic</div>
        <div class="diag-section">
          <div class="diag-section-title">Jump State Machine</div>
          <div class="diag-states" id="diag-states">
            <span class="diag-state-dot active" data-state="idle">IDLE</span>
            <span class="diag-state-arrow">&rarr;</span>
            <span class="diag-state-dot" data-state="launching">LAUNCH</span>
            <span class="diag-state-arrow">&rarr;</span>
            <span class="diag-state-dot" data-state="cooldown">COOL</span>
          </div>
          <div class="diag-value-row" style="margin-top: 4px;">
            <span class="diag-label">Auto-Land Timer:</span>
            <span class="diag-val" id="dv-autoland-timer">--</span>
          </div>
        </div>

        <div class="diag-section">
          <div class="diag-section-title">Vertical Displacement</div>
          <div class="diag-bar-container">
            <div class="diag-bar-bg">
              <div class="diag-bar-fill" id="diag-shoulder-bar"></div>
              <div class="diag-bar-marker" id="diag-launch-marker" title="Launch threshold"></div>
              <div class="diag-bar-marker diag-bar-marker-jump" id="diag-jump-marker" title="Jump threshold"></div>
            </div>
            <div class="diag-bar-labels">
              <span>0%</span>
              <span id="diag-disp-pct">0%</span>
              <span>200%</span>
            </div>
          </div>
          <div class="diag-values" id="diag-values">
            <div class="diag-value-row">
              <span class="diag-label">Shoulder Disp:</span>
              <span class="diag-val" id="dv-shoulder-disp">0.0000</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Nose Disp:</span>
              <span class="diag-val" id="dv-nose-disp">0.0000</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Z Disp:</span>
              <span class="diag-val" id="dv-z-disp">0.0000</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Z/Y Ratio:</span>
              <span class="diag-val" id="dv-zy-ratio">0.00</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Threshold:</span>
              <span class="diag-val" id="dv-threshold">0.0000</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Nose Confirmed:</span>
              <span class="diag-val" id="dv-nose-confirm">--</span>
            </div>
          </div>
        </div>

        <div class="diag-section">
          <div class="diag-section-title">Calibration</div>
          <div class="diag-values" id="diag-cal-values">
            <div class="diag-value-row">
              <span class="diag-label">Status:</span>
              <span class="diag-val" id="dv-cal-status">Not calibrated</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Nose-Shoulder Y:</span>
              <span class="diag-val" id="dv-cal-nsd">--</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Nose-Shoulder 3D:</span>
              <span class="diag-val" id="dv-cal-nsd3d">--</span>
            </div>
            <div class="diag-value-row">
              <span class="diag-label">Shoulder Width:</span>
              <span class="diag-val" id="dv-cal-sw">--</span>
            </div>
          </div>
        </div>

        <div class="diag-section">
          <div class="diag-section-title">Landmark Visibility</div>
          <div class="diag-landmarks" id="diag-landmarks">
            <span class="diag-lm" id="dlm-nose">Nose</span>
            <span class="diag-lm" id="dlm-leye">L.Eye</span>
            <span class="diag-lm" id="dlm-reye">R.Eye</span>
            <span class="diag-lm" id="dlm-lear">L.Ear</span>
            <span class="diag-lm" id="dlm-rear">R.Ear</span>
            <span class="diag-lm" id="dlm-lsh">L.Shldr</span>
            <span class="diag-lm" id="dlm-rsh">R.Shldr</span>
            <span class="diag-lm" id="dlm-lel">L.Elbow</span>
            <span class="diag-lm" id="dlm-rel">R.Elbow</span>
            <span class="diag-lm" id="dlm-lwr">L.Wrist</span>
            <span class="diag-lm" id="dlm-rwr">R.Wrist</span>
            <span class="diag-lm" id="dlm-lhip">L.Hip</span>
            <span class="diag-lm" id="dlm-rhip">R.Hip</span>
          </div>
        </div>

        <div class="diag-section">
          <div class="diag-section-title">Jump Counter</div>
          <div class="diag-jump-count" id="diag-jump-count">0</div>
        </div>

        <div class="diag-buttons">
          <button class="btn btn-primary" id="btn-diag-calibrate">Re-Calibrate</button>
          <button class="btn btn-secondary" id="btn-diag-close">Back to Game</button>
        </div>
      </div>
    </div>
  `;

  screen.querySelector('#btn-diag-calibrate')!.addEventListener('click', onCalibrate);
  screen.querySelector('#btn-diag-close')!.addEventListener('click', onClose);

  return screen;
}

const LANDMARK_MAP: [string, number][] = [
  ['dlm-nose', LM.NOSE],
  ['dlm-leye', LM.LEFT_EYE],
  ['dlm-reye', LM.RIGHT_EYE],
  ['dlm-lear', LM.LEFT_EAR],
  ['dlm-rear', LM.RIGHT_EAR],
  ['dlm-lsh', LM.LEFT_SHOULDER],
  ['dlm-rsh', LM.RIGHT_SHOULDER],
  ['dlm-lel', LM.LEFT_ELBOW],
  ['dlm-rel', LM.RIGHT_ELBOW],
  ['dlm-lwr', LM.LEFT_WRIST],
  ['dlm-rwr', LM.RIGHT_WRIST],
  ['dlm-lhip', LM.LEFT_HIP],
  ['dlm-rhip', LM.RIGHT_HIP],
];

export function updateDiagnostic(
  screen: HTMLElement,
  pose: PoseData | null,
  calibration: CalibrationData | null,
  jumpState: JumpState,
  jumpCount: number,
  cooldownRemaining: number,
): void {
  if (!pose || pose.landmarks.length < 33) return;

  const lm = pose.landmarks;
  const canvas = screen.querySelector('.diag-skeleton-canvas') as HTMLCanvasElement;
  const video = screen.querySelector('.diag-video') as HTMLVideoElement;

  // Sync canvas size to video display size
  if (canvas.width !== video.offsetWidth || canvas.height !== video.offsetHeight) {
    canvas.width = video.offsetWidth || 640;
    canvas.height = video.offsetHeight || 480;
  }

  // Draw skeleton on large canvas
  drawSkeleton(canvas, lm);

  // Update state badge
  const badge = screen.querySelector('#diag-state') as HTMLElement;
  badge.textContent = jumpState.toUpperCase();
  badge.className = `diag-state-badge diag-state-${jumpState}`;

  // Update state machine dots
  const dots = screen.querySelectorAll('.diag-state-dot');
  dots.forEach(dot => {
    const s = (dot as HTMLElement).dataset.state;
    dot.classList.toggle('active', s === jumpState);
  });

  // Update landmark visibility
  for (const [id, idx] of LANDMARK_MAP) {
    const el = screen.querySelector(`#${id}`) as HTMLElement;
    if (el) {
      const vis = lm[idx].visibility;
      el.classList.toggle('vis-good', vis >= 0.7);
      el.classList.toggle('vis-ok', vis >= 0.4 && vis < 0.7);
      el.classList.toggle('vis-bad', vis < 0.4);
      el.title = `visibility: ${vis.toFixed(2)}`;
    }
  }

  // Jump counter
  const countEl = screen.querySelector('#diag-jump-count') as HTMLElement;
  countEl.textContent = String(jumpCount);

  // Auto-land timer
  const setValue = (id: string, text: string, color?: string) => {
    const el = screen.querySelector(`#${id}`) as HTMLElement;
    if (el) {
      el.textContent = text;
      if (color) el.style.color = color;
    }
  };

  setValue('dv-autoland-timer',
    cooldownRemaining > 0 ? `${cooldownRemaining.toFixed(0)}ms / ${AUTO_LAND_MS}ms` : '--',
    cooldownRemaining > 0 ? '#ffaa00' : '#888');

  if (!calibration || !calibration.isCalibrated) {
    const calStatus = screen.querySelector('#dv-cal-status') as HTMLElement;
    calStatus.textContent = 'Not calibrated';
    calStatus.style.color = '#ff4444';
    return;
  }

  // Compute values
  const noseY = lm[LM.NOSE].y;
  const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
  const shoulderMidZ = (lm[LM.LEFT_SHOULDER].z + lm[LM.RIGHT_SHOULDER].z) / 2;

  const noseDisp = calibration.baselineNoseY - noseY;
  const shoulderDisp = calibration.baselineShoulderY - shoulderMidY;
  const zDisp = calibration.baselineShoulderZ - shoulderMidZ;
  const jumpThreshold = calibration.noseShoulderDistY * JUMP_LAUNCH_THRESHOLD;
  const noseConfirmed = noseDisp > jumpThreshold * SHOULDER_CONFIRM_RATIO;
  const zyRatio = Math.abs(shoulderDisp) > 0.001 ? Math.abs(zDisp) / Math.abs(shoulderDisp) : 0;
  const dispPct = jumpThreshold > 0 ? (shoulderDisp / jumpThreshold) * 100 : 0;

  // Update values
  setValue('dv-shoulder-disp', shoulderDisp.toFixed(4),
    shoulderDisp > jumpThreshold ? '#00ff00' : shoulderDisp > jumpThreshold * 0.5 ? '#ffaa00' : '#ff4444');
  setValue('dv-nose-disp', noseDisp.toFixed(4),
    noseConfirmed ? '#00ff00' : '#ff4444');
  setValue('dv-z-disp', zDisp.toFixed(4),
    zyRatio > 2.0 ? '#ff4444' : '#aaa');
  setValue('dv-zy-ratio', zyRatio.toFixed(2),
    zyRatio > 2.0 ? '#ff4444' : '#aaa');
  setValue('dv-threshold', jumpThreshold.toFixed(4));
  setValue('dv-nose-confirm', noseConfirmed ? 'YES' : 'NO',
    noseConfirmed ? '#00ff00' : '#ff4444');
  setValue('dv-cal-status', 'Calibrated', '#00ff88');
  setValue('dv-cal-nsd', calibration.noseShoulderDistY.toFixed(4));
  setValue('dv-cal-nsd3d', calibration.noseShoulderDist3D.toFixed(4));
  setValue('dv-cal-sw', calibration.shoulderWidth.toFixed(4));
  setValue('diag-disp-pct', `${dispPct.toFixed(0)}%`);

  // Update displacement bar
  const barFill = screen.querySelector('#diag-shoulder-bar') as HTMLElement;
  const pctClamped = Math.max(0, Math.min(dispPct, 200));
  barFill.style.width = `${pctClamped / 2}%`;
  barFill.style.background = dispPct > 100 ? '#00ff00' : dispPct > 50 ? '#ffaa00' : '#ff4444';

  // Position threshold markers
  const launchMarker = screen.querySelector('#diag-launch-marker') as HTMLElement;
  const jumpMarker = screen.querySelector('#diag-jump-marker') as HTMLElement;
  launchMarker.style.left = '25%';
  jumpMarker.style.left = '50%';

  // Draw threshold lines on skeleton canvas
  drawThresholdLines(canvas, calibration, jumpThreshold);
}

export function setDiagnosticVideo(screen: HTMLElement, srcObject: MediaProvider | null): void {
  const video = screen.querySelector('.diag-video') as HTMLVideoElement;
  if (video && srcObject) {
    video.srcObject = srcObject;
    video.play();
  }
}

function drawSkeleton(canvas: HTMLCanvasElement, lm: PoseData['landmarks']): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);

  // Draw connections
  ctx.lineWidth = 3;
  for (const [a, b] of CONNECTIONS) {
    const la = lm[a];
    const lb = lm[b];
    if (la.visibility < 0.3 || lb.visibility < 0.3) continue;

    if (FACE_LANDMARKS.has(a) && FACE_LANDMARKS.has(b)) {
      ctx.strokeStyle = '#ff79c6';
    } else if (SHOULDER_LANDMARKS.has(a) || SHOULDER_LANDMARKS.has(b)) {
      ctx.strokeStyle = '#ffd93d';
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    }

    ctx.beginPath();
    ctx.moveTo(la.x * width, la.y * height);
    ctx.lineTo(lb.x * width, lb.y * height);
    ctx.stroke();
  }

  // Draw landmarks
  for (let i = 0; i < lm.length; i++) {
    const l = lm[i];
    if (l.visibility < 0.3) continue;

    const x = l.x * width;
    const y = l.y * height;

    if (FACE_LANDMARKS.has(i)) {
      ctx.fillStyle = '#ff79c6';
    } else if (SHOULDER_LANDMARKS.has(i)) {
      ctx.fillStyle = '#ffd93d';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    }

    const radius = i === LM.NOSE ? 7 : FACE_LANDMARKS.has(i) ? 5 : SHOULDER_LANDMARKS.has(i) ? 6 : 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.lineWidth = 3;
  }
}

function drawThresholdLines(
  canvas: HTMLCanvasElement,
  cal: CalibrationData,
  jumpThreshold: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;

  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;

  // Baseline shoulder (red)
  const baseY = cal.baselineShoulderY * height;
  ctx.strokeStyle = 'rgba(255, 68, 68, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(width, baseY);
  ctx.stroke();

  // Launch threshold (orange)
  const launchY = (cal.baselineShoulderY - jumpThreshold * 0.5) * height;
  ctx.strokeStyle = 'rgba(255, 136, 0, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, launchY);
  ctx.lineTo(width, launchY);
  ctx.stroke();

  // Jump threshold (green)
  const jumpY = (cal.baselineShoulderY - jumpThreshold) * height;
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, jumpY);
  ctx.lineTo(width, jumpY);
  ctx.stroke();

  // Baseline nose (dim)
  const noseBaseY = cal.baselineNoseY * height;
  ctx.strokeStyle = 'rgba(255, 121, 198, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, noseBaseY);
  ctx.lineTo(width, noseBaseY);
  ctx.stroke();

  ctx.setLineDash([]);

  // Labels
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
  ctx.fillText('baseline', 8, baseY - 6);
  ctx.fillStyle = 'rgba(255, 136, 0, 0.9)';
  ctx.fillText('launch (50%)', 8, launchY - 6);
  ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
  ctx.fillText('JUMP (100%)', 8, jumpY - 6);
}
