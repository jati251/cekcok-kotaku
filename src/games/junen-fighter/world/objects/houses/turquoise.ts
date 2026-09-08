import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildBarrelTileRoof, buildBasePlinth } from '../architecture';
import { scroll, piercedWall, buildOutdoorAC, buildPLNMeter, buildRealisticScooter, buildDrainGutter } from '../detail';
import { layeredGable, archedCasements, turquoiseFence, limestoneSkirting } from '../turquoiseDetails';
import { buildTree, buildHedge } from '../vegetation';

export function buildTurquoiseHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, sign, materials: m } = ctx;
  const { teal, white, roofGrey, rust, dark, leafMats, concrete, marbleWainscot, terracottaTile, polycarbonate } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front + 0.14;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  buildBasePlinth(ctx, 0, (front + depth) / 2, w - 0.16, depth, 0.28, m.andesite ?? dark);

  // Porch tile floor
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Pierced facade wall
  piercedWall(
    ctx,
    0,
    0,
    front,
    w - 0.16,
    h,
    [
      { x: -1.65, y: 0.575, w: 1.7, h: 1.95 },
      { x: 0.6, y: 0.05, w: 1.02, h: 2.45 },
    ],
    teal,
  );
  box(teal, 0, h / 2, front + depth, w - 0.16, h, 0.22);
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
    box(teal, x, h / 2, front + depth / 2, 0.2, h, depth);
  }
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(teal, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Diagonal ceramic marble wainscoting on lower half of facade
  box(marbleWainscot ?? concrete, 0, 0.5, facadeZ - 0.02, w - 0.2, 1.0, 0.04);
  limestoneSkirting(ctx, w - 0.2, front - 0.055);

  // Overlapping 3D Barrel Tile Roofs
  const propertyTransform = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(-1.2, 0, 0));
  buildBarrelTileRoof(ctx, 0, 5.3, depth, h, 1.35, front, terracottaTile ?? roofGrey, m.wood, teal);
  ctx.transform.copy(propertyTransform).multiply(new T.Matrix4().makeTranslation(0.8, 0, 0));
  buildBarrelTileRoof(ctx, 0, 4.2, 2.6, 3.1, 1.15, front - 0.55, terracottaTile ?? roofGrey, m.wood, teal);
  ctx.transform.copy(propertyTransform);

  // Arched casement windows and paneled door
  archedCasements(ctx, -1.65, 1.55, facadeZ, 1.7, 1.95);

  // 2-Leaf paneled entrance door with top jalusi ventilation
  box(white, 0.6, 1.15, facadeZ - 0.02, 0.96, 2.3, 0.08);
  box(white, 0.6, 1.15, facadeZ - 0.04, 0.9, 2.2, 0.04);
  for (let dy = -0.7; dy <= 0.7; dy += 0.45) {
    box(dark, 0.6, 1.15 + dy, facadeZ - 0.05, 0.76, 0.32, 0.02);
  }
  // Jalusi louver transom above door
  for (let dy = 0; dy < 4; dy++) {
    box(dark, 0.6, 2.05 + dy * 0.06, facadeZ - 0.05, 0.8, 0.03, 0.03, -0.2);
  }

  // Outdoor AC Condenser Unit on upper left wall
  buildOutdoorAC(ctx, -2.85, 2.65, front - 0.15, -1);

  // PLN Digital Token Electricity Meter Box
  buildPLNMeter(ctx, 1.25, 1.6, facadeZ - 0.02, 0);

  // House number plate ("81A")
  sign('81A', 0.08, 1.95, facadeZ - 0.03, 0.28, 0.18, '#ffffff', '#1a5276');

  // Second-floor room & upper arched casements
  box(teal, 1.9, 4.55, front + 2.8, 3.6, 2.5, 3.6);
  archedCasements(ctx, 1.9, 4.9, front + 0.94, 1.5, 1.7);
  box(roofGrey, 1.9, 6.03, front + 2.5, 4.1, 0.12, 4.7, -0.09);
  layeredGable(ctx, -1.2, h, front - 0.37, 2.95, 1.3);
  layeredGable(ctx, 0.8, 3.1, front - 0.92, 2.4, 1.3, true);

  // Curved Tubular Steel Carport Canopy with Translucent Polycarbonate Roof
  const canopyArchRise = 0.58;
  for (const zz of [0.1, 1.15, front]) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-3.3, 2.55, zz),
      new T.Vector3(0, 2.55 + canopyArchRise, zz),
      new T.Vector3(3.3, 2.55, zz),
    ]);
    emit(new T.TubeGeometry(curve, 20, 0.035, 8, false), rust, 0, 0, 0);
  }

  // Longitudinal purlins
  for (let x = -3.3; x <= 3.3; x += 0.65) {
    beam(rust, [x, 2.55 + canopyArchRise * (1 - (x / 3.3) ** 2), 0.1], [x, 2.55 + canopyArchRise * (1 - (x / 3.3) ** 2), front], 0.025);
  }

  // Curved polycarbonate canopy sheet
  const numCanopyRibs = 24;
  for (let i = 0; i < numCanopyRibs; i++) {
    const u = (i + 0.5) / numCanopyRibs;
    const ax = -3.3 + u * 6.6;
    const ay = 2.55 + canopyArchRise * (1 - (ax / 3.3) ** 2) + 0.02;
    const slope = Math.atan2((-2 * canopyArchRise * ax) / (3.3 ** 2), 1);
    box(polycarbonate ?? roofGrey, ax, ay, (0.1 + front) / 2, 6.6 / numCanopyRibs + 0.02, 0.015, front - 0.1 + 0.05, 0, 0, slope);
  }

  // White diamond lattice work (teralis wajik) under front canopy arch
  for (let x = -3; x <= 3; x += 0.55) {
    const y = 2.55 + canopyArchRise * (1 - (x / 3.3) ** 2);
    scroll(ctx, x, y - 0.1, 0.085, rust, 0.085);
    beam(white, [x - 0.13, y - 0.2, 0.1], [x, y - 0.07, 0.1], 0.012);
    beam(white, [x, y - 0.07, 0.1], [x + 0.13, y - 0.2, 0.1], 0.012);
    beam(white, [x + 0.13, y - 0.2, 0.1], [x, y - 0.33, 0.1], 0.012);
    beam(white, [x, y - 0.33, 0.1], [x - 0.13, y - 0.2, 0.1], 0.012);
  }

  for (let x = 0.2; x < 3.8; x += 0.42) {
    box(dark, x, 5.91, front + 2.5, 0.065, 0.13, 4.5, -0.09);
  }

  // Highly detailed parked motorcycle (Honda Beat / Vario style)
  buildRealisticScooter(ctx, -1.15, 1.5, 0.35, dark);

  // Gnarled tree with climbing vines on the left
  buildTree(ctx, -2.85, 0.65, 5.6);
  buildHedge(ctx, 1.6, 1.1, 2, 2);

  // Climbing vines around trunk
  for (let i = 0; i < 220; i++) {
    const a = i * 2.4;
    const y = 0.35 + i * 0.019;
    emit(
      new T.PlaneGeometry(1, 1),
      leafMats[i % 4],
      -2.85 + Math.sin(a) * 0.23,
      y,
      0.65 + Math.cos(a) * 0.23,
      0.36,
      0.43,
      1,
      0.2,
      a,
      0.2,
    );
  }

  // Front Fence
  turquoiseFence(ctx, w);

  // Street Drainage Gutter along the property front
  buildDrainGutter(ctx, -0.5, front + 0.5, -w / 2 - 0.25, 0.42);
}
