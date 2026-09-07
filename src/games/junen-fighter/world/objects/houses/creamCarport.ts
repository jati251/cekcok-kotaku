import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDoor, buildAC } from '../architecture';
import { buildCar } from '../vehicles';
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
 * Builds the cream two-storey house with dedicated carport, multi-tiered terracotta gables,
 * Indonesian teak wood paneled window, covered car, water gallon, wood-slat gate with hanging laundry,
 * and lush tropical foliage matching the Street View reference photo (Photo 4).
 */
export function buildCreamCarportHouse(ctx: WorldContext, p: Property) {
  const { box, cyl, beam, emit, materials } = ctx;
  const {
    cream,
    concrete,
    tile,
    dark,
    white,
    roofGrey,
    cloth,
    teakWood = materials.wood,
    woodSlat = materials.salmon,
    aquaBlue = materials.blue,
  } = materials;

  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front;
  const halfW = w / 2;

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & CONTINUOUS SOLID MAIN BUILDING VOLUME
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  // Solid 2-storey cream building volume from ground to roof level
  box(cream, 0, h / 2, front + depth / 2, w - 0.16, h, depth);

  // Left boundary wall separating cream carport from pale-green property
  const wallL = -halfW + 0.08;
  box(cream, wallL, 1.4, front / 2, 0.16, 2.8, front);
  beam(concrete, [wallL, 2.8, 0.1], [wallL, 2.05, front], 0.09);

  // Horizontal dark wood molding beam between 1st & 2nd floor
  box(teakWood, -halfW + 2.1, 2.9, facadeZ - 0.04, 4.2, 0.12, 0.16);

  // ---------------------------------------------------------------------------
  // 2. GROUND FLOOR CARPORT INTERIOR DETAILS
  // ---------------------------------------------------------------------------
  // Carport driveway pavement
  box(concrete, -halfW + 2.0, 0.04, front / 2, 3.9, 0.08, front);

  // Teak wood front entrance door inside the carport
  buildDoor(ctx, -0.4, facadeZ, teakWood);
  for (let dx = -0.8; dx <= 0.0; dx += 0.4) {
    box(teakWood, dx, 2.65, facadeZ - 0.05, 0.36, 0.38, 0.08);
    box(materials.glass, dx, 2.65, facadeZ - 0.05, 0.28, 0.3, 0.05);
  }

  // Indonesian 19L Aqua water gallon on the left floor near front of carport
  const gallonX = -2.65;
  const gallonZ = 1.35;
  cyl(aquaBlue, gallonX, 0.24, gallonZ, 0.16, 0.45);
  cyl(aquaBlue, gallonX, 0.5, gallonZ, 0.07, 0.1);
  cyl(white, gallonX, 0.56, gallonZ, 0.032, 0.04);
  emit(new T.TorusGeometry(0.162, 0.008, 4, 16), aquaBlue, gallonX, 0.18, gallonZ, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.162, 0.008, 4, 16), aquaBlue, gallonX, 0.32, gallonZ, 1, 1, 1, Math.PI / 2);

  // Parked car with realistic contoured silver car cover
  buildCar(ctx, -1.55, 1.85, true);

  // ---------------------------------------------------------------------------
  // 3. CARPORT CANOPY (ATAP KANOPI SENG/ASBES GELOMBANG)
  // ---------------------------------------------------------------------------
  const canopyW = 4.3;
  const canopyZStart = facadeZ + 0.05;
  const canopyZEnd = 0.25;
  const canopyLength = canopyZStart - canopyZEnd;
  const canopySlope = Math.atan2(2.92 - 2.25, canopyLength);
  const canopyMidY = (2.92 + 2.25) / 2;
  const canopyMidZ = (canopyZStart + canopyZEnd) / 2;
  const canopyCenterX = -halfW + canopyW / 2 + 0.1;

  // Main corrugated canopy sheet
  box(
    roofGrey,
    canopyCenterX,
    canopyMidY,
    canopyMidZ,
    canopyW,
    0.045,
    canopyLength + 0.15,
    -canopySlope,
  );

  // Corrugated ridges along the canopy length
  for (let x = canopyCenterX - canopyW / 2 + 0.05; x <= canopyCenterX + canopyW / 2 - 0.05; x += 0.12) {
    beam(
      roofGrey,
      [x, 2.92, canopyZStart],
      [x, 2.25, canopyZEnd - 0.08],
      0.016,
    );
  }

  // Canopy steel frame underneath: posts and purlins
  box(white, canopyCenterX + canopyW / 2 - 0.1, 1.15, canopyZEnd + 0.08, 0.08, 2.3, 0.08);
  box(white, canopyCenterX, 2.22, canopyZEnd + 0.08, canopyW, 0.09, 0.08);
  box(white, canopyCenterX, 2.88, canopyZStart - 0.06, canopyW, 0.08, 0.08);
  beam(white, [canopyCenterX - canopyW / 2 + 0.06, 2.9, canopyZStart], [canopyCenterX - canopyW / 2 + 0.06, 2.24, canopyZEnd], 0.035);
  beam(white, [canopyCenterX + canopyW / 2 - 0.06, 2.9, canopyZStart], [canopyCenterX + canopyW / 2 - 0.06, 2.24, canopyZEnd], 0.035);
  for (let zz = canopyZEnd + 0.7; zz < canopyZStart; zz += 0.8) {
    const py = 2.25 + (2.92 - 2.25) * ((zz - canopyZEnd) / canopyLength) - 0.05;
    box(white, canopyCenterX, py, zz, canopyW - 0.1, 0.04, 0.05);
  }

  // ---------------------------------------------------------------------------
  // 4. SECOND FLOOR FACADE & INDONESIAN TEAK WINDOW
  // ---------------------------------------------------------------------------
  // Left: Signature Indonesian Teak Wood Casement Window with 5 square recessed lower panels
  const winX = -1.75;
  const winY = 4.25;
  const winZ = facadeZ - 0.06;
  const winW = 1.85;
  const winH = 1.95;

  // Dark window reveal opening in upper section
  box(dark, winX, winY + winH * 0.18, winZ - 0.02, winW - 0.1, winH * 0.54, 0.04);

  // Lower panel zone apron: 5 square recessed timber panels
  const lowerY = winY - winH * 0.32;
  const panelW = 0.28;
  const panelH = 0.32;
  box(teakWood, winX, lowerY, winZ - 0.03, winW, winH * 0.44, 0.05);
  for (let i = 0; i < 5; i++) {
    const px = winX - (winW * 0.38) + i * ((winW * 0.76) / 4);
    box(dark, px, lowerY, winZ - 0.065, panelW, panelH, 0.02);
    box(teakWood, px, lowerY, winZ - 0.055, panelW - 0.04, panelH - 0.04, 0.03);
  }

  // Upper glazed casement zone (2 glass panes with mullions)
  const glassY = winY + winH * 0.18;
  const glassH = winH * 0.52;
  for (const dx of [-winW * 0.23, winW * 0.23]) {
    box(materials.glass, winX + dx, glassY, winZ - 0.03, winW * 0.42, glassH, 0.02);
    box(teakWood, winX + dx, glassY + glassH / 2, winZ - 0.05, winW * 0.44, 0.04, 0.04);
    box(teakWood, winX + dx, glassY - glassH / 2, winZ - 0.05, winW * 0.44, 0.04, 0.04);
    box(teakWood, winX + dx, glassY, winZ - 0.05, winW * 0.44, 0.025, 0.04);
  }
  for (const dx of [-winW / 2, 0, winW / 2]) {
    box(teakWood, winX + dx, winY, winZ - 0.06, 0.06, winH + 0.06, 0.06);
  }
  box(teakWood, winX, winY + winH / 2 + 0.04, winZ - 0.07, winW + 0.12, 0.07, 0.08);

  // Outdoor AC unit mounted to the left of the teak window
  buildAC(ctx, -3.05, facadeZ - 0.2, 4.45);

  // Right: Recessed balcony on second floor
  const balcX = 1.7;
  const balcW = 3.3;
  // White balcony columns
  box(white, 0.2, 4.2, facadeZ - 0.02, 0.14, 2.45, 0.14);
  box(white, halfW - 0.15, 4.2, facadeZ - 0.02, 0.14, 2.45, 0.14);
  // Balcony parapet railing with top handrail
  box(cream, balcX, 3.42, facadeZ - 0.02, balcW, 0.9, 0.12);
  box(teakWood, balcX, 3.88, facadeZ - 0.02, balcW + 0.06, 0.05, 0.16);

  // Potted plants and cascading foliage on the balcony
  for (let i = 0; i < 5; i++) {
    const px = balcX - 1.2 + i * 0.6;
    buildPlant(ctx, px, facadeZ - 0.08, 0.55 + ctx.random() * 0.25);
  }
  for (let i = 0; i < 16; i++) {
    const vx = balcX - 1.3 + (i / 16) * 2.6;
    const vy = 3.4 - (i % 3) * 0.15;
    emit(
      new T.PlaneGeometry(0.35, 0.4),
      materials.leafMats[i % 4],
      vx,
      vy,
      facadeZ - 0.1,
      1,
      1,
      1,
      0.1,
      0,
      (ctx.random() - 0.5) * 0.4,
    );
  }

  // ---------------------------------------------------------------------------
  // 5. MULTI-TIERED GABLE ROOF (ATAP GENTENG BERTINGKAT)
  // ---------------------------------------------------------------------------
  // Tier 1: Eave awning over second floor teak window
  const eaveW = 2.4;
  const eaveSlope = 0.42;
  box(tile, winX, 5.35, facadeZ - 0.28, eaveW, 0.07, 0.75, -eaveSlope);
  for (const bx of [winX - eaveW * 0.4, winX, winX + eaveW * 0.4]) {
    beam(teakWood, [bx, 5.05, facadeZ - 0.02], [bx, 5.32, facadeZ - 0.55], 0.035);
  }
  for (let x = winX - eaveW / 2 + 0.08; x <= winX + eaveW / 2; x += 0.22) {
    emit(new T.CylinderGeometry(0.045, 0.055, 0.35, 6, 1, true, 0, Math.PI), tile, x, 5.38, facadeZ - 0.32, 1, 1, 1, Math.PI / 2);
  }

  // Tier 2: Left Gable Roof (over winX) with attic dormer/vent
  const gable1W = 3.6;
  const gable1Rise = 1.35;
  const gable1Base = h - 0.3; // 5.7
  const gable1Half = gable1W / 2;
  const gable1Z = facadeZ;

  // Solid left gable triangular wall (cream)
  emitGable(ctx, cream, winX, gable1Base, gable1Rise, gable1Half + 0.08, gable1Z);
  // Left gable terracotta roof slopes
  buildGableRoofSlopes(ctx, tile, winX, gable1Base, gable1Rise, gable1Half + 0.15, gable1Z, gable1Z + depth * 0.75, 0.25);

  // Timber rafter tails / corbels under left gable
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 4; i++) {
      const rx = winX + s * (0.3 + i * 0.32);
      const ry = gable1Base + gable1Rise * (1 - (0.3 + i * 0.32) / gable1Half) - 0.04;
      box(teakWood, rx, ry, gable1Z - 0.08, 0.045, 0.06, 0.25);
    }
  }
  // Attic dormer vent window in left gable
  box(teakWood, winX, gable1Base + 0.52, gable1Z - 0.04, 0.55, 0.65, 0.08);
  box(materials.dark, winX, gable1Base + 0.52, gable1Z - 0.05, 0.44, 0.52, 0.05);

  // Tier 3: Right Higher Gable Roof (offset to the right, higher peak matching Gambar 2)
  const gable2CenterX = 1.45;
  const gable2W = 3.8;
  const gable2Rise = 1.45;
  const gable2Base = h; // 6.0
  const gable2Half = gable2W / 2;
  const gable2Z = facadeZ + 0.25;

  // Solid right gable triangular wall (cream)
  emitGable(ctx, cream, gable2CenterX, gable2Base, gable2Rise, gable2Half + 0.08, gable2Z);
  // Right higher gable terracotta roof slopes
  buildGableRoofSlopes(ctx, tile, gable2CenterX, gable2Base, gable2Rise, gable2Half + 0.15, gable2Z, gable2Z + depth * 0.8, 0.25);

  // Timber corbels under right gable
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 4; i++) {
      const rx = gable2CenterX + s * (0.3 + i * 0.34);
      const ry = gable2Base + gable2Rise * (1 - (0.3 + i * 0.34) / gable2Half) - 0.04;
      box(teakWood, rx, ry, gable2Z - 0.08, 0.045, 0.06, 0.25);
    }
  }
  // Circular ventilation medallion emblem in the right gable apex (matching Gambar 2)
  emit(new T.CylinderGeometry(0.18, 0.18, 0.04, 16), teakWood, gable2CenterX, gable2Base + 0.78, gable2Z - 0.03, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.19, 0.02, 5, 20), white, gable2CenterX, gable2Base + 0.78, gable2Z - 0.04);

  // ---------------------------------------------------------------------------
  // 6. FRONT FENCE & GATE WITH WOOD SLATS AND HANGING CLOTHS (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const gateLeft = -halfW + 0.18;
  const gateRight = 0.65;
  const fenceEnd = halfW - 0.18;
  const gateH = 1.48;

  // Concrete pillars
  for (const x of [gateLeft, gateRight, fenceEnd]) {
    box(cream, x, gateH / 2, 0, 0.24, gateH + 0.1, 0.28);
    box(concrete, x, gateH + 0.08, 0, 0.32, 0.08, 0.34);
  }

  // Right fence section: Low cream wall + white bars
  box(cream, (gateRight + fenceEnd) / 2, 0.45, 0, fenceEnd - gateRight, 0.9, 0.2);
  box(white, (gateRight + fenceEnd) / 2, 1.15, 0, fenceEnd - gateRight, 0.04, 0.04);
  for (let x = gateRight + 0.2; x < fenceEnd - 0.1; x += 0.18) {
    box(white, x, 1.15, 0, 0.025, 0.55, 0.035);
  }

  // Main Carport Gate:
  const gateW = gateRight - gateLeft;
  const gateMidX = (gateLeft + gateRight) / 2;

  // Frame outer border
  box(white, gateMidX, 0.1, -0.015, gateW - 0.06, 0.05, 0.05);
  box(white, gateMidX, gateH * 0.78, -0.015, gateW - 0.06, 0.05, 0.05);
  box(white, gateMidX, gateH, -0.015, gateW - 0.06, 0.05, 0.05);

  // Vertical wood/GRC panels with white dividers
  const slatStartY = 0.15;
  const slatEndY = gateH * 0.76;
  const slatH = slatEndY - slatStartY;
  for (let x = gateLeft + 0.18; x < gateRight - 0.12; x += 0.19) {
    box(white, x, gateH / 2, -0.01, 0.024, gateH, 0.035);
    box(woodSlat, x, (slatStartY + slatEndY) / 2, 0.015, 0.155, slatH, 0.028);
    box(dark, x - 0.04, (slatStartY + slatEndY) / 2, 0.022, 0.008, slatH, 0.01);
    box(dark, x + 0.04, (slatStartY + slatEndY) / 2, 0.022, 0.008, slatH, 0.01);
  }

  // Gate handle in the center
  box(dark, gateMidX, gateH * 0.55, -0.05, 0.04, 0.16, 0.05);

  // Hanging laundry over the upper gate horizontal rail (Gambar 2):
  box(cloth[0], gateMidX - 0.65, gateH - 0.08, -0.055, 0.44, 0.66, 0.025, 0.06);
  box(cloth[1], gateMidX - 0.12, gateH - 0.08, -0.055, 0.42, 0.64, 0.025, 0.06);
  box(cloth[2], gateMidX + 0.42, gateH - 0.08, -0.055, 0.44, 0.62, 0.025, 0.06);

  // ---------------------------------------------------------------------------
  // 7. FRONT RIGHT VEGETATION (SUBTLE BOUNDARY PLANTS)
  // ---------------------------------------------------------------------------
  buildPlant(ctx, halfW - 0.8, 0.75, 0.85);
  buildPlant(ctx, halfW - 1.4, 0.65, 0.65);
}
