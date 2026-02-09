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
}

export enum JumpState {
  IDLE = 'idle',
  LAUNCHING = 'launching',
  AIRBORNE = 'airborne',
  LANDING = 'landing',
  COOLDOWN = 'cooldown',
}

export enum JumpDirection {
  STRAIGHT = 'straight',
  LEFT = 'left',
  RIGHT = 'right',
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
  direction: JumpDirection;
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
  straightJumps: number;
  leftJumps: number;
  rightJumps: number;
  maxCombo: number;
  caloriesBurned: number;
  sessionDuration: number;
  avgJumpsPerMinute: number;
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
  activeLanes: number; // 1, 2, or 3
  sessionTimeRemaining: number;
  sessionDuration: number;
  isStumbling: boolean;
  isPaused: boolean;
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
  baselineFootY: number;
  torsoHeight: number;
  shoulderWidth: number;
  hipCenterX: number;
  isCalibrated: boolean;
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
