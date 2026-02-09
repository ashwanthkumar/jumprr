import {
  BASE_SPEED, MAX_SPEED, SPEED_LOG_FACTOR,
  NARROWING_INTERVAL_MIN,
} from '../constants';

export class DifficultyManager {
  private speedFactor = 1.0;
  private _currentSpeed = BASE_SPEED;

  get currentSpeed(): number {
    return this._currentSpeed;
  }

  setSpeedFactor(factor: number): void {
    this.speedFactor = factor;
  }

  update(distance: number): number {
    // Logarithmic speed curve
    const logSpeed = BASE_SPEED + SPEED_LOG_FACTOR * Math.log(1 + distance / 100);
    this._currentSpeed = Math.min(logSpeed * this.speedFactor, MAX_SPEED * this.speedFactor);
    return this._currentSpeed;
  }

  getNarrowingInterval(distance: number): number {
    // Narrowing gets more frequent as distance increases
    const factor = Math.max(0.5, 1 - distance / 5000);
    return NARROWING_INTERVAL_MIN * factor + NARROWING_INTERVAL_MIN;
  }

  reset(): void {
    this._currentSpeed = BASE_SPEED;
  }
}
