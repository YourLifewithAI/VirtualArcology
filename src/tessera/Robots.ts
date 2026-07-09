/**
 * Delivery robots with real jobs: each robot is assigned a role (parts
 * courier, farm-to-table run, meal delivery, parcel round, scrap run) and
 * shuttles between the actual buildings of that trade over the street
 * network. Click a robot to see who it is and what it's hauling.
 */
import * as THREE from 'three';
import { PartsBuilder } from '../core/geo';
import { MATERIALS } from '../core/Materials';
import { Rng } from '../core/Rng';
import { getModule } from '../catalog/ModuleCatalog';
import { CELL_SIZE, rotatedFootprint } from './Grid';
import type { TesseraMode } from './TesseraMode';

const MAX_ROBOTS = 18;
const SPEED = 3.2; // m/s

export interface RobotRole {
  key: string;
  label: string;
  cargo: string;
  from: string[];
  to: string[];
  tint: number;
}

export const ROBOT_ROLES: RobotRole[] = [
  {
    key: 'parts',
    label: 'Parts courier',
    cargo: 'wafer cassettes & precision components',
    from: ['chip-fab'],
    to: ['robotics-fab', 'makerspace'],
    tint: 0xd7dde4,
  },
  {
    key: 'produce',
    label: 'Farm-to-table run',
    cargo: 'fresh produce, fish & mushrooms',
    from: ['vertical-farm', 'greenhouse', 'aquaponics', 'ras-fishery', 'mycology'],
    to: ['restaurant', 'market-row', 'grocery', 'venue'],
    tint: 0xa8e6a1,
  },
  {
    key: 'meals',
    label: 'Meal delivery',
    cargo: 'hot meals from the restaurant row',
    from: ['restaurant', 'venue'],
    to: ['apt-terrace', 'apt-court', 'apt-tower', 'agent-house'],
    tint: 0xffd9a0,
  },
  {
    key: 'parcels',
    label: 'Parcel round',
    cargo: 'parcels, groceries & library loans',
    from: ['logistics-hub', 'robot-depot'],
    to: ['apt-terrace', 'apt-court', 'apt-tower', 'library', 'school', 'clinic'],
    tint: 0xa9d6e5,
  },
  {
    key: 'scrap',
    label: 'Scrap run',
    cargo: 'scrap & e-waste bound for the foundry',
    from: ['makerspace', 'robotics-fab', 'logistics-hub'],
    to: ['foundry'],
    tint: 0xe0c185,
  },
];

interface Endpoint {
  cell: { x: number; z: number };
  name: string;
}

interface Robot {
  path: { x: number; z: number }[];
  seg: number;
  t: number;
  yaw: number;
  pauseUntil: number;
  role: RobotRole | null;
  /** 'pickup' = heading to origin, 'dropoff' = heading to destination. */
  leg: 'pickup' | 'dropoff';
  fromName: string;
  toName: string;
}

export interface RobotInfo {
  roleLabel: string;
  cargo: string;
  fromName: string;
  toName: string;
  status: string;
}

function robotGeometry(): THREE.BufferGeometry {
  const b = new PartsBuilder();
  b.box(0.8, 0.55, 1.25, 'industryWhite', { y: 0.28 });
  b.box(0.82, 0.1, 1.27, 'robotTeal', { y: 0.62 });
  b.box(0.5, 0.18, 0.7, 'charcoal', { y: 0.72 });
  for (const [sx, sz] of [[-0.38, -0.4], [0.38, -0.4], [-0.38, 0.4], [0.38, 0.4]] as const) {
    const wheel = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(sx, 0.16, sz);
    b.custom(wheel, 'charcoal');
  }
  const built = b.merge();
  return built.opaque!;
}

export class Robots {
  private mesh: THREE.InstancedMesh;
  private robots: Robot[] = [];
  private rng = new Rng(20260706);
  private layoutVersion = -1;
  private streets: Set<number> = new Set();
  private endpoints = new Map<string, Endpoint[]>(); // defId -> street entries
  private clock = 0;

  constructor(private mode: TesseraMode) {
    this.mesh = new THREE.InstancedMesh(robotGeometry(), MATERIALS.opaque, MAX_ROBOTS);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    mode.scene.add(this.mesh);
  }

  /** Which robot (if any) is under this ray? For click-to-inspect. */
  pick(raycaster: THREE.Raycaster): RobotInfo | null {
    if (this.mesh.count === 0) return null;
    const hit = raycaster.intersectObject(this.mesh, false)[0];
    if (hit?.instanceId === undefined) return null;
    const r = this.robots[hit.instanceId];
    if (!r) return null;
    if (!r.role) {
      return {
        roleLabel: 'Unassigned rover',
        cargo: 'nothing yet — no matching buildings on the network',
        fromName: '—',
        toName: '—',
        status: 'wandering the streets',
      };
    }
    if (!r.fromName && !r.toName) {
      return { roleLabel: r.role.label, cargo: r.role.cargo, fromName: '—', toName: '—', status: 'awaiting dispatch' };
    }
    const enRoute = r.seg < r.path.length - 1;
    return {
      roleLabel: r.role.label,
      cargo: r.role.cargo,
      fromName: r.fromName || '—',
      toName: r.toName || '…',
      status: enRoute
        ? r.leg === 'pickup'
          ? `en route to pick up at ${r.fromName}`
          : `delivering to ${r.toName}`
        : r.leg === 'pickup'
          ? `loading at ${r.fromName}`
          : `unloading at ${r.toName}`,
    };
  }

  private key(x: number, z: number): number {
    return z * this.mode.grid.width + x;
  }

  private cellCoords(key: number): { x: number; z: number } {
    const w = this.mode.grid.width;
    return { x: key % w, z: Math.floor(key / w) };
  }

  private nearestStreet(cx: number, cz: number): { x: number; z: number } | null {
    let best: { x: number; z: number } | null = null;
    // big-footprint industry (chip fab, foundry) can sit well back from the lattice
    let bestD = 10 * 10;
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

  /** Streets changed? Rebuild endpoints and re-crew the fleet. */
  private syncWithLayout(): void {
    if (this.layoutVersion === this.mode.layoutVersion) return;
    this.layoutVersion = this.mode.layoutVersion;
    const grid = this.mode.grid;
    this.streets.clear();
    this.endpoints.clear();
    for (const { placed } of grid.activePlacements()) {
      if (placed.defId === 'street') this.streets.add(this.key(placed.x, placed.z));
    }
    const wanted = new Set<string>();
    for (const role of ROBOT_ROLES) for (const id of [...role.from, ...role.to]) wanted.add(id);
    for (const { placed } of grid.activePlacements()) {
      if (!wanted.has(placed.defId)) continue;
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      const entry = this.nearestStreet(placed.x + w / 2 - 0.5, placed.z + d / 2 - 0.5);
      if (!entry) continue;
      const list = this.endpoints.get(placed.defId) ?? [];
      list.push({ cell: entry, name: def.name });
      this.endpoints.set(placed.defId, list);
    }

    // roles that actually have both ends on the network right now
    const active = ROBOT_ROLES.filter((role) => this.pickEndpoint(role.from) && this.pickEndpoint(role.to));

    this.robots = [];
    const cells = [...this.streets];
    const count = Math.min(MAX_ROBOTS, Math.floor(cells.length / 4));
    for (let i = 0; i < count; i++) {
      const start = this.cellCoords(cells[this.rng.int(0, cells.length - 1)]);
      const role = active.length > 0 ? active[i % active.length] : null;
      this.robots.push({
        path: [start],
        seg: 0,
        t: 1,
        yaw: 0,
        pauseUntil: this.clock + this.rng.float(0, 2),
        role,
        // 'dropoff' so the first assigned leg flips to 'pickup'
        leg: 'dropoff',
        fromName: '',
        toName: '',
      });
      if (role) this.mesh.setColorAt(i, new THREE.Color(role.tint));
      else this.mesh.setColorAt(i, new THREE.Color(0xffffff));
    }
    this.mesh.count = this.robots.length;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private pickEndpoint(ids: string[]): Endpoint | null {
    const all: Endpoint[] = [];
    for (const id of ids) all.push(...(this.endpoints.get(id) ?? []));
    return all.length > 0 ? all[this.rng.int(0, all.length - 1)] : null;
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

  /** Choose and path the robot's next leg; falls back to wandering. */
  private assignNextLeg(robot: Robot): void {
    const here = robot.path[robot.path.length - 1];
    if (robot.role) {
      const nextLeg = robot.leg === 'pickup' ? 'dropoff' : 'pickup';
      const pool = nextLeg === 'pickup' ? robot.role.from : robot.role.to;
      for (let attempt = 0; attempt < 4; attempt++) {
        const target = this.pickEndpoint(pool);
        if (!target) break;
        const path = this.bfs(here, target.cell);
        if (path && path.length > 1) {
          robot.path = path;
          robot.seg = 0;
          robot.t = 0;
          robot.leg = nextLeg;
          if (nextLeg === 'pickup') robot.fromName = target.name;
          else robot.toName = target.name;
          robot.pauseUntil = this.clock + this.rng.float(1, 4);
          return;
        }
      }
    }
    // no role or no route: wander to a random street cell
    const cells = [...this.streets];
    if (cells.length === 0) return;
    const dest = this.cellCoords(cells[this.rng.int(0, cells.length - 1)]);
    const path = this.bfs(here, dest);
    if (path && path.length > 1) {
      robot.path = path;
      robot.seg = 0;
      robot.t = 0;
      robot.pauseUntil = this.clock + this.rng.float(0.5, 4);
    }
  }

  update(dt: number): void {
    this.syncWithLayout();
    if (this.robots.length === 0) return;
    this.clock += dt;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    this.robots.forEach((robot, i) => {
      if (this.clock >= robot.pauseUntil) {
        if (robot.seg >= robot.path.length - 1) {
          this.assignNextLeg(robot);
        } else {
          robot.t += (SPEED * dt) / CELL_SIZE;
          while (robot.t >= 1 && robot.seg < robot.path.length - 1) {
            robot.t -= 1;
            robot.seg++;
          }
        }
      }

      const a = this.worldOf(robot.path[Math.min(robot.seg, robot.path.length - 1)]);
      const b = this.worldOf(robot.path[Math.min(robot.seg + 1, robot.path.length - 1)]);
      const t = Math.min(robot.t, 1);
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      const targetYaw = Math.abs(b.x - a.x) + Math.abs(b.z - a.z) > 0.01 ? Math.atan2(b.x - a.x, b.z - a.z) : robot.yaw;
      // shortest-arc yaw blend
      let dy = targetYaw - robot.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      robot.yaw += dy * Math.min(1, dt * 6);

      q.setFromAxisAngle(up, robot.yaw);
      m.makeRotationFromQuaternion(q);
      m.setPosition(x, 0.15, z);
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
