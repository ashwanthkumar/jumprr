import { GameScreen, Lane, type GameStateData, type GameEventType, type GameEventCallback } from '../types';
import { BASE_SPEED } from '../constants';

export class GameState {
  private listeners = new Map<GameEventType, Set<GameEventCallback>>();
  private data: GameStateData = {
    screen: GameScreen.WELCOME,
    score: 0,
    distance: 0,
    speed: BASE_SPEED,
    combo: 0,
    maxCombo: 0,
    jumpCount: 0,
    currentLane: Lane.CENTER,
    activeLanes: 3,
    sessionTimeRemaining: 0,
    sessionDuration: 0,
    isStumbling: false,
    isPaused: false,
  };

  get state(): Readonly<GameStateData> {
    return this.data;
  }

  on(event: GameEventType, callback: GameEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: GameEventType, callback: GameEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: GameEventType, data?: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  setScreen(screen: GameScreen): void {
    this.data.screen = screen;
    this.emit('screenChange', screen);
  }

  setScore(score: number): void {
    this.data.score = Math.max(0, Math.floor(score));
    this.emit('scoreChange', this.data.score);
  }

  addScore(points: number): void {
    this.setScore(this.data.score + points);
  }

  setDistance(distance: number): void {
    this.data.distance = distance;
  }

  setSpeed(speed: number): void {
    this.data.speed = speed;
    this.emit('speedChange', speed);
  }

  setCombo(combo: number): void {
    this.data.combo = combo;
    if (combo > this.data.maxCombo) {
      this.data.maxCombo = combo;
    }
    this.emit('comboChange', combo);
  }

  incrementJumps(): void {
    this.data.jumpCount++;
  }

  setLane(lane: Lane): void {
    this.data.currentLane = lane;
    this.emit('laneChange', lane);
  }

  setActiveLanes(count: number): void {
    this.data.activeLanes = count;
  }

  setSessionTime(remaining: number, total: number): void {
    this.data.sessionTimeRemaining = remaining;
    this.data.sessionDuration = total;
  }

  setStumbling(stumbling: boolean): void {
    this.data.isStumbling = stumbling;
    if (stumbling) this.emit('stumble');
  }

  setPaused(paused: boolean): void {
    this.data.isPaused = paused;
  }

  reset(): void {
    this.data.score = 0;
    this.data.distance = 0;
    this.data.speed = BASE_SPEED;
    this.data.combo = 0;
    this.data.maxCombo = 0;
    this.data.jumpCount = 0;
    this.data.currentLane = Lane.CENTER;
    this.data.activeLanes = 3;
    this.data.isStumbling = false;
    this.data.isPaused = false;
  }
}
