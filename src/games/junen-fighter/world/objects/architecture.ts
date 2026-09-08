import * as T from 'three';
import type { WorldContext } from '../types';
import { scroll as ironScroll, tube, stoneCourses } from './detail';
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
      for (let zz = z - 0.2; zz <= z + depth + 0.25; zz += 0.28) {
        beam(m, [0, base + rise + 0.04, zz], [s * half, base + 0.04, zz], 0.032);
      }
    }
    beam(materials.concrete, [s * half, base, z - 0.35], [0, base + rise, z - 0.35], 0.075);
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute([-half, base, z, half, base, z, 0, base + rise, z], 3));
  g.setIndex([0, 2, 1]);
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
        : dark;
  const left = -w / 2 + 0.18;
  const right = kind === 'green-tank' ? w / 2 - 2 : w / 2 - 0.18;

  for (const x of [left, right]) {
    box(m, x, h / 2, 0, 0.28, h + 0.15, 0.34);
    // Double-tier beveled concrete cap
    box(concrete, x, h + 0.1, 0, 0.38, 0.08, 0.42);
    box(concrete, x, h + 0.16, 0, 0.28, 0.05, 0.32);
    if (kind === 'white-scroll') stoneCourses(ctx, x - 0.0, 0.12, -0.18, 0.20, h - 0.18, dark);
    if (kind === 'turquoise') box(teal, x, h / 2, -0.17, 0.13, h - 0.2, 0.015);
  }

  if (kind !== 'green-tank') box(m, 0, 0.14, 0, w, 0.25, 0.18);

  // Ground sliding track & wheels for sliding gates
  box(dark, (left + right) / 2, 0.015, 0, right - left + 0.2, 0.02, 0.06);
  emit(new T.CylinderGeometry(0.04, 0.04, 0.03, 12), dark, left + 0.35, 0.04, 0, 1, 1, 1, Math.PI / 2);
  emit(new T.CylinderGeometry(0.04, 0.04, 0.03, 12), dark, right - 0.35, 0.04, 0, 1, 1, 1, Math.PI / 2);

  // Gate handle / latch
  box(metal, right - 0.15, h * 0.55, -0.04, 0.03, 0.18, 0.03);

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
      for (const y of [0.57, 1.16]) {
        ironScroll(ctx, x, y, -0.04, metal, 0.075, 1);
        ironScroll(ctx, x, y, -0.04, metal, 0.075, -1);
      }
      emit(new T.SphereGeometry(0.026, 8, 6), gold, x, 0.88, -0.045, 1, 1.7, 1);
      emit(new T.ConeGeometry(0.033, 0.12, 5), kind === 'white-scroll' ? gold : rust, x, top + 0.055, 0);
    }
  }

  if (kind === 'white-scroll') {
    tube(ctx, Array.from({ length: 49 }, (_, i) => { const x = left + (right - left) * i / 48; return [x, h + Math.sin(i / 48 * Math.PI * 2) * 0.18, -0.02]; }), white, 0.025, 64);
    stoneCourses(ctx, 0, 0.015, -0.12, w, 0.24, dark);
  }

  if (kind === 'cream-carport' || kind === 'green-tank') {
    for (let i = 0; i < 3; i++) {
      box(materials.cloth[i], -0.9 + i * 0.6, h - 0.12, -0.065, 0.46, 0.64 - i * 0.07, 0.025, 0.08);
    }
  }
}


/**
 * True 3D Terracotta Barrel Tile Roof (Genteng Morando / Spanyol)
 * High-fidelity procedural geometry with physical tile ridges, overlapping wuwungan,
 * exposed rafter tails (kaso-kaso), and hanging gutters (talang air) with brackets.
 */
export function buildBarrelTileRoof(
  ctx: WorldContext,
  cx: number,
  w: number,
  depth: number,
  baseY: number,
  rise: number,
  zStart: number,
  tileMat = ctx.materials.terracottaTile ?? ctx.materials.tile,
  fasciaMat = ctx.materials.wood,
  gableMat = ctx.materials.wallDefault,
) {
  const { box, beam, cyl, emit, materials: m } = ctx;
  const halfW = w / 2 + 0.18;
  const zEnd = zStart + depth + 0.25;
  const midZ = (zStart + zEnd) / 2;
  const slope = Math.atan2(rise, halfW);
  const slopeLen = Math.hypot(halfW, rise);
  const ridgeLen = zEnd - zStart;

  for (const s of [-1, 1]) {
    // 1. Structural Roof Deck Plate
    const plateX = cx + (s * halfW) / 2;
    const plateY = baseY + rise / 2;
    box(tileMat, plateX, plateY, midZ, slopeLen, 0.075, ridgeLen, 0, 0, -s * slope);

    // 2. Physical 3D Barrel Tile Fluted Ridges (Barisan Genteng Lengkung Mengalir ke Bawah)
    for (let zz = zStart + 0.14; zz <= zEnd - 0.06; zz += 0.28) {
      beam(tileMat, [cx, baseY + rise + 0.038, zz], [cx + s * halfW, baseY + 0.038, zz], 0.030);
    }

    // 3. Molded Wooden Fascia Board (Lisplang Kayu Bertingkat)
    const eaveX = cx + s * halfW;
    box(fasciaMat, eaveX, baseY, midZ, 0.045, 0.18, ridgeLen);
    box(fasciaMat, eaveX + s * 0.015, baseY - 0.05, midZ, 0.025, 0.08, ridgeLen);

    // 4. Exposed Wooden Rafter Tails (Kaso-kaso / Usuk Kayu)
    for (let zz = zStart + 0.15; zz < zEnd; zz += 0.45) {
      box(m.wood, eaveX - s * 0.16, baseY - 0.05, zz, 0.32, 0.065, 0.065, 0, 0, -s * slope);
    }

    // 5. Hanging Rain Gutter with Metal Support Brackets (Talang Air Seng/PVC)
    const gutterX = eaveX + s * 0.045;
    const gutterY = baseY - 0.02;
    cyl(m.roofGrey, gutterX, gutterY, midZ, 0.035, ridgeLen, Math.PI / 2);
    for (let bz = zStart + 0.3; bz <= zEnd; bz += 0.9) {
      box(m.dark, gutterX, gutterY - 0.03, bz, 0.018, 0.05, 0.025);
    }
  }

  // 6. 3D Wuwungan / Ridge Cap with Overlapping Ceramic Collars & End Peaks (Jengger Nok)
  const apexY = baseY + rise + 0.05;
  cyl(tileMat, cx, apexY, midZ, 0.095, ridgeLen, Math.PI / 2);
  for (let zz = zStart + 0.12; zz <= zEnd - 0.08; zz += 0.30) {
    emit(new T.TorusGeometry(0.102, 0.014, 6, 16), tileMat, cx, apexY, zz, 1, 1, 1);
  }

  // Decorative Ridge Finials at Gable Ends
  for (const gz of [zStart, zEnd]) {
    emit(new T.ConeGeometry(0.055, 0.16, 6), tileMat, cx, apexY + 0.10, gz, 1, 1, 1, Math.PI / 6);
    emit(new T.SphereGeometry(0.038, 8, 8), tileMat, cx, apexY + 0.18, gz);
  }

  // 7. Triangular Gable Walls & Bargeboards
  for (const gz of [zStart, zEnd]) {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.Float32BufferAttribute([cx - halfW, baseY, gz, cx + halfW, baseY, gz, cx, baseY + rise, gz], 3),
    );
    g.setIndex([0, 2, 1]);
    g.computeVertexNormals();
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    emit(g, gableMat, 0, 0, 0);

    for (const s of [-1, 1]) {
      beam(fasciaMat, [cx, baseY + rise + 0.05, gz], [cx + s * halfW, baseY, gz], 0.05);
    }
  }
}


/**
 * Realistic Asymmetrical / Shed Corrugated Asbestos or Zinc Roof (Atap Seng/Asbes)
 */
export function buildCorrugatedRoof(
  ctx: WorldContext,
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  zStart: number,
  zEnd: number,
  mat = ctx.materials.roofGrey,
  fasciaMat = ctx.materials.wood,
) {
  const { box, beam, materials: m } = ctx;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const depth = zEnd - zStart;
  const midZ = (zStart + zEnd) / 2;

  box(mat, midX, midY, midZ, len, 0.04, depth, 0, 0, angle);

  const waveSpacing = 0.09;
  for (let zz = zStart; zz <= zEnd; zz += waveSpacing) {
    beam(mat, [x1, y1 + 0.02, zz], [x2, y2 + 0.02, zz], 0.016);
  }

  for (let rz = zStart + 0.15; rz <= zEnd; rz += 0.5) {
    beam(m.wood, [x1 + 0.1, y1 - 0.04, rz], [x2 - 0.1, y2 - 0.04, rz], 0.035);
  }

  box(fasciaMat, x1, y1 - 0.04, midZ, 0.04, 0.16, depth + 0.04);
  box(fasciaMat, x2, y2 - 0.04, midZ, 0.04, 0.16, depth + 0.04);
}

/**
 * Protruding Base Plinth (Batur Bawah / Water Table)
 * Eliminates the "floating low-poly box" look by giving houses a solid architectural foundation.
 */
export function buildBasePlinth(
  ctx: WorldContext,
  cx: number,
  cz: number,
  w: number,
  d: number,
  h = 0.28,
  mat: T.Material = ctx.materials.concrete,
  protrusion = 0.06,
) {
  const { box } = ctx;
  box(mat, cx, h / 2, cz, w + protrusion * 2, h, d + protrusion * 2);
  // Beveled top lip
  box(mat, cx, h + 0.015, cz, w + protrusion * 2 + 0.02, 0.03, d + protrusion * 2 + 0.02);
}

/**
 * Recessed Window with Frame Reveal, Sill, Concrete Hood & Security Grille (Teralis)
 */
export function buildDeepWindow(
  ctx: WorldContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  frameMat = ctx.materials.white,
  grilleMat = ctx.materials.dark,
  hasHood = true,
) {
  const { box, materials: m } = ctx;
  const glass = m.glass;
  const frameD = 0.14;

  // 1. Recessed Reflective Window Glass Pane
  box(glass, x, y, z - 0.045, w - 0.08, h - 0.08, 0.02);

  // 2. Multi-Step Outer Frame Reveal (Kusen Bertingkat)
  for (const dx of [-(w - 0.05) / 2, (w - 0.05) / 2]) {
    box(frameMat, x + dx, y, z - 0.02, 0.065, h, frameD);
    box(frameMat, x + dx + (dx > 0 ? -0.02 : 0.02), y, z - 0.035, 0.025, h - 0.06, frameD * 0.8);
  }
  for (const dy of [-(h - 0.05) / 2, (h - 0.05) / 2]) {
    box(frameMat, x, y + dy, z - 0.02, w, 0.065, frameD);
    box(frameMat, x, y + dy + (dy > 0 ? -0.02 : 0.02), z - 0.035, w - 0.06, 0.025, frameD * 0.8);
  }

  // 3. Central Mullion & Transom Bars
  if (w > 0.8) {
    box(frameMat, x, y, z - 0.02, 0.05, h - 0.08, frameD * 0.85);
  }
  if (h > 1.2) {
    box(frameMat, x, y + h * 0.15, z - 0.02, w - 0.08, 0.045, frameD * 0.85);
  }

  // 4. Molded Sloping Concrete Sill with Water Drip (Bantalan Kusen Bawah)
  const sillW = w + 0.16;
  const sillY = y - h / 2 - 0.035;
  box(m.concrete, x, sillY, z + 0.025, sillW, 0.07, frameD + 0.09);
  box(m.concrete, x, sillY - 0.03, z + 0.055, sillW - 0.04, 0.02, 0.03); // drip edge

  // 5. Overhanging Concrete Weather Hood (Topi Jendela Beton)
  if (hasHood) {
    const hoodW = w + 0.24;
    const hoodY = y + h / 2 + 0.065;
    box(m.concrete, x, hoodY, z + 0.06, hoodW, 0.075, 0.26);
    // Chamfered slope on top of hood
    box(m.concrete, x, hoodY + 0.035, z + 0.03, hoodW - 0.02, 0.03, 0.18);
  }

  // 6. Security Grille with Ornamental Twisted Nodes (Teralis Besi Tempa)
  const numBars = Math.floor(w / 0.18);
  for (let i = 1; i <= numBars; i++) {
    const bx = x - w / 2 + (i / (numBars + 1)) * w;
    // Vertical iron bar
    box(grilleMat, bx, y, z - 0.025, 0.018, h - 0.12, 0.018);
    // Decorative diamond node rings
    for (const ky of [y - h * 0.22, y + h * 0.22]) {
      box(grilleMat, bx, ky, z - 0.025, 0.034, 0.034, 0.024, 0, 0, Math.PI / 4);
    }
  }
}

/**
 * Paneled Indonesian Entrance Door with Transom Glass & Breeze Block (Roster)
 */
export function buildPaneledDoor(
  ctx: WorldContext,
  x: number,
  z: number,
  w = 0.95,
  h = 2.4,
  doorMat = ctx.materials.wood,
  frameMat = ctx.materials.white,
) {
  const { box, materials: m } = ctx;
  const halfW = w / 2;
  const doorH = h * 0.82;
  const transomH = h - doorH;

  // 1. Molded Door Jamb (Kusen Pintu)
  box(frameMat, x - halfW, h / 2, z - 0.02, 0.075, h, 0.14);
  box(frameMat, x + halfW, h / 2, z - 0.02, 0.075, h, 0.14);
  box(frameMat, x, h, z - 0.02, w + 0.08, 0.075, 0.14);
  box(frameMat, x, doorH, z - 0.02, w, 0.055, 0.12);

  // 2. Main Wooden Door Leaf (Daun Pintu)
  const leafY = doorH / 2;
  box(doorMat, x, leafY, z - 0.03, w - 0.06, doorH - 0.04, 0.05);

  // 3. Recessed Raised Panels (Profil Panel Pintu Timbul)
  const panelH = (doorH - 0.35) / 2;
  const panelW = (w - 0.22);
  for (const py of [leafY - doorH * 0.23, leafY + doorH * 0.23]) {
    box(doorMat, x, py, z - 0.012, panelW, panelH, 0.035);
    box(m.dark, x, py, z - 0.005, panelW - 0.04, panelH - 0.04, 0.015);
  }

  // 4. Luxury Door Hardware: Brass/Chrome Lever Handle & Escutcheon Plate
  const handleX = x + (w / 2 - 0.14);
  box(m.gold, handleX, leafY, z + 0.015, 0.038, 0.18, 0.02);
  box(m.chrome ?? m.gold, handleX, leafY + 0.04, z + 0.045, 0.11, 0.022, 0.022);
  box(m.dark, handleX, leafY - 0.04, z + 0.026, 0.012, 0.024, 0.005); // Keyhole

  // 5. 3D Geometric Breeze Blocks / Roster Jalusi (Ventilasi Berongga)
  const rosterY = doorH + transomH / 2;
  box(m.concrete, x, rosterY, z - 0.02, w - 0.06, transomH - 0.04, 0.1);
  for (let rx = -w * 0.28; rx <= w * 0.28; rx += 0.18) {
    // Hollow cross/rectangular cutout
    box(m.dark, x + rx, rosterY, z - 0.015, 0.10, transomH * 0.55, 0.12);
    box(m.concrete, x + rx, rosterY, z - 0.012, 0.03, transomH * 0.65, 0.11);
    box(m.concrete, x + rx, rosterY, z - 0.012, 0.12, 0.03, 0.11);
  }
}


/**
 * Curved Tubular Steel Carport Canopy with Polycarbonate Roof
 */
export function buildCurvedCanopy(
  ctx: WorldContext,
  w: number,
  baseY: number,
  archRise: number,
  frontZ: number,
  rearZ: number,
  frameMat = ctx.materials.rust,
  roofMat = ctx.materials.polycarbonate ?? ctx.materials.roofGrey,
) {
  const { emit, beam, box } = ctx;
  const midZ = (frontZ + rearZ) / 2;

  for (const zz of [frontZ, midZ, rearZ]) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-w / 2, baseY, zz),
      new T.Vector3(0, baseY + archRise, zz),
      new T.Vector3(w / 2, baseY, zz)
    ]);
    emit(new T.TubeGeometry(curve, 20, 0.035, 8, false), frameMat, 0, 0, 0);

    const innerCurve = new T.CatmullRomCurve3([
      new T.Vector3(-w / 2 + 0.12, baseY - 0.15, zz),
      new T.Vector3(0, baseY + archRise - 0.15, zz),
      new T.Vector3(w / 2 - 0.12, baseY - 0.15, zz)
    ]);
    emit(new T.TubeGeometry(innerCurve, 16, 0.02, 6, false), frameMat, 0, 0, 0);
  }

  for (let x = -w / 2 + 0.1; x <= w / 2 - 0.1; x += 0.55) {
    const archH = baseY + archRise * (1 - (x / (w / 2)) ** 2);
    beam(frameMat, [x, archH, frontZ], [x, archH, rearZ], 0.022);
  }

  const numRibs = 32;
  const dz = rearZ - frontZ;
  for (let i = 0; i < numRibs; i++) {
    const x = -w / 2 + (w / numRibs) * (i + 0.5);
    const archH = baseY + archRise * (1 - (x / (w / 2)) ** 2) + 0.02;
    const slope = Math.atan2(-2 * archRise * x / ((w / 2) ** 2), 1);
    box(roofMat, x, archH, midZ, w / numRibs + 0.02, 0.015, dz + 0.1, 0, 0, slope);
  }

  for (const px of [-w / 2 + 0.08, w / 2 - 0.08]) {
    box(frameMat, px, baseY / 2, frontZ, 0.065, baseY, 0.065);
    beam(frameMat, [px, baseY - 0.3, frontZ], [px + (px > 0 ? -0.4 : 0.4), baseY, frontZ], 0.03);
  }
}

