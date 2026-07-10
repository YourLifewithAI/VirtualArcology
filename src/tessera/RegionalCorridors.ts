/**
 * The regional connections: a highway flanking the site's east side and the
 * freight/passenger rail corridor along the north edge, both running from
 * horizon to horizon. Trucks stream along the highway and a freight train
 * passes now and then — the supply lines that built the Tessera and keep
 * the fab fed with what the foundry can't yet recycle.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MATERIALS } from '../core/Materials';
import { PALETTE } from '../core/Palette';
import { PartsBuilder } from '../core/geo';
import { Rng } from '../core/Rng';
import { CELL_SIZE } from './Grid';
import { corridorPositions } from './Terrain';

const REACH = 2400; // horizon half-length, matches the biome ring
const N_TRUCKS = 14;

interface Truck {
  z: number;
  lane: number; // -1 = northbound, 1 = southbound
  speed: number;
}

function bake(g: THREE.BufferGeometry, hex: number): THREE.BufferGeometry {
  const c = new THREE.Color(hex).convertSRGBToLinear();
  const ng = g.index ? g.toNonIndexed() : g;
  const count = ng.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  ng.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return ng;
}

function truckGeometry(): THREE.BufferGeometry {
  const b = new PartsBuilder();
  b.box(2.5, 2.9, 4, 'robotTeal', { z: -5.5, y: 0.5 }); // cab
  b.box(2.6, 3.3, 10.5, 'industryWhite', { z: 2.2, y: 0.7 }); // trailer
  for (const z of [-5.5, 0.4, 5.8]) {
    for (const x of [-1.25, 1.25]) {
      const wheel = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 8);
      wheel.rotateZ(Math.PI / 2);
      wheel.translate(x, 0.55, z);
      b.custom(wheel, 'charcoal');
    }
  }
  return b.merge().opaque!;
}

export class RegionalCorridors {
  private group = new THREE.Group();
  private trucks: THREE.InstancedMesh;
  private truckState: Truck[] = [];
  private train: THREE.Mesh | null = null;
  private trainX = -REACH;
  private highwayX = 0;
  private railZ = 0;
  private rng = new Rng(19870423);

  constructor(private scene: THREE.Scene) {
    scene.add(this.group);
    this.trucks = new THREE.InstancedMesh(truckGeometry(), MATERIALS.opaque, N_TRUCKS);
    this.trucks.frustumCulled = false;
    scene.add(this.trucks);
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
    this.trucks.visible = v;
    if (this.train) this.train.visible = v;
  }

  rebuild(gridW: number, gridD: number): void {
    for (const o of [...this.group.children]) {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      this.group.remove(o);
    }
    if (this.train) {
      this.scene.remove(this.train);
      this.train.geometry.dispose();
      this.train = null;
    }

    const halfX = (gridW * CELL_SIZE) / 2;
    const { highwayX, railZ } = corridorPositions(gridW, gridD);
    this.highwayX = highwayX;
    this.railZ = railZ;

    const statics: THREE.BufferGeometry[] = [];
    // ---- highway (east side, north-south) ----
    const bed = new THREE.BoxGeometry(18, 0.25, REACH * 2);
    bed.translate(this.highwayX, 0.02, 0);
    statics.push(bake(bed, PALETTE.asphalt));
    const median = new THREE.BoxGeometry(1.2, 0.35, REACH * 2);
    median.translate(this.highwayX, 0.05, 0);
    statics.push(bake(median, PALETTE.concreteDark));
    // lane dashes
    for (const lx of [-4.4, 4.4]) {
      for (let z = -REACH; z < REACH; z += 24) {
        const dash = new THREE.BoxGeometry(0.3, 0.02, 6);
        dash.translate(this.highwayX + lx, 0.16, z + 3);
        statics.push(bake(dash, PALETTE.white));
      }
    }
    // shoulders
    for (const sx of [-9.4, 9.4]) {
      const sh = new THREE.BoxGeometry(0.8, 0.28, REACH * 2);
      sh.translate(this.highwayX + sx, 0.02, 0);
      statics.push(bake(sh, PALETTE.paverDark));
    }
    // interchange spur toward the site's east edge
    const spur = new THREE.BoxGeometry(this.highwayX - halfX + 2, 0.22, 9);
    spur.translate((this.highwayX + halfX) / 2, 0.02, 0);
    statics.push(bake(spur, PALETTE.asphalt));

    // ---- rail (north side, east-west) — continues the transit hub's tracks ----
    const ballast = new THREE.BoxGeometry(REACH * 2, 0.3, 9);
    ballast.translate(0, 0.0, this.railZ);
    statics.push(bake(ballast, PALETTE.concreteDark));
    for (const tz of [-2.2, 2.2]) {
      for (const rz of [-0.75, 0.75]) {
        const rail = new THREE.BoxGeometry(REACH * 2, 0.18, 0.16);
        rail.translate(0, 0.32, this.railZ + tz + rz);
        statics.push(bake(rail, PALETTE.steelDark));
      }
      for (let x = -REACH; x < REACH; x += 6) {
        const tie = new THREE.BoxGeometry(0.5, 0.1, 2.4);
        tie.translate(x, 0.26, this.railZ + tz);
        statics.push(bake(tie, PALETTE.timberDark));
      }
    }
    const merged = new THREE.Mesh(mergeGeometries(statics, false), MATERIALS.opaque);
    statics.forEach((g) => g.dispose());
    merged.frustumCulled = false;
    merged.receiveShadow = true;
    this.group.add(merged);

    // ---- freight train: loco + 9 cars as one merged mesh ----
    const cars: THREE.BufferGeometry[] = [];
    const carColors = [PALETTE.robotTeal, PALETTE.canvasRed, PALETTE.steel, PALETTE.canvasYellow, PALETTE.steelDark];
    for (let i = 0; i < 10; i++) {
      const isLoco = i === 0;
      const car = new THREE.BoxGeometry(isLoco ? 18 : 15, isLoco ? 3.8 : 3.2, 2.9);
      car.translate(i * 17, isLoco ? 2.2 : 1.9, 0);
      cars.push(bake(car, isLoco ? PALETTE.charcoal : carColors[i % carColors.length]));
    }
    this.train = new THREE.Mesh(mergeGeometries(cars, false), MATERIALS.opaque);
    cars.forEach((g) => g.dispose());
    this.train.frustumCulled = false;
    this.train.position.set(this.trainX, 0.35, this.railZ - 2.2);
    this.scene.add(this.train);

    // ---- trucks ----
    this.truckState = [];
    for (let i = 0; i < N_TRUCKS; i++) {
      this.truckState.push({
        z: this.rng.float(-REACH, REACH),
        lane: this.rng.chance(0.5) ? -1 : 1,
        speed: this.rng.float(24, 31),
      });
    }
    this.placeTrucks();
  }

  private placeTrucks(): void {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    this.truckState.forEach((t, i) => {
      q.setFromAxisAngle(up, t.lane < 0 ? 0 : Math.PI);
      m.makeRotationFromQuaternion(q);
      m.setPosition(this.highwayX + t.lane * 3.2, 0.15, t.z);
      this.trucks.setMatrixAt(i, m);
    });
    this.trucks.count = this.truckState.length;
    this.trucks.instanceMatrix.needsUpdate = true;
  }

  update(dt: number): void {
    for (const t of this.truckState) {
      t.z -= t.lane * t.speed * dt;
      if (t.z > REACH) t.z = -REACH;
      if (t.z < -REACH) t.z = REACH;
    }
    this.placeTrucks();
    if (this.train) {
      this.trainX += 38 * dt;
      if (this.trainX > REACH + 200) this.trainX = -REACH - 200;
      this.train.position.x = this.trainX;
    }
  }
}
