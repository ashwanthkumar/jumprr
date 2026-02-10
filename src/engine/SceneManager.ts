import * as THREE from 'three';
import { CAMERA_POSITION, CAMERA_LOOK_AT } from '../constants';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    this.camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
    this.camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 15, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -15;
    this.directionalLight.shadow.camera.right = 15;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.scene.add(this.directionalLight);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  setBackgroundColor(color: number): void {
    (this.scene.background as THREE.Color).setHex(color);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
