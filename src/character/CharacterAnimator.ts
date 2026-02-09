import type { PlayerCharacter } from './PlayerCharacter';
import type { JumpAnimator } from './JumpAnimator';
import type { LaneController } from './LaneController';
import type { PoseData } from '../types';
import { LM } from '../constants';

export class CharacterAnimator {
  private character: PlayerCharacter;
  private jumpAnimator: JumpAnimator;
  private laneController: LaneController;
  private runCycle = 0;
  private isRunning = true;

  constructor(
    character: PlayerCharacter,
    jumpAnimator: JumpAnimator,
    laneController: LaneController,
  ) {
    this.character = character;
    this.jumpAnimator = jumpAnimator;
    this.laneController = laneController;
  }

  setRunning(running: boolean): void {
    this.isRunning = running;
  }

  update(dt: number, speed: number, poseData: PoseData | null): void {
    // Game layer: position
    this.character.root.position.x = this.laneController.currentX;
    this.character.root.position.y = this.jumpAnimator.currentY;

    // Procedural run cycle
    if (this.isRunning && !this.jumpAnimator.isJumping) {
      this.runCycle += dt * speed * 0.5;
      const legSwing = Math.sin(this.runCycle) * 0.5;
      const armSwing = Math.sin(this.runCycle) * 0.4;

      this.character.leftUpperLeg.rotation.x = legSwing;
      this.character.rightUpperLeg.rotation.x = -legSwing;
      this.character.leftLowerLeg.rotation.x = Math.max(0, -Math.sin(this.runCycle - 0.5) * 0.6);
      this.character.rightLowerLeg.rotation.x = Math.max(0, Math.sin(this.runCycle - 0.5) * 0.6);

      // Arms swing opposite to legs (only if no pose data)
      if (!poseData) {
        this.character.leftUpperArm.rotation.x = -armSwing;
        this.character.rightUpperArm.rotation.x = armSwing;
      }
    } else if (this.jumpAnimator.isJumping) {
      // Tuck legs during jump
      this.character.leftUpperLeg.rotation.x = -0.3;
      this.character.rightUpperLeg.rotation.x = -0.3;
      this.character.leftLowerLeg.rotation.x = 0.6;
      this.character.rightLowerLeg.rotation.x = 0.6;
    }

    // Pose layer: upper body from webcam
    if (poseData && poseData.landmarks.length >= 33) {
      this.applyPoseLayer(poseData);
    }
  }

  private applyPoseLayer(pose: PoseData): void {
    const lm = pose.landmarks;

    // Torso lean (from shoulder midpoint vs hip midpoint)
    const shoulderMidX = (lm[LM.LEFT_SHOULDER].x + lm[LM.RIGHT_SHOULDER].x) / 2;
    const hipMidX = (lm[LM.LEFT_HIP].x + lm[LM.RIGHT_HIP].x) / 2;
    const shoulderMidY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
    const hipMidY = (lm[LM.LEFT_HIP].y + lm[LM.RIGHT_HIP].y) / 2;

    // Side lean
    const sideLean = (shoulderMidX - hipMidX) * 2;
    this.character.torso.rotation.z = this.clampRotation(sideLean, 0.4);

    // Forward/back lean
    const forwardLean = (shoulderMidY - hipMidY - 0.35) * 2;
    this.character.torso.rotation.x = this.clampRotation(forwardLean, 0.3);

    // Head tilt (from nose relative to shoulder midpoint)
    const noseX = lm[LM.NOSE].x;
    const headTilt = (noseX - shoulderMidX) * 3;
    this.character.head.rotation.z = this.clampRotation(headTilt, 0.3);

    // Left arm
    if (lm[LM.LEFT_SHOULDER].visibility > 0.5 && lm[LM.LEFT_ELBOW].visibility > 0.5) {
      const lShoulderToElbow = {
        x: lm[LM.LEFT_ELBOW].x - lm[LM.LEFT_SHOULDER].x,
        y: lm[LM.LEFT_ELBOW].y - lm[LM.LEFT_SHOULDER].y,
      };
      // Note: webcam Y is inverted (0=top)
      this.character.leftUpperArm.rotation.x = this.clampRotation(lShoulderToElbow.y * 3, 1.5);
      this.character.leftUpperArm.rotation.z = this.clampRotation(-lShoulderToElbow.x * 2, 1.2);
    }

    // Right arm
    if (lm[LM.RIGHT_SHOULDER].visibility > 0.5 && lm[LM.RIGHT_ELBOW].visibility > 0.5) {
      const rShoulderToElbow = {
        x: lm[LM.RIGHT_ELBOW].x - lm[LM.RIGHT_SHOULDER].x,
        y: lm[LM.RIGHT_ELBOW].y - lm[LM.RIGHT_SHOULDER].y,
      };
      this.character.rightUpperArm.rotation.x = this.clampRotation(rShoulderToElbow.y * 3, 1.5);
      this.character.rightUpperArm.rotation.z = this.clampRotation(-rShoulderToElbow.x * 2, 1.2);
    }

    // Lower arms
    if (lm[LM.LEFT_ELBOW].visibility > 0.5 && lm[LM.LEFT_WRIST].visibility > 0.5) {
      const elbowToWrist = lm[LM.LEFT_WRIST].y - lm[LM.LEFT_ELBOW].y;
      this.character.leftLowerArm.rotation.x = this.clampRotation(elbowToWrist * 3, 2.0);
    }

    if (lm[LM.RIGHT_ELBOW].visibility > 0.5 && lm[LM.RIGHT_WRIST].visibility > 0.5) {
      const elbowToWrist = lm[LM.RIGHT_WRIST].y - lm[LM.RIGHT_ELBOW].y;
      this.character.rightLowerArm.rotation.x = this.clampRotation(elbowToWrist * 3, 2.0);
    }
  }

  private clampRotation(value: number, max: number): number {
    return Math.max(-max, Math.min(max, value));
  }

  reset(): void {
    this.runCycle = 0;
    this.character.root.position.set(0, 0, 0);
    this.character.torso.rotation.set(0, 0, 0);
    this.character.head.rotation.set(0, 0, 0);
    this.character.leftUpperArm.rotation.set(0, 0, 0);
    this.character.rightUpperArm.rotation.set(0, 0, 0);
    this.character.leftLowerArm.rotation.set(0, 0, 0);
    this.character.rightLowerArm.rotation.set(0, 0, 0);
    this.character.leftUpperLeg.rotation.set(0, 0, 0);
    this.character.rightUpperLeg.rotation.set(0, 0, 0);
    this.character.leftLowerLeg.rotation.set(0, 0, 0);
    this.character.rightLowerLeg.rotation.set(0, 0, 0);
  }
}
