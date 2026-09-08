import * as T from 'three';
import type { WorldContext } from '../types';
import { getRoadPoint } from '../../neighborhood';
import { buildPlant } from './vegetation';
import { buildCar } from './vehicles';
import { buildRoadRibbon } from './infrastructure';
import { buildWestJunction } from './landmarks/westJunction';
import { buildEastJunction } from './landmarks/eastJunction';
import { buildKampungRooftops } from './landmarks/kampungRooftops';

const upAxis = new T.Vector3(0, 1, 0);

/**
 * Builds the wide ground foundation plane, extended asphalt road,
 * roadside gutters, low-poly backdrop houses, landmarks, and dense kampung rooftops.
 */
export function buildExtendedBackdrop(ctx: WorldContext) {
  const { box, materials: m } = ctx;

  // 1. Massive ground foundation plane (covering full 200m x 260m neighborhood area)
  box(m.concrete, 0, -0.22, 40, 200, 0.08, 260);

  // 2. Forward road extension (z = 64 to 150) along spline
  buildRoadRibbon(ctx, 64, 150, 1.0);

  // 3. Backward road extension (z = -75 to -3) along spline
  buildRoadRibbon(ctx, -75, -3, 1.0);

  // 4. Extended curbs and drainage gutters along the curved road
  for (const side of [-1, 1]) {
    // Forward curbs (z = 64 .. 142)
    for (let z = 64; z < 142; z += 0.5) {
      // Skip gap at Gg. Kresek VI branch alley (North side: side === 1, z in [68.5, 73.5])
      if (side === 1 && z >= 68.5 && z <= 73.5) continue;
      // Skip gap at Jl. Lestari junction entrance (z >= 134)
      if (z >= 134) continue;

      const midZ = z + 0.25;
      const pt = getRoadPoint(midZ);
      const hw = pt.halfWidth;
      const ang = pt.angle;
      const cos = pt.normalX;
      const sin = -pt.normalZ;

      const distDark = side * (hw + 0.16);
      box(m.dark, pt.x + distDark * cos, -0.15, midZ + distDark * sin, 0.3, 0.1, 0.52, 0, ang, 0);
      const distGutter = side * (hw - 0.02);
      box(m.concrete, pt.x + distGutter * cos, -0.04, midZ + distGutter * sin, 0.1, 0.12, 0.51, 0, ang, 0);
      const distCurb = side * (hw + 0.35);
      box(m.concrete, pt.x + distCurb * cos, -0.01, midZ + distCurb * sin, 0.14, 0.14, 0.51, 0, ang, 0);
    }
    // Backward curbs (z = -65 .. -3)
    for (let z = -65; z < -3; z += 0.5) {
      // Skip gap at Ksa Sport Badminton Hall parking apron (side === 1, z in [-30, -22])
      if (side === 1 && z >= -30 && z <= -22) continue;
      // Skip gap at Jl. Bambu Indah crossing (z <= -56)
      if (z <= -56) continue;

      const midZ = z + 0.25;
      const pt = getRoadPoint(midZ);
      const hw = pt.halfWidth;
      const ang = pt.angle;
      const cos = pt.normalX;
      const sin = -pt.normalZ;

      const distDark = side * (hw + 0.16);
      box(m.dark, pt.x + distDark * cos, -0.15, midZ + distDark * sin, 0.3, 0.1, 0.52, 0, ang, 0);
      const distGutter = side * (hw - 0.02);
      box(m.concrete, pt.x + distGutter * cos, -0.04, midZ + distGutter * sin, 0.1, 0.12, 0.51, 0, ang, 0);
      const distCurb = side * (hw + 0.35);
      box(m.concrete, pt.x + distCurb * cos, -0.01, midZ + distCurb * sin, 0.14, 0.14, 0.51, 0, ang, 0);
    }
  }

  // 5. West Junction Area (Gg. Kresek VI, House 17-19, Jl. Lestari, Warkop H. Junen)
  buildWestJunction(ctx);

  // 6. East Junction Area (House 16 frontage, Ksa Sport Badminton Hall, Kumpul Kopi, GM Motor)
  buildEastJunction(ctx);

  // 7. Dense Surrounding Urban Kampung Rooftops ("Laut Genteng" Satellite View)
  buildKampungRooftops(ctx);

  // 8. Side junction alley extension (Jl. H. Junen II / Water Tank junction branch)
  buildJunctionExtension(ctx);

  // 9. Perimeter boundary wall & trees at far West / Jl. Lestari end (z = 145)
  const endPt = getRoadPoint(145);
  box(m.wallDefault, endPt.x, 1.8, 146, 42, 3.8, 0.4, 0, endPt.angle, 0);
  box(m.tile, endPt.x, 3.8, 146, 42.5, 0.25, 0.8, 0, endPt.angle, 0);
  for (let i = -18; i <= 18; i += 3.5) {
    const treeMat = m.leafMats[Math.abs(Math.floor(i * 13)) % m.leafMats.length];
    const treeH = 4.8 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 1.8;
    const tx = endPt.x + i * endPt.normalX;
    const tz = 148.5 + i * endPt.normalZ;
    box(treeMat, tx, treeH, tz, 4.2, 4.5, 3.8);
    box(m.wood, tx, treeH - 2.5, tz, 0.35, 4.0, 0.35);
  }

  // 10. Perimeter boundary wall & trees at far East / Jl. Bambu Indah end (z = -68)
  const backPt = getRoadPoint(-68);
  box(m.wallDefault, backPt.x - 2, 1.8, -69.5, 42, 3.6, 0.4, 0, backPt.angle, 0);
  box(m.tile, backPt.x - 2, 3.7, -69.5, 42.5, 0.25, 0.8, 0, backPt.angle, 0);
  for (let i = -18; i <= 18; i += 4.0) {
    const treeMat = m.leafMats[Math.abs(Math.floor(i * 7)) % m.leafMats.length];
    const tx = backPt.x - 2 + i * backPt.normalX;
    const tz = -71.5 + i * backPt.normalZ;
    box(treeMat, tx, 4.5, tz, 4.0, 4.2, 3.5);
    box(m.wood, tx, 2.2, tz, 0.32, 3.8, 0.32);
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
  const pt = getRoadPoint(z);

  // Position and orient the portal locally perpendicular to the curved road
  ctx.transform.compose(
    new T.Vector3(pt.x, 0, z),
    new T.Quaternion().setFromAxisAngle(upAxis, pt.angle),
    new T.Vector3(1, 1, 1),
  );

  const postLeftX = -pt.halfWidth + 0.12;
  const postRightX = pt.halfWidth - 0.12;
  const postHeight = 2.1;

  // 1. Concrete umpak footings
  box(m.concrete, postLeftX, 0.15, 0, 0.38, 0.32, 0.38);
  box(m.concrete, postRightX, 0.15, 0, 0.38, 0.32, 0.38);

  // 2. Vertical steel tubular posts
  cyl(m.dark, postLeftX, 1.15, 0, 0.07, postHeight);
  cyl(m.dark, postRightX, 1.15, 0, 0.07, postHeight);

  // Black and yellow reflective warning stripes on the vertical posts
  for (let y = 0.45; y <= 1.85; y += 0.32) {
    box(m.gold, postLeftX, y, 0, 0.155, 0.12, 0.155);
    box(m.gold, postRightX, y, 0, 0.155, 0.12, 0.155);
  }

  // 3. Left hinge mechanism and concrete counterweight box
  box(m.dark, postLeftX, 1.08, 0, 0.24, 0.26, 0.24);
  box(m.dark, postLeftX - 0.28, 1.08, 0, 0.45, 0.18, 0.18);
  box(m.concrete, postLeftX - 0.58, 1.08, 0, 0.42, 0.36, 0.32);

  // 4. Horizontal boom barrier arm
  const boomY = 1.05;
  const boomSpan = postRightX - postLeftX + 0.2;
  const boomCenterX = (postLeftX + postRightX) / 2;

  if (isClosed) {
    cyl(m.white, boomCenterX, boomY, 0, 0.046, boomSpan, 0, Math.PI / 2);

    for (let sx = postLeftX + 0.35; sx <= postRightX - 0.35; sx += 0.5) {
      box(m.cloth[0], sx, boomY, 0, 0.24, 0.105, 0.105);
    }

    emit(new T.TorusGeometry(0.08, 0.02, 6, 16), m.dark, postRightX, boomY, 0);
    box(m.gold, postRightX, boomY - 0.08, 0, 0.06, 0.08, 0.04);

    if (signText) {
      box(m.dark, boomCenterX, boomY, 0, 0.94, 0.54, 0.02);
      cyl(m.dark, boomCenterX - 0.3, boomY + 0.12, 0, 0.008, 0.18);
      cyl(m.dark, boomCenterX + 0.3, boomY + 0.12, 0, 0.008, 0.18);
      ctx.sign(signText, boomCenterX, boomY, 0.02, 0.9, 0.5, '#c62828', '#ffffff', 0);
      ctx.sign(signText, boomCenterX, boomY, -0.02, 0.9, 0.5, '#c62828', '#ffffff', Math.PI);
    }
  } else {
    const raisedAngle = (70 * Math.PI) / 180;
    cyl(m.white, postLeftX + 0.7, boomY + 1.2, 0, 0.046, boomSpan, 0, raisedAngle);
  }

  // 5. Flanking physical barricades on sidewalks
  box(m.concrete, postLeftX - 0.45, 0.25, 0, 0.4, 0.5, 0.6);
  buildGentong(ctx, postLeftX - 0.45, 0.45, 'drum-blue');

  box(m.concrete, postRightX + 0.45, 0.25, 0, 0.4, 0.5, 0.6);
  buildGentong(ctx, postRightX + 0.45, 0.45, 'drum-metal');

  ctx.transform.identity();
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
      const r = 0.28;
      const h = 0.88;
      cyl(m.aquaBlue, x, y + h / 2, z, r, h);
      cyl(m.dark, x, y + h + 0.015, z, r + 0.008, 0.035);
      cyl(m.white, x - 0.1, y + h + 0.038, z, 0.032, 0.02);
      cyl(m.white, x + 0.1, y + h + 0.038, z, 0.032, 0.02);
      cyl(m.dark, x, y + h * 0.35, z, r + 0.006, 0.028);
      cyl(m.dark, x, y + h * 0.65, z, r + 0.006, 0.028);
      box(m.white, x, y + h * 0.5, z + r + 0.002, 0.25, 0.08, 0.004);
      break;
    }

    case 'gentong-clay': {
      cyl(m.clay, x, y + 0.18, z, 0.23, 0.36);
      cyl(m.clay, x, y + 0.42, z, 0.31, 0.24);
      cyl(m.clay, x, y + 0.60, z, 0.22, 0.14);
      cyl(m.clay, x, y + 0.68, z, 0.25, 0.04);
      cyl(m.wood, x, y + 0.71, z, 0.26, 0.03);
      box(m.teakWood, x, y + 0.74, z, 0.05, 0.04, 0.04);
      box(m.dark, x + 0.15, y + 0.72, z + 0.08, 0.02, 0.02, 0.25, 0.4, 0.2);
      break;
    }

    case 'buis-beton': {
      const r = 0.34;
      const h = 0.62;
      cyl(m.concrete, x, y + h / 2, z, r, h);
      cyl(m.dark, x, y + h - 0.04, z, r - 0.04, 0.08);
      buildPlant(ctx, x, z, 0.35, false);
      break;
    }

    case 'drum-metal': {
      const r = 0.285;
      const h = 0.90;
      cyl(m.rust, x, y + h / 2, z, r, h);
      cyl(m.dark, x, y + h + 0.01, z, r + 0.008, 0.025);
      cyl(m.dark, x, y + h * 0.28, z, r + 0.007, 0.025);
      cyl(m.dark, x, y + h * 0.52, z, r + 0.007, 0.025);
      cyl(m.dark, x, y + h * 0.76, z, r + 0.007, 0.025);
      break;
    }
  }
}

/**
 * Places props (Entrance archway, gentong clusters, parked vehicles).
 */
export function buildExtendedProps(ctx: WorldContext) {
  const { box, cyl, materials: m } = ctx;

  // 1. ENTRANCE GATEWAY ARCH AT STREET ENTRANCE (z = 0.8)
  const entPt = getRoadPoint(0.8);
  ctx.transform.compose(
    new T.Vector3(entPt.x, 0, 0.8),
    new T.Quaternion().setFromAxisAngle(upAxis, entPt.angle),
    new T.Vector3(1, 1, 1),
  );
  const entLeft = -entPt.halfWidth + 0.12;
  const entRight = entPt.halfWidth - 0.12;
  cyl(m.dark, entLeft, 1.6, 0, 0.08, 3.2);
  cyl(m.dark, entRight, 1.6, 0, 0.08, 3.2);
  box(m.dark, 0, 3.25, 0, entPt.halfWidth * 2 + 0.4, 0.18, 0.18);
  ctx.sign('JL. H. JUNEN\nRT 03 / RW 02', 0, 3.5, 0, 1.8, 0.55, '#1b5e20', '#ffffff', 0);
  ctx.sign('JL. H. JUNEN\nRT 03 / RW 02', 0, 3.5, 0, 1.8, 0.55, '#1b5e20', '#ffffff', Math.PI);
  ctx.transform.identity();

  // 2. PARKED CARS IN DESIGNATED ROADSIDE BAYS (Not blocking the street)
  // Car 1: Silver MPV parked at Badminton Hall parking apron (z = -26.0, North / side: 1)
  const c1Pt = getRoadPoint(-26.0);
  const c1Dist = c1Pt.halfWidth + 2.2;
  ctx.transform.compose(
    new T.Vector3(c1Pt.x + c1Dist * c1Pt.normalX, 0, -26.0 + c1Dist * c1Pt.normalZ),
    new T.Quaternion().setFromAxisAngle(upAxis, c1Pt.angle + Math.PI / 2),
    new T.Vector3(1, 1, 1),
  );
  buildCar(ctx, 0, 0, false, m.silverCover);
  ctx.transform.identity();

  // Car 2: Covered car parked at House 18 carport driveway (z = 94.0, North / side: 1)
  const c2Pt = getRoadPoint(94.0);
  const c2Dist = c2Pt.halfWidth + 2.0;
  ctx.transform.compose(
    new T.Vector3(c2Pt.x + c2Dist * c2Pt.normalX, 0, 94.0 + c2Dist * c2Pt.normalZ),
    new T.Quaternion().setFromAxisAngle(upAxis, c2Pt.angle),
    new T.Vector3(1, 1, 1),
  );
  buildCar(ctx, 0, 0, true);
  ctx.transform.identity();

  // Car 3: White sedan parked along wide Jl. Lestari junction (z = 138.0)
  const c3Pt = getRoadPoint(138.0);
  const c3Dist = -(c3Pt.halfWidth + 2.2);
  ctx.transform.compose(
    new T.Vector3(c3Pt.x + c3Dist * c3Pt.normalX, 0, 138.0 + c3Dist * c3Pt.normalZ),
    new T.Quaternion().setFromAxisAngle(upAxis, c3Pt.angle),
    new T.Vector3(1, 1, 1),
  );
  buildCar(ctx, 0, 0, false, m.white);
  ctx.transform.identity();

  // Car 4: Dark car parked at House 16 driveway (z = -10.0, South / side: -1)
  const c4Pt = getRoadPoint(-10.0);
  const c4Dist = -(c4Pt.halfWidth + 1.8);
  ctx.transform.compose(
    new T.Vector3(c4Pt.x + c4Dist * c4Pt.normalX, 0, -10.0 + c4Dist * c4Pt.normalZ),
    new T.Quaternion().setFromAxisAngle(upAxis, c4Pt.angle),
    new T.Vector3(1, 1, 1),
  );
  buildCar(ctx, 0, 0, false, m.dark);
  ctx.transform.identity();

  // 3. RESIDENTIAL GENTONG (Barrels, water drums, trash cans)
  const gentongLocs: [number, number, 'drum-blue' | 'gentong-clay' | 'buis-beton' | 'drum-metal'][] = [
    [-1, 2.8, 'drum-blue'],
    [1, 9.5, 'gentong-clay'],
    [-1, 12.0, 'drum-blue'],
    [1, 19.8, 'gentong-clay'],
    [-1, 26.5, 'buis-beton'],
    [1, 35.0, 'drum-blue'],
    [-1, 43.5, 'drum-blue'],
    [1, 52.8, 'gentong-clay'],
    [-1, 56.5, 'buis-beton'],
    [1, 75.0, 'drum-blue'],
    [-1, 88.0, 'gentong-clay'],
    [1, 105.0, 'buis-beton'],
    [-1, -16.0, 'drum-blue'],
    [1, -38.0, 'drum-metal'],
  ];

  for (const [side, gz, type] of gentongLocs) {
    const pt = getRoadPoint(gz);
    const dist = side * (pt.halfWidth + 0.28);
    buildGentong(ctx, pt.x + dist * pt.normalX, gz + dist * pt.normalZ, type);
  }
}

/**
 * Builds the side junction alley extension (Jl. H. Junen II / Water Tank junction branch),
 * complete with extended asphalt road, curbs, boundary walls, backdrop houses,
 * road boom portal, parked car, and gentong clusters.
 */
export function buildJunctionExtension(ctx: WorldContext) {
  const { box, cyl, emit, materials: m } = ctx;

  // 1. Concrete ground foundation under junction alley
  box(m.concrete, 16.0, -0.22, 8.5, 24, 0.08, 20);

  // 2. Road asphalt continuation from x = 7.8 to x = 22.0, z = 7.0 to 10.0 (width 3.0)
  box(m.road, 14.9, -0.12, 8.5, 14.2, 0.2, 3.0);

  // 3. Drainage gutters and curbs along z = 7.0 (south) and z = 10.0 (north)
  for (let x = 2.4; x < 21.5; x += 0.5) {
    // South curb (z = 7.0)
    box(m.dark, x + 0.25, -0.15, 6.85, 0.5, 0.1, 0.3);
    box(m.concrete, x + 0.25, -0.04, 7.02, 0.49, 0.12, 0.1);
    // North curb (z = 10.0)
    box(m.dark, x + 0.25, -0.15, 10.15, 0.5, 0.1, 0.3);
    box(m.concrete, x + 0.25, -0.04, 9.98, 0.49, 0.12, 0.1);
  }

  // 4. Boundary walls and backdrop houses along the side alley
  // South wall (z = 6.85)
  box(m.wallDefault, 13.5, 1.6, 6.85, 11.0, 3.2, 0.24);
  box(m.terracottaTile, 13.5, 3.25, 6.85, 11.2, 0.2, 0.45);
  // Backdrop house south
  box(m.cream, 14.0, 2.2, 4.2, 8.0, 4.4, 5.0);
  box(m.tile, 14.0, 4.8, 4.2, 8.4, 1.2, 5.4);

  // North wall (z = 10.15)
  box(m.kamprot, 13.5, 1.45, 10.15, 11.0, 2.9, 0.24);
  box(m.tile, 13.5, 2.95, 10.15, 11.2, 0.2, 0.45);
  // Backdrop house north
  box(m.teal, 14.0, 2.1, 12.8, 8.0, 4.2, 5.0);
  box(m.roofGrey, 14.0, 4.6, 12.8, 8.4, 1.2, 5.4);

  // 5. Far-end alley termination wall at x = 22.0
  box(m.wallGray, 22.0, 1.8, 8.5, 0.35, 3.6, 5.2);
  box(m.tile, 22.0, 3.7, 8.5, 0.6, 0.25, 5.4);
  // Trees behind the end wall
  box(m.leafMats[0], 24.2, 4.8, 7.6, 3.6, 4.6, 3.6);
  box(m.wood, 24.2, 2.2, 7.6, 0.35, 4.0, 0.35);
  box(m.leafMats[1], 24.2, 5.2, 9.5, 3.8, 5.0, 3.8);
  box(m.wood, 24.2, 2.4, 9.5, 0.35, 4.2, 0.35);

  // 6. ROAD PORTAL ACROSS JUNCTION BRANCH (at x = 7.85)
  // Blocks the player from passing further down into the side alley.
  const portalX = 7.85;
  const postSZ = 7.15;
  const postNZ = 9.85;

  // Concrete footings
  box(m.concrete, portalX, 0.15, postSZ, 0.36, 0.32, 0.36);
  box(m.concrete, portalX, 0.15, postNZ, 0.36, 0.32, 0.36);

  // Vertical steel posts
  cyl(m.dark, portalX, 1.15, postSZ, 0.07, 2.1);
  cyl(m.dark, portalX, 1.15, postNZ, 0.07, 2.1);

  // Hazard bands on posts
  for (let y = 0.45; y <= 1.85; y += 0.32) {
    box(m.gold, portalX, y, postSZ, 0.155, 0.12, 0.155);
    box(m.gold, portalX, y, postNZ, 0.155, 0.12, 0.155);
  }

  // Boom barrier arm across the alley (along Z)
  cyl(m.white, portalX, 1.05, 8.5, 0.046, postNZ - postSZ + 0.15, Math.PI / 2, 0);
  for (let bz = postSZ + 0.35; bz <= postNZ - 0.35; bz += 0.48) {
    box(m.cloth[0], portalX, 1.05, bz, 0.105, 0.105, 0.24);
  }

  // Counterweight lever and box on south post
  box(m.dark, portalX, 1.08, postSZ - 0.28, 0.18, 0.18, 0.45);
  box(m.concrete, portalX, 1.08, postSZ - 0.58, 0.32, 0.36, 0.42);

  // Padlock and chain on north post
  emit(new T.TorusGeometry(0.08, 0.02, 6, 16), m.dark, portalX, 1.05, postNZ);
  box(m.gold, portalX, 0.97, postNZ, 0.04, 0.08, 0.06);

  // Center warning sign
  box(m.dark, portalX, 1.05, 8.5, 0.02, 0.54, 0.94);
  cyl(m.dark, portalX, 1.15, 8.2, 0.008, 0.18);
  cyl(m.dark, portalX, 1.15, 8.8, 0.008, 0.18);
  ctx.sign('PORTAL DITUTUP\nKHUSUS WARGA', portalX, 1.05, 8.5, 0.9, 0.5, '#c62828', '#ffffff', Math.PI / 2);
  ctx.sign('PORTAL DITUTUP\nKHUSUS WARGA', portalX, 1.05, 8.5, 0.9, 0.5, '#c62828', '#ffffff', -Math.PI / 2);

  // Flanking concrete curb barrier blocks
  box(m.concrete, portalX, 0.35, postSZ, 0.4, 0.7, 0.5);
  box(m.concrete, portalX, 0.35, postNZ, 0.4, 0.7, 0.5);

  // 7. PARKED CAR IN JUNCTION ALLEY (behind the portal, facing down the alley)
  const carPos = new T.Vector3(13.0, 0, 8.5);
  const carQuat = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2);
  ctx.transform.compose(carPos, carQuat, new T.Vector3(1, 1, 1));
  buildCar(ctx, 0, 0, false, m.white);
  ctx.transform.identity();

  // 8. GENTONG CLUSTERS AROUND JUNCTION
  // At the side portal barrier
  buildGentong(ctx, 7.5, postSZ + 0.3, 'drum-blue');
  buildGentong(ctx, 7.5, postNZ - 0.3, 'buis-beton');
  buildGentong(ctx, 8.4, postSZ + 0.3, 'drum-metal');
  buildGentong(ctx, 8.4, postNZ - 0.3, 'drum-blue');

  // Inside the playable junction branch
  buildGentong(ctx, 4.5, 7.35, 'drum-blue');
  buildGentong(ctx, 4.2, 9.65, 'gentong-clay');

  // 9. Alley street name sign at corner
  ctx.sign('JL. H. JUNEN II\n← GANG BUNTU', 2.45, 2.2, 10.25, 1.2, 0.45, '#1b5e20', '#ffffff', Math.PI / 2);
}
