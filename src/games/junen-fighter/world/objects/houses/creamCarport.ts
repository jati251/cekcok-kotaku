import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildBarrelTileRoof } from '../architecture';
import { buildPlant } from '../vegetation';

/**
 * Builds the Cream Carport House (Foto 3 - Jl. H. Junen):
 * 100% faithful reconstruction based on Street View photo:
 * - 2-storey house with iconic SPLIT DOUBLE-GABLE ROOF with red-brown painted lisplang trim
 * - Left Gable: covers bedroom, features wooden eave brackets and square louvered attic vent window
 * - Right Gable: covers OPEN RECESSED BALCONY, features circular medallion rosette in apex
 * - 2nd Floor Left: large 4-pane dark teak wood window with 5 raised timber apron panels, window eave hood, and outdoor AC compressor
 * - 2nd Floor Right: OPEN OUTDOOR BALCONY with white supporting column, red-brown beam accents, black metal railing, and potted flowers/plants
 * - Ground Floor: full-width corrugated carport awning with grid of exposed wooden kaso-kaso rafters underneath
 * - Carport interior: car fully draped in silver-gray car cover; dark teak entrance double doors
 * - Front fence: white sliding gate with vertical reddish-brown wood plank infill and white vertical bottom grilles
 * - 3 hanging towels/cloths on gate rail (red, navy, cyan) as seen in Google Street View
 * - Right side: pedestrian wicket gate with matching woodplanks; white pillars with vertical slot reveals; lush guava tree branching over fence
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

  // Palette matching Foto 3
  const redLisplang = new T.MeshStandardMaterial({ color: '#7b241c', roughness: 0.65 });
  const teakWood = new T.MeshStandardMaterial({ color: '#4a2810', roughness: 0.75 });
  const woodPlank = new T.MeshStandardMaterial({ color: '#8a4b2d', roughness: 0.8 });
  const silverCover = new T.MeshStandardMaterial({ color: '#c4c8cb', roughness: 0.45, metalness: 0.25 });

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & STRUCTURAL WALLS
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);

  // Left party wall separating from pale-green house
  box(cream, -halfW + 0.08, 1.4, front / 2, 0.16, 2.8, front);
  beam(concrete, [-halfW + 0.08, 2.8, 0.1], [-halfW + 0.08, 2.05, front], 0.09);

  // Right boundary party wall
  box(cream, halfW - 0.08, 1.3, front / 2, 0.16, 2.6, front);

  // Ground floor rear building mass (under carport & walkway)
  box(white, 0, 1.5, front + depth / 2, w - 0.12, 3.0, depth);

  // ---------------------------------------------------------------------------
  // 2. GROUND FLOOR: CARPORT AWNING, EXPOSED KASO RAFTERS & SILVER CAR (FOTO 3)
  // ---------------------------------------------------------------------------
  const awningW = 4.4;
  const awningCenterX = -0.8; // spans x = -3.0 to +1.4
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
  // Corrugation ridges running down the slope (Z)
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

  // Front steel support posts at carport corners
  box(dark, awningCenterX - awningW / 2 + 0.12, 1.35, awningZEnd + 0.08, 0.09, 2.7, 0.09);
  box(dark, awningCenterX + awningW / 2 - 0.12, 1.35, awningZEnd + 0.08, 0.09, 2.7, 0.09);
  box(dark, awningCenterX, awningBaseY - awningLen * awningSlope * 0.5, awningZEnd, awningW + 0.12, 0.10, 0.08);

  // Car draped in silver-gray car cover inside carport (Foto 3)
  const carX = -0.9;
  const carZ = 1.75;
  box(silverCover, carX, 0.52, carZ, 1.76, 0.74, 3.7);
  box(silverCover, carX, 1.02, carZ - 0.15, 1.62, 0.62, 2.2);
  for (const s of [-1, 1]) {
    const wx = carX + s * 0.88;
    for (const wz of [carZ - 1.0, carZ + 1.0]) {
      cyl(silverCover, wx, 0.35, wz, 0.34, 0.18, Math.PI / 2);
    }
  }

  // Teak wood entrance double doors under carport (Foto 3)
  const doorX = -0.7;
  box(teakWood, doorX, 1.25, facadeZ - 0.02, 1.4, 2.3, 0.06);
  for (const dx of [doorX - 0.34, doorX + 0.34]) {
    box(teakWood, dx, 1.22, facadeZ - 0.05, 0.64, 2.2, 0.03);
    box(dark, dx, 0.7, facadeZ - 0.065, 0.44, 0.75, 0.015);
    box(dark, dx, 1.6, facadeZ - 0.065, 0.44, 0.75, 0.015);
  }
  for (let dx = -1.1; dx <= -0.3; dx += 0.4) {
    box(teakWood, dx, 2.62, facadeZ - 0.04, 0.36, 0.36, 0.06);
    box(glass, dx, 2.62, facadeZ - 0.05, 0.28, 0.28, 0.02);
  }

  // Indonesian 19L Aqua water gallon on carport floor
  cyl(m.blue, -2.6, 0.24, 1.25, 0.16, 0.45);
  cyl(m.blue, -2.6, 0.48, 1.25, 0.07, 0.1);

  // ---------------------------------------------------------------------------
  // 3. SECOND FLOOR LEFT: BEDROOM, 4-PANE TEAK WINDOW, & AC (FOTO 3)
  // ---------------------------------------------------------------------------
  // Left 2nd floor bedroom solid building volume: x = -3.0 to 0.0
  const leftBayW = 3.0;
  const leftBayX = -halfW + leftBayW / 2; // -1.5m
  box(white, leftBayX, 4.5, facadeZ + depth / 2, leftBayW, 3.0, depth);

  // Large 4-pane dark teak wood window with raised panel apron (Foto 3)
  const winX = -1.35;
  const winY = 4.35;
  const winZ = facadeZ - 0.04;
  const winW = 1.95;
  const winH = 1.90;

  // Outer dark teak wood frame
  box(teakWood, winX, winY, winZ - 0.02, winW + 0.10, winH + 0.10, 0.06);

  // Lower apron zone: 5 raised timber panels (Foto 3)
  const apronY = winY - winH * 0.32;
  const apronH = winH * 0.36;
  box(teakWood, winX, apronY, winZ - 0.04, winW, apronH, 0.04);
  for (let i = 0; i < 5; i++) {
    const px = winX - winW * 0.38 + i * (winW * 0.76 / 4);
    box(dark, px, apronY, winZ - 0.065, 0.28, 0.30, 0.02);
    box(teakWood, px, apronY, winZ - 0.055, 0.23, 0.25, 0.025);
  }

  // Upper glazed zone: 4 glass panes with dark teak mullions & warm sheer curtains (Foto 3)
  const glassY = winY + winH * 0.20;
  const glassH = winH * 0.56;
  const paneW = (winW - 0.16) / 2;
  // Luminous warm sheer curtain backing
  const curtainMat = new T.MeshStandardMaterial({ color: '#f5edd4', roughness: 0.9 });
  box(curtainMat, winX, glassY, winZ - 0.015, winW - 0.12, glassH - 0.04, 0.01);
  for (const dx of [-winW * 0.25, winW * 0.25]) {
    box(glass, winX + dx, glassY, winZ - 0.03, paneW, glassH, 0.02);
    box(teakWood, winX + dx, glassY, winZ - 0.045, paneW, 0.03, 0.03);
    box(teakWood, winX + dx, glassY, winZ - 0.045, 0.03, glassH, 0.03);
  }
  box(teakWood, winX, glassY, winZ - 0.05, 0.07, glassH, 0.05);
  box(teakWood, winX, winY + winH / 2, winZ - 0.05, winW + 0.06, 0.07, 0.06);

  // Cantilevered timber awning over the teak window
  const eaveW = winW + 0.4;
  box(teakWood, winX, winY + winH / 2 + 0.10, winZ - 0.22, eaveW, 0.05, 0.50, -0.38);
  box(tile, winX, winY + winH / 2 + 0.13, winZ - 0.23, eaveW + 0.04, 0.035, 0.52, -0.38);
  for (const bx of [winX - eaveW * 0.42, winX, winX + eaveW * 0.42]) {
    beam(teakWood, [bx, winY + winH / 2 - 0.14, winZ - 0.02], [bx, winY + winH / 2 + 0.08, winZ - 0.44], 0.032);
  }

  // Outdoor AC units mounted on left white wall (Foto 3: 2 stacked units)
  const acX = -2.65;
  for (const acY of [4.55, 3.75]) {
    beam(dark, [acX - 0.28, acY - 0.26, facadeZ - 0.02], [acX - 0.28, acY - 0.26, facadeZ - 0.28], 0.02);
    beam(dark, [acX + 0.28, acY - 0.26, facadeZ - 0.02], [acX + 0.28, acY - 0.26, facadeZ - 0.28], 0.02);
    box(white, acX, acY, facadeZ - 0.18, 0.72, 0.50, 0.28);
    emit(new T.CylinderGeometry(0.16, 0.16, 0.02, 16), dark, acX - 0.1, acY, facadeZ - 0.33, 1, 1, 1, Math.PI / 2);
  }
  beam(white, [acX + 0.32, 4.5, facadeZ - 0.18], [acX + 0.32, 2.8, facadeZ - 0.02], 0.03);

  // ---------------------------------------------------------------------------
  // 4. SECOND FLOOR RIGHT: OPEN RECESSED BALCONY (FOTO 3)
  // ---------------------------------------------------------------------------
  // Balcony spans x = 0.0 to +3.0, recessed by 1.4m
  const balcDepth = 1.4;
  const balcW = 3.0;
  const balcX = halfW - balcW / 2; // +1.5m
  const balcFloorY = 3.0;

  // Balcony recessed floor slab
  box(white, balcX, balcFloorY, facadeZ + balcDepth / 2, balcW, 0.14, balcDepth);
  // Red-brown lisplang trim along balcony floor edge (Foto 3)
  box(redLisplang, balcX, balcFloorY + 0.04, facadeZ - 0.03, balcW, 0.08, 0.06);

  // Recessed back wall behind balcony
  box(white, balcX, 4.5, facadeZ + balcDepth + (depth - balcDepth) / 2, balcW, 3.0, depth - balcDepth);

  // Double balcony door on the recessed rear wall
  box(teakWood, balcX, 4.35, facadeZ + balcDepth - 0.02, 1.6, 2.2, 0.05);
  box(glass, balcX - 0.38, 4.35, facadeZ + balcDepth - 0.035, 0.62, 2.05, 0.02);
  box(glass, balcX + 0.38, 4.35, facadeZ + balcDepth - 0.035, 0.62, 2.05, 0.02);

  // FRONT BALCONY COLUMN & ROOF SUPPORT BEAM (Foto 3)
  // Structural white pillar at front-left of balcony (x ~ 0.15)
  const colX = 0.12;
  const colW = 0.28;
  box(white, colX, 4.4, facadeZ - 0.03, colW, 2.8, colW);
  // Red-brown accent band on column capital & mid-beam (Foto 3)
  box(redLisplang, colX, 3.05, facadeZ - 0.03, colW + 0.04, 0.10, colW + 0.04);
  box(redLisplang, colX, 5.75, facadeZ - 0.03, colW + 0.04, 0.12, colW + 0.04);
  // Red-brown lintel beam connecting column across to right boundary
  box(redLisplang, balcX, 5.75, facadeZ - 0.03, balcW, 0.12, 0.18);

  // Black metal balcony railing (OPEN RAILING WITH VERTICAL BALUSTERS, Foto 3)
  const railH = 0.88;
  const railMidX = balcX + 0.1;
  const railW = balcW - 0.35;
  // Top handrail
  box(dark, railMidX, balcFloorY + railH, facadeZ - 0.02, railW + 0.04, 0.04, 0.05);
  // Bottom rail
  box(dark, railMidX, balcFloorY + 0.08, facadeZ - 0.02, railW + 0.04, 0.03, 0.03);
  // Mid horizontal bar
  box(dark, railMidX, balcFloorY + railH * 0.48, facadeZ - 0.02, railW + 0.04, 0.02, 0.02);
  // Open vertical baluster pickets
  for (let rx = colX + 0.22; rx <= halfW - 0.22; rx += 0.14) {
    box(dark, rx, balcFloorY + railH / 2, facadeZ - 0.02, 0.018, railH - 0.08, 0.018);
  }

  // Potted plants and foliage on balcony floor & railing (Foto 3)
  for (const px of [0.55, 1.25, 2.05]) {
    box(dark, px, balcFloorY + 0.12, facadeZ + 0.25, 0.24, 0.18, 0.24);
    buildPlant(ctx, px, facadeZ + 0.25, 0.65, true);
  }

  // ---------------------------------------------------------------------------
  // 5. SPLIT DOUBLE-GABLE ROOF (ATAP PELANA GANDA FOTO 3)
  // ---------------------------------------------------------------------------
  // LEFT GABLE (Over Bedroom): x = -3.0 to 0.0, center = -1.5m
  const gableLeftW = 3.0;
  const gableLeftRise = 1.25;
  const gableLeftBaseY = h - 0.2; // 5.8m
  const gableLeftZ = facadeZ;

  // Solid left triangular gable pediment
  const gLeft = new T.BufferGeometry();
  gLeft.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        leftBayX - gableLeftW / 2, gableLeftBaseY, gableLeftZ,
        leftBayX + gableLeftW / 2, gableLeftBaseY, gableLeftZ,
        leftBayX, gableLeftBaseY + gableLeftRise, gableLeftZ,
      ],
      3,
    ),
  );
  gLeft.setIndex([0, 2, 1]);
  gLeft.computeVertexNormals();
  gLeft.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  emit(gLeft, white, 0, 0, 0);

  // Red-brown lisplang rake fascia on left gable
  beam(redLisplang, [leftBayX - gableLeftW / 2, gableLeftBaseY, gableLeftZ - 0.04], [leftBayX, gableLeftBaseY + gableLeftRise, gableLeftZ - 0.04], 0.065);
  beam(redLisplang, [leftBayX, gableLeftBaseY + gableLeftRise, gableLeftZ - 0.04], [leftBayX + gableLeftW / 2, gableLeftBaseY, gableLeftZ - 0.04], 0.065);

  // 3 Timber corbel brackets under left gable eave (Foto 3)
  for (let i = 0; i < 3; i++) {
    const cx = leftBayX - 0.8 + i * 0.8;
    box(redLisplang, cx, gableLeftBaseY - 0.08, gableLeftZ - 0.06, 0.06, 0.12, 0.25);
  }

  // Square louvered attic vent window in left gable center (Foto 3)
  const ventY = gableLeftBaseY + 0.48;
  box(teakWood, leftBayX, ventY, gableLeftZ - 0.035, 0.52, 0.60, 0.06);
  box(dark, leftBayX, ventY, gableLeftZ - 0.045, 0.42, 0.50, 0.03);
  for (let vy = ventY - 0.18; vy <= ventY + 0.18; vy += 0.09) {
    box(teakWood, leftBayX, vy, gableLeftZ - 0.055, 0.40, 0.025, 0.03);
  }

  // Terracotta barrel tile roof over left bay
  buildBarrelTileRoof(ctx, leftBayX, gableLeftW, depth, gableLeftBaseY, gableLeftRise, gableLeftZ, terracottaTile, redLisplang, white);

  // RIGHT GABLE (Over Open Balcony): x = 0.0 to +3.0, center = +1.5m
  const gableRightW = 3.0;
  const gableRightRise = 1.35;
  const gableRightBaseY = h - 0.1; // 5.9m (slightly higher apex matching Foto 3)
  const gableRightZ = facadeZ;

  // Solid right triangular gable pediment
  const gRight = new T.BufferGeometry();
  gRight.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        balcX - gableRightW / 2, gableRightBaseY, gableRightZ,
        balcX + gableRightW / 2, gableRightBaseY, gableRightZ,
        balcX, gableRightBaseY + gableRightRise, gableRightZ,
      ],
      3,
    ),
  );
  gRight.setIndex([0, 2, 1]);
  gRight.computeVertexNormals();
  gRight.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  emit(gRight, white, 0, 0, 0);

  // Red-brown lisplang rake fascia on right gable
  beam(redLisplang, [balcX - gableRightW / 2, gableRightBaseY, gableRightZ - 0.04], [balcX, gableRightBaseY + gableRightRise, gableRightZ - 0.04], 0.065);
  beam(redLisplang, [balcX, gableRightBaseY + gableRightRise, gableRightZ - 0.04], [balcX + gableRightW / 2, gableRightBaseY, gableRightZ - 0.04], 0.065);

  // Circular Medallion Rosette Emblem in right gable apex (Foto 3)
  const medalY = gableRightBaseY + 0.58;
  emit(new T.CylinderGeometry(0.22, 0.22, 0.035, 20), redLisplang, balcX, medalY, gableRightZ - 0.03, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.23, 0.02, 5, 24), redLisplang, balcX, medalY, gableRightZ - 0.04);
  box(cream, balcX, medalY, gableRightZ - 0.045, 0.28, 0.28, 0.02);

  // Terracotta barrel tile roof over right bay (sheltering the open balcony)
  buildBarrelTileRoof(ctx, balcX, gableRightW, depth, gableRightBaseY, gableRightRise, gableRightZ, terracottaTile, redLisplang, white);

  // ---------------------------------------------------------------------------
  // 6. FRONT FENCE: WOODPLANK SLIDING GATE, 3 TOWELS & WICKET GATE (FOTO 3)
  // ---------------------------------------------------------------------------
  const gateLeft = -halfW + 0.15; // -2.85m
  const gateRight = 1.35; // sliding gate width ~4.2m
  const fenceEnd = halfW - 0.15; // +2.85m
  const gateH = 1.55;
  const gateW = gateRight - gateLeft;
  const gateMidX = (gateLeft + gateRight) / 2;

  // White concrete gate pillars with vertical slot reveals (Foto 3)
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
    box(white, x, gateH / 2, 0.025, 0.022, gateH, 0.03);
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
    box(towelMat, c.x, gateH - c.h / 2 + 0.02, 0.01, c.w, c.h, 0.075, 0.08);
  }

  // Right Side: Pedestrian Wicket Gate (pintu pagar kecil Foto 3)
  const wicketW = fenceEnd - (gateRight + 0.24);
  const wicketMidX = (gateRight + 0.24 + fenceEnd) / 2;
  box(white, wicketMidX, gateH / 2, 0.05, wicketW, gateH - 0.1, 0.04);
  for (let wx = gateRight + 0.35; wx < fenceEnd - 0.1; wx += 0.16) {
    box(woodPlank, wx, gateH * 0.45, 0.065, 0.13, gateH * 0.65, 0.025);
  }

  // Lush tropical guava tree (pohon jambu) growing in the right corner over fence (Foto 3)
  // Main woody trunk & major branches
  const barkMat = new T.MeshStandardMaterial({ color: '#563d2d', roughness: 0.85 });
  beam(barkMat, [halfW - 0.35, 0.05, 0.7], [halfW - 0.25, 1.4, 0.45], 0.07);
  beam(barkMat, [halfW - 0.25, 1.4, 0.45], [halfW - 0.55, 2.2, 0.15], 0.05);
  beam(barkMat, [halfW - 0.25, 1.4, 0.45], [halfW - 0.15, 2.6, 0.35], 0.05);
  beam(barkMat, [halfW - 0.55, 2.2, 0.15], [halfW - 0.95, 2.8, -0.1], 0.038);
  beam(barkMat, [halfW - 0.15, 2.6, 0.35], [halfW - 0.35, 3.4, 0.2], 0.035);

  // Spreading guava foliage clumps reaching over the fence and up towards the balcony (Foto 3)
  buildPlant(ctx, halfW - 0.3, 0.6, 1.8, true);
  buildPlant(ctx, halfW - 0.6, 0.2, 2.3, true);
  buildPlant(ctx, halfW - 0.9, -0.05, 2.7, true);
  buildPlant(ctx, halfW - 0.4, 0.35, 3.3, true);
  buildPlant(ctx, halfW - 0.1, 0.8, 2.8, true);
}
