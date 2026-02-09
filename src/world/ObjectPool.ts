import * as THREE from 'three';

export class ObjectPool<T extends THREE.Object3D> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;

  constructor(factory: () => T, initialSize = 0) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.visible = false;
      this.pool.push(obj);
    }
  }

  acquire(): T {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.factory();
    }
    obj.visible = true;
    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    obj.visible = false;
    this.active.delete(obj);
    this.pool.push(obj);
  }

  releaseAll(): void {
    this.active.forEach(obj => {
      obj.visible = false;
      this.pool.push(obj);
    });
    this.active.clear();
  }

  get activeCount(): number {
    return this.active.size;
  }

  getAll(): T[] {
    return [...this.pool, ...this.active];
  }

  getActive(): Set<T> {
    return this.active;
  }
}
