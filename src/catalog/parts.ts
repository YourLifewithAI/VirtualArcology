/**
 * Shared procedural sub-assemblies. Every module recipe composes these so the
 * whole catalog reads as one visual family.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, type ColorName } from '../core/Palette';
import { PartsBuilder, type InstancePart, type Layer } from '../core/geo';
import type { Rng } from '../core/Rng';

// ---------------------------------------------------------------------------
// Instanced part geometries (unit scale, origin at ground center).
// Rendered via shared InstancedMesh pools with the opaque vertex-color material.
// ---------------------------------------------------------------------------

function bake(geom: THREE.BufferGeometry, color: ColorName): THREE.BufferGeometry {
  if (geom.index) {
    const ni = geom.toNonIndexed();
    geom.dispose();
    geom = ni;
  }
  const c = new THREE.Color(PALETTE[color]).convertSRGBToLinear();
  const count = geom.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geom;
}

function treeGeometry(round: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.14, 0.2, 2.6, 6);
  trunk.translate(0, 1.3, 0);
  parts.push(bake(trunk, 'bark'));
  if (round) {
    const canopy = new THREE.IcosahedronGeometry(1.9, 1);
    canopy.scale(1, 0.95, 1);
    canopy.translate(0, 3.6, 0);
    parts.push(bake(canopy, 'leafLight'));
  } else {
    const c1 = new THREE.IcosahedronGeometry(1.7, 0);
    c1.translate(0.35, 3.4, 0.15);
    parts.push(bake(c1, 'leaf'));
    const c2 = new THREE.IcosahedronGeometry(1.25, 0);
    c2.translate(-0.6, 4.3, -0.3);
    parts.push(bake(c2, 'leafDark'));
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

function shrubGeometry(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(0.55, 0);
  g.scale(1, 0.75, 1);
  g.translate(0, 0.4, 0);
  return bake(g, 'leafDark');
}

function solarPanelGeometry(): THREE.BufferGeometry {
  // One field/roof panel: ~3.0 x 1.7 m face tilted ~25 deg south (+z), on two legs.
  const parts: THREE.BufferGeometry[] = [];
  const face = new THREE.BoxGeometry(3.0, 0.08, 1.7);
  face.translate(0, 0, 0);
  face.rotateX(-Math.PI * 0.14);
  face.translate(0, 0.95, 0);
  parts.push(bake(face, 'solar'));
  for (const sx of [-1.2, 1.2]) {
    const leg = new THREE.BoxGeometry(0.09, 0.8, 0.09);
    leg.translate(sx, 0.4, 0.3);
    parts.push(bake(leg, 'steelDark'));
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

const instancedGeomCache = new Map<InstancePart, THREE.BufferGeometry>();

export function instancedPartGeometry(part: InstancePart): THREE.BufferGeometry {
  let geom = instancedGeomCache.get(part);
  if (geom) return geom;
  switch (part) {
    case 'tree':
      geom = treeGeometry(false);
      break;
    case 'treeRound':
      geom = treeGeometry(true);
      break;
    case 'shrub':
      geom = shrubGeometry();
      break;
    case 'solarPanel':
      geom = solarPanelGeometry();
      break;
  }
  instancedGeomCache.set(part, geom);
  return geom;
}

export const INSTANCE_PARTS: InstancePart[] = ['tree', 'treeRound', 'shrub', 'solarPanel'];

// ---------------------------------------------------------------------------
// Composition helpers operating on a PartsBuilder.
// ---------------------------------------------------------------------------

export interface WindowGridOpts {
  /** Wall length along its local X before rotation. */
  width: number;
  /** Bottom of the first row (m). */
  y0: number;
  rows: number;
  rowHeight: number;
  cols?: number;
  windowW?: number;
  windowH?: number;
  /** Fraction of windows that glow warm. */
  litRatio?: number;
  /** Wall center position + yaw; quads are placed just outside the wall plane. */
  x: number;
  z: number;
  ry: number;
  /** Distance from wall center-plane to quad (half wall thickness + epsilon). */
  offset: number;
}

/** Rows of window quads on one facade; a seeded few glow warm (emissive). */
export function facadeWindows(b: PartsBuilder, rng: Rng, o: WindowGridOpts): void {
  const cols = o.cols ?? Math.max(1, Math.floor(o.width / 2.6));
  const ww = o.windowW ?? 1.15;
  const wh = o.windowH ?? 1.5;
  const lit = o.litRatio ?? 0.18;
  const step = o.width / cols;
  const sin = Math.sin(o.ry);
  const cos = Math.cos(o.ry);
  for (let r = 0; r < o.rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = (c + 0.5) * step - o.width / 2;
      // local (lx, offset) rotated by ry around the wall center
      const x = o.x + lx * cos + o.offset * sin;
      const z = o.z - lx * sin + o.offset * cos;
      const isLit = rng.chance(lit);
      b.quad(ww, wh, isLit ? 'windowLit' : 'windowDark', {
        x,
        z,
        y: o.y0 + r * o.rowHeight,
        ry: o.ry,
        layer: isLit ? 'emissive' : 'opaque',
      });
    }
  }
}

const MURAL_COLORS: ColorName[] = [
  'canvasRed',
  'canvasTeal',
  'canvasYellow',
  'leaf',
  'terracotta',
  'growMagenta',
  'solar',
];

/**
 * Seeded solarpunk mural: layered discs/quads floating just off a wall.
 * Wall is centered at (x, z) with yaw ry; mural spans w x h starting at y0.
 */
export function mural(b: PartsBuilder, rng: Rng, w: number, h: number, x: number, z: number, ry: number, offset: number, y0: number): void {
  const sin = Math.sin(ry);
  const cos = Math.cos(ry);
  const place = (lx: number, off: number): { x: number; z: number } => ({
    x: x + lx * cos + off * sin,
    z: z - lx * sin + off * cos,
  });
  // backdrop
  const bg = place(0, offset);
  b.quad(w, h, rng.pick(['cream', 'creamDark', 'path']), { x: bg.x, z: bg.z, y: y0, ry });
  const n = rng.int(4, 7);
  for (let i = 0; i < n; i++) {
    const lx = rng.float(-w / 2 + 0.8, w / 2 - 0.8);
    const cy = y0 + rng.float(0.6, h - 0.8);
    const color = rng.pick(MURAL_COLORS);
    const p = place(lx, offset + 0.02 + i * 0.005);
    if (rng.chance(0.55)) {
      const r = rng.float(0.4, Math.min(1.6, h / 3));
      // vertical disc: use a small circle quad approximation via quad rotated
      const g = new THREE.CircleGeometry(r, 12);
      g.translate(0, 0, 0);
      b.custom(g, color, { x: p.x, z: p.z, y: cy, ry });
    } else {
      b.quad(rng.float(0.6, 2.2), rng.float(0.5, 1.6), color, { x: p.x, z: p.z, y: cy - 0.5, ry });
    }
  }
}

/** Rows of tilted rooftop solar panels covering a w x d roof area at height y. */
export function solarRoof(b: PartsBuilder, w: number, d: number, y: number, opts: { x?: number; z?: number } = {}): void {
  const x0 = opts.x ?? 0;
  const z0 = opts.z ?? 0;
  const rows = Math.max(1, Math.floor(d / 2.4));
  const cols = Math.max(1, Math.floor(w / 3.4));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      b.box(3.0, 0.1, 1.7, 'solar', {
        x: x0 + (c + 0.5) * (w / cols) - w / 2,
        z: z0 + (r + 0.5) * (d / rows) - d / 2,
        y: y + 0.25,
        rx: -Math.PI * 0.12,
      });
    }
  }
}

/** Thin parapet walls around a w x d roof at height y. */
export function parapet(b: PartsBuilder, w: number, d: number, y: number, color: ColorName = 'creamDark', height = 1.0, t = 0.25): void {
  b.box(w, height, t, color, { z: -d / 2 + t / 2, y });
  b.box(w, height, t, color, { z: d / 2 - t / 2, y });
  b.box(t, height, d - 2 * t, color, { x: -w / 2 + t / 2, y });
  b.box(t, height, d - 2 * t, color, { x: w / 2 - t / 2, y });
}

/** Vertical storage tank: cylinder + dome cap. */
export function tank(b: PartsBuilder, r: number, h: number, x: number, z: number, color: ColorName = 'industryWhite', y = 0): void {
  b.cyl(r, h, color, { x, z, y }, 14);
  b.dome(r, color, { x, z, y: y + h }, 14);
}

/** Horizontal cylindrical tank on two saddle supports. */
export function horizontalTank(b: PartsBuilder, r: number, len: number, x: number, z: number, color: ColorName = 'industryWhite'): void {
  const g = new THREE.CylinderGeometry(r, r, len, 14);
  g.rotateZ(Math.PI / 2); // axis along X
  g.translate(0, r + 0.5, 0);
  b.custom(g, color, { x, z });
  for (const sx of [-len * 0.3, len * 0.3]) {
    b.box(0.6, 0.6, r * 1.6, 'concreteDark', { x: x + sx, z, y: 0 });
  }
}

/** Straight pipe between two points (any orientation). */
export function tube(b: PartsBuilder, from: THREE.Vector3Like, to: THREE.Vector3Like, r: number, color: ColorName = 'pipe', layer: Layer = 'opaque'): void {
  const a = new THREE.Vector3(from.x, from.y, from.z);
  const c = new THREE.Vector3(to.x, to.y, to.z);
  const dir = c.clone().sub(a);
  const len = dir.length();
  if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r, r, len, 8);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const m = new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(m);
  b.custom(g, color, { layer });
}

/** Square lattice mast (radio/power) of height h at (x, z). */
export function trussMast(b: PartsBuilder, h: number, x: number, z: number, half = 0.8, color: ColorName = 'steelDark'): void {
  const t = 0.09;
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
    // legs lean inward
    const topHalf = half * 0.25;
    tube(
      b,
      { x: x + sx * half, y: 0, z: z + sz * half },
      { x: x + sx * topHalf, y: h, z: z + sz * topHalf },
      t,
      color,
    );
  }
  const braces = 4;
  for (let i = 1; i <= braces; i++) {
    const y = (h * i) / (braces + 1);
    const s = half * (1 - 0.75 * (y / h));
    b.box(s * 2, 0.08, s * 2, color, { x, z, y });
  }
}

/** Rooftop air-handling unit: box + fan cylinder(s). */
export function ahuBox(b: PartsBuilder, rng: Rng, x: number, y: number, z: number): void {
  const w = rng.float(2.2, 4.5);
  const d = rng.float(1.6, 3);
  const h = rng.float(1.2, 2.2);
  b.box(w, h, d, rng.pick(['industryWhite', 'steel', 'concrete']), { x, y, z });
  const fans = rng.int(1, 2);
  for (let i = 0; i < fans; i++) {
    b.cyl(0.45, 0.25, 'steelDark', { x: x + (i - (fans - 1) / 2) * 1.2, y: y + h, z }, 10);
  }
}

/** Ground slab covering the whole footprint (w x d cells * 10 m), tiny lip above grade. */
export function groundSlab(b: PartsBuilder, wCells: number, dCells: number, color: ColorName, thickness = 0.12): void {
  b.box(wCells * 10 - 0.3, thickness, dCells * 10 - 0.3, color, { y: 0 });
}
