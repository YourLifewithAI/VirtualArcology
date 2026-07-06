/**
 * Food production modules: glasshouse range, vertical farm tower,
 * aquaponics hall and a walkable orchard plot.
 */
import * as THREE from 'three';
import { PartsBuilder } from '../../core/geo';
import type { ModuleDef } from '../types';
import { ahuBox, facadeWindows, groundSlab, parapet, solarRoof, tank, tube } from '../parts';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Open-topped round tank: white shell, steel rim, visible water surface. */
function openTank(b: PartsBuilder, r: number, h: number, x: number, z: number): void {
  b.cyl(r, h, 'industryWhite', { x, z }, 14);
  b.ring(r - 0.06, 0.09, 'steel', { x, z, y: h }, 14);
  b.disc(r - 0.14, 'water', { x, z, y: h - 0.28 }, 14);
}

// ---------------------------------------------------------------------------
// 1. Greenhouse Range
// ---------------------------------------------------------------------------

const greenhouse: ModuleDef = {
  id: 'greenhouse',
  name: 'Greenhouse Range',
  category: 'food',
  description: 'Three connected gabled glasshouses with warm grow beds, header house and irrigation tank',
  footprint: { w: 3, d: 2 },
  height: 7,
  build(rng) {
    const b = new PartsBuilder();
    const L = 24; // glasshouse length along x
    const HW = 6; // each house width along z
    const cx = -2.5; // houses span x in [-14.5, 9.5]
    const kneeH = 1.0;
    const eaveH = 3.3;
    const gableH = 2.2; // ridge at 5.5
    const knee = rng.pick(['cream', 'creamDark'] as const);

    groundSlab(b, 3, 2, 'path');

    const centers = [-6.5, 0, 6.5];
    for (const cz of centers) {
      // knee walls on all four sides
      b.box(L, kneeH, 0.3, knee, { x: cx, z: cz - HW / 2 + 0.15 });
      b.box(L, kneeH, 0.3, knee, { x: cx, z: cz + HW / 2 - 0.15 });
      b.box(0.3, kneeH, HW, knee, { x: cx - L / 2 + 0.15, z: cz });
      b.box(0.3, kneeH, HW, knee, { x: cx + L / 2 - 0.15, z: cz });
      // glass side + end walls
      const gh = eaveH - kneeH;
      b.quad(L, gh, 'glassTint', { x: cx, z: cz + HW / 2, y: kneeH, layer: 'glass' });
      b.quad(L, gh, 'glassTint', { x: cx, z: cz - HW / 2, y: kneeH, ry: Math.PI, layer: 'glass' });
      b.quad(HW, gh, 'glassTint', { x: cx - L / 2, z: cz, y: kneeH, ry: -Math.PI / 2, layer: 'glass' });
      b.quad(HW, gh, 'glassTint', { x: cx + L / 2, z: cz, y: kneeH, ry: Math.PI / 2, layer: 'glass' });
      // glass gable roof + timber ridge cap
      b.gable(L, gableH, HW, 'glassTint', { x: cx, z: cz, y: eaveH, layer: 'glass' });
      b.box(L + 0.2, 0.14, 0.28, 'timberDark', { x: cx, z: cz, y: eaveH + gableH });
      // west corner posts
      for (const sz of [-1, 1] as const) {
        b.box(0.18, eaveH, 0.18, 'timberDark', { x: cx - L / 2 + 0.09, z: cz + sz * (HW / 2 - 0.09) });
      }
      // interior warm crop beds glowing through the glass
      for (const so of [-1.55, 1.55]) {
        b.box(L - 3, 0.22, 1.8, 'growWarm', {
          x: cx + rng.float(-0.3, 0.3),
          z: cz + so,
          y: 0.75,
          layer: 'emissive',
        });
      }
    }
    // valley gutters connecting the three houses
    for (const gz of [-3.25, 3.25]) {
      b.box(L, 0.28, 0.9, 'steel', { x: cx, z: gz, y: eaveH - 0.28 });
    }

    // ---- header house (opaque service block) at the east end ----
    const hhX = 11.8; // spans x 9.5..14.1
    const hhW = 4.6;
    const hhD = 15;
    const hhH = 3.8;
    const hhColor = rng.pick(['cream', 'terracotta', 'creamDark'] as const);
    b.box(hhW, hhH, hhD, hhColor, { x: hhX });
    b.box(hhW + 0.4, 0.25, hhD + 0.4, 'creamDark', { x: hhX, y: hhH });
    facadeWindows(b, rng, {
      width: 12,
      y0: 1.6,
      rows: 1,
      rowHeight: 1,
      cols: 4,
      x: hhX + hhW / 2,
      z: 0,
      ry: Math.PI / 2,
      offset: 0.06,
      litRatio: 0.4,
    });
    b.quad(2.2, 2.5, 'timberDark', { x: hhX + hhW / 2 + 0.06, y: 0.12, ry: Math.PI / 2 });
    b.quad(3.0, 0.5, 'growWarm', { x: hhX + hhW / 2 + 0.06, y: 2.85, ry: Math.PI / 2, layer: 'emissive' });
    b.box(0.8, 0.14, 3.2, 'concrete', { x: hhX + hhW / 2 + 0.4, z: 0, y: 0 });
    // roof vents + a couple of panels
    for (const vz of [-4, 4]) {
      b.cyl(0.28, 1.0, 'steel', { x: hhX + rng.float(-0.8, 0.8), z: vz, y: hhH + 0.25 }, 10);
    }
    solarRoof(b, 3.4, 4.8, hhH + 0.25, { x: hhX, z: 3 });

    // ---- irrigation tank + external pipe run on the north side ----
    const tR = 1.1;
    const tH = 2.0;
    tank(b, tR, tH, 12.6, -8.5);
    tube(b, { x: 12.6, y: tH + 0.4, z: -8.5 }, { x: 12.6, y: 3.0, z: -7.4 }, 0.13);
    tube(b, { x: 10.2, y: 3.0, z: -7.4 }, { x: 13.6, y: 3.0, z: -7.4 }, 0.13);
    tube(b, { x: 10.2, y: 0.2, z: -7.4 }, { x: 10.2, y: 3.0, z: -7.4 }, 0.13);
    b.box(0.5, 0.5, 0.4, 'safetyAmber', { x: 10.2, z: -7.55, y: 0.9 });

    // crates + shrub near the header door
    b.box(1.0, 0.8, 1.0, 'timber', { x: 10.6, z: 8.4, y: 0.12, ry: rng.float(-0.15, 0.15) });
    b.box(0.9, 0.75, 0.9, 'timberDark', { x: 11.8, z: 8.5, y: 0.12, ry: rng.float(-0.3, 0.3) });
    b.instance('shrub', 14.0, 0.12, 8.7, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));
    b.instance('shrub', 14.2, 0.12, -3.5, rng.float(0, Math.PI * 2), rng.float(0.8, 1.2));

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 2. Vertical Farm Tower
// ---------------------------------------------------------------------------

const verticalFarm: ModuleDef = {
  id: 'vertical-farm',
  name: 'Vertical Farm Tower',
  category: 'food',
  description: '8-story glass grow tower banded with magenta grow lights, service core and rooftop water tank',
  footprint: { w: 2, d: 2 },
  height: 26,
  build(rng) {
    const b = new PartsBuilder();
    const S = 15; // tower side
    const fh = 2.9;
    const floors = 8;
    const roofY = floors * fh; // 23.2

    groundSlab(b, 2, 2, 'concrete');
    b.box(16.4, 0.5, 16.4, 'concreteDark', { y: 0 }); // dock-height plinth

    // ---- stacked floors: white slab + glass band + magenta grow strips ----
    for (let f = 0; f < floors; f++) {
      const y = f * fh;
      b.box(S + 0.5, 0.4, S + 0.5, 'industryWhite', { y });
      b.box(S, fh - 0.4, S, 'glassTint', { y: y + 0.4, layer: 'glass' });
      const stripRows = rng.int(1, 2);
      for (let r = 0; r < stripRows; r++) {
        const sy = y + 1.15 + r * 0.85;
        const half = S / 2 - 0.35; // just inside the glass
        b.box(S - 1.4, 0.12, 0.22, 'growMagenta', { z: half, y: sy, layer: 'emissive' });
        b.box(S - 1.4, 0.12, 0.22, 'growMagenta', { z: -half, y: sy, layer: 'emissive' });
        b.box(0.22, 0.12, S - 1.4, 'growMagenta', { x: half, y: sy, layer: 'emissive' });
        b.box(0.22, 0.12, S - 1.4, 'growMagenta', { x: -half, y: sy, layer: 'emissive' });
      }
    }
    b.box(S + 0.5, 0.45, S + 0.5, 'industryWhite', { y: roofY });

    // ---- solid service core at the NE corner, full height ----
    const coreH = roofY + 1.6;
    b.box(5.6, coreH, 5.6, 'concrete', { x: 5.2, z: 5.2 });
    b.box(5.9, 0.3, 5.9, 'concreteDark', { x: 5.2, z: 5.2, y: coreH });
    b.quad(0.7, roofY * 0.72, 'windowLit', { x: 8.01, z: 5.2, y: 1.2, ry: Math.PI / 2, layer: 'emissive' });
    b.quad(0.7, roofY * 0.72, 'windowLit', { x: 5.2, z: 8.01, y: 1.2, layer: 'emissive' });
    // external pipe risers hugging the core
    for (const pz of [3.2, 4.4]) {
      tube(b, { x: 8.14, y: 0.5, z: pz }, { x: 8.14, y: roofY + 0.3, z: pz }, 0.12);
    }

    // ---- ground level: dock door (south) + crew door (west) ----
    b.quad(4.6, 2.3, 'charcoal', { x: -2.5, z: 7.56, y: 0.55 });
    b.box(4.9, 0.22, 0.14, 'safetyAmber', { x: -2.5, z: 7.55, y: 2.85 });
    b.box(5.5, 0.5, 1.6, 'concreteDark', { x: -2.5, z: 9.0, y: 0 }); // dock apron
    for (const bx of [-5.6, 0.6]) {
      b.cyl(0.13, 0.65, 'safetyAmber', { x: bx, z: 9.3, y: 0 }, 8);
    }
    b.quad(3.4, 0.4, 'growMagenta', { x: -2.5, z: 7.78, y: 2.95, layer: 'emissive' }); // fascia sign
    b.quad(1.8, 2.3, 'timberDark', { x: -7.56, z: 1.5, y: 0.55, ry: -Math.PI / 2 });
    b.box(1.4, 0.5, 2.4, 'concrete', { x: -8.75, z: 1.5, y: 0 }); // entry step

    // ---- roof: parapet, water tank, solar, AHU ----
    const ry0 = roofY + 0.45;
    parapet(b, S + 0.5, S + 0.5, ry0, 'industryWhite', 0.8);
    tank(b, 1.35, 1.2, -4.2, -4.2, 'industryWhite', ry0);
    tube(b, { x: -4.2, y: ry0 + 0.4, z: -2.85 }, { x: -4.2, y: ry0 + 0.4, z: 0.6 }, 0.11);
    solarRoof(b, 8, 6, ry0, { x: 2.0, z: -4.0 });
    ahuBox(b, rng, -4.5, ry0, 2.5);

    // ---- lot greenery ----
    b.instance('treeRound', -8.6, 0.12, -8.6, rng.float(0, Math.PI * 2), rng.float(0.5, 0.62));
    b.instance('shrub', 9.1, 0.12, rng.float(-5, 3), rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));
    b.instance('shrub', rng.float(3, 6.5), 0.12, -9.1, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 3. Aquaponics Hall
// ---------------------------------------------------------------------------

const aquaponics: ModuleDef = {
  id: 'aquaponics',
  name: 'Aquaponics Hall',
  category: 'food',
  description: 'Barrel-vault grow hall with skylight ridge, three open fish tanks and a pump shed',
  footprint: { w: 3, d: 2 },
  height: 7,
  build(rng) {
    const b = new PartsBuilder();
    const R = 5.6; // vault radius
    const kneeH = 1.1;
    const hallLen = 21;
    const cx = -3.5; // hall spans x in [-14, 7]
    const endE = cx + hallLen / 2;
    const endW = cx - hallLen / 2;
    const wallC = rng.pick(['cream', 'creamDark'] as const);

    groundSlab(b, 3, 2, 'concrete');

    // knee walls along the long sides
    b.box(hallLen, kneeH, 0.4, wallC, { x: cx, z: R - 0.2 });
    b.box(hallLen, kneeH, 0.4, wallC, { x: cx, z: -(R - 0.2) });

    // barrel vault: half-cylinder shell, flat side down, axis along x
    const vault = new THREE.CylinderGeometry(R, R, hallLen, 14, 1, true, 0, Math.PI);
    vault.rotateZ(Math.PI / 2);
    b.custom(vault, 'industryWhite', { x: cx, y: kneeH });

    // cream end walls: knee box + half-disc cap, flush with the vault ends
    for (const [ex, ry] of [
      [endE, Math.PI / 2],
      [endW, -Math.PI / 2],
    ] as const) {
      const inward = ex > cx ? -0.2 : 0.2;
      b.box(0.4, kneeH, 2 * R, wallC, { x: ex + inward, z: 0 });
      const cap = new THREE.CircleGeometry(R, 14, 0, Math.PI);
      b.custom(cap, wallC, { x: ex, y: kneeH, ry });
    }

    // glowing skylight ridge + roof vents
    b.box(hallLen - 2, 0.2, 0.55, 'growWarm', { x: cx, y: kneeH + R - 0.12, layer: 'emissive' });
    for (const vx of [cx - 5.5, cx + 5.5]) {
      b.cyl(0.25, 0.8, 'steel', { x: vx, z: 1.5, y: kneeH + 5.15 }, 10);
    }

    // east end: door, sign, porthole windows
    b.quad(2.2, 2.5, 'timberDark', { x: endE + 0.04, z: -2.6, y: 0.12, ry: Math.PI / 2 });
    b.quad(2.4, 0.45, 'growWarm', { x: endE + 0.04, z: -2.6, y: 2.85, ry: Math.PI / 2, layer: 'emissive' });
    const litWin = rng.int(0, 1);
    for (let i = 0; i < 2; i++) {
      const lit = i === litWin;
      b.quad(1.0, 1.0, lit ? 'windowLit' : 'windowDark', {
        x: endE + 0.04,
        z: 0.6 + i * 1.9,
        y: 2.6,
        ry: Math.PI / 2,
        layer: lit ? 'emissive' : 'opaque',
      });
    }
    b.box(0.7, 0.12, 3.0, 'concrete', { x: endE + 0.4, z: -2.6, y: 0 });

    // ---- three open round tanks east of the hall ----
    const tR = 2.1;
    const tX = 11.5;
    const tH = 2.6;
    for (const tz of [-6.6, 0, 6.6]) {
      openTank(b, tR, tH + rng.float(-0.15, 0.15), tX, tz);
      // sloped feed pipe from tank rim toward the hall manifold
      tube(b, { x: tX - tR + 0.4, y: tH + 0.05, z: tz }, { x: 7.35, y: 3.1, z: tz }, 0.12);
    }
    // manifold along the hall's east face + drop into the wall
    tube(b, { x: 7.35, y: 3.1, z: -6.6 }, { x: 7.35, y: 3.1, z: 6.6 }, 0.14);
    tube(b, { x: 7.35, y: 3.1, z: 4.2 }, { x: 7.35, y: 0.2, z: 4.2 }, 0.14);

    // ---- pump shed tucked between tanks ----
    b.box(1.9, 1.8, 1.9, 'creamDark', { x: 13.6, z: 3.3 });
    b.box(2.2, 0.12, 2.2, 'timberDark', { x: 13.6, z: 3.3, y: 1.8 });
    b.quad(0.9, 1.3, 'timberDark', { x: 12.6, z: 3.3, y: 0.12, ry: -Math.PI / 2 });
    b.cyl(0.16, 0.6, 'steel', { x: 14.0, z: 2.9, y: 1.92 }, 8);
    tube(b, { x: 13.6, y: 1.1, z: 4.3 }, { x: 12.4, y: 1.1, z: 5.5 }, 0.1);

    // greenery at the quiet corners
    b.instance('shrub', -14.0, 0.12, 8.8, rng.float(0, Math.PI * 2), rng.float(0.9, 1.4));
    b.instance('shrub', 8.6, 0.12, -8.9, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 4. Orchard Plot
// ---------------------------------------------------------------------------

const orchard: ModuleDef = {
  id: 'orchard',
  name: 'Orchard Plot',
  category: 'food',
  description: 'Walkable fenced fruit orchard: nine round-canopy trees, crates, ladder and beehives',
  footprint: { w: 2, d: 2 },
  height: 6,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'soil');

    // grass strips under the tree rows
    for (const gz of [-6, 0, 6]) {
      b.box(17.5, 0.1, 2.8, 'grass', { z: gz, y: 0.06 });
    }
    // short path in from the south gate
    b.box(3.0, 0.1, 4.6, 'path', { z: 7.5, y: 0.05 });

    // ---- 3x3 jittered grid of fruit trees ----
    for (const gx of [-6, 0, 6]) {
      for (const gz of [-6, 0, 6]) {
        // keep the SE tree biased away from the crate corner
        const seCorner = gx === 6 && gz === 6;
        const jx = seCorner ? rng.float(-1.3, 0.1) : rng.float(-1.2, 1.2);
        const jz = seCorner ? rng.float(-1.3, 0.1) : rng.float(-1.2, 1.2);
        b.instance('treeRound', gx + jx, 0.1, gz + jz, rng.float(0, Math.PI * 2), rng.float(0.72, 1.0));
      }
    }

    // ---- low timber fence with a south gate gap ----
    const F = 9.4;
    const fence = (xa: number, za: number, xb: number, zb: number): void => {
      const alongX = Math.abs(xb - xa) > Math.abs(zb - za);
      const len = alongX ? Math.abs(xb - xa) : Math.abs(zb - za);
      const mx = (xa + xb) / 2;
      const mz = (za + zb) / 2;
      for (const railY of [0.3, 0.62]) {
        if (alongX) b.box(len, 0.09, 0.07, 'timber', { x: mx, z: mz, y: railY });
        else b.box(0.07, 0.09, len, 'timber', { x: mx, z: mz, y: railY });
      }
      const n = Math.max(2, Math.round(len / 3.1));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        b.box(0.14, 0.82, 0.14, 'timberDark', { x: xa + (xb - xa) * t, z: za + (zb - za) * t, y: 0.08 });
      }
    };
    fence(-F, -F, F, -F); // north
    fence(-F, -F, -F, F); // west
    fence(F, -F, F, F); // east
    fence(-F, F, -1.9, F); // south-west of the gate
    fence(1.9, F, F, F); // south-east of the gate
    for (const gx of [-1.9, 1.9]) {
      b.box(0.2, 1.1, 0.2, 'timberDark', { x: gx, z: F, y: 0.08 }); // gate posts
    }

    // ---- crate stack + leaning ladder near the SE corner ----
    b.box(1.05, 0.85, 1.05, 'timber', { x: 7.9, z: 7.2, y: 0.12, ry: rng.float(-0.12, 0.12) });
    b.box(1.05, 0.85, 1.05, 'timber', { x: 6.6, z: 7.6, y: 0.12, ry: rng.float(-0.3, 0.3) });
    b.box(0.92, 0.8, 0.92, 'timberDark', { x: 7.3, z: 7.35, y: 0.97, ry: rng.float(-0.35, 0.35) });
    const tilt = 0.55; // ladder leaning toward the crates (-z)
    const lbx = 7.5;
    const lbz = 8.9;
    for (const sx of [-0.3, 0.3]) {
      b.box(0.09, 2.2, 0.09, 'timber', { x: lbx + sx, z: lbz, y: 0.12, rx: -tilt });
    }
    for (const s of [0.45, 0.95, 1.45, 1.9]) {
      b.box(0.62, 0.07, 0.07, 'timber', {
        x: lbx,
        y: 0.12 + s * Math.cos(tilt),
        z: lbz - s * Math.sin(tilt),
      });
    }

    // ---- rain barrel + beehives at the other corners ----
    b.cyl(0.5, 0.9, 'timberDark', { x: -8.3, z: 7.8 }, 10);
    b.disc(0.4, 'water', { x: -8.3, z: 7.8, y: 0.82 }, 10);
    const hives = rng.int(1, 2);
    for (let i = 0; i < hives; i++) {
      const hx = -7.9 + i * 1.4;
      const hry = rng.float(-0.3, 0.3);
      b.box(0.75, 0.55, 0.75, 'cream', { x: hx, z: -7.7, y: 0.14, ry: hry });
      b.box(0.85, 0.1, 0.85, 'timberDark', { x: hx, z: -7.7, y: 0.69, ry: hry });
    }
    for (let i = 0; i < 3; i++) {
      b.instance(
        'shrub',
        rng.float(-8.6, 8.6),
        0.12,
        rng.chance(0.5) ? -8.5 : 8.5,
        rng.float(0, Math.PI * 2),
        rng.float(0.9, 1.4),
      );
    }

    return b.merge();
  },
};

const modules: ModuleDef[] = [greenhouse, verticalFarm, aquaponics, orchard];
export default modules;
