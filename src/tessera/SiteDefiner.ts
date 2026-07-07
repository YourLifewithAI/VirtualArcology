/**
 * Drag-to-define site footprint: outline a rectangle on the meadow, watch the
 * live m² readout, confirm to start a fresh Tessera of that size.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import { CELL_SIZE } from './Grid';
import type { TesseraMode } from './TesseraMode';

const MIN_CELLS = 12;
const MAX_CELLS = 96;

export class SiteDefiner {
  active = false;
  private startWorld: THREE.Vector3 | null = null;
  private endWorld: THREE.Vector3 | null = null;
  private dragging = false;
  private rect: THREE.Mesh;
  private outline: THREE.LineLoop;
  private popup: HTMLDivElement;
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private pointer = new THREE.Vector2();
  private hit = new THREE.Vector3();

  /** Called with confirmed dimensions in cells. */
  onConfirm: ((w: number, d: number) => void) | null = null;
  onExit: (() => void) | null = null;

  constructor(
    private app: App,
    mode: TesseraMode,
    uiRoot: HTMLElement,
  ) {
    this.rect = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x7fb069, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    this.rect.visible = false;
    this.rect.renderOrder = 30;
    mode.scene.add(this.rect);

    const og = new THREE.BufferGeometry();
    og.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5]), 3),
    );
    this.outline = new THREE.LineLoop(og, new THREE.LineBasicMaterial({ color: 0x7fb069 }));
    this.outline.visible = false;
    this.outline.renderOrder = 31;
    mode.scene.add(this.outline);

    this.popup = document.createElement('div');
    this.popup.className = 'va-sitepop';
    this.popup.style.display = 'none';
    uiRoot.appendChild(this.popup);

    const el = app.renderer.domElement;
    el.addEventListener('pointerdown', (e) => this.onDown(e));
    el.addEventListener('pointermove', (e) => this.onMove(e));
    el.addEventListener('pointerup', () => this.onUp());
    window.addEventListener('keydown', (e) => {
      if (this.active && e.key === 'Escape') this.exit();
    });
  }

  begin(): void {
    this.active = true;
    this.dragging = false;
    this.app.rig.orbit.enabled = false;
    this.popup.style.display = '';
    this.popup.style.left = '50%';
    this.popup.style.top = '80px';
    this.popup.innerHTML = '<b>Drag</b> on the ground to outline the new site · <b>Esc</b> to cancel';
  }

  exit(): void {
    this.active = false;
    this.dragging = false;
    this.rect.visible = false;
    this.outline.visible = false;
    this.popup.style.display = 'none';
    this.app.rig.orbit.enabled = true;
    this.onExit?.();
  }

  private ground(e: PointerEvent): THREE.Vector3 | null {
    const el = this.app.renderer.domElement;
    this.pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.app.rig.camera);
    return this.raycaster.ray.intersectPlane(this.plane, this.hit) ? this.hit.clone() : null;
  }

  private dims(): { w: number; d: number } {
    const a = this.startWorld!;
    const b = this.endWorld!;
    const w = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(Math.abs(b.x - a.x) / CELL_SIZE)));
    const d = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(Math.abs(b.z - a.z) / CELL_SIZE)));
    return { w, d };
  }

  private onDown(e: PointerEvent): void {
    if (!this.active || e.button !== 0) return;
    const p = this.ground(e);
    if (!p) return;
    this.startWorld = p;
    this.endWorld = p.clone();
    this.dragging = true;
  }

  private onMove(e: PointerEvent): void {
    if (!this.active || !this.dragging || !this.startWorld) return;
    const p = this.ground(e);
    if (!p) return;
    this.endWorld = p;
    const { w, d } = this.dims();
    const cx = (this.startWorld.x + this.endWorld.x) / 2;
    const cz = (this.startWorld.z + this.endWorld.z) / 2;
    for (const obj of [this.rect, this.outline]) {
      obj.visible = true;
      obj.position.set(cx, 0.25, cz);
      obj.scale.set(w * CELL_SIZE, 1, d * CELL_SIZE);
    }
    const m2 = w * d * CELL_SIZE * CELL_SIZE;
    this.popup.style.left = `${e.clientX + 18}px`;
    this.popup.style.top = `${e.clientY - 10}px`;
    this.popup.innerHTML = `<b>${w * CELL_SIZE} × ${d * CELL_SIZE} m</b> · ${m2.toLocaleString()} m² (${(m2 / 10000).toFixed(1)} ha) · ${w}×${d} cells`;
  }

  private onUp(): void {
    if (!this.active || !this.dragging || !this.startWorld || !this.endWorld) return;
    this.dragging = false;
    const { w, d } = this.dims();
    const m2 = w * d * CELL_SIZE * CELL_SIZE;
    this.popup.style.left = '50%';
    this.popup.style.top = '100px';
    this.popup.innerHTML = `
      Start a fresh <b>${w * CELL_SIZE} × ${d * CELL_SIZE} m</b> site (${(m2 / 10000).toFixed(1)} ha)?<br/>
      <span style="opacity:.7">This clears the current layout — Save first if you want to keep it.</span><br/>
      <button class="va-btn ok">Create site</button>
      <button class="va-btn cancel">Cancel</button>`;
    (this.popup.querySelector('.ok') as HTMLButtonElement).onclick = () => {
      this.exit();
      this.onConfirm?.(w, d);
    };
    (this.popup.querySelector('.cancel') as HTMLButtonElement).onclick = () => this.exit();
  }
}
