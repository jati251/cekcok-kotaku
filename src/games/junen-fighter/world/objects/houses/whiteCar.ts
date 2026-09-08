import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildBarrelTileRoof, buildBasePlinth } from '../architecture';
import { buildCar } from '../vehicles';
import { buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';
import { buildPlant } from '../vegetation';

export function buildWhiteCarHouse(ctx: WorldContext, p: Property) {
  const { box, beam, cyl, sign, materials: m } = ctx;
  const { wallDefault, roofGrey, white, wood, concrete, terracottaTile, dark, andesite, stone } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  buildBasePlinth(ctx, 0, (front + depth) / 2, w - 0.16, depth, 0.28, m.andesite ?? dark);

  // Driveway Pavers under carport (dark grey stone tiles)
  box(andesite ?? dark, ( -0.35 + w / 2 - 0.1 ) / 2, 0.015, front / 2, (w / 2 - 0.1 - -0.35), 0.03, front);
  for (let x = -0.2; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.2; z < front; z += 0.4) {
      box(dark, x, 0.035, z, 0.38, 0.01, 0.38);
    }
  }

  // Left walkway tiles
  for (let x = -w / 2 + 0.3; x < -0.4; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.38, 0.025, 0.38);
    }
  }

  // Main house volume
  box(wallDefault, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(wallDefault, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Right boundary partition wall (tall white wall separating carport from laundry)
  box(white, w / 2 - 0.08, 1.35, front / 2, 0.16, 2.7, front);
  box(dark, w / 2 - 0.08, 2.72, front / 2, 0.2, 0.05, front + 0.05);

  // 3D Barrel Tile Roof with Ridge Caps & Lisplang
  buildBarrelTileRoof(ctx, 0, w, depth, h, 1.3, front, terracottaTile ?? roofGrey, wood, wallDefault);

  // Deep Recessed Window with Frame Reveal & Security Grille (Living room)
  buildDeepWindow(ctx, -w * 0.26, 1.65, facadeZ, 1.35, 1.7, white, dark, true);

  // Paneled Wooden Front Door with Transom Breeze Blocks
  buildPaneledDoor(ctx, -0.6, facadeZ, 0.95, 2.35, wood, white);

  // Outdoor AC Condenser Unit
  buildOutdoorAC(ctx, -w * 0.42, 2.35, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter
  buildPLNMeter(ctx, -0.15, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.22, facadeZ - 0.08, 2.6, white);

  // Authentic Carport Awning over the driveway (white steel truss + translucent/white corrugated roof)
  const cpLeft = -0.45;
  const cpRight = w / 2 - 0.08;
  const cpWidth = cpRight - cpLeft;
  const cpMidX = (cpLeft + cpRight) / 2;
  const cpFrontY = 2.45;
  const cpBackY = 2.95;

  // Steel posts supporting front awning beam
  cyl(white, cpLeft, cpFrontY / 2, 0.15, 0.04, cpFrontY);
  cyl(white, cpRight - 0.05, cpFrontY / 2, 0.15, 0.04, cpFrontY);

  // Front horizontal steel beam
  box(white, cpMidX, cpFrontY, 0.15, cpWidth + 0.1, 0.08, 0.08);

  // Side rafters
  beam(white, [cpLeft, cpFrontY, 0.15], [cpLeft, cpBackY, front], 0.05);
  beam(white, [cpRight - 0.05, cpFrontY, 0.15], [cpRight - 0.05, cpBackY, front], 0.05);

  // Transverse support purlins
  for (let z = 0.6; z <= front; z += 0.8) {
    const frac = (z - 0.15) / (front - 0.15);
    const py = cpFrontY + frac * (cpBackY - cpFrontY);
    box(white, cpMidX, py, z, cpWidth, 0.04, 0.04);
  }

  // Slanted white carport awning roof sheet
  const awningSlope = Math.atan2(cpBackY - cpFrontY, front - 0.15);
  const awningLen = Math.hypot(front - 0.15, cpBackY - cpFrontY);
  box(white, cpMidX, (cpFrontY + cpBackY) / 2 + 0.03, (0.15 + front) / 2, cpWidth + 0.12, 0.02, awningLen, awningSlope, 0, 0);

  // White car parked in the driveway
  buildCar(ctx, 1.25, 2.05);

  // --- AUTHENTIC STREET BOUNDARY FRONTAGE (matching sv_node4_pink_laundry.png) ---

  // 1. Far Left Corner Pillar: Stacked dark andesite stone (batu templek) with concrete cap
  const postLeftX = -w / 2 + 0.16;
  box(andesite ?? stone, postLeftX, 0.7, 0, 0.34, 1.4, 0.34);
  box(concrete, postLeftX, 1.42, 0, 0.42, 0.06, 0.42);

  // 2. Solid White Boundary Wall with 3 Vertical Black Recessed Niches
  const wallRightX = -0.48;
  const wallLeftX = postLeftX + 0.17;
  const wallWidth = wallRightX - wallLeftX;
  const wallMidX = (wallLeftX + wallRightX) / 2;
  const wallH = 1.26;

  // Stucco body & black coping
  box(white, wallMidX, wallH / 2, 0, wallWidth, wallH, 0.18);
  box(dark, wallMidX, wallH + 0.03, 0, wallWidth + 0.04, 0.06, 0.22);

  // 3 Vertical Recessed Inset Niches with dark contrast backing
  for (let i = 0; i < 3; i++) {
    const nx = wallLeftX + (wallWidth * (i + 1)) / 4;
    // Black recessed opening
    box(dark, nx, 0.65, -0.06, 0.22, 0.72, 0.07);
    // Molded outer frame reveal
    box(white, nx, 0.27, -0.07, 0.26, 0.04, 0.05);
    box(white, nx, 1.03, -0.07, 0.26, 0.04, 0.05);
    box(white, nx - 0.12, 0.65, -0.07, 0.03, 0.74, 0.05);
    box(white, nx + 0.12, 0.65, -0.07, 0.03, 0.74, 0.05);
  }

  // 3. Center Gate Post with bold black '10'
  const centerPostX = -0.32;
  box(white, centerPostX, 0.75, 0, 0.32, 1.5, 0.32);
  box(dark, centerPostX, 1.52, 0, 0.38, 0.06, 0.38);
  sign('10', centerPostX, 1.15, -0.17, 0.22, 0.22, '#ffffff', '#111827');

  // 4. White Sliding Metal Gate on the Driveway (from center post to right boundary)
  const gateLeft = -0.14;
  const gateRight = w / 2 - 0.1;
  const gateW = gateRight - gateLeft;
  const gateMidX = (gateLeft + gateRight) / 2;
  const gateH = 1.55;

  // Sliding gate frame
  box(white, gateMidX, gateH - 0.03, 0, gateW, 0.06, 0.04);
  box(white, gateMidX, 0.1, 0, gateW, 0.06, 0.04);
  box(white, gateLeft + 0.02, gateH / 2, 0, 0.05, gateH, 0.04);
  box(white, gateRight - 0.02, gateH / 2, 0, 0.05, gateH, 0.04);

  // Vertical white slats
  for (let gx = gateLeft + 0.08; gx < gateRight - 0.06; gx += 0.085) {
    box(white, gx, gateH / 2, 0, 0.022, gateH - 0.1, 0.025);
  }

  // Ground sliding track & wheels
  box(dark, gateMidX, 0.015, 0, gateW + 0.3, 0.02, 0.06);

  // Potted plants along the left garden wall
  for (let i = 0; i < 3; i++) {
    buildPlant(ctx, -2.4 + i * 0.7, 0.7, 0.65);
  }

  // Street Drainage Gutter
  buildDrainGutter(ctx, -front, depth, -w / 2 - 0.25, 0.42);
}

