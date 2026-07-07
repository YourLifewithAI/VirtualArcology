/**
 * Civic & culture modules: plaza, market row, clinic, makerspace, community hall.
 * Composed from PartsBuilder primitives + shared parts helpers; all variation
 * flows through rng so placements are deterministic per seed.
 */
import * as THREE from 'three';
import { PartsBuilder } from '../../core/geo';
import type { ModuleDef } from '../types';
import { facadeWindows, groundSlab, mural, parapet, trussMast, tube } from '../parts';
import type { ColorName } from '../../core/Palette';

// ---------------------------------------------------------------------------
// 1. Central Plaza — 4x4 walkable paver plaza with fountain, trees, benches.
// ---------------------------------------------------------------------------

const plaza: ModuleDef = {
  id: 'plaza',
  name: 'Central Plaza',
  category: 'civic',
  description: 'Checkered paver plaza with a central fountain, shade trees and benches',
  footprint: { w: 4, d: 4 },
  height: 6,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 4, 'paver');

    // two-tone checker: overlay dark patches on the paver slab
    const cells = 8;
    const cell = 39.2 / cells;
    const parity = rng.int(0, 1);
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        if ((i + j) % 2 !== parity) continue;
        b.hquad(cell - 0.12, cell - 0.12, 'paverDark', {
          x: (i + 0.5) * cell - 19.6,
          z: (j + 0.5) * cell - 19.6,
          y: 0.125,
        });
      }
    }

    // central fountain: basin + lip ring + water + pedestal bowl
    const fr = rng.float(2.9, 3.5);
    b.cyl(fr + 0.45, 0.55, 'concrete', {}, 14);
    b.ring(fr + 0.3, 0.16, 'concrete', { y: 0.55 }, 16);
    b.disc(fr + 0.1, 'water', { y: 0.46 }, 16);
    b.cyl(0.45, 1.15, 'concrete', { y: 0.45 }, 10);
    b.cone(0.95, 0.5, 0.35, 'concrete', { y: 1.35 }, 12);
    b.disc(0.78, 'water', { y: 1.62 }, 12);

    // benches ringing the fountain, facing center (1.8 x 0.45 x 0.5 timberDark)
    const benches = rng.int(6, 8);
    const benchR = fr + rng.float(3.2, 4.2);
    const a0 = rng.float(0, Math.PI * 2);
    for (let i = 0; i < benches; i++) {
      const a = a0 + (i / benches) * Math.PI * 2 + rng.float(-0.1, 0.1);
      b.box(1.8, 0.45, 0.5, 'timberDark', {
        x: Math.cos(a) * benchR,
        z: Math.sin(a) * benchR,
        y: 0.12,
        ry: -a + Math.PI / 2,
      });
    }

    // corner shade trees (+ a couple of extras)
    const treeCount = rng.int(4, 6);
    const corners: [number, number][] = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
      [rng.chance(0.5) ? -1 : 1, 0],
      [0, rng.chance(0.5) ? -1 : 1],
    ];
    for (let i = 0; i < treeCount; i++) {
      const [sx, sz] = corners[i];
      const x = sx === 0 ? rng.float(-2, 2) : sx * rng.float(13.5, 16);
      const z = sz === 0 ? rng.float(-2, 2) : sz * rng.float(13.5, 16);
      b.instance(rng.chance(0.5) ? 'tree' : 'treeRound', x, 0, z, rng.float(0, Math.PI * 2), rng.float(0.85, 1.05));
    }

    // planters with shrubs at the edge midpoints
    const planterSpots: [number, number][] = [
      [0, -13.5],
      [0, 13.5],
      [-13.5, 0],
      [13.5, 0],
    ];
    for (const [px, pz] of planterSpots) {
      const x = px + rng.float(-1, 1);
      const z = pz + rng.float(-1, 1);
      b.box(2.1, 0.55, 2.1, rng.pick(['concreteDark', 'terracotta'] as ColorName[]), { x, z, y: 0.12 });
      b.hquad(1.75, 1.75, 'soil', { x, z, y: 0.68 });
      const shrubs = rng.int(1, 2);
      for (let s = 0; s < shrubs; s++) {
        b.instance('shrub', x + rng.float(-0.45, 0.45), 0.6, z + rng.float(-0.45, 0.45), 0, rng.float(0.9, 1.3));
      }
    }

    // slim plaza lamps near the edges
    for (const [sx, sz] of [
      [-1, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
    ] as const) {
      const x = sx * 16.5 + rng.float(-0.6, 0.6);
      const z = sz * 9.5 + rng.float(-0.6, 0.6);
      b.cyl(0.08, 4.1, 'steelDark', { x, z, y: 0.12 }, 8);
      b.box(0.34, 0.3, 0.34, 'windowLit', { x, z, y: 4.22, layer: 'emissive' });
    }

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 2. Market Stall Row — 2x1 walkable strip of 4 canvas-canopy stalls.
// ---------------------------------------------------------------------------

const marketRow: ModuleDef = {
  id: 'market-row',
  name: 'Market Stall Row',
  category: 'civic',
  description: 'Four timber market stalls with striped canvas gables and festoon lights',
  footprint: { w: 2, d: 1 },
  height: 4,
  walkable: true,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 1, 'path');

    const canvases: ColorName[] = ['canvasRed', 'canvasTeal', 'canvasYellow'];
    const startColor = rng.int(0, 2);
    const zc = -0.7; // stalls sit toward the back; walkway to the south
    for (let i = 0; i < 4; i++) {
      const cx = -7.2 + i * 4.8;
      // 4 corner posts
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          b.box(0.14, 2.25, 0.14, 'timberDark', { x: cx + sx * 1.7, z: zc + sz * 1.5 });
        }
      }
      // canvas gable canopy, alternating colors
      b.gable(3.9, rng.float(0.8, 0.95), 3.5, canvases[(startColor + i) % 3], { x: cx, z: zc, y: 2.2 });
      // counter + crates + produce
      b.box(3.1, 0.95, 0.85, 'timber', { x: cx, z: zc + 0.95, y: 0.12 });
      const crates = rng.int(2, 4);
      for (let c = 0; c < crates; c++) {
        const s = rng.float(0.45, 0.7);
        b.box(s, s * rng.float(0.6, 1), s, rng.pick(['timber', 'terracotta'] as ColorName[]), {
          x: cx + rng.float(-1.15, 1.15),
          z: zc + rng.float(-0.9, -0.1),
          y: 0.12,
          ry: rng.float(-0.3, 0.3),
        });
      }
      if (rng.chance(0.7)) {
        b.blob(0.26, rng.pick(['leaf', 'terracotta', 'canvasYellow'] as ColorName[]), {
          x: cx + rng.float(-1, 1),
          z: zc + 0.95,
          y: 1.07,
        });
      }
    }

    // festoon string across the walkway front: wire + warm bulbs
    const wireY = 2.55;
    const wireZ = 1.35;
    for (const px of [-8.6, 8.6]) {
      b.box(0.1, wireY + 0.12, 0.1, 'timberDark', { x: px, z: wireZ });
    }
    tube(b, { x: -8.6, y: wireY + 0.08, z: wireZ }, { x: 8.6, y: wireY + 0.08, z: wireZ }, 0.022, 'charcoal');
    const bulbs = rng.int(12, 15);
    for (let i = 0; i < bulbs; i++) {
      const t = i / (bulbs - 1);
      const sag = 0.2 * Math.abs(Math.sin(t * Math.PI * 4));
      b.quad(0.16, 0.24, 'windowLit', {
        x: -8.2 + t * 16.4,
        z: wireZ + 0.02,
        y: wireY - 0.24 - sag,
        layer: 'emissive',
      });
    }

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 3. Wellness Collective & Community Clinic — 3x3, two-story cream box.
// ---------------------------------------------------------------------------

const clinic: ModuleDef = {
  id: 'clinic',
  name: 'Wellness Collective & Community Clinic',
  category: 'civic',
  description: 'Two-story neighborhood clinic with glass entry, roof garden and green cross',
  footprint: { w: 3, d: 3 },
  height: 9,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 3, 'path');

    const W = 24;
    const Dm = 18; // main mass depth; wings extend south to 21 m overall
    const H = 7.2;
    const floorH = 3.6;

    // main mass + inter-floor shadow band
    b.box(W, H, Dm, 'cream');
    b.box(W + 0.15, 0.3, Dm + 0.15, 'creamDark', { y: floorH - 0.15 });

    // south wings flanking the full-height glass entry notch (x -3..3, z 9..12)
    for (const sx of [-1, 1]) {
      b.box(9, H, 3, 'cream', { x: sx * 7.5, z: 10.5 });
      b.box(9, 0.55, 0.25, 'cream', { x: sx * 7.5, z: 11.86, y: H }); // wing front parapet
      b.box(0.25, 0.55, 3, 'cream', { x: sx * 11.86, z: 10.5, y: H });
    }

    // glass entry notch: full-height glazing, mullions, door + lit transom
    b.quad(5.9, H - 0.2, 'glassTint', { z: 9.4, y: 0.12, layer: 'glass' });
    for (const mx of [-1.5, 0, 1.5]) {
      b.box(0.09, H - 0.2, 0.09, 'steelDark', { x: mx, z: 9.4, y: 0.12 });
    }
    b.quad(2.4, 2.7, 'timberDark', { z: 9.46, y: 0.15 });
    b.quad(2.4, 0.5, 'windowLit', { z: 9.46, y: 2.95, layer: 'emissive' });

    // entry canopy on slim posts inside the notch
    b.box(6.6, 0.18, 2.5, 'creamDark', { z: 10.6, y: 3.3 });
    for (const px of [-2.7, 2.7]) {
      b.cyl(0.08, 3.3, 'steelDark', { x: px, z: 11.6, y: 0.15 }, 8);
    }

    // entry plinth + steps + accessible ramp along the west wing
    b.box(6.2, 0.3, 2.6, 'concrete', { z: 12.4 });
    b.box(6.6, 0.18, 0.8, 'concrete', { z: 14.05 });
    b.box(6.2, 0.12, 4.2, 'concrete', { x: -6.2, z: 12.5, y: 0.14, rz: 0.052 });
    b.box(5.6, 0.55, 0.1, 'steel', { x: -6.2, z: 14.0, y: 0.24, rz: 0.052 });

    // emissive medGreen cross on a white disc, proud of the east wing facade
    const crossSide = rng.chance(0.5) ? 1 : -1;
    const discGeom = new THREE.CircleGeometry(1.45, 14);
    b.custom(discGeom, 'white', { x: crossSide * 7.5, z: 12.14, y: 5.2 });
    b.quad(0.52, 1.9, 'medGreen', { x: crossSide * 7.5, z: 12.18, y: 5.2 - 0.95, layer: 'emissive' });
    b.quad(1.9, 0.52, 'medGreen', { x: crossSide * 7.5, z: 12.19, y: 5.2 - 0.26, layer: 'emissive' });

    // windows: east/west/north on the main mass, plus the wing fronts
    for (const [ry, cx, cz, len] of [
      [Math.PI, 0, -Dm / 2, W - 3],
      [Math.PI / 2, W / 2, 0, Dm - 3],
      [-Math.PI / 2, -W / 2, 0, Dm - 3],
    ] as const) {
      facadeWindows(b, rng, {
        width: len,
        y0: 1.0,
        rows: 2,
        rowHeight: floorH,
        windowH: 1.8,
        x: cx,
        z: cz,
        ry,
        offset: 0.06,
        litRatio: 0.25,
      });
    }
    for (const sx of [-1, 1]) {
      facadeWindows(b, rng, {
        width: 7,
        y0: 1.0,
        rows: 2,
        rowHeight: floorH,
        windowH: 1.8,
        cols: 3,
        x: sx * 7.5,
        z: 12,
        ry: 0,
        offset: 0.06,
        litRatio: 0.25,
      });
    }

    // roof garden: sedum slab + parapet + shrubs
    b.box(W - 1.2, 0.25, Dm - 1.2, 'leaf', { y: H });
    parapet(b, W, Dm, H, 'cream', 0.9);
    const roofShrubs = rng.int(5, 8);
    for (let i = 0; i < roofShrubs; i++) {
      b.instance('shrub', rng.float(-10, 10), H + 0.22, rng.float(-7, 7), 0, rng.float(0.9, 1.4));
    }

    // street greenery
    b.instance('tree', 13, 0, -11.5, rng.float(0, Math.PI * 2), rng.float(0.85, 1.0));
    b.instance('shrub', -crossSide * 12.5, 0.1, 12.5, 0, rng.float(1.0, 1.4));

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 4. The Forge & Printworks — 4x3 sawtooth workshop with gantry yard.
// ---------------------------------------------------------------------------

const makerspace: ModuleDef = {
  id: 'makerspace',
  name: 'The Forge & Printworks',
  category: 'civic',
  description: 'Sawtooth-roof maker hall with roll-up doors, gantry yard and copper-capped stack',
  footprint: { w: 4, d: 3 },
  height: 11,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 3, 'concreteDark');

    const hallX = -6;
    const hallW = 26;
    const hallD = 24;
    const wallH = 6.2;

    // hall walls + plinth
    b.box(hallW, wallH, hallD, 'timber', { x: hallX });
    b.box(hallW + 0.4, 0.5, hallD + 0.4, 'concreteDark', { x: hallX });

    // sawtooth roof: gable teeth with glass north-lights on the steep face
    const teeth = rng.int(3, 4);
    const toothD = hallD / teeth;
    const toothH = toothD * 0.42;
    const roofColor = rng.pick(['creamDark', 'industryWhite'] as ColorName[]);
    const slopeL = Math.hypot(toothD / 2, toothH);
    const glassTilt = Math.atan2(toothD / 2, toothH);
    for (let i = 0; i < teeth; i++) {
      const zc = -hallD / 2 + (i + 0.5) * toothD;
      b.gable(hallW, toothH, toothD, roofColor, { x: hallX, y: wallH, z: zc });
      b.quad(hallW - 1.4, slopeL - 0.25, 'glassTint', {
        x: hallX,
        z: zc - toothD / 2 - 0.04,
        y: wallH + 0.08,
        rx: glassTilt,
        ry: Math.PI,
        layer: 'glass',
      });
    }

    // two roll-up doors on the street (south) side, safetyAmber frames
    for (const dx of [-14, -5]) {
      b.quad(5, 4.8, 'steelDark', { x: dx, z: hallD / 2 + 0.06, y: 0.12 });
      for (let r = 1; r <= 3; r++) {
        b.quad(4.7, 0.12, 'charcoal', { x: dx, z: hallD / 2 + 0.09, y: r * 1.2 });
      }
      for (const fx of [-2.7, 2.7]) {
        b.box(0.28, 5.15, 0.2, 'safetyAmber', { x: dx + fx, z: hallD / 2 + 0.02 });
      }
      b.box(5.7, 0.32, 0.2, 'safetyAmber', { x: dx, z: hallD / 2 + 0.02, y: 5.0 });
    }
    // clerestory strip beside the doors
    facadeWindows(b, rng, {
      width: 6,
      y0: 4.6,
      rows: 1,
      rowHeight: 1.6,
      windowH: 1.2,
      cols: 4,
      x: 3.2,
      z: hallD / 2,
      ry: 0,
      offset: 0.06,
      litRatio: 0.35,
    });

    // work yard slab east of the hall, with gantry frame over it
    b.box(11, 0.15, hallD - 1, 'concrete', { x: 13.4 });
    b.box(9, 0.1, 0.35, 'safetyAmber', { x: 13.4, z: 11.2, y: 0.15 });
    trussMast(b, 7.4, 13.4, -9, 0.7);
    trussMast(b, 7.4, 13.4, 9, 0.7);
    b.box(0.9, 0.8, 18.6, 'safetyAmber', { x: 13.4, y: 6.9 });
    const trolleyZ = rng.float(-5, 5);
    b.box(0.75, 0.5, 1.1, 'steelDark', { x: 13.4, z: trolleyZ, y: 6.4 });
    tube(b, { x: 13.4, y: 6.4, z: trolleyZ }, { x: 13.4, y: rng.float(3.6, 5.2), z: trolleyZ }, 0.05, 'charcoal');

    // yard clutter: crates + drums
    const crates = rng.int(3, 5);
    for (let i = 0; i < crates; i++) {
      const s = rng.float(0.8, 1.5);
      b.box(s, rng.float(0.6, 1.3), s, rng.pick(['timber', 'steel', 'terracotta'] as ColorName[]), {
        x: rng.float(10, 17),
        z: rng.float(-9, 8),
        y: 0.15,
        ry: rng.float(-0.4, 0.4),
      });
    }
    b.cyl(0.5, 1.1, rng.pick(['hazardRed', 'safetyAmber'] as ColorName[]), { x: rng.float(9.5, 11), z: rng.float(-7, -3), y: 0.15 }, 10);

    // slender stack with copper cap, braced back to the hall
    const stackX = 8.4;
    const stackZ = -10.3;
    b.cyl(0.38, 9.8, 'steel', { x: stackX, z: stackZ }, 10);
    b.cone(0.6, 0.42, 0.45, 'copper', { x: stackX, z: stackZ, y: 9.8 }, 10);
    b.cyl(0.5, 0.28, 'copper', { x: stackX, z: stackZ, y: 10.25 }, 10);
    tube(b, { x: 7, y: 5.8, z: stackZ }, { x: stackX, y: 7.4, z: stackZ }, 0.06, 'steelDark');

    // mural on the west gable-end wall
    mural(b, rng, 12, 4.6, hallX - hallW / 2, 0, -Math.PI / 2, 0.08, 0.8);

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// 5. Community Hall — 3x3 timber gable hall with porch colonnade.
// ---------------------------------------------------------------------------

const commons: ModuleDef = {
  id: 'commons',
  name: 'Community Hall',
  category: 'civic',
  description: 'Big timber gable hall with a porch colonnade, tall windows and a gable mural',
  footprint: { w: 3, d: 3 },
  height: 10,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 3, 'path');

    const W = 20;
    const Dh = 15;
    const wallH = 6;

    // hall body + skirt + terracotta gable roof with overhanging eaves
    b.box(W, wallH, Dh, 'timber');
    b.box(W + 0.3, 0.6, Dh + 0.3, 'timberDark');
    b.gable(W + 1.2, 3.8, Dh + 1.6, 'terracotta', { y: wallH });
    b.box(W + 1.4, 0.2, 0.5, 'timberDark', { y: wallH + 3.72 });

    // porch: deck + colonnade posts + flat canopy along the south front
    b.box(W - 0.6, 0.18, 3.2, 'timber', { z: Dh / 2 + 1.7 });
    const posts = 7;
    for (let i = 0; i < posts; i++) {
      const px = -8.4 + (i * 16.8) / (posts - 1);
      b.box(0.28, 3.5, 0.28, 'timberDark', { x: px, z: Dh / 2 + 2.9, y: 0.18 });
    }
    b.box(W - 0.4, 0.22, 3.4, 'timberDark', { z: Dh / 2 + 1.8, y: 3.62 });

    // tall windows: two strips flanking the entry, on both long facades
    for (const [ry, cz] of [
      [0, Dh / 2],
      [Math.PI, -Dh / 2],
    ] as const) {
      for (const sx of [-1, 1]) {
        facadeWindows(b, rng, {
          width: 6.5,
          y0: 0.9,
          rows: 2,
          rowHeight: 2.7,
          windowH: 2.2,
          windowW: 1.3,
          cols: 3,
          x: sx * 5.75,
          z: cz,
          ry,
          offset: 0.06,
          litRatio: 0.35,
        });
      }
    }

    // entry: double door + wall lanterns
    b.quad(3, 2.9, 'timberDark', { z: Dh / 2 + 0.07, y: 0.2 });
    b.quad(0.08, 2.9, 'creamDark', { z: Dh / 2 + 0.09, y: 0.2 });
    for (const lx of [-2.1, 2.1]) {
      b.quad(0.3, 0.5, 'windowLit', { x: lx, z: Dh / 2 + 0.08, y: 2.2, layer: 'emissive' });
    }

    // mural on one gable end
    const muralSide = rng.chance(0.5) ? 1 : -1;
    mural(b, rng, 9, 4.2, muralSide * W / 2, 0, muralSide * Math.PI / 2, 0.08, 0.9);

    // yard trees
    b.instance('tree', -12.8, 0, 11.8, rng.float(0, Math.PI * 2), rng.float(0.85, 1.0));
    b.instance('treeRound', 12.8, 0, -11.5, rng.float(0, Math.PI * 2), rng.float(0.85, 1.0));

    return b.merge();
  },
};


// ---------------------------------------------------------------------------
// Phase 2 civic additions
// ---------------------------------------------------------------------------

const school: ModuleDef = {
  id: 'school',
  name: 'Tessera School (K-8)',
  category: 'civic',
  description: 'Two classroom wings around a play court, with a garden lab and gym',
  footprint: { w: 4, d: 3 },
  height: 9,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 4, 3, 'path');
    // two classroom wings + connector
    for (const [wx, wz, ww, wd] of [[-9, -7, 20, 10], [-9, 7, 20, 10]] as const) {
      b.box(ww, 7, wd, rng.chance(0.5) ? 'cream' : 'timber', { x: wx, z: wz, y: 0.1 });
      b.box(ww - 1, 0.3, wd - 1, 'leaf', { x: wx, z: wz, y: 7.1 });
      facadeWindows(b, rng, { width: ww - 3, y0: 1, rows: 2, rowHeight: 3.2, x: wx, z: wz + (wz < 0 ? -wd / 2 : wd / 2), ry: wz < 0 ? Math.PI : 0, offset: 0.06, litRatio: 0.3 });
    }
    b.box(4, 6.5, 6, 'terracotta', { x: -9, z: 0, y: 0.1 });
    // gym block
    b.box(12, 8.5, 16, 'creamDark', { x: 13, z: -3, y: 0.1 });
    b.gable(12, 2, 16, 'steel', { x: 13, z: -3, y: 8.6 });
    // play court + playground blobs
    b.hquad(11, 9, 'robotTeal', { x: 13, z: 10, y: 0.14 });
    for (let i = 0; i < 4; i++) {
      b.box(0.8, rng.float(0.6, 1.6), 0.8, rng.pick(['canvasRed', 'canvasYellow', 'canvasTeal'] as const), { x: 9 + i * 2.4, z: 13, y: 0.14 });
    }
    // garden lab beds + entrance sign
    for (let i = 0; i < 3; i++) b.box(3.5, 0.4, 1.2, 'soil', { x: -15 + i * 4.6, z: 13.2, y: 0.12 });
    b.quad(3, 1, 'canvasYellow', { x: -9, z: 12.56, y: 2.2 });
    b.instance('tree', 3, 0.1, 12, rng.float(0, 6.28), 1.0);
    b.instance('tree', -17, 0.1, -13, rng.float(0, 6.28), 1.1);
    return b.merge();
  },
};

const fireStation: ModuleDef = {
  id: 'fire-station',
  name: 'Emergency Services Station',
  category: 'civic',
  description: 'Fire, EMS and community safety under one roof: two apparatus bays and a drill tower',
  footprint: { w: 3, d: 2 },
  height: 14,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 2, 'concreteDark');
    // apparatus hall with two red bay doors
    b.box(16, 6.5, 12, 'industryWhite', { x: -4, z: -2, y: 0.1 });
    b.box(16.2, 0.5, 12.2, 'hazardRed', { x: -4, z: -2, y: 6.6 });
    for (const dx of [-8.5, -0.5]) {
      b.quad(5.5, 4.6, 'hazardRed', { x: dx + 0.8, z: 4.07, y: 0.6 });
      b.box(6, 0.3, 0.15, 'industryWhite', { x: dx + 0.8, z: 4.12, y: 5.4 });
    }
    // crew quarters wing + emissive sign
    b.box(9, 6.5, 8, 'cream', { x: 9.5, z: -4, y: 0.1 });
    facadeWindows(b, rng, { width: 7, y0: 1, rows: 2, rowHeight: 2.8, x: 9.5, z: 0.05, ry: 0, offset: 0.06, litRatio: 0.5 });
    b.quad(4.4, 0.9, 'hazardRed', { x: -4, z: 4.13, y: 5.6, layer: 'emissive' });
    // drill/hose tower
    b.box(3, 12.5, 3, 'concreteDark', { x: 12, z: 5.5, y: 0.1 });
    b.box(3.3, 0.4, 3.3, 'hazardRed', { x: 12, z: 5.5, y: 12.6 });
    // helipad-style EMS pad marking
    b.disc(3.2, 'industryWhite', { x: -10.5, z: 6.2, y: 0.14 }, 14);
    b.disc(2.4, 'hazardRed', { x: -10.5, z: 6.2, y: 0.16 }, 14);
    return b.merge();
  },
};

const natatorium: ModuleDef = {
  id: 'natatorium',
  name: 'Public Pools & Natatorium',
  category: 'civic',
  description: 'Indoor lap pool under a glass vault plus an outdoor pool and splash pad (it is Texas)',
  footprint: { w: 3, d: 3 },
  height: 9,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 3, 'paver');
    // glass-vaulted indoor hall
    b.box(16, 1.2, 24, 'cream', { x: -5.5, z: 0, y: 0.1 });
    b.box(15, 6.5, 23, 'glassTint', { x: -5.5, z: 0, y: 1.3, layer: 'glass' });
    const vault = new THREE.CylinderGeometry(7.5, 7.5, 23, 14, 1, false, 0, Math.PI);
    vault.rotateZ(Math.PI / 2);
    vault.rotateY(Math.PI / 2);
    vault.translate(0, 0, 0);
    b.custom(vault, 'glassTint', { x: -5.5, y: 7.8, layer: 'glass' });
    b.hquad(11, 19, 'water', { x: -5.5, y: 1.35 });
    // outdoor pool + deck + splash pad
    b.box(11, 0.5, 16, 'concrete', { x: 8.5, z: -5, y: 0.1 });
    b.hquad(9, 13.5, 'waterDeep', { x: 8.5, z: -5, y: 0.62 });
    b.disc(3.4, 'glassTint', { x: 8.5, z: 9, y: 0.16 }, 14);
    for (let i = 0; i < 3; i++) {
      b.cyl(0.12, 2.2, 'robotTeal', { x: 7 + i * 1.6, z: 9, y: 0.16 }, 6);
      b.dome(0.55, 'canvasTeal', { x: 7 + i * 1.6, z: 9, y: 2.3 }, 8);
    }
    // loungers + shade sails
    for (let i = 0; i < 4; i++) b.box(0.7, 0.35, 1.8, 'canvasYellow', { x: 13.5, z: -11 + i * 3.4, y: 0.6 });
    b.quad(5, 4, rng.pick(['canvasTeal', 'canvasRed'] as const), { x: 12, z: 6, y: 2.6, ry: 0.6, rx: -0.5 });
    b.instance('tree', -14.2, 0.1, 13.5, rng.float(0, 6.28), 1.0);
    return b.merge();
  },
};

const venue: ModuleDef = {
  id: 'venue',
  name: 'Venue & Food Hall Row',
  category: 'civic',
  description: 'Amphitheater bowl, stage canopy and a strip of restaurant stalls facing the lawn',
  footprint: { w: 3, d: 2 },
  height: 8,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 3, 2, 'grass');
    // amphitheater: concentric seating arcs
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.CylinderGeometry(5 + r * 1.7, 5 + r * 1.7, 0.4 + r * 0.3, 20, 1, false, Math.PI * 0.15, Math.PI * 0.7);
      ring.translate(0, (0.4 + r * 0.3) / 2, 0);
      b.custom(ring, r % 2 ? 'paver' : 'paverDark', { x: -6, z: 2 });
    }
    // stage + canopy
    b.disc(4, 'timber', { x: -6, z: -4, y: 0.5 }, 16);
    for (const [px, pz] of [[-9.5, -6.5], [-2.5, -6.5]] as const) b.box(0.3, 5.5, 0.3, 'steelDark', { x: px, z: pz, y: 0.5 });
    b.gable(9, 1.8, 6, 'canvasRed', { x: -6, z: -6.3, y: 5.9 });
    b.quad(6, 0.7, 'growWarm', { x: -6, z: -3.3, y: 5.2, layer: 'emissive' });
    // food hall strip: 4 stalls with counters and string lights
    for (let i = 0; i < 4; i++) {
      const x = 5 + i * 2.6;
      b.box(2.2, 3, 4.5, i % 2 ? 'timber' : 'terracotta', { x, z: 5, y: 0.1 });
      b.gable(2.4, 0.8, 5, 'creamDark', { x, z: 5, y: 3.1 });
      b.box(2.2, 1, 0.5, 'timberDark', { x, z: 2.5, y: 0.9 });
      b.quad(1.6, 0.5, 'windowLit', { x, z: 2.74, y: 2.2, layer: 'emissive' });
    }
    // picnic lawn tables + festoon posts
    for (let i = 0; i < 3; i++) b.box(1.8, 0.75, 0.9, 'timber', { x: 5 + i * 3, z: -3.5 + (i % 2), y: 0.1 });
    b.instance('tree', 12.5, 0.1, -6.5, rng.float(0, 6.28), 1.15);
    b.instance('tree', -13, 0.1, 7.5, rng.float(0, 6.28), 0.95);
    return b.merge();
  },
};

const grocery: ModuleDef = {
  id: 'grocery',
  name: 'Grocery Co-op',
  category: 'civic',
  description: 'The staples anchor: co-op market hall with a loading nook and rooftop solar',
  footprint: { w: 2, d: 2 },
  height: 7,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'paver');
    b.box(16, 5.5, 13, 'timber', { z: -2, y: 0.1 });
    b.gable(16, 1.6, 13, 'leafDark', { z: -2, y: 5.6 });
    solarRoofPatch(b, rng);
    // glass storefront + awning + sign
    b.quad(12, 3.2, 'glassTint', { z: 4.57, y: 0.6, layer: 'glass' });
    b.box(13, 0.25, 1.6, 'canvasTeal', { z: 5.2, y: 3.9 });
    b.quad(6, 0.9, 'growWarm', { z: 4.6, y: 4.6, layer: 'emissive' });
    // produce crates out front + cargo-bike rack
    for (let i = 0; i < 4; i++) b.box(0.9, 0.6, 0.9, rng.pick(['canvasRed', 'canvasYellow', 'leaf'] as const), { x: -5 + i * 1.4, z: 6.4, y: 0.12 });
    for (let i = 0; i < 4; i++) b.box(0.1, 0.8, 1.2, 'steelDark', { x: 4.5 + i * 0.9, z: 7, y: 0.12 });
    // loading nook
    b.quad(3, 2.6, 'steelDark', { x: -8.07, z: -2, y: 0.5, ry: -Math.PI / 2 });
    return b.merge();
  },
};

/** small helper: a modest tilted solar patch on the grocery roof */
function solarRoofPatch(b: PartsBuilder, rng: { float(a: number, b: number): number }): void {
  for (let i = 0; i < 4; i++) {
    b.box(3, 0.1, 1.7, 'solar', { x: -5 + i * 3.4, z: -2 + rng.float(-0.2, 0.2), y: 6.4, rx: -0.3 });
  }
}

const library: ModuleDef = {
  id: 'library',
  name: 'Library & Knowledge Commons',
  category: 'civic',
  description: 'Reading hall with a lantern clerestory — the civilian face of the data center',
  footprint: { w: 2, d: 2 },
  height: 10,
  build(rng) {
    const b = new PartsBuilder();
    groundSlab(b, 2, 2, 'path');
    b.box(15, 6, 13, 'cream', { y: 0.1 });
    // glowing lantern clerestory
    b.box(9, 2.6, 7, 'glassTint', { y: 6.1, layer: 'glass' });
    b.box(8.4, 2.2, 6.4, 'windowLit', { y: 6.2, layer: 'emissive' });
    b.box(9.6, 0.4, 7.6, 'timberDark', { y: 8.7 });
    facadeWindows(b, rng, { width: 12, y0: 1.2, rows: 1, rowHeight: 3.4, x: 0, z: 6.55, ry: 0, offset: 0.06, litRatio: 0.6, windowH: 3 });
    // colonnade porch + reading steps
    for (let i = 0; i < 5; i++) b.box(0.4, 3.4, 0.4, 'timber', { x: -5 + i * 2.5, z: 7.6, y: 0.1 });
    b.box(13, 0.3, 2.4, 'timberDark', { z: 7.6, y: 3.5 });
    b.box(10, 0.35, 1.4, 'paver', { z: 9, y: 0.1 });
    b.instance('tree', 8.6, 0.1, 8, rng.float(0, 6.28), 0.9);
    b.instance('shrub', -8.4, 0.1, 8, 0, 1.2);
    return b.merge();
  },
};

const modules: ModuleDef[] = [plaza, marketRow, clinic, makerspace, commons, school, fireStation, natatorium, venue, grocery, library];
export default modules;
