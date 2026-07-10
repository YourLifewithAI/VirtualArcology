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
  | { type: 'remove'; index: number; placed: PlacedModule }
  | { type: 'move'; fromIndex: number; from: PlacedModule; toIndex: number; to: PlacedModule }
  | { type: 'bulk-remove'; entries: { index: number; placed: PlacedModule }[] }
  | { type: 'bulk-move'; moves: { fromIndex: number; from: PlacedModule; toIndex: number; to: PlacedModule }[] };

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

  /** Currently inspected placement (click a building with no palette module armed). */
  private selectedPlacementIndex: number | null = null;
  private selectionBox: THREE.Group | null = null;
  /** Set while a building is picked up and following the cursor. */
  private movingFrom: { index: number; placed: PlacedModule } | null = null;

  /** UI hook: called when selection or hover validity changes. */
  onStateChanged: (() => void) | null = null;
  /** UI hook: called when the inspected building changes (null = deselected). */
  onInspect: ((index: number | null, placed: PlacedModule | null) => void) | null = null;
  /** Tried before building inspection on left click (robot picking). Return true to consume. */
  prePick: ((e: PointerEvent) => boolean) | null = null;
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
    if (this.movingFrom) this.cancelMove();
    this.selectedId = defId;
    this.rotation = 0;
    if (defId) this.inspect(null); // arming the ghost dismisses the inspector
    this.refreshGhost();
    this.onStateChanged?.();
  }

  /** Select a placed building for inspection (null clears). */
  inspect(index: number | null): void {
    if (index !== null && !this.mode.grid.placements[index]) index = null;
    if (this.selectedPlacementIndex === index) return;
    this.selectedPlacementIndex = index;
    this.refreshSelectionBox();
    const placed = index !== null ? this.mode.grid.placements[index] : null;
    this.onInspect?.(index, placed);
  }

  get inspectedIndex(): number | null {
    return this.selectedPlacementIndex;
  }

  private refreshSelectionBox(): void {
    if (this.selectionBox) {
      this.mode.scene.remove(this.selectionBox);
      this.selectionBox.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) o.geometry.dispose();
      });
      this.selectionBox = null;
    }
    const index = this.selectedPlacementIndex;
    if (index === null) return;
    const placed = this.mode.grid.placements[index];
    if (!placed) return;
    const def = getModule(placed.defId)!;
    const { w, d } = rotatedFootprint(def, placed.rot);
    const center = this.mode.grid.placementCenter(def, placed);
    const h = Math.max(def.height, 2) + 1;

    const group = new THREE.Group();
    const boxGeom = new THREE.BoxGeometry(w * CELL_SIZE + 0.6, h, d * CELL_SIZE + 0.6);
    boxGeom.translate(0, h / 2, 0);
    const fill = new THREE.Mesh(
      boxGeom,
      new THREE.MeshBasicMaterial({ color: 0xe8b23a, transparent: true, opacity: 0.08, depthWrite: false }),
    );
    fill.renderOrder = 15;
    group.add(fill);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeom),
      new THREE.LineBasicMaterial({ color: 0xe8b23a, transparent: true, opacity: 0.9 }),
    );
    edges.renderOrder = 16;
    group.add(edges);
    group.position.set(center.x, this.mode.ghostHeight(def, placed.x, placed.z, placed.rot) + 0.02, center.z);
    this.mode.scene.add(group);
    this.selectionBox = group;
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
    // undo while carrying a building first puts it back
    if (this.movingFrom) {
      this.cancelMove();
      return;
    }
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    if (cmd.type === 'place') this.mode.removePlacement(cmd.index);
    else if (cmd.type === 'remove') this.mode.restorePlacement(cmd.index, cmd.placed);
    else if (cmd.type === 'bulk-remove') {
      for (const e of cmd.entries) this.mode.restorePlacement(e.index, e.placed);
    } else if (cmd.type === 'bulk-move') {
      for (const mv of cmd.moves) this.mode.removePlacement(mv.toIndex);
      for (const mv of cmd.moves) this.mode.restorePlacement(mv.fromIndex, mv.from);
    } else {
      this.mode.removePlacement(cmd.toIndex);
      this.mode.restorePlacement(cmd.fromIndex, cmd.from);
    }
    this.redoStack.push(cmd);
    this.revalidateInspection();
    this.onStateChanged?.();
  }

  redo(): void {
    if (this.movingFrom) this.cancelMove();
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    if (cmd.type === 'place') this.mode.restorePlacement(cmd.index, cmd.placed);
    else if (cmd.type === 'remove') this.mode.removePlacement(cmd.index);
    else if (cmd.type === 'bulk-remove') {
      for (const e of cmd.entries) this.mode.removePlacement(e.index);
    } else if (cmd.type === 'bulk-move') {
      for (const mv of cmd.moves) this.mode.removePlacement(mv.fromIndex);
      for (const mv of cmd.moves) this.mode.restorePlacement(mv.toIndex, mv.to);
    } else {
      this.mode.removePlacement(cmd.fromIndex);
      this.mode.restorePlacement(cmd.toIndex, cmd.to);
    }
    this.undoStack.push(cmd);
    this.revalidateInspection();
    this.onStateChanged?.();
  }

  /** Record an already-executed bulk operation so Ctrl+Z reverses it as one step. */
  pushBulkCommand(cmd: Command & { type: 'bulk-remove' | 'bulk-move' }): void {
    this.undoStack.push(cmd);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
    this.revalidateInspection();
    this.onStateChanged?.();
  }

  /** Drop the inspection if its placement no longer exists (undo/redo/load). */
  revalidateInspection(): void {
    const index = this.selectedPlacementIndex;
    if (index !== null && !this.mode.grid.placements[index]) {
      this.selectedPlacementIndex = null;
      this.refreshSelectionBox();
      this.onInspect?.(null, null);
    }
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
    this.valid = this.mode.canPlaceModule(def, ax, az, this.rotation);

    const cx = (ax + w / 2 - grid.width / 2) * CELL_SIZE;
    const cz = (az + d / 2 - grid.depth / 2) * CELL_SIZE;
    this.ghost.position.set(cx, this.mode.ghostHeight(def, ax, az, this.rotation) + 0.05, cz);
    this.ghost.visible = true;
    this.setGhostMaterial(this.valid);
  }

  private placementIndexAtPointer(e: PointerEvent): number | null {
    const el = this.app.renderer.domElement;
    this.pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.app.rig.camera);
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.hit)) return null;
    const cell = this.mode.grid.worldToCell(this.hit.x, this.hit.z);
    if (!this.mode.grid.inBounds(cell.x, cell.z)) return null;
    const idx = this.mode.grid.cellIndexAt(cell.x, cell.z);
    return idx === 0 ? null : idx - 1;
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.suspended) return;
    if (e.button === 2) {
      this.deleteAtPointer(e);
      return;
    }
    if (e.button !== 0) return;
    const def = this.def();
    if (!def) {
      // no ghost armed: robots first, then buildings to inspect (or clear)
      if (this.prePick?.(e)) return;
      this.inspect(this.placementIndexAtPointer(e));
      return;
    }
    if (!this.anchor || !this.valid) return;
    const placed: PlacedModule = {
      defId: def.id,
      x: this.anchor.x,
      z: this.anchor.z,
      rot: this.rotation,
      // moved buildings keep their identity (seed); new ones roll a fresh one
      seed: this.movingFrom ? this.movingFrom.placed.seed : Math.floor(Math.random() * 0x7fffffff),
    };
    const index = this.mode.addPlacement(placed);
    if (this.movingFrom) {
      this.undoStack.push({ type: 'move', fromIndex: this.movingFrom.index, from: this.movingFrom.placed, toIndex: index, to: placed });
      this.movingFrom = null;
      this.selectedId = null;
      this.refreshGhost();
      this.inspect(index);
    } else {
      this.undoStack.push({ type: 'place', index, placed });
    }
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
    this.updateGhostPosition(); // re-validate under the ghost
    this.onStateChanged?.();
  }

  private deleteAtPointer(e: PointerEvent): void {
    const index = this.placementIndexAtPointer(e);
    if (index !== null) this.removePlacementWithUndo(index);
  }

  private removePlacementWithUndo(index: number): void {
    const placed = this.mode.removePlacement(index);
    if (!placed) return;
    if (this.selectedPlacementIndex === index) this.inspect(null);
    this.undoStack.push({ type: 'remove', index, placed });
    this.redoStack = [];
    this.updateGhostPosition();
    this.onStateChanged?.();
  }

  /** Remove the currently inspected building (inspector delete button / Delete key). */
  removeInspected(): void {
    if (this.selectedPlacementIndex !== null) this.removePlacementWithUndo(this.selectedPlacementIndex);
  }

  get isMoving(): boolean {
    return this.movingFrom !== null;
  }

  /** Pick up the inspected building: it follows the cursor as a ghost until dropped. */
  startMoveInspected(): void {
    const index = this.selectedPlacementIndex;
    if (index === null || this.movingFrom) return;
    const placed = this.mode.grid.placements[index];
    if (!placed) return;
    this.inspect(null);
    this.mode.removePlacement(index);
    this.movingFrom = { index, placed };
    this.selectedId = placed.defId;
    this.rotation = placed.rot;
    this.refreshGhost();
    this.updateGhostPosition();
    this.onStateChanged?.();
  }

  /** Put a picked-up building back where it came from. */
  cancelMove(): void {
    if (!this.movingFrom) return;
    const { index, placed } = this.movingFrom;
    this.movingFrom = null;
    this.selectedId = null;
    this.refreshGhost();
    this.mode.restorePlacement(index, placed);
    this.inspect(index);
    this.onStateChanged?.();
  }

  /** Rotate the inspected building in place (center-preserving) if it fits. */
  rotateInspected(): boolean {
    const index = this.selectedPlacementIndex;
    if (index === null) return false;
    const placed = this.mode.grid.placements[index];
    if (!placed) return false;
    const def = getModule(placed.defId)!;
    const { w, d } = rotatedFootprint(def, placed.rot);
    const newRot = ((placed.rot + 1) % 4) as Rotation;
    const nf = rotatedFootprint(def, newRot);
    const to: PlacedModule = {
      ...placed,
      rot: newRot,
      x: Math.round(placed.x + w / 2 - nf.w / 2),
      z: Math.round(placed.z + d / 2 - nf.d / 2),
    };
    this.mode.removePlacement(index);
    if (!this.mode.canPlaceModule(def, to.x, to.z, to.rot)) {
      this.mode.restorePlacement(index, placed);
      this.inspect(index);
      return false;
    }
    const toIndex = this.mode.addPlacement(to);
    this.undoStack.push({ type: 'move', fromIndex: index, from: placed, toIndex, to });
    this.redoStack = [];
    this.inspect(toIndex);
    this.onStateChanged?.();
    return true;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.suspended) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (e.key === 'r' || e.key === 'R') {
      if (this.selectedId) this.rotate();
      else if (this.selectedPlacementIndex !== null) this.rotateInspected();
    } else if (e.key === 'm' || e.key === 'M') {
      this.startMoveInspected();
    } else if (e.key === 'Escape') {
      if (this.movingFrom) this.cancelMove();
      else if (this.selectedPlacementIndex !== null) this.inspect(null);
      else this.select(null);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      this.removeInspected();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      this.undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      this.redo();
    }
  }
}
