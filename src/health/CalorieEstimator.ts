import { MET_JUMPING } from '../constants';

export class CalorieEstimator {
  /**
   * MET-based calorie estimation
   * Calories = MET × weight(kg) × duration(hours)
   */
  estimate(weightKg: number, durationSeconds: number, jumpCount: number): number {
    const hours = durationSeconds / 3600;

    // Adjust MET based on jump intensity
    const jumpsPerMinute = jumpCount / (durationSeconds / 60);
    const intensityFactor = Math.min(1 + jumpsPerMinute / 20, 1.5);

    const calories = MET_JUMPING * intensityFactor * weightKg * hours;
    return Math.round(calories * 10) / 10;
  }
}
