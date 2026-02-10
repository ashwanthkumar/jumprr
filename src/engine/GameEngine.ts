import { GameScreen } from '../types';
import type { PoseData } from '../types';
import { CHARACTER_Z, STUMBLE_DURATION, STUMBLE_SPEED_FACTOR, OBSTACLE_SPAWN_Z } from '../constants';

import { Clock } from './Clock';
import { SceneManager } from './SceneManager';
import { GameState } from '../game/GameState';
import { ScoreSystem } from '../game/ScoreSystem';
import { CollisionDetector } from '../game/CollisionDetector';
import { DifficultyManager } from '../game/DifficultyManager';
import { SessionManager } from '../game/SessionManager';
import { ObstacleCadence } from '../game/ObstacleCadence';
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
import { SkeletonOverlay } from '../pose/SkeletonOverlay';
import { HealthProfile } from '../health/HealthProfile';
import { CalorieEstimator } from '../health/CalorieEstimator';
import { RecommendationEngine } from '../health/RecommendationEngine';
import { UIManager } from '../ui/UIManager';
import { createWelcomeScreen } from '../ui/screens/WelcomeScreen';
import { createSetupScreen } from '../ui/screens/SetupScreen';
import { createCalibrationScreen, resetCalibrationScreen, startCalibrationCountdown, updateCalibrationProgress, showPracticePhase, updatePracticeCount } from '../ui/screens/CalibrationScreen';
import { createCountdownScreen, runCountdown } from '../ui/screens/CountdownScreen';
import { createHUDScreen, updateHUD } from '../ui/screens/HUDScreen';
import { createPauseScreen } from '../ui/screens/PauseScreen';
import { createRestScreen, updateRestTimer } from '../ui/screens/RestScreen';
import { createResultsScreen, updateResults } from '../ui/screens/ResultsScreen';
import { createDiagnosticScreen, updateDiagnostic, setDiagnosticVideo } from '../ui/screens/DiagnosticScreen';

export class GameEngine {
  private clock: Clock;
  private sceneManager: SceneManager;
  private gameState: GameState;
  private scoreSystem: ScoreSystem;
  private collisionDetector: CollisionDetector;
  private difficultyManager: DifficultyManager;
  private sessionManager: SessionManager;
  private cadence: ObstacleCadence;
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
  private skeletonOverlay: SkeletonOverlay;
  private stumbleTimer = 0;
  private distance = 0;
  private rafId = 0;
  private diagJumpCount = 0;
  private lastRestWallTime = 0;
  private resumingFromRest = false;
  private practicePhaseShown = false;

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new Clock();
    this.sceneManager = new SceneManager(canvas);
    this.gameState = new GameState();
    this.scoreSystem = new ScoreSystem(this.gameState);
    this.collisionDetector = new CollisionDetector();
    this.difficultyManager = new DifficultyManager();
    this.sessionManager = new SessionManager(this.gameState);
    this.cadence = new ObstacleCadence();
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
    this.skeletonOverlay = new SkeletonOverlay();
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
    const calibration = createCalibrationScreen(() => this.onCalibrationReady());
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

    // Diagnostic
    const diagnostic = createDiagnosticScreen(
      () => this.diagCalibrate(),
      () => this.diagClose(),
    );
    this.uiManager.registerScreen(GameScreen.DIAGNOSTIC, diagnostic);

    // Add "Test Pose" button to setup screen
    this.addDiagButtonToSetup(setup);
  }

  private addDiagButtonToSetup(setupScreen: HTMLElement): void {
    const btnContainer = setupScreen.querySelector('.btn-primary')?.parentElement;
    if (btnContainer) {
      const diagBtn = document.createElement('button');
      diagBtn.className = 'btn btn-secondary';
      diagBtn.id = 'btn-test-pose';
      diagBtn.textContent = 'Test Pose Detection';
      diagBtn.style.marginTop = '8px';
      diagBtn.style.display = 'block';
      diagBtn.style.width = '100%';
      diagBtn.addEventListener('click', () => this.startDiagnostic());
      btnContainer.appendChild(diagBtn);
    }
  }

  private async startDiagnostic(): Promise<void> {
    try {
      if (!this.poseTracker.isReady) {
        await this.poseTracker.init();
      }
      if (!this.poseTracker.hasCamera) {
        await this.poseTracker.startCamera();
      }
      // Feed video to diagnostic screen
      const video = this.poseTracker.getVideoElement();
      const diagScreen = this.uiManager.getScreen(GameScreen.DIAGNOSTIC)!;
      if (video) {
        setDiagnosticVideo(diagScreen, video.srcObject);
      }
      this.diagJumpCount = 0;
      this.jumpDetector.reset();
      this.uiManager.showScreen(GameScreen.DIAGNOSTIC);
      this.gameState.setScreen(GameScreen.DIAGNOSTIC);
    } catch (err) {
      alert('Camera access is required. Please allow camera access and try again.');
      console.error('Camera error:', err);
    }
  }

  private diagCalibrate(): void {
    this.calibrator.startCalibration();
    this.jumpDetector.reset();
    this.diagJumpCount = 0;
    console.log('[DIAG] Starting calibration...');
  }

  private diagClose(): void {
    this.showSetup();
  }

  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const screen = this.gameState.state.screen;
        if (screen === GameScreen.PLAYING) {
          this.pauseGame();
        } else if (screen === GameScreen.PAUSED) {
          this.resumeGame();
        } else if (screen === GameScreen.DIAGNOSTIC) {
          this.diagClose();
        }
      }
      // 'D' key toggles diagnostic mode from playing/paused
      if (e.key === 'd' || e.key === 'D') {
        const screen = this.gameState.state.screen;
        if (screen === GameScreen.PLAYING || screen === GameScreen.PAUSED) {
          this.pauseGame();
          this.startDiagnostic();
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
      if (!this.poseTracker.hasCamera) {
        const video = await this.poseTracker.startCamera();
        this.showCameraPreview(video);
      }
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
    this.cameraPreview.appendChild(this.skeletonOverlay.element);
    document.getElementById('ui-overlay')!.appendChild(this.cameraPreview);
  }

  private startCalibration(): void {
    // Show calibration screen with instructions + "I'm Ready" button
    const calScreen = this.uiManager.getScreen(GameScreen.CALIBRATION)!;
    resetCalibrationScreen(calScreen);
    this.practicePhaseShown = false;
    this.uiManager.showScreen(GameScreen.CALIBRATION);
    this.gameState.setScreen(GameScreen.CALIBRATION);
    // Calibration sampling starts when user clicks "I'm Ready"
  }

  private onCalibrationReady(): void {
    const calScreen = this.uiManager.getScreen(GameScreen.CALIBRATION)!;
    startCalibrationCountdown(calScreen);
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
    this.cadence.fullReset();
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
    // Re-calibrate after rest break before resuming gameplay
    this.resumingFromRest = true;
    this.startCalibration();
  }

  private endSession(): void {
    this.clock.pause();
    this.showResults();
  }

  private showResults(): void {
    const stats = this.sessionManager.getStats(this.cadence.totalSpawned);
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

    // Calibration: keep detecting pose to feed samples or practice jumps
    if (screen === GameScreen.CALIBRATION) {
      const pose = this.poseTracker.detect();
      if (pose) {
        this.skeletonOverlay.draw(pose);

        if (this.calibrator.isCalibrating) {
          const done = this.calibrator.addSample(pose);
          const calScreen = this.uiManager.getScreen(GameScreen.CALIBRATION)!;
          updateCalibrationProgress(calScreen, this.calibrator.progress);
          if (done) {
            // Standing calibration done — transition to practice phase
            this.skeletonOverlay.setCalibration(this.calibrator.calibrationData);
            showPracticePhase(calScreen);
            this.practicePhaseShown = true;
          }
        } else if (this.calibrator.isPracticing) {
          const calScreen = this.uiManager.getScreen(GameScreen.CALIBRATION)!;
          if (!this.practicePhaseShown) {
            showPracticePhase(calScreen);
            this.practicePhaseShown = true;
          }
          updatePracticeCount(calScreen, this.calibrator.practiceJumpCount);
          const done = this.calibrator.addPracticeSample(pose);
          if (done) {
            updatePracticeCount(calScreen, this.calibrator.practiceJumpCount);
            this.skeletonOverlay.setCalibration(this.calibrator.calibrationData);
            this.gameState.emit('calibrationComplete');

            if (this.resumingFromRest) {
              // Resuming after rest break — skip countdown, go straight to playing
              this.resumingFromRest = false;
              this.uiManager.showScreen(GameScreen.PLAYING);
              this.gameState.setScreen(GameScreen.PLAYING);
              this.clock.resume();
            } else {
              this.startCountdown();
            }
          }
        }
      }
      return;
    }

    // Diagnostic mode: detect pose, run jump detection, update diagnostic UI
    if (screen === GameScreen.DIAGNOSTIC) {
      const pose = this.poseTracker.detect();
      if (pose) {
        this.skeletonOverlay.draw(pose);

        // Run calibration if in progress
        if (this.calibrator.isCalibrating) {
          const done = this.calibrator.addSample(pose);
          if (done) {
            this.skeletonOverlay.setCalibration(this.calibrator.calibrationData);
            console.log('[DIAG] Calibration complete!');
          }
        }

        // Run jump detection if calibrated
        if (this.calibrator.calibrationData.isCalibrated) {
          const jumpEvent = this.jumpDetector.detect(pose, this.calibrator.calibrationData);
          if (jumpEvent) {
            this.diagJumpCount++;
          }
        }

        // Update diagnostic UI
        const diagScreen = this.uiManager.getScreen(GameScreen.DIAGNOSTIC)!;
        updateDiagnostic(
          diagScreen,
          pose,
          this.calibrator.calibrationData.isCalibrated ? this.calibrator.calibrationData : null,
          this.jumpDetector.currentState,
          this.diagJumpCount,
          this.jumpDetector.cooldownRemaining,
        );
      }
      return;
    }

    // Rest screen: countdown using wall-clock time (game clock is paused)
    if (screen === GameScreen.REST) {
      const now = performance.now();
      if (this.lastRestWallTime > 0) {
        const wallDt = (now - this.lastRestWallTime) / 1000;
        const result = this.sessionManager.update(wallDt);
        const restScreen = this.uiManager.getScreen(GameScreen.REST)!;
        updateRestTimer(restScreen, this.sessionManager.restTimeRemaining);
        if (result === 'playing') {
          this.lastRestWallTime = 0;
          this.resumeFromRest();
        }
      }
      this.lastRestWallTime = now;
      return;
    }

    if (screen !== GameScreen.PLAYING) return;

    // Session management (tracks elapsed time, no auto-end)
    this.sessionManager.update(dt);

    // Difficulty (constant speed)
    const speed = this.difficultyManager.update(this.distance);
    const effectiveSpeed = this.stumbleTimer > 0 ? speed * STUMBLE_SPEED_FACTOR : speed;
    this.gameState.setSpeed(effectiveSpeed);

    // Movement
    const scrollAmount = effectiveSpeed * dt;
    this.distance += scrollAmount;
    this.gameState.setDistance(this.distance);

    // Score from distance
    this.scoreSystem.update(scrollAmount);

    // Lane narrowing (always returns 1 now)
    const activeLanes = this.laneNarrower.update(this.distance);
    this.gameState.setActiveLanes(activeLanes);
    this.laneController.setActiveLanes(activeLanes);
    this.levelGenerator.setActiveLanes(activeLanes);

    // Level scrolling
    this.levelGenerator.update(scrollAmount, this.distance);
    this.environment.scrollTrees(scrollAmount);
    this.environment.update(this.distance);

    // Obstacle cadence
    const cadenceResult = this.cadence.update(dt);
    if (cadenceResult === 'spawn') {
      this.levelGenerator.spawnAhead(OBSTACLE_SPAWN_Z);
      this.gameState.incrementObstaclesSpawned();
    } else if (cadenceResult === 'cycle_complete') {
      // Spawn the last obstacle of the cycle
      this.levelGenerator.spawnAhead(OBSTACLE_SPAWN_Z);
      this.gameState.incrementObstaclesSpawned();

      // Trigger rest
      const restDuration = this.cadence.getRestDuration();
      this.cadence.reset();
      this.sessionManager.startRest(restDuration);
      this.clock.pause();
      this.lastRestWallTime = performance.now();
      this.uiManager.showScreen(GameScreen.REST);
      this.gameState.setScreen(GameScreen.REST);
      return;
    }

    // Calculate time to next obstacle (from nearest obstacle ahead)
    const obstacles = this.levelGenerator.getObstacles();
    let minAheadZ = Infinity;
    for (const obs of obstacles) {
      if (obs.position.z < 0 && Math.abs(obs.position.z) < minAheadZ) {
        minAheadZ = Math.abs(obs.position.z);
      }
    }
    const timeToNext = minAheadZ < Infinity ? minAheadZ / effectiveSpeed : Infinity;
    this.gameState.setTimeToNextObstacle(timeToNext);

    // Pose detection + jump detection
    const pose = this.poseTracker.detect();
    if (pose) {
      this.skeletonOverlay.draw(pose);
      if (this.calibrator.calibrationData.isCalibrated) {
        const jumpEvent = this.jumpDetector.detect(pose, this.calibrator.calibrationData);
        if (jumpEvent) {
          this.handleJump();
        }
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

  private handleJump(): void {
    this.jumpAnimator.startJump();
    this.scoreSystem.onJump();
    this.sessionManager.recordJump();
  }

  private handleCollision(): void {
    this.stumbleTimer = STUMBLE_DURATION;
    this.gameState.setStumbling(true);
    this.scoreSystem.onCollision();
    this.sessionManager.recordCollision();
    this.gameState.incrementCollisionCount();
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
