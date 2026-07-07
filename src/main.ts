import './ui/ui.css';
import { App } from './core/App';
import { registerAllModules } from './catalog/modules/index';
import { TesseraMode } from './tessera/TesseraMode';
import { PlacementController } from './tessera/PlacementController';
import { Persistence } from './tessera/Persistence';
import { serializeLayout, parseLayout } from './tessera/Layout';
import { DEMO_LAYOUT } from './tessera/demoLayout';
import { Toolbar } from './ui/Toolbar';
import { PalettePanel } from './ui/PalettePanel';
import { Hud } from './ui/Hud';
import { InfoPanel } from './ui/InfoPanel';
import { LedgerPanel } from './ui/LedgerPanel';
import { UtilitiesPanel } from './ui/UtilitiesPanel';
import { Compass } from './ui/Compass';
import { SiteDefiner } from './tessera/SiteDefiner';
import type { ModuleDef } from './catalog/types';
import { getModule } from './catalog/ModuleCatalog';
import { WalkthroughController } from './walkthrough/WalkthroughController';
import { GridCollision } from './walkthrough/GridCollision';
import { ArcologyMode } from './arcology/ArcologyMode';
import { ArcologyPanel } from './ui/ArcologyPanel';
import { Robots } from './tessera/Robots';
import { Clouds } from './tessera/Clouds';

const params = new URLSearchParams(location.search);

registerAllModules();

const container = document.getElementById('app')!;
const uiRoot = document.getElementById('ui-root')!;
const app = new App(container);
if (params.get('freeze') === '1') app.animate = false;

const tessera = new TesseraMode(app);
const placement = new PlacementController(app, tessera);
const persistence = new Persistence(tessera);

const hud = new Hud(uiRoot, app);
const infoPanel = new InfoPanel(uiRoot);
const ledger = new LedgerPanel(uiRoot, tessera);
const utilitiesPanel = new UtilitiesPanel(uiRoot);
new Compass(uiRoot, app);
const siteDefiner = new SiteDefiner(app, tessera, uiRoot);
let inspectedDef: ModuleDef | null = null;

siteDefiner.onConfirm = (w, d) => {
  tessera.resizeGrid(w, d);
  placement.resetHistory();
  placement.revalidateInspection();
  hud.showToast(`Fresh ${w * 10} × ${d * 10} m site — build away`);
};
siteDefiner.onExit = () => {
  placement.suspended = walkthrough.state !== 'off';
  updateHint();
};
const walkthrough = new WalkthroughController(app);

placement.onInspect = (index, placed) => {
  if (index !== null && placed) {
    const def = getModule(placed.defId);
    if (def) {
      inspectedDef = def;
      infoPanel.show(def, placed);
      if (utilitiesPanel.visible) utilitiesPanel.show(def);
      return;
    }
  }
  inspectedDef = null;
  infoPanel.hide();
  utilitiesPanel.hide();
};
infoPanel.onUtilities = () => {
  if (utilitiesPanel.visible) utilitiesPanel.hide();
  else if (inspectedDef) utilitiesPanel.show(inspectedDef);
};
infoPanel.onClose = () => placement.inspect(null);
infoPanel.onDelete = () => placement.removeInspected();
infoPanel.onMove = () => placement.startMoveInspected();
infoPanel.onRotate = () => {
  if (!placement.rotateInspected()) hud.showToast('No room to rotate here');
};

// pause/resume overlay
const overlay = document.createElement('div');
overlay.className = 'va-overlay';
overlay.innerHTML = `<div class="card"><b>Paused</b><br/>Click to resume walking<br/><span style="opacity:.7">Press <b>Tab</b> to leave walk mode</span></div>`;
overlay.onclick = () => walkthrough.resume();
uiRoot.appendChild(overlay);

// ---- arcology mode (lazy) ---------------------------------------------------
let arcology: ArcologyMode | null = null;
let arcologyPanel: ArcologyPanel | null = null;

function ensureArcology(): ArcologyMode {
  if (!arcology) {
    arcology = new ArcologyMode(app);
    arcology.registerAnimatable({ update: (dt) => walkthrough.update(dt) });
    arcologyPanel = new ArcologyPanel(uiRoot, arcology, (tierIndex) => {
      const spawn = arcology!.tierSpawns.find((s) => s.tier === tierIndex);
      if (!spawn) return;
      placement.suspended = true;
      walkthrough.enter(arcology!.terraceSurface(spawn), spawn.spawn);
    });
  }
  return arcology;
}

function setAppMode(mode: 'tessera' | 'arcology'): void {
  if (walkthrough.state !== 'off') walkthrough.exit();
  if (mode === 'arcology') {
    placement.inspect(null);
    app.setMode(ensureArcology());
    palette.setVisible(false);
    arcologyPanel?.setVisible(true);
    hud.setHint('Drag to orbit · scroll to zoom · use the panel for x-ray, cutaway and terrace walks');
  } else {
    app.setMode(tessera);
    palette.setVisible(true);
    arcologyPanel?.setVisible(false);
    updateHint();
  }
  if (mode === 'arcology') ledger.setVisible(false);
  toolbar.setActiveMode(mode);
}

function startWalk(): void {
  if (app.activeMode?.id === 'arcology' && arcology) {
    const spawn = arcology.tierSpawns[Math.min(4, arcology.tierSpawns.length - 1)];
    if (spawn) {
      placement.suspended = true;
      walkthrough.enter(arcology.terraceSurface(spawn), spawn.spawn);
    }
    return;
  }
  const target = app.rig.orbit.target;
  const site = (tessera.grid.width * 10) / 2 - 5;
  const spawn = {
    x: Math.max(-site, Math.min(site, target.x)),
    y: 0,
    z: Math.max(-site, Math.min(site, target.z)),
  };
  placement.select(null);
  placement.inspect(null);
  placement.suspended = true;
  walkthrough.enter(new GridCollision(tessera.grid), spawn);
}

walkthrough.onStateChanged = (state) => {
  overlay.style.display = state === 'paused' ? 'flex' : 'none';
  hud.setCrosshair(state === 'walking');
  palette.setVisible(state === 'off');
  if (state === 'walking') {
    hud.setHint('<b>WASD</b> move · <b>Shift</b> run · <b>F</b> fly (Q/E up/down) · <b>Esc</b> pause · <b>Tab</b> exit');
  } else if (state === 'off') {
    placement.suspended = false;
    updateHint();
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (walkthrough.state === 'off') startWalk();
    else walkthrough.exit();
  }
});

const toolbar = new Toolbar(uiRoot, {
  setMode: (mode) => setAppMode(mode),
  save: () => persistence.download(),
  load: () =>
    persistence.openFilePicker(
      () => {
        placement.resetHistory();
        placement.revalidateInspection();
        hud.showToast('Layout loaded');
      },
      (msg) => hud.showToast(`Load failed: ${msg}`),
    ),
  clear: () => {
    tessera.clearAll();
    placement.resetHistory();
    placement.revalidateInspection();
  },
  undo: () => placement.undo(),
  redo: () => placement.redo(),
  walk: () => {
    if (walkthrough.state === 'off') startWalk();
    else walkthrough.exit();
  },
  toggleGrid: (() => {
    let visible = true;
    return () => {
      visible = !visible;
      tessera.setGridVisible(visible);
    };
  })(),
  toggleLedger: () => ledger.toggle(),
  togglePipes: () => {
    tessera.setUtilityView(!tessera.utilityView);
    return tessera.utilityView;
  },
  newSite: () => {
    if (walkthrough.state !== 'off') walkthrough.exit();
    placement.select(null);
    placement.inspect(null);
    placement.suspended = true;
    siteDefiner.begin();
  },
  canUndo: () => placement.canUndo(),
  canRedo: () => placement.canRedo(),
});

const palette = new PalettePanel(uiRoot, placement);

placement.onStateChanged = () => {
  palette.refresh();
  toolbar.refresh();
  updateHint();
};

function updateHint(): void {
  if (placement.isMoving) {
    hud.setHint('<b>Click</b> drop building · <b>R</b> rotate · <b>Esc</b> put it back');
  } else if (placement.selected) {
    hud.setHint('<b>Click</b> place · <b>R</b> rotate · <b>Right-click</b> delete · <b>Esc</b> deselect');
  } else {
    hud.setHint('<b>Click</b> a building to inspect it · pick a module from the palette to build · <b>Right-click</b> deletes');
  }
}
updateHint();

tessera.registerAnimatable({ update: (dt) => walkthrough.update(dt) });
tessera.registerAnimatable(new Robots(tessera));
tessera.registerAnimatable(new Clouds(tessera.scene));

// ---- boot layout -----------------------------------------------------------
tessera.onLayoutChanged = () => {
  persistence.scheduleAutosave();
  ledger.refresh();
};

if (params.get('empty') === '1') {
  // start blank (harness scenario)
} else if (params.get('demo') === '1') {
  tessera.loadPlacements(DEMO_LAYOUT);
} else {
  const autosave = persistence.loadAutosave();
  if (autosave && autosave.modules.length > 0) {
    persistence.applyLayout(autosave);
  } else {
    tessera.loadPlacements(DEMO_LAYOUT);
  }
}
placement.resetHistory();

if (params.get('mode') === 'arcology') {
  const arc = ensureArcology();
  arc.view.xray = params.get('xray') === '1';
  arc.view.showShafts = params.get('shafts') === '1' || arc.view.xray;
  const cut = parseFloat(params.get('cut') ?? '');
  if (!Number.isNaN(cut)) arc.view.cut = cut;
  arc.applyView();
  setAppMode('arcology');
} else {
  setAppMode('tessera');
}

app.onFirstFrame(() => {
  const loading = document.getElementById('loading');
  if (loading) loading.style.opacity = '0';
  (window as unknown as Record<string, unknown>).__ARC_READY__ = true;
});

// Harness / debugging interface
(window as unknown as Record<string, unknown>).__arc = {
  app,
  tessera,
  placement,
  stats: () => app.stats(),
  serialize: () => serializeLayout(tessera.grid),
  loadLayout: (json: unknown) => {
    persistence.applyLayout(parseLayout(json));
  },
};
