/**
 * Shared InstancedMesh pools for high-count scatter (trees, panels, shrubs).
 * Module builders emit InstanceRequests in module-local space; the pools store
 * them transformed into world space and rebuild in one pass per layout change.
 */
import * as THREE from 'three';
import { MATERIALS } from '../core/Materials';
import type { InstancePart, InstanceRequest } from '../core/geo';
import { INSTANCE_PARTS, instancedPartGeometry } from '../catalog/parts';

export class InstancePools {
  private meshes = new Map<InstancePart, THREE.InstancedMesh>();

  constructor(private scene: THREE.Scene) {}

  rebuild(requests: { req: InstanceRequest; worldMatrix: THREE.Matrix4 }[]): void {
    const byPart = new Map<InstancePart, THREE.Matrix4[]>();
    for (const part of INSTANCE_PARTS) byPart.set(part, []);
    const tmp = new THREE.Matrix4();
    for (const { req, worldMatrix } of requests) {
      tmp.copy(worldMatrix).multiply(req.matrix);
      byPart.get(req.part)!.push(tmp.clone());
    }

    for (const part of INSTANCE_PARTS) {
      const matrices = byPart.get(part)!;
      let mesh = this.meshes.get(part);
      if (!mesh || (mesh.instanceMatrix.count ?? 0) < matrices.length) {
        if (mesh) {
          this.scene.remove(mesh);
          mesh.dispose();
        }
        const capacity = Math.max(64, Math.ceil(matrices.length * 1.5));
        mesh = new THREE.InstancedMesh(instancedPartGeometry(part), MATERIALS.opaque, capacity);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        this.meshes.set(part, mesh);
      }
      mesh.count = matrices.length;
      for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = matrices.length > 0;
    }
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.meshes.clear();
  }
}
