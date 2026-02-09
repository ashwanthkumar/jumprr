import * as THREE from 'three';
import { TrackSegment } from './TrackSegment';
import { ObstacleFactory, type Obstacle } from './ObstacleFactory';
import { ObstacleType, Lane } from '../types';
import {
  TRACK_SEGMENT_LENGTH,
  TRACK_SEGMENTS_AHEAD,
  TRACK_SEGMENTS_BEHIND,
  MIN_OBSTACLE_SPACING,
  MAX_OBSTACLE_DENSITY,
  DENSITY_PLATEAU_DISTANCE,
} from '../constants';

export class LevelGenerator {
  private scene: THREE.Scene;
  private segments: TrackSegment[] = [];
  private obstacles: Obstacle[] = [];
  private obstacleFactory: ObstacleFactory;
  private furthestZ = 0;
  private lastObstacleZ = 0;
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

        // Maybe spawn obstacles on this new segment
        this.maybeSpawnObstacles(seg.zPosition);
      }
    }
  }

  private maybeSpawnObstacles(segZ: number): void {
    if (segZ > this.lastObstacleZ - MIN_OBSTACLE_SPACING) return;

    const density = this.getObstacleDensity();
    if (Math.random() > density) return;

    // Decide obstacle pattern
    const pattern = this.generatePattern();

    for (const { type, lane } of pattern) {
      const z = segZ + (Math.random() * 0.5 - 0.25) * TRACK_SEGMENT_LENGTH * 0.3;
      const obs = this.obstacleFactory.spawn(type, lane, z);
      this.obstacles.push(obs);
    }

    this.lastObstacleZ = segZ;
  }

  private generatePattern(): Array<{ type: ObstacleType; lane: Lane }> {
    // Single lane: always spawn a barrier in center (must jump over it)
    return [{ type: ObstacleType.BARRIER, lane: Lane.CENTER }];
  }

  private getObstacleDensity(): number {
    const t = Math.min(this.totalDistance / DENSITY_PLATEAU_DISTANCE, 1);
    return t * MAX_OBSTACLE_DENSITY;
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
    this.lastObstacleZ = 0;
    this.totalDistance = 0;
  }
}
