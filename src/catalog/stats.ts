/**
 * Per-module economics used by the live Tessera Ledger. Sources:
 * docs/tessera-economics.md (2025-26 US cost structures). Energy in MW
 * average; capex in $M; compute in PFLOPS (FP8); food in tonnes/year.
 */
export interface ModuleStats {
  /** Capital cost, $M. */
  capexM: number;
  /** Permanent jobs to operate. */
  jobs?: number;
  /** Human dwelling units. */
  homes?: number;
  /** Civic housing capacity for embodied AI citizens. */
  aiHomes?: number;
  /** Average generation, MW. */
  genMW?: number;
  /** Average demand, MW. */
  useMW?: number;
  /** Local compute, PFLOPS FP8. */
  computePF?: number;
  /** Food output, t/yr. */
  foodT?: number;
}

export const STATS: Record<string, ModuleStats> = {
  // housing
  'apt-terrace': { capexM: 5.5, homes: 19, useMW: 0.021, genMW: 0.004 },
  'apt-court': { capexM: 19.5, homes: 69, useMW: 0.076, genMW: 0.004 },
  'apt-tower': { capexM: 6.5, homes: 22, useMW: 0.024, genMW: 0.001 },
  'agent-house': { capexM: 8, jobs: 4, aiHomes: 350, useMW: 0.13 },

  // civic
  plaza: { capexM: 3 },
  'market-row': { capexM: 0.4, jobs: 6 },
  clinic: { capexM: 4, jobs: 30, useMW: 0.05 },
  makerspace: { capexM: 3.5, jobs: 8, useMW: 0.08 },
  commons: { capexM: 2, jobs: 3 },
  school: { capexM: 30, jobs: 40, useMW: 0.1 },
  'fire-station': { capexM: 15, jobs: 30, useMW: 0.03 },
  natatorium: { capexM: 20, jobs: 8, useMW: 0.15 },
  venue: { capexM: 12, jobs: 20, useMW: 0.06 },
  grocery: { capexM: 3, jobs: 15, useMW: 0.08 },
  library: { capexM: 5, jobs: 6, useMW: 0.03 },

  // food
  greenhouse: { capexM: 0.4, jobs: 3, foodT: 25, useMW: 0.05 },
  'vertical-farm': { capexM: 5.4, jobs: 8, foodT: 140, useMW: 0.45 },
  aquaponics: { capexM: 1.5, jobs: 4, foodT: 18, useMW: 0.08 },
  orchard: { capexM: 0.05, jobs: 1, foodT: 1 },
  'ras-fishery': { capexM: 4, jobs: 6, foodT: 40, useMW: 0.15 },
  mycology: { capexM: 1.5, jobs: 4, foodT: 30, useMW: 0.05 },

  // energy
  'solar-canopy': { capexM: 0.12, genMW: 0.01 },
  'solar-field': { capexM: 0.3, genMW: 0.05 },
  'battery-yard': { capexM: 1.3 },
  substation: { capexM: 10, jobs: 2 },
  smr: { capexM: 2500, jobs: 70, genMW: 270 },

  // industry
  'chip-fab': { capexM: 2000, jobs: 350, useMW: 10 },
  'upw-plant': { capexM: 60, jobs: 10, useMW: 1 },
  'gas-farm': { capexM: 30, jobs: 6, useMW: 0.3 },
  'chem-storage': { capexM: 10, jobs: 4 },
  'cooling-towers': { capexM: 15, jobs: 2, useMW: 0.5 },
  wastewater: { capexM: 40, jobs: 8, useMW: 0.8 },
  'robotics-fab': { capexM: 200, jobs: 140, useMW: 1.5 },
  foundry: { capexM: 25, jobs: 18, useMW: 1.2 },

  // compute
  'data-center': { capexM: 160, jobs: 18, useMW: 5, computePF: 30000 },
  'comms-mast': { capexM: 2 },

  // logistics
  'logistics-hub': { capexM: 8, jobs: 25, useMW: 0.1 },
  'robot-depot': { capexM: 0.5, jobs: 2, useMW: 0.05 },
  'water-tower': { capexM: 6, jobs: 2, useMW: 0.1 },
  'transit-hub': { capexM: 35, jobs: 20, useMW: 0.15 },

  // landscape
  street: { capexM: 0.06 },
  park: { capexM: 0.12 },
  'tree-row': { capexM: 0.02 },
  bioswale: { capexM: 0.03 },
};

export interface LedgerTotals {
  capexM: number;
  jobs: number;
  homes: number;
  humans: number;
  laborForce: number;
  aiDomestic: number;
  aiCivic: number;
  genMW: number;
  useMW: number;
  computePF: number;
  foodT: number;
  /** Fraction of residents' fresh produce covered (1 = 100%). */
  foodCoverage: number;
}

export function computeLedger(defIds: string[]): LedgerTotals {
  const t: LedgerTotals = {
    capexM: 0,
    jobs: 0,
    homes: 0,
    humans: 0,
    laborForce: 0,
    aiDomestic: 0,
    aiCivic: 0,
    genMW: 0,
    useMW: 0,
    computePF: 0,
    foodT: 0,
    foodCoverage: 0,
  };
  for (const id of defIds) {
    const s = STATS[id];
    if (!s) continue;
    t.capexM += s.capexM;
    t.jobs += s.jobs ?? 0;
    t.homes += s.homes ?? 0;
    t.aiCivic += s.aiHomes ?? 0;
    t.genMW += s.genMW ?? 0;
    t.useMW += s.useMW ?? 0;
    t.computePF += s.computePF ?? 0;
    t.foodT += s.foodT ?? 0;
  }
  t.humans = Math.round(t.homes * 2.2);
  t.laborForce = Math.round(t.humans * 0.55);
  // one domestic embodiment alcove per dwelling unit
  t.aiDomestic = t.homes;
  // residents eat ~0.25 t of fresh produce per year
  t.foodCoverage = t.humans > 0 ? t.foodT / (t.humans * 0.25) : 0;
  return t;
}
