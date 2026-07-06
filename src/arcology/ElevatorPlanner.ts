/**
 * Vertical transport per the knowledge-node scheme, rendered as one
 * InstancedMesh of colored boxes (shaft cross-sections exaggerated so they
 * read at 5 km scale) plus emissive sky-lobby plates at every tier top.
 *
 * Banks: MULTI ropeless loops (amber) 0->plateau stopping all sky lobbies;
 * UltraRope double-deck express (red) in two stacked <=1,000 m segments;
 * per-tier local cable banks (blue); freight (orange), evacuation (green),
 * sub-level service (gray).
 */
import * as THREE from 'three';
import { plateauHeight, tierSide, type ArcologyParams } from './params';

export const SHAFT_COLORS = {
  multi: 0xffd23f,
  express: 0xff5a5a,
  local: 0x4da3ff,
  freight: 0xff9d2e,
  evac: 0x3ddc84,
  sub: 0x9aa0a6,
} as const;

export interface ShaftInstance {
  x: number;
  z: number;
  yBottom: number;
  yTop: number;
  /** Cross-section half-extent, meters (exaggerated for legibility). */
  half: number;
  color: number;
}

export function planShafts(p: ArcologyParams): ShaftInstance[] {
  const shafts: ShaftInstance[] = [];
  const plateau = plateauHeight(p);
  const subDepth = p.subLevels * p.subLevelHeight;

  // MULTI loops: two concentric squares at the core, full height.
  const loops = p.elevators.multiLoops;
  for (let i = 0; i < loops * 2; i++) {
    const ringIdx = i < loops ? 0 : 1;
    const count = loops;
    const angle = ((i % count) / count) * Math.PI * 2 + (ringIdx ? Math.PI / count : 0);
    const r = 90 + ringIdx * 70;
    shafts.push({
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      yBottom: 0,
      yTop: plateau,
      half: 14,
      color: SHAFT_COLORS.multi,
    });
  }

  // UltraRope express: 4 shafts x 2 stacked segments (0->mid, mid->plateau).
  const mid = plateau / 2;
  for (let i = 0; i < p.elevators.expressShafts; i++) {
    const angle = (i / p.elevators.expressShafts) * Math.PI * 2 + Math.PI / 4;
    const r = 230;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    shafts.push({ x, z, yBottom: 0, yTop: mid, half: 16, color: SHAFT_COLORS.express });
    shafts.push({ x: x + 40, z: z + 40, yBottom: mid, yTop: plateau, half: 16, color: SHAFT_COLORS.express });
  }

  // Local banks: per tier, clusters on a ring within that tier's footprint.
  for (let t = 0; t < p.tiers; t++) {
    const side = tierSide(p, t + 1) || tierSide(p, t) * 0.5;
    const ringR = Math.max(side * 0.32, 320);
    const y0 = t * p.tierHeight;
    const y1 = (t + 1) * p.tierHeight;
    const n = p.elevators.localPerTier;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + t * 0.26;
      shafts.push({
        x: Math.cos(angle) * ringR,
        z: Math.sin(angle) * ringR,
        yBottom: y0,
        yTop: y1,
        half: 11,
        color: SHAFT_COLORS.local,
      });
    }
  }

  // Freight: near mid-edges, ground (and below) to ~tier 6.
  const freightTop = Math.min(p.tiers, 6) * p.tierHeight;
  for (let i = 0; i < p.elevators.freightShafts; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    shafts.push({
      x: sign * 420,
      z: sign * -160,
      yBottom: -subDepth,
      yTop: freightTop,
      half: 18,
      color: SHAFT_COLORS.freight,
    });
  }

  // Evacuation: hardened full-height pair.
  for (let i = 0; i < p.elevators.evacShafts; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    shafts.push({
      x: sign * 160,
      z: sign * 420,
      yBottom: -subDepth,
      yTop: plateau,
      half: 13,
      color: SHAFT_COLORS.evac,
    });
  }

  // Sub-level service pair.
  for (let i = 0; i < 2; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    shafts.push({
      x: 40 * sign,
      z: -300 * sign,
      yBottom: -subDepth,
      yTop: 40,
      half: 11,
      color: SHAFT_COLORS.sub,
    });
  }

  return shafts;
}

/** Build the shaft InstancedMesh + emissive sky-lobby plates. */
export function buildElevatorGroup(p: ArcologyParams): THREE.Group {
  const group = new THREE.Group();
  const shafts = planShafts(p);

  const unit = new THREE.BoxGeometry(1, 1, 1);
  unit.translate(0, 0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const mesh = new THREE.InstancedMesh(unit, mat, shafts.length);
  const m = new THREE.Matrix4();
  const color = new THREE.Color();
  shafts.forEach((s, i) => {
    m.makeScale(s.half * 2, s.yTop - s.yBottom, s.half * 2);
    m.setPosition(s.x, s.yBottom, s.z);
    mesh.setMatrixAt(i, m);
    color.setHex(s.color).convertSRGBToLinear();
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  group.add(mesh);

  // Sky lobbies: warm emissive interchange plates at every tier top.
  const lobbyGeoms: THREE.BoxGeometry[] = [];
  for (let t = 0; t < p.tiers; t++) {
    const g = new THREE.BoxGeometry(560, 12, 560);
    g.translate(0, (t + 1) * p.tierHeight - 6, 0);
    lobbyGeoms.push(g);
  }
  const lobbyMat = new THREE.MeshBasicMaterial({ color: 0xffe9b8, toneMapped: false });
  for (const g of lobbyGeoms) group.add(new THREE.Mesh(g, lobbyMat));

  return group;
}
