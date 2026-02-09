import type { PoseData, CalibrationData } from '../types';
import { LM, CALIBRATION_DURATION } from '../constants';

export class BaselineCalibrator {
  private samples: PoseData[] = [];
  private startTime = 0;
  private _isCalibrating = false;
  private _calibrationData: CalibrationData = {
    baselineNoseY: 0,
    baselineShoulderY: 0,
    baselineNoseZ: 0,
    baselineShoulderZ: 0,
    noseShoulderDistY: 0,
    noseShoulderDist3D: 0,
    shoulderWidth: 0,
    isCalibrated: false,
  };

  get isCalibrating(): boolean {
    return this._isCalibrating;
  }

  get calibrationData(): CalibrationData {
    return this._calibrationData;
  }

  get progress(): number {
    if (!this._isCalibrating) return this._calibrationData.isCalibrated ? 1 : 0;
    const elapsed = (performance.now() / 1000) - this.startTime;
    return Math.min(elapsed / CALIBRATION_DURATION, 1);
  }

  startCalibration(): void {
    this.samples = [];
    this.startTime = performance.now() / 1000;
    this._isCalibrating = true;
    this._calibrationData.isCalibrated = false;
  }

  addSample(pose: PoseData): boolean {
    if (!this._isCalibrating) return false;

    this.samples.push(pose);

    const elapsed = (performance.now() / 1000) - this.startTime;
    if (elapsed >= CALIBRATION_DURATION) {
      this.finalize();
      return true; // calibration complete
    }
    return false;
  }

  private finalize(): void {
    if (this.samples.length === 0) return;

    let totalNoseY = 0;
    let totalShoulderY = 0;
    let totalNoseZ = 0;
    let totalShoulderZ = 0;
    let totalNoseShoulderDistY = 0;
    let totalShoulderWidth = 0;
    let count = 0;

    for (const sample of this.samples) {
      const lm = sample.landmarks;
      if (lm.length < 33) continue;

      // Require nose and both shoulders to be visible
      if (lm[LM.NOSE].visibility < 0.5) continue;
      if (lm[LM.LEFT_SHOULDER].visibility < 0.5 || lm[LM.RIGHT_SHOULDER].visibility < 0.5) continue;

      const noseY = lm[LM.NOSE].y;
      const noseZ = lm[LM.NOSE].z;
      const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
      const shoulderMidZ = (lm[LM.LEFT_SHOULDER].z + lm[LM.RIGHT_SHOULDER].z) / 2;

      // Nose-to-shoulder vertical distance (Y-only, for threshold calculation)
      const noseShoulderDistY = Math.abs(shoulderMidY - noseY);

      // Shoulder width
      const shoulderWidth = Math.abs(lm[LM.LEFT_SHOULDER].x - lm[LM.RIGHT_SHOULDER].x);

      totalNoseY += noseY;
      totalShoulderY += shoulderMidY;
      totalNoseZ += noseZ;
      totalShoulderZ += shoulderMidZ;
      totalNoseShoulderDistY += noseShoulderDistY;
      totalShoulderWidth += shoulderWidth;
      count++;
    }

    if (count > 0) {
      const avgNoseY = totalNoseY / count;
      const avgShoulderY = totalShoulderY / count;
      const avgNoseZ = totalNoseZ / count;
      const avgShoulderZ = totalShoulderZ / count;
      const avgDistY = totalNoseShoulderDistY / count;

      // 3D Euclidean distance for diagnostics
      const dy = avgShoulderY - avgNoseY;
      const dz = avgShoulderZ - avgNoseZ;
      const dist3D = Math.sqrt(dy * dy + dz * dz);

      this._calibrationData = {
        baselineNoseY: avgNoseY,
        baselineShoulderY: avgShoulderY,
        baselineNoseZ: avgNoseZ,
        baselineShoulderZ: avgShoulderZ,
        noseShoulderDistY: avgDistY,
        noseShoulderDist3D: dist3D,
        shoulderWidth: totalShoulderWidth / count,
        isCalibrated: true,
      };

      const cd = this._calibrationData;
      const jumpThresh = cd.noseShoulderDistY * 0.25;
      console.log(
        `%c[CALIBRATION] Complete! ${count}/${this.samples.length} valid samples\n` +
        `  baselineNoseY:     ${cd.baselineNoseY.toFixed(4)}\n` +
        `  baselineShoulderY: ${cd.baselineShoulderY.toFixed(4)}\n` +
        `  baselineNoseZ:     ${cd.baselineNoseZ.toFixed(4)}\n` +
        `  baselineShoulderZ: ${cd.baselineShoulderZ.toFixed(4)}\n` +
        `  noseShoulderDistY: ${cd.noseShoulderDistY.toFixed(4)} (Y-only reference)\n` +
        `  noseShoulderDist3D:${cd.noseShoulderDist3D.toFixed(4)} (3D reference)\n` +
        `  shoulderWidth:     ${cd.shoulderWidth.toFixed(4)}\n` +
        `  jumpThreshold:     ${jumpThresh.toFixed(4)} (25% of Y dist)\n` +
        `  halfThreshold:     ${(jumpThresh * 0.5).toFixed(4)} (launch trigger)`,
        'color: #00ff88; font-weight: bold'
      );
    }

    this._isCalibrating = false;
    this.samples = [];
  }

  reset(): void {
    this.samples = [];
    this._isCalibrating = false;
    this._calibrationData = {
      baselineNoseY: 0,
      baselineShoulderY: 0,
      baselineNoseZ: 0,
      baselineShoulderZ: 0,
      noseShoulderDistY: 0,
      noseShoulderDist3D: 0,
      shoulderWidth: 0,
      isCalibrated: false,
    };
  }
}
