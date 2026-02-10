import type * as THREE from 'three';

export enum GameScreen {
  WELCOME = 'welcome',
  SETUP = 'setup',
  CALIBRATION = 'calibration',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  PAUSED = 'paused',
  REST = 'rest',
  RESULTS = 'results',
  DIAGNOSTIC = 'diagnostic',
}

export enum JumpState {
  IDLE = 'idle',
  LAUNCHING = 'launching',
  COOLDOWN = 'cooldown',
}

export enum JumpDirection {
  UP = 'up',
}

export enum Lane {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1,
}

export enum ObstacleType {
  BARRIER = 'barrier',
  WALL = 'wall',
}

export enum AgeGroup {
  CHILD = 'child',
  TEEN = 'teen',
  YOUNG_ADULT = 'young_adult',
  MIDDLE_AGED = 'middle_aged',
  SENIOR = 'senior',
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export interface JumpEvent {
  timestamp: number;
  verticalVelocity: number;
}

export interface AgeGroupDefaults {
  sessionDuration: number; // seconds
  jumpTarget: number;
  restRatio: number; // play:rest ratio denominator (e.g., 2 means 1:2)
  speedFactor: number;
}

export interface HealthSettings {
  ageGroup: AgeGroup;
  fitnessLevel: FitnessLevel;
  age: number;
  weight: number; // kg
  sessionDuration: number;
  jumpTarget: number;
}

export interface SessionStats {
  score: number;
  distance: number;
  totalJumps: number;
  maxCombo: number;
  caloriesBurned: number;
  sessionDuration: number;
  avgJumpsPerMinute: number;
  obstaclesCleared: number;
  obstaclesMissed: number;
}

export interface GameStateData {
  screen: GameScreen;
  score: number;
  distance: number;
  speed: number;
  combo: number;
  maxCombo: number;
  jumpCount: number;
  currentLane: Lane;
  activeLanes: number; // always 1
  sessionTimeRemaining: number;
  sessionDuration: number;
  isStumbling: boolean;
  isPaused: boolean;
  timeToNextObstacle: number;
  obstaclesSpawned: number;
  collisionCount: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseData {
  landmarks: Landmark[];
  timestamp: number;
}

export interface CalibrationData {
  baselineNoseY: number;        // nose Y at rest (normalized webcam coords)
  baselineShoulderY: number;    // shoulder midpoint Y at rest
  baselineNoseZ: number;        // nose Z at rest
  baselineShoulderZ: number;    // shoulder midpoint Z at rest
  noseShoulderDistY: number;    // Y-only distance nose-to-shoulder midpoint (for threshold)
  noseShoulderDist3D: number;   // 3D Euclidean distance (for diagnostics)
  shoulderWidth: number;        // for reference
  isCalibrated: boolean;
  adaptedJumpThreshold?: number;  // derived from practice jumps
  adaptedLandMs?: number;         // derived from practice jump duration
}

export interface ObstacleConfig {
  type: ObstacleType;
  lane: Lane;
  position: THREE.Vector3;
}

export interface TrackSegmentData {
  obstacles: ObstacleConfig[];
  laneCount: number;
}

export type GameEventType =
  | 'jump'
  | 'collision'
  | 'scoreChange'
  | 'comboChange'
  | 'speedChange'
  | 'laneChange'
  | 'stumble'
  | 'sessionEnd'
  | 'restStart'
  | 'restEnd'
  | 'screenChange'
  | 'calibrationComplete'
  | 'poseUpdate';

export type GameEventCallback = (data?: unknown) => void;
