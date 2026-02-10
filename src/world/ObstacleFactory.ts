import * as THREE from 'three';
import { ObstacleType, Lane } from '../types';
import {
  BARRIER_HEIGHT, BARRIER_WIDTH, BARRIER_DEPTH,
  WALL_HEIGHT, WALL_WIDTH, WALL_DEPTH,
  LANE_WIDTH,
  JUMP_MARKER_OFFSET_Z, JUMP_MARKER_WIDTH, JUMP_MARKER_DEPTH, JUMP_MARKER_COLOR,
} from '../constants';
import { ObjectPool } from './ObjectPool';

export interface Obstacle extends THREE.Group {
  userData: {
    type: ObstacleType;
    lane: Lane;
    active: boolean;
  };
}

const barrierMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
const barrierGeo = new THREE.BoxGeometry(BARRIER_WIDTH, BARRIER_HEIGHT, BARRIER_DEPTH);
const barrierPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, BARRIER_HEIGHT, 6);
const barrierPoleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

const wallMat = new THREE.MeshLambertMaterial({ color: 0x636e72 });
const wallGeo = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH);

const markerGeo = new THREE.BoxGeometry(JUMP_MARKER_WIDTH, 0.02, JUMP_MARKER_DEPTH);
const markerMat = new THREE.MeshLambertMaterial({ color: JUMP_MARKER_COLOR });

function createBarrier(): Obstacle {
  const group = new THREE.Group() as Obstacle;
  group.userData = { type: ObstacleType.BARRIER, lane: Lane.CENTER, active: false };

  // Horizontal bar
  const bar = new THREE.Mesh(barrierGeo, barrierMat);
  bar.position.y = BARRIER_HEIGHT;
  bar.castShadow = true;
  group.add(bar);

  // Poles
  const leftPole = new THREE.Mesh(barrierPoleGeo, barrierPoleMat);
  leftPole.position.set(-BARRIER_WIDTH / 2 + 0.05, BARRIER_HEIGHT / 2, 0);
  leftPole.castShadow = true;
  group.add(leftPole);

  const rightPole = new THREE.Mesh(barrierPoleGeo, barrierPoleMat);
  rightPole.position.set(BARRIER_WIDTH / 2 - 0.05, BARRIER_HEIGHT / 2, 0);
  rightPole.castShadow = true;
  group.add(rightPole);

  // Jump marker on ground ahead of barrier
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(0, 0.01, JUMP_MARKER_OFFSET_Z);
  group.add(marker);

  return group;
}

function createWall(): Obstacle {
  const group = new THREE.Group() as Obstacle;
  group.userData = { type: ObstacleType.WALL, lane: Lane.CENTER, active: false };

  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = WALL_HEIGHT / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Warning stripes
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xfdcb6e });
  const stripeGeo = new THREE.BoxGeometry(WALL_WIDTH * 0.9, 0.1, WALL_DEPTH + 0.01);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.5 + i * 1.0, 0);
    group.add(stripe);
  }

  // Jump marker on ground ahead of wall
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(0, 0.01, JUMP_MARKER_OFFSET_Z);
  group.add(marker);

  return group;
}

export class ObstacleFactory {
  private barrierPool: ObjectPool<Obstacle>;
  private wallPool: ObjectPool<Obstacle>;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.barrierPool = new ObjectPool(createBarrier, 10);
    this.wallPool = new ObjectPool(createWall, 10);

    // Add all pooled objects to scene
    this.barrierPool.getAll().forEach(o => scene.add(o));
    this.wallPool.getAll().forEach(o => scene.add(o));
  }

  spawn(type: ObstacleType, lane: Lane, z: number): Obstacle {
    const pool = type === ObstacleType.BARRIER ? this.barrierPool : this.wallPool;
    const obstacle = pool.acquire();

    // If newly created (not yet in scene)
    if (!obstacle.parent) {
      this.scene.add(obstacle);
    }

    obstacle.position.set(lane * LANE_WIDTH, 0, z);
    obstacle.userData.lane = lane;
    obstacle.userData.active = true;
    return obstacle;
  }

  release(obstacle: Obstacle): void {
    obstacle.userData.active = false;
    const pool = obstacle.userData.type === ObstacleType.BARRIER
      ? this.barrierPool : this.wallPool;
    pool.release(obstacle);
  }

  releaseAll(): void {
    this.barrierPool.releaseAll();
    this.wallPool.releaseAll();
  }
}
