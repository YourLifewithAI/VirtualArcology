/**
 * Where the numbers come from. Every assumption in stats.ts traces to a
 * public reference (or is flagged as a worldbuilding assumption). The ledger
 * renders these as clickable citation chips under each expanded row.
 */
export interface SourceRef {
  /** Short label shown on the chip. */
  label: string;
  publisher: string;
  url: string;
  /** What it supports, and how the Tessera adapts it. */
  note: string;
  /** True = deliberate worldbuilding assumption, not an external fact. */
  speculative?: boolean;
}

export const SOURCES: Record<string, SourceRef> = {
  'census-household': {
    label: 'Census ACS',
    publisher: 'U.S. Census Bureau, American Community Survey',
    url: 'https://www.census.gov/programs-surveys/acs',
    note: 'US average household size ≈ 2.5 people. The Tessera assumes 2.2 — its housing mix skews toward smaller urban units.',
  },
  'bls-epop': {
    label: 'BLS E-Pop',
    publisher: 'U.S. Bureau of Labor Statistics',
    url: 'https://www.bls.gov/charts/employment-situation/employment-population-ratio.htm',
    note: 'US employment–population ratio ≈ 60%. The Tessera uses 55% of all residents as available workforce (more children, students, retirees in a family-oriented neighborhood).',
  },
  'eia-wholesale': {
    label: 'EIA wholesale',
    publisher: 'U.S. Energy Information Administration',
    url: 'https://www.eia.gov/electricity/wholesale/',
    note: 'Wholesale electricity prices at major US hubs have averaged roughly $30–50/MWh; $35/MWh is a conservative long-run ERCOT-style figure for exported surplus.',
  },
  'eia-rec': {
    label: 'EIA RECS',
    publisher: 'U.S. EIA Residential Energy Consumption Survey',
    url: 'https://www.eia.gov/consumption/residential/',
    note: 'US homes average ~10,500 kWh/yr ≈ 1.2 kW. Tessera units run ~1.1 kW average (efficient all-electric mid-rise), before rooftop solar offsets.',
  },
  'epa-watersense': {
    label: 'EPA WaterSense',
    publisher: 'U.S. Environmental Protection Agency',
    url: 'https://www.epa.gov/watersense/statistics-and-facts',
    note: 'Average US indoor use ≈ 300 L/household/day; efficient fixtures cut ~20%. Tessera housing budgets ≈ 200 L/resident/day total, ~0.44 m³/day per unit.',
  },
  'tsmc-water': {
    label: 'TSMC ESG',
    publisher: 'TSMC Sustainability Report',
    url: 'https://esg.tsmc.com/en-US/resources/reports',
    note: 'Leading-edge giga-fabs draw tens of thousands of m³/day and reclaim 85%+. The Tessera boutique fab is scaled to 900 m³/day with on-site UPW and reclaim — the design pressure the water ledger shows honestly.',
  },
  'nuscale-smr': {
    label: 'NuScale/IAEA SMR',
    publisher: 'NuScale Power · IAEA SMR database',
    url: 'https://aris.iaea.org/sites/SMR.html',
    note: 'Small modular reactors ship in 60–300+ MWe blocks (NuScale 77 MWe/module, 4–12 module plants). The 270 MW block matches a mid-size multi-module plant.',
  },
  'nrel-pv': {
    label: 'NREL PV',
    publisher: 'National Renewable Energy Laboratory',
    url: 'https://www.nrel.gov/research/re-photovoltaics.html',
    note: 'Utility PV in Texas runs ~20–25% capacity factor at ~200 W/m² module density — the basis for solar field/canopy/rooftop averages.',
  },
  wattway: {
    label: 'Wattway pilots',
    publisher: 'Colas Wattway (France)',
    url: 'https://www.wattwaybycolas.com/en/',
    note: 'Road-surface PV is proven but yields ~50–70% of rooftop (flat angle, soiling, shading) and historically struggled under truck loads. Tessera streets carry robots, not trucks — ~2 kW average per 100 m² tile at 55% of rooftop yield.',
  },
  'nvidia-h100': {
    label: 'NVIDIA H100',
    publisher: 'NVIDIA datasheets',
    url: 'https://www.nvidia.com/en-us/data-center/h100/',
    note: 'One H100 ≈ 4 PFLOPS FP8; ~30 EFLOPS ≈ 7,500 GPUs ≈ a mid-size AI hall at ~5 MW IT load.',
  },
  'gpu-cloud': {
    label: 'GPU cloud pricing',
    publisher: 'Public GPU cloud price lists (Lambda, RunPod, Vast)',
    url: 'https://lambdalabs.com/service/gpu-cloud',
    note: 'H100 rentals cluster around $2–3/GPU·h ≈ $0.5–0.8/PFLOP·h FP8; $1/PF·h is a round wholesale figure for bulk capacity contracts.',
  },
  'usda-produce': {
    label: 'USDA ERS',
    publisher: 'USDA Economic Research Service, Food Availability',
    url: 'https://www.ers.usda.gov/data-products/food-availability-per-capita-data-system/',
    note: 'US per-capita fruit + vegetable availability ≈ 250–270 kg/yr. The 0.25 t/resident/yr need covers fresh produce; grains and oils stay regional imports by design.',
  },
  'usda-cea': {
    label: 'USDA CEA',
    publisher: 'USDA controlled-environment agriculture research',
    url: 'https://www.ams.usda.gov/services/local-regional/food-sector/controlled-environment-agriculture',
    note: 'Commercial vertical farms report 50–100× field yield per footprint; a 20×20 m multi-layer tower at ~140 t/yr of greens is mid-range for the sector.',
  },
  'fhwa-nhts': {
    label: 'FHWA NHTS',
    publisher: 'Federal Highway Administration, National Household Travel Survey',
    url: 'https://nhts.ornl.gov/',
    note: 'Americans average ~3.4 trips/person/day, most by car. In a 5-minute walkable neighborhood most trips are on foot — 1.6 motorized trips/resident/day covers regional travel and mobility needs.',
  },
  'pitney-parcel': {
    label: 'Parcel Index',
    publisher: 'Pitney Bowes Parcel Shipping Index',
    url: 'https://www.pitneybowes.com/us/shipping-index.html',
    note: 'US parcel volume ≈ 60–70/person/yr (~0.18/day) and climbing. The Tessera assumes 0.9/resident/day: robot delivery absorbs grocery runs, meals, and library/tool-share loans.',
    speculative: true,
  },
  'ai-power-user': {
    label: 'Worldbuilding',
    publisher: 'Life with AI — Arcology Knowledge Node',
    url: 'https://lifewithai.ai',
    note: 'Worldbuilding assumption: every household and embodied AI citizen is a frontier "power user" at ~2.5 PFLOPS FP8 continuous (≈1 dedicated GPU). Full derivation in docs/tessera-economics.md.',
    speculative: true,
  },
  'construction-cost': {
    label: 'RSMeans/CBRE',
    publisher: 'RSMeans construction cost data · CBRE market reports',
    url: 'https://www.rsmeans.com/',
    note: 'US mid-rise multifamily ≈ $200–350/sq ft; institutional and industrial per-building figures in stats.ts follow 2025-26 US cost structures (see docs/tessera-economics.md §1).',
  },
  'water-reuse': {
    label: 'EPA Water Reuse',
    publisher: 'U.S. EPA Water Reuse Action Plan',
    url: 'https://www.epa.gov/waterreuse',
    note: 'Municipal wastewater treatment and reuse capacity figures; bioswales follow EPA green-infrastructure guidance for distributed runoff treatment.',
  },
};

/** Which sources back each ledger row (keys must match LedgerPanel row labels). */
export const ROW_SOURCES: Record<string, string[]> = {
  'Capital cost': ['construction-cost'],
  'Residents housed': ['census-household'],
  'Jobs to run it': ['bls-epop'],
  'AI citizens housed': ['ai-power-user'],
  'Energy demand': ['eia-rec', 'tsmc-water'],
  'Energy generation': ['nrel-pv', 'nuscale-smr', 'wattway'],
  'Energy export income': ['eia-wholesale'],
  'Local compute': ['nvidia-h100'],
  'Compute demand': ['ai-power-user'],
  'Compute export income': ['gpu-cloud'],
  Water: ['epa-watersense', 'tsmc-water', 'water-reuse'],
  Wastewater: ['water-reuse', 'epa-watersense'],
  'Transit capacity': ['fhwa-nhts'],
  'Delivery capacity': ['pitney-parcel'],
  'Fresh produce': ['usda-produce', 'usda-cea'],
};

/** Render citation chips for a ledger row (empty string if none). */
export function sourceChips(rowLabel: string): string {
  const keys = ROW_SOURCES[rowLabel];
  if (!keys?.length) return '';
  const chips = keys
    .map((k) => {
      const s = SOURCES[k];
      if (!s) return '';
      return `<a class="src${s.speculative ? ' spec' : ''}" href="${s.url}" target="_blank" rel="noopener" title="${s.publisher} — ${s.note.replace(/"/g, '&quot;')}">${s.speculative ? '◈ ' : ''}${s.label}</a>`;
    })
    .join('');
  return `<div class="bd-sources">${chips}</div>`;
}
