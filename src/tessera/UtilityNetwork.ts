/**
 * Underground infrastructure visualization: trunk lines under every street
 * (power, water, sewer, fiber at staggered depths) plus service stubs from
 * each building to its nearest street. All merged into one mesh per utility.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CELL_SIZE } from './Grid';
import { getModule } from '../catalog/ModuleCatalog';
import { rotatedFootprint } from './Grid';
import type { TesseraMode } from './TesseraMode';

const UTILITIES = [
  { key: 'power', color: 0xffb340, depth: -0.9, r: 0.28 },
  { key: 'water', color: 0x4da3ff, depth: -1.5, r: 0.32 },
  { key: 'sewer', color: 0x9c7a4d, depth: -2.1, r: 0.4 },
  { key: 'fiber', color: 0x2ee6d6, depth: -2.7, r: 0.18 },
] as const;

function seg(geoms: THREE.BufferGeometry[], x0: number, z0: number, x1: number, z1: number, y: number, r: number): void {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  const g = new THREE.CylinderGeometry(r, r, len, 6);
  g.rotateX(Math.PI / 2);
  g.rotateY(-Math.atan2(dz, dx) + Math.PI / 2);
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  geoms.push(g);
}

export class UtilityNetwork {
  group = new THREE.Group();
  private builtVersion = -1;

  constructor(private mode: TesseraMode) {
    this.group.visible = false;
    mode.scene.add(this.group);
  }

  setVisible(v: boolean): void {
    if (v && this.builtVersion !== this.mode.layoutVersion) this.rebuild();
    this.group.visible = v;
  }

  private rebuild(): void {
    this.builtVersion = this.mode.layoutVersion;
    this.group.clear();
    const grid = this.mode.grid;
    const cw = (c: number, half: number): number => (c + 0.5 - half) * CELL_SIZE;
    const halfW = grid.width / 2;
    const halfD = grid.depth / 2;

    const streets: { x: number; z: number }[] = [];
    const buildings: { x: number; z: number }[] = [];
    for (const { placed } of grid.activePlacements()) {
      const def = getModule(placed.defId);
      if (!def) continue;
      if (placed.defId === 'street') {
        streets.push({ x: placed.x, z: placed.z });
      } else if (def.category !== 'landscape') {
        const { w, d } = rotatedFootprint(def, placed.rot);
        buildings.push({ x: placed.x + w / 2 - 0.5, z: placed.z + d / 2 - 0.5 });
      }
    }
    const streetSet = new Set(streets.map((s) => s.z * grid.width + s.x));

    for (const u of UTILITIES) {
      const geoms: THREE.BufferGeometry[] = [];
      // trunk lines: one run per street cell along each axis that has a neighbor
      for (const s of streets) {
        const wx = cw(s.x, halfW);
        const wz = cw(s.z, halfD);
        if (streetSet.has(s.z * grid.width + s.x + 1)) seg(geoms, wx, wz, wx + CELL_SIZE, wz, u.depth, u.r);
        if (streetSet.has((s.z + 1) * grid.width + s.x)) seg(geoms, wx, wz, wx, wz + CELL_SIZE, u.depth, u.r);
      }
      // service stubs: building center -> nearest street cell center (L-shaped)
      for (const b of buildings) {
        let best: { x: number; z: number } | null = null;
        let bestD = Infinity;
        for (const s of streets) {
          const d2 = (s.x - b.x) ** 2 + (s.z - b.z) ** 2;
          if (d2 < bestD) {
            bestD = d2;
            best = s;
          }
        }
        if (!best || bestD > 20 * 20) continue;
        const bx = (b.x + 0.5 - halfW) * CELL_SIZE;
        const bz = (b.z + 0.5 - halfD) * CELL_SIZE;
        const sx = cw(best.x, halfW);
        const sz = cw(best.z, halfD);
        seg(geoms, bx, bz, sx, bz, u.depth, u.r * 0.75);
        seg(geoms, sx, bz, sx, sz, u.depth, u.r * 0.75);
        // riser at the building
        const riser = new THREE.CylinderGeometry(u.r * 0.75, u.r * 0.75, -u.depth + 0.3, 6);
        riser.translate(bx, u.depth / 2, bz);
        geoms.push(riser);
      }
      if (geoms.length === 0) continue;
      const mesh = new THREE.Mesh(
        mergeGeometries(geoms, false),
        new THREE.MeshBasicMaterial({ color: u.color, toneMapped: false }),
      );
      geoms.forEach((g) => g.dispose());
      mesh.frustumCulled = false;
      this.group.add(mesh);
    }
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.mode.scene.remove(this.group);
  }
}
