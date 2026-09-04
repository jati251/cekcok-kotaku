import type { MinionEntity, Lane, TurretEntity, BaseCoreEntity } from '../types/map';
import type { Team } from '../types/hero';
import { LANE_WAYPOINTS } from '../constants/mapData';
import { resolveEntityObstacleCollisions } from './collisionEngine';

let minionIdCounter = 1;

export function spawnMinionWave(
  team: Team,
  lane: Lane,
  isSuperWave: boolean = false
): MinionEntity[] {
  const waypoints = LANE_WAYPOINTS[lane][team];
  const spawnPoint = waypoints[0];

  const minions: MinionEntity[] = [];

  // 1. Melee Swordsman (Stops at 2.8m, tanks turret)
  minions.push({
    id: `minion_${team}_${lane}_melee_${minionIdCounter++}`,
    lane,
    team,
    type: 'melee',
    maxHp: 1150,
    currentHp: 1150,
    physicalAttack: 55,
    physicalDefense: 18,
    attackSpeed: 1.0,
    attackRange: 2.8,
    movementSpeed: 5.4,
    position: { x: spawnPoint.x + (Math.random() - 0.5) * 1.5, y: 0, z: spawnPoint.z + (Math.random() - 0.5) * 1.5 },
    rotationY: 0,
    waypointIndex: 1,
    targetEntityId: null,
    isDead: false,
    goldReward: 65,
    expReward: 85,
  });

  // 2. Ranged Mage (Stops at 5.5m)
  minions.push({
    id: `minion_${team}_${lane}_ranged_${minionIdCounter++}`,
    lane,
    team,
    type: 'ranged',
    maxHp: 750,
    currentHp: 750,
    physicalAttack: 75,
    physicalDefense: 10,
    attackSpeed: 1.1,
    attackRange: 5.5,
    movementSpeed: 5.2,
    position: { x: spawnPoint.x + (Math.random() - 0.5) * 1.5, y: 0, z: spawnPoint.z + (Math.random() - 0.5) * 1.5 },
    rotationY: 0,
    waypointIndex: 1,
    targetEntityId: null,
    isDead: false,
    goldReward: 60,
    expReward: 80,
  });

  // 3. Siege Cannon / Super Minion
  minions.push({
    id: `minion_${team}_${lane}_siege_${minionIdCounter++}`,
    lane,
    team,
    type: isSuperWave ? 'super' : 'siege',
    maxHp: isSuperWave ? 2800 : 1600,
    currentHp: isSuperWave ? 2800 : 1600,
    physicalAttack: isSuperWave ? 150 : 100,
    physicalDefense: isSuperWave ? 30 : 20,
    attackSpeed: 0.9,
    attackRange: 6.0,
    movementSpeed: 4.8,
    position: { x: spawnPoint.x + (Math.random() - 0.5) * 1.5, y: 0, z: spawnPoint.z + (Math.random() - 0.5) * 1.5 },
    rotationY: 0,
    waypointIndex: 1,
    targetEntityId: null,
    isDead: false,
    goldReward: isSuperWave ? 120 : 95,
    expReward: isSuperWave ? 150 : 110,
  });

  return minions;
}

export function updateMinionMovementAndCombat(
  minions: MinionEntity[],
  opposingMinions: MinionEntity[],
  dt: number,
  turrets?: TurretEntity[],
  cores?: Record<'blue' | 'red', BaseCoreEntity>
) {
  const hostileTeam = minions.length > 0 && minions[0].team === 'blue' ? 'red' : 'blue';

  minions.forEach((minion) => {
    if (minion.isDead) return;

    // 1. Check for opposing minions in attack range
    let closestMinion: MinionEntity | null = null;
    let minMinionDist = minion.attackRange;

    for (const opp of opposingMinions) {
      if (opp.isDead) continue;
      const dist = Math.hypot(opp.position.x - minion.position.x, opp.position.z - minion.position.z);
      if (dist < minMinionDist) {
        minMinionDist = dist;
        closestMinion = opp;
      }
    }

    if (closestMinion) {
      minion.targetEntityId = closestMinion.id;
      minion.rotationY = Math.atan2(
        closestMinion.position.x - minion.position.x,
        closestMinion.position.z - minion.position.z
      );
      closestMinion.currentHp -= minion.physicalAttack * dt * minion.attackSpeed;
      if (closestMinion.currentHp <= 0) {
        closestMinion.isDead = true;
        minion.targetEntityId = null;
      }
      return;
    }

    // 2. Check for standing Hostile Turrets in this lane
    if (turrets) {
      // Find the next active hostile turret in this lane
      // Ordered by priority: outer -> inner -> base
      const laneTurrets = turrets.filter(
        (t) => !t.isDestroyed && t.team === hostileTeam && t.lane === minion.lane
      );

      const nextTurret = laneTurrets[0]; // First standing turret in lane
      if (nextTurret) {
        const distToTurret = Math.hypot(
          nextTurret.position.x - minion.position.x,
          nextTurret.position.z - minion.position.z
        );

        // If within sight/approach range (15 units)
        if (distToTurret <= 15) {
          const dx = nextTurret.position.x - minion.position.x;
          const dz = nextTurret.position.z - minion.position.z;
          minion.rotationY = Math.atan2(dx, dz);

          // Stop at attack range (and keep at least 2.8m distance to never clip inside!)
          const stopDistance = Math.max(2.8, minion.attackRange * 0.95);

          if (distToTurret > stopDistance) {
            // March toward the turret perimeter
            const step = Math.min(distToTurret - stopDistance, minion.movementSpeed * dt);
            minion.position.x += (dx / distToTurret) * step;
            minion.position.z += (dz / distToTurret) * step;
            if (turrets && cores) {
              resolveEntityObstacleCollisions(minion.position, turrets, Object.values(cores), 0.45);
            }
          } else {
            // STOP AND ATTACK TURRET!
            minion.targetEntityId = nextTurret.id;
            nextTurret.currentHp -= minion.physicalAttack * dt * minion.attackSpeed * 0.9;
          }
          // Do NOT advance along waypoints while a hostile turret stands in the lane!
          return;
        }
      }
    }

    // 3. Check for Hostile Base Core if all turrets in lane are down
    if (cores) {
      const enemyCore = cores[hostileTeam];
      if (!enemyCore.isDestroyed) {
        const distToCore = Math.hypot(
          enemyCore.position.x - minion.position.x,
          enemyCore.position.z - minion.position.z
        );

        if (distToCore <= 16) {
          const dx = enemyCore.position.x - minion.position.x;
          const dz = enemyCore.position.z - minion.position.z;
          minion.rotationY = Math.atan2(dx, dz);
          const stopDist = Math.max(4.6, minion.attackRange);

          if (distToCore > stopDist) {
            const step = Math.min(distToCore - stopDist, minion.movementSpeed * dt);
            minion.position.x += (dx / distToCore) * step;
            minion.position.z += (dz / distToCore) * step;
            if (turrets) {
              resolveEntityObstacleCollisions(minion.position, turrets, Object.values(cores), 0.45);
            }
          } else {
            minion.targetEntityId = enemyCore.id;
            enemyCore.currentHp -= minion.physicalAttack * dt * minion.attackSpeed * 0.8;
          }
          return;
        }
      }
    }

    // 4. Otherwise advance along waypoints
    const waypoints = LANE_WAYPOINTS[minion.lane][minion.team];
    const targetWp = waypoints[minion.waypointIndex];
    if (!targetWp) return;

    const dx = targetWp.x - minion.position.x;
    const dz = targetWp.z - minion.position.z;
    const distToWp = Math.hypot(dx, dz);

    if (distToWp < 2.5) {
      if (minion.waypointIndex < waypoints.length - 1) {
        minion.waypointIndex += 1;
      }
    } else {
      const step = minion.movementSpeed * dt;
      minion.position.x += (dx / distToWp) * step;
      minion.position.z += (dz / distToWp) * step;
      minion.rotationY = Math.atan2(dx, dz);
    }

    // Always resolve obstacle collision against any standing turrets or base cores
    if (turrets && cores) {
      resolveEntityObstacleCollisions(minion.position, turrets, Object.values(cores), 0.45);
    }
  });
}
