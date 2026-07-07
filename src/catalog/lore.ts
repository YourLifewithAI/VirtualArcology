/**
 * Worldbuilding lore for the building inspector: what each module is for and
 * how it contributes to the Tessera — and, scaled up, to Arcology One.
 * Numbers reference docs/world-parameters.md (per-capita factors from the
 * Arcology Knowledge Node).
 */
export interface ModuleLore {
  /** What this building does day to day. */
  purpose: string;
  /** How it contributes to the Tessera and the road to the arcology. */
  contributes: string;
}

export const LORE: Record<string, ModuleLore> = {
  // ---- housing ----
  'apt-terrace': {
    purpose:
      'Four stories of mass-timber apartments over a shared entry. Green roof for stormwater and insulation, rooftop solar, and south balconies sized for morning coffee.',
    contributes:
      'The Tessera’s bread-and-butter home: ~40 households within a five-minute walk of the plaza. Its stacked-timber module is the same unit that, repeated 36 floors deep, fills an arcology tier’s residential band.',
  },
  'apt-court': {
    purpose:
      'A six-story perimeter block wrapped around a protected garden courtyard — play space, elders’ benches, and a rooftop greenhouse on one wing for the block’s salad greens.',
    contributes:
      'Courtyard blocks give the Tessera its social fabric: a semi-private commons for ~120 households. In Arcology One the same figure-of-a-courtyard becomes the light-well atria punched through every residential tier.',
  },
  'apt-tower': {
    purpose:
      'An eight-story mass-timber point tower with cantilevered terraces spiraling up its faces and a solar crown. The tallest thing a neighborhood street should ever need.',
    contributes:
      'Density where it counts — near transit and the plaza — without shading the greenhouses. It rehearses the vertical living the arcology takes to 1,500 m, one gentle step at a time.',
  },

  // ---- civic ----
  plaza: {
    purpose:
      'The Tessera’s living room: fountain, shade trees, benches, and enough open pavement for a market day, a film night, or two hundred people arguing pleasantly about zoning.',
    contributes:
      'Every Tessera is built around one. The knowledge node’s rule — green space within 30 m of every home, a gathering floor per neighborhood — starts here and becomes the sky-lobby parks at every arcology tier boundary.',
  },
  'market-row': {
    purpose:
      'Four covered stalls with festoon lights — produce from the greenhouse belt, fab-shop wares from the Forge, and whoever’s roasting coffee this month.',
    contributes:
      'Short food chains made visible: from grow-bed to stall in under 500 m. The arcology’s tier markets inherit this exact program, fed by ag-tier freight elevators instead of cargo bikes.',
  },
  clinic: {
    purpose:
      'The Wellness Collective & Community Clinic: primary care, urgent care, tele-specialists, and a community health worker who knows everyone’s name.',
    contributes:
      'One clinic per ~5,000 residents is the knowledge-node ratio — the Tessera hits it with one building. Arcology One scales the same ratio to clinics every ~75 floors and hospital hubs every ~150.',
  },
  makerspace: {
    purpose:
      'The Forge & Printworks: CNC, 3D printing farms, electronics benches, and a wood shop under sawtooth north-light. Where the Tessera repairs, prototypes, and teaches.',
    contributes:
      'Local fabrication closes the smallest loop — fix it here, don’t ship it twice. It’s also the training ground for the robotics fab next door: the arcology’s maintenance culture starts as a neighborhood hobby.',
  },
  commons: {
    purpose:
      'A timber community hall with a porch colonnade — assemblies, classes, weddings, town votes, and the long tables that make all four happen in one week.',
    contributes:
      'Institutional design is an engineering domain too: the Tessera governs itself here. The arcology’s tier councils are this room, replicated 10 times up the ziggurat.',
  },

  // ---- food ----
  greenhouse: {
    purpose:
      'Three connected glasshouses with warm grow-bed lighting and a header house for packing. Tomatoes in January without shipping them a continent.',
    contributes:
      'Part of the ~44 m² of farm area per resident the knowledge node budgets for 90% fresh-produce self-sufficiency. The arcology’s agriculture tiers are this building, unrolled across square kilometers of terrace.',
  },
  'vertical-farm': {
    purpose:
      'Eight stacked grow floors under magenta LED light — leafy greens, herbs, and berry walls on a fraction of the land, water-looped and robot-tended.',
    contributes:
      'The signature glow of the Tessera at dusk. Multi-layer farming is how the arcology feeds 10 M on-structure: its upper tiers run 450 MW of this exact lighting, day and night.',
  },
  aquaponics: {
    purpose:
      'A barrel-vaulted hall where fish tanks and plant rafts share one water loop — protein and produce from the same plumbing.',
    contributes:
      'Closes nitrogen and water loops at neighborhood scale, the miniature of the arcology’s 2 M m³/day water-recycling metabolism.',
  },
  orchard: {
    purpose:
      'A fenced plot of fruit trees with a ladder, crates, and beehives in the corner. Slow food — the trees outlast the mortgage.',
    contributes:
      'Orchards anchor the Tessera’s microclimate and its calendar (blossom week, harvest week). On the arcology’s terraces they become the vertical orchards ringing every setback.',
  },

  // ---- energy ----
  'solar-canopy': {
    purpose:
      'A shaded plaza structure whose roof is all panel — charge point below, generation above, benches in between.',
    contributes:
      'Dual-use surface is the whole energy philosophy: the arcology’s envelope is ~55% photovoltaic. Here it starts by shading a bench.',
  },
  'solar-field': {
    purpose:
      'Rows of tilted bifacial panels with an inverter cabinet — the Tessera’s daytime workhorse, ~1 MW-class on a neighborhood corner.',
    contributes:
      'With the battery yard, covers most of the Tessera’s ~4.75 MW draw (950 W per resident, knowledge-node figure). The arcology repeats the trick as agrivoltaics: panels over crops on every terrace.',
  },
  'battery-yard': {
    purpose:
      'Cabinet rows of LFP batteries that soak up solar noon and hand it back at dinner. Hazard-striped, teal-doored, quietly humming.',
    contributes:
      'Time-shifts the neighborhood’s energy so the grid tie stays thin. The arcology’s version is cavern-scale thermal storage — 50 GWh under the foundation — but the duty cycle is the same.',
  },
  substation: {
    purpose:
      'The Tessera’s grid interface: transformers, switchgear, and lattice masts stepping utility voltage down to street level.',
    contributes:
      'Every energy source in the Tessera meets here before it meets your kettle. Arcology One’s equivalent is a 1.5 GW ERCOT interconnect with a substation yard the size of this whole block.',
  },
  smr: {
    purpose:
      'A small modular reactor block — containment cylinder, turbine hall, switchyard. Firm, carbon-free baseload with a footprint smaller than the parking it replaces.',
    contributes:
      'Deliberately arcology-scale kit: one 300 MWe module could power sixty Tesserae. The full build needs seventeen of them, sited in fenced campuses outside the base — never inside the superstructure.',
  },

  // ---- industry ----
  'chip-fab': {
    purpose:
      'A windowless cleanroom block crowned with air handlers — the Tessera’s semiconductor line, turning wafers into the chips its robots, farms, and clinics run on.',
    contributes:
      'The anchor of the industrial quarter and the reason the support chain exists: ultrapure water, gases, chemicals, cooling, wastewater. Compute independence at neighborhood scale is the rehearsal for the arcology’s 1.9 M-GPU sub-level halls.',
  },
  'upw-plant': {
    purpose:
      'RO and deionization trains polishing city water to ultrapure — 18 MΩ·cm, cleaner than anything you’d drink — piped by bridge straight into the fab.',
    contributes:
      'Chipmaking is mostly water engineering. This plant is the fab’s first dependency and the clearest lesson the Tessera teaches: every gleaming machine stands on unglamorous plumbing.',
  },
  'gas-farm': {
    purpose:
      'Cryogenic nitrogen, specialty gases in tube trailers, vaporizer fins frosting on humid mornings — the fab’s atmosphere, bottled.',
    contributes:
      'Second link in the fab chain. The arcology moves the same gases through 30 vertical pressure zones; here you can walk past the tanks and count them.',
  },
  'chem-storage': {
    purpose:
      'A bermed, placarded pad for the fab’s acids, solvents, and slurries — drums and IBC totes under canopy, spill containment built into the floor.',
    contributes:
      'Honest infrastructure: the Tessera keeps its hazards visible, contained, and close to their point of use instead of trucking them through someone else’s neighborhood.',
  },
  'cooling-towers': {
    purpose:
      'Three flared towers rejecting the fab’s process heat, plumes drifting on cold mornings.',
    contributes:
      'Interim tech, and labeled as such: the arcology rejects almost nothing, feeding 55°C waste heat into a district loop for homes and greenhouses. The Tessera’s next retrofit does the same.',
  },
  wastewater: {
    purpose:
      'Clarifiers with slow-turning bridge arms, an aeration basin, and a digester dome — the neighborhood’s water, cleaned in public view.',
    contributes:
      'Handles ~1,000 m³/day for a 5,000-person Tessera (200 L per person, knowledge-node figure). The digester’s biogas is a down payment on the arcology’s 600 MWt waste-to-energy plants.',
  },
  'robotics-fab': {
    purpose:
      'A sawtooth factory assembling the Tessera’s working machines — delivery robots, farm tenders, maintenance crawlers — with a test yard and gantry crane out front.',
    contributes:
      'Robots building the tools that build the next Tessera: this is the stepwise path in one building. Arcology construction assumes 500–1,000 concurrent robotic work fronts; the production line starts here.',
  },

  // ---- compute ----
  'data-center': {
    purpose:
      'A charcoal hall of liquid-cooled racks behind louver bands — the Tessera’s local cloud: models, digital twins, and the robots’ shared memory.',
    contributes:
      'Compute is a utility here, like water. The arcology allocates 65% of its 9.5 GW to exactly this — sub-level halls of 26,800 racks — and its waste heat warms the towers above.',
  },
  'comms-mast': {
    purpose:
      'The neighborhood’s antenna: backhaul dishes, mesh radios, and a red beacon that doubles as the Tessera’s night landmark.',
    contributes:
      'Keeps the Tessera one hop from its neighbors and its AIs never more than milliseconds from home. The arcology’s spire is this mast grown to 1,524 m.',
  },

  // ---- logistics ----
  'logistics-hub': {
    purpose:
      'Dock doors, cargo pods, and a micro-mobility rack — where regional freight breaks down into robot-sized deliveries.',
    contributes:
      'The seam between the Tessera and the wider world. In the arcology this program rides freight elevators and 500 mm pneumatic tubes; here it rides teal-striped pods.',
  },
  'robot-depot': {
    purpose:
      'An open shed with glowing charging bays where the delivery fleet rests, swaps batteries, and gets its wheels tightened.',
    contributes:
      'Home base for the robots threading the street lattice. Watch the streets: everything they carry, a resident didn’t have to drive.',
  },
  'water-tower': {
    purpose:
      'An elevated tank and treatment shed keeping the Tessera’s taps pressurized — gravity as the cheapest battery there is.',
    contributes:
      'Stores the knowledge node’s 7-day reserve (1.4 m³ per resident). The arcology distributes the same idea vertically: tank floors every ~50 m of rise, thirty pressure zones deep.',
  },

  // ---- landscape ----
  street: {
    purpose:
      'A shared surface: robot lane down the middle, walkway curbs at the edges, no cars in sight.',
    contributes:
      'The Tessera’s circulatory system — and the robots’ route map. Lay more of these and the delivery fleet finds them on its own.',
  },
  park: {
    purpose:
      'Lawn, shade trees, a pond the herons found in week two, and benches placed where the afternoon light lands.',
    contributes:
      'Part of the 9 m² of green per resident the knowledge node holds sacred. The arcology keeps the same ratio a kilometer in the air — park atria every 30 m of height.',
  },
  'tree-row': {
    purpose:
      'Street trees in soil beds with a planter strip — shade, birdsong, and a 4°C cooler sidewalk in August.',
    contributes:
      'The cheapest climate infrastructure ever invented. The arcology plants half a million of these across its terraces; the Tessera starts with two per cell.',
  },
  bioswale: {
    purpose:
      'A sunken channel of reeds and stormwater doing its slow work, with a footbridge for the humans.',
    contributes:
      'Rain is routed, cleaned, and soaked — not piped away. It’s the ground-level version of the arcology’s closed water loop, and the frogs approve.',
  },
};

export const LORE_FALLBACK: ModuleLore = {
  purpose: 'A building of the Tessera.',
  contributes: 'Part of the modular path toward Arcology One.',
};
