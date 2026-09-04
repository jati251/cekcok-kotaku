import type { TurretEntity, BaseCoreEntity } from '../types/map';
import { MAP_BOUNDS } from '../constants/mapData';

/**
 * Resolves hard radial collisions between dynamic entities (heroes, minions)
 * and static map obstacles (standing defense turrets and base cores).
 * Smoothly pushes the entity outward along the collision normal.
 */
export function resolveEntityObstacleCollisions(
  pos: { x: number; y?: number; z: number },
  turrets: TurretEntity[],
  cores: BaseCoreEntity[],
  entityRadius: number = 0.55
): boolean {
  let hasCollided = false;

  // 1. Arena Perimeter Boundary Clamping
  const halfBoundary = MAP_BOUNDS.size / 2 - 2.5; // ~52.5
  if (pos.x < -halfBoundary) {
    pos.x = -halfBoundary;
    hasCollided = true;
  } else if (pos.x > halfBoundary) {
    pos.x = halfBoundary;
    hasCollided = true;
  }
  if (pos.z < -halfBoundary) {
    pos.z = -halfBoundary;
    hasCollided = true;
  } else if (pos.z > halfBoundary) {
    pos.z = halfBoundary;
    hasCollided = true;
  }

  // 2. Standing Turrets (Base radius 1.9m + entityRadius)
  const turretMinDist = 1.9 + entityRadius;
  const turretMinDistSq = turretMinDist * turretMinDist;

  for (let i = 0; i < turrets.length; i++) {
    const t = turrets[i];
    if (t.isDestroyed) continue;

    const dx = pos.x - t.position.x;
    const dz = pos.z - t.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < turretMinDistSq && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const push = turretMinDist - dist;
      pos.x += (dx / dist) * push;
      pos.z += (dz / dist) * push;
      hasCollided = true;
    }
  }

  // 3. Standing Base Cores (Platform radius 3.6m + entityRadius)
  const coreMinDist = 3.6 + entityRadius;
  const coreMinDistSq = coreMinDist * coreMinDist;

  for (let i = 0; i < cores.length; i++) {
    const c = cores[i];
    if (c.isDestroyed) continue;

    const dx = pos.x - c.position.x;
    const dz = pos.z - c.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < coreMinDistSq && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const push = coreMinDist - dist;
      pos.x += (dx / dist) * push;
      pos.z += (dz / dist) * push;
      hasCollided = true;
    }
  }

  return hasCollided;
}
