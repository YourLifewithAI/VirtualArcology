# Arcology World Parameters — v1 Reference

Canonical data file for the Three.js arcology massing model, elevator-shaft x-ray/cutaway, and Tessera builder. **All lengths in meters (SI).** Source codes: **B** = creator briefing, **KN** = knowledge node, **J** = judgment call (reconciliation). Conflicts are flagged inline.

---

## 1. ArcologyParams defaults

### 1.1 Massing (master geometry)

| Parameter | Value | Source | Notes |
|---|---|---|---|
| `peakHeight` | 1,524 m (spire tip) | B + KN | Agreed. |
| `baseSide` | 5,633 m, square plan | B + KN | 18,480 ft; briefing rounds to 5,632 m. |
| `baseFootprint` | 31.7 km² | J | KN self-conflicts (12.25 mi² = 31.7 km² vs 24.6 km² foundation entry). Side length is ground truth: 5,633² m. |
| `tierCount` | 10 | B + KN | |
| `tierHeight` | 150.0 m | **J — CONFLICT** | KN says 153.6 m/tier, but 10 × 153.6 = 1,536 m exceeds its own 1,524 m peak. Ship 150.0 m so plateau = 1,500 m + 24 m spire crown = 1,524 m tip. |
| `setbackPerTier` | 167.6 m per side, per tier | B + KN | Each tier 335.3 m narrower than the one below. |
| `terraceDepth` | 167.6 m flat ring at every setback | KN | Signature exterior feature. |
| `topTierSide` | 2,616 m (summit plateau) | KN | 5,633 − 9 × 335.3. |
| `spireHeight` | 24 m crown above plateau | J | KN: "modest crown, not a separate tower." Bristles with lightning masts (~50 strikes/yr). |
| `overallSlope` | ~41.8° | KN (derived) | atan(150 / 167.6); KN cites ~42.5° from 153.6 m tiers. |
| `subLevelDepth` | 146.4 m below grade | B + KN | 30 levels × 4.88 m. |

### 1.2 Floors & core

| Parameter | Value | Source | Notes |
|---|---|---|---|
| `floorsPerTier` | 36 | B + KN | |
| `floorsAboveGrade` | 360 | B + KN | **CONFLICT:** two KN domains say "400+ floors at ~3.8 m." Ship 360; 390 incl. sub-levels ≈ "400." |
| `floorToFloor` | 4.17 m above grade | J | 150.0 / 36; briefing ~4.2 m; KN 4.27 m (14 ft) — scaled with tier height. |
| `subLevels` | 30 × 4.88 m | B + KN | Deeper spacing than above-grade. |
| `coreStructureFraction` | 0.30 of GFA (usability 0.70) | KN | Structure + mech + circulation. |
| `coreZoneFraction` | 0.18 of floor plate | KN | Visible core cluster width in cutaway. |
| `hoistwayFraction` | 0.05 of GFA (range 0.02–0.08) | KN | vs 24 % conventional supertall — core reads slim. |
| `grossFloorArea` | 7.41 × 10⁹ m² | KN | Geometry-verified (tier areas × 36 + sub-levels). |
| `usableFloorArea` | 5.18 × 10⁹ m² | **J — CONFLICT** | Structural: 55.8 B ft² usable; ai-compute: 5.58 B ft² (×10 discrepancy). Ship 0.70 × GFA. Compute = 10 % of usable. |
| `fireCompartment` | 2,000 m² (1,000–2,500) | KN | Close-up LOD grid on plates. |
| `seismicJointWidth` | 750 mm (500–1,000) | KN | Thin seams segmenting massing into blocks. |
| `fundamentalPeriod` | 14 s (12–18) | KN | Idle sway animation. |

### 1.3 Zone striping (three overlay systems — not conflicting)

| System | Value | Source | Render rule |
|---|---|---|---|
| Atmospheric zones | 13 (~117 m each) | KN | Airlock/interstitial decks; snap to 10 tier bands + basement + 2 spire/crown zones. |
| Thermal-distribution zones | 6 × 250 m (25 bar) | KN | Heat-exchanger glow bands at sky lobbies 2, 4, 5, 6, 8, 10. |
| Water pressure zones | 30 (tank floors every ~50 m) | **KN — CONFLICT** | M&E domain says 44–45 × ~35 m; ship 30 (environmental), i.e. 3 tank stripes per tier. |
| Stair segments | ≤ 60 m (~15 stories), offset breaks | KN | Never continuous full-height voids. |
| Drainage stacks | break ≤ 40 floors (≈ every tier) | KN | |

### 1.4 Program mix (global, % of usable area)

Residential 25 % (129.6 m²/person) · Parks 20 % · Commercial/civic 10 % · Compute 10 % · Agriculture 8.5 % · Transit 8.5 % · Infrastructure 8.5 % · Surplus 8.5 %. (KN)

**Vertical map (B, detailed by KN):** B30–B1 compute halls + WtE + caverns; Tiers 1–3 industrial/logistics/commercial; Tiers 4–7 residential/mixed with parks and light wells; Tiers 8–10 agriculture-dominant; spire comms/compute + GSOC.

### 1.5 Power (sums to 9.5 GW)

| Source | Value | Notes (KN) |
|---|---|---|
| SMR nuclear | 5.1 GW = 17 × 300 MWe | Sub-foundation modules or fenced exclusion campuses outside base; ~14 ha per 924 MWe 12-module plant. Never in the superstructure. |
| Solar BIPV/agrivoltaic | 1.0 GW avg (4.0 GW nameplate) | 30 × 10⁶ m² PV of 55 × 10⁶ m² envelope (~55 %). |
| ERCOT grid tie | 1.5 GW | Transmission corridor + substation yard at perimeter. |
| Fusion (speculative) | 1.9 GW ≈ 4–5 × 400 MWe | Compact tokamak halls, outlying district. |
| Compute allocation | 6.175 GW (65 % of total) | Vertical-farm lighting 450 MW; network 15–30 MW. |
| Deep-borehole reactors | 15 MWe/unit, optional | Vertical shafts in sub-level cutaway. |
| Backup diesel | **none** | Explicitly absent. |

### 1.6 Water / waste / air / cooling

| Parameter | Value | Source | Notes |
|---|---|---|---|
| Water throughput | 2.0 × 10⁶ m³/day (200 L/person·day) | KN | |
| Water reserve | 14 × 10⁶ m³ (7 days), distributed vertically | KN | Chunky tanks on stripes, not just at base. |
| Waste throughput | 17,500 t/day; 500 mm pneumatic tubes | KN | Staging nodes every ~75 floors (~313 m) → 5 nodes. |
| WtE plant | 600 MWt / 150 MWe (2–4 Copenhill-class) | KN | Sealed sub-levels; flues exit outside envelope. |
| District cooling | 10 GW installed; 100+ chillers | **KN — CONFLICT** | Environmental cites 4 GW peak load vs energy 8–12 GW capacity. Ship 10 GW plant / 4 GW design-day. No big cooling-tower farms — heat goes to district loop. |
| Outdoor air | 35,400 m³/s total | KN | Intake louver banks at every zone band. |
| Thermal storage | 50 GWh caverns (~1.1 × 10⁶ m³ class) | KN | Sub-foundation voids. |
| DC waste-heat loop | 55 °C return → 70 °C district heating, ~1,000 MW | KN | Fat thermal risers up the core. |

### 1.7 Site & context

| Parameter | Value | Source | Notes |
|---|---|---|---|
| Site | Burleson County, Texas — flat, semi-arid Gulf Coastal Plain | **KN — CONFLICT** | Institutional domain says "Gulf-region desert/coastal" — overruled 2:1. No hills, coast, or rock. |
| Surroundings | Rewilded prairie/scrub + energy district | B + KN | |
| Foundation | 175 m friction piles, dense field in clay; bedrock 6,000 m (never reached) | KN | |
| Population | 10,000,000; 3.5 M households | KN | |
| Envelope | ETFE double-layer cushions, 0.7 kg/m² | KN | Translucent pillows, not glass curtain wall. |
| Construction duration | 30 yr default (slider 20–50) | **J — CONFLICT** | Institutional 25 yr vs logistics 35 yr. Occupancy from year ~8; peak 10 floors/month. |
| Materials | 75 × 10⁶ m³ concrete; 10 × 10⁶ t steel | KN | HSC (80 MPa) base → UHPC (200 MPa) + S690/S960 mid → UHPC + CFRP spire. Color-code cutaway by zone. |

---

## 2. Elevator & vertical transport scheme

**Sky lobbies:** one at each tier top — z = 150, 300, 450, 600, 750, 900, 1,050, 1,200, 1,350, 1,500 m (SL1–SL10). Each is a wide double-height interchange band co-located with the tier mechanical floor (primary substation, water transfer tanks, plumbing/drainage break, inter-tier dampers, air-intake louvers) plus a hardened refuge floor (defend-in-place: full-height stair egress ≈ 180 min/person, so evacuation is by protected elevator). Wide access-gate banks at every SL (10 M zone transitions/hr peak).

**Segment limits (hard constraints):** steel cable ≤ 500 m; UltraRope ≤ 1,000 m; ropeless MULTI unlimited (circulating cabs).

**Representative core cluster for the x-ray** (one of many cores across the 5.6 km plate — 500,000 trips per 5-min peak means the rendered bank is representative, not exhaustive). All counts are J; limits/speeds are KN:

| Bank | Shafts | Extent | Speed | Behavior | Color (optional) |
|---|---|---|---|---|---|
| MULTI ropeless loops | 8 loops (16 hoistway voids, up/down pairs) | 0 → 1,500 m, stops all SLs | 5 m/s | 3 cabs visible/loop; horizontal cab shifts at sky lobbies | amber `#ffd23f` |
| UltraRope express (double-deck) | 4 | 2 stacked segments: 0→750 m, 750→1,500 m (both ≤ 1,000 m) | 18 m/s | Stops SL5, SL10 only | red `#ff5a5a` |
| Local cable banks | 6 per tier, offset stack per tier | one tier each (150 m runs) | 8 m/s | Terminate at SLs above/below | blue `#4da3ff` |
| Freight/service | 2 | full height, segmented per tier | 5 m/s | Feeds mechanical bands | orange `#ff9d2e` |
| Evacuation (protected) | 2 | full height, hardened, pressurized | 10 m/s | Serves refuge floors at each SL | green `#3ddc84` |
| Sub-level service | 2 | 0 → −146.4 m | 5 m/s | Reaches compute halls / WtE | gray `#9aa0a6` |

**Parallel to hoistways in the same core chase:** bundled district-thermal risers (~1,000 km network via central spine), water mains for 30 pressure zones, 500 mm waste tubes, fiber trunks (121,000 km total; anchor hardware every ~46 m of rise), fire stairs in offset ≤ 60 m segments. Core cluster ≈ 18 % of plate width; hoistways alone ≈ 5 % of GFA.

**Construction-phase overlay:** hoists + concrete pump relay decks at every other SL (300/600/900/1,200/1,500 m); visible system break at ~610 m where ground-based pumping ends (~40 % of height).

---

## 3. Visible systems checklist

**Sub-levels (0 to −146.4 m, 30 levels):**
- AI data halls dominate: rows of 26,800 identical dark liquid-cooled racks (72 GPUs each, 230 kW, 1.93 M GPUs); overhead coolant manifolds, no raised floors; a few halls as horizontal 250 kW immersion tubs
- WtE plant (600 MWt), robotic waste-sorting MRF, water treatment, cavern thermal-storage voids (~10⁶ m³ class)
- Optional SMR modules under foundation + deep-borehole reactor shafts; 1 subterranean SOC
- Dense 175 m pile field hanging in clay below everything

**Lower tiers (T1–T3, 0–450 m):**
- Industrial/logistics program, transit hubs, heavy switchgear risers from sub-level power
- Facade reads as stacked prefab modules (≤ 56-story modular precedent); operable/permeable perimeter zones
- Dark HSC concrete structure in cutaway; massive walls/columns (75 M m³ concrete)
- Heat-rejection plant at base; people-mover guideways and walkways gridded ≤ 200 m to a station across the 5.6 km plates

**Mid tiers (T4–T7, 450–1,050 m):**
- Residential/mixed; program color bands per §1.4; park atria ≥ 15.2 m tall every ~30 m of height (≤ 10 floors to green)
- Green facade ribbon (daylight: 6 m plants / 15 m humans); artificial-sky ceilings deeper in
- Hospital hubs every ~150 floors (4.3 m tall floors), clinics every ~75 floors; edge-compute closet per floor zone (10,000 total)
- UHPC + steel hybrid structure color; seismic-joint seams; inter-tier damper hardware (distributed — no rooftop TMD)

**Upper tiers (T8–T10, 1,050–1,500 m):**
- Agriculture-dominant: deep 5–10 ha farm plates glowing magenta/white (450 MW lighting), day and night
- Sealed glazing (13-zone atmosphere); airlock vestibules at SL bands
- Aerial gondola lines strung along terraces (3,000–4,000 pax/hr/line)

**Terraces (all 10):** tilted bifacial PV rows over crop beds (agrivoltaic, LER 1.86); low-poly trees (500,000 building-wide, ~150/ha of the 90 km² green target); facade PV varies by orientation — opaque dark silicon south, semi-transparent E/W, thin-film north.

**Spire/crown (1,500–1,524 m):** comms arrays, central GSOC (12 more SOCs: 1/tier + 1 sub-level + 1 backup), lightning masts, occasional strike VFX; light UHPC/CFRP color.

**Surroundings:** rewilded flat Texas prairie; 17-reactor SMR campuses with heat-rejection plant + thermal mains to base; ERCOT substation yard + HV corridor; 4–5 optional fusion halls; 2–3 fiber crossconnect vaults per base side (2.5 km segment limit). **Construction view:** 500–1,000 concurrent work fronts (robot crews, sparse humans), tower cranes, migrating cantilevered staging platforms, batching hub (20,000 m³/day) with silos, $95 B robotics factory, 50,000-unit worker city, autonomous freight convoys (75,000 t/day); lower tiers lit/occupied while upper tiers stand skeletal.

---

## 4. Tessera module hints (neighborhood-scale block)

Each tier is explicitly "a semi-autonomous neighborhood" — the Tessera is a slice of one. Per-capita scaling factors (from KN totals ÷ 10 M residents), for a Tessera of N residents:

| System | Per-capita factor | 5,000-resident Tessera example |
|---|---|---|
| Total power | 950 W/person (333 W excl. compute) | 4.75 MW / 1.7 MW |
| Water | 200 L/day + 1.4 m³ stored (7-day) | 1,000 m³/day; 7,000 m³ tanks |
| Waste | 1.75 kg/day via 500 mm pneumatic tube | 8.75 t/day |
| Residential area | 129.6 m² usable | 648,000 m² |
| Green space | 9 m² + 0.05 trees | 45,000 m², 250 trees |
| Farm area | ~44 m² (→ 90 % fresh produce, 40 % calories) | 220,000 m² multi-layer |
| Compute | 1 edge node + ~50 cameras per 1,000 residents | 5 closets, 250 cameras |

**A Tessera module should visibly contain:** (1) a park atrium ≥ 15.2 m tall within 30 m vertical of every unit, artificial-sky lit; (2) an agrivoltaic terrace edge — tilted PV rows over crops; (3) a farm floor with magenta grow-light glow; (4) a transit stop ≤ 200 m walk (people-mover/walkway node); (5) a district-thermal substation tapping the 55→70 °C waste-heat loop plus water tank cluster (one per ~50 m pressure zone); (6) an edge-compute closet beside the shaft core; (7) a clinic marker (per ~75 floors) and access-gate line at its lobby; (8) fire compartmentation into 2,000 m² cells; (9) one SOC node per tier-scale aggregation of Tesserae. Program mix per module should approximate the global split (§1.4) so stacked Tesserae reproduce whole-building statistics — the tier "repeats as a modular render unit."

---

*Flagged conflicts recap: tier height 153.6 vs 152.4 m (ship 150.0 m, J); floors 360 vs 400+ (ship 360); usable area ×10 discrepancy (ship 5.18 × 10⁹ m²); footprint 31.7 vs 24.6 km² (ship 31.7); water zones 30 vs 44–45 (ship 30); cooling 4 vs 10 GW (ship 10 GW plant / 4 GW load); site Texas vs Gulf desert (ship Texas); build duration 25 vs 35 yr (ship 30).*