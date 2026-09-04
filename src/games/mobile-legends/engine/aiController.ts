import type { ActiveHeroEntity } from '../types/hero';
import type { MinionEntity, TurretEntity, BaseCoreEntity } from '../types/map';
import { HERO_REGISTRY } from '../constants/heroes';
import { ITEM_REGISTRY } from '../constants/items';
import { LANE_WAYPOINTS, BASE_SPAWNS } from '../constants/mapData';
import { calculateDamage } from './combatEngine';

export interface BotRoleAssignment {
  heroId: string;
  lane: 'top' | 'mid' | 'bot' | 'jungle';
  waypointIndex: number;
  combatState: 'laning' | 'fighting' | 'retreating' | 'recalling';
}

export function updateHeroBots(
  bots: ActiveHeroEntity[],
  allHeroes: ActiveHeroEntity[],
  _allMinions: MinionEntity[],
  _turrets: TurretEntity[],
  _cores: Record<'blue' | 'red', BaseCoreEntity>,
  botRoles: Map<string, BotRoleAssignment>,
  dt: number,
  onHeroKilled: (victim: ActiveHeroEntity, killer: ActiveHeroEntity) => void
) {
  bots.forEach((bot) => {
    if (bot.isPlayer || bot.state === 'dead') return;

    const heroDef = HERO_REGISTRY[bot.heroDefId] || HERO_REGISTRY.layla;
    let role = botRoles.get(bot.id);
    if (!role) {
      role = {
        heroId: bot.id,
        lane: 'mid',
        waypointIndex: 3,
        combatState: 'laning',
      };
      botRoles.set(bot.id, role);
    }

    // 1. Check Regeneration / Base Fountain
    const spawnPoint = BASE_SPAWNS[bot.team];
    const distToBase = Math.hypot(bot.position.x - spawnPoint.x, bot.position.z - spawnPoint.z);
    if (distToBase < 12) {
      bot.currentHp = Math.min(heroDef.baseStats.maxHp, bot.currentHp + 350 * dt);
      bot.currentMana = Math.min(heroDef.baseStats.maxMana, bot.currentMana + 150 * dt);
      if (bot.currentHp >= heroDef.baseStats.maxHp * 0.9) {
        role.combatState = 'laning';
      }
    }

    // 2. Buy Items for Bots if gold allows
    if (bot.items.length < 6) {
      const nextItemId = heroDef.recommendedBuild.find((id) => !bot.items.includes(id));
      if (nextItemId) {
        const itemDef = ITEM_REGISTRY[nextItemId];
        if (itemDef && bot.gold >= itemDef.cost) {
          bot.gold -= itemDef.cost;
          bot.items.push(nextItemId);
        }
      }
    }

    // 3. Health check -> Retreat
    if (bot.currentHp < heroDef.baseStats.maxHp * 0.25) {
      role.combatState = 'retreating';
    }

    // State 1: Retreating back to fountain
    if (role.combatState === 'retreating') {
      const dx = spawnPoint.x - bot.position.x;
      const dz = spawnPoint.z - bot.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 2) {
        const step = (heroDef.baseStats.movementSpeed + 1) * dt;
        bot.position.x += (dx / dist) * step;
        bot.position.z += (dz / dist) * step;
        bot.rotationY = Math.atan2(dx, dz);
        bot.state = 'walking';
      } else {
        bot.state = 'idle';
      }
      return;
    }

    // State 2: Fighting or Laning
    // Scan for hostile heroes in range
    const hostileTeam = bot.team === 'blue' ? 'red' : 'blue';
    const hostileHeroes = allHeroes.filter(
      (h) => h.team === hostileTeam && h.state !== 'dead'
    );

    let targetHero: ActiveHeroEntity | null = null;
    let minHeroDist = 12; // Detection radius
    for (const opp of hostileHeroes) {
      const dist = Math.hypot(opp.position.x - bot.position.x, opp.position.z - bot.position.z);
      if (dist < minHeroDist) {
        minHeroDist = dist;
        targetHero = opp;
      }
    }

    if (targetHero) {
      // Approach target up to attack range
      const dx = targetHero.position.x - bot.position.x;
      const dz = targetHero.position.z - bot.position.z;
      const dist = Math.hypot(dx, dz);
      bot.rotationY = Math.atan2(dx, dz);

      if (dist > heroDef.baseStats.attackRange) {
        const step = heroDef.baseStats.movementSpeed * dt;
        bot.position.x += (dx / dist) * step;
        bot.position.z += (dz / dist) * step;
        bot.state = 'walking';
      } else {
        bot.state = 'attacking';
        // Attack Target Hero
        const dmgResult = calculateDamage(
          {
            sourceId: bot.id,
            targetId: targetHero.id,
            rawAmount: heroDef.baseStats.physicalAttack * (1 + bot.level * 0.08),
            damageType: 'physical',
          },
          targetHero.team === 'blue' ? 20 : 25,
          15,
          bot,
          targetHero
        );
        targetHero.currentHp -= dmgResult.finalDamage * dt * heroDef.baseStats.attackSpeed;

        if (targetHero.currentHp <= 0) {
          targetHero.state = 'dead';
          targetHero.deaths += 1;
          bot.kills += 1;
          bot.gold += 300;
          onHeroKilled(targetHero, bot);
        }
      }
      return;
    }

    // If no hostile hero, lane and farm minions
    const laneWaypoints = LANE_WAYPOINTS[role.lane === 'jungle' ? 'mid' : role.lane][bot.team];
    const targetWp = laneWaypoints[role.waypointIndex] || laneWaypoints[laneWaypoints.length - 1];

    const dx = targetWp.x - bot.position.x;
    const dz = targetWp.z - bot.position.z;
    const distWp = Math.hypot(dx, dz);

    if (distWp < 4) {
      if (role.waypointIndex < laneWaypoints.length - 1) {
        role.waypointIndex += 1;
      }
    } else {
      const step = heroDef.baseStats.movementSpeed * dt;
      bot.position.x += (dx / distWp) * step;
      bot.position.z += (dz / distWp) * step;
      bot.rotationY = Math.atan2(dx, dz);
      bot.state = 'walking';
    }
  });
}
