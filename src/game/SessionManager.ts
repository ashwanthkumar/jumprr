import type { GameState } from './GameState';
import type { HealthSettings, SessionStats } from '../types';

export class SessionManager {
  private gameState: GameState;
  private elapsed = 0;
  private _isResting = false;
  private _restTimeRemaining = 0;
  private jumpCount = 0;
  private collisionCount = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  configure(_settings: HealthSettings): void {
    // No longer needs session duration / rest config — cadence drives rest
  }

  get isResting(): boolean {
    return this._isResting;
  }

  get restTimeRemaining(): number {
    return this._restTimeRemaining;
  }

  get elapsedTime(): number {
    return this.elapsed;
  }

  startRest(duration: number): void {
    this._isResting = true;
    this._restTimeRemaining = duration;
    this.gameState.emit('restStart');
  }

  update(dt: number): 'playing' | 'rest' {
    if (this._isResting) {
      this._restTimeRemaining -= dt;
      if (this._restTimeRemaining <= 0) {
        this._isResting = false;
        this.gameState.emit('restEnd');
        return 'playing';
      }
      return 'rest';
    }

    this.elapsed += dt;

    // Show elapsed time counting up (store in sessionTimeRemaining for HUD)
    this.gameState.setSessionTime(this.elapsed, 0);

    return 'playing';
  }

  skipRest(): void {
    this._isResting = false;
    this._restTimeRemaining = 0;
    this.gameState.emit('restEnd');
  }

  recordJump(): void {
    this.jumpCount++;
  }

  recordCollision(): void {
    this.collisionCount++;
  }

  getStats(totalObstacles: number): SessionStats {
    const state = this.gameState.state;
    const minutes = this.elapsed / 60;

    return {
      score: state.score,
      distance: Math.floor(state.distance),
      totalJumps: this.jumpCount,
      maxCombo: state.maxCombo,
      caloriesBurned: 0,
      sessionDuration: this.elapsed,
      avgJumpsPerMinute: minutes > 0 ? this.jumpCount / minutes : 0,
      obstaclesCleared: Math.max(0, totalObstacles - this.collisionCount),
      obstaclesMissed: this.collisionCount,
    };
  }

  reset(): void {
    this.elapsed = 0;
    this._isResting = false;
    this._restTimeRemaining = 0;
    this.jumpCount = 0;
    this.collisionCount = 0;
  }
}
