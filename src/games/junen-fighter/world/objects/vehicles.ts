import * as T from 'three';
import type { WorldContext } from '../types';

export function buildScooter(ctx: WorldContext, x: number, z: number, color: T.Material) {
  const { cyl, box, beam, emit, materials } = ctx;
  const { rubber, white, dark, glass } = materials;

  for (const dz of [-0.52, 0.52]) {
    cyl(rubber, x, 0.32, z + dz, 0.29, 0.15, 0, Math.PI / 2);
    cyl(white, x + 0.08, 0.32, z + dz, 0.17, 0.02, 0, Math.PI / 2);
  }

  box(color, x, 0.54, z, 0.36, 0.35, 0.95);
  box(rubber, x, 0.86, z - 0.14, 0.4, 0.12, 0.65);
  box(color, x, 0.8, z + 0.5, 0.38, 0.64, 0.18, -0.2);
  box(white, x, 1.1, z + 0.59, 0.26, 0.13, 0.06);

  beam(dark, [x, 0.4, z + 0.52], [x, 1.15, z + 0.39], 0.035);
  beam(dark, [x - 0.3, 1.18, z + 0.39], [x + 0.3, 1.18, z + 0.39], 0.025);

  for (const dx of [-0.26, 0.26]) {
    beam(dark, [x + dx, 1.18, z + 0.39], [x + dx * 1.3, 1.43, z + 0.39], 0.013);
    emit(new T.SphereGeometry(0.09, 8, 6), glass, x + dx * 1.3, 1.43, z + 0.39, 1, 0.6, 0.3);
  }
}

export function buildCar(ctx: WorldContext, x: number, z: number, covered = false) {
  const { box, cyl, emit, materials } = ctx;
  const { white, glass, rubber, silverCover, cloth } = materials;
  const m = covered ? (silverCover ?? cloth[2]) : white;

  if (covered) {
    // Realistic draped car cover over compact MPV/sedan
    // Lower body draped envelope
    box(m, x, 0.58, z, 1.68, 0.62, 3.4);
    // Upper cabin drape
    box(m, x, 1.08, z - 0.15, 1.48, 0.52, 1.95);
    // Sloping hood drape
    box(m, x, 0.82, z + 1.05, 1.54, 0.28, 1.05, 0.18);
    // Windshield slope drape
    box(m, x, 1.12, z + 0.52, 1.46, 0.38, 0.65, 0.42);
    // Rear hatch slope drape
    box(m, x, 1.05, z - 1.18, 1.46, 0.42, 0.6, -0.32);
    // Roof curvature smoothing
    emit(new T.CylinderGeometry(0.72, 0.74, 1.8, 12), m, x, 1.28, z - 0.15, 1, 0.32, 1, Math.PI / 2);
    // Mirror pockets
    for (const side of [-1, 1]) {
      box(m, x + side * 0.84, 0.96, z + 0.55, 0.22, 0.18, 0.26, 0, side * 0.15);
      // Elastic skirt contouring
      box(m, x + side * 0.78, 0.26, z, 0.14, 0.22, 3.25);
    }
    // Front & rear skirt drape
    box(m, x, 0.25, z + 1.62, 1.58, 0.22, 0.16);
    box(m, x, 0.25, z - 1.62, 1.58, 0.22, 0.16);
  } else {
    box(m, x, 0.62, z, 1.6, 0.65, 3.25);
    emit(new T.SphereGeometry(1, 16, 10), m, x, 1.03, z - 0.1, 0.78, 0.62, 1.35);
    box(glass, x, 1.2, z + 0.45, 1.38, 0.58, 0.06, 0.36);
    for (const side of [-1, 1]) {
      box(glass, x + side * 0.775, 1.18, z - 0.1, 0.015, 0.42, 1.3);
    }
    for (const dx of [-0.58, 0.58]) {
      box(white, x + dx, 0.68, z - 1.64, 0.31, 0.15, 0.04);
    }
  }

  for (const dx of [-0.73, 0.73]) {
    for (const dz of [-1.05, 1.05]) {
      cyl(rubber, x + dx, 0.3, z + dz, 0.29, 0.16, 0, Math.PI / 2);
    }
  }
}
