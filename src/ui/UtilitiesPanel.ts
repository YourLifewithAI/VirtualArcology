/**
 * Per-building utilities detail: expands from a tab on the inspector.
 * Shows energy, compute (residents modeled as AI power users), water and
 * wastewater for the selected building, with shares of Tessera capacity.
 */
import { PARCELS_PER_RESIDENT, STATS, TRIPS_PER_RESIDENT } from '../catalog/stats';
import type { ModuleDef } from '../catalog/types';

export class UtilitiesPanel {
  readonly el: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'va-utilities';
    this.el.style.display = 'none';
    parent.appendChild(this.el);
  }

  show(def: ModuleDef): void {
    const s = STATS[def.id];
    if (!s) {
      this.hide();
      return;
    }
    const rows: string[] = [];
    const row = (label: string, value: string): void => {
      rows.push(`<div class="row"><span>${label}</span><span class="val">${value}</span></div>`);
    };
    const kw = (mw?: number): string => (mw ? (mw >= 1 ? `${mw.toFixed(1)} MW` : `${Math.round(mw * 1000)} kW`) : '—');

    row('Energy draw (avg)', kw(s.useMW));
    if (s.genMW) row('Energy generated', kw(s.genMW));
    if (s.computePF) row('Compute provided', `${(s.computePF / 1000).toFixed(0)} EFLOPS`);
    row('Compute demand', s.computeUsePF ? `${s.computeUsePF.toLocaleString()} PFLOPS` : '—');
    if (s.homes) row('· basis', `${s.homes} households × ~2.5 PF`);
    if (s.aiHomes) row('· basis', `${s.aiHomes} AI citizens × ~2.5 PF`);

    const water = s.waterM3d ?? 0;
    if (water >= 0) row('Water demand', water ? `${water.toLocaleString()} m³/day` : '—');
    else row('Water supply capacity', `${(-water).toLocaleString()} m³/day`);
    const sewer = s.sewerM3d ?? 0;
    if (sewer >= 0) row('Wastewater out', sewer ? `${sewer.toLocaleString()} m³/day` : '—');
    else row('Treatment capacity', `${(-sewer).toLocaleString()} m³/day`);

    if (s.tripsDay) {
      row('Transit capacity', `${s.tripsDay.toLocaleString()} trips/day`);
      row('· serves', `~${Math.round(s.tripsDay / TRIPS_PER_RESIDENT).toLocaleString()} residents at ${TRIPS_PER_RESIDENT} trips/day`);
    }
    if (s.parcelsDay) {
      row('Delivery capacity', `${s.parcelsDay.toLocaleString()} parcels/day`);
      row('· serves', `~${Math.round(s.parcelsDay / PARCELS_PER_RESIDENT).toLocaleString()} residents at ${PARCELS_PER_RESIDENT} parcels/day`);
    }

    row('Capital cost', s.capexM >= 1000 ? `$${(s.capexM / 1000).toFixed(1)}B` : `$${s.capexM}M`);
    if (s.jobs) row('Jobs', `${s.jobs}`);

    this.el.innerHTML = `<h3>Utilities — ${def.name}</h3>${rows.join('')}
      <div class="note">Compute demand assumes every resident household (and AI citizen) is a frontier "power user" (~2.5 PFLOPS FP8 continuous each, ≈1 dedicated GPU). Sources: docs/tessera-economics.md.</div>`;
    this.el.style.display = '';
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  get visible(): boolean {
    return this.el.style.display !== 'none';
  }
}
