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

The palette covers 44 modules: housing (including the **Agent House**,
civic quarters for embodied AI citizens), civic space (school, emergency
services, pools, venue, grocery, library...), food production (greenhouses,
vertical farms, RAS fishery, mycology), energy (solar, batteries,
substation, SMR), the full chip-fab support chain, a robotics fab and
materials-recovery foundry, compute, logistics (including the rail + bus
**Transit Hub**) and streetscape. Delivery robots route themselves over any
`Street` modules you lay down.

**Click any placed building** to inspect its purpose and lore — then Move,
Rotate, or Remove it. The **Ledger** toolbar button shows live economics of
everything placed (population, jobs, energy, compute, food coverage, capex),
sourced from [`docs/tessera-economics.md`](docs/tessera-economics.md).

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
(pause ambient animation)

## Deploying to GitHub Pages

Merging to `main` triggers `.github/workflows/deploy.yml`. One-time setup:
repository **Settings → Pages → Source: GitHub Actions**.
