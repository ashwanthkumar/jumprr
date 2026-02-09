import { POINTS_PER_METER, JUMP_BONUS, COMBO_MULTIPLIER_STEP, MAX_COMBO_MULTIPLIER, COLLISION_SCORE_PENALTY } from '../constants';
import type { GameState } from './GameState';

export class ScoreSystem {
  private gameState: GameState;
  private distanceScore = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  addDistanceScore(distanceDelta: number): void {
    this.distanceScore += distanceDelta * POINTS_PER_METER;
    this.gameState.setScore(this.distanceScore + this.gameState.state.score - Math.floor(this.distanceScore - distanceDelta * POINTS_PER_METER));
  }

  onJump(): void {
    const combo = this.gameState.state.combo + 1;
    this.gameState.setCombo(combo);
    const multiplier = Math.min(1 + combo * COMBO_MULTIPLIER_STEP, MAX_COMBO_MULTIPLIER);
    this.gameState.addScore(Math.floor(JUMP_BONUS * multiplier));
    this.gameState.incrementJumps();
  }

  onCollision(): void {
    this.gameState.addScore(-COLLISION_SCORE_PENALTY);
    this.gameState.setCombo(0);
  }

  update(distanceDelta: number): void {
    this.gameState.addScore(Math.floor(distanceDelta * POINTS_PER_METER));
  }

  reset(): void {
    this.distanceScore = 0;
  }
}
