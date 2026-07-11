/**
 * Street-connectivity overlay: flood-fills the street graph from the transit
 * anchors (transit hub, AV depots, logistics hub, robot depots) and paints
 * every street cell — teal if it's part of the connected transit network,
 * red if it's an island the shuttles and delivery robots can never reach.
 * With no anchor placed, the largest street component counts as the network.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getModule } from '../catalog/ModuleCatalog';
import { CELL_SIZE, rotatedFootprint } from './Grid';
import type { TesseraMode } from './TesseraMode';

const ANCHORS = ['transit-hub', 'av-depot', 'logistics-hub', 'robot-depot'];
const CONNECTED_COLOR = 0x2ee6d6;
const ISLAND_COLOR = 0xff4455;

export class RoadNetwork {
  group = new THREE.Group();
  /** Street cells unreachable from the transit network on the last rebuild. */
  disconnected = 0;
  totalStreets = 0;
  private builtVersion = -1;
  private connectedMat = new THREE.MeshBasicMaterial({
    color: CONNECTED_COLOR,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    toneMapped: false,
  });
  private islandMat = new THREE.MeshBasicMaterial({
    color: ISLAND_COLOR,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    toneMapped: false,
  });

  constructor(private mode: TesseraMode) {
    this.group.visible = false;
    this.group.renderOrder = 20;
    mode.scene.add(this.group);
  }

  setVisible(v: boolean): void {
    if (v && this.builtVersion !== this.mode.layoutVersion) this.rebuild();
    this.group.visible = v;
  }

  private rebuild(): void {
    this.builtVersion = this.mode.layoutVersion;
    for (const o of [...this.group.children]) {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      this.group.remove(o);
    }

    const grid = this.mode.grid;
    const W = grid.width;
    const key = (x: number, z: number): number => z * W + x;
    const streets = new Map<number, { x: number; z: number }>();
    const anchorCells: { x: number; z: number }[] = [];
    for (const { placed } of grid.activePlacements()) {
      if (placed.defId === 'street') {
        streets.set(key(placed.x, placed.z), { x: placed.x, z: placed.z });
      }
    }
    for (const { placed } of grid.activePlacements()) {
      if (!ANCHORS.includes(placed.defId)) continue;
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      const cx = placed.x + w / 2 - 0.5;
      const cz = placed.z + d / 2 - 0.5;
      let best: { x: number; z: number } | null = null;
      let bestD = 6 * 6;
      for (const c of streets.values()) {
        const dist = (c.x - cx) ** 2 + (c.z - cz) ** 2;
        if (dist < bestD) {
          bestD = dist;
          best = c;
        }
      }
      if (best) anchorCells.push(best);
    }

    this.totalStreets = streets.size;
    this.disconnected = 0;
    if (streets.size === 0) return;

    // flood fill from anchors; with none placed, use the largest component
    const reached = new Set<number>();
    const fill = (seeds: number[]): Set<number> => {
      const seen = new Set<number>(seeds);
      const queue = [...seeds];
      for (let q = 0; q < queue.length; q++) {
        const { x, z } = streets.get(queue[q])!;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nk = key(x + dx, z + dz);
          if (streets.has(nk) && !seen.has(nk)) {
            seen.add(nk);
            queue.push(nk);
          }
        }
      }
      return seen;
    };

    if (anchorCells.length > 0) {
      for (const k of fill(anchorCells.map((c) => key(c.x, c.z)))) reached.add(k);
    } else {
      const remaining = new Set(streets.keys());
      let largest = new Set<number>();
      while (remaining.size > 0) {
        const seed = remaining.values().next().value!;
        const comp = fill([seed]);
        for (const k of comp) remaining.delete(k);
        if (comp.size > largest.size) largest = comp;
      }
      for (const k of largest) reached.add(k);
    }

    const connected: THREE.BufferGeometry[] = [];
    const islands: THREE.BufferGeometry[] = [];
    const halfW = grid.width / 2;
    const halfD = grid.depth / 2;
    for (const [k, c] of streets) {
      const cx = (c.x + 0.5 - halfW) * CELL_SIZE;
      const cz = (c.z + 0.5 - halfD) * CELL_SIZE;
      const gy = this.mode.site.sample(cx, cz);
      const quad = new THREE.PlaneGeometry(CELL_SIZE - 1.2, CELL_SIZE - 1.2).rotateX(-Math.PI / 2);
      quad.translate(cx, gy + 0.42, cz);
      if (reached.has(k)) {
        connected.push(quad);
      } else {
        islands.push(quad);
        this.disconnected++;
        // flag riser so islands read from any camera angle
        const flag = new THREE.CylinderGeometry(0.2, 0.2, 3.2, 6);
        flag.translate(cx, gy + 1.6, cz);
        islands.push(flag);
      }
    }
    for (const [geoms, mat] of [
      [connected, this.connectedMat],
      [islands, this.islandMat],
    ] as const) {
      if (geoms.length === 0) continue;
      const mesh = new THREE.Mesh(mergeGeometries(geoms, false), mat);
      geoms.forEach((g) => g.dispose());
      mesh.frustumCulled = false;
      mesh.renderOrder = 20;
      this.group.add(mesh);
    }
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.connectedMat.dispose();
    this.islandMat.dispose();
    this.mode.scene.remove(this.group);
  }
}
