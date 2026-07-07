/** Right-hand building inspector: shown when a placed module is selected. */
import { CATEGORY_LABELS } from '../catalog/types';
import type { ModuleDef } from '../catalog/types';
import { LORE, LORE_FALLBACK } from '../catalog/lore';
import type { PlacedModule } from '../tessera/Grid';

export class InfoPanel {
  readonly el: HTMLDivElement;
  /** Called when the user hits the panel's delete button. */
  onDelete: (() => void) | null = null;
  onClose: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'va-info';
    this.el.style.display = 'none';
    parent.appendChild(this.el);
  }

  show(def: ModuleDef, placed: PlacedModule): void {
    const lore = LORE[def.id] ?? LORE_FALLBACK;
    const size = `${def.footprint.w * 10}×${def.footprint.d * 10} m`;
    this.el.innerHTML = `
      <button class="va-info-close" title="Close (Esc)">×</button>
      <div class="va-info-cat">${CATEGORY_LABELS[def.category]}</div>
      <h2>${def.name}</h2>
      <div class="va-info-meta">${size} footprint · ${Math.round(def.height)} m tall${def.walkable ? ' · walkable' : ''}</div>
      <p class="va-info-desc">${def.description}</p>
      <h3>Purpose</h3>
      <p>${lore.purpose}</p>
      <h3>In the Tessera → toward the Arcology</h3>
      <p>${lore.contributes}</p>
      <div class="va-info-actions">
        <button class="va-btn va-info-delete">Remove building</button>
      </div>
      <div class="va-info-foot">grid ${placed.x},${placed.z} · rotation ${placed.rot * 90}°</div>
    `;
    (this.el.querySelector('.va-info-close') as HTMLButtonElement).onclick = () => this.onClose?.();
    (this.el.querySelector('.va-info-delete') as HTMLButtonElement).onclick = () => this.onDelete?.();
    this.el.style.display = '';
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  get visible(): boolean {
    return this.el.style.display !== 'none';
  }
}
