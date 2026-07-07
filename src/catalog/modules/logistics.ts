/** Logistics & water modules. */
import type { ModuleDef } from '../types';
import { PartsBuilder } from '../../core/geo';
import { facadeWindows, groundSlab, solarRoof, tank, tube } from '../parts';

const logisticsHub: ModuleDef = {
  id: 'logistics-hub',
  name: 'Logistics & Micro-mobility Hub',
  category: 'logistics',
  description: 'Dock-door warehouse with cargo pods and a mobility rack',
  footprint: { w: 4, d: 4 },
  height: 10,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 4, 'concreteDark');
    // warehouse: two-tone box, offset north
    const W = 32;
    const D = 22;
    const H = 8;
    b.box(W, H * 0.55, D, 'steel', { z: -7, y: 0 });
    b.box(W, H * 0.45, D, 'cream', { z: -7, y: H * 0.55 });
    b.box(W + 0.4, 0.4, D + 0.4, 'steelDark', { z: -7, y: H });
    solarRoof(b, W * 0.6, D * 0.6, H + 0.4, { z: -7 });

    // dock side (south): canopy + 4 dock doors with bumpers
    b.box(W - 4, 0.5, 5, 'industryWhite', { z: 4.5, y: 5.2 });
    for (let i = 0; i < 4; i++) {
      const x = -10.5 + i * 7;
      b.quad(3.4, 3.4, 'steelDark', { x, z: 4.05, y: 0.9 });
      b.box(3.8, 0.3, 0.15, 'safetyAmber', { x, z: 4.1, y: 4.3 });
      for (const bx of [-1.5, 1.5]) {
        b.box(0.4, 0.5, 0.3, 'charcoal', { x: x + bx, z: 4.2, y: 0.9 });
      }
    }
    // office corner with windows
    facadeWindows(b, rng, { width: 10, y0: 1, rows: 2, rowHeight: 3.2, x: -10, z: -17.95, ry: Math.PI, offset: 0.06, litRatio: 0.35 });

    // yard: parked cargo pods
    const pods = rng.int(3, 4);
    for (let i = 0; i < pods; i++) {
      const x = -12 + i * 7 + rng.float(-1, 1);
      const z = 12.5;
      b.box(3.2, 2.1, 2, 'industryWhite', { x, z, y: 0.35 });
      b.box(3.2, 0.5, 2, 'robotTeal', { x, z, y: 2.45 });
      for (const [wx, wz] of [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]] as const) {
        b.cyl(0.3, 0.3, 'charcoal', { x: x + wx, z: z + wz, y: 0 }, 8);
      }
    }
    // bike/pod rack row
    for (let i = 0; i < 6; i++) {
      b.box(0.12, 0.9, 1.4, 'steelDark', { x: 13 + i * 1.1, z: 13, y: 0.15 });
    }
    b.instance('tree', -16.5, 0, 16.5, rng.float(0, Math.PI * 2), 1.0);
    return b.merge();
  },
};

const robotDepot: ModuleDef = {
  id: 'robot-depot',
  name: 'Delivery Robot Depot',
  category: 'logistics',
  description: 'Open charging shed where the delivery fleet rests',
  footprint: { w: 2, d: 1 },
  height: 4,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 1, 'concreteDark');
    // open-fronted shed: back + side walls, flat roof on posts
    b.box(18, 3, 0.3, 'timberDark', { z: -4.3, y: 0.12 });
    for (const sx of [-8.85, 8.85]) {
      b.box(0.3, 3, 8, 'timberDark', { x: sx, z: -0.4, y: 0.12 });
    }
    b.box(19, 0.35, 9.4, 'cream', { y: 3.2 });
    solarRoof(b, 14, 6, 3.55);
    for (const px of [-8.5, 8.5]) {
      b.box(0.35, 3.1, 0.35, 'steelDark', { x: px, z: 3.9, y: 0.12 });
    }
    // charging bays: emissive teal floor strips + parked robots
    for (let i = 0; i < 4; i++) {
      const x = -6.4 + i * 4.2;
      b.hquad(2.6, 5, 'robotTeal', { x, z: -1, y: 0.16, layer: 'emissive' });
      if (rng.chance(0.7)) {
        b.box(0.8, 0.55, 1.25, 'industryWhite', { x, z: -2, y: 0.3 });
        b.box(0.82, 0.1, 1.27, 'robotTeal', { x, z: -2, y: 0.85 });
      }
    }
    // transformer cabinet outside
    b.box(1.6, 1.6, 1.1, 'industryWhite', { x: 10.8, z: 2.5, y: 0.12 });
    return b.merge();
  },
};

const waterTower: ModuleDef = {
  id: 'water-tower',
  name: 'Water Tower & Treatment',
  category: 'logistics',
  description: 'Elevated tank on legs with a small treatment shed',
  footprint: { w: 2, d: 2 },
  height: 19,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'grass');
    const legH = 11;
    // four legs leaning inward + platform ring
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
      tube(b, { x: sx * 5.2, y: 0, z: sz * 5.2 }, { x: sx * 2.2, y: legH, z: sz * 2.2 }, 0.22, 'steelDark');
    }
    b.box(7, 0.25, 7, 'steelDark', { y: legH * 0.55 });
    // central standpipe + tank with dome cap
    b.cyl(0.6, legH, 'steel', { y: 0 }, 10);
    b.cyl(4.4, 5, 'industryWhite', { y: legH }, 16);
    b.dome(4.4, 'industryWhite', { y: legH + 5 }, 16);
    b.box(9.2, 1.1, 0.24, 'solar', { y: legH + 2, z: 4.28 });
    // safety ladder up one leg
    b.box(0.12, legH + 3, 0.5, 'safetyAmber', { x: 0.7, z: 5.4, y: 0 });
    // treatment shed with two small tanks + pipes
    b.box(6, 3, 4.5, 'cream', { x: -6, z: 6.2, y: 0.1 });
    b.gable(6, 1.2, 4.5, 'terracotta', { x: -6, z: 6.2, y: 3.1 });
    tank(b, 1.1, 2.6, 5.5, 6.5, 'steel');
    tank(b, 1.1, 2.6, 8.2, 6.5, 'steel');
    tube(b, { x: 5.5, y: 2.9, z: 6.5 }, { x: 8.2, y: 2.9, z: 6.5 }, 0.12, 'pipe');
    tube(b, { x: 0, y: legH, z: 0 }, { x: 5.5, y: 0.5, z: 6.5 }, 0.14, 'pipe');
    b.instance('shrub', 6.5, 0.1, -6.5, 0, rng.float(0.9, 1.4));
    return b.merge();
  },
};


const transitHub: ModuleDef = {
  id: 'transit-hub',
  name: 'Transit Hub (Rail + Bus)',
  category: 'logistics',
  description: 'The Tessera\'s door to the region: rail platform, intercity bus bays, micro-mobility handoff',
  footprint: { w: 5, d: 3 },
  height: 9,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 5, 3, 'concreteDark');
    // rail corridor along the north edge: ballast, two tracks, platform
    b.box(48, 0.25, 5.5, 'concreteDark', { z: -11.5, y: 0 });
    for (const tz of [-13, -10]) {
      for (const rz of [-0.75, 0.75]) b.box(48, 0.18, 0.16, 'steelDark', { z: tz + rz * 0.5, y: 0.25 });
      for (let i = 0; i < 16; i++) b.box(0.5, 0.1, 2, 'timberDark', { x: -22.5 + i * 3, z: tz, y: 0.2 });
    }
    b.box(40, 0.9, 4, 'paver', { z: -6.5, y: 0.1 });
    // station hall: glass box under a broad timber canopy
    b.box(20, 6, 9, 'glassTint', { x: -6, z: 0.5, y: 1, layer: 'glass' });
    b.box(20.5, 1, 9.5, 'timber', { x: -6, z: 0.5, y: 0.1 });
    b.box(26, 0.6, 14, 'timberDark', { x: -6, z: 0.5, y: 7.2 });
    for (const [px, pz] of [[-17, -5.5], [5, -5.5], [-17, 6.5], [5, 6.5]] as const) b.box(0.5, 7.1, 0.5, 'timberDark', { x: px, z: pz, y: 0.1 });
    b.quad(8, 1.1, 'windowLit', { x: -6, z: 5.31, y: 5.2, layer: 'emissive' });
    // platform canopy over the tracks
    b.box(30, 0.35, 4.5, 'steel', { x: -4, z: -8.8, y: 4.8 });
    for (let i = 0; i < 4; i++) b.box(0.3, 4.8, 0.3, 'steelDark', { x: -16 + i * 8, z: -8.8, y: 0.1 });
    // bus bays: sawtooth pull-ins + two buses
    for (let i = 0; i < 3; i++) {
      b.hquad(7, 4.5, 'asphalt', { x: 9 + i * 7.5, z: 6, y: 0.12 });
      b.box(6.5, 0.3, 0.3, 'safetyAmber', { x: 9 + i * 7.5, z: 3.6, y: 0.12 });
    }
    for (let i = 0; i < 2; i++) {
      const x = 9 + i * 7.5;
      b.box(6, 2.6, 2.3, i ? 'robotTeal' : 'canvasTeal', { x, z: 6.5, y: 0.5 });
      b.quad(5.2, 1, 'windowDark', { x, z: 7.71, y: 1.5 });
      for (const wx of [-2, 2]) b.cyl(0.45, 0.4, 'charcoal', { x: x + wx, z: 7.8, y: 0.1 }, 8);
    }
    // micro-mobility handoff: pod/bike racks + robot lane tie-in
    for (let i = 0; i < 6; i++) b.box(0.12, 0.85, 1.3, 'steelDark', { x: 8 + i * 1, z: 11.5, y: 0.12 });
    b.hquad(10, 0.18, 'robotTeal', { x: -6, z: 12, y: 0.14 });
    b.instance('tree', -20.5, 0.1, 11.5, rng.float(0, 6.28), 1.0);
    b.instance('tree', 20.5, 0.1, 11.5, rng.float(0, 6.28), 1.1);
    return b.merge();
  },
};

const modules: ModuleDef[] = [logisticsHub, robotDepot, waterTower, transitHub];
export default modules;
