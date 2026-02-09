export class Clock {
  private lastTime = 0;
  private _deltaTime = 0;
  private _elapsedTime = 0;
  private _isPaused = false;
  private _frameCount = 0;

  get deltaTime(): number {
    return this._deltaTime;
  }

  get elapsedTime(): number {
    return this._elapsedTime;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get frameCount(): number {
    return this._frameCount;
  }

  start(): void {
    this.lastTime = performance.now() / 1000;
    this._elapsedTime = 0;
    this._frameCount = 0;
    this._isPaused = false;
  }

  tick(): number {
    const now = performance.now() / 1000;
    if (this._isPaused) {
      this.lastTime = now;
      this._deltaTime = 0;
      return 0;
    }
    this._deltaTime = Math.min(now - this.lastTime, 0.1); // cap at 100ms
    this.lastTime = now;
    this._elapsedTime += this._deltaTime;
    this._frameCount++;
    return this._deltaTime;
  }

  pause(): void {
    this._isPaused = true;
  }

  resume(): void {
    this._isPaused = false;
    this.lastTime = performance.now() / 1000;
  }

  reset(): void {
    this.lastTime = performance.now() / 1000;
    this._deltaTime = 0;
    this._elapsedTime = 0;
    this._frameCount = 0;
  }
}
