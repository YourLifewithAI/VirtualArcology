/**
 * Procedural geometry pipeline.
 *
 * Module builders author parts through PartsBuilder helpers (box/cyl/quad/...),
 * each tagged with a palette color and a render layer. merge() bakes colors
 * into vertex colors and merges everything into at most one BufferGeometry per
 * layer, so a placed module costs <= 3 draw calls no matter how many parts it has.
 *
 * Conventions:
 *  - Module-local origin is the CENTER of the footprint at ground level (y=0).
 *  - Part positions are given as (x, yBase, z): y is the BOTTOM of the part.
 *  - Rotations are radians, applied XYZ around the part's own base center.
 *  - High-count scatter (trees, solar panels) should use instance() instead of
 *    geometry parts; TesseraMode renders those through shared InstancedMesh pools.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, type ColorName } from './Palette';

export type Layer = 'opaque' | 'glass' | 'emissive';

/** Names of shared instanced parts (geometry defined in catalog/parts.ts). */
export type InstancePart = 'tree' | 'treeRound' | 'shrub' | 'solarPanel';

export interface InstanceRequest {
  part: InstancePart;
  matrix: THREE.Matrix4;
}

export interface BuiltModule {
  opaque?: THREE.BufferGeometry;
  glass?: THREE.BufferGeometry;
  emissive?: THREE.BufferGeometry;
  instances: InstanceRequest[];
}

export interface PartOpts {
  x?: number;
  /** BOTTOM of the part, not its center. */
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  layer?: Layer;
}

const tmpColor = new THREE.Color();

function bakeColor(geom: THREE.BufferGeometry, hex: number): void {
  tmpColor.setHex(hex).convertSRGBToLinear();
  const count = geom.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

const tmpEuler = new THREE.Euler();
const tmpQuat = new THREE.Quaternion();
const tmpMat = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3(1, 1, 1);

export class PartsBuilder {
  private parts: { geom: THREE.BufferGeometry; color: number; layer: Layer }[] = [];
  private instanceRequests: InstanceRequest[] = [];

  /** Add an arbitrary geometry whose own origin is at its base center. */
  custom(geom: THREE.BufferGeometry, color: ColorName, o: PartOpts = {}): this {
    // Normalize: primitives are a mix of indexed (Box, Cylinder, Plane) and
    // non-indexed (Icosahedron) geometries, and mergeGeometries refuses to mix.
    if (geom.index) {
      const ni = geom.toNonIndexed();
      geom.dispose();
      geom = ni;
    }
    tmpEuler.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpPos.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    geom.applyMatrix4(tmpMat);
    this.parts.push({ geom, color: PALETTE[color], layer: o.layer ?? 'opaque' });
    return this;
  }

  /** Axis-aligned box, w(x) h(y) d(z), sitting on y. */
  box(w: number, h: number, d: number, color: ColorName, o: PartOpts = {}): this {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    return this.custom(g, color, o);
  }

  /** Cylinder with distinct top/bottom radii, sitting on y. */
  cone(rTop: number, rBottom: number, h: number, color: ColorName, o: PartOpts = {}, seg = 12): this {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
    g.translate(0, h / 2, 0);
    return this.custom(g, color, o);
  }

  /** Uniform cylinder, sitting on y. */
  cyl(r: number, h: number, color: ColorName, o: PartOpts = {}, seg = 12): this {
    return this.cone(r, r, h, color, o, seg);
  }

  /** Half-sphere dome, flat side down, sitting on y. */
  dome(r: number, color: ColorName, o: PartOpts = {}, seg = 12): this {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg >> 1), 0, Math.PI * 2, 0, Math.PI / 2);
    return this.custom(g, color, o);
  }

  /** Low-poly blob (icosahedron), centered horizontally, sitting on y. */
  blob(r: number, color: ColorName, o: PartOpts = {}, detail = 0): this {
    const g = new THREE.IcosahedronGeometry(r, detail);
    g.translate(0, r, 0);
    return this.custom(g, color, o);
  }

  /**
   * Gable roof / triangular prism: footprint w(x) x d(z), ridge along X at
   * height h, eaves at z = +-d/2 at y=0. Includes both slopes and end triangles.
   */
  gable(w: number, h: number, d: number, color: ColorName, o: PartOpts = {}): this {
    const hw = w / 2;
    const hd = d / 2;
    // Non-indexed triangles; computeVertexNormals gives flat faces.
    // prettier-ignore
    const verts = new Float32Array([
      // south slope (z+)
      -hw, 0, hd,   hw, 0, hd,   hw, h, 0,
      -hw, 0, hd,   hw, h, 0,   -hw, h, 0,
      // north slope (z-)
      hw, 0, -hd,  -hw, 0, -hd,  -hw, h, 0,
      hw, 0, -hd,  -hw, h, 0,    hw, h, 0,
      // east end triangle (x+)
      hw, 0, hd,   hw, 0, -hd,   hw, h, 0,
      // west end triangle (x-)
      -hw, 0, -hd, -hw, 0, hd,  -hw, h, 0,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    // uv required for merge compatibility with primitive geometries
    const uv = new Float32Array((verts.length / 3) * 2);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return this.custom(g, color, o);
  }

  /** Vertical quad facing +Z (before ry), width w, height h, sitting on y. */
  quad(w: number, h: number, color: ColorName, o: PartOpts = {}): this {
    const g = new THREE.PlaneGeometry(w, h);
    g.translate(0, h / 2, 0);
    return this.custom(g, color, o);
  }

  /** Horizontal quad facing +Y, w(x) x d(z), at height y. */
  hquad(w: number, d: number, color: ColorName, o: PartOpts = {}): this {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    return this.custom(g, color, o);
  }

  /** Horizontal disc facing +Y at height y. */
  disc(r: number, color: ColorName, o: PartOpts = {}, seg = 16): this {
    const g = new THREE.CircleGeometry(r, seg);
    g.rotateX(-Math.PI / 2);
    return this.custom(g, color, o);
  }

  /** Torus lying flat (hole up), center-line radius r, tube radius rt, at height y. */
  ring(r: number, rt: number, color: ColorName, o: PartOpts = {}, seg = 16): this {
    const g = new THREE.TorusGeometry(r, rt, 6, seg);
    g.rotateX(-Math.PI / 2);
    return this.custom(g, color, o);
  }

  /** Request a shared instanced part at (x, y, z) with yaw and uniform scale. */
  instance(part: InstancePart, x: number, y: number, z: number, ry = 0, scale = 1): this {
    const m = new THREE.Matrix4();
    tmpEuler.set(0, ry, 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpPos.set(x, y, z);
    m.compose(tmpPos, tmpQuat, new THREE.Vector3(scale, scale, scale));
    this.instanceRequests.push({ part, matrix: m });
    return this;
  }

  /** Bake vertex colors, merge per layer, dispose intermediates. */
  merge(): BuiltModule {
    const byLayer: Record<Layer, THREE.BufferGeometry[]> = { opaque: [], glass: [], emissive: [] };
    for (const p of this.parts) {
      bakeColor(p.geom, p.color);
      byLayer[p.layer].push(p.geom);
    }
    const out: BuiltModule = { instances: this.instanceRequests };
    for (const layer of ['opaque', 'glass', 'emissive'] as const) {
      const list = byLayer[layer];
      if (list.length === 0) continue;
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (merged !== list[0]) list.forEach((g) => g.dispose());
      out[layer] = merged;
    }
    this.parts = [];
    this.instanceRequests = [];
    return out;
  }
}

/** Build a THREE.Group of meshes from a BuiltModule using the shared materials. */
export function buildModuleGroup(
  built: BuiltModule,
  materials: { opaque: THREE.Material; glass: THREE.Material; emissive: THREE.Material },
): THREE.Group {
  const group = new THREE.Group();
  if (built.opaque) {
    const m = new THREE.Mesh(built.opaque, materials.opaque);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  if (built.emissive) {
    const m = new THREE.Mesh(built.emissive, materials.emissive);
    group.add(m);
  }
  if (built.glass) {
    const m = new THREE.Mesh(built.glass, materials.glass);
    m.renderOrder = 10;
    group.add(m);
  }
  return group;
}
