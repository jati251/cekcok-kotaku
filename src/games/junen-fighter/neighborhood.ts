// Coordinates are estimated metres, with +z following photos 2, 3, 6, 9 and 10.
// Property side is photograph-relative: +1 right, -1 left. World x is reversed.
// Image evidence fixes adjacency; it does not establish survey coordinates.
export const LANE = {
  halfWidth: 2.25,
  start: -65,
  end: 138,
  combatEnd: 63.8,
  junctionStart: 7,
  junctionEnd: 10,
  junctionDepth: 8,
  kresekStart: 68.5,
  kresekEnd: 73.5,
  kresekDepth: 8,
};
export const FRONTAGE = LANE.halfWidth + .37;

// Spline control waypoints representing authentic gentle S-curve of Jl. H. Junen
// (z, localX, halfWidth). Local +X is photo-right (side: 1).
// +z = WEST (towards Gg. Kresek VI, House 17-19, and Jl. Lestari)
// -z = EAST (towards Ksa Sport Badminton Hall, Kumpul Kopi, GM Motor, Jl. Bambu Indah)
const ROAD_CONTROL_POINTS: [number, number, number][] = [
  [-68, 2.5, 2.8],    // East terminus / Jl. Bambu Indah & GM Motor
  [-52, 1.6, 2.4],    // GM Motor workshop bend
  [-36, 0.7, 2.3],    // Toke Painting & approach to Ksa Sport
  [-22, 0.2, 2.3],    // Ksa Sport Badminton Hall & Kumpul Kopi Kalisari
  [-10, 0.05, 2.25],  // House 16 frontage approach
  [0, 0.0, 2.25],     // 16 Jl. H. Junen entrance (core start)
  [8, 0.35, 2.45],    // Water tank alley (Jl. H. Junen II)
  [18, -0.65, 2.2],   // Turquoise house
  [30, -1.85, 2.15],  // Yellow-black house
  [42, -2.45, 2.18],  // White car
  [52, -1.95, 2.3],   // Pink house
  [64, -0.85, 2.25],  // End of core 16 properties
  [71, -0.2, 2.3],    // Gg. Kresek VI T-junction branch
  [84, 0.4, 2.25],    // House 17 Jl. H. Junen (workbench porch)
  [98, 0.9, 2.25],    // House 18 Jl. H. Junen (balcony laundry)
  [115, 1.4, 2.35],   // House 19 Jl. H. Junen (spiral staircase)
  [132, 2.2, 2.6],    // Approach to Jl. Lestari
  [145, 2.8, 2.9],    // Jl. Lestari T-junction
];

// Precompute slopes for Cubic Hermite Spline (C1 continuity)
const ROAD_SLOPES: [number, number][] = (() => {
  const n = ROAD_CONTROL_POINTS.length;
  const slopes: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      const dz = ROAD_CONTROL_POINTS[1][0] - ROAD_CONTROL_POINTS[0][0];
      slopes.push([
        (ROAD_CONTROL_POINTS[1][1] - ROAD_CONTROL_POINTS[0][1]) / dz,
        (ROAD_CONTROL_POINTS[1][2] - ROAD_CONTROL_POINTS[0][2]) / dz,
      ]);
    } else if (i === n - 1) {
      const dz = ROAD_CONTROL_POINTS[n - 1][0] - ROAD_CONTROL_POINTS[n - 2][0];
      slopes.push([
        (ROAD_CONTROL_POINTS[n - 1][1] - ROAD_CONTROL_POINTS[n - 2][1]) / dz,
        (ROAD_CONTROL_POINTS[n - 1][2] - ROAD_CONTROL_POINTS[n - 2][2]) / dz,
      ]);
    } else {
      const dz = ROAD_CONTROL_POINTS[i + 1][0] - ROAD_CONTROL_POINTS[i - 1][0];
      slopes.push([
        (ROAD_CONTROL_POINTS[i + 1][1] - ROAD_CONTROL_POINTS[i - 1][1]) / dz,
        (ROAD_CONTROL_POINTS[i + 1][2] - ROAD_CONTROL_POINTS[i - 1][2]) / dz,
      ]);
    }
  }
  return slopes;
})();

export interface RoadPoint {
  x: number;          // Local road center X (+X is photo-right)
  worldX: number;     // World road center X (-x due to neighborhood scale.x = -1)
  halfWidth: number;  // Half-width at coordinate z
  angle: number;      // Tangent yaw angle in radians
  tangentX: number;   // sin(angle)
  tangentZ: number;   // cos(angle)
  normalX: number;    // cos(angle) - perpendicular pointing towards +X
  normalZ: number;    // -sin(angle)
}

const roadPointCache: RoadPoint = {
  x: 0,
  worldX: 0,
  halfWidth: 2.25,
  angle: 0,
  tangentX: 0,
  tangentZ: 1,
  normalX: 1,
  normalZ: 0,
};

/**
 * Evaluates the road spline curve at longitudinal coordinate z.
 * Fast, allocation-free evaluation with exact analytical C1 derivatives.
 */
export function getRoadPoint(z: number): RoadPoint {
  const pts = ROAD_CONTROL_POINTS;
  const n = pts.length;

  let idx = 0;
  if (z <= pts[0][0]) {
    idx = 0;
  } else if (z >= pts[n - 1][0]) {
    idx = n - 2;
  } else {
    for (let i = 0; i < n - 1; i++) {
      if (z >= pts[i][0] && z <= pts[i + 1][0]) {
        idx = i;
        break;
      }
    }
  }

  const p0 = pts[idx];
  const p1 = pts[idx + 1];
  const m0 = ROAD_SLOPES[idx];
  const m1 = ROAD_SLOPES[idx + 1];
  const dz = p1[0] - p0[0];
  const t = Math.max(0, Math.min(1, (z - p0[0]) / dz));

  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  const x = h00 * p0[1] + h10 * dz * m0[0] + h01 * p1[1] + h11 * dz * m1[0];
  const halfWidth = h00 * p0[2] + h10 * dz * m0[1] + h01 * p1[2] + h11 * dz * m1[1];

  // Derivative dx/dz
  const dh00 = (6 * t2 - 6 * t) / dz;
  const dh10 = 3 * t2 - 4 * t + 1;
  const dh01 = (-6 * t2 + 6 * t) / dz;
  const dh11 = 3 * t2 - 2 * t;

  const dx_dz = dh00 * p0[1] + dh10 * m0[0] + dh01 * p1[1] + dh11 * m1[0];
  const angle = Math.atan2(dx_dz, 1);

  roadPointCache.x = x;
  roadPointCache.worldX = -x;
  roadPointCache.halfWidth = halfWidth;
  roadPointCache.angle = angle;
  roadPointCache.tangentX = Math.sin(angle);
  roadPointCache.tangentZ = Math.cos(angle);
  roadPointCache.normalX = Math.cos(angle);
  roadPointCache.normalZ = -Math.sin(angle);

  return roadPointCache;
}

export function getWorldRoadCenter(z: number): number {
  return getRoadPoint(z).worldX;
}

export function getLocalRoadCenter(z: number): number {
  return getRoadPoint(z).x;
}

export type PropertyKind = 'white-scroll' | 'green-tank' | 'turquoise' | 'gray' | 'low-yard' | 'pink' | 'tree-court' | 'pale-green' | 'cream-carport' | 'pine-court' | 'blue-low' | 'yellow-black' | 'white-car' | 'laundry' | 'green-car';
export type Property = { id: PropertyKind; side: -1 | 1; start: number; width: number; height: number; depth: number; setback: number; photos: number[] };
export const PROPERTIES: Property[] = [
  { id: 'white-scroll', side: 1, start: -3, width: 10, height: 3.4, depth: 6, setback: 2.4, photos: [1, 2] },
  { id: 'green-tank', side: 1, start: 10, width: 8, height: 2.8, depth: 5, setback: 2.1, photos: [4] },
  { id: 'turquoise', side: 1, start: 18, width: 8, height: 3.3, depth: 6, setback: 2.5, photos: [6] },
  { id: 'gray', side: 1, start: 26, width: 7, height: 3.5, depth: 6, setback: 2.6, photos: [9] },
  { id: 'low-yard', side: 1, start: 33, width: 13, height: 2.5, depth: 5, setback: 3, photos: [11] },
  { id: 'pink', side: 1, start: 46, width: 10, height: 7.7, depth: 7, setback: 1.7, photos: [13] },
  { id: 'tree-court', side: -1, start: -1, width: 6, height: 6.0, depth: 6, setback: 3, photos: [1, 3] },
  { id: 'pale-green', side: -1, start: 5, width: 6, height: 5.5, depth: 6, setback: 2.1, photos: [5] },
  { id: 'cream-carport', side: -1, start: 11, width: 6, height: 6, depth: 6, setback: 3.4, photos: [5] },
  { id: 'pine-court', side: -1, start: 17, width: 7, height: 3, depth: 6, setback: 3.5, photos: [5, 7] },
  { id: 'blue-low', side: -1, start: 24, width: 6, height: 2.7, depth: 5, setback: 1.8, photos: [7] },
  { id: 'yellow-black', side: -1, start: 30, width: 12, height: 5.8, depth: 6, setback: 3.4, photos: [8] },
  { id: 'white-car', side: -1, start: 42, width: 6, height: 3.4, depth: 6, setback: 3.8, photos: [10] },
  { id: 'laundry', side: -1, start: 48, width: 7, height: 3.5, depth: 5, setback: 2.8, photos: [10] },
  { id: 'green-car', side: -1, start: 55, width: 8, height: 3.6, depth: 5, setback: 4.1, photos: [12] },
];
export const LANDMARK_STAGES = [14, 23, 50];
export const PHOTO_VIEWS: { photo: number; label: string; eye: [number, number, number]; target: [number, number, number] }[] = [
  { photo: 1, label: 'Street entrance', eye: [getWorldRoadCenter(1), 2.1, 1], target: [getWorldRoadCenter(15), 2, 15] },
  { photo: 2, label: 'White corner house', eye: [getWorldRoadCenter(2) + 1.2, 2.2, 2], target: [getWorldRoadCenter(2) - 5, 2.5, 2] },
  { photo: 3, label: 'White balcony and tree court', eye: [getWorldRoadCenter(1) - 1.2, 2.2, 1], target: [getWorldRoadCenter(1) + 5, 3.0, 1] },
  { photo: 4, label: 'Green house and orange tank', eye: [getWorldRoadCenter(14) + 1.2, 2.0, 14], target: [getWorldRoadCenter(14) - 5, 2.5, 14] },
  { photo: 5, label: 'Cream carport and pale-green house', eye: [getWorldRoadCenter(14) - 0.4, 1.85, 14], target: [getWorldRoadCenter(14) + 5.5, 2.7, 14] },
  { photo: 6, label: 'Turquoise house', eye: [getWorldRoadCenter(22) + 1.2, 2.2, 22], target: [getWorldRoadCenter(22) - 5, 2.7, 22] },
  { photo: 7, label: 'Blue house and flower garden', eye: [getWorldRoadCenter(27) - 1.2, 2.2, 27], target: [getWorldRoadCenter(27) + 5, 2.2, 27] },
  { photo: 8, label: 'Yellow house and black gate', eye: [getWorldRoadCenter(36) - 1.2, 2.2, 36], target: [getWorldRoadCenter(36) + 5, 2.8, 36] },
  { photo: 9, label: 'Gray house and vine wall', eye: [getWorldRoadCenter(29.5) + 1.2, 2.2, 29.5], target: [getWorldRoadCenter(29.5) - 5, 2.1, 29.5] },
  { photo: 10, label: 'White car and laundry', eye: [getWorldRoadCenter(45) - 1.2, 2.2, 45], target: [getWorldRoadCenter(45) + 5, 2.1, 45] },
  { photo: 11, label: 'Low house and open yard', eye: [getWorldRoadCenter(39.5) + 1.2, 2.2, 39.5], target: [getWorldRoadCenter(39.5) - 5, 2, 39.5] },
  { photo: 12, label: 'Green car and lattice gate', eye: [getWorldRoadCenter(59) - 1.2, 2.3, 59], target: [getWorldRoadCenter(59) + 5, 2.2, 59] },
  { photo: 13, label: 'Pink tiled house and balcony', eye: [getWorldRoadCenter(51) + 1.2, 2.3, 51], target: [getWorldRoadCenter(51) - 5, 3.7, 51] },
  { photo: 14, label: 'Street view down: Node 4 (White car & laundry)', eye: [getWorldRoadCenter(42), 2.0, 42], target: [getWorldRoadCenter(58), 1.9, 58] },
  { photo: 15, label: 'Street view down: Node 5 (Green car & pink house end)', eye: [getWorldRoadCenter(52), 2.0, 52], target: [getWorldRoadCenter(65), 1.9, 65] },
  { photo: 16, label: 'Gg. Kresek VI Branch Alley & Graffiti Corner', eye: [getWorldRoadCenter(63) + 1.2, 2.1, 63], target: [getWorldRoadCenter(68) - 3.8, 2.0, 68] },
  { photo: 17, label: 'House 17 (Workbench Porch) & House 18', eye: [getWorldRoadCenter(78) - 1.2, 2.1, 77], target: [getWorldRoadCenter(83) + 4.5, 2.0, 83] },
  { photo: 18, label: 'House 19 Iconic Outdoor White Spiral Staircase', eye: [getWorldRoadCenter(108) - 1.8, 2.2, 107], target: [getWorldRoadCenter(114) + 4.2, 2.2, 114] },
  { photo: 19, label: 'West Junction: Jl. Lestari & Warkop H. Junen', eye: [getWorldRoadCenter(126), 2.2, 125], target: [getWorldRoadCenter(134) - 4.5, 2.2, 134] },
  { photo: 20, label: 'Ksa Sport Badminton Hall', eye: [getWorldRoadCenter(-18) + 1.2, 2.3, -16], target: [getWorldRoadCenter(-27) - 6.5, 3.2, -27] },
  { photo: 21, label: 'Kumpul Kopi Kalisari Wooden Terrace', eye: [getWorldRoadCenter(-22) - 1.2, 2.1, -21], target: [getWorldRoadCenter(-29) + 4.8, 2.2, -29] },
  { photo: 22, label: 'East Junction: GM Motor & Jl. Bambu Indah', eye: [getWorldRoadCenter(-48), 2.2, -46], target: [getWorldRoadCenter(-58) - 3.5, 2.1, -58] },
  { photo: 23, label: 'Full Neighborhood Satellite Overview', eye: [25, 120, 35], target: [-5, 0, 35] },
  { photo: 24, label: '16 Jl. H. Junen East Corridor (Street View Ref)', eye: [getWorldRoadCenter(0.5), 1.9, 0.5], target: [getWorldRoadCenter(-14), 1.75, -14] },
];

export function laneBounds(z: number, radius = .32): [number, number] {
  const pt = getRoadPoint(z);
  const cx = pt.worldX;
  const hw = pt.halfWidth;
  const inTankJunction = z >= LANE.junctionStart + radius && z <= LANE.junctionEnd - radius;
  const inKresekJunction = z >= LANE.kresekStart + radius && z <= LANE.kresekEnd - radius;

  const left = inTankJunction
    ? -LANE.junctionDepth + radius
    : inKresekJunction
    ? cx - hw - LANE.kresekDepth + radius
    : cx - hw + radius;

  return [left, cx + hw - radius];
}

export function constrainToLane(body: { x: number; z: number }, previousX: number) {
  const inTankZ = body.z >= LANE.junctionStart - 0.5 && body.z <= LANE.junctionEnd + 0.5;
  const inKresekZ = body.z >= LANE.kresekStart - 0.5 && body.z <= LANE.kresekEnd + 0.5;
  const pt = getRoadPoint(body.z);
  const mainLaneLeft = pt.worldX - pt.halfWidth + 0.32;

  if (inTankZ && previousX < mainLaneLeft && body.x < mainLaneLeft) {
    body.z = Math.max(LANE.junctionStart + .32, Math.min(LANE.junctionEnd - .32, body.z));
  }
  if (inKresekZ && previousX < mainLaneLeft && body.x < mainLaneLeft) {
    body.z = Math.max(LANE.kresekStart + .32, Math.min(LANE.kresekEnd - .32, body.z));
  }
  body.z = Math.max(LANE.start, Math.min(LANE.end, body.z));
  const [left, right] = laneBounds(body.z);
  body.x = Math.max(left, Math.min(right, body.x));
}

