/**
 * First-person walkthrough: pointer lock + WASD, Shift to run, F toggles fly
 * (Q/E vertical), gravity with ground clamp. Collision and ground height are
 * delegated to a WalkSurface so both modes can host walks.
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { App } from '../core/App';

export interface WalkSurface {
  groundHeight(x: number, z: number): number;
  resolve?(px: number, pz: number, nx: number, nz: number, radius: number): { x: number; z: number };
  /** Optional hard bounds (terrace rings); positions are clamped inside. */
  clamp?(pos: THREE.Vector3): void;
}

const EYE = 1.7;
const WALK_SPEED = 3.5;
const RUN_SPEED = 9;
const FLY_SPEED = 14;
const GRAVITY = 22;
const RADIUS = 0.4;

export type WalkState = 'off' | 'walking' | 'paused';

export class WalkthroughController {
  private controls: PointerLockControls;
  private keys = new Set<string>();
  private velocityY = 0;
  private flying = false;
  private surface: WalkSurface | null = null;
  state: WalkState = 'off';

  /** UI hooks. */
  onStateChanged: ((state: WalkState) => void) | null = null;

  constructor(private app: App) {
    this.controls = new PointerLockControls(this.app.rig.camera, this.app.renderer.domElement);

    this.controls.addEventListener('lock', () => {
      this.setState('walking');
    });
    this.controls.addEventListener('unlock', () => {
      // Esc pressed (or lock lost): pause rather than exit, so a click resumes.
      if (this.state === 'walking') this.setState('paused');
    });

    window.addEventListener('keydown', (e) => {
      if (this.state !== 'walking') return;
      this.keys.add(e.code);
      if (e.code === 'KeyF') {
        this.flying = !this.flying;
        this.velocityY = 0;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  private setState(s: WalkState): void {
    if (this.state === s) return;
    this.state = s;
    this.onStateChanged?.(s);
  }

  /** Begin walking at a world position (must be called from a user gesture). */
  enter(surface: WalkSurface, spawn: THREE.Vector3Like): void {
    this.surface = surface;
    const ground = surface.groundHeight(spawn.x, spawn.z);
    this.app.rig.orbit.enabled = false;
    this.app.rig.camera.position.set(spawn.x, ground + EYE, spawn.z);
    this.velocityY = 0;
    this.flying = false;
    this.keys.clear();
    this.controls.lock();
    this.setState('walking');
  }

  /** Re-lock after Esc (must be called from a user gesture). */
  resume(): void {
    if (this.state !== 'paused') return;
    this.controls.lock();
  }

  /** Fully exit walkthrough and restore the orbit camera. */
  exit(): void {
    if (this.state === 'off') return;
    if (this.controls.isLocked) this.controls.unlock();
    this.setState('off');
    const cam = this.app.rig.camera;
    // restore an orbit pose looking at where the player stood
    const look = new THREE.Vector3();
    cam.getWorldDirection(look);
    const target = cam.position.clone().add(look.multiplyScalar(10));
    target.y = Math.max(0, cam.position.y - EYE);
    const back = cam.position.clone().sub(target).setLength(60);
    back.y = 45;
    this.app.rig.orbit.enabled = true;
    this.app.rig.setView(target.clone().add(back), target, {});
    this.surface = null;
  }

  get flyMode(): boolean {
    return this.flying;
  }

  update(dt: number): void {
    if (this.state !== 'walking' || !this.surface || dt === 0) return;
    const cam = this.app.rig.camera;

    // wish direction in camera yaw space
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(forward.z * -1, 0, forward.x);

    const wish = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) wish.add(forward);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) wish.sub(forward);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) wish.add(right);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize();

    const speed = this.flying ? FLY_SPEED : this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;

    const px = cam.position.x;
    const pz = cam.position.z;
    let nx = px + wish.x * speed * dt;
    let nz = pz + wish.z * speed * dt;

    if (this.surface.resolve) {
      const r = this.surface.resolve(px, pz, nx, nz, RADIUS);
      nx = r.x;
      nz = r.z;
    }
    cam.position.x = nx;
    cam.position.z = nz;

    if (this.flying) {
      let vy = 0;
      if (this.keys.has('KeyE') || this.keys.has('Space')) vy += FLY_SPEED;
      if (this.keys.has('KeyQ') || this.keys.has('ControlLeft')) vy -= FLY_SPEED;
      cam.position.y += vy * dt;
      const minY = this.surface.groundHeight(nx, nz) + 0.5;
      if (cam.position.y < minY) cam.position.y = minY;
    } else {
      this.velocityY -= GRAVITY * dt;
      cam.position.y += this.velocityY * dt;
      const groundY = this.surface.groundHeight(nx, nz) + EYE;
      if (cam.position.y <= groundY) {
        cam.position.y = groundY;
        this.velocityY = 0;
      }
    }

    this.surface.clamp?.(cam.position);
  }
}
