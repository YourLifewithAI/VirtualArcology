/** Layout JSON schema, serialization, validation and versioned migration. */
import type { Grid, PlacedModule } from './Grid';
import { CELL_SIZE } from './Grid';
import type { SiteTerrain } from './SiteTerrain';

export interface TerrainData {
  h: number[];
  water: [number, number][];
}

export interface TesseraLayout {
  format: 'tessera-layout';
  version: 2;
  grid: { width: number; depth: number; cellSize: number };
  modules: PlacedModule[];
  /** Optional landform (absent = flat, dry site). */
  terrain?: TerrainData;
}

export function serializeLayout(grid: Grid, site?: SiteTerrain): TesseraLayout {
  return {
    format: 'tessera-layout',
    version: 2,
    grid: { width: grid.width, depth: grid.depth, cellSize: CELL_SIZE },
    modules: grid.activePlacements().map(({ placed }) => ({ ...placed })),
    terrain: site?.serialize(),
  };
}

/** Parse + validate unknown JSON into a layout; throws with a readable message. */
export function parseLayout(json: unknown): TesseraLayout {
  const migrated = migrate(json);
  const layout = migrated as TesseraLayout;
  if (layout.format !== 'tessera-layout') throw new Error('Not a tessera-layout file');
  if (!Array.isArray(layout.modules)) throw new Error('Layout has no modules array');
  for (const m of layout.modules) {
    if (typeof m.defId !== 'string' || typeof m.x !== 'number' || typeof m.z !== 'number') {
      throw new Error('Malformed module entry in layout');
    }
    if (typeof m.seed !== 'number') m.seed = 1;
    if (m.rot !== 0 && m.rot !== 1 && m.rot !== 2 && m.rot !== 3) m.rot = 0;
  }
  if (layout.terrain && !Array.isArray(layout.terrain.h)) delete layout.terrain;
  return layout;
}

function migrate(json: unknown): unknown {
  const obj = json as { version?: number };
  switch (obj?.version) {
    case 1: {
      // v1 = pre-terrain; flat site
      const layout = json as Record<string, unknown>;
      layout.version = 2;
      return layout;
    }
    case 2:
      return json;
    default:
      // future versions land here
      return json;
  }
}
