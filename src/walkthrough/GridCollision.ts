/**
 * Tile-based collision against the occupancy grid: the player is a circle,
 * non-walkable occupied cells are solid squares. Axis-separated push-out.
 */
import { CELL_SIZE, type Grid } from '../tessera/Grid';
import { getModule } from '../catalog/ModuleCatalog';
import type { WalkSurface } from './WalkthroughController';

export class GridCollision implements WalkSurface {
  constructor(private grid: Grid) {}

  groundHeight(): number {
    return 0;
  }

  private solidAt(cx: number, cz: number): boolean {
    if (!this.grid.inBounds(cx, cz)) return false; // meadow is open
    const placed = this.grid.placementAt(cx, cz);
    if (!placed) return false;
    const def = getModule(placed.defId);
    return def ? !def.walkable : false;
  }

  /** Move from (px,pz) toward (nx,nz); returns the allowed position. */
  resolve(px: number, pz: number, nx: number, nz: number, radius: number): { x: number; z: number } {
    const half = (this.grid.width * CELL_SIZE) / 2;
    const toCell = (w: number): number => Math.floor((w + half) / CELL_SIZE);
    const blockedCircle = (x: number, z: number): boolean => {
      const minCx = toCell(x - radius);
      const maxCx = toCell(x + radius);
      const minCz = toCell(z - radius);
      const maxCz = toCell(z + radius);
      for (let cz = minCz; cz <= maxCz; cz++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          if (!this.solidAt(cx, cz)) continue;
          // circle vs cell AABB
          const cellMinX = cx * CELL_SIZE - half;
          const cellMinZ = cz * CELL_SIZE - half;
          const closestX = Math.max(cellMinX, Math.min(x, cellMinX + CELL_SIZE));
          const closestZ = Math.max(cellMinZ, Math.min(z, cellMinZ + CELL_SIZE));
          const dx = x - closestX;
          const dz = z - closestZ;
          if (dx * dx + dz * dz < radius * radius) return true;
        }
      }
      return false;
    };

    // axis-separated: try x then z
    let x = px;
    let z = pz;
    if (!blockedCircle(nx, z)) x = nx;
    if (!blockedCircle(x, nz)) z = nz;
    return { x, z };
  }
}
