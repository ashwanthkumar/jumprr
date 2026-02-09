import type { PoseData, CalibrationData } from '../types';
import { LM } from '../constants';

// MediaPipe pose landmark connections for drawing the skeleton
const CONNECTIONS: [number, number][] = [
  // Torso
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  // Left arm
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  // Right arm
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  // Left leg
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_HEEL],
  [LM.LEFT_ANKLE, LM.LEFT_FOOT],
  // Right leg
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT],
  // Face to shoulders
  [LM.NOSE, LM.LEFT_EYE],
  [LM.NOSE, LM.RIGHT_EYE],
  [LM.LEFT_EYE, LM.LEFT_EAR],
  [LM.RIGHT_EYE, LM.RIGHT_EAR],
  [LM.NOSE, LM.LEFT_SHOULDER],
  [LM.NOSE, LM.RIGHT_SHOULDER],
];

// Landmark groups for color coding
const FACE_LANDMARKS = new Set([
  LM.NOSE, LM.LEFT_EYE_INNER, LM.LEFT_EYE, LM.LEFT_EYE_OUTER,
  LM.RIGHT_EYE_INNER, LM.RIGHT_EYE, LM.RIGHT_EYE_OUTER,
  LM.LEFT_EAR, LM.RIGHT_EAR, LM.MOUTH_LEFT, LM.MOUTH_RIGHT,
]);
const SHOULDER_LANDMARKS = new Set([LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER]);

export class SkeletonOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private calibration: CalibrationData | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.canvas.className = 'skeleton-canvas';
    this.ctx = this.canvas.getContext('2d')!;
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  setCalibration(calibration: CalibrationData): void {
    this.calibration = calibration;
  }

  draw(pose: PoseData): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const lm = pose.landmarks;

    ctx.clearRect(0, 0, width, height);

    if (lm.length < 33) return;

    // Draw connections
    ctx.lineWidth = 2;
    for (const [a, b] of CONNECTIONS) {
      const la = lm[a];
      const lb = lm[b];
      if (la.visibility < 0.3 || lb.visibility < 0.3) continue;

      // Color: cyan for face, yellow for shoulders, white for rest
      if (FACE_LANDMARKS.has(a) && FACE_LANDMARKS.has(b)) {
        ctx.strokeStyle = '#ff79c6';
      } else if (SHOULDER_LANDMARKS.has(a) || SHOULDER_LANDMARKS.has(b)) {
        ctx.strokeStyle = '#ffd93d';
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      }

      ctx.beginPath();
      ctx.moveTo(la.x * width, la.y * height);
      ctx.lineTo(lb.x * width, lb.y * height);
      ctx.stroke();
    }

    // Draw landmark points
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      }

      const radius = i === LM.NOSE ? 5 : FACE_LANDMARKS.has(i) ? 3 : SHOULDER_LANDMARKS.has(i) ? 4 : 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw calibration reference lines if calibrated
    const cal = this.calibration;
    if (cal && cal.isCalibrated) {
      const jumpThreshold = cal.noseShoulderDistY * 0.25;

      // Baseline shoulder Y (red dashed) - resting shoulder position
      const baseShoulderScreenY = cal.baselineShoulderY * height;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;

      ctx.strokeStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(0, baseShoulderScreenY);
      ctx.lineTo(width, baseShoulderScreenY);
      ctx.stroke();

      // Launch trigger line (orange) - shoulders need to rise above this
      const launchY = (cal.baselineShoulderY - jumpThreshold * 0.5) * height;
      ctx.strokeStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(0, launchY);
      ctx.lineTo(width, launchY);
      ctx.stroke();

      // Full jump threshold (green) - shoulders above this = airborne
      const jumpY = (cal.baselineShoulderY - jumpThreshold) * height;
      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(0, jumpY);
      ctx.lineTo(width, jumpY);
      ctx.stroke();

      // Baseline nose Y (dimmer red dashed)
      const baseNoseScreenY = cal.baselineNoseY * height;
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, baseNoseScreenY);
      ctx.lineTo(width, baseNoseScreenY);
      ctx.stroke();

      ctx.setLineDash([]);

      // Labels
      ctx.font = '9px monospace';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('shoulders baseline', 2, baseShoulderScreenY - 3);
      ctx.fillStyle = '#ff8800';
      ctx.fillText('launch', 2, launchY - 3);
      ctx.fillStyle = '#00ff00';
      ctx.fillText('jump!', 2, jumpY - 3);

      // Current shoulder position indicator
      const currentShoulderY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
      const shoulderDisp = cal.baselineShoulderY - currentShoulderY;
      const dispRatio = shoulderDisp / jumpThreshold;

      // Displacement bar on right edge
      const barMax = 45;
      const barHeight = Math.abs(dispRatio) * barMax;
      const barColor = dispRatio > 1.0
        ? '#00ff00'
        : dispRatio > 0.5
        ? '#ffaa00'
        : '#ff4444';
      ctx.fillStyle = barColor;
      ctx.fillRect(width - 8, height - 55, 6, -Math.min(barHeight, barMax));

      // Bar outline
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width - 8, height - 55, 6, -barMax);

      // Displacement text
      ctx.font = '10px monospace';
      ctx.fillStyle = barColor;
      ctx.fillText(`${(dispRatio * 100).toFixed(0)}%`, width - 30, height - 58);
    }
  }
}
