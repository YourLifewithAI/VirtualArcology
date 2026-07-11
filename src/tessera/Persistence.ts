/** Save = JSON download; Load = file picker; autosave = debounced localStorage. */
import type { TesseraMode } from './TesseraMode';
import { parseLayout, serializeLayout, type TesseraLayout } from './Layout';

const AUTOSAVE_KEY = 'tessera-autosave-v1';

export class Persistence {
  private autosaveTimer: number | null = null;

  constructor(private mode: TesseraMode) {}

  download(name = 'tessera-layout.json'): void {
    const layout = serializeLayout(this.mode.grid, this.mode.site);
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  openFilePicker(onLoaded?: (layout: TesseraLayout) => void, onError?: (msg: string) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const layout = parseLayout(JSON.parse(await file.text()));
        this.applyLayout(layout);
        onLoaded?.(layout);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : String(err));
      }
    };
    input.click();
  }

  applyLayout(layout: TesseraLayout): void {
    if (layout.grid.width !== this.mode.grid.width || layout.grid.depth !== this.mode.grid.depth) {
      this.mode.resizeGrid(layout.grid.width, layout.grid.depth);
    }
    // land first, buildings second — placements grade pads into this terrain
    this.mode.site.load(layout.terrain);
    this.mode.loadPlacements(layout.modules);
  }

  scheduleAutosave(): void {
    if (this.autosaveTimer !== null) window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeLayout(this.mode.grid, this.mode.site)));
      } catch {
        // storage full/blocked — non-fatal
      }
    }, 2000);
  }

  loadAutosave(): TesseraLayout | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      return parseLayout(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  clearAutosave(): void {
    localStorage.removeItem(AUTOSAVE_KEY);
  }
}
