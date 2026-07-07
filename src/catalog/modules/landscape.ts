/**
 * Streetscape modules. These tile by the dozens, so they stay cheap, and
 * street/bioswale read as continuous when placed in rows along either axis.
 */
import type { ModuleDef } from '../types';
import { PartsBuilder } from '../../core/geo';
import { groundSlab } from '../parts';

const street: ModuleDef = {
  id: 'street',
  name: 'Street Segment',
  category: 'landscape',
  description: 'Shared street: robot lane, walkway strips — delivery robots route over these',
  footprint: { w: 1, d: 1 },
  height: 0.2,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    // full-bleed asphalt so tiled segments read as one continuous surface
    b.box(10, 0.1, 10, 'asphalt', { y: 0 });
    // narrow walkway curbs on all edges (rotation-agnostic)
    b.hquad(10, 0.8, 'path', { z: -4.6, y: 0.11 });
    b.hquad(10, 0.8, 'path', { z: 4.6, y: 0.11 });
    b.hquad(0.8, 10, 'path', { x: -4.6, y: 0.115 });
    b.hquad(0.8, 10, 'path', { x: 4.6, y: 0.115 });
    // robot-lane stripe (both axes so tiled rows always connect visually)
    b.hquad(10, 0.18, 'robotTeal', { y: 0.12 });
    b.hquad(0.18, 10, 'robotTeal', { y: 0.125 });
    if (rng.chance(0.18)) {
      // occasional manhole
      b.disc(0.5, 'steelDark', { x: rng.float(-2.5, 2.5), z: rng.float(-2.5, 2.5), y: 0.13 }, 10);
    }
    return b.merge();
  },
};

const park: ModuleDef = {
  id: 'park',
  name: 'Pocket Park',
  category: 'landscape',
  description: 'Lawn, shade trees, a diagonal path and a tiny pond',
  footprint: { w: 2, d: 2 },
  height: 8,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'grass');
    // diagonal path as overlapping pads
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      b.hquad(2.6, 2.6, 'path', { x: -7 + t * 14, z: 7 - t * 14, y: 0.14 });
    }
    // pond
    const px = rng.float(-4, 4);
    const pz = rng.float(-4, 4);
    b.disc(2.6, 'concreteDark', { x: px, z: pz, y: 0.14 }, 14);
    b.disc(2.2, 'water', { x: px, z: pz, y: 0.18 }, 14);
    // trees + shrubs, jittered, away from the pond
    const n = rng.int(4, 6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng.float(-0.4, 0.4);
      const r = rng.float(5.5, 8.5);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.hypot(x - px, z - pz) < 3.4) continue;
      b.instance('tree', x, 0.1, z, rng.float(0, Math.PI * 2), rng.float(0.85, 1.25));
    }
    for (let i = 0; i < 4; i++) {
      b.instance('shrub', rng.float(-8, 8), 0.1, rng.float(-8, 8), 0, rng.float(0.8, 1.5));
    }
    // benches
    for (const [bx, bz, ry] of [
      [3.2, -3.2, Math.PI / 4],
      [-3.6, 3.6, Math.PI / 4],
    ] as const) {
      b.box(1.8, 0.45, 0.5, 'timberDark', { x: bx, z: bz, y: 0.14, ry });
    }
    return b.merge();
  },
};

const treeRow: ModuleDef = {
  id: 'tree-row',
  name: 'Street Tree Row',
  category: 'landscape',
  description: 'Paved strip with two street trees in soil beds',
  footprint: { w: 1, d: 1 },
  height: 8,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 1, 1, 'path');
    for (const tx of [-2.6, 2.6]) {
      b.hquad(2, 2, 'soil', { x: tx, y: 0.13 });
      b.instance('tree', tx + rng.float(-0.3, 0.3), 0.1, rng.float(-0.4, 0.4), rng.float(0, Math.PI * 2), rng.float(0.9, 1.2));
    }
    // planter strip along one edge
    b.box(9.2, 0.5, 0.9, 'timberDark', { z: 4.2, y: 0.12 });
    b.box(9.0, 0.2, 0.7, 'leafDark', { z: 4.2, y: 0.6 });
    return b.merge();
  },
};

const bioswale: ModuleDef = {
  id: 'bioswale',
  name: 'Bioswale Canal',
  category: 'landscape',
  description: 'Sunken stormwater channel with reeds and a footbridge',
  footprint: { w: 1, d: 1 },
  height: 1.2,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    // edges paved, center channel — runs full length so rows read continuous
    b.box(2.6, 0.12, 9.7, 'paver', { x: -3.55, y: 0 });
    b.box(2.6, 0.12, 9.7, 'paver', { x: 3.55, y: 0 });
    b.box(1.1, 0.1, 9.7, 'soil', { x: -1.75, y: 0 });
    b.box(1.1, 0.1, 9.7, 'soil', { x: 1.75, y: 0 });
    b.hquad(2.4, 9.7, 'waterDeep', { y: 0.06 });
    // reed clusters
    const n = rng.int(3, 5);
    for (let i = 0; i < n; i++) {
      const z = -4 + (i / (n - 1 || 1)) * 8 + rng.float(-0.5, 0.5);
      const x = rng.pick([-1.6, 1.6]) + rng.float(-0.2, 0.2);
      for (let r = 0; r < 3; r++) {
        b.cone(0.02, 0.09, rng.float(0.7, 1.3), 'leafDark', { x: x + rng.float(-0.3, 0.3), z: z + rng.float(-0.3, 0.3), y: 0.05 }, 5);
      }
    }
    // timber footbridge
    const bridgeZ = rng.float(-2, 2);
    b.box(3.4, 0.14, 1.6, 'timber', { y: 0.42, z: bridgeZ });
    for (const rz of [-0.74, 0.74]) {
      b.box(3.4, 0.08, 0.12, 'timberDark', { y: 0.86, z: bridgeZ + rz });
    }
    return b.merge();
  },
};

const modules: ModuleDef[] = [street, park, treeRow, bioswale];
export default modules;
