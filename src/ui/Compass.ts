/** Camera compass: the ring rotates so its N always points to world north (-z). */
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

    const update = (): void => {
      // orbit azimuth = camera angle around +y; ring counter-rotates
      const az = app.rig.orbit.getAzimuthalAngle();
      this.ring.style.transform = `rotate(${(az * 180) / Math.PI}deg)`;
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}
