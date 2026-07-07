/**
 * Ambient delivery robots: an InstancedMesh fleet that BFS-routes over
 * `street` cells (spawning at robot depots when present) and putters
 * between random destinations.
 */
import * as THREE from 'three';
import { PartsBuilder } from '../core/geo';
import { MATERIALS } from '../core/Materials';
import { Rng } from '../core/Rng';
import { CELL_SIZE } from './Grid';
import type { TesseraMode } from './TesseraMode';

const MAX_ROBOTS = 18;
const SPEED = 3.2; // m/s

interface Robot {
  path: { x: number; z: number }[];
  seg: number;
  t: number;
  yaw: number;
  pauseUntil: number;
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
  private clock = 0;

  constructor(private mode: TesseraMode) {
    this.mesh = new THREE.InstancedMesh(robotGeometry(), MATERIALS.opaque, MAX_ROBOTS);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    mode.scene.add(this.mesh);
  }

  /** Streets changed? Rebuild the routing set and respawn the fleet. */
  private syncWithLayout(): void {
    if (this.layoutVersion === this.mode.layoutVersion) return;
    this.layoutVersion = this.mode.layoutVersion;
    const grid = this.mode.grid;
    this.streets.clear();
    for (const { placed } of grid.activePlacements()) {
      if (placed.defId !== 'street') continue;
      this.streets.add(placed.z * grid.width + placed.x);
    }
    this.robots = [];
    const cells = [...this.streets];
    const count = Math.min(MAX_ROBOTS, Math.floor(cells.length / 4));
    for (let i = 0; i < count; i++) {
      const start = this.cellCoords(cells[this.rng.int(0, cells.length - 1)]);
      this.robots.push({ path: [start], seg: 0, t: 1, yaw: 0, pauseUntil: 0 });
    }
    this.mesh.count = this.robots.length;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private cellCoords(key: number): { x: number; z: number } {
    const grid = this.mode.grid;
    return { x: key % grid.width, z: Math.floor(key / grid.width) };
  }

  private bfs(from: { x: number; z: number }, to: { x: number; z: number }): { x: number; z: number }[] | null {
    const grid = this.mode.grid;
    const key = (x: number, z: number): number => z * grid.width + x;
    if (!this.streets.has(key(to.x, to.z))) return null;
    const prev = new Map<number, number>();
    const queue = [key(from.x, from.z)];
    prev.set(queue[0], -1);
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === key(to.x, to.z)) {
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
        const nk = key(x + dx, z + dz);
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
    if (this.robots.length === 0) return;
    this.clock += dt;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const cells = [...this.streets];

    this.robots.forEach((robot, i) => {
      // advance
      if (this.clock >= robot.pauseUntil) {
        if (robot.seg >= robot.path.length - 1) {
          // arrived: pick a new destination
          const dest = this.cellCoords(cells[this.rng.int(0, cells.length - 1)]);
          const path = this.bfs(robot.path[robot.path.length - 1], dest);
          if (path && path.length > 1) {
            robot.path = path;
            robot.seg = 0;
            robot.t = 0;
            robot.pauseUntil = this.clock + this.rng.float(0.5, 4);
          }
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
