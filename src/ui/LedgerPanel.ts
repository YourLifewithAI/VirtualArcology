/**
 * The Tessera Ledger: live totals computed from whatever is currently placed,
 * using the per-module economics in catalog/stats.ts (see
 * docs/tessera-economics.md for sources). Every metric row expands on click
 * into a per-building breakdown showing exactly how the number is computed.
 */
import {
  COMPUTE_PRICE_PF_HR,
  computeLedger,
  ENERGY_PRICE_MWH,
  LABOR_PARTICIPATION,
  PARCELS_PER_RESIDENT,
  PRODUCE_T_PER_RESIDENT,
  RESIDENTS_PER_HOME,
  STATS,
  TRIPS_PER_RESIDENT,
  type ModuleStats,
} from '../catalog/stats';
import { getModule } from '../catalog/ModuleCatalog';
import { sourceChips } from '../catalog/sources';
import { rotatedFootprint } from '../tessera/Grid';
import type { TesseraMode } from '../tessera/TesseraMode';

type Fmt = (v: number) => string;

interface RowSpec {
  label: string;
  value: string;
  cls?: string;
  /** Expandable breakdown body (HTML) + formula note. */
  bd?: { body: string; note: string };
}

export class LedgerPanel {
  readonly el: HTMLDivElement;
  private open = false;
  private expanded = new Set<string>();

  constructor(
    parent: HTMLElement,
    private mode: TesseraMode,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'va-ledger';
    this.el.style.display = 'none';
    parent.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement).closest('.row.expandable') as HTMLElement | null;
      if (!row?.dataset.k) return;
      if (this.expanded.has(row.dataset.k)) this.expanded.delete(row.dataset.k);
      else this.expanded.add(row.dataset.k);
      this.refresh();
    });
  }

  toggle(): boolean {
    this.open = !this.open;
    this.el.style.display = this.open ? '' : 'none';
    if (this.open) this.refresh();
    return this.open;
  }

  /** Per-module-type contributions for one stat, formatted as breakdown rows. */
  private breakdown(defIds: string[], get: (s: ModuleStats) => number, fmt: Fmt): string {
    const byId = new Map<string, { count: number; per: number }>();
    for (const id of defIds) {
      const s = STATS[id];
      if (!s) continue;
      const v = get(s);
      if (!v) continue;
      const e = byId.get(id) ?? { count: 0, per: v };
      e.count++;
      byId.set(id, e);
    }
    const items = [...byId.entries()]
      .map(([id, e]) => ({ name: getModule(id)?.name ?? id, count: e.count, per: e.per, total: e.per * e.count }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    if (items.length === 0) return '<div class="bd-row muted"><span>nothing placed contributes</span><span></span></div>';
    const lines = items.slice(0, 12).map(
      (i) =>
        `<div class="bd-row"><span>${i.count}× ${i.name}</span><span>${
          i.count > 1 ? `${i.count} × ${fmt(i.per)} = ` : ''
        }${fmt(i.total)}</span></div>`,
    );
    if (items.length > 12) lines.push(`<div class="bd-row muted"><span>…and ${items.length - 12} more types</span><span></span></div>`);
    return lines.join('');
  }

  refresh(): void {
    if (!this.open) return;
    const placements = this.mode.grid.activePlacements();
    const defIds = placements.map(({ placed }) => placed.defId);
    const t = computeLedger(defIds);
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
    // NB: breakdown rows print "count × fmt(per) = fmt(total)", so every
    // formatter must keep enough precision at small values for the printed
    // equation to actually hold (street capex $60k, robot-depot sewer 0.8 m³/d…)
    const fmtMW: Fmt = (v) => (Math.abs(v) >= 1 ? `${v.toFixed(v >= 100 ? 0 : 1)} MW` : `${Math.round(v * 1000)} kW`);
    const fmtM3: Fmt = (v) => (Math.abs(v) >= 10 ? `${Math.round(v).toLocaleString()} m³/d` : `${v.toFixed(1)} m³/d`);
    const fmtPF: Fmt = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)} EF` : `${v.toLocaleString()} PF`);
    const fmtT: Fmt = (v) => (Math.abs(v) >= 10 ? `${Math.round(v).toLocaleString()} t/yr` : `${v.toFixed(1)} t/yr`);
    const fmtN: Fmt = (v) => v.toLocaleString();
    const fmtCap: Fmt = (v) =>
      v >= 1000 ? `$${(v / 1000).toFixed(2)}B` : v >= 1 ? `$${v.toFixed(v >= 10 ? 0 : 1)}M` : `$${Math.round(v * 1000)}k`;
    const fmtIncome: Fmt = (v) => (v >= 10 ? `~$${v.toFixed(0)}M/yr` : v >= 0.95 ? `~$${v.toFixed(1)}M/yr` : `~$${Math.max(1, Math.round(v * 1000))}k/yr`);
    const capex = fmtCap(t.capexM);
    const ef = t.computePF / 1000;
    const surplusPF = Math.max(0, t.computePF - t.computeUsePF);

    const rows: RowSpec[] = [
      { label: 'Site area', value: `${(siteM2 / 10000).toFixed(1)} ha · ${grid.width * 10}×${grid.depth * 10} m` },
      { label: 'Built / open', value: `${Math.round((builtCells / (grid.width * grid.depth)) * 100)}% built` },
      {
        label: 'Capital cost',
        value: capex,
        bd: {
          body: this.breakdown(defIds, (s) => s.capexM, fmtCap),
          note: 'Σ capital cost of every placed module.',
        },
      },
      {
        label: 'Residents housed',
        value: `${t.humans.toLocaleString()} (${t.homes.toLocaleString()} homes)`,
        bd: {
          body: this.breakdown(defIds, (s) => s.homes ?? 0, (v) => `${fmtN(v)} homes`),
          note: `Residents = homes × ${RESIDENTS_PER_HOME} (avg household size).`,
        },
      },
      {
        label: 'Jobs to run it',
        value: `${t.jobs.toLocaleString()} / ${t.laborForce.toLocaleString()} workers`,
        cls: t.jobs > t.laborForce ? 'bad' : 'good',
        bd: {
          body: this.breakdown(defIds, (s) => s.jobs ?? 0, (v) => `${fmtN(v)} jobs`),
          note: `Workers available = residents × ${Math.round(LABOR_PARTICIPATION * 100)}% labor participation.`,
        },
      },
      {
        label: 'AI citizens housed',
        value: `${aiHoused.toLocaleString()} of ${t.humans.toLocaleString()} target`,
        cls: aiHoused >= t.humans ? 'good' : '',
        bd: {
          body: this.breakdown(defIds, (s) => (s.aiHomes ?? 0) + (s.homes ?? 0), (v) => `${fmtN(v)} berths`),
          note: 'One domestic embodiment alcove per dwelling unit, plus Agent House civic capacity. Target: one embodied AI per human resident.',
        },
      },
      {
        label: 'Energy demand',
        value: fmtMW(t.useMW),
        bd: {
          body: this.breakdown(defIds, (s) => s.useMW ?? 0, fmtMW),
          note: 'Σ average electrical draw of every placed module (MW avg, not peak).',
        },
      },
      {
        label: 'Energy generation',
        value: fmtMW(t.genMW),
        cls: netMW >= 0 ? 'good' : 'bad',
        bd: {
          body: this.breakdown(defIds, (s) => s.genMW ?? 0, fmtMW),
          note: 'Σ average generation. Net export = generation − demand.',
        },
      },
      {
        label: 'Energy export income',
        value: netMW > 0 ? fmtIncome(t.energyExportMYr) : '—',
        cls: netMW > 0 ? 'good' : '',
        bd: {
          body: netMW > 0 ? `<div class="bd-row"><span>${fmtMW(netMW)} surplus</span><span>× 8,760 h × $${ENERGY_PRICE_MWH}/MWh</span></div>` : '<div class="bd-row muted"><span>no surplus to sell</span><span></span></div>',
          note: `Surplus MW × 8,760 h/yr × $${ENERGY_PRICE_MWH}/MWh wholesale. Firm SMR power may earn more; solar-heavy surplus less.`,
        },
      },
      {
        label: 'Local compute',
        value: ef >= 1 ? `${ef.toFixed(0)} EFLOPS FP8` : `${t.computePF.toFixed(0)} PFLOPS`,
        bd: {
          body: this.breakdown(defIds, (s) => s.computePF ?? 0, fmtPF),
          note: 'Σ installed compute of placed modules (FP8).',
        },
      },
      {
        label: 'Compute demand',
        value: `${(t.computeUsePF / 1000).toFixed(1)} EF (AI power users)`,
        cls: t.computeUsePF <= t.computePF ? 'good' : 'bad',
        bd: {
          body: this.breakdown(defIds, (s) => s.computeUsePF ?? 0, fmtPF),
          note: 'Every household and AI citizen modeled as a frontier power user (~2.5 PF each), plus industrial/civic loads.',
        },
      },
      {
        label: 'Compute export income',
        value: surplusPF > 0 ? fmtIncome(t.computeExportMYr) : '—',
        cls: surplusPF > 0 ? 'good' : '',
        bd: {
          body: surplusPF > 0 ? `<div class="bd-row"><span>${fmtPF(surplusPF)} surplus</span><span>× 8,760 h × $${COMPUTE_PRICE_PF_HR.toFixed(2)}/PF·h</span></div>` : '<div class="bd-row muted"><span>no surplus to sell</span><span></span></div>',
          note: `Surplus PFLOPS × 8,760 h/yr × $${COMPUTE_PRICE_PF_HR.toFixed(2)}/PF·h wholesale FP8. Assumes the export fiber path exists (comms mast / regional backbone).`,
        },
      },
      {
        label: 'Water',
        value: `${Math.round(t.waterUseM3d).toLocaleString()} / ${Math.round(t.waterCapM3d).toLocaleString()} m³/d cap`,
        cls: t.waterUseM3d <= t.waterCapM3d ? 'good' : 'bad',
        bd: {
          body:
            `<div class="bd-head">Demand</div>` +
            this.breakdown(defIds, (s) => Math.max(0, s.waterM3d ?? 0), fmtM3) +
            `<div class="bd-head">Supply capacity</div>` +
            this.breakdown(defIds, (s) => Math.max(0, -(s.waterM3d ?? 0)), fmtM3),
          note: 'Per-module demand vs supply capacity. Farms, homes, parks, and fabs all draw here — click through each building type above.',
        },
      },
      {
        label: 'Wastewater',
        value: `${Math.round(t.sewerUseM3d).toLocaleString()} / ${Math.round(t.sewerCapM3d).toLocaleString()} m³/d cap`,
        cls: t.sewerUseM3d <= t.sewerCapM3d ? 'good' : 'bad',
        bd: {
          body:
            `<div class="bd-head">Outflow</div>` +
            this.breakdown(defIds, (s) => Math.max(0, s.sewerM3d ?? 0), fmtM3) +
            `<div class="bd-head">Treatment capacity</div>` +
            this.breakdown(defIds, (s) => Math.max(0, -(s.sewerM3d ?? 0)), fmtM3),
          note: 'Sewage + runoff sent to treatment vs plant/bioswale capacity.',
        },
      },
      {
        label: 'Transit capacity',
        value: t.tripsCap > 0 || t.tripsDemand > 0 ? `${fmtN(t.tripsCap)} / ${fmtN(t.tripsDemand)} trips/d` : '—',
        cls: t.tripsCap >= t.tripsDemand ? 'good' : 'bad',
        bd: {
          body: this.breakdown(defIds, (s) => s.tripsDay ?? 0, (v) => `${fmtN(v)} trips/d`),
          note: `Demand = residents × ${TRIPS_PER_RESIDENT} motorized trips/day (most in-Tessera trips are walked). Capacity from AV depots + transit hub.`,
        },
      },
      {
        label: 'Delivery capacity',
        value: t.parcelsCap > 0 || t.parcelsDemand > 0 ? `${fmtN(t.parcelsCap)} / ${fmtN(t.parcelsDemand)} parcels/d` : '—',
        cls: t.parcelsCap >= t.parcelsDemand ? 'good' : 'bad',
        bd: {
          body: this.breakdown(defIds, (s) => s.parcelsDay ?? 0, (v) => `${fmtN(v)} parcels/d`),
          note: `Demand = residents × ${PARCELS_PER_RESIDENT} deliveries/day. Capacity from robot depots + the logistics hub.`,
        },
      },
      {
        label: 'Fresh produce',
        value: `${Math.round(t.foodT).toLocaleString()} t/yr · ${Math.round(t.foodCoverage * 100)}% of needs`,
        cls: t.foodCoverage >= 1 ? 'good' : '',
        bd: {
          body: this.breakdown(defIds, (s) => s.foodT ?? 0, fmtT),
          note: `Need = residents × ${PRODUCE_T_PER_RESIDENT} t fresh produce/yr. Staples (grain, oils) stay regional imports by design.`,
        },
      },
    ];

    const html = rows
      .map((r) => {
        const expandable = !!r.bd;
        const isOpen = expandable && this.expanded.has(r.label);
        const rowHtml = `<div class="row${expandable ? ' expandable' : ''}${isOpen ? ' open' : ''}"${
          expandable ? ` data-k="${r.label}"` : ''
        }><span>${expandable ? `<i class="chev">${isOpen ? '▾' : '▸'}</i>` : ''}${r.label}</span><span class="val ${r.cls ?? ''}">${r.value}</span></div>`;
        const bdHtml =
          isOpen && r.bd
            ? `<div class="bd">${r.bd.body}<div class="bd-note">${r.bd.note}</div>${sourceChips(r.label)}</div>`
            : '';
        return rowHtml + bdHtml;
      })
      .join('');
    this.el.innerHTML = `
      <h3>Tessera Ledger</h3>
      ${html}
      <div class="foot">Click any row for its per-building math and sources (◈ = worldbuilding assumption) · docs/tessera-economics.md</div>
    `;
  }

  setVisible(v: boolean): void {
    if (!v) {
      this.open = false;
      this.el.style.display = 'none';
    }
  }
}
