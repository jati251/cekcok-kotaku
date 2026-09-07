import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildBarrelTileRoof } from '../architecture';
import { ornateRail, stoneCourses, buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';

export function buildPinkHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, materials: m } = ctx;
  const { width: w, height: h, depth, setback: f } = p;
  const facadeZ = f - 0.08;

  // Foundation & Porch Pavement
  box(m.concrete, 0, -0.01, (f + depth) / 2, w, 0.15, f + depth);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < f; z += 0.4) {
      box(m.white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Ground floor garage opening & main volume
  box(m.pink, 0, (h + 2.7) / 2, f + depth / 2, w - 0.16, h - 2.7, depth);
  box(m.pink, 1.4, 1.35, f + depth / 2, w - 3.0, 2.7, depth);
  box(m.cream, -3.4, 1.3, f + depth - 0.1, 2.9, 2.6, 0.18);
  box(m.pink, -w / 2 + 0.12, 1.35, f + depth / 2, 0.24, 2.7, depth);
  box(m.dark, -3.3, 0.03, f + 1.8, 3.1, 0.08, 3.8);

  // 3D Barrel Tile Roof with Ridge Caps & Lisplang
  buildBarrelTileRoof(ctx, 0, w, depth, h, 1.5, f, m.terracottaTile ?? m.pink, m.wood, m.pink);

  // Parapet eave cornices
  for (const y of [h - 0.15, h + 0.02, h + 0.16]) {
    box(m.white, 0, y, f - 0.28, w + 0.7, 0.09, 0.6);
  }

  // Salmon colored ceramic wall tile grid pattern on upper facade
  for (let x = -w / 2 + 0.26; x < w / 2 - 0.1; x += 0.48) {
    for (let y = 2.85; y < h - 0.24; y += 0.48) {
      box(m.salmon, x, y, f - 0.025, 0.47, 0.47, 0.055);
    }
  }

  // Ground floor entrance door & window
  buildDeepWindow(ctx, 1.2, 1.6, facadeZ, 2.3, 1.85, m.wood, m.dark, true);
  buildPaneledDoor(ctx, -1.1, facadeZ, 0.95, 2.35, m.wood, m.white);

  // Second-floor deep window behind balcony
  buildDeepWindow(ctx, 0.8, 5.05, facadeZ, 2.2, 2.2, m.wood, m.gold, true);

  // Cantilevered curved 2nd-floor balcony slab
  const save = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(0.9, 0, 0));
  const shape = new T.Shape();
  shape.moveTo(-2.1, f);
  shape.lineTo(2.1, f);
  shape.lineTo(2.1, f - 1.15);
  shape.quadraticCurveTo(0, f - 1.7, -2.1, f - 1.15);
  shape.closePath();
  const slab = new T.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 24,
  });
  slab.rotateX(Math.PI / 2);
  emit(slab, m.pink, 0, 3.47, 0);

  // Ornate classical wrought-iron railing with gold medallions
  ornateRail(ctx, 4.1, 3.48, f - 1.24, 1.05, false, true);
  ctx.transform.copy(save);

  // Outdoor AC Condenser Units on upper facade
  buildOutdoorAC(ctx, -2.2, 5.1, facadeZ - 0.12, -1);

  // PLN Token Electricity Meter Box
  buildPLNMeter(ctx, -1.8, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.25, facadeZ - 0.08, h * 0.85, m.white);

  // Wide ground-floor canopy / awning
  buildAwning(ctx, w - 0.2, 1.45, 2.65, f, m.tile, m.dark);

  // 4 Traditional Indonesian bamboo bird cages (sangkar burung perkutut) hanging under eave (Ground Truth Street View)
  const awningFrontZ = f - 1.45; // ~0.25
  const eaveY = 2.65 - 1.45 * 0.04;
  for (let i = 0; i < 4; i++) {
    const cx = -1.2 + i * 0.85;
    const cy = eaveY - 0.38;
    const cz = awningFrontZ + 0.14;
    beam(m.dark, [cx, eaveY, cz], [cx, cy + 0.2, cz], 0.006);
    emit(new T.TorusGeometry(0.035, 0.008, 4, 12), m.gold, cx, cy + 0.2, cz);
    emit(new T.CylinderGeometry(0.16, 0.19, 0.32, 12), m.wood, cx, cy, cz);
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      beam(m.dark, [cx + Math.cos(ang) * 0.17, cy - 0.16, cz + Math.sin(ang) * 0.17], [cx + Math.cos(ang) * 0.14, cy + 0.16, cz + Math.sin(ang) * 0.14], 0.006);
    }
    box(m.clay, cx, cy - 0.17, cz, 0.15, 0.03, 0.15);
  }

  // Pillars with stone cladding & pyramid caps
  for (const x of [-4.7, -1.6, 1.5, 4.6]) {
    box(m.pink, x, 0.9, 0, 0.39, 1.8, 0.4);
    box(m.pink, x, 1.85, 0, 0.55, 0.13, 0.55);
    emit(new T.ConeGeometry(0.35, 0.12, 4), m.white, x, 1.95, 0, 1, 1, 1, 0, Math.PI / 4);
    stoneCourses(ctx, x, 0.25, -0.23, 0.23, 1.25, m.andesite ?? m.dark);
  }

  // Front fence ornate railing
  for (const x of [0, 3.1]) {
    ctx.transform.copy(save).multiply(new T.Matrix4().makeTranslation(x, 0, 0));
    ornateRail(ctx, 2.65, 0.25, -0.03, 1.25);
  }
  ctx.transform.copy(save);

  // Wooden maintenance ladder propped against the canopy
  for (const x of [-4.35, -3.85]) {
    beam(m.wood, [x, 0.04, f - 0.9], [x, 3.3, f - 0.04], 0.045);
  }
  for (let y = 0.25; y < 3.3; y += 0.28) {
    beam(m.wood, [-4.35, y, f - 0.9 + y * 0.26], [-3.85, y, f - 0.9 + y * 0.26], 0.035);
  }

  // Rooftop concrete water tank / dome
  emit(new T.SphereGeometry(0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), m.concrete, -4.2, 5.7, f + 0.2, 1, 0.25, 1, 0.5, 0, 0.4);

  // Street Drainage Gutter
  buildDrainGutter(ctx, -f, depth, -w / 2 - 0.25, 0.42);
}
