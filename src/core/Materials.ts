/**
 * Shared material cache. The whole app renders with a handful of materials;
 * per-part color comes from vertex colors baked by geo.ts.
 */
import * as THREE from 'three';

function makeOpaque(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.85,
    metalness: 0.05,
  });
}

function makeGlass(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    roughness: 0.15,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function makeEmissive(): THREE.MeshBasicMaterial {
  // MeshBasicMaterial ignores lights => reads as self-illuminated.
  return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
}

export const MATERIALS = {
  opaque: makeOpaque(),
  glass: makeGlass(),
  emissive: makeEmissive(),

  ghostValid: new THREE.MeshBasicMaterial({
    color: 0x4fdc7c,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  }),
  ghostInvalid: new THREE.MeshBasicMaterial({
    color: 0xe0523e,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  }),

  /** Ghosted massing for the arcology x-ray view. */
  xray: new THREE.MeshBasicMaterial({
    color: 0x9fc5e8,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
} as const;

export type ModuleMaterials = Pick<typeof MATERIALS, 'opaque' | 'glass' | 'emissive'>;
