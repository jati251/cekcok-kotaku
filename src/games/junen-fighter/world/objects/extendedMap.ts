import * as T from 'three';
import type { WorldContext } from '../types';
import { LANE, FRONTAGE } from '../../neighborhood';
import { buildPlant } from './vegetation';
import { buildCar } from './vehicles';

/**
 * Builds the wide ground foundation plane, extended asphalt road,
 * roadside gutters, low-poly backdrop houses, and distant perimeter boundary.
 */
export function buildExtendedBackdrop(ctx: WorldContext) {
  const { box, materials: m } = ctx;

  // 1. Massive ground foundation plane (tanah / alas lingkungan)
  // Ensures no floating edges or bottom void under houses from any camera angle.
  box(m.concrete, 0, -0.22, 50, 160, 0.08, 220);

  // 2. Forward road extension: z = 65 to z = 122
  box(m.road, 0, -0.12, 93.5, LANE.halfWidth * 2, 0.2, 57);

  // 3. Backward road extension: z = -3 to z = -25
  box(m.road, 0, -0.12, -14, LANE.halfWidth * 2, 0.2, 22);

  // 4. Extended curbs and drainage gutters
  for (const side of [-1, 1]) {
    // Forward curbs (z = 65 .. 120)
    for (let z = 65; z < 120; z += 0.5) {
      box(m.dark, side * (LANE.halfWidth + 0.16), -0.15, z + 0.25, 0.3, 0.1, 0.5);
      box(m.concrete, side * (LANE.halfWidth - 0.02), -0.04, z + 0.25, 0.1, 0.12, 0.49);
      box(m.concrete, side * (LANE.halfWidth + 0.35), -0.01, z + 0.25, 0.14, 0.14, 0.49);
    }
    // Backward curbs (z = -24 .. -3)
    for (let z = -24; z < -3; z += 0.5) {
      box(m.dark, side * (LANE.halfWidth + 0.16), -0.15, z + 0.25, 0.3, 0.1, 0.5);
      box(m.concrete, side * (LANE.halfWidth - 0.02), -0.04, z + 0.25, 0.1, 0.12, 0.49);
      box(m.concrete, side * (LANE.halfWidth + 0.35), -0.01, z + 0.25, 0.14, 0.14, 0.49);
    }
  }

  // 5. Low-poly backdrop houses along the forward extension (z = 66 .. 118)
  buildForwardBackdropHouses(ctx);

  // 6. Low-poly backdrop houses along the backward extension (z = -4 .. -24)
  buildBackwardBackdropHouses(ctx);

  // 7. Far-end street termination: Perimeter wall & tropical trees at z = 121
  box(m.wallDefault, 0, 1.8, 121, 30, 3.8, 0.4);
  box(m.tile, 0, 3.8, 121, 30.5, 0.25, 0.8);

  // Far-end trees behind the wall
  for (let i = -14; i <= 14; i += 3.5) {
    const treeMat = m.leafMats[Math.abs(Math.floor(i * 13)) % m.leafMats.length];
    const treeH = 4.8 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 1.8;
    box(treeMat, i, treeH, 123.5, 4.2, 4.5, 3.8);
    // Tree trunk
    box(m.wood, i, treeH - 2.5, 123.5, 0.35, 4.0, 0.35);
  }

  // 8. Backward street termination wall & trees at z = -24.5
  box(m.wallDefault, 0, 1.8, -24.5, 28, 3.6, 0.4);
  box(m.tile, 0, 3.7, -24.5, 28.5, 0.25, 0.8);
  for (let i = -12; i <= 12; i += 4.0) {
    const treeMat = m.leafMats[Math.abs(Math.floor(i * 7)) % m.leafMats.length];
    box(treeMat, i, 4.5, -26.5, 4.0, 4.2, 3.5);
    box(m.wood, i, 2.2, -26.5, 0.32, 3.8, 0.32);
  }
}

/**
 * Builds low-poly, lightweight residential backdrop buildings along forward lane.
 */
function buildForwardBackdropHouses(ctx: WorldContext) {
  const { box, materials: m } = ctx;

  // Left side houses (side = -1)
  const leftHouses = [
    { z: 70, w: 8.5, h: 4.2, d: 7, mat: m.cream, roofMat: m.terracottaTile },
    { z: 80, w: 9.5, h: 5.6, d: 8, mat: m.wallGray, roofMat: m.roofGrey },
    { z: 91, w: 8.0, h: 3.8, d: 7, mat: m.pale, roofMat: m.tile },
    { z: 101, w: 9.0, h: 4.5, d: 7, mat: m.brickWeathered, roofMat: m.terracottaTile },
    { z: 112, w: 8.5, h: 4.0, d: 7, mat: m.wallDefault, roofMat: m.tile },
  ];

  for (const h of leftHouses) {
    const posX = -FRONTAGE - 2.8;
    // House body
    box(h.mat, posX - h.d / 2 + 1, h.h / 2, h.z, h.d, h.h, h.w);
    // Roof prism
    box(h.roofMat, posX - h.d / 2 + 1, h.h + 0.65, h.z, h.d + 0.6, 1.3, h.w + 0.6);
    // Boundary curb wall
    box(m.concrete, -FRONTAGE - 0.2, 0.75, h.z, 0.18, 1.5, h.w - 0.2);
    // Window accents
    box(m.glass, -FRONTAGE - 0.1, h.h * 0.55, h.z, 0.05, 1.1, 1.6);
    box(m.dark, -FRONTAGE - 0.08, h.h * 0.55, h.z, 0.06, 1.15, 1.65);
  }

  // Right side houses (side = 1)
  const rightHouses = [
    { z: 68, w: 8.5, h: 4.0, d: 7, mat: m.teal, roofMat: m.tile },
    { z: 78, w: 8.0, h: 3.7, d: 7, mat: m.salmon, roofMat: m.terracottaTile },
    { z: 88, w: 9.5, h: 5.4, d: 8, mat: m.white, roofMat: m.roofGrey },
    { z: 100, w: 8.5, h: 4.2, d: 7, mat: m.cream, roofMat: m.tile },
    { z: 111, w: 9.0, h: 4.0, d: 7, mat: m.wallDefault, roofMat: m.terracottaTile },
  ];

  for (const h of rightHouses) {
    const posX = FRONTAGE + 2.8;
    // House body
    box(h.mat, posX + h.d / 2 - 1, h.h / 2, h.z, h.d, h.h, h.w);
    // Roof prism
    box(h.roofMat, posX + h.d / 2 - 1, h.h + 0.65, h.z, h.d + 0.6, 1.3, h.w + 0.6);
    // Boundary curb wall
    box(m.concrete, FRONTAGE + 0.2, 0.75, h.z, 0.18, 1.5, h.w - 0.2);
    // Window accents
    box(m.glass, FRONTAGE + 0.1, h.h * 0.55, h.z, 0.05, 1.1, 1.6);
    box(m.dark, FRONTAGE + 0.08, h.h * 0.55, h.z, 0.06, 1.15, 1.65);
  }

  // Intermediate courtyard trees in gaps
  for (const [tz, side] of [
    [75, -1],
    [85.5, 1],
    [96, -1],
    [106, 1],
  ] as const) {
    const mat = m.leafMats[Math.abs(Math.floor(tz * 3)) % m.leafMats.length];
    box(mat, side * (FRONTAGE + 2.2), 3.5, tz, 2.5, 3.2, 2.5);
    box(m.wood, side * (FRONTAGE + 2.2), 1.3, tz, 0.2, 2.6, 0.2);
  }
}

/**
 * Builds low-poly backdrop houses behind street entrance (z = -4 .. -24).
 */
function buildBackwardBackdropHouses(ctx: WorldContext) {
  const { box, materials: m } = ctx;

  for (const side of [-1, 1]) {
    const mat = side === -1 ? m.cream : m.wallGray;
    const roof = side === -1 ? m.terracottaTile : m.tile;
    const posX = side * (FRONTAGE + 3.2);

    box(mat, posX, 2.2, -10, 6, 4.4, 10);
    box(roof, posX, 4.8, -10, 6.6, 1.2, 10.6);
    box(m.concrete, side * (FRONTAGE + 0.2), 0.75, -10, 0.18, 1.5, 9.8);

    box(m.white, posX, 2.0, -18, 6, 4.0, 7);
    box(m.roofGrey, posX, 4.5, -18, 6.6, 1.2, 7.6);
    box(m.concrete, side * (FRONTAGE + 0.2), 0.75, -18, 0.18, 1.5, 6.8);
  }
}

/**
 * Builds authentic Indonesian residential street boom barrier (Portal Gang/Komplek).
 * @param z Road position along the street.
 * @param isClosed Whether the barrier boom is down (blocking the road).
 * @param signText Warning or curfew text displayed on the boom.
 */
export function buildRoadPortal(
  ctx: WorldContext,
  z: number,
  isClosed = true,
  signText = 'PORTAL DITUTUP\n22.00 - 05.00',
) {
  const { box, cyl, emit, materials: m } = ctx;
  const postLeftX = -LANE.halfWidth + 0.12;
  const postRightX = LANE.halfWidth - 0.12;
  const postHeight = 2.1;

  // 1. Concrete umpak footings
  box(m.concrete, postLeftX, 0.15, z, 0.38, 0.32, 0.38);
  box(m.concrete, postRightX, 0.15, z, 0.38, 0.32, 0.38);

  // 2. Vertical steel tubular posts
  cyl(m.dark, postLeftX, 1.15, z, 0.07, postHeight);
  cyl(m.dark, postRightX, 1.15, z, 0.07, postHeight);

  // Black and yellow reflective warning stripes on the vertical posts
  for (let y = 0.45; y <= 1.85; y += 0.32) {
    box(m.gold, postLeftX, y, z, 0.155, 0.12, 0.155);
    box(m.gold, postRightX, y, z, 0.155, 0.12, 0.155);
  }

  // 3. Left hinge mechanism and concrete counterweight box
  box(m.dark, postLeftX, 1.08, z, 0.24, 0.26, 0.24);
  // Counterweight extension lever
  box(m.dark, postLeftX - 0.28, 1.08, z, 0.45, 0.18, 0.18);
  // Heavy counterweight concrete block
  box(m.concrete, postLeftX - 0.58, 1.08, z, 0.42, 0.36, 0.32);

  // 4. Horizontal boom barrier arm
  const boomY = 1.05;
  const boomSpan = postRightX - postLeftX + 0.2;
  const boomCenterX = (postLeftX + postRightX) / 2;

  if (isClosed) {
    // Horizontal closed boom arm across the street
    cyl(m.white, boomCenterX, boomY, z, 0.046, boomSpan, 0, Math.PI / 2);

    // Alternating reflective red sleeves on the boom arm
    for (let sx = postLeftX + 0.35; sx <= postRightX - 0.35; sx += 0.5) {
      box(m.cloth[0], sx, boomY, z, 0.24, 0.105, 0.105);
    }

    // Heavy chain and padlock on the receiver post (right side)
    emit(new T.TorusGeometry(0.08, 0.02, 6, 16), m.dark, postRightX, boomY, z);
    box(m.gold, postRightX, boomY - 0.08, z, 0.06, 0.08, 0.04);

    // Center warning restriction sign
    if (signText) {
      // Sign backing board
      box(m.dark, boomCenterX, boomY, z, 0.94, 0.54, 0.02);
      // Support hanger brackets
      cyl(m.dark, boomCenterX - 0.3, boomY + 0.12, z, 0.008, 0.18);
      cyl(m.dark, boomCenterX + 0.3, boomY + 0.12, z, 0.008, 0.18);
      // Front and back signage
      ctx.sign(signText, boomCenterX, boomY, z + 0.02, 0.9, 0.5, '#c62828', '#ffffff', 0);
      ctx.sign(signText, boomCenterX, boomY, z - 0.02, 0.9, 0.5, '#c62828', '#ffffff', Math.PI);
    }
  } else {
    // Raised boom (angled up 70 degrees)
    const raisedAngle = (70 * Math.PI) / 180;
    cyl(m.white, postLeftX + 0.7, boomY + 1.2, z, 0.046, boomSpan, 0, raisedAngle);
  }

  // 5. Flanking physical barricades on sidewalks (prevent squeezing through curbs)
  // Left side curb barrier
  box(m.concrete, postLeftX - 0.45, 0.25, z, 0.4, 0.5, 0.6);
  buildGentong(ctx, postLeftX - 0.45, z + 0.45, 'drum-blue');

  // Right side curb barrier
  box(m.concrete, postRightX + 0.45, 0.25, z, 0.4, 0.5, 0.6);
  buildGentong(ctx, postRightX + 0.45, z + 0.45, 'drum-metal');
}

/**
 * Builds Indonesian gentong, water drums, planters, and garbage barrels.
 */
export function buildGentong(
  ctx: WorldContext,
  x: number,
  z: number,
  type: 'drum-blue' | 'gentong-clay' | 'buis-beton' | 'drum-metal',
  y = 0,
) {
  const { cyl, box, materials: m } = ctx;

  switch (type) {
    case 'drum-blue': {
      // Iconic 200L blue plastic water/trash barrel (Drum Plastik Biru)
      const r = 0.28;
      const h = 0.88;
      // Blue cylindrical body
      cyl(m.aquaBlue, x, y + h / 2, z, r, h);
      // Top black screw lid
      cyl(m.dark, x, y + h + 0.015, z, r + 0.008, 0.035);
      // Molded bung caps on top
      cyl(m.white, x - 0.1, y + h + 0.038, z, 0.032, 0.02);
      cyl(m.white, x + 0.1, y + h + 0.038, z, 0.032, 0.02);
      // Reinforcement rib rings
      cyl(m.dark, x, y + h * 0.35, z, r + 0.006, 0.028);
      cyl(m.dark, x, y + h * 0.65, z, r + 0.006, 0.028);
      // Stencil label band
      box(m.white, x, y + h * 0.5, z + r + 0.002, 0.25, 0.08, 0.004);
      break;
    }

    case 'gentong-clay': {
      // Traditional earthenware water jar (Gentong Tanah Liat / Gerabah)
      // Base
      cyl(m.clay, x, y + 0.18, z, 0.23, 0.36);
      // Bulbous middle
      cyl(m.clay, x, y + 0.42, z, 0.31, 0.24);
      // Neck and rim
      cyl(m.clay, x, y + 0.60, z, 0.22, 0.14);
      cyl(m.clay, x, y + 0.68, z, 0.25, 0.04);
      // Wooden round lid
      cyl(m.wood, x, y + 0.71, z, 0.26, 0.03);
      box(m.teakWood, x, y + 0.74, z, 0.05, 0.04, 0.04);
      // Gayung (water dipper handle resting on rim)
      box(m.dark, x + 0.15, y + 0.72, z + 0.08, 0.02, 0.02, 0.25, 0.4, 0.2);
      break;
    }

    case 'buis-beton': {
      // Precast concrete well ring planter (Buis Beton Pot)
      const r = 0.34;
      const h = 0.62;
      cyl(m.concrete, x, y + h / 2, z, r, h);
      // Dark soil inside
      cyl(m.dark, x, y + h - 0.04, z, r - 0.04, 0.08);
      // Potted ornamental foliage
      buildPlant(ctx, x, z, 0.35, false);
      break;
    }

    case 'drum-metal': {
      // Heavy metal drum / oil barrel (Drum Besi / Oli)
      const r = 0.285;
      const h = 0.90;
      cyl(m.rust, x, y + h / 2, z, r, h);
      cyl(m.dark, x, y + h + 0.01, z, r + 0.008, 0.025);
      // Ribbed rolling hoops
      cyl(m.dark, x, y + h * 0.28, z, r + 0.007, 0.025);
      cyl(m.dark, x, y + h * 0.52, z, r + 0.007, 0.025);
      cyl(m.dark, x, y + h * 0.76, z, r + 0.007, 0.025);
      break;
    }
  }
}

/**
 * Places props (Portal, gentong clusters, parked cars, traffic barricades).
 */
export function buildExtendedProps(ctx: WorldContext) {
  const { box, cyl, materials: m } = ctx;

  // 1. MAIN ROAD PORTAL AT END OF LANE (z = 64.0)
  // Physically stops players from passing through into the extended street.
  buildRoadPortal(ctx, 64.0, true, 'PORTAL DITUTUP\n22.00 - 05.00');

  // Concrete traffic barriers immediately behind the portal boom (double barricade)
  for (const bx of [-1.1, 0, 1.1]) {
    box(m.concrete, bx, 0.4, 64.8, 0.85, 0.8, 0.35);
    box(m.gold, bx, 0.4, 64.8, 0.45, 0.15, 0.36); // Yellow reflector stripe
  }

  // 2. ENTRANCE GATEWAY / PORTAL AT STREET ENTRANCE (z = 0.8)
  // Open neighborhood entrance portal frame
  const entLeft = -LANE.halfWidth + 0.12;
  const entRight = LANE.halfWidth - 0.12;
  cyl(m.dark, entLeft, 1.6, 0.8, 0.08, 3.2);
  cyl(m.dark, entRight, 1.6, 0.8, 0.08, 3.2);
  // Overhead arch beam
  box(m.dark, 0, 3.25, 0.8, LANE.halfWidth * 2 + 0.4, 0.18, 0.18);
  // Neighborhood welcome signboard
  ctx.sign('JL. H. JUNEN\nRT 03 / RW 02', 0, 3.5, 0.8, 1.8, 0.55, '#1b5e20', '#ffffff', 0);
  ctx.sign('JL. H. JUNEN\nRT 03 / RW 02', 0, 3.5, 0.8, 1.8, 0.55, '#1b5e20', '#ffffff', Math.PI);

  // 3. PARKED CARS ALONG THE EXTENDED STREET ("mobil")
  // Car 1: Parked silver MPV just past the portal (z = 68.5)
  buildCar(ctx, 0.85, 68.5, false, m.silverCover);

  // Car 2: Covered car parked in extended lane (z = 84.0)
  buildCar(ctx, -1.05, 84.0, true);

  // Car 3: White sedan parked in the far background (z = 100.0)
  buildCar(ctx, 0.8, 100.0, false, m.white);

  // Car 4: Dark car parked outside at the backward entrance road (z = -9.5)
  buildCar(ctx, 0.95, -9.5, false, m.dark);

  // 4. GENTONG CLUSTERS (Barrels, water drums, trash cans)
  // Cluster around the portal barricade
  buildGentong(ctx, -1.6, 64.9, 'drum-blue');
  buildGentong(ctx, 1.6, 64.9, 'buis-beton');
  buildGentong(ctx, -0.6, 65.4, 'drum-metal');
  buildGentong(ctx, 0.6, 65.4, 'drum-blue');

  // Residential gentong along the neighborhood lane
  buildGentong(ctx, -LANE.halfWidth - 0.28, 2.8, 'drum-blue'); // White scroll entrance
  buildGentong(ctx, LANE.halfWidth + 0.26, 9.5, 'gentong-clay'); // Green tank junction
  buildGentong(ctx, -LANE.halfWidth - 0.28, 12.0, 'drum-blue'); // Cream carport
  buildGentong(ctx, LANE.halfWidth + 0.25, 19.8, 'gentong-clay'); // Turquoise house
  buildGentong(ctx, -LANE.halfWidth - 0.26, 26.5, 'buis-beton'); // Blue low house
  buildGentong(ctx, LANE.halfWidth + 0.28, 35.0, 'drum-blue'); // Yellow black house
  buildGentong(ctx, -LANE.halfWidth - 0.25, 43.5, 'drum-blue'); // White car house
  buildGentong(ctx, LANE.halfWidth + 0.26, 52.8, 'gentong-clay'); // Pink house
  buildGentong(ctx, -LANE.halfWidth - 0.28, 56.5, 'buis-beton'); // Green car house
}
