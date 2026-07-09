/**
 * Camera compass: the ring rotates so its N always points to world north (-z).
 * Drag it anywhere on screen; the spot persists across sessions.
 */
import type { App } from '../core/App';

export class Compass {
  private ring: HTMLDivElement;

  constructor(parent: HTMLElement, app: App) {
    const el = document.createElement('div');
    el.className = 'va-compass';
    el.innerHTML = `
      <div class="va-compass-ring">
        <span class="n">N</span><span class="e">E</span><span class="s">S</span><span class="w">W</span>
        <div class="needle"></div>
      </div>`;
    parent.appendChild(el);
    this.ring = el.querySelector('.va-compass-ring')!;

    // restore a dragged position (falls back to the stylesheet's top-right)
    try {
      const saved = JSON.parse(localStorage.getItem('va-compass-pos') ?? 'null') as { x: number; y: number } | null;
      if (saved) this.place(el, saved.x, saved.y);
    } catch {
      /* corrupted value — keep default */
    }

    let drag: { dx: number; dy: number } | null = null;
    el.addEventListener('pointerdown', (e) => {
      const r = el.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events have no active pointer */
      }
      e.stopPropagation();
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      this.place(el, e.clientX - drag.dx, e.clientY - drag.dy);
    });
    el.addEventListener('pointerup', (e) => {
      if (!drag) return;
      drag = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* synthetic events have no active pointer */
      }
      const r = el.getBoundingClientRect();
      localStorage.setItem('va-compass-pos', JSON.stringify({ x: r.left, y: r.top }));
    });

    const update = (): void => {
      // orbit azimuth = camera angle around +y; ring counter-rotates
      const az = app.rig.orbit.getAzimuthalAngle();
      this.ring.style.transform = `rotate(${(az * 180) / Math.PI}deg)`;
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  private place(el: HTMLElement, x: number, y: number): void {
    const size = el.offsetWidth || 64;
    el.style.left = `${Math.min(Math.max(0, x), window.innerWidth - size)}px`;
    el.style.top = `${Math.min(Math.max(0, y), window.innerHeight - size)}px`;
    el.style.right = 'auto';
  }
}
