import * as T from 'three';
import type { WorldContext } from '../types';

export function buildPlant(ctx: WorldContext, x: number, z: number, size = 1, pot = true) {
  const { emit, random, materials } = ctx;
  if (pot) {
    emit(new T.CylinderGeometry(0.23 * size, 0.16 * size, 0.35 * size, 12), materials.clay, x, 0.18 * size, z);
  }
  for (let k = 0; k < 5; k++) {
    const angle = random() * Math.PI * 2;
    const length = (0.25 + random() * 0.35) * size;
    emit(
      new T.PlaneGeometry(1, 1),
      materials.leafMats[k % 4],
      x + Math.sin(angle) * length * 0.3,
      (0.45 + random() * 0.25) * size,
      z + Math.cos(angle) * length * 0.3,
      0.65 * size,
      0.75 * size,
      1,
      0.1,
      angle,
      Math.sin(angle) * 0.3,
    );
  }
}

export function buildTree(ctx: WorldContext, x: number, z: number, h: number, pine = false, oldTrunk = false) {
  const { cyl, beam, emit, random, materials } = ctx;
  cyl(materials.wood, x, h * 0.38, z, oldTrunk ? 0.34 : 0.16, h * 0.76);

  if (oldTrunk) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      beam(materials.wood, [x + Math.sin(a) * 0.65, 0.05, z + Math.cos(a) * 0.5], [x, 1.4, z], 0.14);
      beam(materials.wood, [x, 1.3, z], [x + Math.sin(a) * 0.8, 3.5, z + Math.cos(a) * 0.8], 0.19);
    }
  }

  const outerCount = pine ? 60 : 10;
  const leafCount = pine ? 20 : 85;

  for (let i = 0; i < outerCount; i++) {
    const tier = Math.floor(i / 6);
    const a = pine ? (i % 6) * Math.PI / 3 + tier * 0.35 : i * 2.4;
    const y = pine ? h * 0.25 + tier * h * 0.067 : h * 0.53 + random() * h * 0.32;
    const r = pine ? (1 - tier / 12) * 1.8 : 0.7 + random() * (oldTrunk ? 1.5 : 0.7);

    beam(materials.wood, [x, y - 0.3, z], [x + Math.sin(a) * r, y, z + Math.cos(a) * r], 0.04);

    for (let j = 0; j < leafCount; j++) {
      const angle = random() * Math.PI * 2;
      const radius = random() * (pine ? r : 0.95);
      emit(
        new T.PlaneGeometry(1, 1),
        materials.leafMats[j % 4],
        x + Math.sin(a) * r * 0.6 + Math.cos(angle) * radius,
        y + (random() - 0.5) * (pine ? 0.28 : 1.2),
        z + Math.cos(a) * r * 0.6 + Math.sin(angle) * radius,
        pine ? 0.65 : 0.85 + random() * 0.35,
        pine ? 0.25 : 0.85,
        1,
        random() * 2 - 1,
        angle,
        random(),
      );
    }
  }
}

export function buildHedge(ctx: WorldContext, x: number, z: number, length: number, h = 1.6) {
  const { emit, random, materials } = ctx;
  const count = Math.floor(length * 70);
  for (let i = 0; i < count; i++) {
    const xx = x + (random() - 0.5) * length;
    const yy = 0.3 + random() * h;
    const zz = z + (random() - 0.5) * 0.65;
    emit(
      new T.PlaneGeometry(1, 1),
      materials.leafMats[i % 4],
      xx,
      yy,
      zz,
      0.65,
      0.75,
      1,
      random() - 0.5,
      random() * 6,
      (random() - 0.5) * 1.5,
    );
  }
}
