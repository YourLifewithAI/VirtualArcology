import type { Rng } from '../core/Rng';
import type { BuiltModule } from '../core/geo';

export const CATEGORIES = [
  'housing',
  'civic',
  'food',
  'energy',
  'industry',
  'compute',
  'logistics',
  'water',
  'landscape',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  housing: 'Housing',
  civic: 'Civic & Culture',
  food: 'Food Production',
  energy: 'Energy',
  industry: 'Industry & Fabs',
  compute: 'Compute',
  logistics: 'Logistics & Transit',
  water: 'Water & Treatment',
  landscape: 'Streets & Green',
};

export interface ModuleDef {
  id: string;
  name: string;
  category: Category;
  /** One-liner shown in the palette tooltip. */
  description: string;
  /** Footprint in grid cells (10 m each), before rotation. w = x, d = z. */
  footprint: { w: number; d: number };
  /** Approximate overall height in meters (camera framing + collision). */
  height: number;
  /** Player may walk within the footprint (plazas, parks, streets). */
  walkable?: boolean;
  /**
   * Build the module's geometry. Local origin: center of footprint, y=0 ground.
   * Must stay within the footprint horizontally. Use rng for all variation so
   * results are deterministic per placement seed.
   */
  build(rng: Rng): BuiltModule;
}
