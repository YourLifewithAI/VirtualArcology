/**
 * Interactive placement: raycast the ground plane, snap to cells, show a
 * ghost preview (green = valid, red = blocked), place/rotate/delete/undo.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import { MATERIALS } from '../core/Materials';
import { Rng } from '../core/Rng';
import { getModule } from '../catalog/ModuleCatalog';
import type { ModuleDef } from '../catalog/types';
import { CELL_SIZE, rotatedFootprint, type PlacedModule, type Rotation } from './Grid';
import type { TesseraMode } from './TesseraMode';

type Command =
  | { type: 'place'; index: number; placed: PlacedModule }
  | { type: 'remove'; index: number; placed: PlacedModule };

export class PlacementController {
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private pointer = new THREE.Vector2();
  private hit = new THREE.Vector3();

  private selectedId: string | null = null;
  private rotation: Rotation = 0;
  private ghost: THREE.Group | null = null;
  private ghostFor = '';
  private anchor: { x: number; z: number } | null = null;
  private valid = false;

  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  /** UI hook: called when selection or hover validity changes. */
  onStateChanged: (() => void) | null = null;
  /** When true (walkthrough active), all builder input is ignored. */
  suspended = false;

  constructor(
    private app: App,
    private mode: TesseraMode,
  ) {
    const el = app.renderer.domElement;
    el.addEventListener('pointermove', (e) => this.onPointerMove(e));
    el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  get selected(): string | null {
    return this.selectedId;
  }

  select(defId: string | null): void {
    if (defId && !getModule(defId)) return;
    this.selectedId = defId;
    this.rotation = 0;
    this.refreshGhost();
    this.onStateChanged?.();
  }

  rotate(): void {
    this.rotation = ((this.rotation + 1) % 4) as Rotation;
    this.refreshGhost();
    this.updateGhostPosition();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    if (cmd.type === 'place') this.mode.removePlacement(cmd.index);
    else this.mode.restorePlacement(cmd.index, cmd.placed);
    this.redoStack.push(cmd);
    this.onStateChanged?.();
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    if (cmd.type === 'place') this.mode.restorePlacement(cmd.index, cmd.placed);
    else this.mode.removePlacement(cmd.index);
    this.undoStack.push(cmd);
    this.onStateChanged?.();
  }

  /** Clear undo history (e.g. after loading a layout). */
  resetHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.onStateChanged?.();
  }

  private def(): ModuleDef | null {
    return this.selectedId ? (getModule(this.selectedId) ?? null) : null;
  }

  private refreshGhost(): void {
    const def = this.def();
    const key = def ? `${def.id}:${this.rotation}` : '';
    if (this.ghostFor === key) return;
    if (this.ghost) {
      this.mode.scene.remove(this.ghost);
      this.ghost.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      this.ghost = null;
    }
    this.ghostFor = key;
    if (!def) return;

    const built = def.build(new Rng(7));
    const group = new THREE.Group();
    for (const layer of ['opaque', 'glass', 'emissive'] as const) {
      const geom = built[layer];
      if (!geom) continue;
      const mesh = new THREE.Mesh(geom, MATERIALS.ghostValid);
      mesh.renderOrder = 20;
      group.add(mesh);
    }
    group.rotation.y = (Math.PI / 2) * this.rotation;
    group.visible = false;
    this.mode.scene.add(group);
    this.ghost = group;
  }

  private setGhostMaterial(valid: boolean): void {
    if (!this.ghost) return;
    const mat = valid ? MATERIALS.ghostValid : MATERIALS.ghostInvalid;
    this.ghost.traverse((o) => {
      if (o instanceof THREE.Mesh) o.material = mat;
    });
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.suspended) return;
    const el = this.app.renderer.domElement;
    this.pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
    this.updateGhostPosition();
  }

  private updateGhostPosition(): void {
    const def = this.def();
    if (!def || !this.ghost) return;
    this.raycaster.setFromCamera(this.pointer, this.app.rig.camera);
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.hit)) {
      this.ghost.visible = false;
      this.anchor = null;
      return;
    }
    const grid = this.mode.grid;
    const { w, d } = rotatedFootprint(def, this.rotation);
    // anchor so the footprint centers on the pointer
    const cell = grid.worldToCell(this.hit.x, this.hit.z);
    const ax = cell.x - Math.floor((w - 1) / 2);
    const az = cell.z - Math.floor((d - 1) / 2);
    this.anchor = { x: ax, z: az };
    this.valid = grid.canPlace(def, ax, az, this.rotation);

    const cx = (ax + w / 2 - grid.width / 2) * CELL_SIZE;
    const cz = (az + d / 2 - grid.depth / 2) * CELL_SIZE;
    this.ghost.position.set(cx, 0.05, cz);
    this.ghost.visible = true;
    this.setGhostMaterial(this.valid);
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.suspended) return;
    if (e.button === 2) {
      this.deleteAtPointer(e);
      return;
    }
    if (e.button !== 0) return;
    const def = this.def();
    if (!def || !this.anchor || !this.valid) return;
    const placed: PlacedModule = {
      defId: def.id,
      x: this.anchor.x,
      z: this.anchor.z,
      rot: this.rotation,
      seed: Math.floor(Math.random() * 0x7fffffff),
    };
    const index = this.mode.addPlacement(placed);
    this.undoStack.push({ type: 'place', index, placed });
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
    this.updateGhostPosition(); // re-validate under the ghost
    this.onStateChanged?.();
  }

  private deleteAtPointer(e: PointerEvent): void {
    const el = this.app.renderer.domElement;
    this.pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.app.rig.camera);
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.hit)) return;
    const cell = this.mode.grid.worldToCell(this.hit.x, this.hit.z);
    if (!this.mode.grid.inBounds(cell.x, cell.z)) return;
    const idx = this.mode.grid.cellIndexAt(cell.x, cell.z);
    if (idx === 0) return;
    const index = idx - 1;
    const placed = this.mode.removePlacement(index);
    if (placed) {
      this.undoStack.push({ type: 'remove', index, placed });
      this.redoStack = [];
      this.updateGhostPosition();
      this.onStateChanged?.();
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.suspended) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (e.key === 'r' || e.key === 'R') {
      this.rotate();
    } else if (e.key === 'Escape') {
      this.select(null);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      this.undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      this.redo();
    }
  }
}
