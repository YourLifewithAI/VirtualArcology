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
import { BiomeLayer, BIOMES } from './BiomeLayer';
import { FoodWeb } from './FoodWeb';
import { RegionalCorridors } from './RegionalCorridors';
import { SiteTerrain } from './SiteTerrain';
import { Terrain, type HeightGrid } from './Terrain';
import type { ModuleDef } from '../catalog/types';

/** Modules that conform to slopes instead of grading a flat pad. */
const CONFORMING = new Set(['street', 'park', 'tree-row', 'bioswale', 'orchard']);
/** Max corner-height range a building tolerates before placement is refused. */
const BUILDING_TOLERANCE = 2.5;
/** Conforming modules ride slopes up to this rise per cell of footprint. */
const CONFORM_TOLERANCE_PER_CELL = 3.5;
import { CELL_SIZE, Grid, rotatedFootprint, type PlacedModule } from './Grid';
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
  private corridors: RegionalCorridors;
  readonly terrain = new Terrain();
  /** Editable landform under the site itself (corner heightfield + lakes). */
  readonly site: SiteTerrain;
  private slab: THREE.Mesh | null = null;
  private lattice: THREE.LineSegments | null = null;
  private waterMesh: THREE.Mesh | null = null;
  /** Suppresses per-placement ground rebuilds during bulk loads. */
  private batchingGround = false;
  /** Active regional archetype (BIOMES key). */
  biome = 'temperate';
  /** Human-readable place name when a real location is set. */
  locationLabel: string | null = null;
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
    this.site = new SiteTerrain(gridSize, gridSize);
    this.pools = new InstancePools(this.scene);
    this.utilities = new UtilityNetwork(this);
    this.roads = new RoadNetwork(this);
    this.foodWeb = new FoodWeb(this);

    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.skyHorizon, 700, 2600);
    this.terrain.setSite(gridSize, gridSize);
    this.terrain.setProcedural(this.biome);
    this.biomes = new BiomeLayer(this.scene, this.terrain);
    this.corridors = new RegionalCorridors(this.scene);
    this.registerAnimatable(this.corridors);

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

    this.terrain.setSite(gridW, gridD);
    this.biomes.rebuild(this.biome, gridW, gridD, this.scene.fog as THREE.Fog);
    this.corridors.rebuild(gridW, gridD);

    // pad surface: a heightfield mesh whose vertices sit exactly on cell corners
    const slab = new THREE.Mesh(
      this.buildSiteGeometry(),
      new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    );
    slab.receiveShadow = true;
    this.slab = slab;
    this.scene.add(slab);

    const gridHelper = new THREE.LineSegments(
      this.buildLatticeGeometry(),
      new THREE.LineBasicMaterial({ color: 0x8d8874, transparent: true, opacity: 0.25 }),
    );
    gridHelper.name = 'gridHelper';
    this.scene.add(gridHelper);
    this.lattice = gridHelper;

    const water = new THREE.Mesh(
      this.buildWaterGeometry(),
      new THREE.MeshStandardMaterial({
        color: PALETTE.water,
        transparent: true,
        opacity: 0.72,
        roughness: 0.2,
        metalness: 0.05,
      }),
    );
    water.renderOrder = 4;
    this.waterMesh = water;
    this.scene.add(water);

    this.groundMeshes = [slab, gridHelper, water];
    this.applyGroundStyleColor();
    this.applyUtilityViewToGround();
  }

  private buildSiteGeometry(): THREE.BufferGeometry {
    const w = this.grid.width;
    const d = this.grid.depth;
    const geom = new THREE.PlaneGeometry(w * CELL_SIZE, d * CELL_SIZE, w, d).rotateX(-Math.PI / 2);
    const pos = geom.getAttribute('position');
    // PlaneGeometry vertices are row-major from (-w/2, -d/2)
    for (let i = 0; i < pos.count; i++) {
      const cx = Math.round(pos.getX(i) / CELL_SIZE + w / 2);
      const cz = Math.round(pos.getZ(i) / CELL_SIZE + d / 2);
      pos.setY(i, this.site.cornerH(cx, cz));
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }

  private buildLatticeGeometry(): THREE.BufferGeometry {
    const w = this.grid.width;
    const d = this.grid.depth;
    const half = (c: number, n: number): number => (c - n / 2) * CELL_SIZE;
    const pts: number[] = [];
    const push = (cx0: number, cz0: number, cx1: number, cz1: number): void => {
      pts.push(
        half(cx0, w), this.site.cornerH(cx0, cz0) + 0.06, half(cz0, d),
        half(cx1, w), this.site.cornerH(cx1, cz1) + 0.06, half(cz1, d),
      );
    };
    for (let x = 0; x <= w; x++) for (let z = 0; z < d; z++) push(x, z, x, z + 1);
    for (let z = 0; z <= d; z++) for (let x = 0; x < w; x++) push(x, z, x + 1, z);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geom;
  }

  private buildWaterGeometry(): THREE.BufferGeometry {
    const w = this.grid.width;
    const d = this.grid.depth;
    const pts: number[] = [];
    for (let cz = 0; cz < d; cz++) {
      for (let cx = 0; cx < w; cx++) {
        if (!this.site.isWater(cx, cz)) continue;
        const y = this.site.waterLevel(cx, cz);
        const x0 = (cx - w / 2) * CELL_SIZE;
        const z0 = (cz - d / 2) * CELL_SIZE;
        pts.push(x0, y, z0, x0, y, z0 + CELL_SIZE, x0 + CELL_SIZE, y, z0);
        pts.push(x0 + CELL_SIZE, y, z0, x0, y, z0 + CELL_SIZE, x0 + CELL_SIZE, y, z0 + CELL_SIZE);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    geom.computeVertexNormals();
    return geom;
  }

  /** Re-displace the pad, lattice, and water after any landform change. */
  refreshSiteGround(): void {
    if (this.batchingGround) return;
    if (this.slab) {
      this.slab.geometry.dispose();
      this.slab.geometry = this.buildSiteGeometry();
    }
    if (this.lattice) {
      this.lattice.geometry.dispose();
      this.lattice.geometry = this.buildLatticeGeometry();
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh.geometry = this.buildWaterGeometry();
    }
  }

  private applyGroundStyleColor(): void {
    if (!this.slab) return;
    const meadow = BIOMES[this.biome]?.meadow ?? 0x9dae6e;
    (this.slab.material as THREE.MeshStandardMaterial).color.setHex(
      this.groundStyle === 'slab' ? PALETTE.paver : meadow,
    );
  }

  /** Swap the regional archetype (meadow, fog, off-site scatter). Visual only. */
  setBiome(name: string): void {
    this.biome = name;
    this.terrain.setProcedural(name); // no-op while real elevation is loaded
    this.biomes.rebuild(name, this.grid.width, this.grid.depth, this.scene.fog as THREE.Fog);
    this.applyGroundStyleColor();
  }

  /**
   * Location-aware site: real relief (if provided), climate-matched biome,
   * and the sun where that latitude actually puts it.
   */
  applyLocation(loc: { label: string; lat: number; biome: string; heights?: HeightGrid }): void {
    this.locationLabel = loc.label;
    if (loc.heights) this.terrain.setReal(loc.heights);
    // equinox-noon solar elevation for the latitude, kept photogenic
    const elev = (Math.min(78, Math.max(12, 90 - Math.abs(loc.lat) - 12)) * Math.PI) / 180;
    const south = loc.lat >= 0 ? 1 : -1;
    this.sun.position.set(200, Math.sin(elev) * 520, south * Math.cos(elev) * 520);
    this.setBiome(loc.biome);
    this.onLayoutChanged?.(); // refresh ledger (location row)
  }

  /** Back to a placeless site: procedural hills, default sun. */
  clearLocation(): void {
    this.locationLabel = null;
    this.terrain.clearReal();
    this.terrain.setProcedural(this.biome);
    this.sun.position.set(320, 420, 180);
    this.setBiome(this.biome);
    this.onLayoutChanged?.();
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

  /** 'terrain' recolors the pad to the biome ground so unused cells read as land. */
  setGroundStyle(style: 'slab' | 'terrain'): void {
    this.groundStyle = style;
    this.applyGroundStyleColor();
  }

  /** Landform edit mode hides everything but the land itself. */
  setBuildingsVisible(v: boolean): void {
    for (const g of this.moduleGroups.values()) g.visible = v;
    this.pools.setVisible(v && !this.utilityView);
  }

  /** Re-seat every placed module on the (possibly regraded) ground. */
  refreshPlacementTransforms(): void {
    for (const [index, group] of this.moduleGroups) {
      const placed = this.grid.placements[index];
      if (!placed) continue;
      this.placementWorldMatrix(placed).decompose(group.position, group.quaternion, group.scale);
    }
    this.rebuildInstances();
  }

  /**
   * After a landform edit: delete placements whose ground is now too steep
   * or flooded (the deal the editor states up front), re-seat the rest.
   * Returns how many were removed.
   */
  validatePlacementsAfterTerrain(): number {
    let removed = 0;
    for (const { placed, index } of this.grid.activePlacements()) {
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      const f = this.site.footprint(placed.x, placed.z, w, d);
      const range = f.max - f.min;
      const ok =
        !f.water &&
        (CONFORMING.has(placed.defId)
          ? range <= CONFORM_TOLERANCE_PER_CELL * Math.max(w, d)
          : range <= BUILDING_TOLERANCE);
      if (!ok) {
        this.removePlacement(index);
        removed++;
      }
    }
    this.refreshPlacementTransforms();
    return removed;
  }

  /** Replace the site with an empty grid of the given cell dimensions. */
  resizeGrid(w: number, d: number): void {
    this.clearAll();
    this.grid = new Grid(w, d);
    this.site.reset(w, d);
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
    this.corridors.setVisible(!this.utilityView);
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

  /** Place a module (assumes canPlaceModule was checked). Returns placement index. */
  addPlacement(placed: PlacedModule): number {
    const def = getModule(placed.defId);
    if (!def) throw new Error(`Unknown module: ${placed.defId}`);
    const index = this.grid.place(def, placed);
    this.gradeForPlacement(placed);
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
    this.gradeForPlacement(placed);
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
    this.batchingGround = true;
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
      this.gradeForPlacement(p);
      this.spawnGroup(index, p);
    }
    this.batchingGround = false;
    this.refreshSiteGround();
    this.rebuildInstances();
    this.notifyLayoutChanged();
  }

  placementWorldMatrix(placed: PlacedModule): THREE.Matrix4 {
    const def = getModule(placed.defId)!;
    const center = this.grid.placementCenter(def, placed);
    const { w, d } = rotatedFootprint(def, placed.rot);
    const f = this.site.footprint(placed.x, placed.z, w, d);
    const m = new THREE.Matrix4();
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (Math.PI / 2) * placed.rot);
    if (CONFORMING.has(placed.defId) && f.max - f.min > 0.05) {
      // ride the slope: fit a plane to the footprint corners
      const west = (this.site.cornerH(placed.x, placed.z) + this.site.cornerH(placed.x, placed.z + d)) / 2;
      const east = (this.site.cornerH(placed.x + w, placed.z) + this.site.cornerH(placed.x + w, placed.z + d)) / 2;
      const north = (this.site.cornerH(placed.x, placed.z) + this.site.cornerH(placed.x + w, placed.z)) / 2;
      const south = (this.site.cornerH(placed.x, placed.z + d) + this.site.cornerH(placed.x + w, placed.z + d)) / 2;
      const normal = new THREE.Vector3(-(east - west) / (w * CELL_SIZE), 1, -(south - north) / (d * CELL_SIZE)).normalize();
      const qTilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      m.makeRotationFromQuaternion(qTilt.multiply(qYaw));
    } else {
      m.makeRotationFromQuaternion(qYaw);
    }
    m.setPosition(center.x, f.mean, center.z);
    return m;
  }

  /** Placement validity incl. landform: water blocks, slopes gate by module kind. */
  canPlaceModule(def: ModuleDef, x: number, z: number, rot: PlacedModule['rot']): boolean {
    if (!this.grid.canPlace(def, x, z, rot)) return false;
    const { w, d } = rotatedFootprint(def, rot);
    const f = this.site.footprint(x, z, w, d);
    if (f.water) return false;
    const range = f.max - f.min;
    return CONFORMING.has(def.id) ? range <= CONFORM_TOLERANCE_PER_CELL * Math.max(w, d) : range <= BUILDING_TOLERANCE;
  }

  /** Ground height a ghost should hover at for a footprint. */
  ghostHeight(def: ModuleDef, x: number, z: number, rot: PlacedModule['rot']): number {
    const { w, d } = rotatedFootprint(def, rot);
    return this.site.footprint(x, z, w, d).mean;
  }

  /** Buildings grade a level pad into the slope; conforming modules don't. */
  private gradeForPlacement(placed: PlacedModule): void {
    if (CONFORMING.has(placed.defId)) return;
    const def = getModule(placed.defId)!;
    const { w, d } = rotatedFootprint(def, placed.rot);
    this.site.flatten(placed.x, placed.z, w, d);
    this.refreshSiteGround();
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
