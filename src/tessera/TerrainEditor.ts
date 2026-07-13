/**
 * Landform mode: the SimCity terrain layer. Buildings vanish, the land stays,
 * and a brush raises, lowers, levels, smooths, floods, or drains it. On exit,
 * placements whose ground became too steep or flooded are deleted (the mode
 * says so up front) and everything else re-seats on the new grades.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import type { PlacementController } from './PlacementController';
import type { BrushTool } from './SiteTerrain';
import type { TesseraMode } from './TesseraMode';

const TOOLS: { key: BrushTool; label: string; hint: string }[] = [
  { key: 'raise', label: '⬆ Raise', hint: 'pull the ground up' },
  { key: 'lower', label: '⬇ Lower', hint: 'press the ground down' },
  { key: 'level', label: '▬ Level', hint: 'drag ground toward the elevation you first press on' },
  { key: 'smooth', label: '∿ Smooth', hint: 'soften sharp edges (keeps the overall height)' },
  { key: 'lake', label: '💧 Lake', hint: 'carve a basin and fill it' },
  { key: 'drain', label: '◌ Drain', hint: 'remove water' },
];

export class TerrainEditor {
  active = false;
  private tool: BrushTool = 'raise';
  private radius = 3;
  private painting = false;
  private levelTarget = 0;
  private cursor: THREE.Mesh;
  private panel: HTMLDivElement;
  private readoutEl: HTMLElement | null = null;
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private pointer = new THREE.Vector2();
  private hit = new THREE.Vector3();
  private lastPaint = 0;

  /** UI hooks. */
  onChanged: (() => void) | null = null;
  onToast: ((msg: string) => void) | null = null;

  constructor(
    private app: App,
    private mode: TesseraMode,
    private placement: PlacementController,
    uiRoot: HTMLElement,
  ) {
    this.cursor = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xe8b23a, transparent: true, opacity: 0.9, depthTest: false }),
    );
    this.cursor.renderOrder = 40;
    this.cursor.visible = false;
    mode.scene.add(this.cursor);

    this.panel = document.createElement('div');
    this.panel.className = 'va-landform';
    this.panel.style.display = 'none';
    uiRoot.appendChild(this.panel);

    const el = app.renderer.domElement;
    el.addEventListener('pointerdown', (e) => this.onDown(e));
    el.addEventListener('pointermove', (e) => this.onMove(e));
    el.addEventListener('pointerup', () => {
      this.painting = false;
    });
    window.addEventListener('keydown', (e) => {
      if (this.active && e.key === 'Escape') this.setActive(false);
    });
  }

  setActive(on: boolean): void {
    if (this.active === on) return;
    this.active = on;
    if (on) {
      this.placement.select(null);
      this.placement.inspect(null);
      this.placement.suspended = true;
      this.app.rig.orbit.enableRotate = false; // left mouse paints; pan/zoom still work
      this.mode.setBuildingsVisible(false);
      this.renderPanel();
      this.panel.style.display = '';
      this.onToast?.('Landform mode — buildings hidden while you shape the land');
    } else {
      this.painting = false;
      this.cursor.visible = false;
      this.panel.style.display = 'none';
      this.app.rig.orbit.enableRotate = true;
      this.mode.setBuildingsVisible(true);
      const removed = this.mode.validatePlacementsAfterTerrain();
      if (removed > 0) {
        // indices died with the deletions; a stale undo stack is worse than none
        this.placement.resetHistory();
        this.placement.revalidateInspection();
        this.onToast?.(`Regrading removed ${removed} building${removed === 1 ? '' : 's'} on too-steep or flooded ground`);
      }
      this.placement.suspended = false;
    }
    this.onChanged?.();
  }

  private renderPanel(): void {
    this.panel.innerHTML = `
      <b>Landform</b>
      <div class="tools">${TOOLS.map(
        (t) => `<button class="va-btn tool${t.key === this.tool ? ' active' : ''}" data-tool="${t.key}" title="${t.hint}">${t.label}</button>`,
      ).join('')}</div>
      <label>Brush <input type="range" min="1" max="6" step="1" value="${this.radius}" class="radius"/> ${this.radius} cell${this.radius > 1 ? 's' : ''}</label>
      <div class="readout">&nbsp;</div>
      <div class="note">Drag on the site to paint · on exit, drowned or too-steep buildings go, the rest re-grade their pads · <b>Esc</b> exits</div>`;
    this.readoutEl = this.panel.querySelector('.readout');
    for (const btn of this.panel.querySelectorAll<HTMLButtonElement>('.tool')) {
      btn.onclick = () => {
        this.tool = btn.dataset.tool as BrushTool;
        this.renderPanel();
      };
    }
    (this.panel.querySelector('.radius') as HTMLInputElement).oninput = (e) => {
      this.radius = parseInt((e.target as HTMLInputElement).value, 10);
      this.renderPanel();
    };
  }

  private groundPoint(e: PointerEvent): THREE.Vector3 | null {
    const el = this.app.renderer.domElement;
    this.pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.app.rig.camera);
    return this.raycaster.ray.intersectPlane(this.plane, this.hit) ? this.hit : null;
  }

  private fmtElevation(h: number): string {
    return `${h >= 0 ? '+' : '−'}${Math.abs(h).toFixed(1)} m`;
  }

  private updateReadout(p: THREE.Vector3): void {
    if (!this.readoutEl) return;
    this.readoutEl.textContent =
      this.painting && this.tool === 'level'
        ? `Leveling to ${this.fmtElevation(this.levelTarget)}`
        : `Ground ${this.fmtElevation(this.mode.site.sample(p.x, p.z))}`;
  }

  private onDown(e: PointerEvent): void {
    if (!this.active || e.button !== 0) return;
    const p = this.groundPoint(e);
    if (!p) return;
    this.painting = true;
    this.levelTarget = this.mode.site.sample(p.x, p.z); // Level tool matches first-press height
    this.updateReadout(p);
    this.paint(p);
  }

  private onMove(e: PointerEvent): void {
    if (!this.active) return;
    const p = this.groundPoint(e);
    if (!p) {
      this.cursor.visible = false;
      return;
    }
    const r = this.radius * 10;
    this.cursor.scale.set(r, 1, r);
    this.cursor.position.set(p.x, this.mode.site.sample(p.x, p.z) + 0.5, p.z);
    this.cursor.visible = true;
    this.updateReadout(p);
    if (this.painting) {
      const now = performance.now();
      if (now - this.lastPaint > 40) {
        this.lastPaint = now;
        this.paint(p);
      }
    }
  }

  private paint(p: THREE.Vector3): void {
    if (this.mode.site.brush(this.tool, p.x, p.z, this.radius, this.levelTarget)) {
      this.mode.refreshSiteGround();
    }
  }
}
