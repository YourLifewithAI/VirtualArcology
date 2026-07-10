/**
 * Box select: arm from the toolbar, drag a rectangle over the map, and every
 * building it touches is selected. Delete removes the whole set in one
 * undoable step; M picks the set up as a group that follows the cursor
 * (green = the whole block fits, red = something collides) and click drops it.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import { getModule } from '../catalog/ModuleCatalog';
import { CELL_SIZE, rotatedFootprint, type PlacedModule } from './Grid';
import type { PlacementController } from './PlacementController';
import type { TesseraMode } from './TesseraMode';

interface CarryEntry {
  index: number;
  placed: PlacedModule;
  w: number;
  d: number;
}

export class MarqueeSelection {
  active = false;
  private dragging = false;
  private startCell: { x: number; z: number } | null = null;
  private endCell: { x: number; z: number } | null = null;
  private selected: number[] = [];
  private rect: THREE.Mesh;
  private highlight: THREE.Group | null = null;
  /** Set while the selection is picked up and following the cursor. */
  private carrying: CarryEntry[] | null = null;
  private carryGhost: THREE.Group | null = null;
  private carryRef: { x: number; z: number } = { x: 0, z: 0 };
  private carryDelta: { dx: number; dz: number } = { dx: 0, dz: 0 };
  private carryValid = false;

  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private pointer = new THREE.Vector2();
  private hit = new THREE.Vector3();

  /** UI hook: selection/carry state changed (update hints + toolbar). */
  onChanged: (() => void) | null = null;
  /** UI hook: toast messages ("12 buildings deleted"). */
  onToast: ((msg: string) => void) | null = null;

  constructor(
    private app: App,
    private mode: TesseraMode,
    private placement: PlacementController,
  ) {
    this.rect = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xe8b23a, transparent: true, opacity: 0.16, depthWrite: false }),
    );
    this.rect.visible = false;
    this.rect.renderOrder = 28;
    mode.scene.add(this.rect);

    const el = app.renderer.domElement;
    el.addEventListener('pointerdown', (e) => this.onDown(e));
    el.addEventListener('pointermove', (e) => this.onMove(e));
    el.addEventListener('pointerup', () => this.onUp());
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  get count(): number {
    return this.selected.length;
  }

  get isCarrying(): boolean {
    return this.carrying !== null;
  }

  setActive(on: boolean): void {
    if (this.active === on) return;
    this.active = on;
    if (on) {
      this.placement.select(null);
      this.placement.inspect(null);
      this.placement.suspended = true;
      this.app.rig.orbit.enabled = false;
    } else {
      if (this.carrying) this.cancelCarry();
      this.clearSelection();
      this.placement.suspended = false;
      this.app.rig.orbit.enabled = true;
    }
    this.onChanged?.();
  }

  private ground(e: PointerEvent): { x: number; z: number } | null {
    const el = this.app.renderer.domElement;
    this.pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.app.rig.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, this.hit)) return null;
    return this.mode.grid.worldToCell(this.hit.x, this.hit.z);
  }

  // -- selection ------------------------------------------------------------

  private onDown(e: PointerEvent): void {
    if (!this.active || e.button !== 0) return;
    if (this.carrying) {
      this.commitCarry();
      return;
    }
    const c = this.ground(e);
    if (!c) return;
    this.dragging = true;
    this.startCell = c;
    this.endCell = c;
    this.updateRect();
  }

  private onMove(e: PointerEvent): void {
    if (!this.active) return;
    if (this.carrying) {
      const c = this.ground(e);
      if (c) this.updateCarry(c);
      return;
    }
    if (!this.dragging) return;
    const c = this.ground(e);
    if (!c) return;
    this.endCell = c;
    this.updateRect();
  }

  private onUp(): void {
    if (!this.active || !this.dragging) return;
    this.dragging = false;
    this.rect.visible = false;
    if (!this.startCell || !this.endCell) return;
    const x0 = Math.min(this.startCell.x, this.endCell.x);
    const x1 = Math.max(this.startCell.x, this.endCell.x);
    const z0 = Math.min(this.startCell.z, this.endCell.z);
    const z1 = Math.max(this.startCell.z, this.endCell.z);
    this.selected = [];
    for (const { placed, index } of this.mode.grid.activePlacements()) {
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      if (placed.x <= x1 && placed.x + w - 1 >= x0 && placed.z <= z1 && placed.z + d - 1 >= z0) {
        this.selected.push(index);
      }
    }
    this.refreshHighlight();
    this.onChanged?.();
  }

  private updateRect(): void {
    if (!this.startCell || !this.endCell) return;
    const grid = this.mode.grid;
    const x0 = Math.min(this.startCell.x, this.endCell.x);
    const x1 = Math.max(this.startCell.x, this.endCell.x);
    const z0 = Math.min(this.startCell.z, this.endCell.z);
    const z1 = Math.max(this.startCell.z, this.endCell.z);
    const w = (x1 - x0 + 1) * CELL_SIZE;
    const d = (z1 - z0 + 1) * CELL_SIZE;
    this.rect.scale.set(w, 1, d);
    this.rect.position.set((x0 + (x1 - x0 + 1) / 2 - grid.width / 2) * CELL_SIZE, 0.3, (z0 + (z1 - z0 + 1) / 2 - grid.depth / 2) * CELL_SIZE);
    this.rect.visible = true;
  }

  /** Drop indices whose placements vanished (external undo/redo/load). */
  private prune(): void {
    this.selected = this.selected.filter((i) => this.mode.grid.placements[i]);
  }

  private clearSelection(): void {
    this.selected = [];
    this.refreshHighlight();
  }

  private refreshHighlight(): void {
    if (this.highlight) {
      this.mode.scene.remove(this.highlight);
      this.highlight.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      this.highlight = null;
    }
    this.prune();
    if (this.selected.length === 0) return;
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xe8b23a, transparent: true, opacity: 0.16, depthWrite: false });
    for (const index of this.selected) {
      const placed = this.mode.grid.placements[index]!;
      const def = getModule(placed.defId)!;
      const { w, d } = rotatedFootprint(def, placed.rot);
      const h = Math.min(Math.max(def.height, 2) + 1, 30);
      const geom = new THREE.BoxGeometry(w * CELL_SIZE + 0.4, h, d * CELL_SIZE + 0.4);
      const center = this.mode.grid.placementCenter(def, placed);
      geom.translate(center.x, h / 2, center.z);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.renderOrder = 15;
      group.add(mesh);
    }
    this.mode.scene.add(group);
    this.highlight = group;
  }

  // -- bulk delete ------------------------------------------------------------

  deleteSelection(): void {
    this.prune();
    if (this.selected.length === 0) return;
    const entries: { index: number; placed: PlacedModule }[] = [];
    for (const index of this.selected) {
      const placed = this.mode.removePlacement(index);
      if (placed) entries.push({ index, placed });
    }
    this.placement.pushBulkCommand({ type: 'bulk-remove', entries });
    this.onToast?.(`${entries.length} building${entries.length === 1 ? '' : 's'} deleted — Ctrl+Z undoes the whole batch`);
    this.clearSelection();
    this.onChanged?.();
  }

  // -- bulk move --------------------------------------------------------------

  startCarry(): void {
    this.prune();
    if (this.selected.length === 0 || this.carrying) return;
    const entries: CarryEntry[] = [];
    for (const index of this.selected) {
      const placed = this.mode.grid.placements[index]!;
      const def = getModule(placed.defId)!;
      const { w, d } = rotatedFootprint(def, placed.rot);
      entries.push({ index, placed, w, d });
    }
    // reference = min corner of the group's bounding box
    this.carryRef = {
      x: Math.min(...entries.map((e) => e.placed.x)),
      z: Math.min(...entries.map((e) => e.placed.z)),
    };
    for (const e of entries) this.mode.removePlacement(e.index);
    this.carrying = entries;
    this.carryDelta = { dx: 0, dz: 0 };
    this.clearSelection();
    this.buildCarryGhost();
    this.updateCarryGhost();
    this.onChanged?.();
  }

  private buildCarryGhost(): void {
    this.disposeCarryGhost();
    if (!this.carrying) return;
    const group = new THREE.Group();
    for (const e of this.carrying) {
      const h = Math.min(Math.max(getModule(e.placed.defId)?.height ?? 4, 2), 24);
      const geom = new THREE.BoxGeometry(e.w * CELL_SIZE - 0.6, h, e.d * CELL_SIZE - 0.6);
      geom.translate(
        (e.placed.x - this.carryRef.x + e.w / 2) * CELL_SIZE,
        h / 2,
        (e.placed.z - this.carryRef.z + e.d / 2) * CELL_SIZE,
      );
      const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false }));
      mesh.renderOrder = 22;
      group.add(mesh);
    }
    this.mode.scene.add(group);
    this.carryGhost = group;
  }

  private updateCarry(cell: { x: number; z: number }): void {
    if (!this.carrying) return;
    this.carryDelta = { dx: cell.x - this.carryRef.x, dz: cell.z - this.carryRef.z };
    this.updateCarryGhost();
  }

  private updateCarryGhost(): void {
    if (!this.carrying || !this.carryGhost) return;
    const grid = this.mode.grid;
    const { dx, dz } = this.carryDelta;
    this.carryValid = this.carrying.every((e) => {
      const def = getModule(e.placed.defId);
      return def && this.mode.canPlaceModule(def, e.placed.x + dx, e.placed.z + dz, e.placed.rot);
    });
    this.carryGhost.position.set(
      (this.carryRef.x + dx - grid.width / 2) * CELL_SIZE,
      0.05,
      (this.carryRef.z + dz - grid.depth / 2) * CELL_SIZE,
    );
    const color = this.carryValid ? 0x4fdc7c : 0xe0523e;
    this.carryGhost.traverse((o) => {
      if (o instanceof THREE.Mesh) (o.material as THREE.MeshBasicMaterial).color.setHex(color);
    });
  }

  private commitCarry(): void {
    if (!this.carrying) return;
    if (!this.carryValid) {
      this.onToast?.("The block doesn't fit there — red means something collides");
      return;
    }
    const { dx, dz } = this.carryDelta;
    const moves: { fromIndex: number; from: PlacedModule; toIndex: number; to: PlacedModule }[] = [];
    for (const e of this.carrying) {
      const to: PlacedModule = { ...e.placed, x: e.placed.x + dx, z: e.placed.z + dz };
      const toIndex = this.mode.addPlacement(to);
      moves.push({ fromIndex: e.index, from: e.placed, toIndex, to });
    }
    this.placement.pushBulkCommand({ type: 'bulk-move', moves });
    this.onToast?.(`Moved ${moves.length} building${moves.length === 1 ? '' : 's'} — Ctrl+Z undoes the whole batch`);
    this.carrying = null;
    this.disposeCarryGhost();
    this.selected = moves.map((m) => m.toIndex);
    this.refreshHighlight();
    this.onChanged?.();
  }

  cancelCarry(): void {
    if (!this.carrying) return;
    for (const e of this.carrying) this.mode.restorePlacement(e.index, e.placed);
    this.selected = this.carrying.map((e) => e.index);
    this.carrying = null;
    this.disposeCarryGhost();
    this.refreshHighlight();
    this.onChanged?.();
  }

  private disposeCarryGhost(): void {
    if (!this.carryGhost) return;
    this.mode.scene.remove(this.carryGhost);
    this.carryGhost.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.carryGhost = null;
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.active) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!this.carrying) this.deleteSelection();
    } else if (e.key === 'm' || e.key === 'M') {
      this.startCarry();
    } else if (e.key === 'Escape') {
      if (this.carrying) this.cancelCarry();
      else if (this.selected.length > 0) {
        this.clearSelection();
        this.onChanged?.();
      } else {
        this.setActive(false);
      }
    }
  }
}
