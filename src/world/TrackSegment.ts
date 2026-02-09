import * as THREE from 'three';
import { TRACK_SEGMENT_LENGTH, TRACK_WIDTH, LANE_WIDTH } from '../constants';

const trackMat = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
const laneMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
const sideMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });

const trackGeo = new THREE.BoxGeometry(TRACK_WIDTH, 0.2, TRACK_SEGMENT_LENGTH);
const laneLineGeo = new THREE.BoxGeometry(0.08, 0.22, TRACK_SEGMENT_LENGTH * 0.8);
const sideGeo = new THREE.BoxGeometry(3, 0.15, TRACK_SEGMENT_LENGTH);

export class TrackSegment {
  readonly mesh: THREE.Group;
  private _zPosition = 0;

  constructor() {
    this.mesh = new THREE.Group();

    // Main track
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.y = -0.1;
    track.receiveShadow = true;
    this.mesh.add(track);

    // Lane dividers
    for (let i = -1; i <= 1; i += 2) {
      const laneLine = new THREE.Mesh(laneLineGeo, laneMat);
      laneLine.position.set(i * LANE_WIDTH / 2, 0, 0);
      this.mesh.add(laneLine);
    }

    // Side strips (grass)
    const leftSide = new THREE.Mesh(sideGeo, sideMat);
    leftSide.position.set(-TRACK_WIDTH / 2 - 1.5, -0.12, 0);
    leftSide.receiveShadow = true;
    this.mesh.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, sideMat);
    rightSide.position.set(TRACK_WIDTH / 2 + 1.5, -0.12, 0);
    rightSide.receiveShadow = true;
    this.mesh.add(rightSide);
  }

  get zPosition(): number {
    return this._zPosition;
  }

  setPosition(z: number): void {
    this._zPosition = z;
    this.mesh.position.z = z;
  }

  isVisible(cameraZ: number, behindDistance: number, aheadDistance: number): boolean {
    const segEnd = this._zPosition + TRACK_SEGMENT_LENGTH / 2;
    const segStart = this._zPosition - TRACK_SEGMENT_LENGTH / 2;
    return segEnd > cameraZ - aheadDistance && segStart < cameraZ + behindDistance;
  }
}
