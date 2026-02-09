import { Lane } from '../types';
import { LANE_WIDTH, LANE_SWITCH_SPEED } from '../constants';

export class LaneController {
  private _currentLane: Lane = Lane.CENTER;
  private _targetX = 0;
  private _currentX = 0;
  private _activeLanes = 3;

  get currentLane(): Lane {
    return this._currentLane;
  }

  get currentX(): number {
    return this._currentX;
  }

  get isMoving(): boolean {
    return Math.abs(this._currentX - this._targetX) > 0.01;
  }

  setActiveLanes(count: number): void {
    this._activeLanes = count;
  }

  switchLane(direction: 'left' | 'right'): boolean {
    const newLane = this._currentLane + (direction === 'left' ? -1 : 1);
    if (!this.isLaneValid(newLane as Lane)) return false;
    this._currentLane = newLane as Lane;
    this._targetX = this._currentLane * LANE_WIDTH;
    return true;
  }

  setLane(lane: Lane): void {
    if (this.isLaneValid(lane)) {
      this._currentLane = lane;
      this._targetX = lane * LANE_WIDTH;
    }
  }

  forcePosition(lane: Lane): void {
    this._currentLane = lane;
    this._targetX = lane * LANE_WIDTH;
    this._currentX = this._targetX;
  }

  update(dt: number): void {
    const diff = this._targetX - this._currentX;
    if (Math.abs(diff) < 0.01) {
      this._currentX = this._targetX;
      return;
    }
    const step = LANE_SWITCH_SPEED * dt;
    if (Math.abs(diff) <= step) {
      this._currentX = this._targetX;
    } else {
      this._currentX += Math.sign(diff) * step;
    }
  }

  private isLaneValid(lane: Lane): boolean {
    if (this._activeLanes === 3) {
      return lane >= Lane.LEFT && lane <= Lane.RIGHT;
    }
    if (this._activeLanes === 2) {
      return lane >= Lane.LEFT && lane <= Lane.CENTER;
    }
    return lane === Lane.CENTER;
  }

  reset(): void {
    this._currentLane = Lane.CENTER;
    this._targetX = 0;
    this._currentX = 0;
    this._activeLanes = 3;
  }
}
