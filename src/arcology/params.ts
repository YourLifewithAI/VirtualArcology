/**
 * Parametric arcology definition. Defaults reconciled from the creator's
 * briefing and the lifewithai.ai Arcology Knowledge Node (see
 * docs/world-parameters.md). Two canon presets surface the spire question:
 * the Knowledge Node describes a modest 24 m crown over a 1,500 m plateau,
 * the briefing an iconic spire tower reaching 5,000 ft.
 */

export type ProgramKind = 'industrial' | 'mixed' | 'residential' | 'agriculture' | 'compute';

export interface ArcologyParams {
  /** Side length of the square base, meters (3.5 mi = 5,633 m). */
  baseSide: number;
  tiers: number;
  /** Setback per side per tier, meters. */
  setback: number;
  tierHeight: number;
  /** Height of the spire/crown above the top plateau. */
  spireHeight: number;
  spireBaseSide: number;
  spireTopSide: number;
  floorHeight: number;
  subLevels: number;
  subLevelHeight: number;
  /** Program per tier, bottom to top (padded/truncated to `tiers`). */
  program: ProgramKind[];
  elevators: {
    multiLoops: number;
    expressShafts: number;
    localPerTier: number;
    freightShafts: number;
    evacShafts: number;
  };
}

export const PROGRAM_DEFAULT: ProgramKind[] = [
  'industrial',
  'industrial',
  'industrial',
  'residential',
  'residential',
  'mixed',
  'residential',
  'agriculture',
  'agriculture',
  'agriculture',
];

const COMMON = {
  baseSide: 5633,
  tiers: 10,
  setback: 167.6,
  subLevels: 30,
  subLevelHeight: 4.88,
  program: PROGRAM_DEFAULT,
  elevators: { multiLoops: 8, expressShafts: 4, localPerTier: 6, freightShafts: 2, evacShafts: 2 },
};

export const PRESETS = {
  /** Knowledge Node: 10 x 150 m tiers to a 1,500 m plateau + 24 m crown. */
  'knowledge-node': {
    ...COMMON,
    tierHeight: 150,
    floorHeight: 4.17,
    spireHeight: 24,
    spireBaseSide: 420,
    spireTopSide: 380,
  },
  /** Briefing: 10 x 122 m tiers + 304 m spire tower = 1,524 m. */
  briefing: {
    ...COMMON,
    tierHeight: 122,
    floorHeight: 4.2,
    spireHeight: 304,
    spireBaseSide: 300,
    spireTopSide: 120,
  },
} satisfies Record<string, ArcologyParams>;

export type PresetName = keyof typeof PRESETS;

export function defaultParams(): ArcologyParams {
  return structuredClone(PRESETS['knowledge-node']);
}

export function applyPreset(params: ArcologyParams, preset: PresetName): void {
  Object.assign(params, structuredClone(PRESETS[preset]));
}

/** Side length of tier i (0-based); returns 0 when the ziggurat has closed. */
export function tierSide(p: ArcologyParams, i: number): number {
  return Math.max(0, p.baseSide - 2 * i * p.setback);
}

export function plateauHeight(p: ArcologyParams): number {
  return p.tiers * p.tierHeight;
}

export const PROGRAM_COLORS: Record<ProgramKind, number> = {
  industrial: 0x8d8b86,
  residential: 0xe4d7bd,
  mixed: 0xc9b291,
  agriculture: 0x7fa869,
  compute: 0x5a7fb5,
};

export const PROGRAM_LABELS: Record<ProgramKind, string> = {
  industrial: 'Industrial / logistics',
  residential: 'Residential',
  mixed: 'Mixed use',
  agriculture: 'Agriculture',
  compute: 'Compute',
};
