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

export const DEMO_LAYOUT: PlacedModule[] = L;
