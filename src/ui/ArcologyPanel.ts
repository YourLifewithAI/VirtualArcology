/** lil-gui parameter panel + program/shaft legend for the arcology viewer. */
import GUI from 'lil-gui';
import type { ArcologyMode } from '../arcology/ArcologyMode';
import { PRESETS, PROGRAM_COLORS, PROGRAM_LABELS, applyPreset, type PresetName, type ProgramKind } from '../arcology/params';
import { SHAFT_COLORS } from '../arcology/ElevatorPlanner';

const SHAFT_LEGEND: { key: keyof typeof SHAFT_COLORS; label: string }[] = [
  { key: 'multi', label: 'MULTI ropeless loops (all sky lobbies)' },
  { key: 'express', label: 'UltraRope express (SL5 / SL10)' },
  { key: 'local', label: 'Local banks (one tier each)' },
  { key: 'freight', label: 'Freight / service' },
  { key: 'evac', label: 'Evacuation (hardened)' },
  { key: 'sub', label: 'Sub-level service' },
];

export class ArcologyPanel {
  readonly gui: GUI;
  private legend: HTMLDivElement;
  private teleportFolder: GUI | null = null;
  private regenTimer: number | null = null;
  private state = { preset: 'knowledge-node' as PresetName };

  constructor(
    parent: HTMLElement,
    private mode: ArcologyMode,
    private onTeleport: (tierIndex: number) => void,
  ) {
    // autoPlace handles its own height/scroll correctly; repositioned via ui.css
    this.gui = new GUI({ title: 'Arcology One', width: 285 });

    const p = mode.params;
    const debounced = (): void => this.scheduleRegen();

    this.gui
      .add(this.state, 'preset', Object.keys(PRESETS))
      .name('Canon preset')
      .onChange((v: PresetName) => {
        applyPreset(p, v);
        this.mode.regenerate();
        this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
      });

    const massing = this.gui.addFolder('Massing');
    massing.add(p, 'baseSide', 2000, 8000, 1).name('Base side (m)').onChange(debounced);
    massing.add(p, 'tiers', 3, 14, 1).name('Tiers').onChange(debounced);
    massing.add(p, 'setback', 60, 320, 0.1).name('Setback/side (m)').onChange(debounced);
    massing.add(p, 'tierHeight', 60, 240, 1).name('Tier height (m)').onChange(debounced);
    massing.add(p, 'spireHeight', 0, 520, 1).name('Spire height (m)').onChange(debounced);
    massing.add(p, 'floorHeight', 3, 6, 0.01).name('Floor height (m)');

    const view = this.gui.addFolder('View');
    view.add(mode.view, 'xray').name('X-ray massing').onChange(() => mode.applyView());
    view.add(mode.view, 'showShafts').name('Elevator shafts').onChange(() => mode.applyView());
    view.add(mode.view, 'cut', 0, 1, 0.005).name('Cutaway').onChange(() => mode.applyView());

    this.legend = document.createElement('div');
    this.legend.className = 'va-legend';
    parent.appendChild(this.legend);
    this.renderLegend();

    this.rebuildTeleports();
    mode.onRegenerated = () => this.rebuildTeleports();
  }

  private scheduleRegen(): void {
    if (this.regenTimer !== null) window.clearTimeout(this.regenTimer);
    this.regenTimer = window.setTimeout(() => this.mode.regenerate(), 140);
  }

  private rebuildTeleports(): void {
    if (!this.teleportFolder) {
      this.teleportFolder = this.gui.addFolder('Walk a terrace');
    }
    [...this.teleportFolder.controllers].forEach((c) => c.destroy());
    const actions: Record<string, () => void> = {};
    for (const spawn of this.mode.tierSpawns) {
      actions[`Tier ${spawn.tier + 1} — ${Math.round(spawn.y)} m`] = () => this.onTeleport(spawn.tier);
    }
    for (const name of Object.keys(actions)) this.teleportFolder.add(actions, name);
  }

  private renderLegend(): void {
    const rowHtml = (color: number, label: string): string =>
      `<div class="row"><span class="swatch" style="background:#${color.toString(16).padStart(6, '0')}"></span>${label}</div>`;
    const programs = (Object.keys(PROGRAM_LABELS) as ProgramKind[])
      .map((k) => rowHtml(PROGRAM_COLORS[k], PROGRAM_LABELS[k]))
      .join('');
    const shafts = SHAFT_LEGEND.map((s) => rowHtml(SHAFT_COLORS[s.key], s.label)).join('');
    this.legend.innerHTML = `<h3>Tier program</h3>${programs}<h3>Vertical transport</h3>${shafts}<div class="row" style="margin-top:6px;opacity:.7">One representative core cluster shown —<br/>the real plate needs many.</div>`;
  }

  setVisible(v: boolean): void {
    this.gui.domElement.style.display = v ? '' : 'none';
    this.legend.style.display = v ? '' : 'none';
  }
}
