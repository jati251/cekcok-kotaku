import { createNoise2D } from 'simplex-noise';

// Seeded noise generator for deterministic, seamless battlefield heightmap
const noise2D = createNoise2D(() => 0.42);

/**
 * Calculates continuous terrain elevation Y at coordinate (x, z)
 * Features:
 * - Smooth, flat main highway thoroughfare for unhindered combat
 * - Flattened military clearings for Allied & Enemy camps
 * - Natural river valley depression
 * - Rolling hills (2.0m to 6.5m) in outer meadows and mountain foothills
 */
export function getTerrainHeight(x: number, z: number): number {
  // 1. Distance from the diagonal Highway Road (x - z = 0, rotated by 45 degrees)
  // Distance from point (x, z) to line x = z is |x - z| / sqrt(2)
  const distFromRoad = Math.abs(x - z) * 0.7071;

  // 2. Distance from Allied Base (-85, -85) and Enemy Base (120, 120)
  const distToAlliedBase = Math.hypot(x - (-85), z - (-85));
  const distToEnemyBase = Math.hypot(x - 120, z - 120);

  // 3. Distance from River channel (approx x = -25 + z * 0.22)
  const riverCenterX = -25 + z * 0.22;
  const distFromRiver = Math.abs(x - riverCenterX);

  // If inside the river channel, carve a natural water trench
  if (distFromRiver < 13) {
    const riverTrenchFactor = 1 - distFromRiver / 13;
    return -0.38 * riverTrenchFactor;
  }

  // Base natural rolling hills using 2 octaves of fractal Simplex Noise
  const hillScale1 = 0.008;
  const hillScale2 = 0.02;
  const rawNoise =
    noise2D(x * hillScale1, z * hillScale1) * 3.8 +
    noise2D(x * hillScale2, z * hillScale2) * 1.6;

  // Outer rim rises higher into mountain foothills
  const distFromCenter = Math.hypot(x, z);
  const outerRamp = distFromCenter > 220 ? Math.min(6.5, (distFromCenter - 220) * 0.04) : 0;

  let height = Math.max(0, rawNoise) + outerRamp;

  // Flatten the Highway corridor smoothly
  if (distFromRoad < 22) {
    const roadBlend = Math.max(0, (distFromRoad - 9) / 13);
    height *= roadBlend * roadBlend; // Smooth quadratic falloff
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
