/**
 * The bundled example Tessera — the app always opens on a real neighborhood.
 *
 * Site plan (48x48 cells, north = low z):
 *  - z 0..11   industrial quarter: chip fab + full support chain, robotics
 *              fab, energy production, data center, logistics
 *  - z 12..41  street lattice with four residential/civic quadrants around
 *              a central plaza; greenhouse belt along the west edge
 *  - z 42..47  south meadow: orchards, parks, bioswale run, solar field
 */
import type { PlacedModule, Rotation } from './Grid';

const L: PlacedModule[] = [];
let seed = 1000;

function put(defId: string, x: number, z: number, rot: Rotation = 0): void {
  L.push({ defId, x, z, rot, seed: seed++ });
}

// ---- street lattice (robots route over these) ----
for (const z of [12, 22, 32, 42]) {
  for (let x = 2; x <= 45; x++) put('street', x, z);
}
for (const x of [8, 18, 28, 38]) {
  for (let z = 13; z <= 41; z++) {
    if (z === 22 || z === 32) continue; // row already there
    put('street', x, z);
  }
}

// ---- industrial quarter (north band, z 0..11) ----
put('chip-fab', 2, 1, 1); // rotated: 12 wide x 8 deep
put('upw-plant', 15, 1);
put('gas-farm', 15, 6, 1); // rotated: 3x4
put('cooling-towers', 19, 6);
put('chem-storage', 19, 1);
put('wastewater', 22, 1);
put('solar-field', 22, 6);
put('robotics-fab', 27, 1, 1); // rotated: 8 wide x 6 deep
put('logistics-hub', 27, 7);
put('water-tower', 32, 8);
put('data-center', 36, 1);
put('comms-mast', 42, 1);
put('substation', 36, 6);
put('battery-yard', 40, 6);
put('smr', 43, 3);
put('tree-row', 2, 10);
put('tree-row', 3, 10);
put('bioswale', 12, 10);
put('bioswale', 13, 10);
put('bioswale', 14, 10);

// ---- NW quadrant (z 13..21) ----
put('apt-court', 3, 14);
put('apt-terrace', 9, 14);
put('apt-terrace', 13, 14);
put('apt-terrace', 9, 18, 1);
put('park', 13, 18);
put('apt-tower', 15, 18);
put('tree-row', 2, 13);
put('tree-row', 7, 19);
put('solar-canopy', 2, 19);

// ---- NE quadrant (z 13..21) ----
put('commons', 23, 14);
put('apt-terrace', 19, 17, 2);
put('vertical-farm', 26, 17);
put('park', 19, 13);
put('apt-terrace', 29, 14);
put('apt-terrace', 33, 14);
put('apt-court', 34, 17);
put('apt-terrace', 29, 18, 3);
put('apt-tower', 42, 14);
put('apt-terrace', 39, 16, 1);
put('orchard', 43, 17);
put('solar-canopy', 39, 13);
put('tree-row', 21, 13);
put('tree-row', 33, 13);

// ---- central plaza cluster ----
put('plaza', 22, 26);
put('clinic', 19, 26);
put('market-row', 22, 30);
put('market-row', 24, 30);
put('robot-depot', 26, 30);
put('commons', 25, 23, 1);
put('tree-row', 26, 26);
put('tree-row', 26, 27);

// ---- SW quadrant (z 23..31) + west greenhouse belt ----
put('greenhouse', 2, 23);
put('vertical-farm', 5, 23);
put('greenhouse', 2, 26);
put('orchard', 5, 26);
put('aquaponics', 2, 29);
put('vertical-farm', 5, 29);
put('apt-terrace', 9, 23);
put('apt-terrace', 13, 23);
put('apt-court', 12, 26);
put('apt-terrace', 9, 27, 2);
put('park', 9, 30);
put('tree-row', 16, 30);
put('tree-row', 16, 23);

// ---- SE quadrant (z 23..31) ----
put('apt-terrace', 29, 23);
put('apt-terrace', 33, 23);
put('apt-court', 39, 23);
put('apt-tower', 43, 23, 1);
put('park', 29, 27);
put('apt-terrace', 31, 27, 1);
put('apt-terrace', 35, 27, 3);
put('solar-canopy', 39, 28);
put('orchard', 43, 26);
put('battery-yard', 43, 30);
put('tree-row', 42, 29);
put('tree-row', 34, 30);

// ---- south band (z 33..41) ----
put('makerspace', 19, 33);
put('robot-depot', 24, 33);
put('aquaponics', 24, 35, 1);
put('apt-court', 2, 33);
put('apt-terrace', 9, 33);
put('apt-terrace', 13, 33);
put('apt-terrace', 9, 37, 1);
put('apt-terrace', 13, 37, 2);
put('greenhouse', 2, 38);
put('orchard', 6, 38);
put('park', 19, 37);
put('vertical-farm', 22, 37);
put('market-row', 24, 40);
put('apt-court', 29, 34);
put('apt-terrace', 34, 34, 1);
put('apt-tower', 34, 38);
put('park', 30, 39);
put('apt-terrace', 39, 34, 3);
put('solar-canopy', 43, 34);
put('apt-terrace', 43, 37);
put('vertical-farm', 39, 38);
put('tree-row', 37, 33);
put('tree-row', 26, 39);

// ---- south meadow (z 43..47) ----
for (let x = 2; x <= 8; x++) put('bioswale', x, 43);
put('orchard', 10, 43);
put('orchard', 12, 45);
put('park', 15, 43);
put('orchard', 20, 44);
put('park', 24, 43);
put('tree-row', 28, 43);
put('tree-row', 29, 43);
put('orchard', 31, 44);
put('park', 35, 43);
put('solar-field', 42, 43);
put('tree-row', 39, 44);

// ============================================================================
// Phase 2 expansion (grid 48 -> 56): transit hub on the rail edge, eastern
// civic district (school, pools, venue, library, grocery, agent houses),
// closed-loop industry (foundry, RAS fishery, mycology), and a southern
// housing row that closes the Phase 1 housing shortage.
// ============================================================================

// extend the street lattice east and add a southern row
for (const z of [12, 22, 32, 42]) {
  for (let x = 46; x <= 53; x++) put('street', x, z);
}
for (let z = 13; z <= 41; z++) {
  if (z === 22 || z === 32) continue;
  put('street', 48, z);
}
for (let x = 2; x <= 53; x++) put('street', x, 48);

// rail edge + closed-loop industry (northeast)
put('transit-hub', 46, 0);
put('foundry', 48, 4);
put('ras-fishery', 52, 4);
put('mycology', 52, 7);
put('battery-yard', 52, 10);
put('solar-field', 48, 8);

// eastern civic district
put('library', 46, 13);
put('school', 49, 13);
put('grocery', 46, 16);
put('natatorium', 49, 17);
put('venue', 52, 17);
put('tree-row', 46, 19);
put('tree-row', 46, 20);

// AI citizens' civic housing near the district
put('agent-house', 49, 23);
put('agent-house', 52, 23);

// eastern housing infill
put('apt-tower', 46, 23);
put('apt-tower', 46, 26);
put('apt-terrace', 49, 27);
put('apt-terrace', 52, 27, 1);
put('park', 46, 29);
put('apt-terrace', 49, 33, 2);
put('apt-court', 52, 33);
put('apt-terrace', 49, 37);
put('apt-tower', 46, 33);
put('orchard', 46, 36);
put('tree-row', 46, 39);
put('tree-row', 46, 40);
put('park', 52, 38);

// east meadow food belt
put('orchard', 46, 43);
put('greenhouse', 49, 43);
put('vertical-farm', 52, 43);

// emergency services in the old south band gap
put('fire-station', 15, 40);

// southern housing row (z 49+)
put('apt-court', 3, 49);
put('apt-court', 9, 49);
put('apt-terrace', 15, 49);
put('apt-terrace', 19, 49);
put('apt-court', 24, 49);
put('apt-terrace', 30, 49, 1);
put('apt-terrace', 34, 49);
put('apt-court', 39, 49);
put('apt-tower', 44, 49);
put('agent-house', 47, 49);
put('apt-terrace', 51, 49, 3);

// far-south green edge
put('park', 4, 53);
put('orchard', 10, 53);
put('park', 16, 53);
for (let x = 20; x <= 27; x++) put('bioswale', x, 53);
put('park', 30, 53);
put('orchard', 36, 53);
put('solar-canopy', 40, 53);
put('orchard', 44, 53);
put('tree-row', 48, 53);
put('tree-row', 49, 53);
put('vertical-farm', 52, 53);

// ============================================================================
// Phase 4: connect the southern street row (z 48) to the main lattice.
// Utility routing exposed it as an island — the whole southern housing row
// couldn't reach the plants. Three connector streets through the south meadow.
// ============================================================================
for (const x of [18, 38, 48]) {
  for (let z = 43; z <= 47; z++) put('street', x, z);
}

// ============================================================================
// Phase 5: the mass-transit seed — AV shuttle depots spread around town.
// Six-seater pods loop between these and the transit hub over the street
// lattice, the ground-floor version of the arcology's transport spine.
// ============================================================================
put('av-depot', 16, 26); // center-west, on the x18 spine
put('av-depot', 42, 19); // northeast quadrant
put('av-depot', 26, 33); // south of the plaza
put('av-depot', 28, 46); // south meadow, on the z48 row
put('av-depot', 52, 20); // eastern civic district
// station access road so the transit hub itself anchors the shuttle
// network: west along the platform, then south past the SMR campus to
// the z12 spine (the x47 corridor is blocked by the SMR footprint)
for (const [x, z] of [[45, 1], [44, 1], [43, 1], [43, 2], [42, 2]] as const) put('street', x, z);
for (let z = 3; z <= 11; z++) put('street', 42, z);

export const DEMO_LAYOUT: PlacedModule[] = L;
