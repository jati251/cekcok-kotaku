import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildPlant } from '../vegetation';

function emitGable(
  ctx: WorldContext,
  mat: T.Material,
  cx: number,
  base: number,
  rise: number,
  halfW: number,
  z: number,
) {
  const g = new T.BufferGeometry();
  const positions = new Float32Array([
    // Front face
    cx - halfW, base, z,
    cx + halfW, base, z,
    cx, base + rise, z,
    // Back face
    cx - halfW, base, z,
    cx, base + rise, z,
    cx + halfW, base, z,
  ]);
  const uvs = new Float32Array([
    0, 0,
    1, 0,
    0.5, 1,
    0, 0,
    0.5, 1,
    1, 0,
  ]);
  g.setAttribute('position', new T.BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  ctx.emit(g, mat, 0, 0, 0);
}

function buildGableRoofSlopes(
  ctx: WorldContext,
  mat: T.Material,
  cx: number,
  base: number,
  rise: number,
  halfW: number,
  zStart: number,
  zEnd: number,
  overhang = 0.25,
) {
  const { box, beam } = ctx;
  const depth = zEnd - zStart;
  const midZ = (zStart + zEnd) / 2;
  const slope = Math.atan2(rise, halfW);
  const slopeLen = Math.hypot(halfW + overhang, rise);

  for (const s of [-1, 1]) {
    const plateX = cx + (s * (halfW + overhang)) / 2;
    const plateY = base + rise / 2;
    box(
      mat,
      plateX,
      plateY,
      midZ,
      slopeLen,
      0.09,
      depth + overhang * 2,
      0,
      0,
      -s * slope,
    );
  }
  beam(mat, [cx, base + rise + 0.04, zStart - overhang], [cx, base + rise + 0.04, zEnd + overhang], 0.07);
}

/**
 * Builds 16 Jl. H. Junen (Gambar 2):
 * - Ground Floor Left: 4-leaf white folding garage door with panel recesses and top glass transoms
 * - 2nd Floor Left: White pediment with circular rosette medallion, terracotta tile roof & awning,
 *   and 2 STACKED PANASONIC OUTDOOR AC CONDENSER UNITS with wall mounting brackets
 * - Ground Floor Right: Carport with curved / arched black metal canopy, ornate wrought-iron brackets,
 *   white security screen front door, and black metal sliding gate
 * - 2nd Floor Right: Recessed covered balcony with shallow arched opening, black metal safety railing,
 *   potted flowers, and THE ICONIC BLACK-AND-WHITE ALTERNATING STRIPED CORNER PILLAR
 */
export function buildTreeCourtHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, materials } = ctx;
  const { white, concrete, dark, tile, glass } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front;
  const halfW = w / 2;

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & SOLID 2-STOREY MAIN BUILDING MASS
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  // Solid white 2-storey building volume
  box(white, 0, h / 2, front + depth / 2, w - 0.16, h, depth);

  // Left & right compound boundary walls from street to facade
  box(white, -halfW + 0.08, 1.2, front / 2, 0.16, 2.4, front);
  box(white, halfW - 0.08, 1.2, front / 2, 0.16, 2.4, front);

  // ---------------------------------------------------------------------------
  // 2. GROUND FLOOR - LEFT SIDE: WHITE FOLDING GARAGE DOORS (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const garageW = 3.6;
  const garageCenterX = -halfW + garageW / 2 + 0.2; // ~ -2.0
  const garageH = 2.4;

  // Concrete lintel beam above garage door
  box(white, garageCenterX, 2.62, facadeZ - 0.04, garageW + 0.2, 0.28, 0.16);
  // Ventilation slits in lintel
  for (let i = 0; i < 4; i++) {
    box(dark, garageCenterX - 1.2 + i * 0.8, 2.62, facadeZ - 0.05, 0.14, 0.12, 0.02);
  }

  // Garage door opening reveal
  box(dark, garageCenterX, 1.22, facadeZ - 0.04, garageW, garageH, 0.06);

  // 4 white folding garage door leaves with vertical paneling & top transom glass
  const leafW = garageW / 4;
  for (let i = 0; i < 4; i++) {
    const lx = garageCenterX - garageW / 2 + leafW * (i + 0.5);
    // Door panel leaf
    box(white, lx, 1.2, facadeZ - 0.06, leafW - 0.03, garageH - 0.04, 0.04);
    // Vertical recessed panel grooves
    box(dark, lx - 0.14, 0.95, facadeZ - 0.075, 0.014, 1.35, 0.01);
    box(dark, lx + 0.14, 0.95, facadeZ - 0.075, 0.014, 1.35, 0.01);
    // Top glass transom pane
    box(glass, lx, 2.05, facadeZ - 0.07, leafW * 0.72, 0.32, 0.02);
    box(white, lx, 2.05, facadeZ - 0.075, leafW * 0.76, 0.025, 0.03);
  }

  // ---------------------------------------------------------------------------
  // 3. GROUND FLOOR - RIGHT SIDE: CARPORT & CURVED BLACK CANOPY (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const carportW = 4.1;
  const carportCenterX = halfW - carportW / 2; // ~ 1.95
  const canopyZStart = facadeZ + 0.05;
  const canopyZEnd = 0.25;
  const canopyLen = canopyZStart - canopyZEnd;

  // Carport concrete floor pavement
  box(concrete, carportCenterX, 0.04, front / 2, carportW, 0.08, front);

  // Front entrance door with white decorative security screen door (kasa nyamuk)
  const doorX = 0.65;
  box(dark, doorX, 1.2, facadeZ - 0.04, 0.95, 2.3, 0.08);
  box(white, doorX, 1.2, facadeZ - 0.07, 0.9, 2.2, 0.03);
  // Screen door diamond / oval grille motif
  for (let dy = -0.8; dy <= 0.8; dy += 0.28) {
    box(white, doorX, 1.2 + dy, facadeZ - 0.08, 0.8, 0.02, 0.02);
  }
  emit(new T.TorusGeometry(0.18, 0.015, 4, 16), white, doorX, 1.2, facadeZ - 0.085);

  // Ground floor windows beside entrance door
  const winX = 2.35;
  box(dark, winX, 1.35, facadeZ - 0.04, 1.5, 1.5, 0.06);
  box(glass, winX, 1.35, facadeZ - 0.06, 1.36, 1.36, 0.02);
  box(white, winX, 1.35, facadeZ - 0.07, 0.04, 1.4, 0.04);
  box(white, winX, 1.35, facadeZ - 0.07, 1.4, 0.04, 0.04);

  // Potted plants in the carport (purple tradescantia & green ferns)
  buildPlant(ctx, 1.4, 1.8, 0.7, true);
  buildPlant(ctx, 3.2, 1.9, 0.8, true);

  // BLACK CURVED / ARCHED CARPORT CANOPY WITH ORNATE SCROLLWORK (GAMBAR 2)
  const archSteps = 16;
  const archRise = 0.38;
  const archBaseY = 2.48;

  // Arched steel ribs across carport width
  for (let zz = canopyZEnd; zz <= canopyZStart; zz += 0.55) {
    for (let i = 0; i < archSteps; i++) {
      const u1 = i / archSteps;
      const u2 = (i + 1) / archSteps;
      const x1 = carportCenterX - carportW / 2 + u1 * carportW;
      const x2 = carportCenterX - carportW / 2 + u2 * carportW;
      const y1 = archBaseY + Math.sin(u1 * Math.PI) * archRise - ((zz - canopyZEnd) / canopyLen) * 0.15;
      const y2 = archBaseY + Math.sin(u2 * Math.PI) * archRise - ((zz - canopyZEnd) / canopyLen) * 0.15;
      beam(dark, [x1, y1, zz], [x2, y2, zz], 0.025);
    }
  }

  // Dark tinted / black canopy cover sheet
  for (let i = 0; i < archSteps; i++) {
    const u = (i + 0.5) / archSteps;
    const ax = carportCenterX - carportW / 2 + u * carportW;
    const ay = archBaseY + Math.sin(u * Math.PI) * archRise - 0.08;
    const segW = (carportW / archSteps) + 0.03;
    const segSlope = Math.atan2((Math.cos(u * Math.PI) * archRise * Math.PI) / carportW, 1);
    box(dark, ax, ay, (canopyZStart + canopyZEnd) / 2, segW, 0.025, canopyLen + 0.08, 0, 0, segSlope);
  }

  // Support posts: Black steel posts at front corners
  box(dark, carportCenterX - carportW / 2 + 0.08, 1.24, canopyZEnd + 0.06, 0.08, 2.48, 0.08);
  box(dark, carportCenterX + carportW / 2 - 0.08, 1.24, canopyZEnd + 0.06, 0.08, 2.48, 0.08);

  // Decorative wrought-iron scrollwork brackets under front canopy arch (Gambar 2)
  for (const s of [-1, 1]) {
    const sx = carportCenterX + s * (carportW / 2 - 0.65);
    beam(dark, [sx, archBaseY, canopyZEnd + 0.06], [sx + s * 0.48, archBaseY + 0.25, canopyZEnd + 0.06], 0.02);
    emit(new T.TorusGeometry(0.12, 0.012, 4, 16), dark, sx + s * 0.24, archBaseY + 0.12, canopyZEnd + 0.06);
  }

  // Front black metal sliding gate with vertical bars
  const gateH = 1.45;
  box(dark, carportCenterX, 0.1, -0.015, carportW - 0.1, 0.05, 0.04);
  box(dark, carportCenterX, gateH, -0.015, carportW - 0.1, 0.05, 0.04);
  for (let x = carportCenterX - carportW / 2 + 0.15; x <= carportCenterX + carportW / 2 - 0.15; x += 0.14) {
    box(dark, x, gateH / 2, -0.01, 0.022, gateH, 0.03);
  }

  // ---------------------------------------------------------------------------
  // 4. SECOND FLOOR - LEFT SIDE: GABLE PEDIMENT, EMBLEM & 2 STACKED ACs (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const pedimentCenterX = garageCenterX; // ~ -2.0
  const pedimentW = 3.6;
  const pedimentRise = 1.35;
  const pedimentBase = h - 0.2; // 5.8
  const pedimentHalf = pedimentW / 2;

  // Solid white gable pediment wall
  emitGable(ctx, white, pedimentCenterX, pedimentBase, pedimentRise, pedimentHalf + 0.05, facadeZ);
  // Terracotta roof slopes
  buildGableRoofSlopes(ctx, tile, pedimentCenterX, pedimentBase, pedimentRise, pedimentHalf + 0.15, facadeZ, facadeZ + depth * 0.75, 0.25);

  // Large ornate circular rosette medallion on pediment (Gambar 2)
  const medalY = pedimentBase + 0.65;
  emit(new T.CylinderGeometry(0.28, 0.28, 0.04, 20), white, pedimentCenterX, medalY, facadeZ - 0.03, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.29, 0.025, 5, 24), dark, pedimentCenterX, medalY, facadeZ - 0.04);
  emit(new T.TorusGeometry(0.18, 0.015, 4, 18), dark, pedimentCenterX, medalY, facadeZ - 0.045);
  box(dark, pedimentCenterX, medalY, facadeZ - 0.045, 0.36, 0.03, 0.02);
  box(dark, pedimentCenterX, medalY, facadeZ - 0.045, 0.03, 0.36, 0.02);

  // Terracotta eave awning below the pediment
  box(tile, pedimentCenterX, 5.4, facadeZ - 0.25, 3.4, 0.07, 0.65, -0.38);

  // 2 STACKED PANASONIC OUTDOOR AC CONDENSER UNITS ON WALL (GAMBAR 2)
  const acX = pedimentCenterX + 1.1; // ~ -0.9
  for (const acY of [4.25, 4.95]) {
    // AC white condenser unit body
    box(white, acX, acY, facadeZ - 0.14, 0.74, 0.52, 0.32);
    // Circular fan grille (Panasonic)
    emit(new T.TorusGeometry(0.18, 0.014, 5, 20), dark, acX, acY, facadeZ - 0.31);
    emit(new T.TorusGeometry(0.10, 0.012, 4, 16), dark, acX, acY, facadeZ - 0.31);
    // Black mounting bracket underneath
    box(dark, acX, acY - 0.28, facadeZ - 0.14, 0.68, 0.03, 0.35);
  }
  // Vertical white refrigerant copper pipe trunking
  beam(white, [acX + 0.34, 5.0, facadeZ - 0.14], [acX + 0.34, 1.4, facadeZ - 0.14], 0.028);

  // 2nd floor window to the left of the AC units
  const upperWinX = pedimentCenterX - 0.6;
  box(dark, upperWinX, 4.45, facadeZ - 0.04, 1.1, 1.3, 0.05);
  box(glass, upperWinX, 4.45, facadeZ - 0.06, 0.98, 1.18, 0.02);
  box(white, upperWinX, 4.45, facadeZ - 0.07, 0.04, 1.25, 0.03);
  box(white, upperWinX, 4.45, facadeZ - 0.07, 1.05, 0.04, 0.03);

  // 3 vertical ventilation slits above upper window
  for (let i = 0; i < 3; i++) {
    box(dark, upperWinX - 0.28 + i * 0.28, 5.25, facadeZ - 0.025, 0.1, 0.24, 0.03);
    box(white, upperWinX - 0.28 + i * 0.28, 5.25, facadeZ - 0.02, 0.14, 0.28, 0.015);
  }

  // ---------------------------------------------------------------------------
  // 5. SECOND FLOOR - RIGHT SIDE: BALCONY & BLACK-AND-WHITE STRIPED COLUMN (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const balcW = 3.7;
  const balcCenterX = halfW - balcW / 2; // ~ 2.15
  const balcFloorY = 2.88;

  // Recessed balcony floor & ceiling
  box(concrete, balcCenterX, balcFloorY, facadeZ + 0.6, balcW, 0.12, 1.4);
  // Recessed rear wall with French doors
  box(white, balcCenterX, 4.3, facadeZ + 1.25, balcW, 2.6, 0.2);
  box(white, balcCenterX, 4.15, facadeZ + 1.16, 1.8, 2.1, 0.08);
  box(glass, balcCenterX - 0.42, 4.15, facadeZ + 1.14, 0.7, 1.9, 0.03);
  box(glass, balcCenterX + 0.42, 4.15, facadeZ + 1.14, 0.7, 1.9, 0.03);

  // 5 square ventilation louvers above balcony doors (Gambar 2)
  for (let i = 0; i < 5; i++) {
    box(dark, balcCenterX - 0.6 + i * 0.3, 5.25, facadeZ + 1.14, 0.12, 0.12, 0.03);
  }

  // Shallow curved arched lintel framing the top of the balcony opening (Gambar 2)
  box(white, balcCenterX, 5.62, facadeZ - 0.02, balcW, 0.26, 0.18);
  // Gentle upward arch along the underside (Gambar 2)
  const archPoints = 16;
  for (let i = 0; i < archPoints; i++) {
    const u1 = i / archPoints;
    const u2 = (i + 1) / archPoints;
    const ax1 = balcCenterX - balcW / 2 + u1 * balcW;
    const ax2 = balcCenterX - balcW / 2 + u2 * balcW;
    const ay1 = 5.42 + Math.sin(u1 * Math.PI) * 0.12;
    const ay2 = 5.42 + Math.sin(u2 * Math.PI) * 0.12;
    beam(white, [ax1, ay1, facadeZ - 0.02], [ax2, ay2, facadeZ - 0.02], 0.05);
  }

  // Black metal safety railing with vertical pickets
  const railH = 0.95;
  box(dark, balcCenterX, balcFloorY + railH, facadeZ + 0.05, balcW - 0.3, 0.04, 0.04);
  box(dark, balcCenterX, balcFloorY + 0.08, facadeZ + 0.05, balcW - 0.3, 0.04, 0.04);
  for (let x = balcCenterX - balcW / 2 + 0.2; x <= balcCenterX + balcW / 2 - 0.2; x += 0.16) {
    box(dark, x, balcFloorY + railH / 2, facadeZ + 0.05, 0.022, railH, 0.02);
  }

  // Potted flowering plants (red/pink geraniums) along the balcony railing (Gambar 2)
  for (let i = 0; i < 4; i++) {
    const px = balcCenterX - 1.1 + i * 0.75;
    buildPlant(ctx, px, facadeZ + 0.18, 0.55);
  }

  // THE ICONIC BLACK-AND-WHITE ALTERNATING STRIPED CORNER PILLAR (GAMBAR 2)
  const stripePillarX = halfW - 0.18; // ~ 3.82
  const stripePillarZ = facadeZ - 0.02;
  const stripeBaseY = 2.85;
  const stripeTopY = 5.75;
  const numBands = 8;
  const bandH = (stripeTopY - stripeBaseY) / numBands;

  for (let i = 0; i < numBands; i++) {
    const bandMat = i % 2 === 0 ? dark : white;
    box(
      bandMat,
      stripePillarX,
      stripeBaseY + (i + 0.5) * bandH,
      stripePillarZ,
      0.34,
      bandH,
      0.34,
    );
  }

  // Vertical white downspout pipe running beside the striped column (Gambar 2)
  beam(white, [stripePillarX + 0.14, stripeTopY + 0.1, stripePillarZ + 0.02], [stripePillarX + 0.14, 1.2, stripePillarZ + 0.02], 0.04);

  // Main roof over 2nd floor
  buildGableRoofSlopes(ctx, tile, 0, h, 1.3, halfW + 0.1, facadeZ, facadeZ + depth, 0.3);
}
