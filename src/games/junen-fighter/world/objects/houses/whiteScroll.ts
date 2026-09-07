import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDoor, buildDeepWindow, buildBarrelTileRoof } from '../architecture';
import { downpipe, piercedWall, scrollGatePanel, stoneCourses, buildBambooTampah, buildOutdoorAC, buildPLNMeter, buildDrainGutter } from '../detail';

export function buildWhiteScrollHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, sign, materials: m } = ctx;
  const { width: w, depth, setback: f } = p;
  const saved = ctx.transform.clone();

  // Foundation & Porch Tiled Pavement
  box(m.concrete, 0, 0.015, (f + depth) / 2, w, 0.15, f + depth);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < f + 2.2; z += 0.4) {
      box(m.white, x, 0.09, z, 0.38, 0.02, 0.38);
    }
  }

  // Solid left wing wall with deep window openings
  piercedWall(
    ctx,
    -2.65,
    0.08,
    f - 0.2,
    4.35,
    3.7,
    [
      { x: -1.05, y: 1.35, w: 0.28, h: 0.75 },
      { x: -0.15, y: 1.35, w: 0.28, h: 0.75 },
      { x: 0.75, y: 1.35, w: 0.28, h: 0.75 },
      { x: -1.18, y: 2.62, w: 0.52, h: 0.5 },
    ],
    m.white,
  );

  // Structural boundary & partition walls
  box(m.white, -4.76, 1.89, f + depth / 2, 0.24, 3.7, depth);
  box(m.white, -0.52, 1.89, f + depth / 2, 0.24, 3.7, depth);
  box(m.white, 0, 1.89, f + depth, w - 0.4, 3.7, 0.24);
  box(m.white, 4.72, 1.62, f + depth / 2, 0.24, 3.15, depth);

  // Ground floor windows with security grilles & glass
  for (const x of [-3.7, -2.8, -1.9]) {
    buildDeepWindow(ctx, x, 1.45, f - 0.1, 0.34, 0.8, m.dark, m.dark, true);
    // Louver transom vent above window
    box(m.concrete, x, 1.98, f - 0.08, 0.32, 0.14, 0.1);
  }

  // Upper floor small decorative window
  buildDeepWindow(ctx, -3.83, 2.9, f - 0.17, 0.52, 0.5, m.dark, m.dark, true);

  // Recessed right entrance door & large living room window
  buildDoor(ctx, 1.05, f + 2.35, m.wood);
  buildDeepWindow(ctx, 2.15, 1.55, f + 2.35, 0.85, 1.65, m.white, m.gold, true);
  box(m.white, 2.1, 1.55, f + 2.5, 4.8, 3.1, 0.22);

  // Wall-mounted outdoor AC unit on left facade
  buildOutdoorAC(ctx, -4.4, 2.5, f - 0.05, -1);

  // PLN token electricity meter box
  buildPLNMeter(ctx, -0.72, 1.6, f - 0.18, 0);

  // Wall molding trims (profil tali air & ban-banan semen)
  box(m.concrete, -2.65, 2.2, f - 0.12, 4.35, 0.08, 0.06);
  box(m.concrete, 2.1, 2.2, f + 2.4, 4.8, 0.08, 0.06);

  // Plinth skirting along bottom of walls
  box(m.andesite ?? m.dark, -2.65, 0.18, f - 0.16, 4.35, 0.2, 0.08);

  // Realistic 3D Barrel Tile Roofs with Wuwungan Ridge
  for (const [x, rw, y, z, d] of [
    [-2.6, 4.7, 3.7, f - 0.2, depth],
    [1.6, 5.5, 3.15, f + 1.25, depth - 1.2],
  ] as const) {
    ctx.transform.copy(saved).multiply(new T.Matrix4().makeTranslation(x, 0, 0));
    buildBarrelTileRoof(ctx, 0, rw, d, y, 1.25, z, m.terracottaTile ?? m.tile, m.wood, m.white);
    ctx.transform.copy(saved);
  }

  // Decorative pediment medallion (rosette)
  emit(new T.TorusGeometry(0.18, 0.035, 8, 36), m.concrete, -2.6, 4.37, f - 0.255);
  emit(new T.CircleGeometry(0.165, 36), m.dark, -2.6, 4.37, f - 0.26, 1, 1, 1, 0, Math.PI);

  // Timber carport canopy with corrugated sheets & purlins
  const front = 0.22, rear = f + 1.4;
  const canopyLen = rear - front;
  const canopyMidZ = (front + rear) / 2;
  box(m.polycarbonate ?? m.tile, 1.65, 2.94, canopyMidZ, 6.15, 0.065, canopyLen, -0.08);

  // Purlins & corrugated roof ribs
  for (let x = -1.4; x < 4.8; x += 0.37) {
    beam(m.wood, [x, 2.74, front], [x, 3.03, rear], 0.035);
    for (let z = front; z < rear; z += 0.29) {
      emit(new T.CylinderGeometry(0.065, 0.07, 0.3, 12, 1, true, 0, Math.PI), m.tile, x, 2.98 + (z - canopyMidZ) * 0.08, z, 1, 1, 1, Math.PI / 2);
    }
  }

  // Carport timber support beams & posts
  box(m.wood, 1.65, 2.76, front, 6.2, 0.19, 0.14);
  for (const x of [-1.32, 4.7]) {
    box(m.wood, x, 1.39, 0.25, 0.115, 2.78, 0.115);
    beam(m.wood, [x, 2.18, 0.25], [x, 2.76, 0.85], 0.055);
  }

  // Rainwater downpipe with wall brackets
  downpipe(ctx, -0.92, 0.19, 2.77, m.clay);

  // Front Fence & Gate: Black Andesite Stone Pillars with Pyramid White Caps
  const gateXs = [-4.56, -2.85, -1.14, 0.57, 2.28, 4.56];
  for (let i = 0; i < gateXs.length; i++) {
    const x = gateXs[i];
    // Main pillar body
    box(m.white, x, 0.93, 0, 0.26, 1.86, 0.32);
    // Black natural andesite stone block cladding (batu candi)
    stoneCourses(ctx, x, 0.12, -0.17, 0.22, 1.55, m.andesite ?? m.dark);
    // Pyramid beveled white concrete pillar cap
    box(m.white, x, 1.87, 0, 0.34, 0.07, 0.38);
    emit(new T.ConeGeometry(0.22, 0.1, 4), m.white, x, 1.94, 0, 1, 1, 1, 0, Math.PI / 4);
  }

  // THE ICONIC INDONESIAN DETAIL: Bamboo Tampah drying kerupuk on the fence pillar!
  buildBambooTampah(ctx, 2.28, 1.96, 0, 0.32);

  // Base low curb wall under fence
  stoneCourses(ctx, 0, 0.02, -0.06, w - 0.5, 0.28, m.andesite ?? m.dark);

  // White wrought-iron ornamental gate panels with gold medallions
  for (let i = 0; i < gateXs.length - 1; i++) {
    const a = gateXs[i], b = gateXs[i + 1];
    scrollGatePanel(ctx, (a + b) / 2, -0.035, b - a - 0.24, 1.65);
  }

  // Side fence panel
  ctx.transform.copy(saved).multiply(new T.Matrix4().makeTranslation(-4.56, 0, 0.8)).multiply(new T.Matrix4().makeRotationY(Math.PI / 2));
  scrollGatePanel(ctx, 0, 0, 1.55, 1.65);
  ctx.transform.copy(saved);

  // Yellow trash warning sign on the gate
  sign('DILARANG\nBUANG SAMPAH', 0.57, 1.05, -0.08, 0.38, 0.28, '#f4d03f', '#b03a2e');

  // Roadside concrete drainage ditch
  buildDrainGutter(ctx, -f, depth, -w / 2 - 0.25, 0.42);
}
