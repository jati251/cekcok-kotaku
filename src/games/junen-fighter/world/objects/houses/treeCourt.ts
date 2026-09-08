import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildPlant } from '../vegetation';
import { buildBarrelTileRoof } from '../architecture';
import { scroll as ironScroll } from '../detail';

/**
 * Builds the Tree Court House (Foto 1 - Jl. H. Junen):
 * - 2-storey white modern cluster house
 * - 2nd floor center-right recessed balcony with curved segmental arch ceiling lintel
 * - Two iconic square balcony columns with alternating black-and-white horizontal stripes (zebra / piano key pattern)
 * - Black steel balcony railing with lush potted plants (monstera & flowering plants)
 * - 2nd floor left wall with two vertically stacked outdoor AC compressor units and 3 vertical ventilation slits above
 * - 1st floor left entrance porch with small forward-projecting terracotta gable roof & circular rosette medallion
 * - Arched black tinted polycarbonate carport canopy with decorative wrought-iron scrollwork underneath
 * - Stacked andesite stone compound wall (batu candi susun sirih) on the left with potted plants
 * - Black hollow iron vertical sliding gate with white backing sheet
 */
export function buildTreeCourtHouse(ctx: WorldContext, p: Property) {
  const { box, beam, cyl, emit, materials: m } = ctx;
  const { white, concrete, dark, glass, andesite, polycarbonate, terracottaTile = m.tile, wood } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front;
  const halfW = w / 2; // 3.0m (-3.0 to +3.0)

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & 2-STOREY MAIN BUILDING MASS
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);

  // Left solid building mass (Ground floor porch + 2nd floor AC wall): x = -3.0 to 0.0
  const leftW = 3.0;
  const leftX = -halfW + leftW / 2; // -1.5
  box(white, leftX, h / 2, front + depth / 2, leftW, h, depth);

  // Right building mass: Ground floor carport + 2nd floor recessed balcony (x = 0.0 to +3.0)
  const rightW = 3.0;
  const rightX = halfW - rightW / 2; // +1.5
  // Ground floor rear wall
  box(white, rightX, 1.5, front + depth / 2, rightW, 3.0, depth);
  // 2nd floor rear recessed wall (set back by 1.2m for the outdoor balcony)
  const balcDepth = 1.2;
  box(white, rightX, 4.5, front + balcDepth + (depth - balcDepth) / 2, rightW, 3.0, depth - balcDepth);
  // 2nd floor right boundary party wall
  box(white, halfW - 0.08, 4.5, front + balcDepth / 2, 0.16, 3.0, balcDepth);

  // ---------------------------------------------------------------------------
  // 2. GROUND FLOOR LEFT: ANDESITE WALL & PORCH ENTRANCE (FOTO 1)
  // ---------------------------------------------------------------------------
  // Low compound wall on the left: stacked andesite stone (batu candi susun sirih)
  const stoneW = 2.6;
  const stoneX = -halfW + stoneW / 2 + 0.05; // ~ -1.65
  const stoneH = 1.65;
  box(andesite, stoneX, stoneH / 2, 0.15, stoneW, stoneH, 0.28);
  // Stacked horizontal stone courses / grooves
  for (let y = 0.14; y < stoneH; y += 0.11) {
    box(dark, stoneX, y, 0.005, stoneW, 0.014, 0.02);
  }
  // Dark coping slab on top
  box(dark, stoneX, stoneH + 0.03, 0.15, stoneW + 0.08, 0.06, 0.32);

  // Potted plants along the top of the stone wall
  for (let px = stoneX - stoneW / 2 + 0.35; px <= stoneX + stoneW / 2 - 0.25; px += 0.6) {
    box(dark, px, stoneH + 0.10, 0.15, 0.24, 0.12, 0.24);
    buildPlant(ctx, px, 0.15, 0.42, false);
  }

  // Entrance porch paved floor
  const porchX = -1.35;
  const porchW = 2.3;
  box(white, porchX, 0.06, front / 2 + 0.2, porchW, 0.12, front - 0.4);

  // Double white entrance door with vertical grooves & long chrome pull handles (Foto 1)
  const doorX = -1.45;
  box(dark, doorX, 1.25, facadeZ - 0.02, 1.45, 2.3, 0.05);
  for (const dx of [doorX - 0.35, doorX + 0.35]) {
    box(white, dx, 1.22, facadeZ - 0.045, 0.66, 2.2, 0.03);
    box(dark, dx - 0.12, 1.22, facadeZ - 0.06, 0.012, 1.8, 0.01);
    box(dark, dx + 0.12, 1.22, facadeZ - 0.06, 0.012, 1.8, 0.01);
  }
  // Stainless long pull handles
  beam(white, [doorX - 0.06, 1.45, facadeZ - 0.075], [doorX - 0.06, 0.95, facadeZ - 0.075], 0.018);
  beam(white, [doorX + 0.06, 1.45, facadeZ - 0.075], [doorX + 0.06, 0.95, facadeZ - 0.075], 0.018);

  // Ventilation transoms above entrance door
  for (let i = 0; i < 4; i++) {
    box(dark, doorX - 0.45 + i * 0.3, 2.52, facadeZ - 0.03, 0.18, 0.12, 0.04);
  }

  // White security screen door beside entrance
  const screenX = -0.42;
  box(white, screenX, 1.2, facadeZ - 0.03, 0.72, 2.2, 0.04);
  box(glass, screenX, 1.2, facadeZ - 0.045, 0.62, 2.05, 0.02);
  for (let gy = 0.4; gy <= 2.0; gy += 0.28) {
    box(white, screenX, gy, facadeZ - 0.055, 0.6, 0.015, 0.015);
  }

  // ---------------------------------------------------------------------------
  // 3. GROUND FLOOR: SMALL FORWARD-PROJECTING TERRACOTTA GABLE PORCH (FOTO 1)
  // ---------------------------------------------------------------------------
  // Small triangular gable roof over front porch projecting forward (Foto 1)
  const pGableW = 2.4;
  const pGableRise = 0.65;
  const pGableBaseY = 2.65;
  const pGableHalfW = pGableW / 2;
  const pGableZFront = 1.05;
  const pGableDepth = facadeZ - pGableZFront;

  // Triangular pediment facing front
  const gPed = new T.BufferGeometry();
  gPed.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [porchX - pGableHalfW, pGableBaseY, pGableZFront, porchX + pGableHalfW, pGableBaseY, pGableZFront, porchX, pGableBaseY + pGableRise, pGableZFront],
      3,
    ),
  );
  gPed.setIndex([0, 2, 1]);
  gPed.computeVertexNormals();
  gPed.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  emit(gPed, white, 0, 0, 0);

  // Round decorative rosette/medallion vent in pediment (Foto 1)
  emit(new T.CylinderGeometry(0.18, 0.18, 0.03, 18), dark, porchX, pGableBaseY + 0.32, pGableZFront - 0.015, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.19, 0.018, 5, 18), white, porchX, pGableBaseY + 0.32, pGableZFront - 0.025);

  // Terracotta roof tiles over porch
  const pSlope = Math.atan2(pGableRise, pGableHalfW);
  const pSlopeLen = Math.hypot(pGableHalfW, pGableRise);
  for (const s of [-1, 1]) {
    box(
      terracottaTile,
      porchX + (s * pGableHalfW) / 2,
      pGableBaseY + pGableRise / 2,
      (pGableZFront + facadeZ) / 2,
      pSlopeLen,
      0.065,
      pGableDepth,
      0,
      0,
      -s * pSlope,
    );
    // Beams down the slope
    for (let zz = pGableZFront + 0.15; zz <= facadeZ; zz += 0.28) {
      beam(terracottaTile, [porchX, pGableBaseY + pGableRise + 0.03, zz], [porchX + s * pGableHalfW, pGableBaseY + 0.03, zz], 0.026);
    }
    // White lisplang rake fascia
    beam(white, [porchX, pGableBaseY + pGableRise + 0.04, pGableZFront - 0.02], [porchX + s * pGableHalfW, pGableBaseY, pGableZFront - 0.02], 0.048);
  }
  // Wuwungan ridge on porch roof
  cyl(terracottaTile, porchX, pGableBaseY + pGableRise + 0.04, (pGableZFront + facadeZ) / 2, 0.08, pGableDepth, Math.PI / 2);

  // ---------------------------------------------------------------------------
  // 4. GROUND FLOOR RIGHT: CARPORT & CURVED BLACK CANOPY (FOTO 1)
  // ---------------------------------------------------------------------------
  // Carport paved floor
  const carportX = 1.45;
  const carportW = 3.1;
  box(dark, carportX, 0.04, front / 2, carportW, 0.08, front);

  // Triple window on right ground floor wall
  const winX = 1.65;
  box(dark, winX, 1.35, facadeZ - 0.02, 1.6, 1.45, 0.05);
  for (let i = 0; i < 3; i++) {
    const wx = winX - 0.5 + i * 0.5;
    box(white, wx, 1.35, facadeZ - 0.04, 0.44, 1.35, 0.03);
    box(glass, wx, 1.35, facadeZ - 0.05, 0.36, 1.25, 0.02);
  }
  box(concrete, winX, 2.15, facadeZ - 0.10, 1.8, 0.06, 0.22);

  // Curved dark polycarbonate canopy over carport
  const canopyW = 3.3;
  const canopyX = carportX;
  const canopyZStart = facadeZ + 0.1;
  const canopyZEnd = 0.2;
  const canopyLen = canopyZStart - canopyZEnd;
  const archSteps = 16;
  const archRise = 0.38;
  const archBaseY = 2.68;

  // Arched ribs with wrought iron scrollwork underneath (Foto 1)
  for (let zz = canopyZEnd; zz <= canopyZStart; zz += 0.65) {
    for (let i = 0; i < archSteps; i++) {
      const u1 = i / archSteps;
      const u2 = (i + 1) / archSteps;
      const x1 = canopyX - canopyW / 2 + u1 * canopyW;
      const x2 = canopyX - canopyW / 2 + u2 * canopyW;
      const y1 = archBaseY + Math.sin(u1 * Math.PI) * archRise - ((zz - canopyZEnd) / canopyLen) * 0.16;
      const y2 = archBaseY + Math.sin(u2 * Math.PI) * archRise - ((zz - canopyZEnd) / canopyLen) * 0.16;
      beam(dark, [x1, y1, zz], [x2, y2, zz], 0.028);
    }
  }

  // Wrought iron decorative scrollwork under the front arched rib
  for (let sx = canopyX - canopyW * 0.38; sx <= canopyX + canopyW * 0.38; sx += 0.38) {
    const u = (sx - (canopyX - canopyW / 2)) / canopyW;
    const sy = archBaseY + Math.sin(u * Math.PI) * archRise - 0.08;
    ironScroll(ctx, sx, sy, canopyZEnd + 0.02, dark, 0.08, 1);
  }

  // Tinted polycarbonate roofing sheet
  for (let i = 0; i < archSteps; i++) {
    const u = (i + 0.5) / archSteps;
    const ax = canopyX - canopyW / 2 + u * canopyW;
    const ay = archBaseY + Math.sin(u * Math.PI) * archRise - 0.07;
    const segW = canopyW / archSteps + 0.03;
    const segSlope = Math.atan2((Math.cos(u * Math.PI) * archRise * Math.PI) / canopyW, 1);
    box(polycarbonate, ax, ay, (canopyZStart + canopyZEnd) / 2, segW, 0.02, canopyLen + 0.08, 0, 0, segSlope);
  }

  // Front canopy support steel posts
  box(dark, canopyX - canopyW / 2 + 0.1, 1.35, canopyZEnd + 0.05, 0.08, 2.7, 0.08);
  box(dark, canopyX + canopyW / 2 - 0.1, 1.35, canopyZEnd + 0.05, 0.08, 2.7, 0.08);

  // Electrical utility wires along front canopy edge
  for (let c = 0; c < 4; c++) {
    beam(dark, [canopyX - canopyW / 2 - 0.3, archBaseY - 0.06 + c * 0.03, canopyZEnd - 0.02], [canopyX + canopyW / 2 + 0.3, archBaseY - 0.06 + c * 0.03, canopyZEnd - 0.02], 0.015);
  }

  // Sliding gate: black vertical pickets with translucent white backing (Foto 1)
  const gateW = 3.3;
  const gateX = carportX;
  const gateH = 1.7;
  // Rails
  box(dark, gateX, 0.08, 0.12, gateW, 0.05, 0.04);
  box(dark, gateX, gateH, 0.12, gateW, 0.05, 0.04);
  // Translucent backing
  box(polycarbonate, gateX, gateH / 2, 0.13, gateW - 0.08, gateH - 0.1, 0.02);
  // Vertical black iron pickets
  for (let gx = gateX - gateW / 2 + 0.08; gx <= gateX + gateW / 2 - 0.08; gx += 0.09) {
    box(dark, gx, gateH / 2, 0.11, 0.024, gateH, 0.024);
  }

  // ---------------------------------------------------------------------------
  // 5. SECOND FLOOR: SEGMENTAL ARCH BALCONY & ZEBRA PILLARS (FOTO 1)
  // ---------------------------------------------------------------------------
  // Recessed balcony floor on the right (y = 3.0, x = 0.0 to +3.0)
  const balcX = rightX;
  const balcFloorY = 3.0;
  box(white, balcX, balcFloorY, facadeZ + balcDepth / 2, rightW, 0.14, balcDepth);

  // Balcony double glass sliding/French doors at recessed rear wall
  box(white, balcX, 4.35, facadeZ + balcDepth - 0.03, 1.8, 2.2, 0.05);
  box(glass, balcX - 0.42, 4.35, facadeZ + balcDepth - 0.04, 0.72, 2.05, 0.02);
  box(glass, balcX + 0.42, 4.35, facadeZ + balcDepth - 0.04, 0.72, 2.05, 0.02);

  // TWO ICONIC ZEBRA / PIANO-KEY STRIPED COLUMNS (Foto 1)
  // Columns at left and right of balcony opening:
  const colW = 0.36;
  const colLeftX = 0.05;
  const colRightX = halfW - colW / 2; // ~ 2.82
  const colBaseY = balcFloorY;
  const colH = 2.65; // up to y = 5.65

  for (const cx of [colLeftX, colRightX]) {
    // Alternating horizontal black and white bands
    const bandCount = 14;
    const bandH = colH / bandCount;
    for (let b = 0; b < bandCount; b++) {
      const bMat = b % 2 === 0 ? dark : white;
      const by = colBaseY + (b + 0.5) * bandH;
      box(bMat, cx, by, facadeZ - 0.04, colW, bandH, colW);
    }
  }

  // CURVED SEGMENTAL ARCH CEILING LINTEL ABOVE BALCONY (Foto 1)
  // Arch spanning from colLeftX + colW/2 to colRightX - colW/2
  const archSpanL = colLeftX + colW / 2;
  const archSpanR = colRightX - colW / 2;
  const archSpanW = archSpanR - archSpanL;
  const archSpanMidX = (archSpanL + archSpanR) / 2;
  const archBase = colBaseY + colH - 0.15; // ~ 5.5
  const archCrown = 0.35; // rise of the segmental arch

  // Segmental arch curvature
  const archSegs = 14;
  for (let i = 0; i < archSegs; i++) {
    const u1 = i / archSegs;
    const u2 = (i + 1) / archSegs;
    const ax1 = archSpanL + u1 * archSpanW;
    const ax2 = archSpanL + u2 * archSpanW;
    const ay1 = archBase + Math.sin(u1 * Math.PI) * archCrown;
    const ay2 = archBase + Math.sin(u2 * Math.PI) * archCrown;
    beam(white, [ax1, ay1, facadeZ - 0.04], [ax2, ay2, facadeZ - 0.04], 0.07);
  }
  // Solid white wall above the arch up to roof level
  box(white, archSpanMidX, 5.85, facadeZ - 0.02, archSpanW + 0.1, 0.35, 0.16);

  // Black steel balcony railing (Foto 1)
  const railH = 0.92;
  const railMidY = balcFloorY + railH / 2;
  box(dark, archSpanMidX, railMidY, facadeZ - 0.06, archSpanW, railH, 0.04);
  box(dark, archSpanMidX, balcFloorY + railH, facadeZ - 0.06, archSpanW + 0.05, 0.04, 0.06);
  for (let rx = archSpanL + 0.15; rx <= archSpanR - 0.15; rx += 0.14) {
    box(dark, rx, railMidY, facadeZ - 0.06, 0.02, railH, 0.02);
  }

  // Potted plants and flower pots on the balcony (Foto 1)
  for (const px of [archSpanL + 0.4, archSpanL + 1.1, archSpanR - 0.5]) {
    // Pot
    box(dark, px, balcFloorY + 0.15, facadeZ + 0.25, 0.26, 0.22, 0.26);
    // Lush green plant
    buildPlant(ctx, px, facadeZ + 0.25, 0.65, true);
  }

  // ---------------------------------------------------------------------------
  // 6. SECOND FLOOR LEFT: 2 VERTICALLY STACKED OUTDOOR ACs & VENT SLITS (FOTO 1)
  // ---------------------------------------------------------------------------
  // Window behind AC units on left facade
  const acWallX = -1.45;
  box(dark, acWallX, 4.4, facadeZ - 0.02, 1.5, 1.4, 0.05);
  box(glass, acWallX - 0.36, 4.4, facadeZ - 0.035, 0.64, 1.25, 0.02);
  box(glass, acWallX + 0.36, 4.4, facadeZ - 0.035, 0.64, 1.25, 0.02);
  box(white, acWallX, 4.4, facadeZ - 0.045, 0.05, 1.35, 0.03);

  // TWO VERTICALLY STACKED OUTDOOR AC COMPRESSOR UNITS (Foto 1)
  const acMountX = -0.55;
  for (const acY of [3.95, 4.75]) {
    // Mounting wall brackets (black angle iron)
    beam(dark, [acMountX - 0.35, acY - 0.32, facadeZ - 0.02], [acMountX - 0.35, acY - 0.32, facadeZ - 0.32], 0.02);
    beam(dark, [acMountX + 0.35, acY - 0.32, facadeZ - 0.02], [acMountX + 0.35, acY - 0.32, facadeZ - 0.32], 0.02);
    beam(dark, [acMountX - 0.35, acY - 0.45, facadeZ - 0.02], [acMountX - 0.35, acY - 0.32, facadeZ - 0.32], 0.016);
    beam(dark, [acMountX + 0.35, acY - 0.45, facadeZ - 0.02], [acMountX + 0.35, acY - 0.32, facadeZ - 0.32], 0.016);

    // AC Chassis (white box)
    box(white, acMountX, acY, facadeZ - 0.22, 0.82, 0.54, 0.32);
    // Circular fan exhaust grill
    emit(new T.CylinderGeometry(0.19, 0.19, 0.02, 16), dark, acMountX - 0.12, acY, facadeZ - 0.38, 1, 1, 1, Math.PI / 2);
    box(dark, acMountX - 0.12, acY, facadeZ - 0.39, 0.36, 0.02, 0.01);
    box(dark, acMountX - 0.12, acY, facadeZ - 0.39, 0.02, 0.36, 0.01);
    // Brand logo badge (Panasonic style)
    box(dark, acMountX + 0.22, acY + 0.16, facadeZ - 0.38, 0.18, 0.04, 0.01);
    // Side service valves & insulation piping
    cyl(white, acMountX + 0.38, acY - 0.12, facadeZ - 0.22, 0.03, 0.25, Math.PI / 2);
  }
  // Insulated copper refrigerant pipe bundle running into wall
  beam(white, [acMountX + 0.38, 4.35, facadeZ - 0.22], [acMountX + 0.38, 5.2, facadeZ - 0.02], 0.028);

  // 3 VERTICAL RECTANGULAR VENTILATION SLITS ABOVE AC (Foto 1)
  for (let i = 0; i < 3; i++) {
    const vx = -1.2 + i * 0.32;
    box(dark, vx, 5.5, facadeZ - 0.035, 0.11, 0.32, 0.04);
    box(white, vx, 5.5, facadeZ - 0.025, 0.15, 0.36, 0.015);
  }

  // ---------------------------------------------------------------------------
  // 7. MAIN ROOF: TERRACOTTA GENTENG MORANDO
  // ---------------------------------------------------------------------------
  const roofBaseY = h - 0.15; // 5.85
  const roofRise = 1.35;
  buildBarrelTileRoof(ctx, 0, w, depth, roofBaseY, roofRise, facadeZ, terracottaTile, wood, white);
}
