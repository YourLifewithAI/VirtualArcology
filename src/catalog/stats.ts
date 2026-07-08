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
  /** Compute demand, PFLOPS FP8 (AI-power-user residents: ~2.5 PF per household/agent). */
  computeUsePF?: number;
  /** Potable water demand, m3/day (negative = supply/treatment capacity). */
  waterM3d?: number;
  /** Wastewater sent to treatment, m3/day (negative = treatment capacity). */
  sewerM3d?: number;
  /** Food output, t/yr. */
  foodT?: number;
  /** Passenger transit capacity, trips/day (AV depots, transit hub). */
  tripsDay?: number;
  /** Delivery capacity, parcels/day (robot depots, logistics hub). */
  parcelsDay?: number;
}

// ---- economics assumptions (documented in docs/tessera-economics.md) -------
/** Wholesale power price, $/MWh (ERCOT-ish long-run average). */
export const ENERGY_PRICE_MWH = 35;
/** Wholesale compute price, $/PFLOP-hour FP8 (bulk inference capacity). */
export const COMPUTE_PRICE_PF_HR = 1.0;
/** Motorized trips per resident per day (most trips inside a Tessera are walked). */
export const TRIPS_PER_RESIDENT = 1.6;
/** Parcel deliveries per resident per day. */
export const PARCELS_PER_RESIDENT = 0.9;
/** Fresh produce consumption, t/resident/yr. */
export const PRODUCE_T_PER_RESIDENT = 0.25;
/** Average household size. */
export const RESIDENTS_PER_HOME = 2.2;
/** Labor-force participation. */
export const LABOR_PARTICIPATION = 0.55;

export const STATS: Record<string, ModuleStats> = {
  // housing
  'apt-terrace': { capexM: 5.5, homes: 19, useMW: 0.021, genMW: 0.004, computeUsePF: 48, waterM3d: 8.4, sewerM3d: 7.5 },
  'apt-court': { capexM: 19.5, homes: 69, useMW: 0.076, genMW: 0.004, computeUsePF: 173, waterM3d: 30, sewerM3d: 27 },
  'apt-tower': { capexM: 6.5, homes: 22, useMW: 0.024, genMW: 0.001, computeUsePF: 55, waterM3d: 9.7, sewerM3d: 8.7 },
  'agent-house': { capexM: 8, jobs: 4, aiHomes: 350, useMW: 0.13, computeUsePF: 875, waterM3d: 5, sewerM3d: 4 },

  // civic
  plaza: { capexM: 3, waterM3d: 3, sewerM3d: 1 },
  'market-row': { capexM: 0.4, jobs: 6, waterM3d: 2, sewerM3d: 1.8 },
  clinic: { capexM: 4, jobs: 30, useMW: 0.05, computeUsePF: 15, waterM3d: 15, sewerM3d: 14 },
  makerspace: { capexM: 3.5, jobs: 8, useMW: 0.08, computeUsePF: 12, waterM3d: 4, sewerM3d: 3.5 },
  commons: { capexM: 2, jobs: 3, computeUsePF: 5, waterM3d: 3, sewerM3d: 2.7 },
  school: { capexM: 30, jobs: 40, useMW: 0.1, computeUsePF: 20, waterM3d: 10, sewerM3d: 9 },
  'fire-station': { capexM: 15, jobs: 30, useMW: 0.03, computeUsePF: 5, waterM3d: 6, sewerM3d: 5 },
  natatorium: { capexM: 20, jobs: 8, useMW: 0.15, waterM3d: 60, sewerM3d: 45 },
  venue: { capexM: 12, jobs: 20, useMW: 0.06, waterM3d: 8, sewerM3d: 7 },
  grocery: { capexM: 3, jobs: 15, useMW: 0.08, computeUsePF: 4, waterM3d: 5, sewerM3d: 4.5 },
  library: { capexM: 5, jobs: 6, useMW: 0.03, computeUsePF: 10, waterM3d: 2, sewerM3d: 1.8 },

  // food
  greenhouse: { capexM: 0.4, jobs: 3, foodT: 25, useMW: 0.05, waterM3d: 15, sewerM3d: 2 },
  'vertical-farm': { capexM: 5.4, jobs: 8, foodT: 140, useMW: 0.45, computeUsePF: 8, waterM3d: 12, sewerM3d: 2 },
  aquaponics: { capexM: 1.5, jobs: 4, foodT: 18, useMW: 0.08, waterM3d: 20, sewerM3d: 4 },
  orchard: { capexM: 0.05, jobs: 1, foodT: 1, waterM3d: 4 },
  'ras-fishery': { capexM: 4, jobs: 6, foodT: 40, useMW: 0.15, computeUsePF: 5, waterM3d: 45, sewerM3d: 10 },
  mycology: { capexM: 1.5, jobs: 4, foodT: 30, useMW: 0.05, waterM3d: 8, sewerM3d: 5 },

  // energy
  'solar-canopy': { capexM: 0.12, genMW: 0.01 },
  'solar-field': { capexM: 0.3, genMW: 0.05 },
  'battery-yard': { capexM: 1.3 },
  substation: { capexM: 10, jobs: 2, computeUsePF: 2, waterM3d: 1, sewerM3d: 0.5 },
  smr: { capexM: 2500, jobs: 70, genMW: 270, computeUsePF: 30, waterM3d: 500, sewerM3d: 50 },

  // industry
  'chip-fab': { capexM: 2000, jobs: 350, useMW: 10, computeUsePF: 150, waterM3d: 900, sewerM3d: 700 },
  'upw-plant': { capexM: 60, jobs: 10, useMW: 1, computeUsePF: 5, waterM3d: 100, sewerM3d: 80 },
  'gas-farm': { capexM: 30, jobs: 6, useMW: 0.3, waterM3d: 10, sewerM3d: 8 },
  'chem-storage': { capexM: 10, jobs: 4, waterM3d: 2, sewerM3d: 1 },
  'cooling-towers': { capexM: 15, jobs: 2, useMW: 0.5, waterM3d: 300, sewerM3d: 60 },
  wastewater: { capexM: 40, jobs: 8, useMW: 0.8, computeUsePF: 3, waterM3d: 5, sewerM3d: -1500 },
  'robotics-fab': { capexM: 200, jobs: 140, useMW: 1.5, computeUsePF: 200, waterM3d: 60, sewerM3d: 50 },
  foundry: { capexM: 25, jobs: 18, useMW: 1.2, computeUsePF: 15, waterM3d: 40, sewerM3d: 30 },

  // compute
  'data-center': { capexM: 160, jobs: 18, useMW: 5, computePF: 30000, computeUsePF: 0, waterM3d: 60, sewerM3d: 20 },
  'comms-mast': { capexM: 2, useMW: 0.02 },

  // logistics & transit
  'logistics-hub': { capexM: 8, jobs: 25, useMW: 0.1, computeUsePF: 10, waterM3d: 8, sewerM3d: 7, parcelsDay: 4000 },
  'robot-depot': { capexM: 0.5, jobs: 2, useMW: 0.05, waterM3d: 1, sewerM3d: 0.8, parcelsDay: 1500 },
  'av-depot': { capexM: 4, jobs: 3, useMW: 0.35, computeUsePF: 5, waterM3d: 1.5, sewerM3d: 1.2, tripsDay: 1800 },
  'water-tower': { capexM: 6, jobs: 2, useMW: 0.1, waterM3d: -1200, sewerM3d: 1 },
  'transit-hub': { capexM: 35, jobs: 20, useMW: 0.15, computeUsePF: 8, waterM3d: 10, sewerM3d: 9, tripsDay: 6000 },

  // landscape
  street: { capexM: 0.06 },
  park: { capexM: 0.12, waterM3d: 3 },
  'tree-row': { capexM: 0.02 },
  bioswale: { capexM: 0.03, sewerM3d: -5 },
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
  computeUsePF: number;
  /** Positive demand, m3/day. */
  waterUseM3d: number;
  /** Supply capacity, m3/day. */
  waterCapM3d: number;
  sewerUseM3d: number;
  sewerCapM3d: number;
  foodT: number;
  /** Fraction of residents' fresh produce covered (1 = 100%). */
  foodCoverage: number;
  /** Passenger transit capacity vs demand, trips/day. */
  tripsCap: number;
  tripsDemand: number;
  /** Delivery capacity vs demand, parcels/day. */
  parcelsCap: number;
  parcelsDemand: number;
  /** Income from exported surplus energy, $M/yr (0 if net importer). */
  energyExportMYr: number;
  /** Income from exported surplus compute, $M/yr (0 if in deficit). */
  computeExportMYr: number;
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
    computeUsePF: 0,
    waterUseM3d: 0,
    waterCapM3d: 0,
    sewerUseM3d: 0,
    sewerCapM3d: 0,
    foodT: 0,
    foodCoverage: 0,
    tripsCap: 0,
    tripsDemand: 0,
    parcelsCap: 0,
    parcelsDemand: 0,
    energyExportMYr: 0,
    computeExportMYr: 0,
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
    t.computeUsePF += s.computeUsePF ?? 0;
    t.foodT += s.foodT ?? 0;
    t.tripsCap += s.tripsDay ?? 0;
    t.parcelsCap += s.parcelsDay ?? 0;
    const w = s.waterM3d ?? 0;
    if (w >= 0) t.waterUseM3d += w;
    else t.waterCapM3d += -w;
    const sw = s.sewerM3d ?? 0;
    if (sw >= 0) t.sewerUseM3d += sw;
    else t.sewerCapM3d += -sw;
  }
  t.humans = Math.round(t.homes * RESIDENTS_PER_HOME);
  t.laborForce = Math.round(t.humans * LABOR_PARTICIPATION);
  // one domestic embodiment alcove per dwelling unit
  t.aiDomestic = t.homes;
  t.foodCoverage = t.humans > 0 ? t.foodT / (t.humans * PRODUCE_T_PER_RESIDENT) : 0;
  t.tripsDemand = Math.round(t.humans * TRIPS_PER_RESIDENT);
  t.parcelsDemand = Math.round(t.humans * PARCELS_PER_RESIDENT);
  t.energyExportMYr = (Math.max(0, t.genMW - t.useMW) * 8760 * ENERGY_PRICE_MWH) / 1e6;
  t.computeExportMYr = (Math.max(0, t.computePF - t.computeUsePF) * COMPUTE_PRICE_PF_HR * 8760) / 1e6;
  return t;
}
