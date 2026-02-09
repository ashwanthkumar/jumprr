import {
  NARROWING_START_DISTANCE,
  NARROWING_INTERVAL_MIN,
  NARROWING_DURATION_SEGMENTS,
  TRACK_SEGMENT_LENGTH,
} from '../constants';

export interface NarrowingEvent {
  startDistance: number;
  targetLanes: number; // 2 or 1
  warningDistance: number; // 2 segments before
  endDistance: number;
}

export class LaneNarrower {
  private currentLanes = 3;
  private nextNarrowingDistance = NARROWING_START_DISTANCE;
  private activeEvent: NarrowingEvent | null = null;
  private narrowingInterval = NARROWING_INTERVAL_MIN;

  get activeLanes(): number {
    return this.currentLanes;
  }

  get currentEvent(): NarrowingEvent | null {
    return this.activeEvent;
  }

  update(distance: number): number {
    // Check if we should start a new narrowing event
    if (!this.activeEvent && distance >= this.nextNarrowingDistance && this.currentLanes > 1) {
      const warningDist = 2 * TRACK_SEGMENT_LENGTH;
      this.activeEvent = {
        startDistance: distance + warningDist,
        targetLanes: this.currentLanes - 1,
        warningDistance: distance,
        endDistance: distance + warningDist + NARROWING_DURATION_SEGMENTS * TRACK_SEGMENT_LENGTH,
      };
    }

    // Apply active narrowing
    if (this.activeEvent) {
      if (distance >= this.activeEvent.startDistance && this.currentLanes > this.activeEvent.targetLanes) {
        this.currentLanes = this.activeEvent.targetLanes;
      }

      if (distance >= this.activeEvent.endDistance) {
        // Restore lanes after narrowing period
        this.currentLanes = 3;
        this.activeEvent = null;
        this.nextNarrowingDistance = distance + this.narrowingInterval;
      }
    }

    return this.currentLanes;
  }

  setNarrowingFrequency(interval: number): void {
    this.narrowingInterval = interval;
  }

  reset(): void {
    this.currentLanes = 3;
    this.nextNarrowingDistance = NARROWING_START_DISTANCE;
    this.activeEvent = null;
    this.narrowingInterval = NARROWING_INTERVAL_MIN;
  }
}
