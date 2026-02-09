import type { PoseData, CalibrationData } from '../types';
import { LM, CALIBRATION_DURATION } from '../constants';

export class BaselineCalibrator {
  private samples: PoseData[] = [];
  private startTime = 0;
  private _isCalibrating = false;
  private _calibrationData: CalibrationData = {
    baselineFootY: 0,
    torsoHeight: 0,
    shoulderWidth: 0,
    hipCenterX: 0,
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

    let totalFootY = 0;
    let totalTorsoHeight = 0;
    let totalShoulderWidth = 0;
    let totalHipX = 0;
    let count = 0;

    for (const sample of this.samples) {
      const lm = sample.landmarks;
      if (lm.length < 33) continue;

      // Lowest foot Y (in webcam coordinates, higher Y = lower position)
      const leftFootY = lm[LM.LEFT_FOOT].y;
      const rightFootY = lm[LM.RIGHT_FOOT].y;
      const footY = Math.max(leftFootY, rightFootY);

      // Torso height (shoulder to hip)
      const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
      const hipMidY = (lm[LM.LEFT_HIP].y + lm[LM.RIGHT_HIP].y) / 2;
      const torsoHeight = Math.abs(hipMidY - shoulderMidY);

      // Shoulder width
      const shoulderWidth = Math.abs(lm[LM.LEFT_SHOULDER].x - lm[LM.RIGHT_SHOULDER].x);

      // Hip center X
      const hipCenterX = (lm[LM.LEFT_HIP].x + lm[LM.RIGHT_HIP].x) / 2;

      totalFootY += footY;
      totalTorsoHeight += torsoHeight;
      totalShoulderWidth += shoulderWidth;
      totalHipX += hipCenterX;
      count++;
    }

    if (count > 0) {
      this._calibrationData = {
        baselineFootY: totalFootY / count,
        torsoHeight: totalTorsoHeight / count,
        shoulderWidth: totalShoulderWidth / count,
        hipCenterX: totalHipX / count,
        isCalibrated: true,
      };
    }

    this._isCalibrating = false;
    this.samples = [];
  }

  reset(): void {
    this.samples = [];
    this._isCalibrating = false;
    this._calibrationData = {
      baselineFootY: 0,
      torsoHeight: 0,
      shoulderWidth: 0,
      hipCenterX: 0,
      isCalibrated: false,
    };
  }
}
