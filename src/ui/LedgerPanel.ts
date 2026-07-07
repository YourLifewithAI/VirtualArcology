/**
 * The Tessera Ledger: live totals computed from whatever is currently placed,
 * using the per-module economics in catalog/stats.ts (see
 * docs/tessera-economics.md for sources).
 */
import { computeLedger } from '../catalog/stats';
import { getModule } from '../catalog/ModuleCatalog';
import { rotatedFootprint } from '../tessera/Grid';
import type { TesseraMode } from '../tessera/TesseraMode';

export class LedgerPanel {
  readonly el: HTMLDivElement;
  private open = false;

  constructor(
    parent: HTMLElement,
    private mode: TesseraMode,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'va-ledger';
    this.el.style.display = 'none';
    parent.appendChild(this.el);
  }

  toggle(): boolean {
    this.open = !this.open;
    this.el.style.display = this.open ? '' : 'none';
    if (this.open) this.refresh();
    return this.open;
  }

  refresh(): void {
    if (!this.open) return;
    const placements = this.mode.grid.activePlacements();
    const t = computeLedger(placements.map(({ placed }) => placed.defId));
    const grid = this.mode.grid;
    const siteM2 = grid.width * grid.depth * 100;
    let builtCells = 0;
    for (const { placed } of placements) {
      const def = getModule(placed.defId);
      if (!def) continue;
      const { w, d } = rotatedFootprint(def, placed.rot);
      builtCells += w * d;
    }
    const aiHoused = t.aiDomestic + t.aiCivic;
    const netMW = t.genMW - t.useMW;
    const fmtMW = (v: number): string => `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} MW`;
    const capex = t.capexM >= 1000 ? `$${(t.capexM / 1000).toFixed(2)}B` : `$${t.capexM.toFixed(0)}M`;
    const ef = t.computePF / 1000;
    const row = (label: string, value: string, cls = ''): string =>
      `<div class="row"><span>${label}</span><span class="val ${cls}">${value}</span></div>`;
    this.el.innerHTML = `
      <h3>Tessera Ledger</h3>
      ${row('Site area', `${(siteM2 / 10000).toFixed(1)} ha · ${grid.width * 10}×${grid.depth * 10} m`)}
      ${row('Built / open', `${Math.round((builtCells / (grid.width * grid.depth)) * 100)}% built`)}
      ${row('Capital cost', capex)}
      ${row('Residents housed', `${t.humans.toLocaleString()} (${t.homes.toLocaleString()} homes)`)}
      ${row('Jobs to run it', `${t.jobs.toLocaleString()} / ${t.laborForce.toLocaleString()} workers`, t.jobs > t.laborForce ? 'bad' : 'good')}
      ${row('AI citizens housed', `${aiHoused.toLocaleString()} of ${t.humans.toLocaleString()} target`, aiHoused >= t.humans ? 'good' : '')}
      ${row('Energy demand', fmtMW(t.useMW))}
      ${row('Energy generation', fmtMW(t.genMW), netMW >= 0 ? 'good' : 'bad')}
      ${row('Net export', netMW >= 0 ? `+${fmtMW(netMW)}` : `−${fmtMW(-netMW)}`, netMW >= 0 ? 'good' : 'bad')}
      ${row('Local compute', ef >= 1 ? `${ef.toFixed(0)} EFLOPS FP8` : `${t.computePF.toFixed(0)} PFLOPS`)}
      ${row('Compute demand', `${(t.computeUsePF / 1000).toFixed(1)} EF (AI power users)`, t.computeUsePF <= t.computePF ? 'good' : 'bad')}
      ${row('Water', `${Math.round(t.waterUseM3d).toLocaleString()} / ${Math.round(t.waterCapM3d).toLocaleString()} m³/d cap`, t.waterUseM3d <= t.waterCapM3d ? 'good' : 'bad')}
      ${row('Wastewater', `${Math.round(t.sewerUseM3d).toLocaleString()} / ${Math.round(t.sewerCapM3d).toLocaleString()} m³/d cap`, t.sewerUseM3d <= t.sewerCapM3d ? 'good' : 'bad')}
      ${row('Fresh produce', `${Math.round(t.foodCoverage * 100)}% of residents' needs`, t.foodCoverage >= 1 ? 'good' : '')}
      <div class="foot">Live totals from placed modules · sources: docs/tessera-economics.md</div>
    `;
  }

  setVisible(v: boolean): void {
    if (!v) {
      this.open = false;
      this.el.style.display = 'none';
    }
  }
}
