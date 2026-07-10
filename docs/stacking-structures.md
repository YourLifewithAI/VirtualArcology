# Stacking Tesseras: from neighborhood modules to an arcology skeleton

*Research memo, Phase 8 — first-principles structural reasoning plus built
precedents for the question: can the Tessera's base structures be designed
to stack and interconnect, what would that require, what are the load
limits, and does the arcology need a central skeleton?*

## 1. First principles: how high can anything stack?

**Crushing.** A prismatic column of a single material fails in pure
compression at height `h = σ / (ρ·g)` (strength over density × gravity):

| Material | Strength (compression) | Density | Self-supporting column height |
|---|---|---|---|
| Concrete C40 | 40 MPa | 2,400 kg/m³ | ≈ 1.7 km |
| High-strength concrete C100 | 100 MPa | 2,500 kg/m³ | ≈ 4.1 km |
| Structural steel (yield) | 350 MPa | 7,850 kg/m³ | ≈ 4.5 km |
| CLT parallel to grain | ~30 MPa | ~480 kg/m³ | ≈ 6.4 km (!) |

Two corrections matter. First, these are *material* limits; real structures
stop far short because **buckling, connections, and lateral loads (wind,
seismic) govern**, not crushing — which is why the tallest mass-timber
building on Earth is 87 m ([Ascent MKE](https://en.wikipedia.org/wiki/Ascent_MKE)),
not 6 km, and even it keeps its stair/elevator cores and podium in
concrete ([Thornton Tomasetti](https://www.thorntontomasetti.com/project/ascent)).
Second, **tapering beats the prism limit**: a constant-stress profile
(wider as load accumulates) can exceed `σ/ρg` — mountains hold 8,800 m in
rock. This is the deep reason the arcology is a **ziggurat**: each tier
bears on a larger tier below, so material stress stays roughly constant
all the way down. The shape is not aesthetic; it is the structurally
honest way to put 1,500 m of city in the sky with buildable materials —
no exotic nanotubes required.

## 2. What stacked-module construction actually achieves today

- **Shipping containers** are the purest stacking system: the entire
  vertical load path lives in four corner posts and eight corner castings
  rated to ~86 t each; walls and roof carry nothing. Ships stack them
  **9–12 high** on engineered support; unengineered architectural use is
  advised to stop at 2–3
  ([Mobile Modular](https://www.mobilemodularcontainers.com/blog/stacking-shipping-containers),
  [HZ Containers](https://hz-containers.com/en/news/stackability-of-shipping-containers/)).
  Lesson: **stacking strength = discrete rated posts + standardized
  connectors at every corner**, not walls.
- **Habitat 67** (Montreal, 1967): 354 prefabricated concrete boxes,
  post-tensioned into a 12-story hillside — the modules *are* the
  structure. It proved the architecture and also the limit: self-carrying
  boxes get very heavy and very expensive as they climb.
- **101 George Street, Croydon** — the world's tallest volumetric modular
  buildings: **1,526 factory-fitted modules stacked 44 storeys / 135.6 m**,
  but crucially the modules only carry gravity; two slip-formed
  **reinforced-concrete cores** carry all lateral load and host lifts,
  stairs, and risers
  ([Construction News](https://www.constructionnews.co.uk/project-reports/101-george-street-22-05-2019/),
  [MBI](https://www.modular.org/2022/09/26/vertical-engineering-inside-the-worlds-tallest-modular-building/)).
  Current practice: pure module-on-module works to roughly 10–16 storeys;
  beyond that you pair modules with a skeleton.
- **Nakagin Capsule Tower** (Tokyo, 1972): the inverse split — two
  permanent service towers, 140 replaceable capsules bolted on. The
  metabolist "plug-in" idea the Tessera-to-arcology path needs.
- **Shimizu TRY 2004 Mega-City Pyramid** — the closest thing to a designed
  arcology: a 2,004 m pyramid of **megatrusses** over Tokyo Bay with
  **24+ thirty-storey towers suspended inside the lattice**; skeleton
  first, buildings as plug-in cargo. At that clear-span scale the design
  needed carbon-nanotube struts — beyond current materials
  ([Wikipedia](https://en.wikipedia.org/wiki/Shimizu_Mega-City_Pyramid),
  [ENR](https://www.enr.com/articles/392-dream-projects-mega-pyramid-solves-urban-congestion)).
  A solid-base ziggurat avoids exactly that problem: it doesn't span, it
  bears.

## 3. So: what would stackable Tessera buildings require?

The Tessera is accidentally well-prepared — it already has a **10 m
structural grid**, flat graded pads, and per-building service risers. To
make its buildings genuinely stackable:

1. **Rated corner columns on the cell grid.** Every building's loads
   collected into discrete columns at 10 m cell corners (the container
   corner-post principle at neighborhood scale), with standardized
   connector castings top and bottom.
2. **Continuous load paths & reserve capacity.** A ground-tier building
   either carries N tiers above (heavy, Habitat-67-style — economic only
   for N ≤ 2–3) or hands off to the skeleton at each tier (light,
   Croydon-style — the winner).
3. **Aligned vertical services.** Risers, elevator voids, and utility
   trunks on shared setting-out so a stacked Tessera's pipes meet the one
   below — the in-app utility risers and street trunks are the flat
   version of this discipline.
4. **Lateral system lives in the skeleton, not the modules.** Modules take
   gravity; megaframe takes wind/seismic — the 101 George Street split.
5. **Fire & egress continuity** across tiers (hardened evacuation cores —
   already in the elevator scheme).

**Pure stacking limit for Tessera-grade mass-timber buildings** (4–8
storeys each): about **two, at most three Tesseras high (~100–150 m)**
with strengthened lower frames — conveniently the same ceiling the modular
and mass-timber records land on. Beyond that, module walls fatten until
the ground floors are more structure than room.

## 4. Does the arcology need a central skeleton? Yes — but distributed, not central

One spine can't serve a 5.6 km plate. The answer the precedents converge
on is a **megaframe**: a forest of megacolumns on the (say) 60 m
super-grid, diagonal bracing at the shell, and **transfer decks at every
150 m tier top** — each deck a new "ground" rated for Tessera-grade
loads. The Knowledge Node's 36-floor tiers and the briefing's 10 tier
plates *are* this skeleton; the sky lobbies sit at its hard points.

Load sanity check, first principles: a tier of Tessera-grade construction
distributes roughly 1.5–3 t/m² over its deck. Ten stacked tiers bear
~20–30 t/m² ≈ **0.2–0.3 MPa** at the base — an order of magnitude below
concrete strength, comfortably a foundations problem (mat + rock), not a
materials problem. Megacolumn cross-sections are sized to keep working
stress near ~30–50 MPa; the ziggurat taper keeps that roughly constant
per tier. The arcology is buildable with concrete and steel; the hard
parts are elevatoring, logistics, and money — which is why the vertical
transport scheme got designed first.

**Design consequence for the Tessera today:** keep every building on the
10 m grid, collect loads at cell corners, standardize riser positions,
and a Tessera never needs to know whether its "ground" is Texas prairie
or Tier 7's transfer deck. That is the entire trick.

## Sources

- [Construction News — 101 George Street project report](https://www.constructionnews.co.uk/project-reports/101-george-street-22-05-2019/)
- [Modular Building Institute — Vertical Engineering: inside the world's tallest modular building](https://www.modular.org/2022/09/26/vertical-engineering-inside-the-worlds-tallest-modular-building/)
- [New Civil Engineer — last pod installed on world's tallest modular buildings](https://www.newcivilengineer.com/latest/last-pod-installed-worlds-tallest-modular-buildings-01-11-2019/)
- [Wikipedia — Shimizu Mega-City Pyramid](https://en.wikipedia.org/wiki/Shimizu_Mega-City_Pyramid)
- [ENR — Dream Projects: Mega-Pyramid](https://www.enr.com/articles/392-dream-projects-mega-pyramid-solves-urban-congestion)
- [Wikipedia — Ascent MKE](https://en.wikipedia.org/wiki/Ascent_MKE) · [Thornton Tomasetti — Ascent](https://www.thorntontomasetti.com/project/ascent) · [US Forest Service — world's tallest timber building](https://www.fs.usda.gov/inside-fs/delivering-mission/apply/worlds-tallest-timber-building-opens)
- [Mobile Modular — stacking shipping containers](https://www.mobilemodularcontainers.com/blog/stacking-shipping-containers) · [HZ Containers — stackability & corner castings](https://hz-containers.com/en/news/stackability-of-shipping-containers/)
