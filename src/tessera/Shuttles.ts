/**
 * Autonomous six-seater shuttles: an InstancedMesh fleet that runs scheduled
 * loops over the street network between AV depots and the transit hub. Unlike
 * the ambient delivery robots, shuttles only exist where the transit system
 * does — no depots (or no street connection between them) means no service,
 * which is the point: the roads have to actually work.
 */
import * as THREE from 'three';
import { PartsBuilder } from '../core/geo';
import { MATERIALS } from '../core/Materials';
import { Rng } from '../core/Rng';
import { getModule } from '../catalog/ModuleCatalog';
import { CELL_SIZE, rotatedFootprint } from './Grid';
import type { TesseraMode } from './TesseraMode';

const MAX_SHUTTLES = 14;
const SPEED = 7.5; // m/s — faster than robots; these are vehicles
const STOP_ANCHORS = ['av-depot', 'transit-hub'];

interface Shuttle {
  path: { x: number; z: number }[];
  seg: number;
  t: number;
  yaw: number;
  pauseUntil: number;
  /** anchor entry cell the shuttle is currently headed to */
  destAnchor: number;
}

function shuttleGeometry(): THREE.BufferGeometry {
  const b = new PartsBuilder();
  // six-seater pod: white body, dark glass band, teal roof, four wheels
  b.box(2.0, 1.15, 4.4, 'industryWhite', { y: 0.45 });
  b.box(1.85, 0.75, 3.3, 'windowDark', { y: 1.6 });
  b.box(2.0, 0.14, 4.2, 'robotTeal', { y: 2.35 });
  b.box(1.7, 0.18, 0.1, 'safetyAmber', { y: 0.75, z: 2.21 });
  for (const [sx, sz] of [[-0.85, -1.5], [0.85, -1.5], [-0.85, 1.5], [0.85, 1.5]] as const) {
    const wheel = new THREE.CylinderGeometry(0.32, 0.32, 0.45, 8);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(sx, 0.32, sz);
    b.custom(wheel, 'charcoal');
  }
  const built = b.merge();
  return built.opaque!;
}

export class Shuttles {
  private mesh: THREE.InstancedMesh;
  private shuttles: Shuttle[] = [];
  private rng = new Rng(20260707);
  private layoutVersion = -1;
  private streets = new Set<number>();
  /** street-cell entry point per transit anchor (depot / hub) */
  private anchors: { x: number; z: number }[] = [];
  private clock = 0;

  constructor(private mode: TesseraMode) {
    this.mesh = new THREE.InstancedMesh(shuttleGeometry(), MATERIALS.opaque, MAX_SHUTTLES);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    mode.scene.add(this.mesh);
  }

  /** Landform edit mode hides the fleet. */
  setVisible(v: boolean): void {
    this.mesh.visible = v;
  }

  private key(x: number, z: number): number {
    return z * this.mode.grid.width + x;
  }

  private cellCoords(key: number): { x: number; z: number } {
    const w = this.mode.grid.width;
    return { x: key % w, z: Math.floor(key / w) };
  }

  /** Nearest street cell to an anchor building (within a small hookup radius). */
  private entryFor(cx: number, cz: number): { x: number; z: number } | null {
    let best: { x: number; z: number } | null = null;
    let bestD = 6 * 6;
    for (const k of this.streets) {
      const c = this.cellCoords(k);
      const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private syncWithLayout(): void {
    if (this.layoutVersion === this.mode.layoutVersion) return;
    this.layoutVersion = this.mode.layoutVersion;
    const grid = this.mode.grid;
    this.streets.clear();
    this.anchors = [];
    for (const { placed } of grid.activePlacements()) {
      if (placed.defId === 'street') this.streets.add(this.key(placed.x, placed.z));
    }
    for (const { placed } of grid.activePlacements()) {
      if (!STOP_ANCHORS.includes(placed.defId)) continue;
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      const entry = this.entryFor(placed.x + w / 2 - 0.5, placed.z + d / 2 - 0.5);
      if (entry) this.anchors.push(entry);
    }

    this.shuttles = [];
    if (this.anchors.length >= 2) {
      const count = Math.min(MAX_SHUTTLES, this.anchors.length * 3);
      for (let i = 0; i < count; i++) {
        const home = this.rng.int(0, this.anchors.length - 1);
        this.shuttles.push({
          path: [this.anchors[home]],
          seg: 0,
          t: 1,
          yaw: 0,
          pauseUntil: this.clock + this.rng.float(0, 3),
          destAnchor: home,
        });
      }
    }
    this.mesh.count = this.shuttles.length;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private bfs(from: { x: number; z: number }, to: { x: number; z: number }): { x: number; z: number }[] | null {
    if (!this.streets.has(this.key(to.x, to.z))) return null;
    const prev = new Map<number, number>();
    const queue = [this.key(from.x, from.z)];
    if (!this.streets.has(queue[0])) return null;
    prev.set(queue[0], -1);
    const target = this.key(to.x, to.z);
    for (let q = 0; q < queue.length; q++) {
      const cur = queue[q];
      if (cur === target) {
        const path: { x: number; z: number }[] = [];
        let node = cur;
        while (node !== -1) {
          path.unshift(this.cellCoords(node));
          node = prev.get(node)!;
        }
        return path;
      }
      const { x, z } = this.cellCoords(cur);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nk = this.key(x + dx, z + dz);
        if (this.streets.has(nk) && !prev.has(nk)) {
          prev.set(nk, cur);
          queue.push(nk);
        }
      }
    }
    return null;
  }

  private worldOf(cell: { x: number; z: number }): { x: number; z: number } {
    const grid = this.mode.grid;
    return {
      x: (cell.x + 0.5 - grid.width / 2) * CELL_SIZE,
      z: (cell.z + 0.5 - grid.depth / 2) * CELL_SIZE,
    };
  }

  update(dt: number): void {
    this.syncWithLayout();
    if (this.shuttles.length === 0) return;
    this.clock += dt;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    this.shuttles.forEach((s, i) => {
      if (this.clock >= s.pauseUntil) {
        if (s.seg >= s.path.length - 1) {
          // at a stop: pick another anchor and drive there
          for (let attempt = 0; attempt < 4; attempt++) {
            const next = this.rng.int(0, this.anchors.length - 1);
            if (next === s.destAnchor && this.anchors.length > 1) continue;
            const path = this.bfs(s.path[s.path.length - 1], this.anchors[next]);
            if (path && path.length > 1) {
              s.path = path;
              s.seg = 0;
              s.t = 0;
              s.destAnchor = next;
              s.pauseUntil = this.clock + this.rng.float(1.5, 6); // dwell at the stop
              break;
            }
          }
        } else {
          s.t += (SPEED * dt) / CELL_SIZE;
          while (s.t >= 1 && s.seg < s.path.length - 1) {
            s.t -= 1;
            s.seg++;
          }
        }
      }

      const a = this.worldOf(s.path[Math.min(s.seg, s.path.length - 1)]);
      const b = this.worldOf(s.path[Math.min(s.seg + 1, s.path.length - 1)]);
      const t = Math.min(s.t, 1);
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      // drive on the right side of the lane
      const dirX = b.x - a.x;
      const dirZ = b.z - a.z;
      const len = Math.hypot(dirX, dirZ);
      const ox = len > 0.01 ? (-dirZ / len) * 1.6 : 0;
      const oz = len > 0.01 ? (dirX / len) * 1.6 : 0;
      const targetYaw = len > 0.01 ? Math.atan2(dirX, dirZ) : s.yaw;
      let dy = targetYaw - s.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      s.yaw += dy * Math.min(1, dt * 4);

      q.setFromAxisAngle(up, s.yaw);
      m.makeRotationFromQuaternion(q);
      m.setPosition(x + ox, this.mode.site.sample(x + ox, z + oz) + 0.12, z + oz);
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
