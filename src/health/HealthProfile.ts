import { AgeGroup, FitnessLevel, type HealthSettings } from '../types';
import { AGE_GROUP_DEFAULTS, FITNESS_MULTIPLIERS, AUTO_LAND_MS } from '../constants';

export class HealthProfile {
  private _settings: HealthSettings = {
    ageGroup: AgeGroup.YOUNG_ADULT,
    fitnessLevel: FitnessLevel.INTERMEDIATE,
    age: 25,
    weight: 70,
    sessionDuration: AGE_GROUP_DEFAULTS[AgeGroup.YOUNG_ADULT].sessionDuration,
    jumpTarget: AGE_GROUP_DEFAULTS[AgeGroup.YOUNG_ADULT].jumpTarget,
  };

  get settings(): Readonly<HealthSettings> {
    return this._settings;
  }

  setAge(age: number): void {
    this._settings.age = age;
    this._settings.ageGroup = this.ageToGroup(age);
    this.applyDefaults();
  }

  setAgeGroup(group: AgeGroup): void {
    this._settings.ageGroup = group;
    this.applyDefaults();
  }

  setFitnessLevel(level: FitnessLevel): void {
    this._settings.fitnessLevel = level;
    this.applyDefaults();
  }

  loadSettings(settings: HealthSettings): void {
    this._settings = { ...settings };
  }

  setWeight(weight: number): void {
    this._settings.weight = weight;
  }

  setSessionDuration(seconds: number): void {
    this._settings.sessionDuration = seconds;
  }

  setJumpTarget(target: number): void {
    this._settings.jumpTarget = target;
  }

  getAutoLandMs(): number {
    // Fitness-adjusted auto-land: beginners get more time, advanced get less
    const fitMult = FITNESS_MULTIPLIERS[this._settings.fitnessLevel];
    // Beginners (0.6x): ~600ms, Intermediate (1.0x): 500ms, Advanced (1.5x): ~400ms
    return Math.round(AUTO_LAND_MS / Math.sqrt(fitMult));
  }

  getSpeedFactor(): number {
    const ageDefault = AGE_GROUP_DEFAULTS[this._settings.ageGroup];
    return ageDefault.speedFactor;
  }

  getMaxHeartRate(): number {
    return 220 - this._settings.age;
  }

  getHeartRateZones(): { zone: string; min: number; max: number }[] {
    const maxHR = this.getMaxHeartRate();
    return [
      { zone: 'Warm-up', min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
      { zone: 'Fat Burn', min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
      { zone: 'Cardio', min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) },
      { zone: 'Peak', min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) },
    ];
  }

  private applyDefaults(): void {
    const defaults = AGE_GROUP_DEFAULTS[this._settings.ageGroup];
    const fitMult = FITNESS_MULTIPLIERS[this._settings.fitnessLevel];
    this._settings.sessionDuration = Math.round(defaults.sessionDuration * fitMult);
    this._settings.jumpTarget = Math.round(defaults.jumpTarget * fitMult);
  }

  private ageToGroup(age: number): AgeGroup {
    if (age < 13) return AgeGroup.CHILD;
    if (age < 18) return AgeGroup.TEEN;
    if (age < 36) return AgeGroup.YOUNG_ADULT;
    if (age < 56) return AgeGroup.MIDDLE_AGED;
    return AgeGroup.SENIOR;
  }
}
