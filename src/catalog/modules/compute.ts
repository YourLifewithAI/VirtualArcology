/**
 * Compute modules: the neighborhood's quiet digital backbone. A windowless
 * server hall with its chiller yard, and a lattice comms mast bristling with
 * dishes. Composed from PartsBuilder + shared parts; all variation seeded.
 */
import * as THREE from 'three';
import { PartsBuilder } from '../../core/geo';
import type { Rng } from '../../core/Rng';
import type { ModuleDef } from '../types';
import { groundSlab, trussMast, tube } from '../parts';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Rotate a wall-local (lateral lx, outward lz) offset by yaw ry. */
function rot(ry: number, lx: number, lz: number): { x: number; z: number } {
  const s = Math.sin(ry);
  const c = Math.cos(ry);
  return { x: lx * c + lz * s, z: -lx * s + lz * c };
}

/**
 * V-shaped dry cooler: skid base, two coil panels leaning apart into a V,
 * fan deck bridging the top with two fan rings. Long axis along X.
 */
function dryCooler(b: PartsBuilder, x: number, z: number): void {
  // skid
  b.box(4.4, 0.3, 2.6, 'steelDark', { x, z });
  // coil panels: bases meet near the center line, tops splay outward (a V)
  b.box(4.2, 2.4, 0.16, 'industryWhite', { x, z: z - 0.12, y: 0.3, rx: -0.42 });
  b.box(4.2, 2.4, 0.16, 'industryWhite', { x, z: z + 0.12, y: 0.3, rx: 0.42 });
  // fan deck spanning the open top of the V
  b.box(4.3, 0.16, 2.3, 'steel', { x, z, y: 2.45 });
  for (const fx of [-1.1, 1.1]) {
    b.cyl(0.78, 0.32, 'steelDark', { x: x + fx, z, y: 2.61 }, 10);
    b.cyl(0.5, 0.08, 'charcoal', { x: x + fx, z, y: 2.93 }, 8);
  }
}

/** Parabolic-ish dish (shallow cone) on a mount arm, facing azimuth az. */
function dishAntenna(b: PartsBuilder, y: number, az: number, r: number, tiltUp: number): void {
  const sx = Math.sin(az);
  const cz = Math.cos(az);
  const reach = 1.15;
  // mount arm out from the mast
  tube(b, { x: 0, y, z: 0 }, { x: sx * reach, y, z: cz * reach }, 0.07, 'steelDark');
  // reflector: wide cone mouth facing outward, tipped slightly skyward
  const g = new THREE.CylinderGeometry(r, 0.14, 0.55, 12);
  g.rotateX(Math.PI / 2 - tiltUp);
  b.custom(g, 'industryWhite', { x: sx * (reach + 0.15), y, z: cz * (reach + 0.15), ry: az });
  // feed boom poking out of the dish face
  tube(
    b,
    { x: sx * (reach + 0.15), y, z: cz * (reach + 0.15) },
    { x: sx * (reach + 0.9), y: y + 0.32, z: cz * (reach + 0.9) },
    0.035,
    'steel',
  );
}

// ---------------------------------------------------------------------------
// data-center
// ---------------------------------------------------------------------------

const dataCenter: ModuleDef = {
  id: 'data-center',
  name: 'Data Center Hall',
  category: 'compute',
  description:
    'Windowless charcoal server hall with white louver bands, a fenced chiller yard of V dry coolers and backup generators',
  footprint: { w: 6, d: 4 },
  height: 11,
  build(rng: Rng) {
    const b = new PartsBuilder();
    const W = 54; // hall length (x)
    const D = 20; // hall depth (z)
    const H = 9.6; // wall height
    const hallZ = -7; // hall spans z -17..3; chiller yard on +z side
    const frontZ = hallZ - D / 2; // -17

    groundSlab(b, 6, 4, 'concreteDark');

    // ---- the hall: long charcoal windowless box ----
    b.box(W, H, D, 'charcoal', { z: hallZ });
    // roof slab
    b.box(W - 0.6, 0.25, D - 0.6, 'concreteDark', { z: hallZ, y: H });
    // solar-blue accent band at the roofline, slightly proud
    b.box(W + 0.5, 0.65, D + 0.5, 'solar', { z: hallZ, y: H - 0.65 });
    // three horizontal white louver stripe bands, full length, proud of the walls
    for (const bandY of [3.0, 5.0, 7.0]) {
      b.box(W + 0.4, 0.5, D + 0.4, 'industryWhite', { z: hallZ, y: bandY });
    }

    // ---- personnel entrance on the front (south) wall ----
    const dx = rng.float(-19, -13);
    b.quad(1.5, 2.5, 'windowDark', { x: dx, z: frontZ - 0.07, y: 0.12, ry: Math.PI });
    // robotTeal door-status strip beside the door
    b.box(0.22, 2.5, 0.12, 'robotTeal', { x: dx + 1.2, z: frontZ - 0.1, y: 0.12, layer: 'emissive' });
    // stoop + canopy
    b.box(3.4, 0.14, 1.8, 'concrete', { x: dx, z: frontZ - 1.0, y: 0 });
    b.box(3.0, 0.18, 1.2, 'steelDark', { x: dx, z: frontZ - 0.6, y: 2.75 });
    // glowing logo square near the entrance
    b.quad(1.5, 1.5, 'windowLit', { x: dx + 5.4, z: frontZ - 0.08, y: 5.4, ry: Math.PI, layer: 'emissive' });

    // ---- intake louver panels on the yard-side wall ----
    const backZ = hallZ + D / 2; // 3
    for (const lx of [-10, 4]) {
      b.box(3.2, 2.2, 0.14, 'steel', { x: lx, z: backZ + 0.05, y: 0.9 });
    }

    // ---- rooftop vent stacks ----
    const nVents = rng.int(3, 4);
    for (let i = 0; i < nVents; i++) {
      const vx = -18 + (i * 38) / Math.max(1, nVents - 1) + rng.float(-1.5, 1.5);
      const vz = hallZ + rng.float(-4.5, 4.5);
      b.box(1.7, 0.8, 1.7, 'steel', { x: vx, z: vz, y: H + 0.25 });
      b.cyl(0.5, 0.22, 'steelDark', { x: vx, z: vz, y: H + 1.05 }, 10);
    }

    // ---- chiller yard along the +z long side ----
    b.box(50, 0.2, 14, 'concrete', { z: 10.75, y: 0 });

    // 4-5 V-shaped dry coolers, each piped back into the hall
    const nCoolers = rng.int(4, 5);
    const coolerZ = 8;
    for (let i = 0; i < nCoolers; i++) {
      const cx = -22 + (i * 28) / (nCoolers - 1) + rng.float(-0.5, 0.5);
      dryCooler(b, cx, coolerZ);
      for (const px of [-0.6, 0.6]) {
        tube(b, { x: cx + px, y: 0.9, z: coolerZ - 1.1 }, { x: cx + px, y: 1.5, z: backZ + 0.1 }, 0.11, 'pipe');
      }
    }

    // 2 backup generator containers with exhaust stubs
    for (const gx of [15, 22]) {
      const gz = 13.8 + rng.float(-0.4, 0.4);
      b.box(6.2, 2.9, 2.5, 'steelDark', { x: gx, z: gz });
      b.box(6.24, 0.3, 2.54, 'safetyAmber', { x: gx, z: gz, y: 1.2 });
      const ex = gx + (rng.chance(0.5) ? -2.2 : 2.2);
      b.cyl(0.16, 1.3, 'charcoal', { x: ex, z: gz - 0.6, y: 2.9 }, 8);
      b.cyl(0.24, 0.12, 'charcoal', { x: ex, z: gz - 0.6, y: 4.2 }, 8);
      // radiator grille on one end
      b.box(0.1, 1.8, 1.9, 'charcoal', { x: gx - 3.08, z: gz, y: 0.5 });
    }

    // ---- security fence around the yard (posts + two rails) ----
    const fenceX = 26;
    const fenceBackZ = 18.5;
    const fenceFrontZ = 3.5;
    const postC = 'steelDark' as const;
    for (let i = 0; i <= 10; i++) {
      b.box(0.1, 1.9, 0.1, postC, { x: -fenceX + i * 5.2, z: fenceBackZ });
    }
    for (const sx of [-1, 1] as const) {
      for (const pz of [fenceFrontZ, 6.5, 10.5, 14.5]) {
        b.box(0.1, 1.9, 0.1, postC, { x: sx * fenceX, z: pz });
      }
    }
    for (const railY of [0.85, 1.65]) {
      b.box(2 * fenceX + 0.1, 0.07, 0.07, 'steel', { z: fenceBackZ, y: railY });
      for (const sx of [-1, 1] as const) {
        b.box(0.07, 0.07, fenceBackZ - fenceFrontZ, 'steel', {
          x: sx * fenceX,
          z: (fenceBackZ + fenceFrontZ) / 2,
          y: railY,
        });
      }
    }

    // ---- softening greenery along the public front ----
    b.instance('treeRound', 25.5, 0, -18, rng.float(0, Math.PI * 2), rng.float(0.8, 1.0));
    b.instance('tree', -26, 0, -18.3, rng.float(0, Math.PI * 2), rng.float(0.85, 1.05));
    for (const sx of [-2.6, 2.6]) {
      b.instance('shrub', dx + sx, 0.12, frontZ - 1.6, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));
    }

    return b.merge();
  },
};

// ---------------------------------------------------------------------------
// comms-mast
// ---------------------------------------------------------------------------

const commsMast: ModuleDef = {
  id: 'comms-mast',
  name: 'Comms Mast',
  category: 'compute',
  description: 'Lattice comms tower with dish antennas at several heights, base equipment cabinet and a red beacon tip',
  footprint: { w: 1, d: 1 },
  height: 26,
  build(rng: Rng) {
    const b = new PartsBuilder();
    const mastH = 25.3;

    groundSlab(b, 1, 1, 'concrete');
    b.box(2.4, 0.25, 2.4, 'concreteDark', { y: 0 }); // mast plinth

    trussMast(b, mastH, 0, 0, 0.85);

    // top platform + emissive beacon tip
    b.box(0.85, 0.14, 0.85, 'steelDark', { y: mastH - 0.02 });
    b.box(0.45, 0.45, 0.45, 'beaconRed', { y: mastH + 0.12, layer: 'emissive' });

    // trio of cell panel antennas near the top
    const az0 = rng.float(0, Math.PI * 2);
    for (let k = 0; k < 3; k++) {
      const az = az0 + (k * Math.PI * 2) / 3;
      b.box(0.34, 1.7, 0.13, 'industryWhite', {
        x: Math.sin(az) * 0.48,
        z: Math.cos(az) * 0.48,
        y: 22.6,
        ry: az,
      });
    }

    // 2-3 dishes at different heights and azimuths
    const nDishes = rng.int(2, 3);
    const dishYs = [20.6, 16.4, 12.4];
    for (let i = 0; i < nDishes; i++) {
      const y = dishYs[i] + rng.float(-0.8, 0.8);
      const az = az0 + 0.9 + i * rng.float(1.6, 2.6);
      dishAntenna(b, y, az, rng.float(0.75, 1.15), rng.float(0.05, 0.3));
    }

    // ---- equipment cabinet at the base ----
    const cabAz = rng.float(-0.4, 0.4);
    const cabX = 2.7;
    const cabZ = 2.1;
    b.box(1.8, 1.5, 1.15, 'industryWhite', { x: cabX, z: cabZ, ry: cabAz });
    b.box(1.9, 0.12, 1.25, 'steel', { x: cabX, z: cabZ, y: 1.5, ry: cabAz }); // rain cap
    const door = rot(cabAz, -0.25, 0.59);
    b.quad(0.75, 1.15, 'steel', { x: cabX + door.x, z: cabZ + door.z, y: 0.2, ry: cabAz });
    const led = rot(cabAz, 0.6, 0.6);
    b.box(0.1, 0.1, 0.06, 'robotTeal', { x: cabX + led.x, z: cabZ + led.z, y: 1.25, ry: cabAz, layer: 'emissive' });
    // cable run: cabinet -> mast base -> up one leg to the first dish height
    tube(b, { x: cabX - 0.5, y: 0.5, z: cabZ - 0.4 }, { x: 0.5, y: 0.4, z: 0.4 }, 0.06, 'pipe');
    tube(b, { x: 0.5, y: 0.4, z: 0.4 }, { x: 0.16, y: dishYs[nDishes - 1], z: 0.16 }, 0.045, 'pipe');

    // ---- guy-line suggestion to pad-corner anchors ----
    if (rng.chance(0.85)) {
      const guyY = rng.float(15.5, 18.5);
      for (const [gx, gz] of [
        [-3.9, -3.9],
        [3.9, -3.9],
        [-3.9, 3.9],
      ] as const) {
        b.box(0.7, 0.4, 0.7, 'concreteDark', { x: gx, z: gz });
        tube(b, { x: gx * 0.08, y: guyY, z: gz * 0.08 }, { x: gx, y: 0.4, z: gz }, 0.022, 'steelDark');
      }
    }

    // a little green at the pad edge
    b.instance('shrub', -3.4, 0.12, 2.9, rng.float(0, Math.PI * 2), rng.float(0.9, 1.3));
    b.instance('shrub', -2.6, 0.12, -3.4, rng.float(0, Math.PI * 2), rng.float(0.8, 1.2));

    return b.merge();
  },
};

const modules: ModuleDef[] = [dataCenter, commsMast];
export default modules;
