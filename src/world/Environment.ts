import * as THREE from 'three';
import { THEME_CHANGE_DISTANCE } from '../constants';

interface ThemeColors {
  sky: number;
  fog: number;
  ground: number;
}

const THEMES: ThemeColors[] = [
  { sky: 0x87ceeb, fog: 0x87ceeb, ground: 0x27ae60 }, // Green meadow
  { sky: 0xffeaa7, fog: 0xffeaa7, ground: 0xd4a574 }, // Desert sunset
  { sky: 0xa29bfe, fog: 0xa29bfe, ground: 0x6c5ce7 }, // Purple twilight
  { sky: 0x74b9ff, fog: 0x74b9ff, ground: 0x00b894 }, // Tropical
  { sky: 0xfd79a8, fog: 0xfd79a8, ground: 0xe17055 }, // Warm evening
];

export class Environment {
  private scene: THREE.Scene;
  private currentThemeIndex = 0;
  private trees: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createInitialScenery();
  }

  private createInitialScenery(): void {
    // Create some distant trees/bushes for atmosphere
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x2d8a4e });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    for (let i = 0; i < 30; i++) {
      const tree = new THREE.Group();
      const side = (i % 2 === 0 ? -1 : 1);
      const x = side * (7 + Math.random() * 8);
      const z = -i * 15 + Math.random() * 10;

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1.5, 5),
        trunkMat,
      );
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      tree.add(trunk);

      // Foliage (low-poly cone)
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(1.0 + Math.random() * 0.5, 2.5 + Math.random(), 5),
        treeMat,
      );
      foliage.position.y = 2.5;
      foliage.castShadow = true;
      tree.add(foliage);

      tree.position.set(x, 0, z);
      this.trees.push(tree);
      this.scene.add(tree);
    }
  }

  getThemeForDistance(distance: number): ThemeColors {
    const index = Math.floor(distance / THEME_CHANGE_DISTANCE) % THEMES.length;
    return THEMES[index];
  }

  update(distance: number): void {
    const newIndex = Math.floor(distance / THEME_CHANGE_DISTANCE) % THEMES.length;
    if (newIndex !== this.currentThemeIndex) {
      this.currentThemeIndex = newIndex;
      const theme = THEMES[this.currentThemeIndex];
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.setHex(theme.sky);
      }
    }

    // Reposition trees that are behind the camera
    for (const tree of this.trees) {
      if (tree.position.z > 20) {
        tree.position.z -= 450;
      }
    }
  }

  scrollTrees(scrollAmount: number): void {
    for (const tree of this.trees) {
      tree.position.z += scrollAmount;
    }
  }
}
