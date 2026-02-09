import { PoseLandmarker, FilesetResolver, type PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { PoseData, Landmark } from '../types';
import { POSE_DETECTION_INTERVAL } from '../constants';
import { PoseSmoothing } from './PoseSmoothing';

export class PoseTracker {
  private poseLandmarker: PoseLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private smoothing = new PoseSmoothing();
  private lastPoseData: PoseData | null = null;
  private frameCount = 0;
  private _isReady = false;
  private _hasCamera = false;
  private lastVideoTime = -1;

  get isReady(): boolean {
    return this._isReady;
  }

  get hasCamera(): boolean {
    return this._hasCamera;
  }

  get latestPose(): PoseData | null {
    return this.lastPoseData;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      outputSegmentationMasks: false,
    });
    console.log('[POSE] PoseLandmarker initialized (GPU, lite model)');

    this._isReady = true;
  }

  async startCamera(): Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.style.display = 'none';
    document.body.appendChild(video);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();

    this.videoElement = video;
    this._hasCamera = true;
    return video;
  }

  detect(): PoseData | null {
    if (!this.poseLandmarker || !this.videoElement || !this._hasCamera) return null;

    this.frameCount++;

    // Only run detection every N frames
    if (this.frameCount % POSE_DETECTION_INTERVAL !== 0) {
      return this.lastPoseData;
    }

    const now = performance.now();
    if (this.videoElement.currentTime === this.lastVideoTime) {
      return this.lastPoseData;
    }
    this.lastVideoTime = this.videoElement.currentTime;

    const detectStart = performance.now();
    let result: PoseLandmarkerResult;
    try {
      result = this.poseLandmarker.detectForVideo(this.videoElement, now);
    } catch (e) {
      console.warn('[POSE] Detection error:', e);
      return this.lastPoseData;
    }
    const detectMs = performance.now() - detectStart;

    if (!result.landmarks || result.landmarks.length === 0) {
      console.warn('[POSE] No landmarks detected this frame');
      return this.lastPoseData;
    }

    const landmarks: Landmark[] = result.landmarks[0].map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 0,
    }));

    // Log detection latency periodically
    if (this.frameCount % (POSE_DETECTION_INTERVAL * 10) === 0) {
      const lowVisCount = landmarks.filter(l => l.visibility < 0.5).length;
      console.log(
        `[POSE] Detection took ${detectMs.toFixed(1)}ms | ` +
        `${landmarks.length} landmarks | ${lowVisCount} low-visibility (<0.5) | ` +
        `frame #${this.frameCount}`
      );
    }

    const poseData: PoseData = {
      landmarks,
      timestamp: now,
    };

    this.lastPoseData = this.smoothing.smooth(poseData);
    return this.lastPoseData;
  }

  stop(): void {
    if (this.videoElement?.srcObject) {
      const tracks = (this.videoElement.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      this.videoElement.srcObject = null;
    }
    if (this.videoElement?.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    this.videoElement = null;
    this._hasCamera = false;

    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this._isReady = false;
  }

  reset(): void {
    this.smoothing.reset();
    this.lastPoseData = null;
    this.frameCount = 0;
    this.lastVideoTime = -1;
  }
}
