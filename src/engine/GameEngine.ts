import { GameScreen, JumpDirection, Lane } from '../types';
import type { PoseData } from '../types';
import { CHARACTER_Z, STUMBLE_DURATION, STUMBLE_SPEED_FACTOR } from '../constants';

import { Clock } from './Clock';
import { SceneManager } from './SceneManager';
import { GameState } from '../game/GameState';
import { ScoreSystem } from '../game/ScoreSystem';
import { CollisionDetector } from '../game/CollisionDetector';
import { DifficultyManager } from '../game/DifficultyManager';
import { SessionManager } from '../game/SessionManager';
import { PlayerCharacter } from '../character/PlayerCharacter';
import { CharacterAnimator } from '../character/CharacterAnimator';
import { LaneController } from '../character/LaneController';
import { JumpAnimator } from '../character/JumpAnimator';
import { LevelGenerator } from '../world/LevelGenerator';
import { LaneNarrower } from '../world/LaneNarrower';
import { Environment } from '../world/Environment';
import { PoseTracker } from '../pose/PoseTracker';
import { BaselineCalibrator } from '../pose/BaselineCalibrator';
import { JumpDetector } from '../pose/JumpDetector';
import { HealthProfile } from '../health/HealthProfile';
import { CalorieEstimator } from '../health/CalorieEstimator';
import { RecommendationEngine } from '../health/RecommendationEngine';
import { UIManager } from '../ui/UIManager';
import { createWelcomeScreen } from '../ui/screens/WelcomeScreen';
import { createSetupScreen } from '../ui/screens/SetupScreen';
import { createCalibrationScreen, updateCalibrationProgress } from '../ui/screens/CalibrationScreen';
import { createCountdownScreen, runCountdown } from '../ui/screens/CountdownScreen';
import { createHUDScreen, updateHUD } from '../ui/screens/HUDScreen';
import { createPauseScreen } from '../ui/screens/PauseScreen';
import { createRestScreen, updateRestTimer } from '../ui/screens/RestScreen';
import { createResultsScreen, updateResults } from '../ui/screens/ResultsScreen';

export class GameEngine {
  private clock: Clock;
  private sceneManager: SceneManager;
  private gameState: GameState;
  private scoreSystem: ScoreSystem;
  private collisionDetector: CollisionDetector;
  private difficultyManager: DifficultyManager;
  private sessionManager: SessionManager;
  private playerCharacter: PlayerCharacter;
  private characterAnimator: CharacterAnimator;
  private laneController: LaneController;
  private jumpAnimator: JumpAnimator;
  private levelGenerator: LevelGenerator;
  private laneNarrower: LaneNarrower;
  private environment: Environment;
  private poseTracker: PoseTracker;
  private calibrator: BaselineCalibrator;
  private jumpDetector: JumpDetector;
  private healthProfile: HealthProfile;
  private calorieEstimator: CalorieEstimator;
  private recommendationEngine: RecommendationEngine;
  private uiManager: UIManager;

  private cameraPreview: HTMLDivElement | null = null;
  private stumbleTimer = 0;
  private distance = 0;
  private rafId = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new Clock();
    this.sceneManager = new SceneManager(canvas);
    this.gameState = new GameState();
    this.scoreSystem = new ScoreSystem(this.gameState);
    this.collisionDetector = new CollisionDetector();
    this.difficultyManager = new DifficultyManager();
    this.sessionManager = new SessionManager(this.gameState);
    this.laneController = new LaneController();
    this.jumpAnimator = new JumpAnimator();
    this.playerCharacter = new PlayerCharacter();
    this.characterAnimator = new CharacterAnimator(
      this.playerCharacter,
      this.jumpAnimator,
      this.laneController,
    );
    this.levelGenerator = new LevelGenerator(this.sceneManager.scene);
    this.laneNarrower = new LaneNarrower();
    this.environment = new Environment(this.sceneManager.scene);
    this.poseTracker = new PoseTracker();
    this.calibrator = new BaselineCalibrator();
    this.jumpDetector = new JumpDetector();
    this.healthProfile = new HealthProfile();
    this.calorieEstimator = new CalorieEstimator();
    this.recommendationEngine = new RecommendationEngine();
    this.uiManager = new UIManager();

    this.sceneManager.scene.add(this.playerCharacter.root);
    this.playerCharacter.root.position.z = CHARACTER_Z;

    this.setupUI();
    this.setupKeyboardHandlers();
  }

  private setupUI(): void {
    // Welcome
    const welcome = createWelcomeScreen(() => this.showSetup());
    this.uiManager.registerScreen(GameScreen.WELCOME, welcome);

    // Setup
    const setup = createSetupScreen(this.healthProfile, () => this.startCamera());
    this.uiManager.registerScreen(GameScreen.SETUP, setup);

    // Calibration
    const calibration = createCalibrationScreen();
    this.uiManager.registerScreen(GameScreen.CALIBRATION, calibration);

    // Countdown
    const countdown = createCountdownScreen();
    this.uiManager.registerScreen(GameScreen.COUNTDOWN, countdown);

    // HUD
    const hud = createHUDScreen();
    this.uiManager.registerScreen(GameScreen.PLAYING, hud);

    // Pause
    const pause = createPauseScreen(
      () => this.resumeGame(),
      () => this.endSession(),
    );
    this.uiManager.registerScreen(GameScreen.PAUSED, pause);

    // Rest
    const rest = createRestScreen(() => {
      this.sessionManager.skipRest();
      this.resumeFromRest();
    });
    this.uiManager.registerScreen(GameScreen.REST, rest);

    // Results
    const results = createResultsScreen(
      () => this.playAgain(),
      () => this.showSetup(),
    );
    this.uiManager.registerScreen(GameScreen.RESULTS, results);
  }

  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const screen = this.gameState.state.screen;
        if (screen === GameScreen.PLAYING) {
          this.pauseGame();
        } else if (screen === GameScreen.PAUSED) {
          this.resumeGame();
        }
      }
    });

    // Auto-pause on tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameState.state.screen === GameScreen.PLAYING) {
        this.pauseGame();
      }
    });
  }

  start(): void {
    this.levelGenerator.init();
    this.uiManager.showScreen(GameScreen.WELCOME);
    this.gameState.setScreen(GameScreen.WELCOME);
    this.clock.start();
    this.gameLoop();
  }

  private showSetup(): void {
    this.uiManager.showScreen(GameScreen.SETUP);
    this.gameState.setScreen(GameScreen.SETUP);
  }

  private async startCamera(): Promise<void> {
    try {
      if (!this.poseTracker.isReady) {
        await this.poseTracker.init();
      }
      const video = await this.poseTracker.startCamera();
      this.showCameraPreview(video);
      this.startCalibration();
    } catch (err) {
      alert('Camera access is required to play Jumprr. Please allow camera access and try again.');
      console.error('Camera error:', err);
    }
  }

  private showCameraPreview(video: HTMLVideoElement): void {
    if (this.cameraPreview) return;
    this.cameraPreview = document.createElement('div');
    this.cameraPreview.className = 'camera-preview';
    const previewVideo = document.createElement('video');
    previewVideo.srcObject = video.srcObject;
    previewVideo.setAttribute('playsinline', '');
    previewVideo.setAttribute('autoplay', '');
    previewVideo.muted = true;
    previewVideo.play();
    this.cameraPreview.appendChild(previewVideo);
    document.getElementById('ui-overlay')!.appendChild(this.cameraPreview);
  }

  private startCalibration(): void {
    this.uiManager.showScreen(GameScreen.CALIBRATION);
    this.gameState.setScreen(GameScreen.CALIBRATION);
    this.calibrator.startCalibration();
  }

  private startCountdown(): void {
    this.uiManager.showScreen(GameScreen.COUNTDOWN);
    this.gameState.setScreen(GameScreen.COUNTDOWN);
    const screen = this.uiManager.getScreen(GameScreen.COUNTDOWN)!;
    runCountdown(screen, () => this.startGameplay());
  }

  private startGameplay(): void {
    this.resetGameplayState();
    this.sessionManager.configure(this.healthProfile.settings);
    this.difficultyManager.setSpeedFactor(this.healthProfile.getSpeedFactor());

    this.uiManager.showScreen(GameScreen.PLAYING);
    this.gameState.setScreen(GameScreen.PLAYING);
    this.clock.resume();
  }

  private resetGameplayState(): void {
    this.gameState.reset();
    this.scoreSystem.reset();
    this.difficultyManager.reset();
    this.sessionManager.reset();
    this.laneController.reset();
    this.jumpAnimator.reset();
    this.characterAnimator.reset();
    this.levelGenerator.reset();
    this.laneNarrower.reset();
    this.jumpDetector.reset();
    this.poseTracker.reset();
    this.distance = 0;
    this.stumbleTimer = 0;
  }

  private pauseGame(): void {
    this.clock.pause();
    this.gameState.setPaused(true);
    this.uiManager.showScreen(GameScreen.PAUSED);
    this.gameState.setScreen(GameScreen.PAUSED);
  }

  private resumeGame(): void {
    this.clock.resume();
    this.gameState.setPaused(false);
    this.uiManager.showScreen(GameScreen.PLAYING);
    this.gameState.setScreen(GameScreen.PLAYING);
  }

  private resumeFromRest(): void {
    this.uiManager.showScreen(GameScreen.PLAYING);
    this.gameState.setScreen(GameScreen.PLAYING);
    this.clock.resume();
  }

  private endSession(): void {
    this.clock.pause();
    this.showResults();
  }

  private showResults(): void {
    const stats = this.sessionManager.getStats();
    const settings = this.healthProfile.settings;

    // Calculate calories
    stats.caloriesBurned = this.calorieEstimator.estimate(
      settings.weight,
      stats.sessionDuration,
      stats.totalJumps,
    );

    const recommendations = this.recommendationEngine.generate(stats, this.healthProfile);
    const screen = this.uiManager.getScreen(GameScreen.RESULTS)!;
    updateResults(screen, stats, recommendations);

    this.uiManager.showScreen(GameScreen.RESULTS);
    this.gameState.setScreen(GameScreen.RESULTS);
  }

  private playAgain(): void {
    this.startCalibration();
  }

  private gameLoop = (): void => {
    this.rafId = requestAnimationFrame(this.gameLoop);
    const dt = this.clock.tick();
    const screen = this.gameState.state.screen;

    // Always render the scene
    this.sceneManager.render();

    // Calibration: keep detecting pose to feed samples
    if (screen === GameScreen.CALIBRATION) {
      const pose = this.poseTracker.detect();
      if (pose && this.calibrator.isCalibrating) {
        const done = this.calibrator.addSample(pose);
        const calScreen = this.uiManager.getScreen(GameScreen.CALIBRATION)!;
        updateCalibrationProgress(calScreen, this.calibrator.progress);
        if (done) {
          this.gameState.emit('calibrationComplete');
          this.startCountdown();
        }
      }
      return;
    }

    if (screen !== GameScreen.PLAYING) return;

    // Session management
    const sessionResult = this.sessionManager.update(dt);
    if (sessionResult === 'rest') {
      this.clock.pause();
      this.uiManager.showScreen(GameScreen.REST);
      this.gameState.setScreen(GameScreen.REST);
      return;
    }
    if (sessionResult === 'ended') {
      this.endSession();
      return;
    }

    // Update rest screen if visible
    if (this.gameState.state.screen === GameScreen.REST) {
      const restScreen = this.uiManager.getScreen(GameScreen.REST)!;
      updateRestTimer(restScreen, this.sessionManager.restTimeRemaining);
      return;
    }

    // Difficulty
    const speed = this.difficultyManager.update(this.distance);
    const effectiveSpeed = this.stumbleTimer > 0 ? speed * STUMBLE_SPEED_FACTOR : speed;
    this.gameState.setSpeed(effectiveSpeed);

    // Movement
    const scrollAmount = effectiveSpeed * dt;
    this.distance += scrollAmount;
    this.gameState.setDistance(this.distance);

    // Score from distance
    this.scoreSystem.update(scrollAmount);

    // Lane narrowing
    const activeLanes = this.laneNarrower.update(this.distance);
    this.gameState.setActiveLanes(activeLanes);
    this.laneController.setActiveLanes(activeLanes);
    this.levelGenerator.setActiveLanes(activeLanes);

    // Level scrolling
    this.levelGenerator.update(scrollAmount, this.distance);
    this.environment.scrollTrees(scrollAmount);
    this.environment.update(this.distance);

    // Pose detection + jump detection
    const pose = this.poseTracker.detect();
    if (pose && this.calibrator.calibrationData.isCalibrated) {
      const jumpEvent = this.jumpDetector.detect(pose, this.calibrator.calibrationData);
      if (jumpEvent) {
        this.handleJump(jumpEvent.direction);
      }
    }

    // Update character
    this.laneController.update(dt);
    this.jumpAnimator.update(dt);
    this.characterAnimator.update(dt, effectiveSpeed, pose ?? null);

    // Collision
    if (this.stumbleTimer <= 0) {
      const hit = this.collisionDetector.checkCollision(
        this.laneController.currentX,
        this.jumpAnimator.currentY,
        CHARACTER_Z,
        this.jumpAnimator.isJumping,
        this.levelGenerator.getObstacles(),
      );
      if (hit) {
        this.handleCollision();
      }
    } else {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.gameState.setStumbling(false);
      }
    }

    // Update HUD
    const hudScreen = this.uiManager.getScreen(GameScreen.PLAYING)!;
    updateHUD(hudScreen, this.gameState.state);
  };

  private handleJump(direction: JumpDirection): void {
    this.jumpAnimator.startJump();
    this.scoreSystem.onJump();
    this.sessionManager.recordJump(direction);

    if (direction === JumpDirection.LEFT) {
      this.laneController.switchLane('left');
    } else if (direction === JumpDirection.RIGHT) {
      this.laneController.switchLane('right');
    }

    this.gameState.setLane(this.laneController.currentLane);
  }

  private handleCollision(): void {
    this.stumbleTimer = STUMBLE_DURATION;
    this.gameState.setStumbling(true);
    this.scoreSystem.onCollision();
    this.uiManager.shakeScreen();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.poseTracker.stop();
    this.playerCharacter.dispose();
    this.sceneManager.dispose();
    if (this.cameraPreview?.parentNode) {
      this.cameraPreview.parentNode.removeChild(this.cameraPreview);
    }
  }
}
