import type { GameState } from './GameState';
import type { HealthSettings, SessionStats } from '../types';
import { REST_SET_DURATION_BASE, REST_COUNTDOWN_BASE, FITNESS_MULTIPLIERS, AGE_GROUP_DEFAULTS } from '../constants';

export class SessionManager {
  private gameState: GameState;
  private sessionDuration = 300; // seconds
  private elapsed = 0;
  private restRatio = 1.5;
  private playDurationSinceRest = 0;
  private setDuration = REST_SET_DURATION_BASE;
  private restDuration = REST_COUNTDOWN_BASE;
  private _isResting = false;
  private _restTimeRemaining = 0;
  private jumpCount = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  configure(settings: HealthSettings): void {
    this.sessionDuration = settings.sessionDuration;
    const defaults = AGE_GROUP_DEFAULTS[settings.ageGroup];
    this.restRatio = defaults.restRatio;
    const fitMultiplier = FITNESS_MULTIPLIERS[settings.fitnessLevel];

    // Adjust set duration based on fitness
    this.setDuration = REST_SET_DURATION_BASE * fitMultiplier;
    this.restDuration = this.setDuration / this.restRatio;
  }

  get isResting(): boolean {
    return this._isResting;
  }

  get restTimeRemaining(): number {
    return this._restTimeRemaining;
  }

  get timeRemaining(): number {
    return Math.max(0, this.sessionDuration - this.elapsed);
  }

  get totalDuration(): number {
    return this.sessionDuration;
  }

  update(dt: number): 'playing' | 'rest' | 'ended' {
    if (this._isResting) {
      this._restTimeRemaining -= dt;
      if (this._restTimeRemaining <= 0) {
        this._isResting = false;
        this.playDurationSinceRest = 0;
        this.gameState.emit('restEnd');
        return 'playing';
      }
      return 'rest';
    }

    this.elapsed += dt;
    this.playDurationSinceRest += dt;

    this.gameState.setSessionTime(this.timeRemaining, this.sessionDuration);

    if (this.elapsed >= this.sessionDuration) {
      this.gameState.emit('sessionEnd');
      return 'ended';
    }

    // Check if rest is needed
    if (this.playDurationSinceRest >= this.setDuration) {
      this._isResting = true;
      this._restTimeRemaining = this.restDuration;
      this.gameState.emit('restStart');
      return 'rest';
    }

    return 'playing';
  }

  skipRest(): void {
    this._isResting = false;
    this._restTimeRemaining = 0;
    this.playDurationSinceRest = 0;
    this.gameState.emit('restEnd');
  }

  recordJump(): void {
    this.jumpCount++;
  }

  getStats(): SessionStats {
    const state = this.gameState.state;
    const minutes = this.elapsed / 60;

    return {
      score: state.score,
      distance: Math.floor(state.distance),
      totalJumps: this.jumpCount,
      maxCombo: state.maxCombo,
      caloriesBurned: 0, // Will be set by CalorieEstimator
      sessionDuration: this.elapsed,
      avgJumpsPerMinute: minutes > 0 ? this.jumpCount / minutes : 0,
    };
  }

  reset(): void {
    this.elapsed = 0;
    this.playDurationSinceRest = 0;
    this._isResting = false;
    this._restTimeRemaining = 0;
    this.jumpCount = 0;
  }
}
