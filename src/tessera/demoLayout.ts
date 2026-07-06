/**
 * The bundled example Tessera — the app should always open on something
 * beautiful. Authored against real module ids; expanded as the catalog grows.
 */
import type { PlacedModule } from './Grid';

// Placeholder arrangement until the full catalog lands; replaced by the
// authored neighborhood in the demo-layout milestone.
export const DEMO_LAYOUT: PlacedModule[] = [
  { defId: 'apt-terrace', x: 10, z: 10, rot: 0, seed: 101 },
  { defId: 'apt-terrace', x: 14, z: 10, rot: 0, seed: 102 },
  { defId: 'apt-terrace', x: 10, z: 14, rot: 1, seed: 103 },
  { defId: 'apt-terrace', x: 20, z: 12, rot: 2, seed: 104 },
];
