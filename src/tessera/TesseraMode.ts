/**
 * The Tessera builder: a neighborhood site on a 10 m grid where catalog
 * modules are placed, plus ground, lighting, and the instanced scatter pools.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import type { Mode } from '../core/Mode';
import { MATERIALS } from '../core/Materials';
import { PALETTE, THEME_ENV } from '../core/Palette';
import { Rng } from '../core/Rng';
import { buildModuleGroup, type InstanceRequest } from '../core/geo';
import { getModule } from '../catalog/ModuleCatalog';
import { clearInstancedPartCache } from '../catalog/parts';
import { BiomeLayer } from './BiomeLayer';
import { FoodWeb } from './FoodWeb';
import { CELL_SIZE, Grid, type PlacedModule } from './Grid';
import { InstancePools } from './InstancePools';
import { RoadNetwork } from './RoadNetwork';
import { UtilityNetwork } from './UtilityNetwork';

export const DEFAULT_GRID = 56;

export class TesseraMode implements Mode {
  readonly id = 'tessera';
  readonly scene = new THREE.Scene();
  grid: Grid;
  private moduleGroups = new Map<number, THREE.Group>();
  private pools: InstancePools;
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private groundMeshes: THREE.Object3D[] = [];
  private utilities: UtilityNetwork;
  private roads: RoadNetwork;
  private foodWeb: FoodWeb;
  private biomes: BiomeLayer;
  private slab: THREE.Mesh | null = null;
  /** Active regional archetype (BIOMES key). */
  biome = 'temperate';
  /** 'slab' = paver site pad; 'terrain' = see-through to the biome ground. */
  groundStyle: 'slab' | 'terrain' = 'slab';
  /** True while the underground-infrastructure x-ray view is active. */
  utilityView = false;
  /** True while the street-connectivity overlay is active. */
  roadView = false;
  /** True while the food-web overlay is active. */
  foodView = false;
  private ghostMat = new THREE.MeshBasicMaterial({
    color: 0xbcd4e6,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
  });
  private animatables: { update(dt: number): void }[] = [];
  /** Incremented on every placement change (robots re-sync off this). */
  layoutVersion = 0;
  /** Fired after any placement change (for autosave + HUD). */
  onLayoutChanged: (() => void) | null = null;

  private notifyLayoutChanged(): void {
    this.layoutVersion++;
    if (this.utilityView) this.utilities.setVisible(true);
    if (this.roadView) this.roads.setVisible(true);
    if (this.foodView) this.foodWeb.setVisible(true);
    this.onLayoutChanged?.();
  }

  constructor(private app: App, gridSize = DEFAULT_GRID) {
    this.grid = new Grid(gridSize, gridSize);
    this.pools = new InstancePools(this.scene);
    this.utilities = new UtilityNetwork(this);
    this.roads = new RoadNetwork(this);
    this.foodWeb = new FoodWeb(this);

    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.skyHorizon, 700, 2600);
    this.biomes = new BiomeLayer(this.scene);

    this.hemi = new THREE.HemisphereLight(0xdff1ff, 0x9a8a6a, 0.9);
    this.scene.add(this.hemi);

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

  private buildGround(gridW: number, gridD = gridW): void {
    for (const m of this.groundMeshes) {
      this.scene.remove(m);
      if (m instanceof THREE.Mesh || m instanceof THREE.LineSegments) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    }
    this.groundMeshes = [];
    const siteW = gridW * CELL_SIZE;
    const siteD = gridD * CELL_SIZE;

    this.biomes.rebuild(this.biome, gridW, gridD, this.scene.fog as THREE.Fog);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(siteW + 8, 0.2, siteD + 8),
      new THREE.MeshStandardMaterial({ color: PALETTE.paver, roughness: 0.95 }),
    );
    slab.position.y = -0.1;
    slab.receiveShadow = true;
    slab.visible = this.groundStyle === 'slab';
    this.slab = slab;
    this.scene.add(slab);

    // rectangle-capable cell lattice
    const pts: number[] = [];
    for (let x = 0; x <= gridW; x++) {
      pts.push(x * CELL_SIZE - siteW / 2, 0.04, -siteD / 2, x * CELL_SIZE - siteW / 2, 0.04, siteD / 2);
    }
    for (let z = 0; z <= gridD; z++) {
      pts.push(-siteW / 2, 0.04, z * CELL_SIZE - siteD / 2, siteW / 2, 0.04, z * CELL_SIZE - siteD / 2);
    }
    const latticeGeom = new THREE.BufferGeometry();
    latticeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    const gridHelper = new THREE.LineSegments(
      latticeGeom,
      new THREE.LineBasicMaterial({ color: 0x8d8874, transparent: true, opacity: 0.25 }),
    );
    gridHelper.name = 'gridHelper';
    this.scene.add(gridHelper);

    this.groundMeshes = [slab, gridHelper];
    this.applyUtilityViewToGround();
  }

  /** Swap the regional archetype (meadow, fog, off-site scatter). Visual only. */
  setBiome(name: string): void {
    this.biome = name;
    this.biomes.rebuild(name, this.grid.width, this.grid.depth, this.scene.fog as THREE.Fog);
  }

  /**
   * Re-bake everything that has PALETTE colors in it. Call after applyTheme():
   * palette colors live in vertex colors baked at build time, so every placed
   * module, scatter pool, and ground surface is rebuilt in place (placement
   * indices are preserved — undo history and inspection stay valid).
   */
  refreshTheme(themeName: string): void {
    const env = THEME_ENV[themeName] ?? THEME_ENV.solarpunk;
    (this.scene.background as THREE.Color).setHex(PALETTE.sky);
    this.sun.intensity = env.sun;
    this.sun.color.setHex(env.sunColor);
    this.hemi.intensity = env.hemi;

    for (const [index, group] of [...this.moduleGroups.entries()]) {
      this.scene.remove(group);
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      const placed = this.grid.placements[index];
      if (placed) this.spawnGroup(index, placed);
      else this.moduleGroups.delete(index);
    }

    // instanced scatter has baked colors too: drop the geometry cache and
    // rebuild pools + biome ring from fresh geometry
    this.pools.dispose();
    clearInstancedPartCache();
    this.pools = new InstancePools(this.scene);
    this.rebuildInstances();
    if (this.utilityView) this.pools.setVisible(false);

    // slab/lattice colors + biome fog color come from the palette
    this.buildGround(this.grid.width, this.grid.depth);
  }

  /** Building-utility pairs that couldn't reach their plant (valid while pipes view is on). */
  get serviceAlerts(): number {
    return this.utilities.unconnected;
  }

  /** Street connectivity overlay (teal = on the transit network, red = island). */
  setRoadView(on: boolean): void {
    this.roadView = on;
    this.roads.setVisible(on);
  }

  /** Valid while the road view is on. */
  get roadStats(): { disconnected: number; total: number } {
    return { disconnected: this.roads.disconnected, total: this.roads.totalStreets };
  }

  /** Food-web overlay (green links between interconnected food buildings). */
  setFoodView(on: boolean): void {
    this.foodView = on;
    this.foodWeb.setVisible(on);
  }

  /** Valid while the food view is on. */
  get foodStats(): { clusters: number; integrated: number; isolated: number } {
    return { clusters: this.foodWeb.clusters, integrated: this.foodWeb.integrated, isolated: this.foodWeb.isolated };
  }

  /** 'terrain' hides the paver site pad so unused cells show the biome ground. */
  setGroundStyle(style: 'slab' | 'terrain'): void {
    this.groundStyle = style;
    if (this.slab) this.slab.visible = style === 'slab';
  }

  /** Replace the site with an empty grid of the given cell dimensions. */
  resizeGrid(w: number, d: number): void {
    this.clearAll();
    this.grid = new Grid(w, d);
    this.buildGround(w, d);
    const ext = (Math.max(w, d) * CELL_SIZE) / 2 + 60;
    this.sun.shadow.camera.left = -ext;
    this.sun.shadow.camera.right = ext;
    this.sun.shadow.camera.top = ext;
    this.sun.shadow.camera.bottom = -ext;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.enter();
    this.notifyLayoutChanged();
  }

  // -- underground utilities x-ray ------------------------------------------

  private applyUtilityViewToGround(): void {
    for (const m of this.groundMeshes) {
      if (m.name === 'gridHelper' || !(m instanceof THREE.Mesh)) continue;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.transparent = this.utilityView;
      mat.opacity = this.utilityView ? 0.3 : 1;
      mat.needsUpdate = true;
    }
    this.biomes.setTranslucent(this.utilityView);
  }

  private applyGhost(group: THREE.Group, on: boolean): void {
    group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (on) {
        if (!o.userData.origMat) o.userData.origMat = o.material;
        o.material = this.ghostMat;
      } else if (o.userData.origMat) {
        o.material = o.userData.origMat;
        delete o.userData.origMat;
      }
    });
  }

  setUtilityView(on: boolean): void {
    this.utilityView = on;
    this.applyUtilityViewToGround();
    for (const group of this.moduleGroups.values()) this.applyGhost(group, on);
    this.pools.setVisible(!on);
    this.utilities.setVisible(on);
  }

  setGridVisible(v: boolean): void {
    const helper = this.scene.getObjectByName('gridHelper');
    if (helper) helper.visible = v;
  }

  enter(): void {
    this.app.renderer.shadowMap.enabled = true;
    const site = Math.max(this.grid.width, this.grid.depth) * CELL_SIZE;
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
    this.notifyLayoutChanged();
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
    this.notifyLayoutChanged();
    return placed;
  }

  restorePlacement(index: number, placed: PlacedModule): void {
    const def = getModule(placed.defId)!;
    this.grid.restore(def, index, placed);
    this.spawnGroup(index, placed);
    this.rebuildInstances();
    this.notifyLayoutChanged();
  }

  clearAll(): void {
    for (const { index } of this.grid.activePlacements()) {
      const placed = this.grid.placements[index]!;
      this.grid.remove(getModule(placed.defId)!, index);
      const group = this.moduleGroups.get(index);
      if (group) {
        this.scene.remove(group);
        group.traverse((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
      }
    }
    this.moduleGroups.clear();
    this.rebuildInstances();
    this.notifyLayoutChanged();
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
    this.notifyLayoutChanged();
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
    if (this.utilityView) this.applyGhost(group, true);
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
