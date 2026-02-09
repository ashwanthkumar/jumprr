import * as THREE from 'three';
import { CHARACTER_BASE_Y } from '../constants';

export class PlayerCharacter {
  readonly root: THREE.Group;

  // Joint groups for animation
  readonly head: THREE.Group;
  readonly torso: THREE.Group;
  readonly leftUpperArm: THREE.Group;
  readonly rightUpperArm: THREE.Group;
  readonly leftLowerArm: THREE.Group;
  readonly rightLowerArm: THREE.Group;
  readonly leftUpperLeg: THREE.Group;
  readonly rightUpperLeg: THREE.Group;
  readonly leftLowerLeg: THREE.Group;
  readonly rightLowerLeg: THREE.Group;
  readonly hips: THREE.Group;

  private materials: THREE.MeshLambertMaterial[] = [];

  constructor() {
    this.root = new THREE.Group();
    this.root.position.y = CHARACTER_BASE_Y;
    // Face character away from camera (show back, not face)
    this.root.rotation.y = Math.PI;

    const skinColor = 0xf4c89a;
    const shirtColor = 0x4a90d9;
    const pantsColor = 0x2d3436;
    const shoeColor = 0xd63031;

    // Hips (root of the skeleton)
    this.hips = this.createJoint();
    this.hips.position.y = 1.0;
    this.root.add(this.hips);

    // Torso
    this.torso = this.createJoint();
    this.torso.position.y = 0.3;
    this.hips.add(this.torso);

    const torsoMesh = this.createBox(0.7, 0.7, 0.35, shirtColor);
    torsoMesh.position.y = 0.35;
    this.torso.add(torsoMesh);

    // Hip mesh
    const hipMesh = this.createBox(0.6, 0.25, 0.3, pantsColor);
    hipMesh.position.y = 0.0;
    this.hips.add(hipMesh);

    // Head
    this.head = this.createJoint();
    this.head.position.y = 0.75;
    this.torso.add(this.head);

    const headMesh = this.createSphere(0.2, skinColor);
    headMesh.position.y = 0.2;
    this.head.add(headMesh);

    // Hair
    const hairMesh = this.createBox(0.3, 0.15, 0.25, 0x3d3d3d);
    hairMesh.position.set(0, 0.35, -0.02);
    this.head.add(hairMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 4);
    const eyeMat = this.createMaterial(0x2d3436);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.22, 0.17);
    this.head.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.22, 0.17);
    this.head.add(rightEye);

    // Left arm
    this.leftUpperArm = this.createJoint();
    this.leftUpperArm.position.set(-0.45, 0.65, 0);
    this.torso.add(this.leftUpperArm);

    const leftUpperArmMesh = this.createCapsule(0.08, 0.25, shirtColor);
    leftUpperArmMesh.position.y = -0.2;
    this.leftUpperArm.add(leftUpperArmMesh);

    this.leftLowerArm = this.createJoint();
    this.leftLowerArm.position.y = -0.35;
    this.leftUpperArm.add(this.leftLowerArm);

    const leftLowerArmMesh = this.createCapsule(0.06, 0.2, skinColor);
    leftLowerArmMesh.position.y = -0.15;
    this.leftLowerArm.add(leftLowerArmMesh);

    // Right arm
    this.rightUpperArm = this.createJoint();
    this.rightUpperArm.position.set(0.45, 0.65, 0);
    this.torso.add(this.rightUpperArm);

    const rightUpperArmMesh = this.createCapsule(0.08, 0.25, shirtColor);
    rightUpperArmMesh.position.y = -0.2;
    this.rightUpperArm.add(rightUpperArmMesh);

    this.rightLowerArm = this.createJoint();
    this.rightLowerArm.position.y = -0.35;
    this.rightUpperArm.add(this.rightLowerArm);

    const rightLowerArmMesh = this.createCapsule(0.06, 0.2, skinColor);
    rightLowerArmMesh.position.y = -0.15;
    this.rightLowerArm.add(rightLowerArmMesh);

    // Left leg
    this.leftUpperLeg = this.createJoint();
    this.leftUpperLeg.position.set(-0.15, -0.1, 0);
    this.hips.add(this.leftUpperLeg);

    const leftUpperLegMesh = this.createCapsule(0.1, 0.25, pantsColor);
    leftUpperLegMesh.position.y = -0.25;
    this.leftUpperLeg.add(leftUpperLegMesh);

    this.leftLowerLeg = this.createJoint();
    this.leftLowerLeg.position.y = -0.45;
    this.leftUpperLeg.add(this.leftLowerLeg);

    const leftLowerLegMesh = this.createCapsule(0.08, 0.25, pantsColor);
    leftLowerLegMesh.position.y = -0.2;
    this.leftLowerLeg.add(leftLowerLegMesh);

    // Left shoe
    const leftShoe = this.createBox(0.15, 0.1, 0.22, shoeColor);
    leftShoe.position.set(0, -0.4, 0.05);
    this.leftLowerLeg.add(leftShoe);

    // Right leg
    this.rightUpperLeg = this.createJoint();
    this.rightUpperLeg.position.set(0.15, -0.1, 0);
    this.hips.add(this.rightUpperLeg);

    const rightUpperLegMesh = this.createCapsule(0.1, 0.25, pantsColor);
    rightUpperLegMesh.position.y = -0.25;
    this.rightUpperLeg.add(rightUpperLegMesh);

    this.rightLowerLeg = this.createJoint();
    this.rightLowerLeg.position.y = -0.45;
    this.rightUpperLeg.add(this.rightLowerLeg);

    const rightLowerLegMesh = this.createCapsule(0.08, 0.25, pantsColor);
    rightLowerLegMesh.position.y = -0.2;
    this.rightLowerLeg.add(rightLowerLegMesh);

    // Right shoe
    const rightShoe = this.createBox(0.15, 0.1, 0.22, shoeColor);
    rightShoe.position.set(0, -0.4, 0.05);
    this.rightLowerLeg.add(rightShoe);

    // Enable shadows for all meshes
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private createJoint(): THREE.Group {
    return new THREE.Group();
  }

  private createMaterial(color: number): THREE.MeshLambertMaterial {
    const mat = new THREE.MeshLambertMaterial({ color });
    this.materials.push(mat);
    return mat;
  }

  private createBox(w: number, h: number, d: number, color: number): THREE.Mesh {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.createMaterial(color));
  }

  private createSphere(r: number, color: number): THREE.Mesh {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), this.createMaterial(color));
  }

  private createCapsule(r: number, h: number, color: number): THREE.Mesh {
    return new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 8), this.createMaterial(color));
  }

  dispose(): void {
    this.materials.forEach(m => m.dispose());
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
