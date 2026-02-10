import type { PoseData, CalibrationData } from '../types';
import { LM, CALIBRATION_DURATION, PRACTICE_JUMP_COUNT, PRACTICE_DETECTION_RATIO } from '../constants';

export class BaselineCalibrator {
  private samples: PoseData[] = [];
  private startTime = 0;
  private _isCalibrating = false;
  private _isPracticing = false;
  private practiceJumps: { peakDisp: number; durationMs: number }[] = [];
  private practiceTracking = false;
  private practiceJumpStart = 0;
  private practicePeakDisp = 0;

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

  get isPracticing(): boolean {
    return this._isPracticing;
  }

  get practiceJumpCount(): number {
    return this.practiceJumps.length;
  }

  get calibrationData(): CalibrationData {
    return this._calibrationData;
  }

  get progress(): number {
    if (!this._isCalibrating) return this._calibrationData.isCalibrated || this._isPracticing ? 1 : 0;
    const elapsed = (performance.now() / 1000) - this.startTime;
    return Math.min(elapsed / CALIBRATION_DURATION, 1);
  }

  startCalibration(): void {
    this.samples = [];
    this.startTime = performance.now() / 1000;
    this._isCalibrating = true;
    this._isPracticing = false;
    this.practiceJumps = [];
    this.practiceTracking = false;
    this._calibrationData.isCalibrated = false;
    this._calibrationData.adaptedJumpThreshold = undefined;
    this._calibrationData.adaptedLandMs = undefined;
  }

  addSample(pose: PoseData): boolean {
    if (!this._isCalibrating) return false;

    this.samples.push(pose);

    const elapsed = (performance.now() / 1000) - this.startTime;
    if (elapsed >= CALIBRATION_DURATION) {
      this.finalize();
      return true;
    }
    return false;
  }

  addPracticeSample(pose: PoseData): boolean {
    if (!this._isPracticing) return false;

    const lm = pose.landmarks;
    if (lm.length < 33) return false;
    if (lm[LM.NOSE].visibility < 0.5) return false;
    if (lm[LM.LEFT_SHOULDER].visibility < 0.5 || lm[LM.RIGHT_SHOULDER].visibility < 0.5) return false;

    const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
    const shoulderDisp = this._calibrationData.baselineShoulderY - shoulderMidY;
    const practiceThreshold = this._calibrationData.noseShoulderDistY * PRACTICE_DETECTION_RATIO;

    if (!this.practiceTracking) {
      // Detect start of a practice jump (shoulder rising past sensitive threshold)
      if (shoulderDisp > practiceThreshold) {
        this.practiceTracking = true;
        this.practiceJumpStart = performance.now();
        this.practicePeakDisp = shoulderDisp;
      }
    } else {
      // Track peak displacement
      if (shoulderDisp > this.practicePeakDisp) {
        this.practicePeakDisp = shoulderDisp;
      }

      // Detect landing (shoulder returned below threshold)
      if (shoulderDisp < practiceThreshold * 0.5) {
        const durationMs = performance.now() - this.practiceJumpStart;
        this.practiceJumps.push({ peakDisp: this.practicePeakDisp, durationMs });
        this.practiceTracking = false;

        console.log(
          `%c[PRACTICE] Jump ${this.practiceJumps.length}/${PRACTICE_JUMP_COUNT} | peak=${this.practicePeakDisp.toFixed(4)} dur=${durationMs.toFixed(0)}ms`,
          'color: #00ff88; font-weight: bold'
        );

        if (this.practiceJumps.length >= PRACTICE_JUMP_COUNT) {
          this.finalizePractice();
          return true;
        }
      }
    }

    return false;
  }

  private finalizePractice(): void {
    const minPeak = Math.min(...this.practiceJumps.map(j => j.peakDisp));
    const avgDuration = this.practiceJumps.reduce((s, j) => s + j.durationMs, 0) / this.practiceJumps.length;

    // Set adapted threshold: 50% of the smallest peak displacement (as ratio of noseShoulderDistY)
    this._calibrationData.adaptedJumpThreshold = (minPeak / this._calibrationData.noseShoulderDistY) * 0.5;
    this._calibrationData.adaptedLandMs = avgDuration * 0.9;
    this._calibrationData.isCalibrated = true;
    this._isPracticing = false;

    console.log(
      `%c[PRACTICE] Complete! adaptedThreshold=${this._calibrationData.adaptedJumpThreshold.toFixed(4)} adaptedLandMs=${this._calibrationData.adaptedLandMs.toFixed(0)}`,
      'color: #00ff88; font-weight: bold; font-size: 14px'
    );
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

      if (lm[LM.NOSE].visibility < 0.5) continue;
      if (lm[LM.LEFT_SHOULDER].visibility < 0.5 || lm[LM.RIGHT_SHOULDER].visibility < 0.5) continue;

      const noseY = lm[LM.NOSE].y;
      const noseZ = lm[LM.NOSE].z;
      const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
      const shoulderMidZ = (lm[LM.LEFT_SHOULDER].z + lm[LM.RIGHT_SHOULDER].z) / 2;

      const noseShoulderDistY = Math.abs(shoulderMidY - noseY);
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
        isCalibrated: false, // Not yet — practice phase first
      };

      const cd = this._calibrationData;
      const jumpThresh = cd.noseShoulderDistY * 0.25;
      console.log(
        `%c[CALIBRATION] Standing phase complete! ${count}/${this.samples.length} valid samples\n` +
        `  baselineNoseY:     ${cd.baselineNoseY.toFixed(4)}\n` +
        `  baselineShoulderY: ${cd.baselineShoulderY.toFixed(4)}\n` +
        `  noseShoulderDistY: ${cd.noseShoulderDistY.toFixed(4)}\n` +
        `  jumpThreshold:     ${jumpThresh.toFixed(4)} (25% of Y dist)`,
        'color: #00ff88; font-weight: bold'
      );
    }

    this._isCalibrating = false;
    this._isPracticing = true;
    this.practiceJumps = [];
    this.practiceTracking = false;
    this.samples = [];
  }

  reset(): void {
    this.samples = [];
    this._isCalibrating = false;
    this._isPracticing = false;
    this.practiceJumps = [];
    this.practiceTracking = false;
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
