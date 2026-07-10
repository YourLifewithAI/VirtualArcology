/**
 * Regional ground archetype: the land the Tessera sits in. Each biome sets
 * the meadow color, fog distance, and the scatter ring outside the site
 * (trees, scrub, snowpatches, or exurban homesteads).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE } from '../core/Palette';
import { MATERIALS } from '../core/Materials';
import { Rng } from '../core/Rng';
import { instancedPartGeometry } from '../catalog/parts';
import type { Terrain } from './Terrain';

export interface BiomeDef {
  label: string;
  meadow: number;
  fog: { near: number; far: number };
  /** scatter items per ring */
  trees: number;
  treeScale: [number, number];
  shrubs: number;
  /** exurban homesteads */
  homes?: number;
  /** pale snow patches (tundra) */
  patches?: number;
  patchColor?: number;
}

export const BIOMES: Record<string, BiomeDef> = {
  temperate: { label: 'Temperate (Central Texas)', meadow: 0x9dae6e, fog: { near: 700, far: 2600 }, trees: 420, treeScale: [0.9, 1.5], shrubs: 220 },
  plains: { label: 'Great Plains', meadow: 0xc9b458, fog: { near: 800, far: 3200 }, trees: 60, treeScale: [0.8, 1.2], shrubs: 320 },
  desert: { label: 'High Desert', meadow: 0xd9be8c, fog: { near: 900, far: 3600 }, trees: 0, treeScale: [1, 1], shrubs: 500, patches: 120, patchColor: 0xc4a875 },
  tundra: { label: 'Tundra', meadow: 0xe8ecea, fog: { near: 450, far: 1800 }, trees: 90, treeScale: [0.5, 0.9], shrubs: 140, patches: 260, patchColor: 0xf5f8f7 },
  exurban: { label: 'Exurban Fringe', meadow: 0x9fae74, fog: { near: 700, far: 2600 }, trees: 260, treeScale: [0.9, 1.4], shrubs: 160, homes: 90 },
};

export const BIOME_NAMES = Object.keys(BIOMES);

function homesteadGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bake = (g: THREE.BufferGeometry, hex: number): THREE.BufferGeometry => {
    const c = new THREE.Color(hex).convertSRGBToLinear();
    const ng = g.index ? g.toNonIndexed() : g;
    const count = ng.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    ng.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return ng;
  };
  const body = new THREE.BoxGeometry(9, 3.4, 7);
  body.translate(0, 1.7, 0);
  parts.push(bake(body, PALETTE.cream));
  // simple gable
  const roof = new THREE.CylinderGeometry(0.1, 4.8, 2.4, 4);
  roof.rotateY(Math.PI / 4);
  roof.scale(1.15, 1, 0.85);
  roof.translate(0, 4.6, 0);
  parts.push(bake(roof, PALETTE.terracotta));
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}

export class BiomeLayer {
  private meadow: THREE.Mesh;
  private scatter: THREE.Object3D[] = [];
  private xray = false;
  biome = 'temperate';

  constructor(
    private scene: THREE.Scene,
    private terrain: Terrain,
  ) {
    this.meadow = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({ color: BIOMES.temperate.meadow, roughness: 1 }),
    );
    this.meadow.receiveShadow = true;
    scene.add(this.meadow);
  }

  rebuild(biomeName: string, siteW: number, siteD: number, fog: THREE.Fog | null): void {
    this.biome = biomeName;
    const b = BIOMES[biomeName] ?? BIOMES.temperate;
    // the ground is a displaced heightfield (real or procedural relief)
    this.meadow.geometry.dispose();
    this.meadow.geometry = this.terrain.buildGeometry();
    (this.meadow.material as THREE.MeshStandardMaterial).color.setHex(b.meadow);
    if (fog) {
      fog.near = b.fog.near;
      fog.far = b.fog.far;
      fog.color.setHex(PALETTE.skyHorizon);
    }

    for (const o of this.scatter) {
      this.scene.remove(o);
      if (o instanceof THREE.InstancedMesh) {
        // tree/shrub geometry is shared via the part cache; only dispose geometry we own
        if (o.userData.ownGeometry) o.geometry.dispose();
        o.dispose();
      }
    }
    this.scatter = [];

    const rng = new Rng(9042);
    const halfX = (siteW * 10) / 2 + 30;
    const halfZ = (siteD * 10) / 2 + 30;
    // keep scatter well inside the fog-visible band (distant trees against a
    // fog-saturated meadow read as floating specks), densest near the site
    const ringMax = Math.max(halfX + 200, Math.min(1400, b.fog.far * 0.38));
    const inRing = (x: number, z: number): boolean =>
      !(Math.abs(x) < halfX && Math.abs(z) < halfZ) && Math.hypot(x, z) <= ringMax;
    const sampleRing = (): { x: number; z: number } => {
      for (;;) {
        const ang = rng.float(0, Math.PI * 2);
        const r = ringMax * Math.pow(rng.float(0.12, 1), 1.5);
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        if (inRing(x, z)) return { x, z };
      }
    };
    const place = (
      mesh: THREE.InstancedMesh,
      positions: { x: number; z: number }[],
      scale: [number, number],
      yScaleJitter = 0,
    ): void => {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      positions.forEach((p, i) => {
        const s = rng.float(scale[0], scale[1]);
        q.setFromAxisAngle(up, rng.float(0, Math.PI * 2));
        m.compose(
          new THREE.Vector3(p.x, this.terrain.heightAt(p.x, p.z), p.z),
          q,
          new THREE.Vector3(s, s * (1 + rng.float(-yScaleJitter, yScaleJitter)), s),
        );
        mesh.setMatrixAt(i, m);
      });
      mesh.count = positions.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.visible = !this.xray;
      this.scene.add(mesh);
      this.scatter.push(mesh);
    };

    if (b.trees > 0) {
      // groves, not uniform scatter — clumps read as real landscape
      const positions: { x: number; z: number }[] = [];
      const groves = Math.max(1, Math.round(b.trees / 7));
      for (let g = 0; g < groves && positions.length < b.trees; g++) {
        const c = sampleRing();
        const size = rng.int(3, 11);
        for (let t = 0; t < size && positions.length < b.trees; t++) {
          const x = c.x + rng.float(-55, 55);
          const z = c.z + rng.float(-55, 55);
          positions.push(inRing(x, z) ? { x, z } : sampleRing());
        }
      }
      place(new THREE.InstancedMesh(instancedPartGeometry('tree'), MATERIALS.opaque, positions.length), positions, b.treeScale, 0.25);
    }
    if (b.shrubs > 0) {
      const positions = Array.from({ length: b.shrubs }, () => sampleRing());
      place(new THREE.InstancedMesh(instancedPartGeometry('shrub'), MATERIALS.opaque, b.shrubs), positions, [0.9, 2.2]);
    }
    if (b.homes) {
      const homes = new THREE.InstancedMesh(homesteadGeometry(), MATERIALS.opaque, b.homes);
      homes.userData.ownGeometry = true;
      place(homes, Array.from({ length: b.homes }, () => sampleRing()), [0.8, 1.3]);
    }
    if (b.patches) {
      // flat ground patches (sand ripples / snow) as instanced discs
      const disc = new THREE.CircleGeometry(6, 10).rotateX(-Math.PI / 2);
      disc.translate(0, 0.02, 0);
      const c = new THREE.Color(b.patchColor ?? 0xffffff).convertSRGBToLinear();
      const count = disc.getAttribute('position').count;
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      disc.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const patches = new THREE.InstancedMesh(disc, MATERIALS.opaque, b.patches);
      patches.userData.ownGeometry = true;
      place(patches, Array.from({ length: b.patches }, () => sampleRing()), [0.6, 2.4]);
    }
  }

  /** Utility x-ray view: fade the meadow and hide the scatter ring. */
  setTranslucent(on: boolean): void {
    this.xray = on;
    const mat = this.meadow.material as THREE.MeshStandardMaterial;
    mat.transparent = on;
    mat.opacity = on ? 0.3 : 1;
    mat.needsUpdate = true;
    for (const o of this.scatter) o.visible = !on;
  }
}
