import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDoor } from '../architecture';
import { buildScooter } from '../vehicles';

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
 * Builds the Pale Green House (Gambar 2):
 * - Lime/pale green upper gable with white rake fascia (lisplang) and ventilation medallion
 * - 3-pane casement window with white concrete hood (topi-topi beton) and center open leaf
 * - Ground floor triangular gable porch canopy with terracotta roof
 * - Square porch pillar with dark pedestal base and white column shaft
 * - Stepped divider wall with lush greenery planter box on the left
 * - Lime green gate post with dark pyramid cap and black metal sliding gate
 */
export function buildPaleGreenHouse(ctx: WorldContext, p: Property) {
  const { box, beam, cyl, emit, materials } = ctx;
  const { pale, concrete, dark, white, tile, glass, green } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front;
  const halfW = w / 2;

  // ---------------------------------------------------------------------------
  // 1. FOUNDATION & SOLID BUILDING MASS
  // ---------------------------------------------------------------------------
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  // Upper floor pale green wall mass
  box(pale, 0, h * 0.75, front + depth / 2, w - 0.16, h * 0.5, depth);
  // Ground floor white plaster wall mass (two-tone Indonesian residential style)
  box(white, 0, h * 0.25, front + depth / 2, w - 0.16, h * 0.5, depth);

  // Boundary side walls from street to facade
  box(pale, halfW - 0.08, 1.2, front / 2, 0.16, 2.4, front);

  // ---------------------------------------------------------------------------
  // 2. GROUND FLOOR PORCH & TRIANGULAR GABLE CANOPY (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const porchW = 2.8;
  const porchCenterX = 1.0;
  const porchFrontZ = 0.35;
  const porchFloorY = 0.06;

  // Raised tiled porch floor
  box(white, porchCenterX, porchFloorY, (porchFrontZ + front) / 2, porchW + 0.2, 0.12, front - porchFrontZ);

  // Iconic square porch column on the left with black pedestal base & white shaft (Gambar 2)
  const pillarX = porchCenterX - porchW / 2 + 0.18; // ~ -0.22
  const pillarZ = porchFrontZ + 0.25;
  // Black pedestal base
  box(dark, pillarX, 0.4, pillarZ, 0.44, 0.8, 0.44);
  // White column shaft
  box(white, pillarX, 1.65, pillarZ, 0.32, 1.7, 0.32);
  // Capital
  box(white, pillarX, 2.54, pillarZ, 0.42, 0.12, 0.42);

  // Triangular gable porch canopy roof (atap pelana teras Gambar 2)
  const porchCanopyBase = 2.55;
  const porchCanopyRise = 0.75;
  const porchHalfW = porchW / 2 + 0.15;

  // Triangular pediment facing the street
  emitGable(ctx, pale, porchCenterX, porchCanopyBase, porchCanopyRise, porchHalfW, porchFrontZ);
  // White fascia trim along front rakes of the porch canopy
  beam(white, [porchCenterX - porchHalfW, porchCanopyBase, porchFrontZ - 0.03], [porchCenterX, porchCanopyBase + porchCanopyRise, porchFrontZ - 0.03], 0.045);
  beam(white, [porchCenterX, porchCanopyBase + porchCanopyRise, porchFrontZ - 0.03], [porchCenterX + porchHalfW, porchCanopyBase, porchFrontZ - 0.03], 0.045);

  // Terracotta roof slopes over the porch canopy
  buildGableRoofSlopes(ctx, tile, porchCenterX, porchCanopyBase, porchCanopyRise, porchHalfW, porchFrontZ, facadeZ, 0.18);

  // White front entrance door under the porch
  buildDoor(ctx, porchCenterX + 0.4, facadeZ, white);

  // Ground floor window beside entrance door
  const gfWinX = porchCenterX - 0.45;
  box(dark, gfWinX, 1.35, facadeZ - 0.04, 0.85, 1.4, 0.06);
  box(glass, gfWinX, 1.35, facadeZ - 0.06, 0.75, 1.3, 0.02);
  box(white, gfWinX, 1.35, facadeZ - 0.07, 0.04, 1.35, 0.03);
  box(white, gfWinX, 1.35, facadeZ - 0.07, 0.8, 0.04, 0.03);

  // Scooter parked on the porch
  buildScooter(ctx, porchCenterX - 0.5, 1.35, dark);

  // ---------------------------------------------------------------------------
  // 3. SECOND FLOOR 3-PANE CASEMENT WINDOW & WHITE CONCRETE HOOD (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const winX = -0.75;
  const winY = 4.12;
  const winZ = facadeZ - 0.06;
  const winW = 1.95;
  const winH = 1.45;

  // Outer white trim border around window
  box(white, winX, winY, winZ - 0.03, winW + 0.12, winH + 0.12, 0.04);
  // Dark window reveal cavity
  box(dark, winX, winY, winZ, winW, winH, 0.05);

  // 3-bay window configuration: Left fixed, Center open casement, Right fixed
  const bayW = winW / 3; // ~0.65

  // Left bay: Fixed glass with white security bars (tralis)
  const leftBayX = winX - bayW;
  box(glass, leftBayX, winY, winZ - 0.02, bayW - 0.08, winH - 0.08, 0.02);
  box(white, leftBayX, winY, winZ - 0.03, bayW, 0.04, 0.03);
  for (let dx = -bayW * 0.3; dx <= bayW * 0.3; dx += 0.15) {
    box(white, leftBayX + dx, winY, winZ - 0.025, 0.016, winH * 0.85, 0.02);
  }

  // Right bay: Fixed glass with white frame
  const rightBayX = winX + bayW;
  box(glass, rightBayX, winY, winZ - 0.02, bayW - 0.08, winH - 0.08, 0.02);
  box(white, rightBayX, winY, winZ - 0.03, bayW, 0.04, 0.03);

  // Center bay: CASEMENT SWUNG OPEN OUTWARD (~30 deg) matching Gambar 2
  const centerBayX = winX;
  const openAngle = 0.55;
  const sashW = bayW - 0.04;
  const hingeX = centerBayX - bayW / 2 + 0.03;
  const sashMidX = hingeX + (Math.cos(openAngle) * sashW) / 2;
  const sashMidZ = winZ - 0.04 - (Math.sin(openAngle) * sashW) / 2;

  box(white, sashMidX, winY, sashMidZ, sashW, winH - 0.08, 0.035, 0, -openAngle);
  box(glass, sashMidX, winY, sashMidZ, sashW - 0.1, winH - 0.18, 0.02, 0, -openAngle);

  // Vertical white mullions separating bays
  box(white, winX - bayW / 2, winY, winZ - 0.035, 0.05, winH, 0.04);
  box(white, winX + bayW / 2, winY, winZ - 0.035, 0.05, winH, 0.04);

  // WHITE CONCRETE HORIZONTAL CANOPY SLAB (TOPI-TOPI BETON PUTIH) - GAMBAR 2
  // Replaced the incorrect terracotta tile roof awning with crisp concrete slab
  const hoodY = 4.95;
  const hoodZ = facadeZ - 0.22;
  const hoodW = winW + 0.45;
  const hoodDepth = 0.46;
  box(white, winX, hoodY, hoodZ, hoodW, 0.09, hoodDepth);
  box(white, winX, hoodY - 0.04, facadeZ - 0.12, hoodW - 0.15, 0.04, 0.24);

  // 3 vertical ventilation slits above the concrete hood (Gambar 2)
  for (let i = -1; i <= 1; i++) {
    const vx = winX + i * 0.32;
    box(dark, vx, 5.25, facadeZ - 0.035, 0.11, 0.28, 0.03);
    box(white, vx, 5.25, facadeZ - 0.03, 0.15, 0.32, 0.015);
  }

  // ---------------------------------------------------------------------------
  // 4. MAIN ROOF, PALE GREEN GABLE & WHITE LISPLANG (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const gableRise = 1.6;
  const gableBase = h;

  // Solid pale green front gable triangle
  emitGable(ctx, pale, 0, gableBase, gableRise, halfW + 0.1, facadeZ);

  // Terracotta roof slopes
  buildGableRoofSlopes(ctx, tile, 0, gableBase, gableRise, halfW + 0.2, facadeZ, facadeZ + depth, 0.35);

  // CRISP WHITE LISPLANG (FASCIA TRIM) ALONG GABLE RAKES (GAMBAR 2)
  beam(white, [-halfW, gableBase, facadeZ - 0.05], [0, gableBase + gableRise, facadeZ - 0.05], 0.065);
  beam(white, [0, gableBase + gableRise, facadeZ - 0.05], [halfW, gableBase, facadeZ - 0.05], 0.065);

  // Circular ventilation medallion in upper gable peak (Gambar 2)
  const medalY = gableBase + 0.78;
  emit(new T.CylinderGeometry(0.24, 0.24, 0.04, 20), white, 0, medalY, facadeZ - 0.04, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(0.25, 0.022, 5, 24), dark, 0, medalY, facadeZ - 0.05);
  box(dark, 0, medalY, facadeZ - 0.055, 0.3, 0.025, 0.02);
  box(dark, 0, medalY, facadeZ - 0.055, 0.025, 0.3, 0.02);

  // Terracotta finial at peak
  cyl(tile, 0, gableBase + gableRise + 0.16, facadeZ - 0.08, 0.05, 0.2);

  // ---------------------------------------------------------------------------
  // 5. STACKED DOUBLE AC UNITS ON RIGHT EXTERIOR WALL (GAMBAR 2)
  // ---------------------------------------------------------------------------
  const acWallX = halfW - 0.2;
  const acWallZ = facadeZ + 0.8;
  for (const acY of [4.1, 4.8]) {
    box(white, acWallX, acY, acWallZ, 0.35, 0.48, 0.75);
    emit(new T.TorusGeometry(0.16, 0.012, 5, 20), dark, acWallX + 0.18, acY, acWallZ, 1, 1, 1, 0, Math.PI / 2);
    box(dark, acWallX, acY - 0.24, acWallZ, 0.38, 0.03, 0.65);
  }
  beam(white, [acWallX + 0.12, 4.8, acWallZ - 0.28], [acWallX + 0.12, 1.2, acWallZ - 0.28], 0.03);

  // ---------------------------------------------------------------------------
  // 6. STEPPED DIVIDER WALL WITH PLANTER BOX & GREENERY (GAMBAR 2)
  // ---------------------------------------------------------------------------
  // Sloping concrete boundary wall between 16 Jl. H. Junen and Pale Green House
  const divX = -halfW + 0.08;
  // Base boundary wall
  box(white, divX, 0.7, front / 2, 0.18, 1.4, front);
  // Slanted top coping
  beam(concrete, [divX, 2.0, front], [divX, 1.15, 0.1], 0.14);

  // Concrete planter trough built into top of boundary wall
  box(concrete, divX, 1.2, front / 2, 0.28, 0.18, front - 0.2);
  // Lush greenery and foliage in the planter box (Gambar 2)
  for (let zz = 0.4; zz < front - 0.2; zz += 0.32) {
    for (let k = 0; k < 4; k++) {
      const a = ctx.random() * Math.PI * 2;
      emit(
        new T.PlaneGeometry(0.38, 0.42),
        materials.leafMats[k % 4],
        divX + Math.sin(a) * 0.1,
        1.34 + ctx.random() * 0.18,
        zz + Math.cos(a) * 0.1,
        1,
        1,
        1,
        0.1,
        a,
        0.1,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 7. FRONT FENCE, GREEN GATE POST & BLACK METAL SLIDING GATE (GAMBAR 2)
  // ---------------------------------------------------------------------------
  // Iconic lime green gate pillar with dark charcoal cap (Gambar 2)
  const gatePostX = -halfW + 0.15;
  box(green, gatePostX, 0.8, 0, 0.32, 1.6, 0.34);
  box(dark, gatePostX, 1.63, 0, 0.38, 0.1, 0.4);

  // Secondary gate post on right
  const rightPostX = halfW - 0.15;
  box(green, rightPostX, 0.75, 0, 0.28, 1.5, 0.3);
  box(dark, rightPostX, 1.53, 0, 0.34, 0.08, 0.36);

  // Black metal sliding gate with vertical pickets
  const gateL = gatePostX + 0.22;
  const gateR = 0.2;
  const gateH = 1.35;
  box(dark, (gateL + gateR) / 2, 0.1, -0.015, gateR - gateL, 0.05, 0.04);
  box(dark, (gateL + gateR) / 2, gateH, -0.015, gateR - gateL, 0.05, 0.04);
  for (let x = gateL + 0.1; x <= gateR - 0.05; x += 0.13) {
    box(dark, x, gateH / 2, -0.015, 0.022, gateH - 0.05, 0.03);
  }
}
