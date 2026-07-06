import type * as THREE from 'three';

/** A top-level view of the app (Tessera builder, Arcology viewer). */
export interface Mode {
  readonly id: string;
  readonly scene: THREE.Scene;
  /** Called when the mode becomes active. Configure camera, UI, renderer flags. */
  enter(): void;
  /** Called when switching away. */
  exit(): void;
  update(dt: number): void;
  dispose(): void;
}
