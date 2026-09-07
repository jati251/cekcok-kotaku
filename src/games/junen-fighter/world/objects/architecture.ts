import * as T from 'three';
import type { WorldContext } from '../types';
import type { Property } from '../../neighborhood';

export function buildWindowFrame(
  ctx: WorldContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  frame = ctx.materials.white,
) {
  const { box, materials } = ctx;
  box(materials.glass, x, y, z, w, h, 0.07);
  for (const dx of [-w / 2, 0, w / 2]) box(frame, x + dx, y, z - 0.06, 0.045, h + 0.1, 0.08);
  for (const dy of [-h / 2, h * 0.15, h / 2]) box(frame, x, y + dy, z - 0.06, w + 0.08, 0.045, 0.08);
  for (let dx = -w / 2 + 0.13; dx < w / 2; dx += 0.16) box(frame, x + dx, y + h * 0.4, z - 0.07, 0.016, h * 0.2, 0.04);
}

export function buildDoor(ctx: WorldContext, x: number, z: number, material = ctx.materials.wood) {
  const { box, materials } = ctx;
  box(material, x, 1.22, z, 0.95, 2.4, 0.12);
  for (const dx of [-0.24, 0.24]) {
    for (const y of [0.6, 1.6]) {
      box(material, x + dx, y, z - 0.075, 0.34, 0.77, 0.06);
    }
  }
  box(materials.gold, x + 0.33, 1.16, z - 0.12, 0.035, 0.15, 0.04);
}

export function buildRoof(
  ctx: WorldContext,
  w: number,
  depth: number,
  base: number,
  z: number,
  corrugated = false,
  gable = ctx.materials.concrete,
  surface = ctx.materials.tile,
) {
  const { box, beam, emit, materials } = ctx;
  const rise = corrugated ? 0.8 : 1.3;
  const half = w / 2 + 0.3;
  const slope = Math.atan2(rise, half);
  const m = corrugated ? materials.roofGrey : surface;

  for (const s of [-1, 1]) {
    box(m, (s * half) / 2, base + rise / 2, z + depth / 2, Math.hypot(half, rise), 0.09, depth + 0.7, 0, 0, -s * slope);
    if (corrugated) {
      for (let zz = z - 0.3; zz < z + depth + 0.35; zz += 0.12) {
        beam(m, [0, base + rise + 0.055, zz], [s * half, base + 0.055, zz], 0.025);
      }
    } else {
      for (let x = 0.1; x < half; x += 0.29) {
        for (let zz = z - 0.3; zz < z + depth + 0.3; zz += 0.3) {
          emit(new T.CylinderGeometry(0.075, 0.085, 0.32, 6, 1, true, 0, Math.PI), m, s * x, base + rise * (1 - x / half) + 0.04, zz, 1, 1, 1, Math.PI / 2);
        }
      }
    }
    beam(materials.concrete, [s * half, base, z - 0.35], [0, base + rise, z - 0.35], 0.075);
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute([-half, base, z, half, base, z, 0, base + rise, z], 3));
  g.setIndex([0, 2, 1, 0, 1, 2]);
  g.computeVertexNormals();
  g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  emit(g, gable, 0, 0, 0);
}

export function buildGreenHipRoof(ctx: WorldContext, w: number, depth: number, base: number, front: number) {
  const { beam, emit, materials } = ctx;
  const half = w / 2 + 0.3;
  const rear = front + depth + 0.3;
  const ridgeZ = front + depth / 2;
  const fl = [-half, base, front - 0.3];
  const fr = [half, base, front - 0.3];
  const bl = [-half, base, rear];
  const br = [half, base, rear];
  const rl = [-half + 1.4, base + 1.05, ridgeZ];
  const rr = [half - 1.4, base + 1.05, ridgeZ];

  for (const points of [[fl, fr, rr, rl], [br, bl, rl, rr], [bl, fl, rl], [fr, br, rr]]) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(points.flatMap((p) => [p[0] / w, p[2] / depth]), 2));
    g.setIndex(points.length === 4 ? [0, 2, 1, 0, 3, 2] : [0, 2, 1]);
    g.computeVertexNormals();
    emit(g, materials.roofGrey, 0, 0, 0);
  }

  for (let x = -half; x < half; x += 0.12) {
    const ridgeX = T.MathUtils.clamp(x, rl[0], rr[0]);
    for (const z of [front - 0.3, rear]) {
      beam(materials.roofGrey, [x, base + 0.025, z], [ridgeX, base + 1.075, ridgeZ], 0.022);
    }
  }
}

export function buildAwning(
  ctx: WorldContext,
  w: number,
  depth: number,
  y: number,
  rear: number,
  m = ctx.materials.roofGrey,
  frame = ctx.materials.white,
) {
  const { box, beam } = ctx;
  const front = rear - depth;
  box(m, 0, y, rear - depth / 2, w, 0.055, depth, -0.08);

  for (let x = -w / 2; x < w / 2; x += 0.14) {
    beam(m, [x, y - depth * 0.04, front], [x, y + depth * 0.04, rear], 0.021);
  }

  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
    box(frame, x, y / 2, front, 0.065, y, 0.065);
    beam(frame, [x, y - depth * 0.04 - 0.09, front], [x, y + depth * 0.04 - 0.09, rear], 0.035);
  }

  for (let zz = front; zz <= rear; zz += 0.7) {
    box(frame, 0, y - 0.12 + (zz - front - depth / 2) * 0.08, zz, w, 0.06, 0.05);
  }

  box(frame, 0, y - depth * 0.04, front, w, 0.12, 0.09);
}

export function buildAC(ctx: WorldContext, x: number, z: number, y = 2.3) {
  const { box, emit, beam, materials } = ctx;
  const { white, dark, concrete } = materials;
  box(white, x, y, z, 0.73, 0.52, 0.32);
  emit(new T.TorusGeometry(0.19, 0.012, 5, 24), dark, x, y, z - 0.18);

  for (let i = -3; i <= 3; i++) {
    box(concrete, x, y + i * 0.045, z - 0.19, 0.42, 0.014, 0.02);
  }

  beam(white, [x + 0.37, y, z], [x + 0.52, y, z], 0.025);
  beam(white, [x + 0.52, y, z], [x + 0.52, 0.2, z], 0.025);
}

export function buildFence(ctx: WorldContext, w: number, kind: Property['id'], m: T.MeshStandardMaterial) {
  const { box, emit, materials } = ctx;
  const { concrete, teal, white, green, blue, dark, salmon, gold, rust } = materials;

  const scroll = kind === 'white-scroll' || kind === 'turquoise';
  const panel = ['yellow-black', 'gray', 'laundry', 'cream-carport', 'white-car', 'pale-green'].includes(kind);
  const low = kind === 'low-yard' || kind === 'blue-low';
  const h = low ? 0.95 : kind === 'white-scroll' ? 1.85 : 1.5;
  const metal =
    kind === 'white-scroll' || kind === 'white-car' || kind === 'cream-carport'
      ? white
      : kind === 'green-tank'
        ? green
        : kind === 'pine-court'
          ? blue
          : dark;
  const left = -w / 2 + 0.18;
  const right = kind === 'green-tank' ? w / 2 - 2 : w / 2 - 0.18;

  for (const x of [left, right]) {
    box(m, x, h / 2, 0, 0.26, h + 0.15, 0.32);
    box(concrete, x, h + 0.1, 0, 0.36, 0.1, 0.41);
    if (kind === 'turquoise') box(teal, x, h / 2, -0.17, 0.13, h - 0.2, 0.015);
  }

  if (kind !== 'green-tank') box(m, 0, 0.14, 0, w, 0.25, 0.18);

  for (const y of [0.3, h - 0.12]) {
    box(metal, (left + right) / 2, y, -0.015, right - left, 0.045, 0.05);
  }

  for (let x = left + 0.16; x < right - 0.08; x += kind === 'white-car' ? 0.085 : 0.18) {
    const top = kind === 'white-scroll' ? h + Math.sin(((x - left) / (right - left)) * Math.PI * 2) * 0.18 : h;
    box(metal, x, top / 2, 0, 0.023, top, 0.035);
    if (panel) {
      box(
        kind === 'cream-carport' || kind === 'laundry' ? salmon : metal,
        x,
        h * 0.37,
        0.025,
        0.155,
        kind === 'cream-carport' ? h * 0.8 : h * 0.48,
        0.035,
      );
    }
    if (kind === 'turquoise') box(blue, x, h * 0.48, 0.035, 0.15, h * 0.76, 0.025);
    if (scroll) {
      for (const y of [0.57, 1.16]) emit(new T.TorusGeometry(0.085, 0.009, 4, 14), metal, x, y, -0.04, 1, 1.5, 1);
      emit(new T.ConeGeometry(0.033, 0.12, 5), kind === 'white-scroll' ? gold : rust, x, top + 0.055, 0);
    }
  }

  if (kind === 'cream-carport' || kind === 'green-tank') {
    for (let i = 0; i < 3; i++) {
      box(materials.cloth[i], -0.9 + i * 0.6, h - 0.12, -0.065, 0.46, 0.64 - i * 0.07, 0.025, 0.08);
    }
  }
}
