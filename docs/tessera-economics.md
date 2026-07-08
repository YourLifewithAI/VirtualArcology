# Tessera Economics & Systems Analysis — Demo Layout v1

All figures use **2025–26 US cost structures** and the exact building inventory of the bundled demo layout. Ranges reflect honest uncertainty; single numbers are midpoints. Population figures derive from the actual modeled floor area, not the aspirational 5,000.

## 1. Inventory (as placed in the demo)

| Category | Buildings |
|---|---|
| Housing | 22× Terrace Apartments, 6× Garden Court Block, 4× Mass-Timber Tower |
| Civic | 1× Plaza, 3× Market Row, 1× Clinic, 1× Forge & Printworks, 2× Community Hall |
| Food | 3× Greenhouse Range, 5× Vertical Farm, 2× Aquaponics, 8× Orchard |
| Energy | 4× Solar Canopy, 2× Solar Field, 2× Battery Yard, 1× Substation, 1× SMR (300 MWe) |
| Industry | Chip fab + UPW + gas farm + chem storage + cooling towers + wastewater, 1× Robotics Fab |
| Compute | 1× Data Center Hall (60×40 m), 1× Comms Mast |
| Logistics | 1× Logistics Hub, 2× Robot Depot, 1× Water Tower |
| Landscape | 284 street tiles, 9 parks, 17 tree rows, 10 bioswales |

## 2. Population: the demo houses ~2,000, not 5,000

Computed from modeled gross floor area (80% net efficiency, 75 m² average unit, 2.2 persons/unit):

| Type | GFA each | Units each | Count | Units | Residents |
|---|---|---|---|---|---|
| Terrace Apartments | 1,824 m² | ~19 | 22 | ~420 | ~925 |
| Garden Court Block | 6,480 m² | ~69 | 6 | ~415 | ~910 |
| Mass-Timber Tower | 2,048 m² | ~22 | 4 | ~88 | ~195 |
| **Total** | | | | **~925 units** | **~2,030 people** |

**Is that enough to staff the facilities?** Barely — and only because everything is heavily automated:

| Facility | Jobs (automated-2026 assumptions) |
|---|---|
| Chip fab (small specialty, lights-out-leaning) | 250–450 |
| Robotics fab | 100–180 |
| SMR (modern staffing target) | 50–90 |
| Data center | 10–25 |
| Fab support (UPW/gas/chem/wastewater/cooling) | 40–60 |
| Food production (greenhouses/vertical/aquaponics/orchards) | 50–80 |
| Clinic, civic, retail, logistics, maintenance, robots | 120–180 |
| **Total jobs** | **~620–1,065** |

A 2,030-person town has a labor force of roughly 1,100–1,250. So the demo *can* staff itself, but with almost no slack and few non-infrastructure careers. **There are no excess living quarters — the opposite.** To hit the 5,000-person design target (and a healthy job diversity ratio of ~1 infrastructure job per 5–8 residents), the layout wants **roughly double the housing** — or this build is honestly "Phase 1: the industrial seed with its construction cohort housed."

## 3. Capital cost: ~$5.3–5.6B total, and 93% of it is three assets

### Strategic infrastructure (the point of the Tessera)

| Asset | Cost basis | Estimate |
|---|---|---|
| **Chip fab** (8,300 m² cleanroom block, mature/specialty node ~10–20k wafer-starts/mo) | Shell+cleanroom $60–80M; tools dominate ($0.8–1.5B for a 200 mm specialty line); hookup ~15% | **~$1.5–2.5B** |
| **SMR, 300 MWe** | FOAK→NOAK $6,000–10,000/kW | **~$1.8–3.0B** |
| **Data center** (as built, ~4 MW IT) | Shell+MEP ~$12M/MW = $50M; IT (GB200-class racks) ~$110M | **~$160M** |
| Robotics fab (2,400 m² + lines) | | ~$150–250M |
| Fab support: UPW $60M, gas farm $30M, chem $10M, cooling $15M, wastewater $40M | | ~$155M |
| **Subtotal** | | **~$4.8–5.1B** |

### The actual town (everything people see and live in)

| Asset | Estimate |
|---|---|
| Housing, 925 units mass timber (~$3,000/m² built) | ~$265M (≈$290k/unit — plausible for TX) |
| Civic: plaza $3M, clinic $4M, makerspace $3.5M, 2 commons $4M, markets $1.2M | ~$16M |
| Food: 5 vertical farms $27M, greenhouses $1.2M, aquaponics $3M, orchards $0.4M | ~$32M |
| Energy (non-SMR): substation $10M, 2 battery yards (≈10 MWh) $2.6M, solar fields+canopies $1.1M, rooftop PV $1.5M | ~$15M |
| Logistics: hub $8M, depots $1M, water tower+treatment $6M, comms $2M | ~$17M |
| Streets w/ full utility corridors (28,400 m²), parks, bioswales, trees | ~$25–35M |
| **Subtotal — the entire visible town** | **~$370–400M** |

**Headline: the walkable solarpunk neighborhood costs about as much as one parking garage district (~$390M); the fab + reactor + compute cost ~$5B.** Which confirms your original instinct: the heavy kit is *shared regional infrastructure* — one fab/SMR pair should serve many tesserae, or equivalently, this Tessera's export earnings (below) are what amortize it.

## 4. Energy balance

**Generation**
- **Solar (all of it):** rooftops ~570 kWp + canopies ~200 kWp + 2 fields ~460 kWp ≈ **1.3 MWp** → in Texas ≈ 2.2 GWh/yr ≈ **250 kW average** (≈1% of demand — it's the *civic* layer of power, not the backbone)
- **SMR:** 300 MWe × 90% CF ≈ **2.6 TWh/yr**

**Demand (average)**
- Living quarters: 925 all-electric efficient units ≈ **1.0–1.3 MW average** (2.5–3 MW on a Texas summer peak). Rooftop+canopy solar plus the 10 MWh batteries cover roughly **20–25% of residential energy**; the rest comes off the local grid/SMR.
- Chip fab ~10 MW · Data center ~4 MW · Vertical farms ~2.2 MW (LEDs are hungry: ~450 kW each) · Robotics fab ~1.5 MW · UPW/wastewater/misc ~2.5 MW
- **Total Tessera demand ≈ 21–25 MW average**

**Surplus: ~275 MWe.** The SMR out-produces the entire Tessera ~12×. That surplus is either (a) wheeled to ERCOT (~$95–145M/yr at $40–60/MWh), (b) shared with neighboring tesserae, or (c) fed to an expanded compute campus — which is the interesting option.

## 5. Compute

- **As built** (~4 MW IT in the 2,400 m² hall): ~30 GB200 NVL72-class racks ≈ **~2,200 GPUs ≈ 20–40 EFLOPS FP8**. IT cost ~$110M.
- **Local consumption** (resident inference, robot fleet, digital twin, fab/farm control): a few hundred kW-equivalent — **>90% of the hall is sellable** from day one.
- **Full capacity of the existing hall** (dense liquid cooling, upgraded chiller yard): ~150–190 racks, **~20–25 MW IT ≈ 11,000–14,000 GPUs ≈ 150–280 EFLOPS FP8**. Power is a non-issue (SMR); the hall's floor area and heat rejection are the limits.
- **Full capacity of the *site*:** with 275 MW of surplus SMR power, ~10 more identical halls could run **~2–3 zettaFLOPS FP8** — that's the Tessera's export industry and the economic engine that pays for everything above. Rental revenue at today's GPU-hour prices: order of **$200M/yr per 20 MW hall**.

## 6. Food

| Source | Grow area | Yield | Output |
|---|---|---|---|
| 5 vertical farms | ~9,000 m² stacked | 60–100 kg/m²/yr greens | 550–900 t/yr |
| 3 greenhouse ranges | ~1,500 m² | 40–60 kg/m²/yr fruiting veg | 60–90 t/yr |
| 2 aquaponics halls | — | fish + greens | 25–45 t/yr fish |
| 8 orchards | ~3,200 m² | | 5–10 t/yr fruit |
| **Total** | | | **~650–1,050 t/yr** |

2,030 residents eat ~500 t/yr of produce, so the demo covers **~130–200% of all fresh produce — a genuine surplus to sell at the market rows** — but produce is only ~25–30% of diet by mass. Grains, most protein, dairy, and oils are still imported: **roughly 40% of calories local**, matching the knowledge-node target. (At 5,000 residents the same farms cover ~60–80% of produce; add 2–3 vertical farms to stay in surplus.)

## 7. Your proposed additions — assessments

- **Train + bus station on the periphery: correct and currently missing.** With no car streets, the logistics hub handles freight but people have no regional link. A transit hub on the north edge (rail siding shared with fab freight + intercity bus bays + the micro-mobility hand-off) is the right move; freight rail also cuts fab/SMR construction logistics costs materially.
- **Fisheries → fertilizer: already half-present, worth doubling down.** The aquaponics halls *are* fish-effluent-fed grow beds. A dedicated high-intensity RAS (recirculating aquaculture) module makes the loop explicit: fish sludge → mineralization tank → vertical-farm nutrient dosing. Real-world RAS runoff is an excellent N/P source; it would displace most imported fertilizer for the towers.
- **Mycology farm: yes — it's the missing decomposer.** Spent greenhouse substrate, food scraps, and mass-timber offcuts → mushrooms (food), mycelium packaging/insulation (materials for the Forge), and compost. Pairs naturally with the wastewater digester. Real precedent everywhere; cheap ($1–2M).
- **Foundry / materials recovery: yes, and it closes the robotics loop.** An induction micro-foundry + e-waste recovery line (Cu, Al, steel, precious metals from dead boards) feeding the robotics fab and the Forge's printers. Note it feeds the *robotics* fab, not the chip fab — semiconductor-grade silicon stays an import; that honesty is worth keeping.
- **Solar streets: recommend canopies over pavement instead.** Solar road surfaces have failed everywhere they've been tried (5–10× cost/W, flat angle, soiling, abrasion) — and while robot-only traffic softens the abrasion argument, the same panel mounted on a canopy *over* the street produces ~30–40% more energy for a third of the cost, and shades the street (big deal in Texas). Verdict: line the main streets with the existing Solar Canopy module; keep pavement as pavement.
- **Education: the biggest true gap in the current layout.** 2,000 residents ≈ 300–400 school-age kids; 5,000 ≈ 800–1,000. Needs a K-8 school on-site (~$25–40M); high school plausibly shared between 3–4 tesserae. The makerspace and farms are half the curriculum already.
- **Parks/culture: partially covered, should be doctrine.** 9 parks + plaza + orchards ≈ 13 m²/person of green at current population — above the knowledge-node's 9 m² floor. Agreed on the rule: **no dead cells** — every unassigned cell defaults to park, and the plaza edge wants a venue/restaurant row (amphitheater + food hall, ~$10–15M) so culture isn't an afterthought.
- **Reskilling/orientation: agree — assign to the community halls.** Two exist; designate one as the Arrivals Commons (orientation, reskilling classes run out of the Forge, housing placement). Cost: programming, not construction.
- **Emergency services: missing and non-negotiable.** One combined station (2 apparatus bays, EMS, community-safety office) covers a 480 m site with sub-4-minute response easily; ~$12–18M. The clinic covers urgent care; the fab and SMR bring their own specialized hazmat/security teams by regulation.
- **Public pools: yes (it's Texas).** Natatorium + outdoor pool by the plaza (~$15–25M) — and there's a thermodynamic joke available: pre-heat it with data-center waste heat, which is otherwise underused in summer.

## 8. What else is missing (my additions)

1. **Grocery/general store** — market rows cover produce; staples need a co-op anchor.
2. **Childcare + eldercare** — the demographic bookends; small buildings, huge labor-force effect.
3. **Library / knowledge commons** — the civilian face of the data center.
4. **Guest housing / inn** — visitors, contractors, prospective residents (the orientation pipeline needs beds).
5. **Cybersecurity/ops center (SOC)** — the knowledge node specifies one per tier; the Tessera-scale seed belongs beside the data center.
6. **Sports field/courts** — the flat green kind of park.
7. **Vet + animal services** — orchards and greenhouses mean working animals and pets.
8. **Sacred/quiet space** — non-denominational; every real town has one.
9. **Microgrid islanding controls** — not a building, but the substation story should say the Tessera can island itself (SMR + batteries) during grid events. That's a headline feature in Texas.
10. **Water storage honesty** — the 7-day reserve for even 2,000 people is ~2,800 m³; the current tower holds ~300 m³. Wants ground-level tanks by the water tower.

## 9. Bottom line

- **Total capex:** ~$5.3–5.6B · town alone ~$390M · fab+SMR+DC ~$5B
- **The demo houses ~2,030 people** — enough to run the machines, not enough to be a full town; double housing (or call it Phase 1) to reach the 5,000 design point
- **Energy:** demand ~22 MW vs. SMR 300 MW → ~275 MW export ≈ $100–145M/yr
- **Compute:** ~20–40 EFLOPS as built, >90% sellable; ~150–280 EFLOPS at hall capacity; ~2–3 ZFLOPS if the SMR surplus is converted to compute halls — the revenue engine (~$200M/yr per 20 MW hall)
- **Food:** all fresh produce covered with surplus; ~40% of calories local
- **Revenue sketch at maturity:** power + compute + specialty wafers + surplus produce ≈ **$500M–1B/yr**, putting payback on the $5.5B at roughly a decade — a productive campus with a town attached, not a subsidized utopia. That's the Tessera thesis in one line.

---

# Addendum: The AI-Citizen Footprint (equal population)

Life with AI premise: an embodied AI citizenry equal to the human population. Each citizen = a persistent frontier-class agent whose **mind** runs on shared inference in the local data hall and whose **embodiment** (humanoid-class chassis) carries only real-time control compute.

## Compute (minds)

| Scenario | Basis | For 2,030 agents | For 5,000 agents |
|---|---|---|---|
| Shared inference | ~1,000 tok/s continuous/agent, concurrency-smoothed → ~10 agents/GPU | ~200 GPUs ≈ 3 racks ≈ 0.4 MW IT | ~500 GPUs ≈ 7 racks ≈ 1.0 MW IT |
| Dedicated minds | 1 GPU/citizen (rich continuous reasoning, memory consolidation, simulation time) | ~2,030 GPUs ≈ 28 racks ≈ 3.7 MW IT | ~5,000 GPUs ≈ 70 racks ≈ 9 MW IT |

Even the dedicated scenario occupies only **~15–20% of the existing hall's full buildout** — the compute-export business survives. Episodic memory (~30 TB/citizen ≈ 60 PB) is a rounding error in power (<100 kW).

## Energy (bodies + minds)

- Embodiments: 350–500 W active, 8–14 h/day → ~200 W average each → **~0.4 MW** (2,030) / ~1.0 MW (5,000); overnight smart-charging peak ~1.5 MW — an ideal sink for the SMR's night surplus via the battery yards.
- **Total AI-citizen draw: ~1.0 MW (lean) – 5.3 MW (rich)** for the demo population — the same order as the human residential load (~1.0–1.3 MW). An AI citizen's 0.5–2.6 kW brackets a human household.
- At 5,000 + 5,000, the Tessera totals ~25–38 MW — still under 13% of the SMR.

## Housing footprint

- **~60% domestic**: embodiments live in the apartments (≈1 m² charging alcove per unit + upsized electrical service; no new buildings).
- **~40% civic** (~800 agents at demo scale): **Agent Houses** — rest/charging bays (~2.5 m²/agent), chassis library, repair bay, memory-vault spine, and a commons where humans visit AI neighbors. ~2,000–2,800 m² total → 2–3 buildings.

## Capex

Rack share $10–100M + embodiments ~$100M (~$50k each) + agent houses ~$20M ≈ **$130–220M — about half the cost of housing the equal human population.** Most of an AI citizen's house walks around with them.

---

# Addendum: Phase 2 build-out (implemented in the demo)

Grid expanded 48→56. Added: transit hub on a rail siding (north edge), K-8 school, emergency services station, natatorium, venue & food-hall row, grocery co-op, library, RAS fishery (effluent → vertical-farm nutrients), mycology farm (organic waste → food/materials), materials-recovery micro-foundry (scrap/e-waste → robotics feedstock), 3 Agent Houses, and a southern housing row (+~620 units → ~1,550 homes ≈ 3,400 residents). The in-app **Ledger** computes population, jobs, energy, compute, food coverage, and capex live from whatever is placed, using this document's per-module figures (`src/catalog/stats.ts`).

---

# Addendum: Phase 6 — export revenue, transit capacity, and the water ledger

## Export revenue assumptions (shown live in the Ledger)

| Stream | Price basis | Formula |
|---|---|---|
| **Energy export** | $35/MWh wholesale (ERCOT-ish long-run average; firm SMR power can contract higher, solar-heavy surplus clears lower) | surplus MW × 8,760 h/yr × $35/MWh |
| **Compute export** | $1.00/PFLOP-hour FP8 (bulk inference capacity, wholesale; retail API pricing is several times higher — this is the conservative pipe-rental number) | surplus PFLOPS × 8,760 h/yr × $1.00/PF·h |

Demo scale: ~243 MW net electrical surplus → **~$75M/yr**; ~23 EFLOPS spare FP8 → **~$200M/yr**. Together they pay the ~$5.7B capex back on a ~20-year horizon before counting rent, fab output, or produce — the Tessera is an exporter by construction.

## Transit & delivery capacity model

Most in-Tessera trips are walked (that is the point of a 5-minute neighborhood), so motorized demand is modeled at **1.6 trips/resident/day** (regional trips, mobility-limited residents, weather, freight-adjacent errands). Parcel demand is **0.9 deliveries/resident/day**.

| Module | Capacity | Basis |
|---|---|---|
| AV Shuttle Depot | 1,800 trips/day | ~8 six-seaters × ~150 trips/day each at neighborhood speeds, 20 h service |
| Transit Hub (rail + bus) | 6,000 trips/day | 2-track regional rail + 3 bus bays, peak-spread |
| Delivery Robot Depot | 1,500 parcels/day | ~18 robots × ~85 drops/day |
| Logistics Hub | 4,000 parcels/day | dock-door feeder that breaks regional freight into robot loads |

The Ledger compares Σ capacity against population demand per stream; the per-building **⚡ Utilities** tab shows how many residents each depot serves.

## The water ledger, by end use

Water now has its own build category (water tower & treatment, wastewater plant, UPW plant, bioswales) and the Ledger's Water/Wastewater rows expand into per-building demand vs capacity. Demo-scale orientation, from `stats.ts`: the chip fab dominates at 900 m³/d (plus 300 m³/d cooling towers and 100 m³/d UPW), the SMR draws 500, farms ~100 total (greenhouses 15 each, vertical farms 12, RAS fishery 45, aquaponics 20, mycology 8, orchards 4), residential ~48 m³/d per 1,000 homes (≈34 L/resident/day of indoor potable — dry-fixture, greywater-recycling assumptions), parks/plazas 3 each. Industrial water is the design pressure, not showers.
