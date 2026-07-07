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
| **Tab** or 🚶 Walk | Enter first-person walkthrough |
| Drag / scroll | Orbit / zoom |

The palette covers 45 modules: housing (including the **Agent House**,
civic quarters for embodied AI citizens), civic space (school, emergency
services, pools, venue, grocery, library...), food production (greenhouses,
vertical farms, RAS fishery, mycology), energy (solar, batteries,
substation, SMR), the full chip-fab support chain, a robotics fab and
materials-recovery foundry, compute, logistics (including the rail + bus
**Transit Hub** and the **AV Shuttle Depot**) and streetscape.

Streets are functional, not decorative: delivery robots BFS-route over any
`Street` modules you lay down, and six-seater autonomous shuttles run
scheduled loops between AV depots and the transit hub — the mass-transit
system an arcology needs, planted at neighborhood scale. Shuttles only run
where the street network actually connects, and the **Roads** toolbar
toggle shows exactly that: teal streets reach the transit network, red
streets are islands (with a toast tallying the gaps).

**Click any placed building** to inspect its purpose and lore — then Move,
Rotate, or Remove it, or open the **⚡ Utilities** tab for its energy, compute
(residents modeled as AI power users), water and wastewater detail. The
**Ledger** toolbar button shows live economics of everything placed (site
area, population, jobs, energy, compute, water balance, food coverage,
capex), sourced from [`docs/tessera-economics.md`](docs/tessera-economics.md).

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
top-right so north stays findable.

**🎨 Theme** cycles architectural palettes — Solarpunk (Texas timber),
Desert Adobe, Nordic Timber, Neon Night, Mediterranean — rebuilding every
placed module in place (colors are baked into vertex data), with matching
sky and lighting. **🌍 Region** cycles the regional archetype the site sits
in: Temperate, Great Plains, High Desert, Tundra, or Exurban Fringe — each
with its own ground color, fog, and off-site scatter (groves, scrub,
snowfields, homesteads). Both persist across reloads.

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
extracted from the Arcology Knowledge Node at lifewithai.ai.

## URL parameters

`?mode=arcology` · `?demo=1` (bundled layout) · `?empty=1` (blank site) ·
`?xray=1` · `?shafts=1` · `?cut=0.45` (cutaway fraction) · `?freeze=1`
(pause ambient animation) · `?theme=neon-night` (architectural theme) ·
`?biome=desert` (regional archetype) · `?pipes=1` (underground view) ·
`?roads=1` (street-connectivity overlay)

## Deploying to GitHub Pages

Merging to `main` triggers `.github/workflows/deploy.yml`. One-time setup:
repository **Settings → Pages → Source: GitHub Actions**.
