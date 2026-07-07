/**
 * Housing modules. `apt-terrace` is the reference implementation for the
 * whole catalog: compose parts via PartsBuilder, use rng for all variation,
 * stay inside the footprint, return builder.merge().
 */
import { PartsBuilder } from '../../core/geo';
import type { ColorName } from '../../core/Palette';
import type { ModuleDef } from '../types';
import { ahuBox, facadeWindows, groundSlab, mural, parapet, solarRoof } from '../parts';

const aptTerrace: ModuleDef = {
  id: 'apt-terrace',
  name: 'Terrace Apartments',
  category: 'housing',
  description: '4-story mass-timber block with green roof, rooftop solar and balconies',
  footprint: { w: 3, d: 3 },
  height: 16,
  build(rng) {
    const b = new PartsBuilder();
    const W = 24;
    const D = 19;
    const floorH = 3.1;
    const floors = 4;

    groundSlab(b, 3, 3, 'path');

    // stacked floor slabs with alternating inset for shadow lines
    for (let f = 0; f < floors; f++) {
      const inset = f % 2 === 1 ? 0.35 : 0;
      b.box(W - inset * 2, floorH, D - inset * 2, f % 2 === 1 ? 'timberDark' : 'timber', {
        y: f * floorH,
      });
    }
    const roofY = floors * floorH;

    // windows on all four facades
    for (const [ry, cx, cz, len] of [
      [0, 0, D / 2, W],
      [Math.PI, 0, -D / 2, W],
      [Math.PI / 2, W / 2, 0, D],
      [-Math.PI / 2, -W / 2, 0, D],
    ] as const) {
      facadeWindows(b, rng, {
        width: len - 3,
        y0: 0.9,
        rows: floors,
        rowHeight: floorH,
        x: cx,
        z: cz,
        ry,
        offset: 0.06,
        litRatio: 0.2,
      });
    }

    // south balconies: slab + railing per floor
    for (let f = 1; f < floors; f++) {
      for (const sx of [-W / 4, W / 4]) {
        b.box(4.4, 0.18, 1.7, 'creamDark', { x: sx, z: D / 2 + 0.85, y: f * floorH - 0.18 });
        b.box(4.4, 0.85, 0.08, 'cream', { x: sx, z: D / 2 + 1.7, y: f * floorH });
      }
    }

    // entrance
    b.quad(2.4, 2.6, 'timberDark', { z: D / 2 + 0.07, y: 0.1 });
    b.box(3.6, 0.15, 2.2, 'concrete', { z: D / 2 + 1, y: 0 });

    // green roof + parapet + solar + stair head
    b.box(W - 1.4, 0.3, D - 1.4, 'leaf', { y: roofY });
    parapet(b, W, D, roofY, 'creamDark');
    solarRoof(b, W * 0.5, D * 0.55, roofY + 0.3, { x: -W * 0.18 });
    b.box(3, 2.3, 2.6, 'cream', { x: W / 2 - 2.6, z: -D / 2 + 2.4, y: roofY + 0.3 });

    // occasionally a gable mural on one end wall
    if (rng.chance(0.5)) {
      mural(b, rng, D * 0.6, floors * floorH * 0.7, -W / 2, 0, -Math.PI / 2, 0.07, 1.2);
    }

    // yard trees
    b.instance('tree', -W / 2 - 2.2, 0, D / 2 + 2.5, rng.float(0, Math.PI * 2), rng.float(0.9, 1.15));
    b.instance('shrub', W / 2 + 2, 0, D / 2 + 3, 0, rng.float(0.9, 1.4));

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// Local helpers (shared conventions with parts.ts facadeWindows/mural).
// ---------------------------------------------------------------------------

/** Rotate a wall-local (lateral lx, outward lz) offset by yaw ry. */
function rot(ry: number, lx: number, lz: number): { x: number; z: number } {
  const s = Math.sin(ry);
  const c = Math.cos(ry);
  return { x: lx * c + lz * s, z: -lx * s + lz * c };
}

/** parapet() variant for roofs that are not centered on the module origin. */
function parapetAt(
  b: PartsBuilder,
  w: number,
  d: number,
  x: number,
  z: number,
  y: number,
  color: ColorName,
  height = 0.9,
  t = 0.25,
): void {
  b.box(w, height, t, color, { x, z: z - d / 2 + t / 2, y });
  b.box(w, height, t, color, { x, z: z + d / 2 - t / 2, y });
  b.box(t, height, d - 2 * t, color, { x: x - w / 2 + t / 2, z, y });
  b.box(t, height, d - 2 * t, color, { x: x + w / 2 - t / 2, z, y });
}

const aptCourt: ModuleDef = {
  id: 'apt-court',
  name: 'Garden Court Block',
  category: 'housing',
  description: '6-story perimeter block around a treed garden courtyard; one wing carries a rooftop glass greenhouse',
  footprint: { w: 4, d: 4 },
  height: 21,
  build(rng) {
    const b = new PartsBuilder();
    const floorH = 3.05;
    const floors = 6;
    const roofY = floors * floorH; // 18.3
    const OUT = 19.5; // outer wall plane distance from origin
    const IN = 10.5; // courtyard wall plane
    const DEP = 9; // bar depth

    const [colA, colB] = rng.pick([
      ['timber', 'cream'],
      ['cream', 'timber'],
      ['terracotta', 'creamDark'],
    ] as const);

    groundSlab(b, 4, 4, 'paver');

    // ---- four 6-story bars around the courtyard ----
    interface Bar {
      x: number;
      z: number;
      len: number;
      alongX: boolean;
      ry: number; // yaw of the bar's long axis
      outRy: number; // yaw of the outward-facing facade
      inRy: number; // yaw of the courtyard-facing facade
    }
    const bars: Bar[] = [
      { x: 0, z: -15, len: 39, alongX: true, ry: 0, outRy: Math.PI, inRy: 0 }, // north
      { x: 0, z: 15, len: 39, alongX: true, ry: 0, outRy: 0, inRy: Math.PI }, // south
      { x: -15, z: 0, len: 21, alongX: false, ry: Math.PI / 2, outRy: -Math.PI / 2, inRy: Math.PI / 2 }, // west
      { x: 15, z: 0, len: 21, alongX: false, ry: Math.PI / 2, outRy: Math.PI / 2, inRy: -Math.PI / 2 }, // east
    ];
    for (const bar of bars) {
      for (let f = 0; f < floors; f++) {
        const inset = f % 2 === 1 ? 0.3 : 0;
        const w = (bar.alongX ? bar.len : DEP) - inset * 2;
        const d = (bar.alongX ? DEP : bar.len) - inset * 2;
        b.box(w, floorH, d, f % 2 === 1 ? colB : colA, { x: bar.x, z: bar.z, y: f * floorH });
      }
    }

    // ---- windows: outer facades + courtyard facades ----
    for (const [width, x, z, ry] of [
      [28, 0, -OUT, Math.PI], // north outer
      [28, 0, OUT, 0], // south outer
      [17, -OUT, 0, -Math.PI / 2], // west outer
      [17, OUT, 0, Math.PI / 2], // east outer
      [18, 0, -IN, 0], // north courtyard face
      [18, 0, IN, Math.PI], // south courtyard face
      [18, -IN, 0, Math.PI / 2], // west courtyard face
      [18, IN, 0, -Math.PI / 2], // east courtyard face
    ] as const) {
      facadeWindows(b, rng, {
        width,
        y0: 0.9,
        rows: floors,
        rowHeight: floorH,
        x,
        z,
        ry,
        offset: 0.06,
        litRatio: 0.18,
      });
    }

    // ---- courtyard-facing balconies on north & south bars ----
    for (const side of [-1, 1] as const) {
      for (let f = 1; f < floors; f++) {
        for (const bx of [-5.5, 5.5]) {
          b.box(4.2, 0.18, 1.6, 'creamDark', { x: bx, z: side * 9.7, y: f * floorH - 0.18 });
          b.box(4.2, 0.85, 0.08, 'cream', { x: bx, z: side * 8.88, y: f * floorH });
        }
      }
    }

    // ---- corner stair towers, slightly taller than the bars ----
    const towerH = roofY + 2.2;
    const towerColor = rng.pick(['terracotta', 'creamDark', 'timberDark'] as const);
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        b.box(5.6, towerH, 5.6, towerColor, { x: sx * 17, z: sz * 17 });
        b.box(5.9, 0.3, 5.9, 'creamDark', { x: sx * 17, z: sz * 17, y: towerH });
        // glowing stairwell strips on the two outward faces
        b.quad(0.9, towerH * 0.75, 'windowLit', {
          x: sx * 19.86,
          z: sz * 17,
          y: 0.9,
          ry: sx > 0 ? Math.PI / 2 : -Math.PI / 2,
          layer: 'emissive',
        });
        b.quad(0.9, towerH * 0.75, 'windowLit', {
          x: sx * 17,
          z: sz * 19.86,
          y: 0.9,
          ry: sz > 0 ? 0 : Math.PI,
          layer: 'emissive',
        });
      }
    }

    // ---- roofs: one bar gets a glass gable greenhouse, others green + solar ----
    const ghIndex = rng.int(0, 3);
    let ahuPlaced = false;
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const barW = bar.alongX ? bar.len : DEP;
      const barD = bar.alongX ? DEP : bar.len;
      parapetAt(b, barW, barD, bar.x, bar.z, roofY, 'creamDark');
      if (i === ghIndex) {
        // greenhouse wing: pale roof deck + timber knee wall + glass hall
        b.box(barW - 1.2, 0.22, barD - 1.2, 'creamDark', { x: bar.x, z: bar.z, y: roofY });
        const gw = bar.alongX ? 16 : 13;
        const gd = 6;
        b.box(gw + 0.3, 0.35, gd + 0.3, 'timberDark', { x: bar.x, z: bar.z, y: roofY + 0.2, ry: bar.ry });
        b.box(gw, 1.4, gd, 'glassTint', { x: bar.x, z: bar.z, y: roofY + 0.55, ry: bar.ry, layer: 'glass' });
        b.gable(gw, 0.85, gd, 'glassTint', { x: bar.x, z: bar.z, y: roofY + 1.95, ry: bar.ry, layer: 'glass' });
        b.box(gw + 0.2, 0.14, 0.24, 'timberDark', { x: bar.x, z: bar.z, y: roofY + 2.72, ry: bar.ry });
        for (const px of [-1, 1] as const) {
          for (const pz of [-1, 1] as const) {
            const p = rot(bar.ry, px * (gw / 2 - 0.15), pz * (gd / 2 - 0.15));
            b.box(0.16, 1.4, 0.16, 'timberDark', { x: bar.x + p.x, z: bar.z + p.z, y: roofY + 0.55 });
          }
        }
        // warm grow-light strip glowing through the glass
        b.box(gw - 1, 0.07, 0.18, 'growWarm', { x: bar.x, z: bar.z, y: roofY + 1.8, ry: bar.ry, layer: 'emissive' });
      } else {
        // green roof + solar patch
        b.box(barW - 1.2, 0.25, barD - 1.2, 'leaf', { x: bar.x, z: bar.z, y: roofY });
        const off = rng.float(-5, 5);
        if (bar.alongX) solarRoof(b, 12, 6, roofY + 0.3, { x: bar.x + off, z: bar.z });
        else solarRoof(b, 6, 12, roofY + 0.3, { x: bar.x, z: bar.z + off * 0.5 });
        if (!ahuPlaced) {
          ahuPlaced = true;
          const ax = bar.alongX ? bar.x + (off >= 0 ? -14 : 14) : bar.x;
          const az = bar.alongX ? bar.z : bar.z + (off >= 0 ? -8 : 8);
          ahuBox(b, rng, ax, roofY + 0.25, az);
        }
      }
    }

    // ---- mural on one outward facade ----
    const mb = bars[rng.int(0, 3)];
    const mLx = mb.alongX ? rng.float(-8, 8) : rng.float(-3, 3);
    const mp = rot(mb.outRy, mLx, OUT);
    mural(b, rng, 8.5, 11.5, mp.x, mp.z, mb.outRy, 0.08, 1.6);

    // ---- entrance passage through the south bar ----
    b.quad(3.4, 3.5, 'windowDark', { z: OUT + 0.07, y: 0.14, ry: 0 });
    b.quad(3.4, 3.5, 'windowDark', { z: IN - 0.07, y: 0.14, ry: Math.PI });
    b.box(5, 0.22, 0.7, 'timberDark', { z: OUT + 0.1, y: 3.6 });

    // ---- courtyard garden ----
    b.box(20.4, 0.16, 20.4, 'grass', { y: 0 });
    b.box(3.4, 0.2, 39.4, 'path', { y: 0 }); // north-south spine through the passage
    b.box(20.4, 0.2, 2.6, 'path', { y: 0 }); // east-west cross path
    const nTrees = rng.int(1, 2);
    for (let i = 0; i < nTrees; i++) {
      b.instance(
        rng.pick(['tree', 'treeRound'] as const),
        rng.float(3.2, 6.5) * (i === 0 ? -1 : 1),
        0,
        rng.float(2.8, 6.2) * (rng.chance(0.5) ? -1 : 1),
        rng.float(0, Math.PI * 2),
        rng.float(0.85, 1.1),
      );
    }
    for (let i = 0; i < 3; i++) {
      b.instance(
        'shrub',
        rng.float(2.5, 8) * (rng.chance(0.5) ? -1 : 1),
        0.16,
        rng.float(2.5, 8) * (rng.chance(0.5) ? -1 : 1),
        rng.float(0, Math.PI * 2),
        rng.float(0.9, 1.5),
      );
    }
    for (const bx of [-2.6, 2.6]) {
      b.box(1.6, 0.45, 0.5, 'timberDark', { x: bx, z: rng.float(-4, 4), y: 0.16 });
    }

    return b.merge();
  },
};

const aptTower: ModuleDef = {
  id: 'apt-tower',
  name: 'Mass-Timber Tower',
  category: 'housing',
  description: 'Slim 8-story timber tower with spiraling planted terraces, glass lobby and a rooftop solar crown',
  footprint: { w: 2, d: 2 },
  height: 28,
  build(rng) {
    const b = new PartsBuilder();
    const floorH = 3.3;
    const floors = 8;
    const topY = floors * floorH; // 26.4
    const bandA = rng.pick(['timber', 'timberDark'] as const);
    const bandB = 'cream' as const;

    groundSlab(b, 2, 2, 'paver');

    // ---- recessed glass lobby at grade ----
    b.box(15, floorH, 15, 'charcoal', { y: 0 });
    for (let face = 0; face < 4; face++) {
      const ry = (face * Math.PI) / 2;
      const p = rot(ry, 0, 7.6);
      b.quad(12.5, 2.9, 'glassTint', { x: p.x, z: p.z, y: 0.15, ry, layer: 'glass' });
    }
    b.quad(2.2, 2.6, 'timberDark', { z: 7.68, y: 0.15 }); // entry door (south)
    b.box(5, 0.14, 2.2, 'concrete', { z: 8.6, y: 0 }); // entry pad
    b.box(6.5, 0.22, 1.6, 'timberDark', { z: 8.5, y: 3.0 }); // canopy
    b.quad(3, 0.55, 'growWarm', { z: 8.07, y: 3.55, layer: 'emissive' }); // lobby sign

    // ---- alternating timber/cream bands, floors 1..7 ----
    for (let f = 1; f < floors; f++) {
      const inset = f % 2 === 1 ? 0 : 0.35;
      b.box(16 - inset * 2, floorH, 16 - inset * 2, f % 2 === 1 ? bandA : bandB, { y: f * floorH });
    }

    // ---- windows per floor, hugging each band's own wall plane ----
    for (let f = 1; f < floors; f++) {
      const half = 8 - (f % 2 === 1 ? 0 : 0.35);
      for (let face = 0; face < 4; face++) {
        const ry = (face * Math.PI) / 2;
        facadeWindows(b, rng, {
          width: 13,
          y0: f * floorH + 0.85,
          rows: 1,
          rowHeight: floorH,
          x: Math.sin(ry) * half,
          z: Math.cos(ry) * half,
          ry,
          offset: 0.06,
          litRatio: 0.22,
        });
      }
    }

    // ---- cantilevered terrace boxes spiraling up different faces ----
    const nTerraces = rng.int(2, 3);
    const startFace = rng.int(0, 3);
    const spin = rng.chance(0.5) ? 1 : -1;
    for (let i = 0; i < nTerraces; i++) {
      const f = 2 + i * 2; // floors 2, 4, 6
      const face = (((startFace + i * spin) % 4) + 4) % 4;
      const ry = (face * Math.PI) / 2;
      const y = f * floorH;
      const slab = rot(ry, 0, 8.7);
      b.box(5.2, 0.22, 1.9, 'creamDark', { x: slab.x, z: slab.z, y: y - 0.22, ry });
      const front = rot(ry, 0, 9.6);
      b.box(5.2, 0.95, 0.07, 'cream', { x: front.x, z: front.z, y, ry });
      for (const sLx of [-2.57, 2.57]) {
        const sp = rot(ry, sLx, 8.7);
        b.box(0.07, 0.95, 1.8, 'cream', { x: sp.x, z: sp.z, y, ry });
      }
      // lit slider behind the terrace + a planted shrub on it
      const half = 8 - (f % 2 === 1 ? 0 : 0.35);
      const door = rot(ry, 0, half + 0.1);
      const lit = rng.chance(0.6);
      b.quad(3, 2.4, lit ? 'windowLit' : 'glassTint', {
        x: door.x,
        z: door.z,
        y,
        ry,
        layer: lit ? 'emissive' : 'glass',
      });
      const sh = rot(ry, rng.float(-1.9, 1.9), 8.85);
      b.instance('shrub', sh.x, y, sh.z, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));
    }

    // ---- roof: parapet, green roof, stair head, solar crown, comms stub ----
    parapet(b, 16, 16, topY, 'timberDark', 0.9);
    b.box(13.5, 0.25, 13.5, 'leaf', { y: topY });
    b.box(3.4, 1.5, 2.8, 'cream', { x: 2.5, z: 2.5, y: topY + 0.25 });
    for (let i = 0; i < 2; i++) {
      b.cyl(0.35, 0.8, 'steelDark', { x: rng.float(-3.2, 0), z: rng.float(-3.2, 0), y: topY + 0.25 }, 10);
    }
    const crownY = topY + 1.0;
    const tilt = Math.PI * 0.16;
    b.box(11, 0.15, 2.3, 'solar', { z: 5.6, y: crownY, rx: tilt });
    b.box(11, 0.15, 2.3, 'solar', { z: -5.6, y: crownY, rx: -tilt });
    b.box(2.3, 0.15, 11, 'solar', { x: 5.6, y: crownY, rz: -tilt });
    b.box(2.3, 0.15, 11, 'solar', { x: -5.6, y: crownY, rz: tilt });
    for (const sLx of [-3.8, 3.8]) {
      for (const [px, pz] of [
        [sLx, 5.6],
        [sLx, -5.6],
        [5.6, sLx],
        [-5.6, sLx],
      ] as const) {
        b.box(0.16, 1.0, 0.16, 'steelDark', { x: px, z: pz, y: topY + 0.25 });
      }
    }
    b.cyl(0.13, 1.4, 'steel', { x: -6.2, z: 6.2, y: topY }, 8);
    b.box(0.5, 0.6, 0.12, 'industryWhite', { x: -6.2, z: 6.35, y: topY + 0.7 });
    b.blob(0.11, 'beaconRed', { x: -6.2, z: 6.2, y: topY + 1.4, layer: 'emissive' });

    // ---- lot planting ----
    const tc = rng.pick([
      [-8, -8],
      [8, -8],
      [-8, 8],
    ] as const);
    b.instance('treeRound', tc[0], 0, tc[1], rng.float(0, Math.PI * 2), rng.float(0.7, 0.85));
    b.instance('shrub', 5.5, 0, 9, 0, rng.float(1.0, 1.4));
    b.instance('shrub', -5.5, 0, 9, 0, rng.float(1.0, 1.4));

    return b.merge();
  },
};

const modules: ModuleDef[] = [aptTerrace, aptCourt, aptTower];
export default modules;
