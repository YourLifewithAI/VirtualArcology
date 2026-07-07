import { CATEGORIES, CATEGORY_LABELS } from '../catalog/types';
import { modulesByCategory } from '../catalog/ModuleCatalog';
import type { PlacementController } from '../tessera/PlacementController';

export class PalettePanel {
  readonly el: HTMLDivElement;
  private buttons = new Map<string, HTMLButtonElement>();

  constructor(
    parent: HTMLElement,
    private placement: PlacementController,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'va-palette';
    parent.appendChild(this.el);

    for (const cat of CATEGORIES) {
      const modules = modulesByCategory(cat);
      if (modules.length === 0) continue;
      const h = document.createElement('h2');
      h.textContent = CATEGORY_LABELS[cat];
      this.el.appendChild(h);
      for (const def of modules) {
        const btn = document.createElement('button');
        btn.className = 'va-module-btn';
        btn.title = def.description;
        btn.innerHTML = `<span>${def.name}</span><span class="fp">${def.footprint.w}×${def.footprint.d}</span>`;
        btn.onclick = () => {
          placement.select(placement.selected === def.id ? null : def.id);
        };
        this.el.appendChild(btn);
        this.buttons.set(def.id, btn);
      }
    }

    placement.onStateChanged = () => this.refresh();
  }

  refresh(): void {
    for (const [id, btn] of this.buttons) {
      btn.classList.toggle('selected', this.placement.selected === id);
    }
  }

  setVisible(v: boolean): void {
    this.el.style.display = v ? '' : 'none';
  }
}
