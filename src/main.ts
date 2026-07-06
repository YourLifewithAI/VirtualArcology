import { App } from './core/App';
import { registerAllModules } from './catalog/modules/index';
import { TesseraMode } from './tessera/TesseraMode';
import type { PlacedModule } from './tessera/Grid';

const params = new URLSearchParams(location.search);

registerAllModules();

const container = document.getElementById('app')!;
const app = new App(container);
if (params.get('freeze') === '1') app.animate = false;

const tessera = new TesseraMode(app);

// Temporary boot content until the demo layout milestone: a few reference blocks.
if (params.get('demo') === '1') {
  const demo: PlacedModule[] = [
    { defId: 'apt-terrace', x: 10, z: 10, rot: 0, seed: 101 },
    { defId: 'apt-terrace', x: 14, z: 10, rot: 0, seed: 102 },
    { defId: 'apt-terrace', x: 10, z: 14, rot: 1, seed: 103 },
    { defId: 'apt-terrace', x: 20, z: 12, rot: 2, seed: 104 },
  ];
  tessera.loadPlacements(demo);
}

app.setMode(tessera);

app.onFirstFrame(() => {
  const loading = document.getElementById('loading');
  if (loading) loading.style.opacity = '0';
  (window as unknown as Record<string, unknown>).__ARC_READY__ = true;
});

// Harness / debugging interface
(window as unknown as Record<string, unknown>).__arc = {
  app,
  tessera,
  stats: () => app.stats(),
};
