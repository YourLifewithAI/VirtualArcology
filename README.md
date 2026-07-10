# VirtualArcology

An interactive 3D **Tessera builder** and **Arcology viewer** for the
[Life with AI](https://lifewithai.ai) project — build a walkable solarpunk
neighborhood (a *Tessera*, the modular building block on the road to an
arcology) from a catalog of procedural modules, then walk its streets in
first person, or explore a parametric massing model of Arcology One itself,
elevator shafts and all.

Everything is procedural low-poly Three.js — no downloaded assets.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
npm run verify     # headless screenshot harness (needs a prior build)
```

## Tessera builder

The app opens on a demo neighborhood. Build your own:

| Input | Action |
|---|---|
| Left click | Place selected module |
| **R** | Rotate (ghost before placing, or a selected building in place) |
| Right click | Delete module under cursor |
| **Esc** | Deselect |
| **Ctrl+Z / Ctrl+Y** | Undo / redo |
| **M** | Pick up the selected building and move it |
| **Del** | Remove the selected building |
| **⬚ Select** | Box-select mode: drag over buildings, then **Del** deletes or **M** moves the whole block (one undo step) |
| **Tab** or 🚶 Walk | Enter first-person walkthrough |
| Drag / scroll | Orbit / zoom |

The palette covers 48 modules: housing (including the **Agent House**,
civic quarters for embodied AI citizens), civic space (school, emergency
services, pools, venue, grocery, library, **restaurant row**, a
**regulation soccer pitch** and a **community gym**...), food
production (greenhouses, vertical farms, RAS fishery, mycology), energy
(solar, batteries, substation, SMR), the full chip-fab support chain, a
robotics fab and materials-recovery foundry, compute, logistics (including
the rail + bus **Transit Hub** and the **AV Shuttle Depot**) and streetscape.

Streets are functional, not decorative: they double as **solar pavement**
(the heaviest regular load is a robot, which fixes road-PV's durability
problem), delivery robots BFS-route over them, and six-seater autonomous
shuttles run scheduled loops between AV depots and the transit hub.
**Robots have real jobs** — parts couriers between the fabs, farm-to-table
produce runs, meal deliveries from the restaurants, parcel rounds, scrap
runs to the foundry — each role color-tinted; **click any robot** to see
who it is, what it's hauling, and where it's headed. Shuttles only run
where the street network actually connects, and the **Roads** toolbar
toggle shows exactly that: teal streets reach the transit network, red
streets are islands (with a toast tallying the gaps).

Two more overlays complete the audit set: **Food** draws the food web —
green links between controlled-environment food buildings (greenhouses,
vertical farms, aquaponics, fisheries, mycology) that sit close enough to
interconnect their water, nutrient, and substrate loops, with amber flags
on isolated ones. **Terrain** hides the paver site pad so unused cells show
the regional ground right through the grid (buildings keep their own pads);
toggle it back for the full-slab look.

**Click any placed building** to inspect its purpose and lore — then Move,
Rotate, or Remove it, or open the **⚡ Utilities** tab for its energy, compute
(residents modeled as AI power users), water, wastewater, and transit/delivery
capacity detail. The **Ledger** toolbar button shows live economics of
everything placed — population, jobs, energy, export income (energy + spare
compute), water balance by end use, transit & delivery capacity vs demand,
fresh-produce coverage, capex — and **every row expands on click** into the
per-building math behind the number, with **citation chips linking to the
real-world sources** behind each assumption (Census, BLS, EIA, EPA, USDA,
NREL, NHTS…; ◈ marks deliberate worldbuilding assumptions). Full reference
table in [`docs/tessera-economics.md`](docs/tessera-economics.md). The
compass is draggable — park it wherever you like.

**Pipes** toggles the underground-infrastructure x-ray — and every line is
*routed*: service stubs run to the street, then follow the street network to
the right plant (sewer → wastewater treatment, water → water tower, power →
substation/SMR, fiber → data center/comms mast). Only trunks that actually
carry a service are drawn, so the network reads as a real tree converging on
its plants. Anything that can't reach one — no street nearby, a gap in the
lattice, or no plant placed — gets a red stub and an above-ground red flag,
with a toast tallying the gaps.
**New site** lets you drag out a fresh footprint (live m² readout) — the
demo neighborhood is preplanned, but new builds start with your own site
boundary, and saved layouts carry their footprint with them. A compass sits
top-right so north stays findable (drag it anywhere).

**⛰ Landform** opens the terrain layer, SimCity-style: buildings hide and
the land itself takes the brush — raise, lower, level, smooth, carve
**lakes**, or drain them (site perimeter stays pinned to the regional
datum). On exit, anything now standing on too-steep or flooded ground is
removed — the mode says so up front — and everything else re-seats on the
new grades. Buildings **grade a level pad** into whatever slope you place
them on (too steep = red ghost); **streets, orchards, parks, and bioswales
conform to slopes** instead, robots and shuttles drive the grades, pipes
follow the ground profile underground, and the walkthrough climbs the
hills. Terrain and lakes save/load with the layout.

**📍 Locate** makes the site a real place: type a city or "lat, lon" and
the climate record (Open-Meteo ERA5) picks the matching region archetype,
the sun moves to that latitude, and **real elevation data shapes the
surrounding terrain** — the buildable pad stays graded flat (as real
construction sites are) and the highway/rail corridors run in cut-and-fill
bands through the hills. Without a location, seeded procedural hills scaled
to the biome roll to the horizon instead. The location, biome, and cached
terrain persist across reloads; geocoding © OpenStreetMap contributors.

**🎨 Theme** cycles architectural palettes — Solarpunk (Texas timber),
Desert Adobe, Nordic Timber, Neon Night, Mediterranean — rebuilding every
placed module in place (colors are baked into vertex data), with matching
sky and lighting. **🌍 Region** cycles the regional archetype the site sits
in: Temperate, Great Plains, High Desert, Tundra, or Exurban Fringe — each
with its own ground color, fog, and off-site scatter (groves, scrub,
snowfields, homesteads). Both persist across reloads.

Beyond the site boundary, the **regional corridors** run horizon to
horizon: a highway flanks the east side (trucks streaming both ways, an
interchange spur to the site edge) and the freight/passenger rail line
passes the transit hub along the north — the supply lines that built the
place. The **🎵 button** cycles six generative ambient tracks (Meadow,
Terrace Tide, Fab Hum, Railline, Night Shift, Orchard Rain) — synthesized
live in the browser like everything else here; no audio files.

**Save/Load** exports the layout as JSON (and autosaves to your browser).

## Walkthrough

WASD to move, **Shift** to run, **F** toggles fly mode (Q/E for down/up),
**Esc** pauses, **Tab** exits. Collision keeps you out of buildings but
plazas, parks, streets and orchards are walkable.

## Arcology mode

A parametric model of Arcology One (5,000 ft terraced ziggurat, 10 tiers,
10M residents) with:

- **Canon presets** — `knowledge-node` (1,500 m plateau + 24 m crown, from
  the site's engineering entries) and `briefing` (122 m tiers + 304 m spire
  tower, from the world bible)
- Program-colored tiers (industrial base → residential/mixed → agriculture)
  with terraced parks, agrivoltaics and greenhouse ranges
- **X-ray** and **cutaway** views revealing the vertical transport scheme:
  MULTI ropeless loops, UltraRope express, per-tier local banks, freight,
  evacuation, and sky lobbies at every tier top
- "Walk a terrace" teleports — stand on any tier's terrace at height
- The rewilded surroundings: prairie, forest, SMR campuses and the grid tie

Reference numbers live in [`docs/world-parameters.md`](docs/world-parameters.md),
extracted from the Arcology Knowledge Node at lifewithai.ai. How Tessera
buildings could stack into the arcology — first-principles load math,
built precedents (101 George Street, Habitat 67, Shimizu TRY 2004), and
why the ziggurat needs a megaframe of tier decks rather than one central
spine — is worked through in
[`docs/stacking-structures.md`](docs/stacking-structures.md).

## URL parameters

`?mode=arcology` · `?demo=1` (bundled layout) · `?empty=1` (blank site) ·
`?xray=1` · `?shafts=1` · `?cut=0.45` (cutaway fraction) · `?freeze=1`
(pause ambient animation) · `?theme=neon-night` (architectural theme) ·
`?biome=desert` (regional archetype) · `?pipes=1` (underground view) ·
`?roads=1` (street connectivity) · `?food=1` (food web) ·
`?ground=terrain` (see-through site pad)

## Deploying to GitHub Pages

Merging to `main` triggers `.github/workflows/deploy.yml`. One-time setup:
repository **Settings → Pages → Source: GitHub Actions**.
