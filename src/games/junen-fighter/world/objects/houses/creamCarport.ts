import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildBarrelTileRoof } from '../architecture';
import { buildPlant } from '../vegetation';

/**
 * Builds the Cream Carport House (Foto 3 - Jl. H. Junen):
 * - 2-storey house with multi-tiered terracotta tile roof with reddish-brown / burgundy painted timber fascia trim (lisplang merah hati)
 * - Upper dormer gable with round medallion rosette emblem in red-brown trim
 * - 2nd floor: large 4-pane dark teak wood window with lower raised timber panel apron and eave awning; 1 outdoor AC unit on left
 * - Ground floor: full-width corrugated carport awning with exposed wooden kaso-kaso rafters underneath
 * - Carport interior: car fully draped in silver-gray car cover; dark teak entrance double doors
 * - Front fence: white sliding gate with vertical reddish-brown wood plank infill and white vertical bottom grilles
 * - 3 hanging towels/cloths on gate rail (red, navy, cyan) as seen in Google Street View
 * - White concrete gate pillars with recessed vertical slot reveals; pedestrian wicket gate; guava/conifer tree on right
 */
export function buildCreamCarportHouse(ctx: WorldContext, p: Property) {
  const { box, beam, cyl, emit, materials: m } = ctx;
  const {
    cream,
    concrete,
    tile,
    dark,
    white,
    roofGrey,
    terracottaTile = m.tile,
    glass,
  } = m;

  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front; // 3.4m
  const halfW = w / 2; // 3.0m (-3.0 to +3.0)

  // Custom materials for Photo 3 palette
  const redLisplang = new T.MeshStandardMaterial({ color: '#7b241c', roughness: 0.65 });
  const teakWood = new T.MeshStandardMaterial({ color: '#4a2810', roughness: 0.75 });
  const woodPlank = new T.MeshStandardMaterial({ color: '#8a4b2d', roughness: 0.8 });
  const silverCover = new T.MeshStandardMaterial({ color: '#c4c8cb', roughness: 0.45, metalness: 0.25 });

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & 2-STOREY SOLID BUILDING MASS
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);

  // Main 2-storey building block
  box(cream, 0, h / 2, front + depth / 2, w - 0.12, h, depth);

  // Left party wall separating from pale-green house
  box(cream, -halfW + 0.08, 1.4, front / 2, 0.16, 2.8, front);
  beam(concrete, [-halfW + 0.08, 2.8, 0.1], [-halfW + 0.08, 2.05, front], 0.09);

  // Right boundary wall
  box(cream, halfW - 0.08, 1.3, front / 2, 0.16, 2.6, front);

  // ---------------------------------------------------------------------------
  // 2. GROUND FLOOR: FULL-WIDTH CARPORT AWNING & KASO-KASO RAFTERS (FOTO 3)
  // ---------------------------------------------------------------------------
  const awningW = 4.6;
  const awningCenterX = -0.5; // spans x = -2.8 to +1.8
  const awningZEnd = 0.25;
  const awningZStart = facadeZ;
  const awningLen = awningZStart - awningZEnd;
  const awningBaseY = 2.75;
  const awningSlope = 0.055;

  // Carport paved driveway floor
  box(concrete, awningCenterX, 0.04, front / 2, awningW, 0.08, front);

  // Corrugated roof sheet (atap seng/asbes gelombang)
  const roofMidZ = (awningZStart + awningZEnd) / 2;
  box(roofGrey, awningCenterX, awningBaseY - 0.02, roofMidZ, awningW + 0.1, 0.04, awningLen + 0.1, -awningSlope);
  // Corrugation ridges running along the slope (Z)
  for (let rx = awningCenterX - awningW / 2 + 0.08; rx <= awningCenterX + awningW / 2; rx += 0.14) {
    beam(
      roofGrey,
      [rx, awningBaseY + (awningLen / 2) * awningSlope, awningZStart],
      [rx, awningBaseY - (awningLen / 2) * awningSlope, awningZEnd],
      0.018,
    );
  }

  // EXPOSED WOODEN KASO-KASO RAFTERS UNDERNEATH (Grid kayu reng & usuk Foto 3)
  // 1. Cross purlins (reng kayu melintang X)
  for (let zz = awningZEnd + 0.35; zz <= awningZStart; zz += 0.65) {
    const py = awningBaseY - 0.07 - (awningZStart - zz) * (awningSlope * 0.4);
    box(teakWood, awningCenterX, py, zz, awningW, 0.06, 0.06);
  }
  // 2. Longitudinal rafters (usuk kayu membujur Z)
  for (let x = awningCenterX - awningW / 2 + 0.35; x <= awningCenterX + awningW / 2 - 0.2; x += 0.55) {
    beam(
      teakWood,
      [x, awningBaseY - 0.05, awningZStart],
      [x, awningBaseY - 0.05 - awningLen * awningSlope, awningZEnd],
      0.032,
    );
  }

  // Front steel/timber support posts at corners
  box(dark, awningCenterX - awningW / 2 + 0.12, 1.35, awningZEnd + 0.08, 0.10, 2.7, 0.10);
  box(dark, awningCenterX + awningW / 2 - 0.12, 1.35, awningZEnd + 0.08, 0.10, 2.7, 0.10);
  // Front header fascia beam
  box(dark, awningCenterX, awningBaseY - awningLen * awningSlope * 0.5, awningZEnd, awningW + 0.15, 0.12, 0.08);

  // ---------------------------------------------------------------------------
  // 3. CARPORT INTERIOR: SILVER COVERED CAR & ENTRANCE DOOR (FOTO 3)
  // ---------------------------------------------------------------------------
  // Car completely draped in silver-gray car cover (Foto 3)
  const carX = -0.55;
  const carZ = 1.75;
  // Main body form of covered car
  box(silverCover, carX, 0.52, carZ, 1.76, 0.74, 3.7);
  box(silverCover, carX, 1.02, carZ - 0.15, 1.62, 0.62, 2.2);
  // Soft rounded creases and hems around wheel wells
  for (const s of [-1, 1]) {
    const wx = carX + s * 0.88;
    for (const wz of [carZ - 1.0, carZ + 1.0]) {
      cyl(silverCover, wx, 0.35, wz, 0.34, 0.18, Math.PI / 2);
    }
  }

  // Teak wood entrance double doors under carport (Foto 3)
  const doorX = -0.4;
  box(teakWood, doorX, 1.25, facadeZ - 0.02, 1.4, 2.3, 0.06);
  for (const dx of [doorX - 0.34, doorX + 0.34]) {
    box(teakWood, dx, 1.22, facadeZ - 0.05, 0.64, 2.2, 0.03);
    // Recessed panels
    box(dark, dx, 0.7, facadeZ - 0.065, 0.44, 0.75, 0.015);
    box(dark, dx, 1.6, facadeZ - 0.065, 0.44, 0.75, 0.015);
  }
  // Transoms with glass above door
  for (let dx = -0.8; dx <= 0.0; dx += 0.4) {
    box(teakWood, dx, 2.62, facadeZ - 0.04, 0.36, 0.36, 0.06);
    box(glass, dx, 2.62, facadeZ - 0.05, 0.28, 0.28, 0.02);
  }

  // Indonesian 19L Aqua water gallon on left carport floor (Foto 3)
  cyl(m.blue, -2.6, 0.24, 1.25, 0.16, 0.45);
  cyl(m.blue, -2.6, 0.48, 1.25, 0.07, 0.1);

  // ---------------------------------------------------------------------------
  // 4. SECOND FLOOR: 4-PANE TEAK WINDOW WITH RAISED PANELS & AC (FOTO 3)
  // ---------------------------------------------------------------------------
  const winX = -0.35;
  const winY = 4.45;
  const winZ = facadeZ - 0.04;
  const winW = 2.15;
  const winH = 2.05;

  // Dark teak wood window surround frame
  box(teakWood, winX, winY, winZ - 0.02, winW + 0.12, winH + 0.12, 0.06);

  // Lower apron zone: 5 square raised / recessed timber panels (Foto 3)
  const apronY = winY - winH * 0.32;
  const apronH = winH * 0.36;
  box(teakWood, winX, apronY, winZ - 0.04, winW, apronH, 0.04);
  for (let i = 0; i < 5; i++) {
    const px = winX - winW * 0.4 + i * (winW * 0.8 / 4);
    box(dark, px, apronY, winZ - 0.065, 0.32, 0.34, 0.02);
    box(teakWood, px, apronY, winZ - 0.055, 0.26, 0.28, 0.025);
  }

  // Upper glazed casement zone: 4 glass panes with dark teak mullions
  const glassY = winY + winH * 0.20;
  const glassH = winH * 0.56;
  const paneW = (winW - 0.2) / 2;
  for (const dx of [-winW * 0.25, winW * 0.25]) {
    box(glass, winX + dx, glassY, winZ - 0.03, paneW, glassH, 0.02);
    // Inner window mullion cross
    box(teakWood, winX + dx, glassY, winZ - 0.045, paneW, 0.035, 0.03);
    box(teakWood, winX + dx, glassY, winZ - 0.045, 0.035, glassH, 0.03);
  }
  // Central vertical mullion & top horizontal beam
  box(teakWood, winX, glassY, winZ - 0.05, 0.08, glassH, 0.05);
  box(teakWood, winX, winY + winH / 2, winZ - 0.05, winW + 0.08, 0.08, 0.06);

  // Cantilevered timber awning over the 2nd floor teak window
  const eaveW = winW + 0.5;
  box(teakWood, winX, winY + winH / 2 + 0.12, winZ - 0.25, eaveW, 0.06, 0.55, -0.4);
  box(tile, winX, winY + winH / 2 + 0.15, winZ - 0.26, eaveW + 0.06, 0.04, 0.58, -0.4);
  // Angled support brackets
  for (const bx of [winX - eaveW * 0.42, winX, winX + eaveW * 0.42]) {
    beam(teakWood, [bx, winY + winH / 2 - 0.15, winZ - 0.02], [bx, winY + winH / 2 + 0.10, winZ - 0.48], 0.035);
  }

  // 1 OUTDOOR AC COMPRESSOR MOUNTED ON WHITE WALL TO LEFT OF WINDOW (Foto 3)
  const acX = -2.05;
  const acY = 4.55;
  // Mounting brackets
  beam(dark, [acX - 0.32, acY - 0.28, facadeZ - 0.02], [acX - 0.32, acY - 0.28, facadeZ - 0.3], 0.02);
  beam(dark, [acX + 0.32, acY - 0.28, facadeZ - 0.02], [acX + 0.32, acY - 0.28, facadeZ - 0.3], 0.02);
  // AC chassis & fan
  box(white, acX, acY, facadeZ - 0.2, 0.8, 0.54, 0.32);
  emit(new T.CylinderGeometry(0.18, 0.18, 0.02, 16), dark, acX - 0.1, acY, facadeZ - 0.36, 1, 1, 1, Math.PI / 2);
  // Pipe bundle
  beam(white, [acX + 0.36, acY - 0.1, facadeZ - 0.2], [acX + 0.36, 2.8, facadeZ - 0.02], 0.03);

  // ---------------------------------------------------------------------------
  // 5. ROOF: TERRACOTTA GENTENG WITH RED-BROWN LISPLANG & DORMER (FOTO 3)
  // ---------------------------------------------------------------------------
  const roofBaseY = h - 0.2; // 5.8m
  const roofRise = 1.35;

  // Main continuous terracotta tile roof
  buildBarrelTileRoof(ctx, 0, w, depth, roofBaseY, roofRise, facadeZ, terracottaTile, redLisplang, white);

  // UPPER DORMER GABLE WITH RED-BROWN LISPLANG & ROUND MEDALLION (Foto 3)
  const dormerW = 2.8;
  const dormerRise = 0.95;
  const dormerBaseY = roofBaseY + 0.45;
  const dormerHalfW = dormerW / 2;
  const dormerX = 0.2; // slightly offset as in photo
  const dormerZ = facadeZ - 0.05;

  // Dormer triangular pediment wall (white/cream)
  const gDorm = new T.BufferGeometry();
  gDorm.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [dormerX - dormerHalfW, dormerBaseY, dormerZ, dormerX + dormerHalfW, dormerBaseY, dormerZ, dormerX, dormerBaseY + dormerRise, dormerZ],
      3,
    ),
  );
  gDorm.setIndex([0, 2, 1]);
  gDorm.computeVertexNormals();
  gDorm.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  emit(gDorm, white, 0, 0, 0);

  // Distinctive Red-Brown Lisplang Fascia on Dormer Rakes (Foto 3)
  beam(redLisplang, [dormerX - dormerHalfW, dormerBaseY, dormerZ - 0.03], [dormerX, dormerBaseY + dormerRise, dormerZ - 0.03], 0.065);
  beam(redLisplang, [dormerX, dormerBaseY + dormerRise, dormerZ - 0.03], [dormerX + dormerHalfW, dormerBaseY, dormerZ - 0.03], 0.065);

  // Circular Decorative Medallion in Dormer Apex (Foto 3)
  const dormMedalY = dormerBaseY + 0.52;
  emit(new T.CylinderGeometry(0.20, 0.20, 0.035, 18), redLisplang, dormerX, dormMedalY, dormerZ - 0.02, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.21, 0.02, 5, 20), redLisplang, dormerX, dormMedalY, dormerZ - 0.03);
  box(cream, dormerX, dormMedalY, dormerZ - 0.03, 0.26, 0.26, 0.02);

  // Wooden corbels / exposed rafter brackets under dormer lisplang
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 3; i++) {
      const rx = dormerX + s * (0.3 + i * 0.3);
      const ry = dormerBaseY + dormerRise * (1 - (0.3 + i * 0.3) / dormerHalfW) - 0.05;
      box(redLisplang, rx, ry, dormerZ - 0.06, 0.05, 0.07, 0.22);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. FRONT FENCE: WOODPLANK SLIDING GATE & HANGING TOWELS (FOTO 3)
  // ---------------------------------------------------------------------------
  const gateLeft = -halfW + 0.15; // -2.85
  const gateRight = 1.35; // gate width 4.2m
  const fenceEnd = halfW - 0.15; // +2.85
  const gateH = 1.55;
  const gateW = gateRight - gateLeft;
  const gateMidX = (gateLeft + gateRight) / 2;

  // White concrete gate pillars with recessed vertical slot reveals (Foto 3)
  for (const px of [gateLeft - 0.12, gateRight + 0.12, fenceEnd]) {
    box(white, px, gateH / 2 + 0.05, 0.05, 0.32, gateH + 0.15, 0.32);
    box(concrete, px, gateH + 0.14, 0.05, 0.38, 0.06, 0.38);
    // Vertical recessed slot reveals on pillar face
    box(dark, px, gateH * 0.55, -0.115, 0.08, 0.75, 0.02);
  }

  // Main Sliding Gate:
  // White outer steel frame
  box(white, gateMidX, 0.08, 0.02, gateW, 0.05, 0.05);
  box(white, gateMidX, gateH * 0.75, 0.02, gateW, 0.05, 0.05);
  box(white, gateMidX, gateH, 0.02, gateW, 0.05, 0.05);

  // Infill: Vertical Reddish-Brown Woodplank Slats with White Dividers (Foto 3)
  const slatStartY = 0.18;
  const slatEndY = gateH * 0.74;
  const slatH = slatEndY - slatStartY;
  for (let x = gateLeft + 0.14; x < gateRight - 0.08; x += 0.16) {
    // White structural divider bar
    box(white, x, gateH / 2, 0.025, 0.022, gateH, 0.03);
    // Reddish-brown woodplank panel
    box(woodPlank, x, (slatStartY + slatEndY) / 2, 0.045, 0.135, slatH, 0.026);
  }

  // White vertical grilles at the bottom section of the gate
  for (let x = gateLeft + 0.08; x < gateRight; x += 0.08) {
    box(white, x, 0.12, 0.02, 0.015, 0.18, 0.02);
  }

  // 3 HANGING TOWELS / CLOTHS ON TOP GATE RAIL (Foto 3: Red, Navy Blue, Cyan)
  const cloths = [
    { x: -0.65, color: '#9e2a2b', w: 0.38, h: 0.52 }, // Red towel
    { x: -0.22, color: '#1d2d44', w: 0.36, h: 0.48 }, // Navy towel
    { x: +0.18, color: '#74a4bc', w: 0.40, h: 0.45 }, // Cyan/light-blue towel
  ];
  for (const c of cloths) {
    const towelMat = new T.MeshStandardMaterial({ color: c.color, roughness: 0.9 });
    // Draped over top rail
    box(towelMat, c.x, gateH - c.h / 2 + 0.02, 0.01, c.w, c.h, 0.075, 0.08);
  }

  // Right Side: Pedestrian Wicket Gate (pintu pagar kecil Foto 3)
  const wicketW = fenceEnd - (gateRight + 0.24);
  const wicketMidX = (gateRight + 0.24 + fenceEnd) / 2;
  box(white, wicketMidX, gateH / 2, 0.05, wicketW, gateH - 0.1, 0.04);
  // Woodplank infill on wicket
  for (let wx = gateRight + 0.35; wx < fenceEnd - 0.1; wx += 0.16) {
    box(woodPlank, wx, gateH * 0.45, 0.065, 0.13, gateH * 0.65, 0.025);
  }

  // Lush tropical guava / conifer tree growing in the right corner over fence (Foto 3)
  buildPlant(ctx, halfW - 0.4, 0.4, 1.8, true);
  buildPlant(ctx, halfW - 0.2, 0.8, 2.2, true);
}
