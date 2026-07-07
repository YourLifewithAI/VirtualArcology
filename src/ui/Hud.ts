import type { App } from '../core/App';

export class Hud {
  readonly el: HTMLDivElement;
  readonly hint: HTMLDivElement;
  readonly crosshair: HTMLDivElement;
  private toast: HTMLDivElement;
  private statsEl: HTMLSpanElement;
  private toastTimer: number | null = null;

  constructor(parent: HTMLElement, app: App) {
    this.el = document.createElement('div');
    this.el.className = 'va-hud';
    this.el.innerHTML = `<span class="stats"></span>`;
    this.statsEl = this.el.querySelector('.stats')!;
    parent.appendChild(this.el);

    this.hint = document.createElement('div');
    this.hint.className = 'va-hint';
    parent.appendChild(this.hint);

    this.crosshair = document.createElement('div');
    this.crosshair.className = 'va-crosshair';
    parent.appendChild(this.crosshair);

    this.toast = document.createElement('div');
    this.toast.className = 'va-toast';
    parent.appendChild(this.toast);

    setInterval(() => {
      const s = app.stats();
      this.statsEl.textContent = `${s.fps} fps · ${s.drawCalls} calls · ${(s.triangles / 1000).toFixed(0)}k tris`;
    }, 500);
  }

  setHint(html: string): void {
    this.hint.innerHTML = html;
  }

  setCrosshair(v: boolean): void {
    this.crosshair.style.display = v ? 'block' : 'none';
  }

  showToast(msg: string, ms = 2600): void {
    this.toast.textContent = msg;
    this.toast.classList.add('show');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('show'), ms);
  }
}
