export interface ToolbarActions {
  setMode(mode: 'tessera' | 'arcology'): void;
  save(): void;
  load(): void;
  clear(): void;
  undo(): void;
  redo(): void;
  walk(): void;
  toggleGrid(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

export class Toolbar {
  readonly el: HTMLDivElement;
  private btns: Record<string, HTMLButtonElement> = {};
  private mode: 'tessera' | 'arcology' = 'tessera';

  constructor(
    parent: HTMLElement,
    private actions: ToolbarActions,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'va-toolbar';
    parent.appendChild(this.el);

    const add = (key: string, label: string, onClick: () => void, title = ''): void => {
      const b = document.createElement('button');
      b.className = 'va-btn';
      b.textContent = label;
      b.title = title;
      b.onclick = onClick;
      this.el.appendChild(b);
      this.btns[key] = b;
    };
    const sep = (): void => {
      const s = document.createElement('div');
      s.className = 'va-sep';
      this.el.appendChild(s);
    };

    add('tessera', 'Tessera', () => actions.setMode('tessera'), 'Neighborhood builder');
    add('arcology', 'Arcology', () => actions.setMode('arcology'), 'Mile-high massing viewer');
    sep();
    add('walk', '🚶 Walk', () => actions.walk(), 'First-person walkthrough (Tab)');
    sep();
    add('undo', '↩', () => actions.undo(), 'Undo (Ctrl+Z)');
    add('redo', '↪', () => actions.redo(), 'Redo (Ctrl+Y)');
    add('grid', '#', () => actions.toggleGrid(), 'Toggle grid');
    sep();
    add('save', 'Save', () => actions.save(), 'Download layout JSON');
    add('load', 'Load', () => actions.load(), 'Load layout JSON');
    add('clear', 'Clear', () => actions.clear(), 'Remove all modules');
    this.btns.clear.classList.add('warm');

    this.refresh();
  }

  setActiveMode(mode: 'tessera' | 'arcology'): void {
    this.mode = mode;
    this.refresh();
  }

  refresh(): void {
    this.btns.tessera.classList.toggle('active', this.mode === 'tessera');
    this.btns.arcology.classList.toggle('active', this.mode === 'arcology');
    const inTessera = this.mode === 'tessera';
    for (const key of ['walk', 'undo', 'redo', 'grid', 'save', 'load', 'clear']) {
      this.btns[key].style.display = inTessera || key === 'walk' ? '' : 'none';
    }
    this.btns.undo.disabled = !this.actions.canUndo();
    this.btns.redo.disabled = !this.actions.canRedo();
  }
}
