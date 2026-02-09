import { JUMP_HEIGHT, JUMP_DURATION, CHARACTER_BASE_Y } from '../constants';

export class JumpAnimator {
  private _isJumping = false;
  private _jumpTime = 0;
  private _currentY = CHARACTER_BASE_Y;

  get isJumping(): boolean {
    return this._isJumping;
  }

  get currentY(): number {
    return this._currentY;
  }

  startJump(): void {
    if (this._isJumping) return;
    this._isJumping = true;
    this._jumpTime = 0;
  }

  update(dt: number): void {
    if (!this._isJumping) {
      this._currentY = CHARACTER_BASE_Y;
      return;
    }

    this._jumpTime += dt;
    const t = this._jumpTime / JUMP_DURATION;

    if (t >= 1) {
      this._isJumping = false;
      this._jumpTime = 0;
      this._currentY = CHARACTER_BASE_Y;
      return;
    }

    // Parabolic arc: y = 4h * t * (1 - t)
    this._currentY = CHARACTER_BASE_Y + JUMP_HEIGHT * 4 * t * (1 - t);
  }

  reset(): void {
    this._isJumping = false;
    this._jumpTime = 0;
    this._currentY = CHARACTER_BASE_Y;
  }
}
