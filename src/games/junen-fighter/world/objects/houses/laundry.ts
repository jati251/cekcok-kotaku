import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildCorrugatedRoof, buildBasePlinth } from '../architecture';
import { buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';

export function buildLaundryHouse(ctx: WorldContext, p: Property) {
  const { box, beam, cyl, sign, materials: m } = ctx;
  const { wallDefault, roofGrey, white, dark, wood, concrete, cloth, woodSlat, teakWood } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  buildBasePlinth(ctx, 0, (front + depth) / 2, w - 0.16, depth, 0.28, m.andesite ?? dark);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main shop volume
  box(wallDefault, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(wallDefault, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Realistic Corrugated Asbestos / Zinc Roof
  buildCorrugatedRoof(
    ctx,
    -w / 2 - 0.2,
    w / 2 + 0.2,
    h + 0.85,
    h + 0.15,
    front - 0.3,
    front + depth + 0.3,
    roofGrey,
    wood,
  );

  // Shop front: Wide display window & entrance
  buildDeepWindow(ctx, -w * 0.25, 1.65, facadeZ, 1.55, 1.7, white, dark, true);
  buildPaneledDoor(ctx, 0.8, facadeZ, 1.05, 2.35, wood, white);

  // Outdoor AC Condenser Unit
  buildOutdoorAC(ctx, -w * 0.42, 2.35, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter Box
  buildPLNMeter(ctx, 1.6, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.22, facadeZ - 0.08, 2.5, white);

  // Front Porch Awning with dark metal frame & corrugated sheet
  const awnFrontY = 2.45;
  const awnBackY = 2.95;
  for (const x of [-w / 2 + 0.15, 0, w / 2 - 0.15]) {
    cyl(dark, x, awnFrontY / 2, 0.1, 0.035, awnFrontY);
    beam(dark, [x, awnFrontY, 0.1], [x, awnBackY, front], 0.04);
  }
  box(dark, 0, awnFrontY, 0.1, w - 0.2, 0.06, 0.06);

  // Corrugated roof sheet over porch awning
  const awnSlope = Math.atan2(awnBackY - awnFrontY, front - 0.1);
  const awnLen = Math.hypot(front - 0.1, awnBackY - awnFrontY);
  box(roofGrey, 0, (awnFrontY + awnBackY) / 2 + 0.03, (0.1 + front) / 2, w - 0.1, 0.02, awnLen, awnSlope, 0, 0);

  // --- AUTHENTIC SIGNPOST: JUAL PULSA ELEKTRIK & LAUNDRY (matching sv_node4_pink_laundry.png) ---
  const signX = -0.9;
  const signY = 2.4;
  const signZ = -0.08;
  // Support pole from fence pillar up to sign
  cyl(dark, signX, signY / 2, signZ, 0.025, signY);
  // Signboard with green background and bold white lettering
  sign('JUAL\nPULSA ELEKTRIK\n& LAUNDRY', signX, signY, signZ, 1.35, 0.82, '#1e8449', '#ffffff');

  // Laundry drying rack & clothes hanging on hangers
  beam(dark, [-1.8, 1.8, front - 0.35], [-0.4, 1.8, front - 0.35], 0.012);
  for (let i = 0; i < 4; i++) {
    const cx = -1.6 + i * 0.35;
    beam(dark, [cx, 1.8, front - 0.35], [cx, 1.65, front - 0.35], 0.006);
    box(cloth[i % 3], cx, 1.3, front - 0.35, 0.28, 0.65, 0.03, 0, 0, (i % 2 === 0 ? 0.05 : -0.05));
  }

  // --- AUTHENTIC FRONT FENCE (Warm wood/metal slats on concrete pillars) ---
  const pillarMat = concrete;
  const slatMat = woodSlat ?? teakWood ?? wood;

  // Concrete Boundary Pillars
  for (const px of [-w / 2 + 0.16, -0.15, w / 2 - 0.16]) {
    box(pillarMat, px, 0.75, 0, 0.32, 1.5, 0.32);
    box(concrete, px, 1.53, 0, 0.38, 0.06, 0.38);
  }

  // Left Fence Bay (between left post and center post)
  const leftBayW = (-0.15 - (-w / 2 + 0.16)) - 0.32;
  const leftBayMidX = ((-w / 2 + 0.16 + 0.16) + (-0.15 - 0.16)) / 2;
  // Horizontal steel rail & warm brown slats
  box(dark, leftBayMidX, 0.2, 0, leftBayW, 0.04, 0.04);
  box(dark, leftBayMidX, 1.25, 0, leftBayW, 0.04, 0.04);
  for (let x = leftBayMidX - leftBayW / 2 + 0.08; x < leftBayMidX + leftBayW / 2; x += 0.12) {
    box(slatMat, x, 0.72, 0, 0.08, 1.0, 0.025);
  }

  // Right Gate Bay (between center post and right post)
  const rightBayW = ((w / 2 - 0.16) - -0.15) - 0.32;
  const rightBayMidX = ((-0.15 + 0.16) + (w / 2 - 0.16 - 0.16)) / 2;
  box(dark, rightBayMidX, 0.15, 0, rightBayW, 0.04, 0.04);
  box(dark, rightBayMidX, 1.35, 0, rightBayW, 0.04, 0.04);
  for (let x = rightBayMidX - rightBayW / 2 + 0.08; x < rightBayMidX + rightBayW / 2; x += 0.12) {
    box(slatMat, x, 0.75, 0, 0.08, 1.15, 0.025);
  }

  // Street Drainage Gutter
  buildDrainGutter(ctx, -front, depth, -w / 2 - 0.25, 0.42);
}

