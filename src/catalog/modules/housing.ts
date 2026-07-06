/**
 * Housing modules. `apt-terrace` is the reference implementation for the
 * whole catalog: compose parts via PartsBuilder, use rng for all variation,
 * stay inside the footprint, return builder.merge().
 */
import { PartsBuilder } from '../../core/geo';
import type { ModuleDef } from '../types';
import { facadeWindows, groundSlab, mural, parapet, solarRoof } from '../parts';

const aptTerrace: ModuleDef = {
  id: 'apt-terrace',
  name: 'Terrace Apartments',
  category: 'housing',
  description: '4-story mass-timber block with green roof, rooftop solar and balconies',
  footprint: { w: 3, d: 3 },
  height: 16,
  build(rng) {
    const b = new PartsBuilder();
    const W = 24;
    const D = 19;
    const floorH = 3.1;
    const floors = 4;

    groundSlab(b, 3, 3, 'path');

    // stacked floor slabs with alternating inset for shadow lines
    for (let f = 0; f < floors; f++) {
      const inset = f % 2 === 1 ? 0.35 : 0;
      b.box(W - inset * 2, floorH, D - inset * 2, f % 2 === 1 ? 'timberDark' : 'timber', {
        y: f * floorH,
      });
    }
    const roofY = floors * floorH;

    // windows on all four facades
    for (const [ry, cx, cz, len] of [
      [0, 0, D / 2, W],
      [Math.PI, 0, -D / 2, W],
      [Math.PI / 2, W / 2, 0, D],
      [-Math.PI / 2, -W / 2, 0, D],
    ] as const) {
      facadeWindows(b, rng, {
        width: len - 3,
        y0: 0.9,
        rows: floors,
        rowHeight: floorH,
        x: cx,
        z: cz,
        ry,
        offset: 0.06,
        litRatio: 0.2,
      });
    }

    // south balconies: slab + railing per floor
    for (let f = 1; f < floors; f++) {
      for (const sx of [-W / 4, W / 4]) {
        b.box(4.4, 0.18, 1.7, 'creamDark', { x: sx, z: D / 2 + 0.85, y: f * floorH - 0.18 });
        b.box(4.4, 0.85, 0.08, 'cream', { x: sx, z: D / 2 + 1.7, y: f * floorH });
      }
    }

    // entrance
    b.quad(2.4, 2.6, 'timberDark', { z: D / 2 + 0.07, y: 0.1 });
    b.box(3.6, 0.15, 2.2, 'concrete', { z: D / 2 + 1, y: 0 });

    // green roof + parapet + solar + stair head
    b.box(W - 1.4, 0.3, D - 1.4, 'leaf', { y: roofY });
    parapet(b, W, D, roofY, 'creamDark');
    solarRoof(b, W * 0.5, D * 0.55, roofY + 0.3, { x: -W * 0.18 });
    b.box(3, 2.3, 2.6, 'cream', { x: W / 2 - 2.6, z: -D / 2 + 2.4, y: roofY + 0.3 });

    // occasionally a gable mural on one end wall
    if (rng.chance(0.5)) {
      mural(b, rng, D * 0.6, floors * floorH * 0.7, -W / 2, 0, -Math.PI / 2, 0.07, 1.2);
    }

    // yard trees
    b.instance('tree', -W / 2 - 2.2, 0, D / 2 + 2.5, rng.float(0, Math.PI * 2), rng.float(0.9, 1.15));
    b.instance('shrub', W / 2 + 2, 0, D / 2 + 3, 0, rng.float(0.9, 1.4));

    return b.merge();
  },
};

const modules: ModuleDef[] = [aptTerrace];
export default modules;
