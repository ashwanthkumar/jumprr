import * as THREE from 'three';
import { TrackSegment } from './TrackSegment';
import { ObstacleFactory, type Obstacle } from './ObstacleFactory';
import { ObstacleType, Lane } from '../types';
import {
  TRACK_SEGMENT_LENGTH,
  TRACK_SEGMENTS_AHEAD,
  TRACK_SEGMENTS_BEHIND,
} from '../constants';

export class LevelGenerator {
  private scene: THREE.Scene;
  private segments: TrackSegment[] = [];
  private obstacles: Obstacle[] = [];
  private obstacleFactory: ObstacleFactory;
  private furthestZ = 0;
  private totalDistance = 0;
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.obstacleFactory = new ObstacleFactory(scene);
  }

  init(): void {
    // Create initial track segments
    const totalSegments = TRACK_SEGMENTS_AHEAD + TRACK_SEGMENTS_BEHIND;
    for (let i = 0; i < totalSegments; i++) {
      const segment = new TrackSegment();
      const z = -i * TRACK_SEGMENT_LENGTH;
      segment.setPosition(z);
      this.scene.add(segment.mesh);
      this.segments.push(segment);
    }
    this.furthestZ = -(totalSegments - 1) * TRACK_SEGMENT_LENGTH;
  }

  setActiveLanes(_count: number): void {
    // Single lane only
  }

  update(scrollAmount: number, distance: number): void {
    this.totalDistance = distance;

    // Move all segments toward camera
    for (const seg of this.segments) {
      seg.setPosition(seg.zPosition + scrollAmount);
    }

    // Move all obstacles toward camera
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.position.z += scrollAmount;

      // Remove obstacles that are behind camera
      if (obs.position.z > 20) {
        this.obstacleFactory.release(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // Recycle segments that moved behind camera
    for (const seg of this.segments) {
      if (seg.zPosition > TRACK_SEGMENTS_BEHIND * TRACK_SEGMENT_LENGTH) {
        // Move to front
        this.furthestZ -= TRACK_SEGMENT_LENGTH;
        seg.setPosition(this.furthestZ);
      }
    }
  }

  spawnAhead(z: number): void {
    const obs = this.obstacleFactory.spawn(ObstacleType.BARRIER, Lane.CENTER, z);
    this.obstacles.push(obs);
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  reset(): void {
    // Remove all obstacles
    for (const obs of this.obstacles) {
      this.obstacleFactory.release(obs);
    }
    this.obstacles = [];

    // Reset segments
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].setPosition(-i * TRACK_SEGMENT_LENGTH);
    }
    this.furthestZ = -(this.segments.length - 1) * TRACK_SEGMENT_LENGTH;
    this.totalDistance = 0;
  }
}
