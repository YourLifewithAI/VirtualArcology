/**
 * The Tessera builder: a neighborhood site on a 10 m grid where catalog
 * modules are placed, plus ground, lighting, and the instanced scatter pools.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import type { Mode } from '../core/Mode';
import { MATERIALS } from '../core/Materials';
import { PALETTE } from '../core/Palette';
import { Rng } from '../core/Rng';
import { buildModuleGroup, type InstanceRequest } from '../core/geo';
import { getModule } from '../catalog/ModuleCatalog';
import { CELL_SIZE, Grid, type PlacedModule } from './Grid';
import { InstancePools } from './InstancePools';

export const DEFAULT_GRID = 48;

export class TesseraMode implements Mode {
  readonly id = 'tessera';
  readonly scene = new THREE.Scene();
  grid: Grid;
  private moduleGroups = new Map<number, THREE.Group>();
  private pools: InstancePools;
  private sun: THREE.DirectionalLight;
  private animatables: { update(dt: number): void }[] = [];
  /** Fired after any placement change (for autosave + HUD). */
  onLayoutChanged: (() => void) | null = null;

  constructor(private app: App, gridSize = DEFAULT_GRID) {
    this.grid = new Grid(gridSize, gridSize);
    this.pools = new InstancePools(this.scene);

    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.skyHorizon, 700, 2600);

    const hemi = new THREE.HemisphereLight(0xdff1ff, 0x9a8a6a, 0.9);
    this.scene.add(hemi);

    this.sun = new THREE.DirectionalLight(0xfff2dd, 2.2);
    this.sun.position.set(320, 420, 180);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const ext = (gridSize * CELL_SIZE) / 2 + 60;
    this.sun.shadow.camera.left = -ext;
    this.sun.shadow.camera.right = ext;
    this.sun.shadow.camera.top = ext;
    this.sun.shadow.camera.bottom = -ext;
    this.sun.shadow.camera.near = 50;
    this.sun.shadow.camera.far = 1200;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.buildGround(gridSize);
  }

  private buildGround(gridSize: number): void {
    const site = gridSize * CELL_SIZE;

    const meadow = new THREE.Mesh(
      new THREE.CircleGeometry(3000, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: PALETTE.prairie, roughness: 1 }),
    );
    meadow.position.y = -0.15;
    meadow.receiveShadow = true;
    this.scene.add(meadow);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(site + 8, 0.2, site + 8),
      new THREE.MeshStandardMaterial({ color: PALETTE.paver, roughness: 0.95 }),
    );
    slab.position.y = -0.1;
    slab.receiveShadow = true;
    this.scene.add(slab);

    const gridHelper = new THREE.GridHelper(site, gridSize, 0x8d8874, 0xa39d88);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    gridHelper.position.y = 0.04;
    gridHelper.name = 'gridHelper';
    this.scene.add(gridHelper);
  }

  setGridVisible(v: boolean): void {
    const helper = this.scene.getObjectByName('gridHelper');
    if (helper) helper.visible = v;
  }

  enter(): void {
    this.app.renderer.shadowMap.enabled = true;
    const site = this.grid.width * CELL_SIZE;
    this.app.rig.setView(
      { x: site * 0.55, y: site * 0.62, z: site * 0.8 },
      { x: 0, y: 0, z: 0 },
      { near: 0.5, far: 6000, minDistance: 8, maxDistance: 2200 },
    );
  }

  exit(): void {}

  registerAnimatable(a: { update(dt: number): void }): void {
    this.animatables.push(a);
  }

  update(dt: number): void {
    if (dt > 0) for (const a of this.animatables) a.update(dt);
  }

  // -- placement management --------------------------------------------------

  /** Place a module (assumes canPlace was checked). Returns placement index. */
  addPlacement(placed: PlacedModule): number {
    const def = getModule(placed.defId);
    if (!def) throw new Error(`Unknown module: ${placed.defId}`);
    const index = this.grid.place(def, placed);
    this.spawnGroup(index, placed);
    this.rebuildInstances();
    this.onLayoutChanged?.();
    return index;
  }

  removePlacement(index: number): PlacedModule | null {
    const placed = this.grid.placements[index];
    if (!placed) return null;
    const def = getModule(placed.defId)!;
    this.grid.remove(def, index);
    const group = this.moduleGroups.get(index);
    if (group) {
      this.scene.remove(group);
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      this.moduleGroups.delete(index);
    }
    this.rebuildInstances();
    this.onLayoutChanged?.();
    return placed;
  }

  restorePlacement(index: number, placed: PlacedModule): void {
    const def = getModule(placed.defId)!;
    this.grid.restore(def, index, placed);
    this.spawnGroup(index, placed);
    this.rebuildInstances();
    this.onLayoutChanged?.();
  }

  clearAll(): void {
    for (const { index } of this.grid.activePlacements()) {
      const placed = this.grid.placements[index]!;
      this.grid.remove(getModule(placed.defId)!, index);
      const group = this.moduleGroups.get(index);
      if (group) this.scene.remove(group);
    }
    this.moduleGroups.clear();
    this.rebuildInstances();
    this.onLayoutChanged?.();
  }

  loadPlacements(placements: PlacedModule[]): void {
    this.clearAll();
    for (const p of placements) {
      const def = getModule(p.defId);
      if (!def) {
        console.warn(`Skipping unknown module in layout: ${p.defId}`);
        continue;
      }
      if (!this.grid.canPlace(def, p.x, p.z, p.rot)) {
        console.warn(`Skipping overlapping module in layout: ${p.defId} @ ${p.x},${p.z}`);
        continue;
      }
      const index = this.grid.place(def, p);
      this.spawnGroup(index, p);
    }
    this.rebuildInstances();
    this.onLayoutChanged?.();
  }

  placementWorldMatrix(placed: PlacedModule): THREE.Matrix4 {
    const def = getModule(placed.defId)!;
    const center = this.grid.placementCenter(def, placed);
    const m = new THREE.Matrix4();
    m.makeRotationY((Math.PI / 2) * placed.rot);
    m.setPosition(center.x, 0, center.z);
    return m;
  }

  private spawnGroup(index: number, placed: PlacedModule): void {
    const def = getModule(placed.defId)!;
    const built = def.build(new Rng(placed.seed));
    const group = buildModuleGroup(built, MATERIALS);
    group.userData.placementIndex = index;
    group.userData.instances = built.instances;
    const matrix = this.placementWorldMatrix(placed);
    group.applyMatrix4(matrix);
    this.scene.add(group);
    this.moduleGroups.set(index, group);
  }

  private rebuildInstances(): void {
    const all: { req: InstanceRequest; worldMatrix: THREE.Matrix4 }[] = [];
    for (const [index, group] of this.moduleGroups) {
      const placed = this.grid.placements[index];
      if (!placed) continue;
      const worldMatrix = this.placementWorldMatrix(placed);
      for (const req of group.userData.instances ?? []) {
        all.push({ req, worldMatrix });
      }
    }
    this.pools.rebuild(all);
  }

  dispose(): void {
    this.pools.dispose();
  }
}
