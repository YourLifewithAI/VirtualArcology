/**
 * Food-web overlay: the controlled-environment food buildings (greenhouse,
 * vertical farm, aquaponics, RAS fishery, mycology) work best interconnected —
 * fish water fertigates plants, spent mycology substrate feeds beds, one
 * climate plant serves the block. This overlay draws green links between food
 * buildings whose footprints touch (edge or corner, up to one cell apart) and
 * flags isolated ones in amber so broken loops are visible at a glance.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getModule } from '../catalog/ModuleCatalog';
import { CELL_SIZE, rotatedFootprint } from './Grid';
import type { TesseraMode } from './TesseraMode';

const FOOD_IDS = ['greenhouse', 'vertical-farm', 'aquaponics', 'ras-fishery', 'mycology'];
const LINK_COLOR = 0x53e08a;
const ISOLATED_COLOR = 0xffb340;
const LINK_Y = 5;

interface Node {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  cx: number;
  cz: number;
  h: number;
}

export class FoodWeb {
  group = new THREE.Group();
  /** Stats from the last rebuild (valid while visible). */
  clusters = 0;
  integrated = 0;
  isolated = 0;
  private builtVersion = -1;
  // overlay reads through buildings from any camera angle
  private linkMat = new THREE.MeshBasicMaterial({
    color: LINK_COLOR,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  private isolatedMat = new THREE.MeshBasicMaterial({
    color: ISOLATED_COLOR,
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
    depthTest: false,
  });

  constructor(private mode: TesseraMode) {
    this.group.visible = false;
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
    const nodes: Node[] = [];
    for (const { placed } of grid.activePlacements()) {
      if (!FOOD_IDS.includes(placed.defId)) continue;
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      nodes.push({
        x0: placed.x,
        z0: placed.z,
        x1: placed.x + w - 1,
        z1: placed.z + d - 1,
        cx: placed.x + w / 2 - 0.5,
        cz: placed.z + d / 2 - 0.5,
        h: def.height,
      });
    }
    this.clusters = 0;
    this.integrated = 0;
    this.isolated = 0;
    if (nodes.length === 0) return;

    // adjacency: footprints touching or with at most one open cell between
    // them (a street or path between two food buildings doesn't break the
    // loop — pipes and conveyors cross under it)
    const adjacent = (a: Node, b: Node): boolean =>
      a.x0 <= b.x1 + 2 && b.x0 <= a.x1 + 2 && a.z0 <= b.z1 + 2 && b.z0 <= a.z1 + 2;
    const links: [number, number][] = [];
    const comp = nodes.map((_, i) => i);
    const find = (i: number): number => (comp[i] === i ? i : (comp[i] = find(comp[i])));
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (adjacent(nodes[i], nodes[j])) {
          links.push([i, j]);
          comp[find(i)] = find(j);
        }
      }
    }
    const sizes = new Map<number, number>();
    for (let i = 0; i < nodes.length; i++) sizes.set(find(i), (sizes.get(find(i)) ?? 0) + 1);
    this.clusters = [...sizes.values()].filter((n) => n >= 2).length;
    this.isolated = [...sizes.values()].filter((n) => n === 1).length;
    this.integrated = nodes.length - this.isolated;

    const world = (c: number, half: number): number => (c + 0.5 - half) * CELL_SIZE;
    const halfW = grid.width / 2;
    const halfD = grid.depth / 2;
    const linkGeoms: THREE.BufferGeometry[] = [];
    const isolatedGeoms: THREE.BufferGeometry[] = [];

    for (const [i, j] of links) {
      const a = nodes[i];
      const b = nodes[j];
      const ax = world(a.cx, halfW);
      const az = world(a.cz, halfD);
      const bx = world(b.cx, halfW);
      const bz = world(b.cz, halfD);
      const ay = this.mode.site.sample(ax, az);
      const by = this.mode.site.sample(bx, bz);
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.1) continue;
      const va = new THREE.Vector3(ax, ay + LINK_Y, az);
      const vb = new THREE.Vector3(bx, by + LINK_Y, bz);
      const dir = vb.clone().sub(va);
      const seg = new THREE.CylinderGeometry(0.55, 0.55, dir.length(), 6);
      seg.translate(0, dir.length() / 2, 0);
      seg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
      seg.translate(va.x, va.y, va.z);
      linkGeoms.push(seg);
      // posts at both ends so links visibly land on their buildings
      for (const [px, py, pz] of [[ax, ay, az], [bx, by, bz]] as const) {
        const post = new THREE.CylinderGeometry(0.3, 0.3, LINK_Y, 6);
        post.translate(px, py + LINK_Y / 2, pz);
        linkGeoms.push(post);
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const x = world(n.cx, halfW);
      const z = world(n.cz, halfD);
      if (sizes.get(find(i)) === 1) {
        // isolated: amber halo ring + flag riser
        const gy = this.mode.site.sample(x, z);
        const extent = Math.max(n.x1 - n.x0, n.z1 - n.z0) + 1;
        const ring = new THREE.RingGeometry(
          Math.max(4, (extent * CELL_SIZE) / 2 - 1),
          Math.max(5.2, (extent * CELL_SIZE) / 2 + 0.4),
          24,
        )
          .rotateX(-Math.PI / 2)
          .translate(x, gy + 0.44, z);
        isolatedGeoms.push(ring);
        const flag = new THREE.CylinderGeometry(0.35, 0.35, n.h + 6, 6);
        flag.translate(x, gy + (n.h + 6) / 2, z);
        isolatedGeoms.push(flag);
        const knob = new THREE.SphereGeometry(1.2, 8, 6);
        knob.translate(x, gy + n.h + 6, z);
        isolatedGeoms.push(knob);
      }
    }

    for (const [geoms, mat] of [
      [linkGeoms, this.linkMat],
      [isolatedGeoms, this.isolatedMat],
    ] as const) {
      if (geoms.length === 0) continue;
      const mesh = new THREE.Mesh(mergeGeometries(geoms, false), mat);
      geoms.forEach((g) => g.dispose());
      mesh.frustumCulled = false;
      mesh.renderOrder = 32;
      this.group.add(mesh);
    }
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.linkMat.dispose();
    this.isolatedMat.dispose();
    this.mode.scene.remove(this.group);
  }
}
