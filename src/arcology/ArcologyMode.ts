/**
 * Arcology viewer: parametric ziggurat massing with program coloring,
 * elevator-shaft visualization, x-ray material swap, and a cutaway plane.
 */
import * as THREE from 'three';
import type { App } from '../core/App';
import type { Mode } from '../core/Mode';
import { PALETTE } from '../core/Palette';
import type { WalkSurface } from '../walkthrough/WalkthroughController';
import { generateArcology, type ArcologyBuild, type TierSpawn } from './ArcologyGenerator';
import { buildElevatorGroup } from './ElevatorPlanner';
import { defaultParams, plateauHeight, type ArcologyParams } from './params';

export class ArcologyMode implements Mode {
  readonly id = 'arcology';
  readonly scene = new THREE.Scene();
  readonly params: ArcologyParams = defaultParams();
  readonly view = { xray: false, cut: 1.0, showShafts: false };

  private build: ArcologyBuild | null = null;
  private elevators: THREE.Group | null = null;
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e9);
  private xrayMat: THREE.MeshBasicMaterial;
  private originalMats = new Map<THREE.Mesh, THREE.Material>();
  private animatables: { update(dt: number): void }[] = [];
  /** Fired after regenerate so the panel can rebuild tier teleports. */
  onRegenerated: (() => void) | null = null;

  constructor(private app: App) {
    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.skyHorizon, 9000, 42000);

    const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x8a7d61, 0.85);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
    sun.position.set(0.6, 0.8, 0.35).multiplyScalar(10000);
    this.scene.add(sun);

    this.xrayMat = new THREE.MeshBasicMaterial({
      color: 0x9fc5e8,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.xrayMat.clippingPlanes = [this.clipPlane];

    this.regenerate();
  }

  regenerate(): void {
    if (this.build) {
      this.scene.remove(this.build.group);
      this.build.dispose();
      this.originalMats.clear();
    }
    if (this.elevators) {
      this.scene.remove(this.elevators);
    }

    this.build = generateArcology(this.params, () => this.params.floorHeight);
    for (const mat of this.build.clippableMaterials) mat.clippingPlanes = [this.clipPlane];
    for (const mesh of this.build.massingMeshes) this.originalMats.set(mesh, mesh.material as THREE.Material);
    this.scene.add(this.build.group);

    this.elevators = buildElevatorGroup(this.params);
    this.scene.add(this.elevators);

    this.applyView();
    this.onRegenerated?.();
  }

  get tierSpawns(): TierSpawn[] {
    return this.build?.tierSpawns ?? [];
  }

  applyView(): void {
    // cutaway plane: keep x <= c
    const c = THREE.MathUtils.lerp(-0.56, 0.56, THREE.MathUtils.clamp(this.view.cut, 0, 1)) * this.params.baseSide;
    this.clipPlane.constant = this.view.cut >= 0.999 ? 1e9 : c;

    // x-ray swap
    if (this.build) {
      for (const mesh of this.build.massingMeshes) {
        mesh.material = this.view.xray ? this.xrayMat : this.originalMats.get(mesh)!;
      }
    }
    if (this.elevators) {
      this.elevators.visible = this.view.showShafts || this.view.xray;
    }
  }

  /** Walk surface for a tier terrace: flat ring with hard clamped bounds. */
  terraceSurface(spawn: TierSpawn): WalkSurface {
    const margin = 4;
    return {
      groundHeight: () => spawn.y,
      clamp: (pos) => {
        const o = spawn.outerHalf - margin;
        pos.x = Math.max(-o, Math.min(o, pos.x));
        pos.z = Math.max(-o, Math.min(o, pos.z));
        const inner = spawn.innerHalf + margin;
        if (Math.abs(pos.x) < inner && Math.abs(pos.z) < inner) {
          // push out of the tier body along the axis closest to the edge
          if (inner - Math.abs(pos.x) < inner - Math.abs(pos.z)) {
            pos.x = pos.x >= 0 ? inner : -inner;
          } else {
            pos.z = pos.z >= 0 ? inner : -inner;
          }
        }
      },
    };
  }

  enter(): void {
    this.app.renderer.shadowMap.enabled = false;
    const h = plateauHeight(this.params);
    this.app.rig.setView(
      { x: this.params.baseSide * 1.05, y: h * 1.9, z: this.params.baseSide * 1.5 },
      { x: 0, y: h * 0.4, z: 0 },
      { near: 5, far: 80000, minDistance: 150, maxDistance: 50000 },
    );
  }

  exit(): void {
    this.app.renderer.shadowMap.enabled = true;
  }

  registerAnimatable(a: { update(dt: number): void }): void {
    this.animatables.push(a);
  }

  update(dt: number): void {
    if (dt > 0) for (const a of this.animatables) a.update(dt);
  }

  dispose(): void {
    this.build?.dispose();
  }
}
