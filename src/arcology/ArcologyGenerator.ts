/**
 * Parametric massing for the terraced ziggurat: program-colored tier stack,
 * terrace rings with greenery/agrivoltaics/greenhouses, spire or crown,
 * sub-level block, and the rewilded surroundings (prairie, forest, SMR
 * campuses, grid tie) per the knowledge node.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE } from '../core/Palette';
import { Rng } from '../core/Rng';
import { instancedPartGeometry } from '../catalog/parts';
import { injectFloorBands } from './floorBands';
import {
  PROGRAM_COLORS,
  plateauHeight,
  tierSide,
  type ArcologyParams,
} from './params';

export interface TierSpawn {
  tier: number;
  /** Terrace walking surface elevation. */
  y: number;
  /** Suggested spawn point (south terrace midpoint). */
  spawn: THREE.Vector3;
  /** Terrace ring bounds: inner square half-side and outer half-side. */
  innerHalf: number;
  outerHalf: number;
}

export interface ArcologyBuild {
  group: THREE.Group;
  /** Materials that participate in cutaway clipping and x-ray swap. */
  massingMeshes: THREE.Mesh[];
  clippableMaterials: THREE.Material[];
  tierSpawns: TierSpawn[];
  dispose(): void;
}

function bakeColor(geom: THREE.BufferGeometry, hex: number): THREE.BufferGeometry {
  const c = new THREE.Color(hex).convertSRGBToLinear();
  const count = geom.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geom.toNonIndexed();
}

function box(w: number, h: number, d: number, x: number, y: number, z: number, hex: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return bakeColor(g, hex);
}

export function generateArcology(p: ArcologyParams, floorHeightRef: () => number): ArcologyBuild {
  const group = new THREE.Group();
  const opaque: THREE.BufferGeometry[] = [];
  const emissive: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  const tierSpawns: TierSpawn[] = [];
  const rng = new Rng(1337);
  const plateau = plateauHeight(p);
  const subDepth = p.subLevels * p.subLevelHeight;

  // ---- tier stack ----
  for (let t = 0; t < p.tiers; t++) {
    const side = tierSide(p, t);
    if (side <= 0) break;
    const program = p.program[t] ?? 'residential';
    const color = PROGRAM_COLORS[program];
    opaque.push(box(side, p.tierHeight, side, 0, t * p.tierHeight, 0, color));

    // agriculture tiers: magenta grow-light bands on all four facades
    if (program === 'agriculture') {
      for (let bandIdx = 0; bandIdx < 3; bandIdx++) {
        const y = t * p.tierHeight + (bandIdx + 0.8) * (p.tierHeight / 4);
        const bh = 2.5;
        emissive.push(box(side + 4, bh, 4, 0, y, side / 2, PALETTE.growMagenta));
        emissive.push(box(side + 4, bh, 4, 0, y, -side / 2, PALETTE.growMagenta));
        emissive.push(box(4, bh, side + 4, side / 2, y, 0, PALETTE.growMagenta));
        emissive.push(box(4, bh, side + 4, -side / 2, y, 0, PALETTE.growMagenta));
      }
    }
  }

  // ---- terrace rings (top of each tier) ----
  const treeMatrices: THREE.Matrix4[] = [];
  for (let t = 0; t < p.tiers; t++) {
    const outer = tierSide(p, t);
    const inner = tierSide(p, t + 1);
    if (outer <= 0) break;
    const y = (t + 1) * p.tierHeight - 0.15;
    const program = p.program[t] ?? 'residential';
    const ringW = (outer - inner) / 2;
    if (ringW <= 1) continue;

    const green = program === 'residential' || program === 'mixed' || program === 'agriculture';
    const surfHex = green ? PALETTE.leaf : PALETTE.concrete;
    // four ring slabs (N, S, E, W)
    const mid = (outer + inner) / 4;
    opaque.push(box(outer, 2, ringW, 0, y, mid + inner / 4, surfHex));
    opaque.push(box(outer, 2, ringW, 0, y, -(mid + inner / 4), surfHex));
    opaque.push(box(ringW, 2, inner, mid + inner / 4, y, 0, surfHex));
    opaque.push(box(ringW, 2, inner, -(mid + inner / 4), y, 0, surfHex));

    const surfaceY = y + 2;
    if (program === 'agriculture') {
      // agrivoltaic strips + greenhouse ranges on the south ring
      const rows = Math.floor(ringW / 40);
      for (let r = 0; r < rows; r++) {
        const z = inner / 2 + 18 + r * 40;
        opaque.push(box(outer * 0.85, 3, 8, 0, surfaceY, z, PALETTE.solar));
        if (r % 2 === 0) {
          glass.push(box(outer * 0.7, 14, 12, 0, surfaceY, -z, PALETTE.glassTint));
        }
      }
    } else if (green) {
      // groves of (over-scaled) trees so terraces read green at distance
      const treeCount = Math.min(90, Math.floor(outer / 60));
      for (let i = 0; i < treeCount; i++) {
        const edge = rng.int(0, 3);
        const along = rng.float(-outer / 2 + ringW, outer / 2 - ringW);
        const depth = rng.float(inner / 2 + 12, outer / 2 - 12);
        const [x, z] =
          edge === 0 ? [along, depth] : edge === 1 ? [along, -depth] : edge === 2 ? [depth, along] : [-depth, along];
        const m = new THREE.Matrix4();
        const scale = rng.float(5, 9);
        m.makeRotationY(rng.float(0, Math.PI * 2));
        m.scale(new THREE.Vector3(scale, scale, scale));
        m.setPosition(x, surfaceY, z);
        treeMatrices.push(m);
      }
    } else {
      // industrial: vents + cranes
      const n = Math.floor(outer / 400);
      for (let i = 0; i < n; i++) {
        const x = rng.float(-outer / 2 + ringW * 0.2, outer / 2 - ringW * 0.2);
        const z = (inner / 2 + ringW / 2) * (rng.chance(0.5) ? 1 : -1);
        opaque.push(box(24, 18, 24, x, surfaceY, z, PALETTE.steelDark));
      }
    }

    tierSpawns.push({
      tier: t,
      y: surfaceY,
      spawn: new THREE.Vector3(0, surfaceY, inner / 2 + ringW / 2 + inner / 4),
      innerHalf: inner / 2,
      outerHalf: outer / 2,
    });
  }

  // ---- spire / crown ----
  const topSide = tierSide(p, p.tiers);
  if (p.spireHeight > 2) {
    const spire = new THREE.CylinderGeometry(p.spireTopSide / 2, p.spireBaseSide / 2, p.spireHeight, 12);
    spire.translate(0, plateau + p.spireHeight / 2, 0);
    opaque.push(bakeColor(spire, PALETTE.progSpire));
    // emissive banding
    const bands = Math.max(2, Math.floor(p.spireHeight / 90));
    for (let i = 1; i <= bands; i++) {
      const yy = plateau + (i / (bands + 1)) * p.spireHeight;
      const frac = 1 - (yy - plateau) / p.spireHeight;
      const r = (p.spireTopSide / 2) * (1 - frac) + (p.spireBaseSide / 2) * frac;
      const band = new THREE.CylinderGeometry(r + 2, r + 2, 3, 12);
      band.translate(0, yy, 0);
      emissive.push(bakeColor(band, PALETTE.progCompute));
    }
    // comms masts on the crown
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = p.spireTopSide / 2 - 14;
      const mast = new THREE.CylinderGeometry(1.6, 2.4, 60, 6);
      mast.translate(Math.cos(angle) * r, plateau + p.spireHeight + 30, Math.sin(angle) * r);
      opaque.push(bakeColor(mast, PALETTE.steel));
    }
    const beacon = new THREE.BoxGeometry(6, 6, 6);
    beacon.translate(0, plateau + p.spireHeight + 62, 0);
    emissive.push(bakeColor(beacon, PALETTE.beaconRed));
  } else if (topSide > 0) {
    // no spire: put a comms cluster on the plateau
    for (let i = 0; i < 4; i++) {
      const mast = new THREE.CylinderGeometry(2, 3, 90, 6);
      mast.translate((i - 1.5) * 60, plateau + 45, 0);
      opaque.push(bakeColor(mast, PALETTE.steel));
    }
  }

  // ---- sub-levels (visible in cutaway) ----
  opaque.push(box(p.baseSide * 0.985, subDepth, p.baseSide * 0.985, 0, -subDepth, 0, PALETTE.charcoal));

  // ---- merge massing ----
  const massingMeshes: THREE.Mesh[] = [];
  const clippableMaterials: THREE.Material[] = [];

  const massingMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02 });
  injectFloorBands(massingMat, floorHeightRef);
  clippableMaterials.push(massingMat);
  const massingGeom = mergeGeometries(opaque, false);
  const massingMesh = new THREE.Mesh(massingGeom, massingMat);
  group.add(massingMesh);
  massingMeshes.push(massingMesh);

  const emissiveMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  clippableMaterials.push(emissiveMat);
  if (emissive.length) {
    const em = new THREE.Mesh(mergeGeometries(emissive, false), emissiveMat);
    group.add(em);
  }

  const glassMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    roughness: 0.2,
    depthWrite: false,
  });
  clippableMaterials.push(glassMat);
  if (glass.length) {
    const gm = new THREE.Mesh(mergeGeometries(glass, false), glassMat);
    gm.renderOrder = 10;
    group.add(gm);
  }

  // terrace trees (instanced, clipped with the massing)
  const treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 });
  clippableMaterials.push(treeMat);
  if (treeMatrices.length) {
    const trees = new THREE.InstancedMesh(instancedPartGeometry('tree'), treeMat, treeMatrices.length);
    treeMatrices.forEach((m, i) => trees.setMatrixAt(i, m));
    trees.instanceMatrix.needsUpdate = true;
    trees.frustumCulled = false;
    group.add(trees);
    massingMeshes.push(trees as unknown as THREE.Mesh);
  }

  // ---- surroundings (never clipped) ----
  buildSurroundings(group, p, rng);

  return {
    group,
    massingMeshes,
    clippableMaterials,
    tierSpawns,
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    },
  };
}

function buildSurroundings(group: THREE.Group, p: ArcologyParams, rng: Rng): void {
  // prairie disc
  const prairie = new THREE.Mesh(
    new THREE.CircleGeometry(28000, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: PALETTE.prairie, roughness: 1 }),
  );
  prairie.position.y = -1;
  group.add(prairie);

  // rewilded forest: broad scattered band around the building
  const forestCount = 2600;
  const forest = new THREE.InstancedMesh(
    instancedPartGeometry('tree'),
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
    forestCount,
  );
  const m = new THREE.Matrix4();
  const half = p.baseSide / 2;
  for (let i = 0; i < forestCount; i++) {
    const angle = rng.float(0, Math.PI * 2);
    const dist = half + 400 + rng.float(0, 9000) * rng.float(0.2, 1);
    const scale = rng.float(10, 22);
    m.makeRotationY(rng.float(0, Math.PI * 2));
    m.scale(new THREE.Vector3(scale, scale, scale));
    m.setPosition(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
    forest.setMatrixAt(i, m);
  }
  forest.instanceMatrix.needsUpdate = true;
  forest.frustumCulled = false;
  group.add(forest);

  // SMR campuses: 17 reactors across 3 fenced campuses outside the base
  const opaque: THREE.BufferGeometry[] = [];
  const campusAngles = [0.5, 2.4, 4.2];
  let reactorsLeft = 17;
  for (const ca of campusAngles) {
    const cx = Math.cos(ca) * (half + 2600);
    const cz = Math.sin(ca) * (half + 2600);
    opaque.push(box(900, 4, 900, cx, 0, cz, PALETTE.concreteDark));
    const n = Math.min(reactorsLeft, 6);
    reactorsLeft -= n;
    for (let i = 0; i < n; i++) {
      const rx = cx + (i % 3) * 220 - 220;
      const rz = cz + Math.floor(i / 3) * 220 - 110;
      const containment = new THREE.CylinderGeometry(45, 45, 90, 12);
      containment.translate(rx, 49, rz);
      opaque.push(bakeColor(containment, PALETTE.industryWhite));
      const dome = new THREE.SphereGeometry(45, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(rx, 94, rz);
      opaque.push(bakeColor(dome, PALETTE.industryWhite));
      opaque.push(box(160, 40, 80, rx + 120, 4, rz, PALETTE.cream));
    }
  }

  // grid-tie substation yard + HV corridor
  const sx = Math.cos(5.4) * (half + 2200);
  const sz = Math.sin(5.4) * (half + 2200);
  opaque.push(box(700, 4, 500, sx, 0, sz, PALETTE.concreteDark));
  for (let i = 0; i < 8; i++) {
    opaque.push(box(30, 70, 30, sx - 280 + i * 80, 4, sz + 140, PALETTE.steelDark));
  }
  // corridor of masts marching away
  const dir = new THREE.Vector2(Math.cos(5.4), Math.sin(5.4));
  for (let i = 1; i <= 14; i++) {
    const px = sx + dir.x * i * 600;
    const pz = sz + dir.y * i * 600;
    opaque.push(box(24, 110, 24, px, 0, pz, PALETTE.steelDark));
  }

  const mesh = new THREE.Mesh(
    mergeGeometries(opaque, false),
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }),
  );
  group.add(mesh);
}
