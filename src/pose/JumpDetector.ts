import { JumpState, type JumpEvent, type PoseData, type CalibrationData } from '../types';
import { LM, JUMP_LAUNCH_THRESHOLD, AUTO_LAND_MS, SHOULDER_CONFIRM_RATIO, Z_LEAN_REJECTION_RATIO } from '../constants';

// Throttle logs to avoid flooding console
let lastLogTime = 0;
const LOG_INTERVAL_MS = 200;

export class JumpDetector {
  private state = JumpState.IDLE;
  private launchStartTime = 0;
  private cooldownStartTime = 0;

  get currentState(): JumpState {
    return this.state;
  }

  get cooldownRemaining(): number {
    if (this.state !== JumpState.COOLDOWN) return 0;
    return Math.max(0, AUTO_LAND_MS - (performance.now() - this.cooldownStartTime));
  }

  detect(pose: PoseData, calibration: CalibrationData): JumpEvent | null {
    if (!calibration.isCalibrated) return null;

    const lm = pose.landmarks;
    if (lm.length < 33) return null;

    const now = pose.timestamp;

    // --- Head/upper-body vertical tracking ---
    const noseY = lm[LM.NOSE].y;
    const noseVis = lm[LM.NOSE].visibility;
    const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
    const shoulderVis = Math.min(lm[LM.LEFT_SHOULDER].visibility, lm[LM.RIGHT_SHOULDER].visibility);

    // Y displacement (positive = moving up in webcam coords)
    const noseDisp = calibration.baselineNoseY - noseY;
    const shoulderDisp = calibration.baselineShoulderY - shoulderMidY;

    // Z displacement (depth change from baseline)
    const shoulderMidZ = (lm[LM.LEFT_SHOULDER].z + lm[LM.RIGHT_SHOULDER].z) / 2;
    const zDisp = calibration.baselineShoulderZ - shoulderMidZ;

    // Jump threshold based on nose-to-shoulder Y distance
    const jumpThreshold = calibration.noseShoulderDistY * JUMP_LAUNCH_THRESHOLD;

    const primaryDisp = shoulderDisp;
    const noseConfirmed = noseDisp > jumpThreshold * SHOULDER_CONFIRM_RATIO;

    // Z lean rejection: if Z movement dominates Y movement, it's a lean not a jump
    const isLean = Math.abs(primaryDisp) > 0.001 &&
      Math.abs(zDisp) / Math.abs(primaryDisp) > Z_LEAN_REJECTION_RATIO;

    const prevState = this.state;

    // Throttled continuous logging
    const shouldLog = now - lastLogTime > LOG_INTERVAL_MS;
    if (shouldLog) {
      lastLogTime = now;
      console.log(
        `[JUMP] state=${this.state} | noseY=${noseY.toFixed(4)}(vis:${noseVis.toFixed(2)}) shoulderY=${shoulderMidY.toFixed(4)}(vis:${shoulderVis.toFixed(2)}) ` +
        `| noseDisp=${noseDisp.toFixed(4)} shoulderDisp=${shoulderDisp.toFixed(4)} zDisp=${zDisp.toFixed(4)} ` +
        `| thresh=${jumpThreshold.toFixed(4)} (half=${(jumpThreshold * 0.5).toFixed(4)}) ` +
        `| noseConfirm=${noseConfirmed} lean=${isLean}`
      );
    }

    switch (this.state) {
      case JumpState.IDLE:
        // Launch trigger: shoulders rising past half-threshold
        if (primaryDisp > jumpThreshold * 0.5 && noseConfirmed && !isLean) {
          this.state = JumpState.LAUNCHING;
          this.launchStartTime = now;
          console.log(
            `%c[JUMP] IDLE -> LAUNCHING | shoulderDisp=${shoulderDisp.toFixed(4)} > half-thresh=${(jumpThreshold * 0.5).toFixed(4)}`,
            'color: #ff8800; font-weight: bold'
          );
        }
        break;

      case JumpState.LAUNCHING:
        if (isLean) {
          // Lean detected during launch - abort
          this.state = JumpState.IDLE;
          console.log(
            `%c[JUMP] LAUNCHING -> IDLE (lean rejected) | zDisp=${zDisp.toFixed(4)} yDisp=${primaryDisp.toFixed(4)}`,
            'color: #ff4444; font-weight: bold'
          );
        } else if (primaryDisp > jumpThreshold && noseConfirmed) {
          // Full threshold crossed - fire event immediately and enter cooldown
          const event: JumpEvent = {
            timestamp: now,
            verticalVelocity: primaryDisp,
          };

          this.state = JumpState.COOLDOWN;
          this.cooldownStartTime = performance.now();
          console.log(
            `%c[JUMP] LAUNCHING -> COOLDOWN | JUMP EVENT FIRED! shoulderDisp=${shoulderDisp.toFixed(4)}`,
            'color: #ff00ff; font-weight: bold; font-size: 14px'
          );
          return event;
        } else if (now - this.launchStartTime > 500) {
          this.state = JumpState.IDLE;
          console.log(
            `%c[JUMP] LAUNCHING -> IDLE (timeout 500ms)`,
            'color: #ff4444; font-weight: bold'
          );
        }
        break;

      case JumpState.COOLDOWN:
        // Auto-land: return to IDLE after AUTO_LAND_MS
        if (performance.now() - this.cooldownStartTime > AUTO_LAND_MS) {
          this.state = JumpState.IDLE;
          console.log(
            `%c[JUMP] COOLDOWN -> IDLE (${AUTO_LAND_MS}ms auto-land)`,
            'color: #888; font-weight: bold'
          );
        }
        break;
    }

    if (this.state !== prevState && shouldLog) {
      console.log(`[JUMP] State changed: ${prevState} -> ${this.state}`);
    }

    return null;
  }

  reset(): void {
    this.state = JumpState.IDLE;
    this.launchStartTime = 0;
    this.cooldownStartTime = 0;
    console.log('[JUMP] Detector reset');
  }
}
