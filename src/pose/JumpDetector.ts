import { JumpState, JumpDirection, type JumpEvent, type PoseData, type CalibrationData } from '../types';
import { LM, JUMP_LAUNCH_THRESHOLD, LATERAL_THRESHOLD, JUMP_COOLDOWN_MS } from '../constants';

export class JumpDetector {
  private state = JumpState.IDLE;
  private launchStartTime = 0;
  private lastJumpTime = 0;
  private pendingDirection = JumpDirection.STRAIGHT;

  get currentState(): JumpState {
    return this.state;
  }

  detect(pose: PoseData, calibration: CalibrationData): JumpEvent | null {
    if (!calibration.isCalibrated) return null;

    const lm = pose.landmarks;
    if (lm.length < 33) return null;

    const now = pose.timestamp;

    // Get current foot position (lowest foot = highest Y in webcam coords)
    const leftFootY = lm[LM.LEFT_FOOT].y;
    const rightFootY = lm[LM.RIGHT_FOOT].y;
    const currentFootY = Math.max(leftFootY, rightFootY);

    // How far above baseline (in webcam coords: lower Y = higher position)
    // So baseline - current = upward displacement
    const upwardDisplacement = calibration.baselineFootY - currentFootY;
    const jumpThreshold = calibration.torsoHeight * JUMP_LAUNCH_THRESHOLD;

    // Lateral detection
    const shoulderMidX = (lm[LM.LEFT_SHOULDER].x + lm[LM.RIGHT_SHOULDER].x) / 2;
    const hipMidX = (lm[LM.LEFT_HIP].x + lm[LM.RIGHT_HIP].x) / 2;
    const comX = (shoulderMidX + hipMidX) / 2;
    const lateralOffset = comX - calibration.hipCenterX;
    const lateralThreshold = calibration.shoulderWidth * LATERAL_THRESHOLD;

    switch (this.state) {
      case JumpState.IDLE:
        if (upwardDisplacement > jumpThreshold * 0.5) {
          this.state = JumpState.LAUNCHING;
          this.launchStartTime = now;
        }
        break;

      case JumpState.LAUNCHING:
        if (upwardDisplacement > jumpThreshold) {
          this.state = JumpState.AIRBORNE;
          // Detect direction
          // Webcam is mirrored: left in image = right in reality
          if (Math.abs(lateralOffset) > lateralThreshold) {
            // Mirrored: positive X offset in webcam = player moved LEFT in reality
            this.pendingDirection = lateralOffset > 0
              ? JumpDirection.LEFT
              : JumpDirection.RIGHT;
          } else {
            this.pendingDirection = JumpDirection.STRAIGHT;
          }
        } else if (now - this.launchStartTime > 500) {
          // Took too long, false positive
          this.state = JumpState.IDLE;
        }
        break;

      case JumpState.AIRBORNE:
        if (upwardDisplacement < jumpThreshold * 0.3) {
          this.state = JumpState.LANDING;
        }
        break;

      case JumpState.LANDING: {
        // Emit jump event
        const event: JumpEvent = {
          direction: this.pendingDirection,
          timestamp: now,
          verticalVelocity: upwardDisplacement,
        };

        this.state = JumpState.COOLDOWN;
        this.lastJumpTime = now;
        return event;
      }

      case JumpState.COOLDOWN:
        if (now - this.lastJumpTime > JUMP_COOLDOWN_MS) {
          this.state = JumpState.IDLE;
        }
        break;
    }

    return null;
  }

  reset(): void {
    this.state = JumpState.IDLE;
    this.launchStartTime = 0;
    this.lastJumpTime = 0;
    this.pendingDirection = JumpDirection.STRAIGHT;
  }
}
