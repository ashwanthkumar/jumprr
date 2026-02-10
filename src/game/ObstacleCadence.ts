import { CADENCE_REST_STEP, CADENCE_REST_MAX } from '../constants';

export class ObstacleCadence {
  private static readonly INTERVALS = [
    10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1,
    2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10,
  ];

  private currentIndex = 0;
  private timeSinceLastSpawn = 0;
  private _obstaclesSpawned = 0;
  private _cycleCount = 0;

  update(dt: number): 'spawn' | 'cycle_complete' | 'none' {
    this.timeSinceLastSpawn += dt;

    const interval = this.getCurrentInterval();
    if (this.timeSinceLastSpawn >= interval) {
      this.timeSinceLastSpawn -= interval;
      this._obstaclesSpawned++;
      this.currentIndex++;

      if (this.currentIndex >= ObstacleCadence.INTERVALS.length) {
        return 'cycle_complete';
      }
      return 'spawn';
    }

    return 'none';
  }

  getTimeUntilNextSpawn(): number {
    return Math.max(0, this.getCurrentInterval() - this.timeSinceLastSpawn);
  }

  getCurrentInterval(): number {
    if (this.currentIndex >= ObstacleCadence.INTERVALS.length) {
      return ObstacleCadence.INTERVALS[ObstacleCadence.INTERVALS.length - 1];
    }
    return ObstacleCadence.INTERVALS[this.currentIndex];
  }

  getRestDuration(): number {
    return Math.min(CADENCE_REST_STEP * (this._cycleCount + 1), CADENCE_REST_MAX);
  }

  get totalSpawned(): number {
    return this._obstaclesSpawned;
  }

  get cycleCount(): number {
    return this._cycleCount;
  }

  reset(): void {
    this.currentIndex = 0;
    this.timeSinceLastSpawn = 0;
    this._cycleCount++;
  }

  fullReset(): void {
    this.currentIndex = 0;
    this.timeSinceLastSpawn = 0;
    this._obstaclesSpawned = 0;
    this._cycleCount = 0;
  }
}
