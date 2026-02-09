import type { Landmark, PoseData } from '../types';
import { EMA_ALPHA } from '../constants';

export class PoseSmoothing {
  private previousLandmarks: Landmark[] | null = null;

  smooth(pose: PoseData): PoseData {
    if (!this.previousLandmarks) {
      this.previousLandmarks = pose.landmarks.map(l => ({ ...l }));
      return pose;
    }

    const smoothed: Landmark[] = pose.landmarks.map((lm, i) => {
      const prev = this.previousLandmarks![i];
      if (!prev) return lm;

      return {
        x: prev.x + EMA_ALPHA * (lm.x - prev.x),
        y: prev.y + EMA_ALPHA * (lm.y - prev.y),
        z: prev.z + EMA_ALPHA * (lm.z - prev.z),
        visibility: lm.visibility,
      };
    });

    this.previousLandmarks = smoothed.map(l => ({ ...l }));

    return {
      landmarks: smoothed,
      timestamp: pose.timestamp,
    };
  }

  reset(): void {
    this.previousLandmarks = null;
  }
}
