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
  restaurant: {
    purpose:
      'Three open kitchens under alternating awnings, terrace tables spilling onto the street, and a menu board that changes with whatever the vertical farms picked this morning.',
    contributes:
      'Where the food web becomes dinner. Produce arrives by robot from the farms and fishery a few blocks over; meal runs head out the other way. Restaurants are infrastructure — a neighborhood that only cooks at home is a neighborhood without a living room.',
  },
  'av-depot': {
    purpose:
      'A charging plaza for six-seater autonomous shuttles: glowing bays under a solar canopy, a small ops kiosk, and pods pulling in and out all day.',
    contributes:
      'Mass transit, planted early. A Tessera can walk everywhere; an arcology cannot — so the shuttle network is designed in from the ground up, growing depot by depot until it hands off to the vertical transport spine. Shuttles only run where streets actually connect.',
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
      'A shared surface: robot lane down the middle, walkway curbs at the edges, photovoltaic pavement in the quadrants — no cars in sight.',
    contributes:
      'The Tessera’s circulatory system — and the robots’ route map. Because the heaviest regular load is a delivery robot, the surface doubles as solar capture (~2 kW average per tile; France’s Wattway proved the concept, and a road that never carries trucks fixes its durability problem). Heavy construction traffic uses the reinforced curb edges.',
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

  // ---- phase 2 additions ----
  'agent-house': {
    purpose:
      'Civic housing for embodied AI citizens: rest and charging bays below, a warm commons above where citizens and humans actually meet, a chassis library, and a memory-vault spine.',
    contributes:
      'Roughly 40% of the Tessera\u2019s AI citizens live civically rather than domestically \u2014 this is their address. Their minds run in the data hall (~0.2\u20131.8 kW each); their bodies charge here on the SMR\u2019s night surplus. Equal population, equal streets.',
  },
  school: {
    purpose:
      'K-8 classrooms around a play court, with a gym, garden-lab beds, and half its curriculum outsourced to the Forge, the farms, and the fab tours.',
    contributes:
      'A 5,000-person Tessera has ~800 school-age kids \u2014 education was the biggest gap in Phase 1. High school is shared between neighboring tesserae; the arcology scales this to schools every few floors of every residential tier.',
  },
  'fire-station': {
    purpose:
      'Fire, EMS, and community safety under one roof: two apparatus bays, crew quarters, a drill tower, and an EMS pad.',
    contributes:
      'One station covers the 560 m site with sub-4-minute response. The fab and SMR bring their own regulated hazmat teams; this house covers everyone else. The arcology\u2019s version is a station per tier plus hardened refuge floors.',
  },
  natatorium: {
    purpose:
      'An indoor lap pool under a glass vault plus an outdoor pool, splash pad, and shade sails \u2014 because this is Texas.',
    contributes:
      'The social condenser of summer. Pre-heated by data-center waste heat that would otherwise be dumped \u2014 the smallest, most pleasant piece of the district thermal loop the arcology runs at gigawatt scale.',
  },
  venue: {
    purpose:
      'An amphitheater bowl facing a stage canopy, with a food-hall row of four kitchens and a picnic lawn \u2014 music nights, town assemblies, and whoever\u2019s cooking.',
    contributes:
      'Culture is infrastructure: the no-dead-cells rule says unprogrammed land becomes green space or art. The arcology inherits this as tier amphitheaters at the sky lobbies.',
  },
  grocery: {
    purpose:
      'The staples anchor: a co-op market hall for everything the greenhouses don\u2019t grow \u2014 grains, oils, coffee \u2014 with a loading nook fed from the logistics hub.',
    contributes:
      'Market rows sell the Tessera\u2019s own produce; the co-op closes the rest of the pantry. Its import manifest is an honest ledger of what the Tessera doesn\u2019t yet make.',
  },
  library: {
    purpose:
      'A reading hall under a glowing lantern clerestory: books, terminals, tutoring corners, and the public face of the data center next door.',
    contributes:
      'Every citizen \u2014 human or AI \u2014 gets a library card to the local cloud. The arcology\u2019s knowledge commons is this room repeated up ten tiers, backed by the same racks.',
  },
  'ras-fishery': {
    purpose:
      'High-intensity recirculating aquaculture: fish protein at scale, with the effluent mineralized into nutrient dosing for the vertical farms.',
    contributes:
      'Closes the nitrogen loop the aquaponics halls prototype: fish waste becomes tower fertilizer, displacing most imported nutrients. Protein self-sufficiency is the hardest food problem \u2014 this is the Tessera\u2019s wedge into it.',
  },
  mycology: {
    purpose:
      'Quonset fruiting rooms and substrate bunkers where the Tessera\u2019s organic waste \u2014 spent grow media, food scraps, timber offcuts \u2014 becomes mushrooms, mycelium materials, and compost.',
    contributes:
      'The missing decomposer trophic layer. Its outputs feed the market, the Forge (mycelium packaging and insulation), and the orchards\u2019 soil. The arcology\u2019s waste-to-energy plants get whatever the fungi refuse.',
  },
  foundry: {
    purpose:
      'An induction micro-foundry and e-waste recovery line: dead robots, boards, and scrap remelted into ingots and printer feedstock for the robotics fab and the Forge.',
    contributes:
      'Closes the metals loop \u2014 copper, aluminum, steel, and board-level precious metals stay in the neighborhood. Semiconductor-grade silicon honestly remains an import; the Tessera recycles everything it can and says so.',
  },
  'transit-hub': {
    purpose:
      'The Tessera\u2019s door to the region: a rail platform on the freight corridor, intercity bus bays, and the handoff to bikes, pods, and delivery robots.',
    contributes:
      'No cars inside doesn\u2019t mean isolation \u2014 it means the periphery works harder. Materials arrive by rail (the fab and SMR were built off this siding), people arrive by train and bus, and everything past the platform moves at neighborhood speed.',
  },
};

export const LORE_FALLBACK: ModuleLore = {
  purpose: 'A building of the Tessera.',
  contributes: 'Part of the modular path toward Arcology One.',
};
