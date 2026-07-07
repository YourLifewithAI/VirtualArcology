/**
 * Owns the single PerspectiveCamera and the orbit controls.
 * Walkthrough (pointer lock) temporarily disables orbit and drives the camera
 * directly; on exit the rig restores a sane orbit pose behind the player.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  readonly orbit: OrbitControls;

  constructor(canvas: HTMLElement) {
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.5, 5000);
    this.orbit = new OrbitControls(this.camera, canvas);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle = Math.PI * 0.495;
  }

  setView(
    pos: THREE.Vector3Like,
    target: THREE.Vector3Like,
    opts?: { near?: number; far?: number; minDistance?: number; maxDistance?: number },
  ): void {
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.orbit.target.set(target.x, target.y, target.z);
    if (opts?.near !== undefined) this.camera.near = opts.near;
    if (opts?.far !== undefined) this.camera.far = opts.far;
    this.camera.updateProjectionMatrix();
    this.orbit.minDistance = opts?.minDistance ?? 2;
    this.orbit.maxDistance = opts?.maxDistance ?? Infinity;
    this.orbit.update();
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    if (this.orbit.enabled) this.orbit.update();
  }
}
