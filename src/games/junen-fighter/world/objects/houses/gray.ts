import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildBarrelTileRoof, buildFence, buildBasePlinth } from '../architecture';
import { stoneCourses, buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';
import { buildHedge } from '../vegetation';

export function buildGrayHouse(ctx: WorldContext, p: Property) {
  const { box, emit, materials: m } = ctx;
  const { wallGray, roofGrey, white, dark, concrete, andesite } = m;
  const { width: w, height: h, depth, setback: f } = p;
  const facadeZ = f - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (f + depth) / 2, w, 0.15, f + depth);
  buildBasePlinth(ctx, 0, (f + depth) / 2, w - 0.16, depth, 0.28, andesite ?? dark);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < f; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main house volume (Modern gray finish)
  box(wallGray, 0, h / 2, f + depth / 2, w - 0.16, h, depth);
  box(concrete, 0, h + 0.08, f + depth / 2, w, 0.14, depth);

  // Decorative wall band trims (profil tali air)
  for (const y of [h - 0.14, h + 0.2]) {
    box(white, 0, y, f - 0.08, w + 0.2, 0.08, 0.2);
  }

  // 3D Barrel Tile Roof with Ridge Caps & Lisplang
  buildBarrelTileRoof(ctx, 0, w, depth, h + 0.1, 1.25, f, roofGrey, m.wood, wallGray);

  // Deep Recessed Windows with Security Grilles & Molded Sills
  buildDeepWindow(ctx, -2.0, 1.6, facadeZ, 1.35, 1.7, white, dark, true);

  // Paneled Wooden Front Door with Transom Breeze Blocks
  buildPaneledDoor(ctx, 1.2, facadeZ, 0.95, 2.35, m.wood, white);

  // Outdoor AC Condenser Unit
  buildOutdoorAC(ctx, -w * 0.42, 2.4, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter Box
  buildPLNMeter(ctx, 1.85, 1.6, facadeZ - 0.05, 0);

  // Rainwater Downpipe
  downpipe(ctx, -w / 2 + 0.25, facadeZ - 0.08, 2.8, white);

  // Porch Canopy / Awning
  buildAwning(ctx, w - 0.2, f + 0.12, 2.95, f, roofGrey, white);

  // Front boundary wall with natural andesite stone cladding (batu andesit)
  box(wallGray, -1.75, 0.78, 0, 3.4, 1.55, 0.22);
  stoneCourses(ctx, -1.75, 0.05, -0.13, 3.4, 1.4, andesite ?? wallGray);

  // Pillars with stone cladding & beveled caps
  for (const x of [-w / 2 + 0.2, 0.1, w / 2 - 0.18]) {
    box(wallGray, x, 1.15, 0, 0.44, 2.3, 0.44);
    for (const dx of [-0.23, 0.23]) {
      box(white, x + dx, 1.15, -0.22, 0.065, 2.3, 0.05);
    }
    stoneCourses(ctx, x, 0.18, -0.25, 0.2, 1.9, andesite ?? dark);
    box(white, x, 2.29, 0, 0.58, 0.11, 0.55);
    emit(new T.ConeGeometry(0.3, 0.1, 4), white, x, 2.38, 0, 1, 1, 1, 0, Math.PI / 4);
  }

  // Sliding metal gate
  const saved = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(1.7, 0, 0));
  buildFence(ctx, 3.1, 'gray', wallGray);
  ctx.transform.copy(saved);

  // Climbing hedge / vine wall
  buildHedge(ctx, -1.7, 0.3, 3.4, 2.25);

  // Rooftop Water Tanks with inlet pipes
  for (const [x, z, mat] of [
    [-2, f + 2, m.cream],
    [2, f + 4, m.blue],
  ] as const) {
    emit(new T.CylinderGeometry(0.48, 0.48, 0.95, 24), mat, x, h + 0.55, z);
    emit(new T.TorusGeometry(0.48, 0.035, 6, 24), mat, x, h + 0.98, z, 1, 1, 1, Math.PI / 2);
    box(concrete, x, h + 0.04, z, 1.1, 0.08, 1.1);
  }

  // Street Drainage Gutter
  buildDrainGutter(ctx, -f, depth, -w / 2 - 0.25, 0.42);
}
