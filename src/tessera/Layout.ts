/** Layout JSON schema, serialization, validation and versioned migration. */
import type { Grid, PlacedModule } from './Grid';
import { CELL_SIZE } from './Grid';

export interface TesseraLayout {
  format: 'tessera-layout';
  version: 1;
  grid: { width: number; depth: number; cellSize: number };
  modules: PlacedModule[];
}

export function serializeLayout(grid: Grid): TesseraLayout {
  return {
    format: 'tessera-layout',
    version: 1,
    grid: { width: grid.width, depth: grid.depth, cellSize: CELL_SIZE },
    modules: grid.activePlacements().map(({ placed }) => ({ ...placed })),
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
  return layout;
}

function migrate(json: unknown): unknown {
  const obj = json as { version?: number };
  switch (obj?.version) {
    case 1:
      return json;
    default:
      // future versions land here
      return json;
  }
}
