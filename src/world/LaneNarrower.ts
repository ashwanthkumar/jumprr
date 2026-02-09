export interface NarrowingEvent {
  startDistance: number;
  targetLanes: number;
  warningDistance: number;
  endDistance: number;
}

export class LaneNarrower {
  get activeLanes(): number {
    return 1;
  }

  get currentEvent(): NarrowingEvent | null {
    return null;
  }

  update(_distance: number): number {
    return 1;
  }

  setNarrowingFrequency(_interval: number): void {
    // Disabled - single lane
  }

  reset(): void {
    // Nothing to reset
  }
}
