/**
 * Industry & fab-support modules — the chip-fab supply chain. One visual
 * family: industryWhite + steel + concrete with a solar-blue accent stripe.
 */
import * as THREE from 'three';
import type { ModuleDef } from '../types';
import { PartsBuilder } from '../../core/geo';
import { ahuBox, facadeWindows, groundSlab, horizontalTank, tank, tube } from '../parts';

/** Signature accent stripe wrapped around a box building. */
function accentStripe(b: PartsBuilder, w: number, d: number, y: number, t = 1.2): void {
  b.box(w + 0.2, t, 0.25, 'solar', { z: d / 2, y });
  b.box(w + 0.2, t, 0.25, 'solar', { z: -d / 2, y });
  b.box(0.25, t, d + 0.2, 'solar', { x: w / 2, y });
  b.box(0.25, t, d + 0.2, 'solar', { x: -w / 2, y });
}

/** Parallel pipe rack on posts between two x positions. */
function pipeRack(b: PartsBuilder, x0: number, x1: number, z: number, y: number, pipes = 3): void {
  for (const px of [x0, (x0 + x1) / 2, x1]) {
    b.box(0.3, y, 0.3, 'steelDark', { x: px, z, y: 0 });
    b.box(0.3, 0.2, 2.2, 'steelDark', { x: px, z, y });
  }
  for (let i = 0; i < pipes; i++) {
    tube(b, { x: x0 - 1, y: y + 0.35, z: z - 0.8 + i * 0.8 }, { x: x1 + 1, y: y + 0.35, z: z - 0.8 + i * 0.8 }, 0.16, 'pipe');
  }
}

const chipFab: ModuleDef = {
  id: 'chip-fab',
  name: 'Chip Fab Cleanroom',
  category: 'industry',
  description: 'Windowless cleanroom block with a rooftop forest of air handlers — anchor of the quarter',
  footprint: { w: 8, d: 12 },
  height: 24,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 8, 12, 'concreteDark');
    const W = 74;
    const D = 112;
    const H = 18;
    // main volume: white top on gray plinth
    b.box(W, 3.2, D, 'concrete', { y: 0 });
    b.box(W, H - 3.2, D, 'industryWhite', { y: 3.2 });
    accentStripe(b, W, D, H * 0.62);
    b.box(W + 0.3, 0.6, D + 0.3, 'steelDark', { y: H });

    // rooftop equipment forest
    for (let i = 0; i < 9; i++) {
      ahuBox(b, rng, rng.float(-W / 2 + 6, W / 2 - 6), H + 0.6, rng.float(-D / 2 + 8, D / 2 - 8));
    }
    for (let i = 0; i < 5; i++) {
      b.cyl(1.3, rng.float(1.6, 2.6), 'steel', { x: rng.float(-W / 2 + 5, W / 2 - 5), z: rng.float(-D / 2 + 6, D / 2 - 6), y: H + 0.6 }, 10);
    }
    pipeRack(b, -W / 2 + 10, W / 2 - 10, -D / 2 + 12, H + 1.4);
    pipeRack(b, -W / 2 + 10, W / 2 - 10, D / 2 - 12, H + 1.4);
    // penthouse
    b.box(16, 4, 10, 'industryWhite', { x: 0, z: 0, y: H + 0.6 });

    // truck docks on the east long side
    for (let i = 0; i < 3; i++) {
      const z = -30 + i * 30;
      b.quad(4.2, 4.4, 'steelDark', { x: W / 2 + 0.06, z, y: 1.1, ry: Math.PI / 2 });
      b.box(0.2, 5.4, 5, 'safetyAmber', { x: W / 2 + 0.1, z, y: 0.6 });
      b.box(6, 0.4, 6, 'industryWhite', { x: W / 2 + 2.4, z, y: 5.6 });
    }
    // glass entry lobby notch at the SW corner
    b.box(10, 4.6, 8, 'glassTint', { x: -W / 2 + 5.2, z: D / 2 - 4.2, y: 0.2, layer: 'glass' });
    b.box(10.4, 0.5, 8.4, 'solar', { x: -W / 2 + 5.2, z: D / 2 - 4.2, y: 4.8 });
    // exterior duct run climbing the west wall
    tube(b, { x: -W / 2 - 0.6, y: 1, z: -20 }, { x: -W / 2 - 0.6, y: H + 1.5, z: -20 }, 0.55, 'pipe');
    tube(b, { x: -W / 2 - 0.6, y: 1, z: -14 }, { x: -W / 2 - 0.6, y: H + 1.5, z: -14 }, 0.4, 'steel');
    return b.merge();
  },
};

const upwPlant: ModuleDef = {
  id: 'upw-plant',
  name: 'Ultrapure Water Plant',
  category: 'industry',
  description: 'RO/DI cylinder trains feeding the fab by pipe bridge',
  footprint: { w: 4, d: 4 },
  height: 13,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 4, 'concreteDark');
    // process hall
    b.box(20, 9, 14, 'industryWhite', { x: -8, z: -10, y: 0 });
    accentStripe(b, 20, 14, 6.2, 0.9);
    b.box(20.2, 0.5, 14.2, 'steelDark', { x: -8, z: -10, y: 9 });
    // control room with windows
    facadeWindows(b, rng, { width: 16, y0: 1.2, rows: 2, rowHeight: 3, x: -8, z: -2.95, ry: 0, offset: 0.06, litRatio: 0.4 });
    // rank of 6 RO/DI trains on a pad
    b.box(30, 0.5, 12, 'concrete', { x: 2, z: 11, y: 0 });
    for (let i = 0; i < 6; i++) {
      tank(b, 1.7, 10, -10 + i * 5, 11, 'steel');
    }
    tube(b, { x: -10, y: 9.6, z: 11 }, { x: 15, y: 9.6, z: 11 }, 0.2, 'pipe');
    // horizontal storage tank
    horizontalTank(b, 2.2, 12, 12, -12, 'industryWhite');
    // pipe bridge heading north (toward the fab side)
    pipeRack(b, 8, 18, -18.5, 5.4, 4);
    return b.merge();
  },
};

const gasFarm: ModuleDef = {
  id: 'gas-farm',
  name: 'Bulk & Specialty Gas Farm',
  category: 'industry',
  description: 'Cryo tanks, vaporizer fins and a tube-trailer bay',
  footprint: { w: 4, d: 3 },
  height: 9,
  build() {
    const b = new PartsBuilder();
    groundSlab(b, 4, 3, 'concreteDark');
    // 3 horizontal cryo tanks
    for (let i = 0; i < 3; i++) {
      horizontalTank(b, 1.6, 11, -11, -8 + i * 7.5, 'industryWhite');
    }
    // 4 vertical cryo cylinders, one frosty
    for (let i = 0; i < 4; i++) {
      tank(b, 1.4, 7.5, 3 + i * 4, -9, i === 1 ? 'glassTint' : 'industryWhite');
    }
    // vaporizer fin panels
    for (let i = 0; i < 3; i++) {
      for (let f = 0; f < 5; f++) {
        b.box(0.12, 2.6, 1.3, 'steel', { x: 3.5 + i * 5 + f * 0.45, z: -1.5, y: 0.1 });
      }
    }
    // tube-trailer bay: canopy + 2 tube bundles
    b.box(14, 0.4, 9, 'industryWhite', { x: 5, z: 9, y: 5 });
    for (const px of [-1.5, 11.5]) {
      b.box(0.35, 5, 0.35, 'steelDark', { x: px, z: 9, y: 0.1 });
    }
    for (const bz of [7.2, 10.8]) {
      for (let t = 0; t < 5; t++) {
        const g = new THREE.CylinderGeometry(0.36, 0.36, 10, 8);
        g.rotateZ(Math.PI / 2);
        g.translate(4.5, 1.1 + (t % 2) * 0.75, bz);
        b.custom(g, t % 2 ? 'steel' : 'industryWhite');
      }
    }
    // placards
    b.quad(1.4, 1.4, 'safetyAmber', { x: -16, z: -3.4, y: 1, ry: Math.PI / 2 });
    b.quad(1.2, 1.2, 'hazardRed', { x: 14, z: 4, y: 0.9 });
    // manifold pipes
    tube(b, { x: -11, y: 3.4, z: -8 }, { x: -11, y: 3.4, z: 7 }, 0.14, 'pipe');
    return b.merge();
  },
};

const chemStorage: ModuleDef = {
  id: 'chem-storage',
  name: 'Chemical Storage',
  category: 'industry',
  description: 'Bermed pad with drum clusters and IBC totes under canopy',
  footprint: { w: 3, d: 3 },
  height: 6,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 3, 'concreteDark');
    // berm rim
    for (const [w, d, x, z] of [
      [26, 1, 0, -12.5],
      [26, 1, 0, 12.5],
      [1, 24, -12.5, 0],
      [1, 24, 12.5, 0],
    ] as const) {
      b.box(w, 0.8, d, 'concrete', { x, z, y: 0.1 });
    }
    // canopy over half the pad
    b.box(24, 0.35, 10, 'steel', { z: -6, y: 4.6 });
    for (const px of [-11, 0, 11]) {
      for (const pz of [-10.5, -1.5]) {
        b.box(0.3, 4.6, 0.3, 'steelDark', { x: px, z: pz, y: 0.1 });
      }
    }
    // drum clusters
    const drumColors = ['hazardRed', 'safetyAmber', 'industryWhite', 'solar'] as const;
    for (let c = 0; c < 4; c++) {
      const cx = -8 + c * 5.4;
      const col = drumColors[rng.int(0, 3)];
      for (let i = 0; i < rng.int(4, 7); i++) {
        b.cyl(0.36, 0.95, col, { x: cx + (i % 3) * 0.85, z: -7.5 + Math.floor(i / 3) * 0.85, y: 0.14 }, 8);
      }
    }
    // IBC totes in the open half
    for (let i = 0; i < 5; i++) {
      const x = -9 + i * 4.4;
      b.box(2.1, 2.1, 2.1, 'industryWhite', { x, z: 6.5, y: 0.14 });
      for (const e of [-1, 1]) {
        b.box(2.3, 0.12, 0.12, 'steelDark', { x, z: 6.5 + e * 1.05, y: 1.1 });
        b.box(0.12, 0.12, 2.3, 'steelDark', { x: x + e * 1.05, z: 6.5, y: 1.1 });
      }
    }
    b.quad(1.4, 1.4, 'safetyAmber', { z: 12.99, y: 0.9 });
    return b.merge();
  },
};

const coolingTowers: ModuleDef = {
  id: 'cooling-towers',
  name: 'Cooling Tower Bank',
  category: 'industry',
  description: 'Three flared towers exhaling faint plumes',
  footprint: { w: 3, d: 2 },
  height: 15,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 2, 'concreteDark');
    // shared basin
    b.box(26, 1.2, 12, 'concrete', { y: 0.1 });
    for (let i = 0; i < 3; i++) {
      const x = -8.5 + i * 8.5;
      // louver band + flared shell
      b.cyl(3.4, 2.2, 'charcoal', { x, y: 1.3 }, 12);
      b.cone(3.6, 3.2, 8.5, 'concrete', { x, y: 3.5 }, 12);
      b.cyl(2.6, 0.8, 'steelDark', { x, y: 12 }, 12);
      // faint plume
      b.blob(2.2, 'cloud', { x, y: 12.9, layer: 'glass' }, 0);
      if (rng.chance(0.5)) b.blob(1.6, 'cloud', { x: x + rng.float(-1, 1), y: 15, layer: 'glass' }, 0);
    }
    // pump house + pipes into ground
    b.box(6, 3, 4, 'industryWhite', { x: 9, z: 7.4, y: 0.1 });
    tube(b, { x: -8.5, y: 1.4, z: 6 }, { x: 9, y: 1.4, z: 6.8 }, 0.3, 'pipe');
    return b.merge();
  },
};

const wastewater: ModuleDef = {
  id: 'wastewater',
  name: 'Wastewater Treatment',
  category: 'industry',
  description: 'Clarifier basins with rotating bridge arms and a digester dome',
  footprint: { w: 4, d: 4 },
  height: 8,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 4, 'concreteDark');
    // two circular clarifiers: wall ring + water + bridge arm
    for (const [cx, cz] of [
      [-9, -9],
      [9, -9],
    ] as const) {
      b.cyl(7.6, 1.6, 'concrete', { x: cx, z: cz, y: 0.1 }, 18);
      b.disc(7.1, 'waterDeep', { x: cx, z: cz, y: 1.55 }, 18);
      b.cyl(0.5, 2.6, 'steel', { x: cx, z: cz, y: 0.1 }, 8);
      const armYaw = rng.float(0, Math.PI * 2);
      b.box(7.4, 0.35, 0.9, 'steelDark', { x: cx + Math.cos(armYaw) * 3.7 * 0 + 0, z: cz, y: 2.1, ry: armYaw });
    }
    // aeration basin with bubble dots
    b.box(16, 2.2, 9, 'concrete', { x: 0, z: 9, y: 0.1 });
    b.hquad(14.8, 7.8, 'waterDeep', { z: 9, y: 2.32 });
    for (let i = 0; i < 12; i++) {
      b.disc(0.22, 'white', { x: rng.float(-7, 7), z: 9 + rng.float(-3.4, 3.4), y: 2.36 }, 6);
    }
    // digester dome
    b.cyl(3.6, 3.6, 'concreteDark', { x: 13, z: -3, y: 0.1 }, 14);
    b.dome(3.6, 'leafDark', { x: 13, z: -3, y: 3.7 }, 14);
    // blower building + interconnect pipes
    b.box(5.5, 3, 4, 'industryWhite', { x: -13, z: 3.5, y: 0.1 });
    tube(b, { x: -9, y: 0.9, z: -1.5 }, { x: 0, y: 0.9, z: 4.4 }, 0.24, 'pipe');
    tube(b, { x: 9, y: 0.9, z: -1.5 }, { x: 13, y: 0.9, z: -3 }, 0.24, 'pipe');
    return b.merge();
  },
};

const roboticsFab: ModuleDef = {
  id: 'robotics-fab',
  name: 'Robotics Fab',
  category: 'industry',
  description: 'Sawtooth factory with a glass office nose, robot yard and gantry crane',
  footprint: { w: 6, d: 8 },
  height: 16,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 6, 8, 'concreteDark');
    const W = 46;
    const D = 52;
    const H = 10;
    // factory hall offset north, sawtooth roof along its depth
    b.box(W, H, D, 'steel', { z: -12, y: 0 });
    accentStripe(b, W, D, H * 0.7);
    const teeth = 5;
    const toothD = D / teeth;
    for (let i = 0; i < teeth; i++) {
      const z = -12 - D / 2 + (i + 0.5) * toothD;
      const g = new THREE.BufferGeometry();
      // wedge: vertical glass face north, slope south — built as a gable half
      b.gable(W - 2, 3.2, toothD - 0.6, 'industryWhite', { z, y: H, ry: 0 });
      b.quad(W - 4, 2.4, 'glassTint', { z: z - toothD / 2 + 0.35, y: H + 0.3, ry: Math.PI, layer: 'glass' });
      g.dispose();
    }
    // glass office nose (SE corner, 2 story)
    b.box(14, 7, 10, 'glassTint', { x: W / 2 - 7, z: 19, y: 0.2, layer: 'glass' });
    b.box(14.3, 0.6, 10.3, 'steelDark', { x: W / 2 - 7, z: 19, y: 7.2 });
    b.box(14.3, 0.35, 10.3, 'industryWhite', { x: W / 2 - 7, z: 19, y: 3.5 });
    // dock doors on the west side
    for (let i = 0; i < 2; i++) {
      b.quad(4, 4.2, 'steelDark', { x: -W / 2 - 0.06 + 0.12, z: -22 + i * 14, y: 0.9, ry: -Math.PI / 2 });
      b.box(0.2, 5, 4.6, 'safetyAmber', { x: -W / 2 + 0.1, z: -22 + i * 14, y: 0.5 });
    }
    // robot yard: chassis rows + gantry crane
    const yardZ = 19;
    for (let i = 0; i < 5; i++) {
      const x = -18 + i * 6 + rng.float(-0.6, 0.6);
      b.box(1.6, 1.2, 2.2, 'steel', { x, z: yardZ, y: 0.15 });
      b.box(1.2, 0.7, 1.2, 'robotTeal', { x, z: yardZ - 0.2, y: 1.35 });
      b.cyl(0.28, 0.8, 'charcoal', { x: x + 0.5, z: yardZ + 0.8, y: 1.35 }, 8);
    }
    // gantry: two A-frames + beam + hook
    for (const gx of [-21, 3]) {
      for (const gz of [yardZ - 4.5, yardZ + 4.5]) {
        tube(b, { x: gx, y: 0, z: gz }, { x: gx, y: 8.4, z: yardZ }, 0.28, 'safetyAmber');
      }
    }
    tube(b, { x: -21, y: 8.4, z: yardZ }, { x: 3, y: 8.4, z: yardZ }, 0.3, 'safetyAmber');
    b.box(0.8, 1.6, 0.8, 'charcoal', { x: rng.float(-16, 0), z: yardZ, y: 6.6 });
    return b.merge();
  },
};


const foundry: ModuleDef = {
  id: 'foundry',
  name: 'Materials Recovery & Micro-Foundry',
  category: 'industry',
  description: 'E-waste recovery line and induction foundry remelting scrap into robotics-fab feedstock',
  footprint: { w: 4, d: 3 },
  height: 12,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 3, 'concreteDark');
    // melt hall with monitor roof + glow at the door
    b.box(18, 8, 14, 'steel', { x: -8, z: -3, y: 0.1 });
    accentStripe(b, 18, 14, 5.5, 0.9);
    b.box(8, 2.2, 12, 'steelDark', { x: -8, z: -3, y: 8.1 });
    b.quad(4, 3.4, 'safetyAmber', { x: -8, z: 4.07, y: 0.4, layer: 'emissive' });
    // stack with capped top
    b.cyl(0.8, 11, 'steel', { x: -14.5, z: -7.5, y: 0.1 }, 10);
    b.cyl(1, 0.7, 'charcoal', { x: -14.5, z: -7.5, y: 11.1 }, 10);
    // sorting canopy: scrap and e-waste bunkers
    b.box(14, 0.4, 9, 'industryWhite', { x: 9, z: -5, y: 5 });
    for (const px of [3, 9, 15]) b.box(0.35, 5, 0.35, 'steelDark', { x: px, z: -5, y: 0.1 });
    for (let i = 0; i < 3; i++) {
      b.box(3.4, 1.3, 3, 'concrete', { x: 4.5 + i * 4.4, z: -5, y: 0.1 });
      b.blob(1.1, i === 0 ? 'copper' : i === 1 ? 'steelDark' : 'charcoal', { x: 4.5 + i * 4.4, z: -5, y: 1.2 }, 0);
    }
    // ingot yard + gantry hoist
    for (let i = 0; i < 6; i++) b.box(1.6, 0.4, 0.5, 'copper', { x: 3 + (i % 3) * 2.2, z: 7 + Math.floor(i / 3), y: 0.1 + Math.floor(i / 3) * 0.4 });
    tube(b, { x: 0, y: 0, z: 9.5 }, { x: 0, y: 6.5, z: 5.5 }, 0.25, 'safetyAmber');
    tube(b, { x: 12, y: 0, z: 9.5 }, { x: 12, y: 6.5, z: 5.5 }, 0.25, 'safetyAmber');
    tube(b, { x: 0, y: 6.5, z: 5.5 }, { x: 12, y: 6.5, z: 5.5 }, 0.28, 'safetyAmber');
    b.quad(1.4, 1.4, 'hazardRed', { x: -14.9, z: -3, y: 1, ry: -Math.PI / 2 });
    if (rng.chance(0.6)) b.instance('shrub', 17, 0.1, 11, 0, 1.2);
    return b.merge();
  },
};

const modules: ModuleDef[] = [chipFab, upwPlant, gasFarm, chemStorage, coolingTowers, wastewater, roboticsFab, foundry];
export default modules;
