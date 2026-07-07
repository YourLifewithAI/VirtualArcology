import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import type { Mode } from './Mode';

export interface AppStats {
  drawCalls: number;
  triangles: number;
  fps: number;
}

export class App {
  readonly renderer: THREE.WebGLRenderer;
  readonly rig: CameraRig;
  private mode: Mode | null = null;
  private lastTime = performance.now();
  private fps = 0;
  private frames = 0;
  private fpsTimer = 0;
  private firstFrameCallbacks: (() => void)[] = [];
  private rendered = false;
  /** Set false (e.g. ?freeze=1) to stop ambient animation for deterministic shots. */
  animate = true;

  constructor(readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.localClippingEnabled = true;
    container.appendChild(this.renderer.domElement);

    this.rig = new CameraRig(this.renderer.domElement);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  setMode(mode: Mode): void {
    if (this.mode === mode) return;
    this.mode?.exit();
    this.mode = mode;
    mode.enter();
  }

  get activeMode(): Mode | null {
    return this.mode;
  }

  onFirstFrame(cb: () => void): void {
    if (this.rendered) cb();
    else this.firstFrameCallbacks.push(cb);
  }

  stats(): AppStats {
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      fps: this.fps,
    };
  }

  private resize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.rig.setAspect(w / h);
  }

  private tick(): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.fpsTimer += dt;
    this.frames++;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
    }

    if (this.mode) {
      this.mode.update(this.animate ? dt : 0);
      this.rig.update();
      this.renderer.render(this.mode.scene, this.rig.camera);
      if (!this.rendered) {
        this.rendered = true;
        this.firstFrameCallbacks.forEach((cb) => cb());
        this.firstFrameCallbacks = [];
      }
    }
  }
}
