import * as T from 'three';
import type { WorldContext } from '../../types';
import { getRoadPoint } from '../../../neighborhood';
import { buildRealisticScooter } from '../detail';

const upAxis = new T.Vector3(0, 1, 0);

/**
 * Builds the West Corridor & Playable Area of Jl. H. Junen (+z direction, z = 56 to 142):
 * Fully continuous, zero-gap residential compounds matching Google Street View references:
 *
 * NORTH SIDE (side: 1 / +X in local coordinates):
 * - House 16W (z = 56 .. 67): 1-story Indonesian residence with cream walls, green awning,
 *   decorative gate, connecting pink house directly to Gg. Kresek VI.
 * - Gg. Kresek VI Branch Alley & Graffiti Corner (z = 67 .. 75):
 *   Alley opening, corner wall with painted "Gg. KRESEK VI" graffiti and "RUMAH TAMAN ILMU" banner,
 *   courtyard shade tree, parked scooter in alley.
 * - House 18A & 18B (z = 75 .. 106): Contiguous modern 2-story residences with translucent polycarbonate carport,
 *   garden porch filled with bougainvillea and ferns, 2nd-floor balcony with laundry line.
 * - House 18C (z = 106 .. 124): Residential compound connecting House 18 directly to Warkop H. Junen.
 * - Warkop H. Junen & Jl. Lestari T-Junction (z = 124 .. 142):
 *   Traditional coffee & Indomie warung, teal canvas awning, Indomie sachets, kettle, benches,
 *   crossing wide road (Jl. Lestari), and municipal street signposts.
 *
 * SOUTH SIDE (side: -1 / -X in local coordinates):
 * - Yellow Residential House (z = 63 .. 76): Directly adjoining green-car house, yellow facade,
 *   terracotta roof, white gate, tiled garage apron.
 * - House 17 (z = 76 .. 88): 2-story residence, horizontal orange/black slat gate, tiled porch with
 *   resident repair workbench (vise, tools, oil can) and folding stainless laundry drying rack with clothes.
 * - House 17B (z = 88 .. 106): Contiguous residential compound with garden wall, gate, and potted palms.
 * - House 19 (z = 106 .. 124): Iconic 2-story cream house with the OUTDOOR WHITE SPIRAL STAIRCASE,
 *   balcony terrace, red/white safety barrier poles, flower garden.
 * - Jl. Lestari corner boundary (z = 124 .. 142): Contiguous perimeter curb and walls turning into Jl. Lestari.
 */
export function buildWestJunction(ctx: WorldContext) {
  const { box, cyl, sign, materials: m } = ctx;

  // =========================================================================
  // NORTH SIDE (side: 1, z = 56 to 142)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 1. House 16W (z = 56 .. 67, width 11m): Connects Pink House to Gg. Kresek VI
  // -------------------------------------------------------------------------
  const h16WZ = 61.5;
  const h16WPt = getRoadPoint(h16WZ);
  const h16WDist = h16WPt.halfWidth + 3.2;
  const h16Wx = h16WPt.x + h16WDist * h16WPt.normalX;
  const h16Wz = h16WZ + h16WDist * h16WPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h16Wx, 0, h16Wz),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h16WPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // House body and tile roof
  box(m.cream, 0, 2.2, 3.8, 11.0, 4.4, 7.5);
  box(m.tile, 0, 4.8, 3.8, 11.4, 1.2, 7.8);

  // Front porch with tiled floor
  box(m.concrete, 0, 0.08, 0.6, 10.8, 0.16, 2.8);
  // Teal canopy awning
  box(m.teal, -2.0, 2.5, 0.2, 5.5, 0.06, 2.2, 0.15, 0, 0);

  // Front compound wall & metal gate
  box(m.wallDefault, 0, 0.7, -0.6, 10.8, 1.4, 0.25);
  box(m.dark, -2.0, 1.1, -0.58, 4.0, 1.9, 0.08); // gate

  // Potted bougainvillea along porch step
  cyl(m.clay, 3.2, 0.25, -0.4, 0.18, 0.35);
  box(m.pink, 3.2, 0.75, -0.4, 0.6, 0.7, 0.6);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 2. Gg. Kresek VI Branch Alley & Graffiti Corner (z = 67 .. 75, North / side: 1)
  // -------------------------------------------------------------------------
  const kresekZ = 71;
  const kresekPt = getRoadPoint(kresekZ);
  const kresekDist = kresekPt.halfWidth;
  const kx = kresekPt.x + kresekDist * kresekPt.normalX;
  const kz = kresekZ + kresekDist * kresekPt.normalZ;

  // Branch alley asphalt ribbon extending North (+X) for 15 meters
  box(m.road, kx + 7.0, -0.12, kz, 14.0, 0.2, 3.2, 0, kresekPt.angle, 0);

  // Corner Wall East (z = 67.5) with iconic "Gg. Kresek VI" graffiti & "RUMAH TAMAN ILMU"
  const cEastPt = getRoadPoint(67.5);
  const cEastX = cEastPt.x + (cEastPt.halfWidth + 1.2) * cEastPt.normalX;
  const cEastZ = 67.5 + (cEastPt.halfWidth + 1.2) * cEastPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(cEastX, 0, cEastZ),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + cEastPt.angle),
    new T.Vector3(1, 1, 1),
  );
  // Corner property wall
  box(m.white, 0, 1.3, 0.2, 4.2, 2.6, 0.35);
  box(m.wallGray, 0, 0.3, 0.22, 4.2, 0.6, 0.38); // damp lower skirting
  box(m.tile, 0, 2.65, 0.2, 4.4, 0.15, 0.5); // wall coping tile

  // Painted graffiti: "Gg. Kresek VI" facing the main street
  sign('Gg. KRESEK VI', 0.0, 1.85, -0.05, 2.0, 0.44, '#1a1a1a', '#ffffff', Math.PI);
  // Neighborhood community banner: "RUMAH TAMAN ILMU"
  sign('RUMAH TAMAN ILMU', 0.0, 1.2, -0.05, 1.8, 0.35, '#1b5e20', '#ffe082', Math.PI);

  // Courtyard shade tree rising behind corner wall
  box(m.leafMats[1], -0.6, 3.8, 2.2, 3.6, 3.8, 3.4);
  box(m.wood, -0.6, 1.8, 2.2, 0.3, 3.6, 0.3);
  ctx.transform.identity();

  // Corner Wall West (z = 74.5) with courtyard gate & tropical tree
  const cWestPt = getRoadPoint(74.5);
  const cWestX = cWestPt.x + (cWestPt.halfWidth + 1.2) * cWestPt.normalX;
  const cWestZ = 74.5 + (cWestPt.halfWidth + 1.2) * cWestPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(cWestX, 0, cWestZ),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + cWestPt.angle),
    new T.Vector3(1, 1, 1),
  );
  box(m.cream, 0, 1.4, 0.2, 4.0, 2.8, 0.35);
  box(m.dark, -1.2, 1.1, 0.25, 1.4, 2.2, 0.08); // metal pedestrian gate
  box(m.leafMats[0], 0.8, 3.9, 2.0, 3.4, 3.6, 3.2);
  box(m.wood, 0.8, 1.8, 2.0, 0.28, 3.6, 0.28);
  ctx.transform.identity();

  // Parked scooter in Gg. Kresek VI alley
  buildRealisticScooter(ctx, kx + 3.2, kz + 0.8, kresekPt.angle + Math.PI / 2 + 0.2, m.scooterPaint);

  // -------------------------------------------------------------------------
  // 3. House 18A & 18B (z = 75 .. 106, width 31m): Modern 2-Story with Garden & Carport
  // -------------------------------------------------------------------------
  const h18Z = 90.0;
  const h18Pt = getRoadPoint(h18Z);
  const h18Dist = h18Pt.halfWidth + 3.4;
  const h18x = h18Pt.x + h18Dist * h18Pt.normalX;
  const h18z = h18Z + h18Dist * h18Pt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h18x, 0, h18z),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h18Pt.angle),
    new T.Vector3(1, 1, 1),
  );

  // 2-Story modern house body (gray & pale mint green) spanning full width
  box(m.wallGray, 0, 3.2, 3.8, 28.0, 6.4, 7.5);
  box(m.tile, 0, 6.7, 3.8, 28.4, 1.0, 7.8);

  // Cantilevered bedroom volumes
  box(m.pale, -6.0, 4.6, 1.5, 6.0, 3.2, 3.0);
  box(m.cream, 6.0, 4.6, 1.5, 6.0, 3.2, 3.0);

  // Translucent polycarbonate carport canopies
  box(m.polycarbonate, -4.0, 3.15, 0.4, 5.5, 0.06, 2.6, 0.12, 0, 0);
  box(m.polycarbonate, 5.0, 3.15, 0.4, 5.5, 0.06, 2.6, 0.12, 0, 0);

  // Black sliding gates
  box(m.dark, -4.0, 1.15, -0.75, 5.5, 2.2, 0.08);
  box(m.dark, 5.0, 1.15, -0.75, 5.5, 2.2, 0.08);

  // Front garden porch filled with lush potted plants
  box(m.andesite, 0, 0.12, 0.2, 4.0, 0.24, 2.2); // stone garden raised bed
  for (let i = 0; i < 5; i++) {
    const px = -2.0 + i * 1.0;
    cyl(m.clay, px, 0.35, 0.1, 0.16, 0.35);
    const leafMat = m.leafMats[i % m.leafMats.length];
    box(leafMat, px, 0.75, 0.1, 0.45, 0.6, 0.45);
  }

  // Upper balcony with drying laundry clothesline
  box(m.dark, -6.0, 3.45, 0.0, 5.0, 0.8, 0.05); // balcony rail
  box(m.cloth[0], -7.2, 3.9, 0.1, 0.45, 0.55, 0.05);
  box(m.cloth[2], -5.8, 3.95, 0.1, 0.5, 0.45, 0.05);

  ctx.transform.identity();

  // Parked red Honda Vario scooter on House 18 driveway
  const sc18X = h18Pt.x + (h18Pt.halfWidth + 1.3) * h18Pt.normalX;
  const sc18Z = h18Z - 2.5 + (h18Pt.halfWidth + 1.3) * h18Pt.normalZ;
  buildRealisticScooter(ctx, sc18X, sc18Z, h18Pt.angle + 0.15, m.salmon);

  // -------------------------------------------------------------------------
  // 4. House 18C (z = 106 .. 124, width 18m): Connects House 18 to Warkop H. Junen
  // -------------------------------------------------------------------------
  const h18CZ = 115.0;
  const h18CPt = getRoadPoint(h18CZ);
  const h18CDist = h18CPt.halfWidth + 3.2;
  const h18Cx = h18CPt.x + h18CDist * h18CPt.normalX;
  const h18Cz = h18CZ + h18CDist * h18CPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h18Cx, 0, h18Cz),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h18CPt.angle),
    new T.Vector3(1, 1, 1),
  );

  box(m.wallDefault, 0, 2.2, 3.6, 17.5, 4.4, 7.2);
  box(m.roofGrey, 0, 4.7, 3.6, 17.8, 0.9, 7.6);
  box(m.wallDefault, 0, 0.8, -0.6, 17.5, 1.6, 0.28);
  box(m.dark, -2.5, 1.1, -0.58, 4.2, 2.1, 0.08); // gate

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 5. Warkop H. Junen & Jl. Lestari T-Junction (z = 124 .. 142)
  // -------------------------------------------------------------------------
  const jLestariZ = 136;
  const jLestariPt = getRoadPoint(jLestariZ);

  // Main crossing road (Jl. Lestari running crosswise)
  box(m.road, jLestariPt.x, -0.12, jLestariZ + 2.0, 36, 0.2, 8.5, 0, 0.12, 0);

  // Municipal Street Name Signpost: "JL. H. JUNEN" & "JL. LESTARI"
  const signX = jLestariPt.x - 2.8;
  const signZ = jLestariZ - 4.2;
  box(m.dark, signX, 1.7, signZ, 0.08, 3.4, 0.08);
  sign('JL. H. JUNEN', signX, 3.0, signZ, 1.5, 0.36, '#1b5e20', '#ffffff', Math.PI);
  sign('JL. LESTARI', signX, 2.6, signZ, 1.5, 0.36, '#1b5e20', '#ffffff', Math.PI / 2);

  // Crossing concrete curb along far edge of Jl. Lestari
  for (let x = -16; x <= 16; x += 1.2) {
    box(m.concrete, jLestariPt.x + x, -0.02, jLestariZ + 6.8, 1.18, 0.16, 0.35);
  }

  // Warkop H. Junen (Traditional coffee & Indomie warung at the corner of Jl. Lestari)
  const warkopZ = 130;
  const warkopPt = getRoadPoint(warkopZ);
  const warkopDist = warkopPt.halfWidth + 3.0;
  const wx = warkopPt.x + warkopDist * warkopPt.normalX;
  const wz = warkopZ + warkopDist * warkopPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(wx, 0, wz),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + warkopPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Warung building shell
  box(m.wallDefault, 0, 1.8, 2.6, 6.6, 3.6, 4.2);
  box(m.roofGrey, 0, 3.7, 2.6, 7.2, 0.5, 4.6);

  // Front wooden service counter
  box(m.wood, 0, 0.52, 0.5, 4.4, 1.04, 0.7);
  box(m.teakWood, 0, 1.06, 0.5, 4.6, 0.08, 0.8); // counter top

  // Indomie & coffee sachet display hanging rack
  box(m.white, -1.2, 1.5, 0.5, 1.3, 0.8, 0.12);
  box(m.cloth[0], -1.2, 1.5, 0.58, 1.1, 0.65, 0.05); // hanging sachets

  // Gas stove & whistling kettle
  box(m.rust, 1.1, 1.15, 0.5, 0.36, 0.24, 0.26);
  cyl(m.chrome, 1.1, 1.36, 0.5, 0.13, 0.24); // stainless kettle

  // Glass snack jars (toples kerupuk & kacang)
  cyl(m.glass, 0.0, 1.25, 0.5, 0.14, 0.32);
  cyl(m.gold, 0.0, 1.42, 0.5, 0.15, 0.06); // gold lid

  // Warung teal canvas awning extending toward the road
  box(m.teal, 0, 2.45, -0.2, 5.0, 0.06, 1.8, 0.22, 0, 0);
  box(m.dark, -2.4, 1.2, -0.95, 0.06, 2.4, 0.06);
  box(m.dark, 2.4, 1.2, -0.95, 0.06, 2.4, 0.06);

  // Warung signboard
  sign('WARKOP H. JUNEN - KOPI & INDOMIE', 0, 2.75, -0.1, 3.8, 0.48, '#004d40', '#ffe082', Math.PI);

  // Customer wooden bench
  box(m.wood, 0, 0.28, -0.5, 3.6, 0.48, 0.38);

  ctx.transform.identity();

  // Parked customer scooters at Warkop H. Junen
  const scW1X = warkopPt.x + (warkopPt.halfWidth + 0.9) * warkopPt.normalX;
  const scW1Z = warkopZ - 1.8 + (warkopPt.halfWidth + 0.9) * warkopPt.normalZ;
  buildRealisticScooter(ctx, scW1X, scW1Z, warkopPt.angle - 0.2, m.scooterPaint);

  const scW2X = warkopPt.x + (warkopPt.halfWidth + 0.95) * warkopPt.normalX;
  const scW2Z = warkopZ + 1.9 + (warkopPt.halfWidth + 0.95) * warkopPt.normalZ;
  buildRealisticScooter(ctx, scW2X, scW2Z, warkopPt.angle + 0.25, m.blue);


  // =========================================================================
  // SOUTH SIDE (side: -1, z = 56 to 142)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 1. Yellow Residential House (z = 63 .. 76, width 13m): Directly adjoins green-car house
  // -------------------------------------------------------------------------
  const yHouseZ = 69.5;
  const yHousePt = getRoadPoint(yHouseZ);
  const yDist = -(yHousePt.halfWidth + 3.2);
  const yx = yHousePt.x + yDist * yHousePt.normalX;
  const yz = yHouseZ + yDist * yHousePt.normalZ;

  ctx.transform.compose(
    new T.Vector3(yx, 0, yz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + yHousePt.angle),
    new T.Vector3(1, 1, 1),
  );
  // Main yellow house body & terracotta roof spanning full 13m width
  box(m.gold, 0, 2.3, 3.5, 12.8, 4.6, 7.0);
  box(m.terracottaTile, 0, 4.9, 3.5, 13.2, 0.9, 7.4);
  // Front garage & porch
  box(m.white, 0, 1.3, 0.4, 12.4, 2.6, 0.3);
  box(m.silverCover, -2.5, 1.2, 0.6, 4.0, 2.3, 0.08); // white iron sliding gate
  box(m.concrete, 0, 0.08, -0.6, 12.4, 0.16, 2.4); // tiled apron
  // Flower pots along yellow house curb
  for (let i = 0; i < 4; i++) {
    cyl(m.clay, 1.5 + i * 0.8, 0.22, -0.4, 0.18, 0.35);
    box(m.leafMats[2], 1.5 + i * 0.8, 0.55, -0.4, 0.45, 0.5, 0.45);
  }
  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 2. House 17 (z = 76 .. 88, width 12m): Resident Workbench & Laundry Rack
  // -------------------------------------------------------------------------
  const h17Z = 82;
  const h17Pt = getRoadPoint(h17Z);
  const h17Dist = -(h17Pt.halfWidth + 3.4);
  const h17x = h17Pt.x + h17Dist * h17Pt.normalX;
  const h17z = h17Z + h17Dist * h17Pt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h17x, 0, h17z),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + h17Pt.angle),
    new T.Vector3(1, 1, 1),
  );
  // 2-Story modern residential house body
  box(m.cream, 0, 3.0, 3.5, 12.0, 6.0, 7.0);
  box(m.roofGrey, 0, 6.4, 3.5, 12.4, 1.1, 7.4);

  // Tiled front porch (keramik putih teras)
  box(m.white, 0, 0.08, 0.4, 11.6, 0.16, 3.2);

  // Modern orange & black horizontal slat gate
  box(m.dark, -3.2, 1.1, -0.8, 0.08, 2.2, 0.08);
  box(m.dark, 3.2, 1.1, -0.8, 0.08, 2.2, 0.08);
  for (let y = 0.25; y <= 2.0; y += 0.22) {
    box(m.woodSlat, 0, y, -0.8, 6.3, 0.14, 0.05);
  }

  // Resident's repair workbench (Meja kerja pertukangan) on the porch
  const wbX = 3.2;
  const wbZ = 0.8;
  box(m.teakWood, wbX, 0.45, wbZ, 1.8, 0.88, 0.7);
  box(m.dark, wbX, 0.92, wbZ, 1.9, 0.06, 0.75);
  box(m.rust, wbX - 0.7, 1.05, wbZ - 0.2, 0.22, 0.2, 0.18); // vise
  box(m.teal, wbX + 0.4, 1.02, wbZ, 0.35, 0.2, 0.25);
  cyl(m.chrome, wbX + 0.7, 1.05, wbZ + 0.1, 0.06, 0.22); // oil can
  cyl(m.rubber, wbX + 0.9, 0.32, wbZ + 0.8, 0.3, 0.1, Math.PI / 2); // tire

  // Stainless steel folding laundry drying rack
  const jrX = -3.2;
  const jrZ = 0.9;
  box(m.chrome, jrX - 0.8, 0.65, jrZ, 0.03, 1.3, 0.03);
  box(m.chrome, jrX + 0.8, 0.65, jrZ, 0.03, 1.3, 0.03);
  box(m.chrome, jrX, 1.28, jrZ, 1.62, 0.03, 0.03);
  box(m.cloth[0], jrX - 0.45, 0.95, jrZ, 0.35, 0.6, 0.05);
  box(m.cloth[1], jrX + 0.05, 0.9, jrZ, 0.38, 0.68, 0.05);
  box(m.cloth[2], jrX + 0.5, 0.98, jrZ, 0.32, 0.52, 0.05);

  // 2nd-floor balcony with safety railing
  box(m.concrete, 0, 3.2, 0.3, 11.6, 0.2, 1.8);
  for (let rx = -5.2; rx <= 5.2; rx += 0.45) {
    box(m.white, rx, 3.75, -0.5, 0.04, 0.9, 0.04);
  }
  box(m.white, 0, 4.22, -0.5, 11.0, 0.05, 0.06);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 3. House 17B (z = 88 .. 106, width 18m): Connects House 17 to House 19
  // -------------------------------------------------------------------------
  const h17BZ = 97.0;
  const h17BPt = getRoadPoint(h17BZ);
  const h17BDist = -(h17BPt.halfWidth + 3.4);
  const h17Bx = h17BPt.x + h17BDist * h17BPt.normalX;
  const h17Bz = h17BZ + h17BDist * h17BPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h17Bx, 0, h17Bz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + h17BPt.angle),
    new T.Vector3(1, 1, 1),
  );

  box(m.wallGray, 0, 2.8, 3.6, 17.5, 5.6, 7.2);
  box(m.tile, 0, 5.9, 3.6, 17.8, 0.9, 7.6);
  box(m.andesite, 0, 0.85, -0.6, 17.5, 1.7, 0.3); // stone perimeter wall
  box(m.dark, -3.5, 1.0, -0.58, 4.0, 2.0, 0.08); // gate

  for (let p = 1.0; p <= 6.0; p += 1.5) {
    cyl(m.clay, p, 0.3, -0.4, 0.16, 0.35);
    box(m.leafMats[1], p, 0.7, -0.4, 0.5, 0.55, 0.5);
  }

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 4. House 19 (z = 106 .. 124, width 18m): Iconic Outdoor White Spiral Staircase
  // -------------------------------------------------------------------------
  const h19Z = 115.0;
  const h19Pt = getRoadPoint(h19Z);
  const h19Dist = -(h19Pt.halfWidth + 3.6);
  const h19x = h19Pt.x + h19Dist * h19Pt.normalX;
  const h19z = h19Z + h19Dist * h19Pt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h19x, 0, h19z),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + h19Pt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Main 2-story cream house body spanning full 18m
  box(m.cream, 0, 3.2, 3.6, 17.5, 6.4, 7.2);
  box(m.terracottaTile, 0, 6.7, 3.6, 17.8, 1.0, 7.6);

  // 2nd-floor corner balcony terrace
  box(m.concrete, 5.0, 3.2, 0.5, 4.5, 0.24, 2.6);
  box(m.white, 5.0, 3.75, -0.7, 4.5, 0.9, 0.06); // balcony railing
  box(m.white, 7.2, 3.75, 0.5, 0.06, 0.9, 2.6); // side balcony railing

  // -------------------------------------------------------------------------
  // THE ICONIC OUTDOOR WHITE SPIRAL STAIRCASE (Tangga Putar Luar)
  // -------------------------------------------------------------------------
  const stairX = 6.2;
  const stairZ = -0.5;
  const totalSteps = 16;
  const totalHeight = 3.2;
  const stairRadius = 0.95;

  // Central steel pole
  cyl(m.white, stairX, totalHeight / 2, stairZ, 0.09, totalHeight + 0.8);

  // Helical cascading steps curving up from ground to 2nd-floor balcony
  for (let i = 0; i < totalSteps; i++) {
    const progress = i / totalSteps;
    const stepY = progress * totalHeight + 0.1;
    const stepAngle = progress * Math.PI * 1.85 - 0.2;
    const stepMidR = stairRadius * 0.55;
    const sx = stairX + Math.cos(stepAngle) * stepMidR;
    const sz = stairZ + Math.sin(stepAngle) * stepMidR;

    // Wedge step tread
    box(m.white, sx, stepY, sz, 0.42, 0.05, 0.72, 0, -stepAngle, 0);

    // Outer baluster upright
    const outerX = stairX + Math.cos(stepAngle) * (stairRadius + 0.04);
    const outerZ = stairZ + Math.sin(stepAngle) * (stairRadius + 0.04);
    box(m.white, outerX, stepY + 0.45, outerZ, 0.03, 0.9, 0.03);
  }

  // Red & White roadside safety barrier poles
  for (let p = -7.0; p <= 7.0; p += 2.2) {
    const poleX = p;
    const poleZ = -1.4;
    cyl(m.white, poleX, 0.25, poleZ, 0.08, 0.5);
    cyl(m.cloth[0], poleX, 0.65, poleZ, 0.08, 0.35);
  }

  // Corner flower garden with bougainvillea shrub
  box(m.andesite, -5.5, 0.15, -0.6, 2.8, 0.3, 1.4);
  box(m.pink, -5.5, 0.85, -0.6, 2.0, 1.2, 1.1);

  ctx.transform.identity();
}
