import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildPlant } from '../vegetation';
import { buildPLNMeter, buildDrainGutter, buildOutdoorAC } from '../detail';
import { buildBarrelTileRoof, buildDeepWindow } from '../architecture';

export function buildTreeCourtHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, materials: m } = ctx;
  const { white, concrete, dark, glass, andesite, polycarbonate } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front;
  const halfW = w / 2;

  const woodBrown = new T.MeshStandardMaterial({ color: '#3e2718', roughness: 0.75 });

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & 2-STOREY MAIN BUILDING MASS
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);

  // Left & Center Mass: 2-storey solid building
  const leftMassW = w - 3.4;
  const leftMassCenterX = -halfW + leftMassW / 2;
  box(white, leftMassCenterX, h / 2, front + depth / 2, leftMassW, h, depth);

  // Right Mass (Ground Floor Carport Wall & 2nd Floor Recessed Balcony Wall):
  const rightMassW = 3.4;
  const rightMassCenterX = halfW - rightMassW / 2;
  // Ground floor rear wall
  box(white, rightMassCenterX, 1.4, front + depth / 2, rightMassW, 2.8, depth);
  // 2nd floor rear wall (recessed by 1.3m for the outdoor balcony)
  box(white, rightMassCenterX, 4.3, front + 1.3 + (depth - 1.3) / 2, rightMassW, 2.7, depth - 1.3);
  // 2nd floor right boundary wall
  box(white, halfW - 0.1, 4.3, front + 0.65, 0.2, 2.7, 1.3);

  // ---------------------------------------------------------------------------
  // 2. FRONT COMPOUND WALL & GATE (ACCURATE STREET VIEW 160h)
  // ---------------------------------------------------------------------------
  const stoneWallW = 3.3;
  const stoneWallCenterX = -halfW + stoneWallW / 2 + 0.1; // ~ -2.25
  const stoneWallH = 1.75;

  // Stacked andesite stone wall (batu candi susun sirih)
  box(andesite, stoneWallCenterX, stoneWallH / 2, 0.15, stoneWallW, stoneWallH, 0.28);
  // Stacked horizontal grooves on stone wall
  for (let y = 0.15; y < stoneWallH; y += 0.12) {
    box(dark, stoneWallCenterX, y, 0.005, stoneWallW, 0.015, 0.02);
  }
  // Black top coping slab
  box(dark, stoneWallCenterX, stoneWallH + 0.03, 0.15, stoneWallW + 0.08, 0.06, 0.34);

  // Lush potted plants on top of the andesite wall
  for (let px = stoneWallCenterX - stoneWallW / 2 + 0.45; px <= stoneWallCenterX + stoneWallW / 2 - 0.3; px += 0.65) {
    // Terracotta / black pot
    box(dark, px, stoneWallH + 0.12, 0.15, 0.26, 0.14, 0.26);
    // Green fern / leafy plant
    buildPlant(ctx, px, 0.15, 0.45, false);
  }

  // Right Side: Black Sliding Gate
  const gateW = 4.3;
  const gateCenterX = halfW - gateW / 2 - 0.1; // ~ 1.75
  const gateH = 1.7;

  // Gate posts
  box(dark, gateCenterX - gateW / 2, gateH / 2 + 0.05, 0.15, 0.22, gateH + 0.1, 0.22);
  box(dark, gateCenterX + gateW / 2, gateH / 2 + 0.05, 0.15, 0.22, gateH + 0.1, 0.22);

  // Gate bottom & top rails
  box(dark, gateCenterX, 0.08, 0.12, gateW - 0.1, 0.06, 0.04);
  box(dark, gateCenterX, gateH, 0.12, gateW - 0.1, 0.06, 0.04);

  // White / translucent polycarbonate backing sheet
  box(polycarbonate, gateCenterX, gateH / 2, 0.13, gateW - 0.12, gateH - 0.1, 0.02);

  // Vertical black iron hollow pickets in front of sheet
  for (let gx = gateCenterX - gateW / 2 + 0.15; gx <= gateCenterX + gateW / 2 - 0.15; gx += 0.11) {
    box(dark, gx, gateH / 2, 0.11, 0.024, gateH, 0.024);
  }

  // ---------------------------------------------------------------------------
  // 3. GROUND FLOOR PORCH & CARPORT
  // ---------------------------------------------------------------------------
  // Carport paved floor (dark stone / asphalt pavers)
  box(dark, gateCenterX, 0.04, front / 2, gateW + 0.2, 0.08, front);

  // Entrance porch tiled floor (left side)
  box(white, stoneWallCenterX, 0.06, front / 2 + 0.3, stoneWallW, 0.06, front - 0.6);

  // Main double entrance door
  const doorX = -0.55;
  box(dark, doorX, 1.25, facadeZ - 0.02, 1.4, 2.3, 0.06);
  // Twin white doors with vertical grooves
  for (const dx of [doorX - 0.34, doorX + 0.34]) {
    box(white, dx, 1.22, facadeZ - 0.05, 0.64, 2.2, 0.03);
    // Vertical grooves
    box(dark, dx - 0.12, 1.22, facadeZ - 0.065, 0.015, 1.8, 0.01);
    box(dark, dx + 0.12, 1.22, facadeZ - 0.065, 0.015, 1.8, 0.01);
  }
  // Stainless long vertical pull handles
  beam(white, [doorX - 0.06, 1.45, facadeZ - 0.08], [doorX - 0.06, 0.95, facadeZ - 0.08], 0.02);
  beam(white, [doorX + 0.06, 1.45, facadeZ - 0.08], [doorX + 0.06, 0.95, facadeZ - 0.08], 0.02);

  // Horizontal ventilation transoms above double door
  for (let i = 0; i < 4; i++) {
    box(dark, doorX - 0.45 + i * 0.3, 2.52, facadeZ - 0.03, 0.18, 0.12, 0.04);
  }

  // Vertical black accent stripe beside entrance door
  box(dark, doorX - 0.85, 1.35, facadeZ - 0.03, 0.14, 2.4, 0.02);

  // White security screen door beside entrance
  const screenDoorX = 0.55;
  box(white, screenDoorX, 1.2, facadeZ - 0.04, 0.85, 2.2, 0.04);
  box(glass, screenDoorX, 1.2, facadeZ - 0.05, 0.72, 2.05, 0.02);
  // Screen grille pattern
  for (let gy = 0.4; gy <= 2.0; gy += 0.28) {
    box(white, screenDoorX, gy, facadeZ - 0.06, 0.7, 0.015, 0.015);
  }

  // Triple casement window on the right porch wall
  const winX = 1.95;
  box(dark, winX, 1.35, facadeZ - 0.02, 1.6, 1.45, 0.05);
  for (let i = 0; i < 3; i++) {
    const wx = winX - 0.5 + i * 0.5;
    box(white, wx, 1.35, facadeZ - 0.04, 0.44, 1.35, 0.03);
    box(glass, wx, 1.35, facadeZ - 0.05, 0.36, 1.25, 0.02);
  }
  // Concrete window rain hood (topi jendela)
  box(concrete, winX, 2.15, facadeZ - 0.12, 1.8, 0.06, 0.24);

  // ---------------------------------------------------------------------------
  // 4. CARPORT CURVED CANOPY (BLACK STEEL FRAME + TINTED POLYCARBONATE)
  // ---------------------------------------------------------------------------
  const canopyW = gateW + 0.3;
  const canopyCenterX = gateCenterX;
  const canopyZStart = facadeZ + 0.1;
  const canopyZEnd = 0.2;
  const canopyLen = canopyZStart - canopyZEnd;
  const archSteps = 16;
  const archRise = 0.36;
  const archBaseY = 2.65;

  // Arched ribs across carport
  for (let zz = canopyZEnd; zz <= canopyZStart; zz += 0.6) {
    for (let i = 0; i < archSteps; i++) {
      const u1 = i / archSteps;
      const u2 = (i + 1) / archSteps;
      const x1 = canopyCenterX - canopyW / 2 + u1 * canopyW;
      const x2 = canopyCenterX - canopyW / 2 + u2 * canopyW;
      const y1 = archBaseY + Math.sin(u1 * Math.PI) * archRise - ((zz - canopyZEnd) / canopyLen) * 0.18;
      const y2 = archBaseY + Math.sin(u2 * Math.PI) * archRise - ((zz - canopyZEnd) / canopyLen) * 0.18;
      beam(dark, [x1, y1, zz], [x2, y2, zz], 0.03);
    }
  }

  // Tinted polycarbonate roofing sheet
  for (let i = 0; i < archSteps; i++) {
    const u = (i + 0.5) / archSteps;
    const ax = canopyCenterX - canopyW / 2 + u * canopyW;
    const ay = archBaseY + Math.sin(u * Math.PI) * archRise - 0.08;
    const segW = canopyW / archSteps + 0.03;
    const segSlope = Math.atan2((Math.cos(u * Math.PI) * archRise * Math.PI) / canopyW, 1);
    box(polycarbonate, ax, ay, (canopyZStart + canopyZEnd) / 2, segW, 0.02, canopyLen + 0.1, 0, 0, segSlope);
  }

  // Front canopy support steel posts
  box(dark, canopyCenterX - canopyW / 2 + 0.1, 1.3, canopyZEnd + 0.05, 0.08, 2.6, 0.08);
  box(dark, canopyCenterX + canopyW / 2 - 0.1, 1.3, canopyZEnd + 0.05, 0.08, 2.6, 0.08);

  // Electrical / cable bundle running along the front eave of the canopy
  for (let c = 0; c < 3; c++) {
    beam(dark, [canopyCenterX - canopyW / 2 - 0.2, archBaseY - 0.05 + c * 0.03, canopyZEnd], [canopyCenterX + canopyW / 2 + 0.5, archBaseY - 0.05 + c * 0.03, canopyZEnd], 0.016);
  }

  // ---------------------------------------------------------------------------
  // 5. 2ND FLOOR: ROOF, LISPLANG & MODERN WINDOWS
  // ---------------------------------------------------------------------------
  const roofBaseY = h - 0.3;
  const roofRise = 1.35;

  // Main terracotta barrel tile roof spanning the property
  buildBarrelTileRoof(ctx, 0, w, depth, roofBaseY, roofRise, facadeZ, m.terracottaTile, woodBrown, white);

  // 2nd floor front windows with white frames and concrete hoods
  for (const wx of [-w * 0.28, w * 0.22]) {
    buildDeepWindow(ctx, wx, 4.2, facadeZ - 0.04, 1.25, 1.3, white, dark, true);
    // Concrete hood
    box(concrete, wx, 4.95, facadeZ - 0.12, 1.45, 0.07, 0.25);
  }

  // Outdoor AC condenser unit
  buildOutdoorAC(ctx, -0.6, 4.3, facadeZ - 0.1, -1);

  // Vertical downpipe
  beam(white, [halfW - 0.2, roofBaseY + 0.1, facadeZ - 0.02], [halfW - 0.2, 0.2, facadeZ - 0.02], 0.035);

  // ---------------------------------------------------------------------------
  // 7. ROADSIDE BOUNDARY: ANDESITE WALL & 3 SPHERICAL TOPIARIES (STREET VIEW 70h/160h)
  // ---------------------------------------------------------------------------
  // Low boundary curb wall running along the street
  box(andesite, stoneWallCenterX, 0.45, -0.35, stoneWallW, 0.9, 0.25);
  // 3 neatly trimmed green spherical topiaries (tanaman pangkas bola)
  for (let i = 0; i < 3; i++) {
    const tx = stoneWallCenterX - 1.0 + i * 1.0;
    // Sphere foliage
    emit(new T.SphereGeometry(0.38, 12, 10), m.brightGreen, tx, 1.25, -0.35, 1, 0.9, 1);
    // Trunk
    beam(m.wood, [tx, 0.9, -0.35], [tx, 1.25, -0.35], 0.06);
  }

  // PLN Token Meter & Gutter
  buildPLNMeter(ctx, stoneWallCenterX - 1.4, 1.4, 0.28, 0);
  buildDrainGutter(ctx, -front, depth, -halfW - 0.25, 0.42);
}

