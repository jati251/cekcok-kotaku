import type { MinionEntity, Lane } from '../types/map';
import type { Team } from '../types/hero';
import { LANE_WAYPOINTS } from '../constants/mapData';

let minionIdCounter = 1;

export function spawnMinionWave(
  team: Team,
  lane: Lane,
  isSuperWave: boolean = false
): MinionEntity[] {
  const waypoints = LANE_WAYPOINTS[lane][team];
  const spawnPoint = waypoints[0];

  const minions: MinionEntity[] = [];

  // 1. Melee Swordsman
  minions.push({
    id: `minion_${team}_${lane}_melee_${minionIdCounter++}`,
    lane,
    team,
    type: 'melee',
    maxHp: 950,
    currentHp: 950,
    physicalAttack: 48,
    physicalDefense: 15,
    attackSpeed: 1.0,
    attackRange: 2.2,
    movementSpeed: 5.5,
    position: { x: spawnPoint.x + (Math.random() - 0.5) * 2, y: 0, z: spawnPoint.z + (Math.random() - 0.5) * 2 },
    rotationY: 0,
    waypointIndex: 1,
    targetEntityId: null,
    isDead: false,
    goldReward: 65,
    expReward: 85,
  });

  // 2. Ranged Mage
  minions.push({
    id: `minion_${team}_${lane}_ranged_${minionIdCounter++}`,
    lane,
    team,
    type: 'ranged',
    maxHp: 650,
    currentHp: 650,
    physicalAttack: 65,
    physicalDefense: 8,
    attackSpeed: 1.1,
    attackRange: 6.5,
    movementSpeed: 5.4,
    position: { x: spawnPoint.x + (Math.random() - 0.5) * 2, y: 0, z: spawnPoint.z + (Math.random() - 0.5) * 2 },
    rotationY: 0,
    waypointIndex: 1,
    targetEntityId: null,
    isDead: false,
    goldReward: 60,
    expReward: 80,
  });

  // 3. Siege Cannon or Super Minion
  minions.push({
    id: `minion_${team}_${lane}_siege_${minionIdCounter++}`,
    lane,
    team,
    type: isSuperWave ? 'super' : 'siege',
    maxHp: isSuperWave ? 2500 : 1400,
    currentHp: isSuperWave ? 2500 : 1400,
    physicalAttack: isSuperWave ? 140 : 85,
    physicalDefense: isSuperWave ? 30 : 20,
    attackSpeed: 0.9,
    attackRange: 7.0,
    movementSpeed: 5.0,
    position: { x: spawnPoint.x + (Math.random() - 0.5) * 2, y: 0, z: spawnPoint.z + (Math.random() - 0.5) * 2 },
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
  dt: number
) {
  minions.forEach((minion) => {
    if (minion.isDead) return;

    // 1. Check if there's an opposing minion in attack range
    let closestTarget: MinionEntity | null = null;
    let minDist = minion.attackRange;

    for (const opp of opposingMinions) {
      if (opp.isDead) continue;
      const dx = opp.position.x - minion.position.x;
      const dz = opp.position.z - minion.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < minDist) {
        minDist = dist;
        closestTarget = opp;
      }
    }

    if (closestTarget) {
      // Attack target
      minion.targetEntityId = closestTarget.id;
      // Deal damage
      const dmg = minion.physicalAttack * dt * minion.attackSpeed;
      closestTarget.currentHp -= dmg;
      if (closestTarget.currentHp <= 0) {
        closestTarget.isDead = true;
        minion.targetEntityId = null;
      }
      return;
    }

    // 2. Otherwise advance along waypoints
    const waypoints = LANE_WAYPOINTS[minion.lane][minion.team];
    const targetWp = waypoints[minion.waypointIndex];
    if (!targetWp) return;

    const dx = targetWp.x - minion.position.x;
    const dz = targetWp.z - minion.position.z;
    const distToWp = Math.hypot(dx, dz);

    if (distToWp < 3) {
      if (minion.waypointIndex < waypoints.length - 1) {
        minion.waypointIndex += 1;
      }
    } else {
      const step = minion.movementSpeed * dt;
      minion.position.x += (dx / distToWp) * step;
      minion.position.z += (dz / distToWp) * step;
      minion.rotationY = Math.atan2(dx, dz);
    }
  });
}
