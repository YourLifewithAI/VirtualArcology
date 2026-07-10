/**
 * The land itself: a heightfield for everything outside the buildable pad.
 * Heights come from real elevation data (when a location is set) or from
 * seeded procedural hills scaled to the biome. Infrastructure gets the
 * engineered flats real construction gets: the site pad is graded level
 * with a smooth skirt, and the highway/rail corridors run in cut-and-fill
 * bands through whatever relief surrounds them.
 */
import * as THREE from 'three';
import { Rng } from '../core/Rng';
import { CELL_SIZE } from './Grid';

/** Corridor placement shared with RegionalCorridors. */
export function corridorPositions(gridW: number, gridD: number): { highwayX: number; railZ: number } {
  return {
    highwayX: (gridW * CELL_SIZE) / 2 + 34,
    railZ: -((gridD * CELL_SIZE) / 2) - 5,
  };
}

export interface HeightGrid {
  /** n×n row-major heights in meters (0 = pad grade). */
  values: number[];
  n: number;
  /** total side length covered, meters, centered on the site. */
  span: number;
}

/** Per-biome procedural hill amplitude, meters. */
const BIOME_AMPLITUDE: Record<string, number> = {
  temperate: 42,
  plains: 14,
  desert: 65,
  tundra: 95,
  exurban: 30,
};

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class Terrain {
  private grid: HeightGrid | null = null;
  /** true when grid came from real elevation data (survives biome cycling). */
  real = false;
  private siteHalfX = 280;
  private siteHalfZ = 280;
  private highwayX = 314;
  private railZ = -285;

  setSite(gridW: number, gridD: number): void {
    this.siteHalfX = (gridW * CELL_SIZE) / 2;
    this.siteHalfZ = (gridD * CELL_SIZE) / 2;
    const c = corridorPositions(gridW, gridD);
    this.highwayX = c.highwayX;
    this.railZ = c.railZ;
  }

  /** Seeded rolling hills: two octaves of smoothed value noise. */
  setProcedural(biome: string, seed = 90210): void {
    if (this.real) return; // a located site keeps its real relief across biome cycles
    const amp = BIOME_AMPLITUDE[biome] ?? 40;
    const n = 33;
    const span = 6400;
    const rng = new Rng(seed);
    const coarse: number[] = [];
    const cn = 9;
    for (let i = 0; i < cn * cn; i++) coarse.push(rng.float(-1, 1));
    const fine: number[] = [];
    for (let i = 0; i < n * n; i++) fine.push(rng.float(-1, 1));
    const sample = (arr: number[], m: number, u: number, v: number): number => {
      const x = u * (m - 1);
      const y = v * (m - 1);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(m - 1, x0 + 1);
      const y1 = Math.min(m - 1, y0 + 1);
      const fx = x - x0;
      const fy = y - y0;
      const a = arr[y0 * m + x0] * (1 - fx) + arr[y0 * m + x1] * fx;
      const b = arr[y1 * m + x0] * (1 - fx) + arr[y1 * m + x1] * fx;
      return a * (1 - fy) + b * fy;
    };
    const values: number[] = [];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const v = j / (n - 1);
        const h = sample(coarse, cn, u, v) * amp + sample(fine, n, u, v) * amp * 0.3;
        values.push(h);
      }
    }
    this.grid = { values, n, span };
  }

  /** Real elevation data, already normalized so pad grade = 0. */
  setReal(grid: HeightGrid): void {
    this.grid = grid;
    this.real = true;
  }

  clearReal(): void {
    this.real = false;
  }

  /** Raw heightfield sample (bilinear), before engineering masks. */
  private rawHeight(x: number, z: number): number {
    if (!this.grid) return 0;
    const { values, n, span } = this.grid;
    const u = Math.min(1, Math.max(0, x / span + 0.5));
    const v = Math.min(1, Math.max(0, z / span + 0.5));
    const gx = u * (n - 1);
    const gz = v * (n - 1);
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(n - 1, x0 + 1);
    const z1 = Math.min(n - 1, z0 + 1);
    const fx = gx - x0;
    const fz = gz - z0;
    const a = values[z0 * n + x0] * (1 - fx) + values[z0 * n + x1] * fx;
    const b = values[z1 * n + x0] * (1 - fx) + values[z1 * n + x1] * fx;
    return a * (1 - fz) + b * fz;
  }

  /**
   * Engineered height: pad graded flat (smooth skirt), highway/rail/spur
   * corridors in cut-and-fill bands. Inner flat zones are wider than the
   * render mesh's vertex spacing so interpolated triangles can never rise
   * over a road between vertices.
   */
  heightAt(x: number, z: number): number {
    const h = this.rawHeight(x, z);
    // distance outside the pad rectangle (first 45 m dead flat)
    const dx = Math.max(0, Math.abs(x) - (this.siteHalfX + 12));
    const dz = Math.max(0, Math.abs(z) - (this.siteHalfZ + 12));
    const padBlend = smoothstep(45, 280, Math.hypot(dx, dz));
    const hwBlend = smoothstep(50, 160, Math.abs(x - this.highwayX));
    const railBlend = smoothstep(45, 150, Math.abs(z - this.railZ));
    // interchange spur: flat lane from the pad edge to the highway
    const spurBlend =
      x > this.siteHalfX - 60 && x < this.highwayX + 70 ? smoothstep(35, 130, Math.abs(z)) : 1;
    return h * Math.min(padBlend, hwBlend, railBlend, spurBlend);
  }

  /** Displaced ground plane with recomputed normals (caller owns disposal). */
  buildGeometry(size = 6000, segments = 150): THREE.BufferGeometry {
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, this.heightAt(pos.getX(i), pos.getZ(i)) - 0.15);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }
}
