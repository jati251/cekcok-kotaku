import type { WorldContext } from '../../types';
import { getRoadPoint } from '../../../neighborhood';

/**
 * Builds the dense surrounding urban kampung rooftops ("Laut Genteng")
 * matching the authentic Google Maps satellite view of Kalisari / Jl. H. Junen.
 *
 * Spans X from -95 to +95 and Z from -80 to +160 outside the street corridors.
 * All geometry is emitted through material buckets and merged spatially,
 * resulting in 0 extra draw calls and optimal WebGL performance.
 */
export function buildKampungRooftops(ctx: WorldContext) {
  const { box, cyl, materials: m } = ctx;

  const roofMats = [m.tile, m.terracottaTile, m.roofGrey, m.clay, m.tile, m.terracottaTile];
  const wallMats = [m.wallDefault, m.cream, m.pale, m.wallGray, m.white, m.kamprot];

  // Grid layout parameters for dense residential compounds ("Laut Genteng")
  const zMin = -72;
  const zMax = 148;
  const zStep = 7.8;

  // 1. South residential block (Photo-left: X negative)
  for (let z = zMin; z <= zMax; z += zStep) {
    const pt = getRoadPoint(z);
    for (let x = -10; x >= -88; x -= 7.8) {
      const distFromRoad = pt.x - x;

      // Ensure flush alignment behind street properties without clipping into them
      let minDist = 10.8;
      // Wider properties along South:
      if (z >= -50 && z <= -18) minDist = 13.5; // Kumpul Kopi & Toke Painting
      if (z >= 74 && z <= 124) minDist = 13.5;  // House 17, 18, 19

      if (distFromRoad < minDist) continue;

      const pseudoRand = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      const r = pseudoRand - Math.floor(pseudoRand);

      const w = 6.4 + (r * 2.8);
      const d = 6.6 + ((r * 7.1) % 1) * 2.4;
      const h = 3.6 + ((r * 3.7) % 1) * 2.2;
      const roofMat = roofMats[Math.floor(r * roofMats.length) % roofMats.length];
      const wallMat = wallMats[Math.floor((r * 5.3) % 1 * wallMats.length) % wallMats.length];

      // House body
      box(wallMat, x, h / 2, z, w, h, d);

      // Pitched terracotta / zinc roof (main gable/hip roof volume)
      const roofPitch = 1.1 + ((r * 2.1) % 1) * 0.7;
      box(roofMat, x, h + roofPitch / 2, z, w + 0.4, roofPitch, d + 0.4);

      // Parapet firewall line (pembatas dinding rumah tetangga)
      if (r > 0.45) {
        box(m.white, x + w / 2, h + 0.3, z, 0.22, 0.6, d + 0.3);
      }

      // Rooftop water tank tower (toren air Penguin)
      if (r > 0.72) {
        const tx = x + (r > 0.85 ? 1.6 : -1.6);
        const tz = z + (r > 0.8 ? 1.4 : -1.4);
        const legH = h + roofPitch + 0.4;
        box(m.dark, tx, legH / 2, tz, 0.45, legH, 0.45);
        cyl(m.tankMat, tx, legH + 0.65, tz, 0.42, 0.95);
      }

      // Tropical backyard trees nestled between rooftops
      if (r < 0.28) {
        const treeMat = m.leafMats[Math.floor(r * m.leafMats.length * 3) % m.leafMats.length];
        const treeX = x + w * 0.45 + 0.8;
        const treeZ = z + d * 0.35;
        const treeH = 4.2 + r * 2.5;
        box(treeMat, treeX, treeH, treeZ, 3.2, 3.6, 3.2);
        box(m.wood, treeX, treeH / 2, treeZ, 0.28, treeH, 0.28);
      }
    }
  }

  // 2. North residential block (Photo-right: X positive)
  for (let z = zMin; z <= zMax; z += zStep) {
    const pt = getRoadPoint(z);
    for (let x = 10; x <= 88; x += 7.8) {
      const distFromRoad = x - pt.x;

      // Exclude main street corridor and special North properties / alley branches
      let minDist = 10.8;
      if (z >= -38 && z <= -18) minDist = 14.8; // Badminton Hall & Parking apron
      if (z >= 6 && z <= 12 && x < 24) continue; // Water tank alley branch (Jl. H. Junen II)
      if (z >= 66 && z <= 76 && x < 26) continue; // Gg. Kresek VI branch alley
      if (z >= 88 && z <= 106) minDist = 13.5;  // House 18
      if (z >= 126 && z <= 145 && x < 26) continue; // Warkop H. Junen & Jl. Lestari

      if (distFromRoad < minDist) continue;

      const pseudoRand = Math.cos(x * 37.719 + z * 91.13) * 28741.837;
      const r = pseudoRand - Math.floor(pseudoRand);

      const w = 6.4 + (r * 2.8);
      const d = 6.6 + ((r * 5.7) % 1) * 2.4;
      const h = 3.5 + ((r * 4.1) % 1) * 2.4;
      const roofMat = roofMats[Math.floor(r * roofMats.length) % roofMats.length];
      const wallMat = wallMats[Math.floor((r * 6.7) % 1 * wallMats.length) % wallMats.length];

      // House body
      box(wallMat, x, h / 2, z, w, h, d);

      // Pitched roof
      const roofPitch = 1.1 + ((r * 2.4) % 1) * 0.65;
      box(roofMat, x, h + roofPitch / 2, z, w + 0.4, roofPitch, d + 0.4);

      // Neighboring parapet firewall
      if (r > 0.4) {
        box(m.white, x - w / 2, h + 0.3, z, 0.22, 0.6, d + 0.3);
      }

      // Rooftop water tank
      if (r > 0.68) {
        const tx = x + (r > 0.8 ? -1.5 : 1.5);
        const tz = z + (r > 0.75 ? -1.4 : 1.4);
        const legH = h + roofPitch + 0.4;
        box(m.dark, tx, legH / 2, tz, 0.45, legH, 0.45);
        cyl(m.aquaBlue, tx, legH + 0.65, tz, 0.44, 0.95);
      }

      // Tropical trees between compounds
      if (r < 0.26) {
        const treeMat = m.leafMats[Math.floor(r * m.leafMats.length * 4) % m.leafMats.length];
        const treeX = x - w * 0.45 - 0.8;
        const treeZ = z - d * 0.35;
        const treeH = 4.4 + r * 2.8;
        box(treeMat, treeX, treeH, treeZ, 3.4, 3.8, 3.4);
        box(m.wood, treeX, treeH / 2, treeZ, 0.28, treeH, 0.28);
      }
    }
  }
}
