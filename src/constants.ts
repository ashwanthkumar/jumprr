import { AgeGroup, FitnessLevel, type AgeGroupDefaults } from './types';

// Lane
export const LANE_WIDTH = 2.5;
export const LANE_POSITIONS = [-LANE_WIDTH, 0, LANE_WIDTH];

// Track
export const TRACK_SEGMENT_LENGTH = 20;
export const TRACK_WIDTH = 9;
export const TRACK_SEGMENTS_AHEAD = 6;
export const TRACK_SEGMENTS_BEHIND = 2;

// Character
export const CHARACTER_Z = 0;
export const CHARACTER_BASE_Y = 0;
export const LANE_SWITCH_SPEED = 8; // units per second
export const JUMP_HEIGHT = 3.0;
export const JUMP_DURATION = 0.5; // seconds (matches AUTO_LAND_MS)

// Obstacles
export const BARRIER_HEIGHT = 1.2;
export const BARRIER_WIDTH = 2.0;
export const BARRIER_DEPTH = 0.5;
export const WALL_HEIGHT = 3.0;
export const WALL_WIDTH = 2.0;
export const WALL_DEPTH = 0.3;

// Speed / Difficulty
export const BASE_SPEED = 12; // units per second
export const MAX_SPEED = 30;
export const SPEED_LOG_FACTOR = 3.5;
export const MIN_OBSTACLE_SPACING = 6;
export const MAX_OBSTACLE_DENSITY = 0.85; // probability per segment
export const DENSITY_PLATEAU_DISTANCE = 1500;
export const NARROWING_START_DISTANCE = 300;
export const NARROWING_INTERVAL_MIN = 200;
export const NARROWING_DURATION_SEGMENTS = 8;

// Collision
export const STUMBLE_DURATION = 1.5; // seconds
export const STUMBLE_SPEED_FACTOR = 0.4;
export const COLLISION_SCORE_PENALTY = 50;

// Scoring
export const POINTS_PER_METER = 1;
export const JUMP_BONUS = 10;
export const COMBO_MULTIPLIER_STEP = 0.5;
export const MAX_COMBO_MULTIPLIER = 5;

// Pose Detection
export const POSE_DETECTION_INTERVAL = 3; // run every N frames
export const JUMP_LAUNCH_THRESHOLD = 0.25; // 25% of nose-to-shoulder distance
export const AUTO_LAND_MS = 500; // auto-land cooldown (average human hang time ~530ms)
export const Z_LEAN_REJECTION_RATIO = 2.0; // if abs(zDisp)/abs(yDisp) > this, reject as lean
export const CALIBRATION_DURATION = 5; // seconds
export const EMA_ALPHA = 0.3; // smoothing factor
// Require shoulders to rise by at least this fraction of threshold to confirm it's
// a whole-body jump (not just a head nod)
export const SHOULDER_CONFIRM_RATIO = 0.4;

// MediaPipe Landmark indices
export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
};

// Health
export const AGE_GROUP_DEFAULTS: Record<AgeGroup, AgeGroupDefaults> = {
  [AgeGroup.CHILD]: { sessionDuration: 180, jumpTarget: 30, restRatio: 2, speedFactor: 0.8 },
  [AgeGroup.TEEN]: { sessionDuration: 300, jumpTarget: 50, restRatio: 2, speedFactor: 1.0 },
  [AgeGroup.YOUNG_ADULT]: { sessionDuration: 600, jumpTarget: 100, restRatio: 1.5, speedFactor: 1.0 },
  [AgeGroup.MIDDLE_AGED]: { sessionDuration: 420, jumpTarget: 70, restRatio: 2, speedFactor: 0.9 },
  [AgeGroup.SENIOR]: { sessionDuration: 300, jumpTarget: 40, restRatio: 3, speedFactor: 0.7 },
};

export const FITNESS_MULTIPLIERS: Record<FitnessLevel, number> = {
  [FitnessLevel.BEGINNER]: 0.6,
  [FitnessLevel.INTERMEDIATE]: 1.0,
  [FitnessLevel.ADVANCED]: 1.5,
};

// MET values for jumping exercise
export const MET_JUMPING = 8.0;

// Rest
export const REST_SET_DURATION_BASE = 60; // seconds of play before rest
export const REST_COUNTDOWN_BASE = 30; // seconds of rest

// Jump Marker
export const JUMP_MARKER_OFFSET_Z = 3.0;   // units ahead of obstacle (toward player)
export const JUMP_MARKER_WIDTH = 3.0;       // wider than 2.0-unit barrier for visibility
export const JUMP_MARKER_DEPTH = 0.6;       // stripe thickness
export const JUMP_MARKER_COLOR = 0xf1c40f;  // bright yellow

// Cadence
export const OBSTACLE_SPAWN_Z = -60;
export const CADENCE_REST_STEP = 10;
export const CADENCE_REST_MAX = 60;

// Practice calibration
export const PRACTICE_JUMP_COUNT = 3;
export const PRACTICE_DETECTION_RATIO = 0.10;

// Visual
export const FOG_NEAR = 30;
export const FOG_FAR = 80;
export const THEME_CHANGE_DISTANCE = 500;

// Camera
export const CAMERA_POSITION = { x: 0, y: 5, z: 10 };
export const CAMERA_LOOK_AT = { x: 0, y: 1.5, z: -10 };
