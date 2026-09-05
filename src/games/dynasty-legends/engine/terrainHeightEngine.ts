import { createNoise2D } from 'simplex-noise';

// Seeded noise generator for deterministic, seamless battlefield heightmap
const noise2D = createNoise2D(() => 0.42);

export const RIVER_WATER_Y = -0.55;
export const RIVER_BED_DEPTH = -1.75;
export const RIVER_HALF_WIDTH = 13.5;
export const RIVER_WATER_HALF_WIDTH = 9.5;

// Main Imperial Arch Bridge coordinate constants
export const MAIN_BRIDGE_CENTER = { x: -32, z: -32 };
export const MAIN_BRIDGE_HALF_LEN = 15;
export const MAIN_BRIDGE_HALF_WID = 5.6;

// Northern Flank Wooden Bridge coordinate constants
export const FLANK_BRIDGE_CENTER = { x: -7.5, z: 48 };
export const FLANK_BRIDGE_HALF_LEN = 13;
export const FLANK_BRIDGE_HALF_WID = 3.6;

/**
 * Calculates continuous organic centerline X of the river at longitudinal coordinate Z
 */
export function getRiverCenterX(z: number): number {
  return -25 + Math.sin((z + 32) * 0.018) * 7 + (z + 32) * 0.22 - 7;
}

/**
 * Calculates continuous terrain elevation Y at coordinate (x, z)
 * Features:
 * - Bridge deck elevation integration so characters cross naturally over water
 * - Smooth natural U-shaped river valley depression
 * - Flat highway thoroughfare and military camps
 * - Rolling hills in outer battlefield sectors
 */
export function getTerrainHeight(x: number, z: number): number {
  // 1. Check if coordinate falls on Main Imperial Stone Arch Bridge (x = z crossing)
  const mainAlong = ((x - MAIN_BRIDGE_CENTER.x) + (z - MAIN_BRIDGE_CENTER.z)) * 0.7071;
  const mainPerp = Math.abs((x - MAIN_BRIDGE_CENTER.x) - (z - MAIN_BRIDGE_CENTER.z)) * 0.7071;

  if (Math.abs(mainAlong) <= MAIN_BRIDGE_HALF_LEN && mainPerp <= MAIN_BRIDGE_HALF_WID) {
    const archNorm = mainAlong / MAIN_BRIDGE_HALF_LEN;
    const archFactor = Math.max(0, 1 - archNorm * archNorm);
    // Smooth transition from road level (0.15m) up to graceful bridge crown (1.35m)
    return 0.15 + 1.2 * archFactor;
  }

  // 2. Check if coordinate falls on Northern Flank Wooden Bridge (village crossing)
  const flankDistX = Math.abs(x - FLANK_BRIDGE_CENTER.x);
  const flankDistZ = Math.abs(z - FLANK_BRIDGE_CENTER.z);

  if (flankDistX <= FLANK_BRIDGE_HALF_LEN && flankDistZ <= FLANK_BRIDGE_HALF_WID) {
    const timberNorm = flankDistX / FLANK_BRIDGE_HALF_LEN;
    const timberArch = Math.max(0, 1 - timberNorm * timberNorm);
    return 0.1 + 0.65 * timberArch;
  }

  // 3. Distance from curved River channel
  const riverCenterX = getRiverCenterX(z);
  const distFromRiver = Math.abs(x - riverCenterX);

  // If inside river valley, sculpt smooth cosine riverbed depression
  if (distFromRiver < RIVER_HALF_WIDTH) {
    const t = distFromRiver / RIVER_HALF_WIDTH; // 0 at river center, 1 at bank edge
    const riverbed = RIVER_BED_DEPTH * 0.5 * (1 + Math.cos(t * Math.PI));
    return riverbed;
  }

  // 4. Distance from diagonal Highway Road (x - z = 0)
  const distFromRoad = Math.abs(x - z) * 0.7071;

  // 5. Distance from Military Encampments
  const distToAlliedBase = Math.hypot(x - (-85), z - (-85));
  const distToEnemyBase = Math.hypot(x - 120, z - 120);

  // 6. Natural rolling hills using 2 octaves of fractal Simplex Noise
  const hillScale1 = 0.007;
  const hillScale2 = 0.018;
  const rawNoise =
    noise2D(x * hillScale1, z * hillScale1) * 3.4 +
    noise2D(x * hillScale2, z * hillScale2) * 1.4;

  // Outer perimeter rises into mountain foothills
  const distFromCenter = Math.hypot(x, z);
  const outerRamp = distFromCenter > 220 ? Math.min(6.0, (distFromCenter - 220) * 0.035) : 0;

  let height = Math.max(0, rawNoise) + outerRamp;

  // Smoothly blend down towards river banks so the terrain gently meets the river valley
  if (distFromRiver < RIVER_HALF_WIDTH + 8) {
    const bankBlend = (distFromRiver - RIVER_HALF_WIDTH) / 8;
    height *= Math.min(1, Math.max(0, bankBlend));
  }

  // Smoothly flatten Highway corridor
  if (distFromRoad < 22) {
    const roadBlend = Math.max(0, (distFromRoad - 9) / 13);
    height *= roadBlend * roadBlend;
  }

  // Flatten Allied & Enemy Bases for structured encampments
  if (distToAlliedBase < 35) {
    const baseBlend = Math.max(0, (distToAlliedBase - 20) / 15);
    height *= baseBlend;
  } else if (distToEnemyBase < 35) {
    const baseBlend = Math.max(0, (distToEnemyBase - 20) / 15);
    height *= baseBlend;
  }

  return height;
}

