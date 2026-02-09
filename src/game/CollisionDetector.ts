import * as THREE from 'three';
import type { Obstacle } from '../world/ObstacleFactory';
import { ObstacleType } from '../types';
import { BARRIER_HEIGHT, BARRIER_WIDTH, WALL_WIDTH, WALL_HEIGHT, LANE_WIDTH } from '../constants';

const _playerBox = new THREE.Box3();
const _obsBox = new THREE.Box3();

export class CollisionDetector {
  checkCollision(
    playerX: number,
    playerY: number,
    playerZ: number,
    isJumping: boolean,
    obstacles: Obstacle[],
  ): Obstacle | null {
    // Player bounding box (approximate)
    _playerBox.min.set(playerX - 0.35, playerY, playerZ - 0.3);
    _playerBox.max.set(playerX + 0.35, playerY + 1.8, playerZ + 0.3);

    for (const obs of obstacles) {
      if (!obs.userData.active) continue;

      const type = obs.userData.type;
      const ox = obs.position.x;
      const oz = obs.position.z;

      if (type === ObstacleType.BARRIER) {
        // Barriers can be jumped over
        if (isJumping && playerY > BARRIER_HEIGHT * 0.6) continue;

        _obsBox.min.set(ox - BARRIER_WIDTH / 2, 0, oz - 0.3);
        _obsBox.max.set(ox + BARRIER_WIDTH / 2, BARRIER_HEIGHT, oz + 0.3);
      } else {
        // Walls must be avoided by lane switching
        _obsBox.min.set(ox - WALL_WIDTH / 2, 0, oz - 0.2);
        _obsBox.max.set(ox + WALL_WIDTH / 2, WALL_HEIGHT, oz + 0.2);
      }

      if (_playerBox.intersectsBox(_obsBox)) {
        return obs;
      }
    }

    return null;
  }
}
