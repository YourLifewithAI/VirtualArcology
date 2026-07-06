/**
 * Energy modules: generation, storage and grid infrastructure.
 * Same conventions as housing.ts: compose parts via PartsBuilder, rng for all
 * variation, stay inside the footprint, return builder.merge().
 */
import { PartsBuilder } from '../../core/geo';
import type { ColorName } from '../../core/Palette';
import type { Rng } from '../../core/Rng';
import { groundSlab, trussMast, tube } from '../parts';
import type { ModuleDef } from '../types';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Low perimeter fence: square ring of posts plus a thin top rail. */
function fenceRing(b: PartsBuilder, half: number, postH: number, spacing: number, color: ColorName = 'steelDark'): void {
  const n = Math.max(2, Math.round((half * 2) / spacing));
  for (let i = 0; i <= n; i++) {
    const t = -half + (i * 2 * half) / n;
    b.box(0.12, postH, 0.12, color, { x: t, z: -half });
    b.box(0.12, postH, 0.12, color, { x: t, z: half });
    if (i > 0 && i < n) {
      b.box(0.12, postH, 0.12, color, { x: -half, z: t });
      b.box(0.12, postH, 0.12, color, { x: half, z: t });
    }
  }
  const railY = postH - 0.18;
  b.box(half * 2 + 0.12, 0.07, 0.07, color, { z: -half, y: railY });
  b.box(half * 2 + 0.12, 0.07, 0.07, color, { z: half, y: railY });
  b.box(0.07, 0.07, half * 2 - 0.12, color, { x: -half, y: railY });
  b.box(0.07, 0.07, half * 2 - 0.12, color, { x: half, y: railY });
}

interface TransformerInfo {
  bushingXs: number[];
  bushingTopY: number;
  z: number;
}

/** Oil transformer: concrete plinth + charcoal body with radiator fins + white bushings. */
function transformer(b: PartsBuilder, rng: Rng, x: number, z: number, s = 1): TransformerInfo {
  const bw = 3.0 * s;
  const bh = 2.4 * s;
  const bd = 2.0 * s;
  b.box(bw + 0.7 * s, 0.25 * s, bd + 0.7 * s, 'concrete', { x, z });
  b.box(bw, bh, bd, 'charcoal', { x, z, y: 0.25 * s });
  // radiator fin banks on both long sides: thin parallel plates
  const fins = 5;
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < fins; i++) {
      const fz = z - bd / 2 + (i + 0.5) * (bd / fins);
      b.box(0.55 * s, bh * 0.72, 0.08, 'charcoal', { x: x + side * (bw / 2 + 0.3 * s), z: fz, y: 0.25 * s + bh * 0.14 });
    }
  }
  // white porcelain bushings on top
  const nb = rng.int(2, 3);
  const topY = 0.25 * s + bh;
  const xs: number[] = [];
  for (let i = 0; i < nb; i++) {
    const bx = x + (i - (nb - 1) / 2) * 0.85 * s;
    xs.push(bx);
    b.cyl(0.13 * s, 1.05 * s, 'industryWhite', { x: bx, z, y: topY }, 8);
    b.cyl(0.21 * s, 0.1 * s, 'industryWhite', { x: bx, z, y: topY + 0.5 * s }, 8);
  }
  return { bushingXs: xs, bushingTopY: topY + 1.05 * s, z };
}

// ---------------------------------------------------------------------------
// 1. Solar Canopy — walkable shade structure
// ---------------------------------------------------------------------------

const solarCanopy: ModuleDef = {
  id: 'solar-canopy',
  name: 'Solar Canopy',
  category: 'energy',
  description: 'Walkable plaza shaded by an elevated grid of tilted PV panels on slim steel columns',
  footprint: { w: 2, d: 2 },
  height: 6,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'paver');
    const deckY = 4.85;

    // slim steel columns near the corners, on small base plates
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        b.box(0.7, 0.1, 0.7, 'steelDark', { x: sx * 7.5, z: sz * 7.5, y: 0.12 });
        b.cyl(0.17, deckY - 0.12, 'steel', { x: sx * 7.5, z: sz * 7.5, y: 0.12 }, 10);
      }
    }
    // cross beams tying the columns together under the deck
    for (const s of [-1, 1] as const) {
      b.box(15.3, 0.26, 0.26, 'steelDark', { z: s * 7.5, y: deckY - 0.32 });
      b.box(0.26, 0.26, 15.3, 'steelDark', { x: s * 7.5, y: deckY - 0.32 });
    }
    // thin frame deck + lighter fascia strips
    b.box(17, 0.18, 17, 'steelDark', { y: deckY });
    for (const s of [-1, 1] as const) {
      b.box(17.4, 0.3, 0.22, 'steel', { z: s * 8.6, y: deckY - 0.07 });
      b.box(0.22, 0.3, 17.4, 'steel', { x: s * 8.6, y: deckY - 0.07 });
    }

    // 3x4 grid of tilted solar boxes on the deck, consistent southward tilt
    const tilt = -Math.PI * rng.float(0.04, 0.052);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        b.box(3.9, 0.12, 4.5, 'solar', {
          x: -6.45 + c * 4.3,
          z: -5.7 + r * 5.7,
          y: deckY + 0.6,
          rx: tilt,
        });
      }
    }

    // warm under-canopy light strips
    for (const s of [-1, 1] as const) {
      b.box(10.5, 0.07, 0.24, 'growWarm', { z: s * 2.9, y: deckY - 0.24, layer: 'emissive' });
    }

    // benches near the edges (keep the plaza center clear)
    const nBenches = rng.int(2, 3);
    const benchSpots: { x: number; z: number; alongZ: boolean }[] = [
      { x: -8, z: rng.float(-3, 3), alongZ: true },
      { x: 8, z: rng.float(-3, 3), alongZ: true },
      { x: rng.float(-3, 3), z: -8, alongZ: false },
    ];
    for (let i = 0; i < nBenches; i++) {
      const s = benchSpots[i];
      const seatW = s.alongZ ? 0.55 : 2.4;
      const seatD = s.alongZ ? 2.4 : 0.55;
      b.box(seatW, 0.1, seatD, 'timber', { x: s.x, z: s.z, y: 0.44 });
      for (const e of [-1, 1] as const) {
        b.box(s.alongZ ? 0.5 : 0.14, 0.32, s.alongZ ? 0.14 : 0.5, 'timberDark', {
          x: s.x + (s.alongZ ? 0 : e * 1.0),
          z: s.z + (s.alongZ ? e * 1.0 : 0),
          y: 0.12,
        });
      }
    }

    // corner planter with one shrub
    const px = rng.pick([-6.2, 6.2]);
    b.box(1.3, 0.5, 1.3, 'timberDark', { x: px, z: 8, y: 0.12 });
    b.instance('shrub', px, 0.55, 8, rng.float(0, Math.PI * 2), rng.float(0.9, 1.25));

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 2. Solar Field — ground-mount PV rows
// ---------------------------------------------------------------------------

const solarField: ModuleDef = {
  id: 'solar-field',
  name: 'Solar Field',
  category: 'energy',
  description: 'Fenced gravel yard with neat rows of ground-mount PV panels and an inverter cabinet',
  footprint: { w: 4, d: 4 },
  height: 2,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 4, 'concreteDark');

    // 8 rows x 7 columns of instanced panels, all facing south with tiny jitter
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 7; c++) {
        b.instance(
          'solarPanel',
          -15 + c * 5 + rng.float(-0.12, 0.12),
          0.12,
          -15.75 + r * 4.5 + rng.float(-0.08, 0.08),
          rng.float(-0.02, 0.02),
          rng.float(0.97, 1.03),
        );
      }
    }

    // service track between two panel columns
    b.box(1.6, 0.05, 38.5, 'concrete', { x: -2.5, y: 0.12 });

    // inverter cabinet on a pad near the east fence
    const iz = rng.float(8, 12);
    b.box(1.7, 0.12, 2.9, 'concrete', { x: 17.6, z: iz, y: 0.12 });
    b.box(1.4, 1.7, 2.5, 'industryWhite', { x: 17.6, z: iz, y: 0.24 });
    b.quad(1.0, 1.3, 'steelDark', { x: 16.88, z: iz, y: 0.38, ry: -Math.PI / 2 });
    b.cyl(0.22, 0.2, 'steelDark', { x: 17.6, z: iz + 0.5, y: 1.94 }, 8);
    b.quad(0.5, 0.38, 'safetyAmber', { x: 16.88, z: iz - 0.9, y: 1.05, ry: -Math.PI / 2 });

    // low perimeter fence
    fenceRing(b, 19.3, 1.15, 4.9);

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 3. Battery Bank Yard
// ---------------------------------------------------------------------------

const batteryYard: ModuleDef = {
  id: 'battery-yard',
  name: 'Battery Bank Yard',
  category: 'energy',
  description: 'Grid storage: twin rows of white battery cabinets with cooling ducts inside a rail fence',
  footprint: { w: 2, d: 2 },
  height: 4,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'concreteDark');

    const n = 6;
    const pitch = 1.5;
    const rowLen = n * pitch;
    for (const side of [-1, 1] as const) {
      const rowZ = side * 3.1;
      const ry = side > 0 ? Math.PI : 0; // doors face the central aisle
      const doorZ = rowZ - side * 0.41;
      for (let i = 0; i < n; i++) {
        const cx = (i - (n - 1) / 2) * pitch;
        b.box(1.25, 2.5, 0.8, 'industryWhite', { x: cx, z: rowZ, y: 0.12 });
        b.quad(0.95, 1.85, 'robotTeal', { x: cx, z: doorZ, y: 0.32, ry });
        if (rng.chance(0.45)) {
          // glowing status dot beside the door head
          b.quad(0.16, 0.16, 'robotTeal', { x: cx + 0.38, z: doorZ - side * 0.015, y: 2.28, ry, layer: 'emissive' });
        }
      }
      // hazard stripe along the cabinet bases
      b.box(rowLen - 0.2, 0.16, 0.12, 'safetyAmber', { z: rowZ - side * 0.48, y: 0.12 });
      // cooling duct running the length of the row, with end vents
      b.box(rowLen - 0.1, 0.5, 0.6, 'steel', { z: rowZ, y: 2.62 });
      for (const ex of [-rowLen / 2 + 0.4, rowLen / 2 - 0.4]) {
        b.cyl(0.24, 0.32, 'steelDark', { x: ex, z: rowZ, y: 3.12 }, 8);
      }
    }
    // coolant pipe linking the two duct runs at one end
    tube(b, { x: -4.85, y: 2.85, z: -3.1 }, { x: -4.85, y: 2.85, z: 3.1 }, 0.12, 'pipe');

    // perimeter posts + thin rails
    fenceRing(b, 9.2, 1.05, 4.6);

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 4. Electrical Substation
// ---------------------------------------------------------------------------

const substation: ModuleDef = {
  id: 'substation',
  name: 'Electrical Substation',
  category: 'energy',
  description: 'Lattice masts, gantry and three finned transformers wired together over a gravel yard',
  footprint: { w: 3, d: 3 },
  height: 13,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 3, 'concreteDark');

    // two lattice masts on the north side, one with a beacon
    trussMast(b, 12.5, -11, -10.5, 0.95);
    trussMast(b, 12.5, 11, -10.5, 0.95);
    b.blob(0.11, 'beaconRed', { x: rng.pick([-11, 11]), z: -10.5, y: 12.55, layer: 'emissive' });

    // overhead gantry: two posts + crossbeam with hanging insulators
    for (const sx of [-1, 1] as const) {
      b.box(0.42, 7.9, 0.42, 'steel', { x: sx * 12, z: -2 });
    }
    b.box(25.1, 0.55, 0.55, 'steel', { y: 7.9, z: -2 });

    // three transformers under the gantry, each fed by a drop from an insulator
    const dropXs = [-9, 0, 9];
    for (const x of dropXs) {
      b.cyl(0.13, 0.75, 'industryWhite', { x, y: 7.15, z: -2 }, 8);
      const t = transformer(b, rng, x, 5);
      for (const bx of t.bushingXs) {
        tube(b, { x, y: 7.15, z: -2 }, { x: bx, y: t.bushingTopY, z: t.z }, 0.045, 'charcoal');
      }
    }

    // conductors from the mast tops down to the gantry beam
    for (const sx of [-1, 1] as const) {
      tube(b, { x: sx * 11, y: 12.3, z: -10.5 }, { x: sx * 12, y: 8.45, z: -2 }, 0.05, 'charcoal');
      tube(b, { x: sx * 11, y: 11.2, z: -10.5 }, { x: sx * 6.5, y: 8.45, z: -2 }, 0.05, 'charcoal');
    }

    // small control cabin
    b.box(3.4, 2.5, 2.4, 'industryWhite', { x: -11.5, z: 10.5 });
    b.box(3.6, 0.18, 2.6, 'steelDark', { x: -11.5, z: 10.5, y: 2.5 });
    b.quad(0.9, 1.9, 'steelDark', { x: -11.5, z: 11.71, y: 0.12 });
    const cabinLit = rng.chance(0.6);
    b.quad(0.9, 0.7, cabinLit ? 'windowLit' : 'windowDark', {
      x: -10.29,
      z: 10.5,
      y: 1.2,
      ry: Math.PI / 2,
      layer: cabinLit ? 'emissive' : 'opaque',
    });

    // perimeter fence + amber warning signs clipped to it
    fenceRing(b, 13.9, 1.5, 4.6);
    for (const sx of [-5.5, 5.5]) {
      b.quad(0.85, 0.6, 'safetyAmber', { x: sx, z: 13.97, y: 0.6 });
    }
    b.quad(0.85, 0.6, 'safetyAmber', { x: 13.97, z: rng.float(-4, 4), y: 0.6, ry: Math.PI / 2 });

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 5. Small Modular Reactor Block
// ---------------------------------------------------------------------------

const smr: ModuleDef = {
  id: 'smr',
  name: 'Small Modular Reactor Block',
  category: 'energy',
  description: 'Clean nuclear campus: domed containment with turbine hall, twin stacks and a mini switchyard',
  footprint: { w: 5, d: 5 },
  height: 30,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 5, 5, 'concrete');

    // ---- containment cylinder + dome + blue accent band ----
    const cx = -10;
    const cz = -5;
    const R = 8;
    b.cyl(R + 0.3, 1.1, 'concrete', { x: cx, z: cz }, 14); // base plinth ring
    b.cyl(R, 20, 'industryWhite', { x: cx, z: cz }, 14);
    b.dome(R, 'industryWhite', { x: cx, z: cz, y: 20 }, 14);
    b.cyl(R + 0.12, 0.9, 'solar', { x: cx, z: cz, y: rng.float(13, 15) }, 14);
    // personnel airlock door on the east side
    b.quad(1.7, 2.5, 'steelDark', { x: cx + R + 0.06, z: cz, y: 1.1, ry: Math.PI / 2 });

    // ---- turbine hall attached to the east ----
    const hx = 8.5;
    const hz = -5;
    const hw = 21;
    const hd = 11;
    const hh = 9;
    b.box(hw, hh, hd, 'cream', { x: hx, z: hz });
    b.box(hw + 0.4, 0.35, hd + 0.4, 'creamDark', { x: hx, z: hz, y: hh });
    for (let i = 0; i < 4; i++) {
      b.box(1.5, 0.75, 1.1, 'steelDark', { x: hx - 7 + i * 4.7, z: hz + rng.float(-2, 2), y: hh + 0.35 });
    }
    b.cyl(0.5, 0.35, 'steel', { x: hx + 6, z: hz - 3.5, y: hh + 0.35 }, 10);
    // clerestory window strip on the south face
    for (let i = 0; i < 6; i++) {
      const lit = rng.chance(0.25);
      b.quad(2.1, 1.3, lit ? 'windowLit' : 'windowDark', {
        x: hx - 7.5 + i * 3,
        z: hz + hd / 2 + 0.06,
        y: 6.2,
        layer: lit ? 'emissive' : 'opaque',
      });
    }
    // big rolling door on the east end
    b.quad(3.6, 4.6, 'steelDark', { x: hx + hw / 2 + 0.06, z: hz, y: 0.12, ry: Math.PI / 2 });
    // steam lines from containment into the hall
    tube(b, { x: cx + 5, y: 12, z: cz }, { x: cx + 11, y: hh - 1, z: cz }, 0.35, 'pipe');
    tube(b, { x: cx + 5, y: 10.5, z: cz + 2.2 }, { x: cx + 11, y: hh - 2.5, z: cz + 2.2 }, 0.28, 'pipe');

    // ---- twin slim stacks with beacon tips ----
    for (const sz of [3.5, 7.5]) {
      b.cyl(0.55, 22, 'industryWhite', { x: 19.5, z: sz }, 10);
      b.cyl(0.62, 0.5, 'steel', { x: 19.5, z: sz, y: 17.5 }, 10);
      b.cyl(0.58, 0.55, 'beaconRed', { x: 19.5, z: sz, y: 22, layer: 'emissive' }, 10);
    }

    // ---- mini switchyard in the northeast corner ----
    b.box(9.5, 0.1, 7.5, 'concreteDark', { x: 15.8, z: 15.8, y: 0.12 });
    const yardTs = [transformer(b, rng, 13.5, 16.5, 0.62), transformer(b, rng, 18.5, 16.5, 0.62)];
    for (const px of [12.5, 19.5]) {
      b.box(0.28, 4.6, 0.28, 'steel', { x: px, z: 12.8 });
    }
    b.box(7.8, 0.3, 0.3, 'steel', { x: 16, z: 12.8, y: 4.6 });
    for (let i = 0; i < 2; i++) {
      const ix = i === 0 ? 13.5 : 18.5;
      b.cyl(0.1, 0.5, 'industryWhite', { x: ix, y: 4.1, z: 12.8 }, 8);
      const t = yardTs[i];
      tube(b, { x: ix, y: 4.1, z: 12.8 }, { x: t.bushingXs[0], y: t.bushingTopY, z: t.z }, 0.04, 'charcoal');
    }

    // ---- control building with rooftop panels ----
    b.box(8, 3.8, 5.5, 'cream', { x: -16, z: 15 });
    b.box(8.3, 0.25, 5.8, 'creamDark', { x: -16, z: 15, y: 3.8 });
    for (let i = 0; i < 3; i++) {
      const lit = rng.chance(0.4);
      b.quad(1.5, 1.2, lit ? 'windowLit' : 'windowDark', {
        x: -18.2 + i * 2.2,
        z: 17.81,
        y: 1.5,
        layer: lit ? 'emissive' : 'opaque',
      });
    }
    b.quad(1.1, 2.2, 'steelDark', { x: -12.5, z: 15, y: 0.12, ry: Math.PI / 2 });
    for (let i = 0; i < 2; i++) {
      b.box(3.0, 0.1, 1.7, 'solar', { x: -17.8 + i * 3.6, z: 15, y: 4.15, rx: -Math.PI * 0.1 });
    }
    // footpath from the control building toward the hall
    b.box(2.4, 0.05, 9.5, 'path', { x: -16, z: 7.5, y: 0.12 });
    b.instance('shrub', -11.8, 0.12, 13.2, rng.float(0, Math.PI * 2), rng.float(1.0, 1.4));
    b.instance('shrub', -20.2, 0.12, 12.4, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));

    // ---- perimeter security fence + landscaping trees outside it ----
    fenceRing(b, 21.8, 1.6, 4.36);
    b.instance('tree', -23.2, 0, 23.2, rng.float(0, Math.PI * 2), rng.float(0.65, 0.72));
    b.instance('treeRound', 23.2, 0, -23.2, rng.float(0, Math.PI * 2), rng.float(0.65, 0.72));

    return b.merge();
  },
};

const modules: ModuleDef[] = [solarCanopy, solarField, batteryYard, substation, smr];
export default modules;
