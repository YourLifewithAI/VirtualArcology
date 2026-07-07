/**
 * Cell occupancy model for the Tessera site. One data structure serves
 * placement validation, serialization, walkthrough collision, and robot pathing.
 */
import type { ModuleDef } from '../catalog/types';

export const CELL_SIZE = 10; // meters

export type Rotation = 0 | 1 | 2 | 3; // quarter turns CCW around +Y

export interface PlacedModule {
  defId: string;
  /** Anchor cell: minimum-x, minimum-z corner of the rotated footprint. */
  x: number;
  z: number;
  rot: Rotation;
  seed: number;
}

/** Rotated footprint dimensions in cells. */
export function rotatedFootprint(def: ModuleDef, rot: Rotation): { w: number; d: number } {
  return rot % 2 === 0 ? { w: def.footprint.w, d: def.footprint.d } : { w: def.footprint.d, d: def.footprint.w };
}

export class Grid {
  /** placementIndex + 1 per cell; 0 = empty. */
  private cells: Int32Array;
  readonly placements: (PlacedModule | null)[] = [];

  constructor(
    readonly width: number,
    readonly depth: number,
  ) {
    this.cells = new Int32Array(width * depth);
  }

  inBounds(x: number, z: number): boolean {
    return x >= 0 && z >= 0 && x < this.width && z < this.depth;
  }

  cellIndexAt(x: number, z: number): number {
    return this.cells[z * this.width + x];
  }

  placementAt(x: number, z: number): PlacedModule | null {
    if (!this.inBounds(x, z)) return null;
    const idx = this.cells[z * this.width + x];
    return idx === 0 ? null : this.placements[idx - 1];
  }

  canPlace(def: ModuleDef, x: number, z: number, rot: Rotation): boolean {
    const { w, d } = rotatedFootprint(def, rot);
    if (x < 0 || z < 0 || x + w > this.width || z + d > this.depth) return false;
    for (let dz = 0; dz < d; dz++) {
      for (let dx = 0; dx < w; dx++) {
        if (this.cells[(z + dz) * this.width + (x + dx)] !== 0) return false;
      }
    }
    return true;
  }

  /** Stamp a placement; returns its index. Caller must have checked canPlace. */
  place(def: ModuleDef, placed: PlacedModule): number {
    const index = this.placements.length;
    this.placements.push(placed);
    this.setCells(def, placed, index + 1);
    return index;
  }

  /** Remove a placement by index (leaves a null hole to keep indices stable). */
  remove(def: ModuleDef, index: number): void {
    const placed = this.placements[index];
    if (!placed) return;
    this.setCells(def, placed, 0);
    this.placements[index] = null;
  }

  /** Re-add a previously removed placement at the same index (undo support). */
  restore(def: ModuleDef, index: number, placed: PlacedModule): void {
    this.placements[index] = placed;
    this.setCells(def, placed, index + 1);
  }

  private setCells(def: ModuleDef, placed: PlacedModule, value: number): void {
    const { w, d } = rotatedFootprint(def, placed.rot);
    for (let dz = 0; dz < d; dz++) {
      for (let dx = 0; dx < w; dx++) {
        this.cells[(placed.z + dz) * this.width + (placed.x + dx)] = value;
      }
    }
  }

  /** World-space center of a placement's rotated footprint (site origin at grid center). */
  placementCenter(def: ModuleDef, placed: PlacedModule): { x: number; z: number } {
    const { w, d } = rotatedFootprint(def, placed.rot);
    return {
      x: (placed.x + w / 2 - this.width / 2) * CELL_SIZE,
      z: (placed.z + d / 2 - this.depth / 2) * CELL_SIZE,
    };
  }

  /** Convert world position to cell coords (may be out of bounds). */
  worldToCell(wx: number, wz: number): { x: number; z: number } {
    return {
      x: Math.floor(wx / CELL_SIZE + this.width / 2),
      z: Math.floor(wz / CELL_SIZE + this.depth / 2),
    };
  }

  activePlacements(): { placed: PlacedModule; index: number }[] {
    const out: { placed: PlacedModule; index: number }[] = [];
    this.placements.forEach((p, i) => {
      if (p) out.push({ placed: p, index: i });
    });
    return out;
  }
}
