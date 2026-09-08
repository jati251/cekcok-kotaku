import * as T from 'three';
import type { WorldContext } from '../../types';
import { getRoadPoint } from '../../../neighborhood';
import { buildRealisticScooter } from '../detail';

const upAxis = new T.Vector3(0, 1, 0);

/**
 * Builds the East Corridor & Playable Area of Jl. H. Junen (-z direction, z = 0 down to -68):
 * Matches authentic Google Street View reference photo at 16 Jl. H. Junen looking East:
 *
 * NORTH SIDE (side: 1 / +X in local coordinates):
 * - House 15E (z = -3 .. -11): Modern 2-story house with dark gray upper wall, carport with terracotta canopy,
 *   ornate white gate with black pillars, white car inside carport, matching ref photo left foreground.
 * - House 14E (z = -11 .. -19): 1-story Indonesian residence with cream walls, terracotta pitched roof,
 *   black iron grille fence, potted plants along the curb, matching ref photo left midground.
 * - Ksa Sport Badminton Hall (z = -19 .. -36): Large athletic sports hall with blue barrel roof, glass entrance,
 *   parking apron with customer motorbikes and MPV.
 * - House 12E (z = -36 .. -46): 2-story residence with upper laundry balcony and black sliding gate.
 * - House 11E (z = -46 .. -54): 1-story house with green canopy and tiled porch.
 * - GM Motor Repair Workshop (z = -54 .. -68): Workshop bay, tool chests, tire stacks, and Jl. Bambu Indah entrance.
 *
 * SOUTH SIDE (side: -1 / -X in local coordinates):
 * - House 15S (z = -1 .. -10): Iconic andesite stone block boundary wall (batu candi), concrete coping,
 *   lush planter boxes of snake plants and calatheas, overarching tropical tree branches spreading over the street,
 *   matching ref photo right foreground exactly.
 * - House 14S (z = -10 .. -19): 2-story cream residence with terracotta hip roof, horizontal wood-slat gate.
 * - Kumpul Kopi Kalisari (z = -19 .. -36): Raised teak wood deck terrace, dark espresso bar, warm string lights,
 *   cafe parasol, outdoor seating, potted monsteras, contiguous neighbor walls.
 * - Toke Painting Body Repair Workshop (z = -36 .. -50): Steel frame workshop bay, air compressor, paint drums.
 * - House 11S (z = -50 .. -68): Residential compound and corner curb into Jl. Bambu Indah.
 *
 * Every property shares boundary walls with zero empty gaps, perfectly matching authentic Indonesian kampung density.
 */
export function buildEastJunction(ctx: WorldContext) {
  const { box, cyl, emit, sign, materials: m } = ctx;

  // =========================================================================
  // NORTH SIDE (side: 1, z = 0 down to -68)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 1. House 15E (z = -3 .. -11, width 8m): Modern 2-Story with Carport
  // (Directly matches Google Street View reference photo left foreground)
  // -------------------------------------------------------------------------
  const h15EZ = -7.0;
  const h15EPt = getRoadPoint(h15EZ);
  const h15EDist = h15EPt.halfWidth + 3.2;
  const h15Ex = h15EPt.x + h15EDist * h15EPt.normalX;
  const h15Ez = h15EZ + h15EDist * h15EPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h15Ex, 0, h15Ez),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h15EPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Main 2-story building body
  box(m.wallGray, 0, 3.2, 4.0, 8.0, 6.4, 7.5);
  box(m.roofGrey, 0, 6.6, 4.0, 8.4, 0.6, 7.8);

  // Upper floor bedroom window & AC outdoor condenser unit
  box(m.dark, -1.8, 4.6, 0.2, 1.8, 1.4, 0.08);
  box(m.glass, -1.8, 4.6, 0.22, 1.6, 1.2, 0.05);
  box(m.white, 2.0, 4.4, 0.3, 0.8, 0.6, 0.35); // AC outdoor unit

  // Ground floor carport canopy with terracotta tile overhang (matching ref photo)
  box(m.dark, -3.8, 1.4, -0.8, 0.08, 2.8, 0.08); // canopy steel post
  box(m.dark, 3.8, 1.4, -0.8, 0.08, 2.8, 0.08);  // canopy steel post
  box(m.terracottaTile, 0, 2.85, 0.8, 8.2, 0.18, 3.6, 0.08, 0, 0); // canopy roof
  box(m.white, 0, 0.06, 0.8, 7.8, 0.12, 3.4); // white ceramic tile carport floor

  // Ornate white iron gate with black pillars (matching ref photo left foreground)
  box(m.dark, -3.8, 1.1, -0.85, 0.35, 2.2, 0.35); // black gate pillar left
  box(m.dark, 3.8, 1.1, -0.85, 0.35, 2.2, 0.35);  // black gate pillar right
  box(m.white, -1.8, 1.05, -0.85, 3.4, 1.9, 0.06); // white decorative gate left
  box(m.white, 1.8, 1.05, -0.85, 3.4, 1.9, 0.06);  // white decorative gate right

  // White car parked inside carport
  box(m.white, 0.5, 0.75, 1.2, 2.0, 1.4, 3.8);
  box(m.dark, 0.5, 0.95, 1.2, 1.9, 0.8, 2.2); // windows
  cyl(m.rubber, -0.55, 0.3, 0.0, 0.3, 0.18, 0, Math.PI / 2);
  cyl(m.rubber, 1.55, 0.3, 0.0, 0.3, 0.18, 0, Math.PI / 2);

  // Planter pots along the carport step
  for (let p = -3.2; p <= -0.8; p += 0.8) {
    cyl(m.clay, p, 0.2, -0.7, 0.14, 0.3);
    box(m.leafMats[1], p, 0.5, -0.7, 0.4, 0.45, 0.4);
  }

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 2. House 14E (z = -11 .. -19, width 8m): Classic Indonesian Kampung House
  // (Directly matches Google Street View reference photo left midground)
  // -------------------------------------------------------------------------
  const h14EZ = -15.0;
  const h14EPt = getRoadPoint(h14EZ);
  const h14EDist = h14EPt.halfWidth + 3.2;
  const h14Ex = h14EPt.x + h14EDist * h14EPt.normalX;
  const h14Ez = h14EZ + h14EDist * h14EPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h14Ex, 0, h14Ez),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h14EPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // House body & traditional pitched terracotta roof
  box(m.cream, 0, 2.1, 3.5, 8.0, 4.2, 7.0);
  box(m.terracottaTile, 0, 4.8, 3.5, 8.6, 1.4, 7.5);

  // Front porch with timber entrance door and windows
  box(m.concrete, 0, 0.08, 0.6, 7.8, 0.16, 2.6); // porch floor
  box(m.wood, -1.2, 1.2, 0.1, 1.1, 2.1, 0.08); // wooden front door
  box(m.glass, 1.6, 1.4, 0.1, 2.0, 1.3, 0.05); // front window

  // Front compound boundary wall with black horizontal fence
  box(m.wallDefault, 0, 0.6, -0.7, 7.8, 1.2, 0.25);
  for (let fy = 1.3; fy <= 1.9; fy += 0.2) {
    box(m.dark, 0, fy, -0.7, 7.8, 0.04, 0.04);
  }
  box(m.dark, -2.4, 1.1, -0.68, 2.4, 1.8, 0.06); // black sliding gate

  // Potted bougainvillea and ferns along the front wall
  cyl(m.clay, 1.8, 0.25, -0.5, 0.18, 0.35);
  box(m.pink, 1.8, 0.75, -0.5, 0.6, 0.7, 0.6); // pink bougainvillea
  cyl(m.clay, 2.8, 0.25, -0.5, 0.18, 0.35);
  box(m.leafMats[0], 2.8, 0.7, -0.5, 0.55, 0.65, 0.55);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 3. Ksa Sport Badminton Hall (z = -19 .. -36, width 17m)
  // -------------------------------------------------------------------------
  const badZ = -27.5;
  const badPt = getRoadPoint(badZ);
  const badDist = badPt.halfWidth + 5.2;
  const bx = badPt.x + badDist * badPt.normalX;
  const bz = badZ + badDist * badPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(bx, 0, bz),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + badPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Large sports hall steel structure
  box(m.wallGray, 0, 3.4, 5.8, 17.5, 6.8, 11.2);
  // Curved barrel industrial roof with aqua-blue sheeting
  box(m.roofGrey, 0, 7.0, 5.8, 18.2, 1.0, 11.8);
  box(m.aquaBlue, 0, 7.5, 5.8, 17.8, 0.4, 11.4);

  // Front entrance facade and glass lobby
  box(m.wallDefault, 0, 1.6, 0.2, 16.5, 3.2, 0.4);
  box(m.glass, -2.8, 1.4, 0.45, 3.4, 2.4, 0.05);
  box(m.silverCover, 2.8, 1.4, 0.45, 3.2, 2.6, 0.05); // steel rolling shutter

  // Prominent signage: "KSA SPORT BADMINTON HALL"
  sign('KSA SPORT BADMINTON HALL', 0, 4.2, 0.45, 7.8, 0.88, '#0d47a1', '#ffffff', Math.PI);

  // Hall ventilation louvers
  for (let vx = -6; vx <= 6; vx += 3) {
    box(m.dark, vx, 5.5, 0.45, 1.6, 0.6, 0.08);
  }

  // Parking apron outside badminton hall
  box(m.concrete, 0, -0.015, -1.8, 17.0, 0.05, 3.6);

  ctx.transform.identity();

  // Customer motorbikes parked at badminton hall
  for (let i = 0; i < 3; i++) {
    const scZ = -23.5 - i * 2.8;
    const pt = getRoadPoint(scZ);
    const dist = pt.halfWidth + 1.2;
    const sx = pt.x + dist * pt.normalX;
    const sz = scZ + dist * pt.normalZ;
    const paintMat = i === 0 ? m.scooterPaint : i === 1 ? m.blue : m.rust;
    buildRealisticScooter(ctx, sx, sz, pt.angle + 0.35, paintMat);
  }

  // -------------------------------------------------------------------------
  // 4. House 12E (z = -36 .. -46, width 10m): 2-Story Residence with Balcony
  // -------------------------------------------------------------------------
  const h12EZ = -41.0;
  const h12EPt = getRoadPoint(h12EZ);
  const h12EDist = h12EPt.halfWidth + 3.2;
  const h12Ex = h12EPt.x + h12EDist * h12EPt.normalX;
  const h12Ez = h12EZ + h12EDist * h12EPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h12Ex, 0, h12Ez),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h12EPt.angle),
    new T.Vector3(1, 1, 1),
  );

  box(m.wallDefault, 0, 3.0, 3.5, 10.0, 6.0, 7.0);
  box(m.roofGrey, 0, 6.3, 3.5, 10.4, 0.8, 7.4);

  // Upper balcony with clothes drying
  box(m.concrete, 0, 3.1, 0.4, 9.6, 0.2, 2.2);
  box(m.dark, 0, 3.65, -0.6, 9.6, 0.9, 0.06); // balcony railing
  box(m.cloth[0], -2.2, 4.0, -0.5, 0.4, 0.6, 0.05);
  box(m.cloth[2], 1.8, 4.0, -0.5, 0.45, 0.5, 0.05);

  // Lower sliding gate & tiled entryway
  box(m.dark, 0, 1.1, -0.7, 9.4, 2.2, 0.08);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 5. House 11E (z = -46 .. -54, width 8m): 1-Story Residence with Porch
  // -------------------------------------------------------------------------
  const h11EZ = -50.0;
  const h11EPt = getRoadPoint(h11EZ);
  const h11EDist = h11EPt.halfWidth + 3.0;
  const h11Ex = h11EPt.x + h11EDist * h11EPt.normalX;
  const h11Ez = h11EZ + h11EDist * h11EPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h11Ex, 0, h11Ez),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + h11EPt.angle),
    new T.Vector3(1, 1, 1),
  );

  box(m.cream, 0, 2.0, 3.2, 8.0, 4.0, 6.5);
  box(m.tile, 0, 4.4, 3.2, 8.4, 1.0, 7.0);
  box(m.green, 0, 2.35, -0.2, 7.6, 0.06, 1.8, 0.18, 0, 0); // front canopy
  box(m.wallDefault, 0, 0.7, -0.6, 7.8, 1.4, 0.25); // low wall
  cyl(m.clay, 1.8, 0.3, -0.4, 0.16, 0.35);
  box(m.leafMats[2], 1.8, 0.7, -0.4, 0.5, 0.55, 0.5);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 6. GM Motor & Jl. Bambu Indah Junction (z = -54 .. -68, width 14m)
  // -------------------------------------------------------------------------
  const gmZ = -61.0;
  const gmPt = getRoadPoint(gmZ);

  // Crossing road turning into Jl. Bambu Indah
  box(m.road, gmPt.x + 3.0, -0.12, gmZ, 28, 0.2, 9.0, 0, gmPt.angle - 0.2, 0);

  // Street Name Sign: "JL. BAMBU INDAH"
  const gmSignX = gmPt.x - 2.5;
  const gmSignZ = gmZ + 3.2;
  box(m.dark, gmSignX, 1.7, gmSignZ, 0.08, 3.4, 0.08);
  sign('JL. BAMBU INDAH', gmSignX, 2.8, gmSignZ, 1.6, 0.36, '#1b5e20', '#ffffff', Math.PI);

  // GM Motor repair garage (North side / side: 1)
  const gmDist = gmPt.halfWidth + 3.5;
  const gmx = gmPt.x + gmDist * gmPt.normalX;
  const gmz = gmZ + gmDist * gmPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(gmx, 0, gmz),
    new T.Quaternion().setFromAxisAngle(upAxis, Math.PI / 2 + gmPt.angle),
    new T.Vector3(1, 1, 1),
  );
  box(m.wallDefault, 0, 2.1, 2.8, 10.0, 4.2, 5.6);
  box(m.roofGrey, 0, 4.4, 2.8, 10.4, 0.5, 6.0);
  sign('BENGKEL MOTOR GM', 0, 3.0, 0.4, 4.2, 0.55, '#e65100', '#ffffff', Math.PI);

  // Stacked tires outside GM Motor
  for (let y = 0; y < 3; y++) {
    cyl(m.rubber, 3.2, 0.12 + y * 0.22, 0.4, 0.32, 0.2);
  }

  ctx.transform.identity();


  // =========================================================================
  // SOUTH SIDE (side: -1, z = 0 down to -68)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 1. House 15S (z = -1 .. -10, width 9m): Andesite Stone Wall & Overarching Trees
  // (Directly matches Google Street View reference photo right foreground)
  // -------------------------------------------------------------------------
  const h15SZ = -5.5;
  const h15SPt = getRoadPoint(h15SZ);
  const h15SDist = -(h15SPt.halfWidth + 3.0);
  const h15Sx = h15SPt.x + h15SDist * h15SPt.normalX;
  const h15Sz = h15SZ + h15SDist * h15SPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h15Sx, 0, h15Sz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + h15SPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Inner pavilion house body & terracotta roof behind the stone wall
  box(m.wallDefault, 0, 2.4, 3.6, 9.0, 4.8, 7.0);
  box(m.terracottaTile, 0, 5.0, 3.6, 9.4, 1.2, 7.4);

  // THE ICONIC ANDESITE STONE WALL (Batu Candi / Andesit) along the street edge
  box(m.andesite, 0, 0.95, -0.6, 9.0, 1.9, 0.35);
  box(m.concrete, 0, 1.92, -0.6, 9.2, 0.08, 0.42); // concrete wall coping

  // Wrought iron pedestrian gate with house number plate
  box(m.dark, -3.2, 0.95, -0.58, 1.4, 1.9, 0.06);

  // Planter boxes and lush potted plants along the wall ledge (matching ref photo)
  for (let wx = -1.8; wx <= 3.8; wx += 0.9) {
    cyl(m.dark, wx, 2.05, -0.6, 0.12, 0.22);
    const leafMat = m.leafMats[Math.abs(Math.floor(wx * 7)) % m.leafMats.length];
    box(leafMat, wx, 2.35, -0.6, 0.4, 0.45, 0.4);
  }

  // Large tropical shade tree behind the wall, overarching branches spreading over the street
  box(m.wood, 1.8, 2.6, 0.8, 0.35, 5.2, 0.35); // tree trunk
  box(m.leafMats[0], 1.8, 4.8, 0.4, 3.8, 3.2, 3.8); // canopy
  box(m.leafMats[2], 1.4, 4.2, -0.8, 2.6, 2.2, 2.4); // overarching branch hanging over road

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 2. House 14S (z = -10 .. -19, width 9m): 2-Story Residence with Wood-Slat Gate
  // -------------------------------------------------------------------------
  const h14SZ = -14.5;
  const h14SPt = getRoadPoint(h14SZ);
  const h14SDist = -(h14SPt.halfWidth + 3.2);
  const h14Sx = h14SPt.x + h14SDist * h14SPt.normalX;
  const h14Sz = h14SZ + h14SDist * h14SPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h14Sx, 0, h14Sz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + h14SPt.angle),
    new T.Vector3(1, 1, 1),
  );

  box(m.cream, 0, 2.8, 3.5, 9.0, 5.6, 7.0);
  box(m.tile, 0, 5.9, 3.5, 9.4, 0.9, 7.4);

  // Front courtyard wall with horizontal wood slats
  box(m.wallDefault, 0, 0.8, -0.6, 9.0, 1.6, 0.28);
  for (let wy = 0.3; wy <= 1.8; wy += 0.25) {
    box(m.woodSlat, 0, wy, -0.58, 5.4, 0.16, 0.04);
  }
  cyl(m.clay, 3.6, 0.3, -0.4, 0.18, 0.4);
  box(m.leafMats[1], 3.6, 0.75, -0.4, 0.55, 0.6, 0.55);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 3. Kumpul Kopi Kalisari Cafe Terrace (z = -19 .. -36, width 17m)
  // -------------------------------------------------------------------------
  const kopiZ = -27.5;
  const kopiPt = getRoadPoint(kopiZ);
  const kopiDist = -(kopiPt.halfWidth + 3.4);
  const kx = kopiPt.x + kopiDist * kopiPt.normalX;
  const kz = kopiZ + kopiDist * kopiPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(kx, 0, kz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + kopiPt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Coffee shop main building
  box(m.wallDefault, 0, 2.0, 3.6, 17.0, 4.0, 7.0);
  box(m.terracottaTile, 0, 4.3, 3.6, 17.4, 0.7, 7.4);

  // Raised wooden terrace deck extending across the full 16 meters
  box(m.teakWood, 0, 0.08, 0.4, 16.5, 0.16, 3.2);

  // Espresso bar counter
  box(m.wood, -3.5, 0.55, 1.1, 3.4, 1.1, 0.75);
  box(m.dark, -3.5, 1.12, 1.1, 3.5, 0.06, 0.8); // countertop
  box(m.chrome, -4.2, 1.35, 1.1, 0.6, 0.45, 0.4); // chrome espresso machine
  cyl(m.dark, -3.0, 1.32, 1.1, 0.13, 0.35); // grinder

  // Hanging string lights with warm glowing bulbs
  for (let lx = -6.0; lx <= 6.0; lx += 1.5) {
    box(m.dark, lx, 2.55, 0.2, 0.02, 0.35, 0.02);
    emit(new T.SphereGeometry(0.06, 8, 8), m.gold, lx, 2.35, 0.2);
  }

  // Outdoor cafe seating: wooden tables & chairs
  for (const tx of [-0.5, 2.5, 5.5]) {
    cyl(m.wood, tx, 0.38, 0.3, 0.38, 0.76); // table base
    cyl(m.teakWood, tx, 0.78, 0.3, 0.46, 0.04); // table top
    box(m.dark, tx - 0.45, 0.42, 0.3, 0.32, 0.84, 0.32);
    box(m.dark, tx + 0.45, 0.42, 0.3, 0.32, 0.84, 0.32);
  }

  // Cafe parasol umbrella
  cyl(m.dark, 2.5, 1.4, 0.3, 0.03, 2.8);
  box(m.white, 2.5, 2.65, 0.3, 2.2, 0.3, 2.2);

  // Signboard: "KUMPUL KOPI KALISARI"
  sign('KUMPUL KOPI KALISARI', 0, 3.2, 0.9, 4.2, 0.58, '#3e2723', '#d7ccc8', Math.PI);

  // Potted monstera and palms along terrace railing
  for (let px = -7.5; px <= 7.5; px += 1.8) {
    cyl(m.clay, px, 0.25, -0.85, 0.16, 0.35);
    box(m.leafMats[1], px, 0.65, -0.85, 0.48, 0.58, 0.48);
  }

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 4. Toke Painting Body Repair Workshop (z = -36 .. -50, width 14m)
  // -------------------------------------------------------------------------
  const tokeZ = -43.0;
  const tokePt = getRoadPoint(tokeZ);
  const tokeDist = -(tokePt.halfWidth + 3.4);
  const tox = tokePt.x + tokeDist * tokePt.normalX;
  const toz = tokeZ + tokeDist * tokePt.normalZ;

  ctx.transform.compose(
    new T.Vector3(tox, 0, toz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + tokePt.angle),
    new T.Vector3(1, 1, 1),
  );

  // Workshop steel frame open bay
  box(m.wallGray, 0, 2.2, 3.2, 14.0, 4.4, 6.0);
  box(m.roofGrey, 0, 4.5, 3.2, 14.4, 0.4, 6.4);
  box(m.dark, -6.6, 1.8, 0.6, 0.12, 3.6, 0.12);
  box(m.dark, 6.6, 1.8, 0.6, 0.12, 3.6, 0.12);

  // Air compressor unit & spray equipment
  cyl(m.blue, -4.5, 0.45, 1.2, 0.28, 0.9, 0, Math.PI / 2);
  cyl(m.dark, -4.5, 0.9, 1.2, 0.12, 0.35); // electric motor

  // Signboard: "TOKE PAINTING - BODY REPAIR"
  sign('TOKE PAINTING - BODY REPAIR', 0, 3.5, 0.65, 4.8, 0.55, '#c62828', '#ffffff', Math.PI);

  ctx.transform.identity();

  // -------------------------------------------------------------------------
  // 5. House 11S (z = -50 .. -68, width 18m): Residential Compound to Jl. Bambu Indah
  // -------------------------------------------------------------------------
  const h11SZ = -59.0;
  const h11SPt = getRoadPoint(h11SZ);
  const h11SDist = -(h11SPt.halfWidth + 3.2);
  const h11Sx = h11SPt.x + h11SDist * h11SPt.normalX;
  const h11Sz = h11SZ + h11SDist * h11SPt.normalZ;

  ctx.transform.compose(
    new T.Vector3(h11Sx, 0, h11Sz),
    new T.Quaternion().setFromAxisAngle(upAxis, -Math.PI / 2 + h11SPt.angle),
    new T.Vector3(1, 1, 1),
  );

  box(m.wallDefault, 0, 2.2, 3.5, 18.0, 4.4, 7.0);
  box(m.terracottaTile, 0, 4.7, 3.5, 18.4, 0.9, 7.4);

  // Perimeter wall and gate
  box(m.andesite, 0, 0.8, -0.6, 18.0, 1.6, 0.3);
  box(m.dark, -4.0, 1.0, -0.58, 3.2, 2.0, 0.08); // gate
  cyl(m.clay, 4.0, 0.3, -0.4, 0.18, 0.4);
  box(m.leafMats[0], 4.0, 0.75, -0.4, 0.6, 0.65, 0.6);

  ctx.transform.identity();
}
