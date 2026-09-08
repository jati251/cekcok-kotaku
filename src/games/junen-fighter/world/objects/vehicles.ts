import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { WorldContext } from '../types';
import { buildRealisticScooter } from './detail';

export { buildRealisticScooter };

export function buildScooter(ctx: WorldContext, x: number, z: number, color: T.Material) {
  buildRealisticScooter(ctx, x, z, 0, color);
}

// Cross-sections describe the body silhouette, keeping the roof, hood and hatch continuous.
export function buildCar(ctx: WorldContext, x: number, z: number, covered = false, paint = ctx.materials.white) {
  const { box, cyl, emit, beam, materials: m } = ctx;
  const chrome = m.chrome ?? m.white;
  const dark = m.dark;
  const rubber = m.rubber;
  const glass = m.glass;

  const sections = [
    [-1.78, 0.60, 0.74],
    [-1.65, 0.78, 1.05],
    [-1.30, 0.80, 1.45],
    [-0.95, 0.81, 1.61],
    [0.38, 0.80, 1.62],
    [0.85, 0.78, 1.12],
    [1.48, 0.75, 0.98],
    [1.76, 0.62, 0.83],
  ];
  const ring = 24;
  const positions: number[] = [];
  const indices: number[] = [];
  const uv: number[] = [];

  sections.forEach(([zz, w, top], i) => {
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      const xx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.32) * w;
      const yy = 0.3 + (top - 0.3) * (Math.sin(a) * 0.5 + 0.5);
      const fold = covered ? 0.022 * Math.sin(j * 3.2 + i * 1.1) * (1 - Math.max(0, Math.sin(a))) : 0;
      positions.push(xx + fold, yy, zz);
      uv.push(j / ring, i / (sections.length - 1));
      if (i < sections.length - 1) {
        const n = i * ring + j;
        const k = i * ring + ((j + 1) % ring);
        indices.push(n, k, n + ring, k, k + ring, n + ring);
      }
    }
  });

  for (const i of [0, sections.length - 1]) {
    const center = positions.length / 3;
    positions.push(0, 0.65, sections[i][0]);
    uv.push(0.5, 0.5);
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j;
      const b = i * ring + ((j + 1) % ring);
      indices.push(...(i === 0 ? [center, b, a] : [center, a, b]));
    }
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();

  emit(g, covered ? (m.silverCover ?? m.cloth[2]) : paint, x, 0, z);

  // Wheel assemblies and side flanks
  for (const side of [-1, 1]) {
    for (const zz of [-1.13, 1.1]) {
      // Deep rubber tire with rounded sidewall
      emit(new T.TorusGeometry(0.25, 0.082, 12, 32), rubber, x + side * 0.77, 0.34, z + zz, 1, 1, 1, 0, Math.PI / 2);
      // Outer tire tread barrel
      cyl(rubber, x + side * 0.77, 0.34, z + zz, 0.33, 0.17, 0, Math.PI / 2);
      // Brake rotor disc (steel)
      cyl(chrome, x + side * 0.79, 0.34, z + zz, 0.2, 0.015, 0, Math.PI / 2);
      // Red sports brake caliper
      box(m.cloth[0] ?? dark, x + side * 0.79, 0.44, z + zz + 0.08, 0.04, 0.08, 0.06);
      // Recessed wheel rim barrel
      emit(new T.CylinderGeometry(0.22, 0.22, 0.05, 24), dark, x + side * 0.83, 0.34, z + zz, 1, 1, 1, 0, 0, Math.PI / 2);
      // 5-split dual-spoke alloy rim in chrome
      for (let spoke = 0; spoke < 5; spoke++) {
        const a = (spoke * Math.PI * 2) / 5;
        const a1 = a - 0.12;
        const a2 = a + 0.12;
        beam(chrome, [x + side * 0.85, 0.34, z + zz], [x + side * 0.85, 0.34 + Math.sin(a1) * 0.2, z + zz + Math.cos(a1) * 0.2], 0.018);
        beam(chrome, [x + side * 0.85, 0.34, z + zz], [x + side * 0.85, 0.34 + Math.sin(a2) * 0.2, z + zz + Math.cos(a2) * 0.2], 0.018);
      }
      // Center wheel hub cap
      cyl(chrome, x + side * 0.86, 0.34, z + zz, 0.055, 0.02, 0, Math.PI / 2);
    }

    // Side aerodynamic mirrors
    const mirrorColor = covered ? (m.silverCover ?? m.cloth[2]) : paint;
    box(dark, x + side * 0.81, 1.12, z + 0.54, 0.08, 0.035, 0.05); // mirror base arm
    emit(new RoundedBoxGeometry(0.18, 0.11, 0.22, 3, 0.03), mirrorColor, x + side * 0.88, 1.13, z + 0.54);
    if (!covered) {
      // Reflective mirror glass insert
      box(glass, x + side * 0.88, 1.13, z + 0.53, 0.16, 0.09, 0.015, 0, side * 0.12);
    }

    if (!covered) {
      // Side windows and frames
      for (const [zz, len] of [[-0.73, 0.67], [0.05, 0.69]]) {
        box(glass, x + side * 0.796, 1.27, z + zz, 0.018, 0.40, len, 0, 0, side * 0.13);
        box(dark, x + side * 0.807, 1.045, z + zz, 0.024, 0.035, len + 0.04);
        // Door handle with recessed cup
        box(dark, x + side * 0.812, 0.96, z + zz - 0.18, 0.015, 0.035, 0.14);
        box(chrome, x + side * 0.822, 0.96, z + zz - 0.18, 0.02, 0.025, 0.12);
        // Door weather shield (talang air)
        box(dark, x + side * 0.81, 1.48, z + zz, 0.025, 0.03, len + 0.02);
      }
      // B-pillar divider
      box(dark, x + side * 0.79, 1.24, z - 0.34, 0.035, 0.53, 0.045);
      // Lower rocker panel side skirt
      box(dark, x + side * 0.76, 0.38, z, 0.045, 0.07, 1.85);
    }
  }

  if (!covered) {
    // Windshield (front) with ceramic frit border
    box(glass, x, 1.35, z + 0.63, 1.34, 0.66, 0.025, 0.72);
    box(dark, x, 1.35, z + 0.62, 1.36, 0.68, 0.015, 0.72);
    // Rear window with defroster frame
    box(glass, x, 1.27, z - 1.4, 1.25, 0.49, 0.025, -0.5);
    box(dark, x, 1.27, z - 1.39, 1.27, 0.51, 0.015, -0.5);

    // Front windshield wipers (arms, pivot joints, blades)
    for (const dx of [-0.28, 0.28]) {
      cyl(dark, x + dx, 1.05, z + 0.84, 0.018, 0.025);
      beam(dark, [x + dx, 1.05, z + 0.84], [x + dx + 0.22, 1.18, z + 0.72], 0.012);
      beam(rubber, [x + dx + 0.12, 1.14, z + 0.76], [x + dx + 0.36, 1.24, z + 0.66], 0.008);
    }

    // Front headlights: layered assembly with chrome reflectors, projectors, clear outer lenses, and amber turn signals
    for (const dx of [-0.52, 0.52]) {
      // Recessed housing
      box(dark, x + dx, 0.83, z + 1.68, 0.26, 0.14, 0.08);
      // Chrome parabolic reflector dish
      emit(new T.SphereGeometry(0.08, 12, 8), chrome, x + dx, 0.83, z + 1.69, 1, 0.8, 0.4);
      // Projector lens
      emit(new T.SphereGeometry(0.04, 12, 8), m.white, x + dx * 0.9, 0.83, z + 1.71);
      // Amber corner turn indicator
      box(m.cloth[0] ?? dark, x + dx + Math.sign(dx) * 0.11, 0.83, z + 1.67, 0.04, 0.1, 0.06);
      // Clear aerodynamic front glass lens
      box(glass, x + dx, 0.83, z + 1.72, 0.25, 0.13, 0.02);
    }

    // Front chrome radiator grille
    box(dark, x, 0.78, z + 1.74, 0.72, 0.18, 0.04);
    for (let gy = 0.72; gy <= 0.84; gy += 0.04) {
      box(chrome, x, gy, z + 1.76, 0.68, 0.015, 0.02);
    }
    // Front emblem (Toyota/Daihatsu style chrome oval)
    emit(new T.TorusGeometry(0.045, 0.012, 6, 16), chrome, x, 0.8, z + 1.77, 1.4, 1, 1);

    // Lower bumper intake and fog lamps
    box(dark, x, 0.54, z + 1.76, 0.92, 0.22, 0.05);
    for (let y = 0.47; y < 0.63; y += 0.038) {
      box(dark, x, y, z + 1.78, 0.86, 0.012, 0.02);
    }
    // Fog lamps in lower bumper
    for (const fdx of [-0.48, 0.48]) {
      cyl(chrome, x + fdx, 0.54, z + 1.77, 0.045, 0.02, 0, Math.PI / 2);
      emit(new T.SphereGeometry(0.035, 10, 8), m.white, x + fdx, 0.54, z + 1.78);
    }

    // Indonesian Front License Plate ("B 1234 JUN")
    box(rubber, x, 0.44, z + 1.81, 0.44, 0.14, 0.025);
    box(m.white, x, 0.44, z + 1.825, 0.41, 0.008, 0.005); // plate top border
    box(m.white, x, 0.44, z + 1.825, 0.32, 0.05, 0.005); // license plate digits block
    box(m.white, x, 0.39, z + 1.825, 0.08, 0.015, 0.005); // month/year stamp

    // Rear Taillights: layered multi-chamber LED cluster
    for (const dx of [-0.52, 0.52]) {
      // Main red stop lamp housing
      box(m.cloth[0] ?? m.rust, x + dx, 0.86, z - 1.73, 0.2, 0.26, 0.05);
      // Clear reverse light strip
      box(m.white, x + dx, 0.82, z - 1.74, 0.16, 0.045, 0.04);
      // Amber turn signal strip
      box(m.gold ?? m.cloth[0], x + dx, 0.76, z - 1.74, 0.16, 0.04, 0.04);
    }

    // Rear hatch spoiler with third brake light
    box(paint, x, 1.48, z - 1.46, 1.15, 0.04, 0.16);
    box(m.cloth[0] ?? m.rust, x, 1.48, z - 1.54, 0.36, 0.02, 0.02); // high mount stop lamp

    // Rear hatch handle and license plate recess
    box(dark, x, 0.62, z - 1.76, 0.56, 0.26, 0.04);
    // Indonesian Rear License Plate
    box(rubber, x, 0.62, z - 1.78, 0.44, 0.14, 0.02);
    box(m.white, x, 0.62, z - 1.792, 0.32, 0.05, 0.005); // license plate digits
    // License plate lighting bar
    box(paint, x, 0.72, z - 1.76, 0.48, 0.035, 0.05);

    // Rear chrome exhaust tip
    cyl(chrome, x - 0.42, 0.28, z - 1.76, 0.04, 0.18, Math.PI / 2);
    cyl(dark, x - 0.42, 0.28, z - 1.84, 0.032, 0.02, Math.PI / 2);

    // Roof aerodynamic shark-fin antenna
    box(paint, x, 1.63, z - 0.8, 0.04, 0.07, 0.14, -0.2);
  } else {
    // High-fidelity car cover details (elastic bottom hem, wheel cutouts, tie-down ropes)
    box(m.silverCover ?? m.cloth[2], x, 0.32, z, 1.66, 0.06, 3.65);
    // Elastic bottom hem cinch bead
    emit(new T.TorusGeometry(0.29, 0.022, 6, 24), dark, x - 0.78, 0.34, z - 1.13, 1, 1, 1, 0, Math.PI / 2);
    emit(new T.TorusGeometry(0.29, 0.022, 6, 24), dark, x + 0.78, 0.34, z - 1.13, 1, 1, 1, 0, Math.PI / 2);
    emit(new T.TorusGeometry(0.29, 0.022, 6, 24), dark, x - 0.78, 0.34, z + 1.1, 1, 1, 1, 0, Math.PI / 2);
    emit(new T.TorusGeometry(0.29, 0.022, 6, 24), dark, x + 0.78, 0.34, z + 1.1, 1, 1, 1, 0, Math.PI / 2);
  }
}

