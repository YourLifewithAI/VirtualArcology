/**
 * Editable terrain under the city itself: a heightfield on grid-cell corners,
 * SimCity-style. The site perimeter is pinned to the regional datum (0) so
 * the land always meets the surrounding landscape cleanly; everything inside
 * can be raised, lowered, leveled, smoothed, or flooded. Buildings grade a
 * flat pad into whatever they're placed on; streets, orchards, and parks
 * conform to slopes instead.
 */
import { CELL_SIZE } from './Grid';

export type BrushTool = 'raise' | 'lower' | 'level' | 'smooth' | 'lake' | 'drain';

const MIN_H = -24;
const MAX_H = 48;
/** How far a lake bed is carved below the shore. */
const LAKE_DEPTH = 3.5;

export class SiteTerrain {
  w = 0;
  d = 0;
  /** (w+1)×(d+1) corner heights, meters above regional datum. */
  heights = new Float32Array(0);
  /** w×d cells: water surface elevation, NaN = dry. */
  waterY = new Float32Array(0);

  constructor(w: number, d: number) {
    this.reset(w, d);
  }

  reset(w: number, d: number): void {
    this.w = w;
    this.d = d;
    this.heights = new Float32Array((w + 1) * (d + 1));
    this.waterY = new Float32Array(w * d).fill(NaN);
  }

  cornerH(cx: number, cz: number): number {
    return this.heights[cz * (this.w + 1) + cx];
  }

  private setCorner(cx: number, cz: number, h: number): void {
    // the perimeter stays pinned to the regional datum
    if (cx <= 0 || cz <= 0 || cx >= this.w || cz >= this.d) return;
    this.heights[cz * (this.w + 1) + cx] = Math.min(MAX_H, Math.max(MIN_H, h));
  }

  /** Bilinear ground height at world coordinates (site origin at center). */
  sample(wx: number, wz: number): number {
    const gx = Math.min(this.w - 1e-6, Math.max(0, wx / CELL_SIZE + this.w / 2));
    const gz = Math.min(this.d - 1e-6, Math.max(0, wz / CELL_SIZE + this.d / 2));
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const fx = gx - x0;
    const fz = gz - z0;
    const a = this.cornerH(x0, z0) * (1 - fx) + this.cornerH(x0 + 1, z0) * fx;
    const b = this.cornerH(x0, z0 + 1) * (1 - fx) + this.cornerH(x0 + 1, z0 + 1) * fx;
    return a * (1 - fz) + b * fz;
  }

  isWater(cellX: number, cellZ: number): boolean {
    if (cellX < 0 || cellZ < 0 || cellX >= this.w || cellZ >= this.d) return false;
    return !Number.isNaN(this.waterY[cellZ * this.w + cellX]);
  }

  waterLevel(cellX: number, cellZ: number): number {
    return this.waterY[cellZ * this.w + cellX];
  }

  /** Height stats over a footprint's corners + whether any cell is flooded. */
  footprint(x: number, z: number, fw: number, fd: number): { min: number; max: number; mean: number; water: boolean } {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let n = 0;
    for (let cz = z; cz <= z + fd; cz++) {
      for (let cx = x; cx <= x + fw; cx++) {
        const h = this.cornerH(Math.min(this.w, Math.max(0, cx)), Math.min(this.d, Math.max(0, cz)));
        min = Math.min(min, h);
        max = Math.max(max, h);
        sum += h;
        n++;
      }
    }
    let water = false;
    for (let cz = z; cz < z + fd && !water; cz++) {
      for (let cx = x; cx < x + fw && !water; cx++) {
        if (this.isWater(cx, cz)) water = true;
      }
    }
    return { min, max, mean: sum / n, water };
  }

  /** Grade a building pad: footprint corners set to the mean height. */
  flatten(x: number, z: number, fw: number, fd: number): number {
    const { mean } = this.footprint(x, z, fw, fd);
    for (let cz = z; cz <= z + fd; cz++) {
      for (let cx = x; cx <= x + fw; cx++) {
        this.setCorner(cx, cz, mean);
      }
    }
    // pinning may have clipped edge corners; report the actual pad height
    return this.footprint(x, z, fw, fd).mean;
  }

  /**
   * Grade a building pad the way a real site cut does: footprint corners go
   * flat to the pad height, and the ring of corners just outside is pulled
   * halfway toward it, forming the cut/fill embankment. Corners the caller
   * marks protected (another building's pad) and lake shores stay put.
   */
  flattenWithSkirt(x: number, z: number, fw: number, fd: number, protect?: (cx: number, cz: number) => boolean): number {
    const pad = this.flatten(x, z, fw, fd);
    for (let cz = z - 1; cz <= z + fd + 1; cz++) {
      for (let cx = x - 1; cx <= x + fw + 1; cx++) {
        const ring = cx === x - 1 || cx === x + fw + 1 || cz === z - 1 || cz === z + fd + 1;
        if (!ring || cx < 0 || cz < 0 || cx > this.w || cz > this.d) continue;
        if (protect?.(cx, cz)) continue;
        if (this.isWater(cx - 1, cz - 1) || this.isWater(cx, cz - 1) || this.isWater(cx - 1, cz) || this.isWater(cx, cz)) continue;
        this.setCorner(cx, cz, (this.cornerH(cx, cz) + pad) / 2);
      }
    }
    return pad;
  }

  /**
   * Apply a brush stroke centered on world coords. Radius in cells.
   * Returns true if anything changed.
   */
  brush(tool: BrushTool, wx: number, wz: number, radiusCells: number, levelTarget = 0): boolean {
    const ccx = wx / CELL_SIZE + this.w / 2;
    const ccz = wz / CELL_SIZE + this.d / 2;
    const r = Math.max(1, radiusCells);
    let changed = false;

    if (tool === 'lake' || tool === 'drain') {
      for (let cz = Math.floor(ccz - r); cz <= Math.ceil(ccz + r); cz++) {
        for (let cx = Math.floor(ccx - r); cx <= Math.ceil(ccx + r); cx++) {
          if (cx < 0 || cz < 0 || cx >= this.w || cz >= this.d) continue;
          if (Math.hypot(cx + 0.5 - ccx, cz + 0.5 - ccz) > r) continue;
          const i = cz * this.w + cx;
          if (tool === 'drain') {
            if (!Number.isNaN(this.waterY[i])) {
              this.waterY[i] = NaN;
              changed = true;
            }
          } else if (Number.isNaN(this.waterY[i])) {
            // shore level before carving = water surface
            const shore = this.footprint(cx, cz, 1, 1).mean;
            this.waterY[i] = shore - 0.6;
            for (let dz = 0; dz <= 1; dz++) {
              for (let dx = 0; dx <= 1; dx++) {
                this.setCorner(cx + dx, cz + dz, Math.min(this.cornerH(cx + dx, cz + dz), shore - LAKE_DEPTH));
              }
            }
            changed = true;
          }
        }
      }
      return changed;
    }

    if (tool === 'smooth') {
      // Two passes: relax every painted corner toward its neighbor average
      // (read from the pre-stroke heights), then redistribute the volume the
      // relaxation removed, weighted by brush falloff. Plain diffusion leaks
      // height into the pinned-datum perimeter and unpainted lowland, so an
      // un-conserved smooth slowly presses the whole landform down — this one
      // softens edges while the hill keeps its bulk.
      const touched: { cx: number; cz: number; h: number; next: number; falloff: number }[] = [];
      for (let cz = Math.ceil(ccz - r); cz <= Math.floor(ccz + r); cz++) {
        for (let cx = Math.ceil(ccx - r); cx <= Math.floor(ccx + r); cx++) {
          if (cx <= 0 || cz <= 0 || cx >= this.w || cz >= this.d) continue; // perimeter is pinned anyway
          const dist = Math.hypot(cx - ccx, cz - ccz);
          if (dist > r) continue;
          const falloff = Math.cos(((dist / r) * Math.PI) / 2) ** 2;
          const h = this.cornerH(cx, cz);
          const avg =
            (this.cornerH(cx - 1, cz) + this.cornerH(cx + 1, cz) + this.cornerH(cx, cz - 1) + this.cornerH(cx, cz + 1)) / 4;
          touched.push({ cx, cz, h, next: h + (avg - h) * Math.min(1, falloff * 1.4), falloff });
        }
      }
      let lost = 0;
      let weight = 0;
      for (const t of touched) {
        lost += t.h - t.next;
        weight += t.falloff;
      }
      for (const t of touched) {
        const v = t.next + (weight > 1e-6 ? (lost * t.falloff) / weight : 0);
        if (Math.abs(v - t.h) > 1e-4) {
          this.setCorner(t.cx, t.cz, v);
          changed = true;
        }
      }
      return changed;
    }

    for (let cz = Math.ceil(ccz - r); cz <= Math.floor(ccz + r); cz++) {
      for (let cx = Math.ceil(ccx - r); cx <= Math.floor(ccx + r); cx++) {
        if (cx < 0 || cz < 0 || cx > this.w || cz > this.d) continue;
        const dist = Math.hypot(cx - ccx, cz - ccz);
        if (dist > r) continue;
        const falloff = Math.cos(((dist / r) * Math.PI) / 2) ** 2;
        const h = this.cornerH(cx, cz);
        let next = h;
        if (tool === 'raise') next = h + 1.6 * falloff;
        else if (tool === 'lower') next = h - 1.6 * falloff;
        else if (tool === 'level') next = h + (levelTarget - h) * Math.min(1, falloff * 1.6);
        if (Math.abs(next - h) > 1e-4) {
          this.setCorner(cx, cz, next);
          changed = true;
        }
      }
    }
    return changed;
  }

  /** True if the terrain is entirely flat and dry (skip serializing). */
  isFlat(): boolean {
    for (let i = 0; i < this.heights.length; i++) if (this.heights[i] !== 0) return false;
    for (let i = 0; i < this.waterY.length; i++) if (!Number.isNaN(this.waterY[i])) return false;
    return true;
  }

  serialize(): { h: number[]; water: [number, number][] } | undefined {
    if (this.isFlat()) return undefined;
    return {
      h: [...this.heights].map((v) => Math.round(v * 10) / 10),
      water: [...this.waterY].map((v, i) => [i, Math.round(v * 10) / 10] as [number, number]).filter(([, v]) => !Number.isNaN(v)),
    };
  }

  load(data: { h: number[]; water: [number, number][] } | undefined): void {
    this.heights.fill(0);
    this.waterY.fill(NaN);
    if (!data) return;
    for (let i = 0; i < Math.min(data.h.length, this.heights.length); i++) this.heights[i] = data.h[i];
    // re-pin the perimeter whatever the file says
    for (let cx = 0; cx <= this.w; cx++) {
      this.heights[cx] = 0;
      this.heights[this.d * (this.w + 1) + cx] = 0;
    }
    for (let cz = 0; cz <= this.d; cz++) {
      this.heights[cz * (this.w + 1)] = 0;
      this.heights[cz * (this.w + 1) + this.w] = 0;
    }
    for (const [i, v] of data.water ?? []) {
      if (i >= 0 && i < this.waterY.length) this.waterY[i] = v;
    }
  }
}
