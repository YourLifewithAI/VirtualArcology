/** A few drifting low-poly cloud clusters. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Rng } from '../core/Rng';

export class Clouds {
  private group = new THREE.Group();
  private speeds: number[] = [];
  private extent: number;

  constructor(scene: THREE.Scene, extent = 1600, count = 7, seed = 42) {
    this.extent = extent;
    const rng = new Rng(seed);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
    for (let i = 0; i < count; i++) {
      const blobs: THREE.BufferGeometry[] = [];
      const n = rng.int(3, 5);
      for (let bIdx = 0; bIdx < n; bIdx++) {
        const g = new THREE.IcosahedronGeometry(rng.float(14, 30), 0);
        g.scale(rng.float(1.4, 2.4), 0.55, 1);
        g.translate(bIdx * rng.float(18, 30) - n * 10, rng.float(-4, 4), rng.float(-12, 12));
        blobs.push(g);
      }
      const mesh = new THREE.Mesh(mergeGeometries(blobs, false), mat);
      mesh.position.set(rng.float(-extent, extent), rng.float(220, 380), rng.float(-extent, extent));
      this.group.add(mesh);
      this.speeds.push(rng.float(3, 7));
    }
    scene.add(this.group);
  }

  update(dt: number): void {
    this.group.children.forEach((cloud, i) => {
      cloud.position.x += this.speeds[i] * dt;
      if (cloud.position.x > this.extent * 1.2) cloud.position.x = -this.extent * 1.2;
    });
  }
}
