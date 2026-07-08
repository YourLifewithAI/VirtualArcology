/**
 * Underground infrastructure visualization. Every service line is *routed*:
 * a BFS over the street graph from each utility's plant (sewer → wastewater,
 * water → water tower, power → substation/SMR, fiber → data center/comms mast)
 * finds the actual trunk path each building's stub follows. Only edges that
 * carry a routed service render as trunks, so the network reads as a real
 * tree converging on its plants. Buildings that can't reach a plant — no
 * street nearby, a gap in the street lattice, or no plant placed at all —
 * get red stubs and an above-ground red flag riser.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CELL_SIZE } from './Grid';
import { getModule } from '../catalog/ModuleCatalog';
import { STATS, type ModuleStats } from '../catalog/stats';
import { rotatedFootprint } from './Grid';
import type { TesseraMode } from './TesseraMode';

const UTILITIES = [
  { key: 'power', color: 0xffb340, depth: -0.9, r: 0.28, sinks: ['substation', 'smr'] },
  { key: 'water', color: 0x4da3ff, depth: -1.5, r: 0.32, sinks: ['water-tower'] },
  { key: 'sewer', color: 0x9c7a4d, depth: -2.1, r: 0.4, sinks: ['wastewater'] },
  { key: 'fiber', color: 0x2ee6d6, depth: -2.7, r: 0.18, sinks: ['data-center', 'comms-mast'] },
] as const;

/** A building only gets a service stub for utilities its stats say it touches. */
const NEEDS_UTILITY: Record<(typeof UTILITIES)[number]['key'], (s: ModuleStats | undefined) => boolean> = {
  power: (s) => !s || !!(s.useMW || s.genMW),
  water: (s) => !s || !!s.waterM3d,
  sewer: (s) => !s || !!s.sewerM3d,
  fiber: (s) => !s || !!(s.computePF || s.computeUsePF),
};

const DISCONNECT_COLOR = 0xff4455;
/** Max cell distance from a building to its street hookup. */
const MAX_HOOKUP = 20;

interface Cell {
  x: number;
  z: number;
}

interface Site {
  /** footprint rect in cells */
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** footprint center in cells */
  cx: number;
  cz: number;
  defId: string;
}

function seg(geoms: THREE.BufferGeometry[], x0: number, z0: number, x1: number, z1: number, y: number, r: number): void {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  const g = new THREE.CylinderGeometry(r, r, len, 6);
  g.rotateX(Math.PI / 2);
  g.rotateY(-Math.atan2(dz, dx) + Math.PI / 2);
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  geoms.push(g);
}

export class UtilityNetwork {
  group = new THREE.Group();
  /** Building-utility pairs that could not reach a plant on the last rebuild. */
  unconnected = 0;
  /** What exactly is unconnected, for tooling/debug. */
  missing: { defId: string; utility: string }[] = [];
  private builtVersion = -1;
  private materials = new Map<number, THREE.MeshBasicMaterial>();

  constructor(private mode: TesseraMode) {
    this.group.visible = false;
    mode.scene.add(this.group);
  }

  setVisible(v: boolean): void {
    if (v && this.builtVersion !== this.mode.layoutVersion) this.rebuild();
    this.group.visible = v;
  }

  private material(color: number): THREE.MeshBasicMaterial {
    let m = this.materials.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
      this.materials.set(color, m);
    }
    return m;
  }

  private rebuild(): void {
    this.builtVersion = this.mode.layoutVersion;
    for (const o of [...this.group.children]) {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      this.group.remove(o);
    }
    this.unconnected = 0;
    this.missing = [];

    const grid = this.mode.grid;
    const W = grid.width;
    const D = grid.depth;
    const cellKey = (x: number, z: number): number => z * W + x;
    const wx = (c: number): number => (c + 0.5 - W / 2) * CELL_SIZE;
    const wz = (c: number): number => (c + 0.5 - D / 2) * CELL_SIZE;

    const streets: Cell[] = [];
    const buildings: Site[] = [];
    for (const { placed } of grid.activePlacements()) {
      const def = getModule(placed.defId);
      if (!def) continue;
      if (placed.defId === 'street') {
        streets.push({ x: placed.x, z: placed.z });
      } else if (def.category !== 'landscape') {
        const { w, d } = rotatedFootprint(def, placed.rot);
        buildings.push({
          x0: placed.x,
          z0: placed.z,
          x1: placed.x + w - 1,
          z1: placed.z + d - 1,
          cx: placed.x + w / 2 - 0.5,
          cz: placed.z + d / 2 - 0.5,
          defId: placed.defId,
        });
      }
    }
    const streetIdx = new Map<number, number>(); // cell key -> index into streets[]
    streets.forEach((s, i) => streetIdx.set(cellKey(s.x, s.z), i));

    /** Street cells adjacent to a site's footprint perimeter, else nearest within MAX_HOOKUP. */
    const hookups = (b: Site): number[] => {
      const found: number[] = [];
      for (let x = b.x0; x <= b.x1; x++) {
        for (const z of [b.z0 - 1, b.z1 + 1]) {
          const i = streetIdx.get(cellKey(x, z));
          if (z >= 0 && z < D && i !== undefined) found.push(i);
        }
      }
      for (let z = b.z0; z <= b.z1; z++) {
        for (const x of [b.x0 - 1, b.x1 + 1]) {
          const i = streetIdx.get(cellKey(x, z));
          if (x >= 0 && x < W && i !== undefined) found.push(i);
        }
      }
      if (found.length > 0) return found;
      let best = -1;
      let bestD = MAX_HOOKUP * MAX_HOOKUP;
      streets.forEach((s, i) => {
        const d2 = (s.x - b.cx) ** 2 + (s.z - b.cz) ** 2;
        if (d2 < bestD) {
          bestD = d2;
          best = i;
        }
      });
      return best >= 0 ? [best] : [];
    };

    for (const u of UTILITIES) {
      const trunks: THREE.BufferGeometry[] = [];
      const stubs: THREE.BufferGeometry[] = [];
      const alerts: THREE.BufferGeometry[] = [];
      const uIdx = UTILITIES.indexOf(u);

      // BFS over the street graph, seeded at every plant's hookup cells
      const dist = new Int32Array(streets.length).fill(-1);
      const parent = new Int32Array(streets.length).fill(-1);
      const queue: number[] = [];
      const plants = buildings.filter((b) => (u.sinks as readonly string[]).includes(b.defId));
      for (const plant of plants) {
        const plantHooks = hookups(plant);
        for (const h of plantHooks) {
          if (dist[h] !== 0) {
            dist[h] = 0;
            queue.push(h);
            // feeder: plant center -> its street hookup (drawn thick, like a header main)
            const s = streets[h];
            seg(trunks, wx(plant.cx), wz(plant.cz), wx(s.x), wz(plant.cz), u.depth, u.r * 1.2);
            seg(trunks, wx(s.x), wz(plant.cz), wx(s.x), wz(s.z), u.depth, u.r * 1.2);
          }
        }
        if (plantHooks.length === 0) {
          // the plant itself is off-grid — flag it
          const flag = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 6);
          flag.translate(wx(plant.cx), 2.25, wz(plant.cz));
          alerts.push(flag);
        }
      }
      for (let q = 0; q < queue.length; q++) {
        const i = queue[q];
        const s = streets[i];
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = s.x + dx;
          const nz = s.z + dz;
          if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
          const ni = streetIdx.get(cellKey(nx, nz));
          if (ni === undefined || dist[ni] !== -1) continue;
          dist[ni] = dist[i] + 1;
          parent[ni] = i;
          queue.push(ni);
        }
      }

      // route every building; collect the union of trunk edges actually used
      const usedEdges = new Set<string>();
      for (const b of buildings) {
        if ((u.sinks as readonly string[]).includes(b.defId)) continue; // the plant is the sink
        if (!NEEDS_UTILITY[u.key](STATS[b.defId])) continue; // no draw/supply of this utility
        const hooks = hookups(b);
        let entry = -1;
        let entryDist = Infinity;
        for (const h of hooks) {
          if (dist[h] !== -1 && dist[h] < entryDist) {
            entryDist = dist[h];
            entry = h;
          }
        }
        const bx = wx(b.cx);
        const bz = wz(b.cz);
        if (entry === -1) {
          // no route to a plant: red stub toward the nearest street (if any), red flag riser
          this.unconnected++;
          this.missing.push({ defId: b.defId, utility: u.key });
          const near = hooks[0];
          const fx = bx + (uIdx - 1.5) * 0.9;
          if (near !== undefined) {
            const s = streets[near];
            seg(alerts, bx, bz, wx(s.x), bz, u.depth, u.r * 0.75);
            seg(alerts, wx(s.x), bz, wx(s.x), wz(s.z), u.depth, u.r * 0.75);
          }
          const flag = new THREE.CylinderGeometry(0.22, 0.22, 3.5 - u.depth, 6);
          flag.translate(fx, u.depth + (3.5 - u.depth) / 2, bz);
          alerts.push(flag);
          const knob = new THREE.SphereGeometry(0.55, 8, 6);
          knob.translate(fx, 3.5, bz);
          alerts.push(knob);
          continue;
        }
        // service stub: building center -> street entry (L-shaped) + riser
        const s = streets[entry];
        seg(stubs, bx, bz, wx(s.x), bz, u.depth, u.r * 0.75);
        seg(stubs, wx(s.x), bz, wx(s.x), wz(s.z), u.depth, u.r * 0.75);
        const riser = new THREE.CylinderGeometry(u.r * 0.75, u.r * 0.75, -u.depth + 0.3, 6);
        riser.translate(bx, u.depth / 2, bz);
        stubs.push(riser);
        // walk the BFS tree back to the plant
        let i = entry;
        while (parent[i] !== -1) {
          const p = parent[i];
          const key = i < p ? `${i}-${p}` : `${p}-${i}`;
          if (usedEdges.has(key)) break; // rest of the path is already drawn
          usedEdges.add(key);
          const a = streets[i];
          const c = streets[p];
          seg(trunks, wx(a.x), wz(a.z), wx(c.x), wz(c.z), u.depth, u.r);
          i = p;
        }
      }

      for (const [geoms, color] of [
        [trunks, u.color],
        [stubs, u.color],
        [alerts, DISCONNECT_COLOR],
      ] as const) {
        if (geoms.length === 0) continue;
        const mesh = new THREE.Mesh(mergeGeometries(geoms, false), this.material(color));
        geoms.forEach((g) => g.dispose());
        mesh.frustumCulled = false;
        this.group.add(mesh);
      }
    }
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    for (const m of this.materials.values()) m.dispose();
    this.mode.scene.remove(this.group);
  }
}
