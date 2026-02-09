import type { SessionStats, HealthSettings } from '../types';
import type { HealthProfile } from './HealthProfile';

export interface Recommendation {
  title: string;
  text: string;
}

export class RecommendationEngine {
  generate(stats: SessionStats, profile: HealthProfile): Recommendation[] {
    const recs: Recommendation[] = [];
    const settings = profile.settings;
    const hrZones = profile.getHeartRateZones();

    // Jump performance
    const jumpTarget = settings.jumpTarget;
    if (stats.totalJumps >= jumpTarget) {
      recs.push({
        title: 'Jump Target Met!',
        text: `You hit ${stats.totalJumps} jumps, exceeding your target of ${jumpTarget}. Consider increasing your target next session.`,
      });
    } else {
      const pct = Math.round((stats.totalJumps / jumpTarget) * 100);
      recs.push({
        title: 'Jump Progress',
        text: `You completed ${stats.totalJumps} of ${jumpTarget} target jumps (${pct}%). Keep at it!`,
      });
    }

    // Weekly frequency
    recs.push({
      title: 'Weekly Goal',
      text: `For optimal cardiovascular health, aim for 3-5 sessions per week. Each session of jumping helps strengthen your heart and bones.`,
    });

    // Heart rate zones
    const cardioZone = hrZones.find(z => z.zone === 'Cardio');
    if (cardioZone) {
      recs.push({
        title: 'Heart Rate Target',
        text: `Your estimated cardio zone is ${cardioZone.min}-${cardioZone.max} BPM. Try to maintain this range during play for maximum benefit.`,
      });
    }

    // Rest advice
    if (stats.avgJumpsPerMinute > 15) {
      recs.push({
        title: 'Pace Yourself',
        text: `You averaged ${stats.avgJumpsPerMinute.toFixed(1)} jumps/min. Remember to breathe steadily and take rest periods when offered.`,
      });
    }

    // Calorie feedback
    if (stats.caloriesBurned > 0) {
      recs.push({
        title: 'Energy Burned',
        text: `You burned approximately ${stats.caloriesBurned.toFixed(0)} calories. That's equivalent to ${(stats.caloriesBurned / 50).toFixed(1)} minutes of brisk walking!`,
      });
    }

    return recs;
  }
}
