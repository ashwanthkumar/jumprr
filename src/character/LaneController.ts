import { Lane } from '../types';

export class LaneController {
  get currentLane(): Lane {
    return Lane.CENTER;
  }

  get currentX(): number {
    return 0;
  }

  get isMoving(): boolean {
    return false;
  }

  setActiveLanes(_count: number): void {
    // Single lane only
  }

  update(_dt: number): void {
    // No lane switching
  }

  forcePosition(_lane: Lane): void {
    // Always center
  }

  reset(): void {
    // Nothing to reset
  }
}
