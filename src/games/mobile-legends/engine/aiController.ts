import type { ActiveHeroEntity } from '../types/hero';
import type { MinionEntity, TurretEntity, BaseCoreEntity } from '../types/map';
import { HERO_REGISTRY } from '../constants/heroes';
import { ITEM_REGISTRY } from '../constants/items';
import { LANE_WAYPOINTS, BASE_SPAWNS } from '../constants/mapData';
import { calculateDamage } from './combatEngine';
import { resolveEntityObstacleCollisions } from './collisionEngine';

export interface BotRoleAssignment {
  heroId: string;
  lane: 'top' | 'mid' | 'bot' | 'jungle';
  waypointIndex: number;
  combatState: 'laning' | 'fighting' | 'retreating' | 'recalling';
}

export type BotCastSkillHandler = (
  bot: ActiveHeroEntity,
  target: ActiveHeroEntity,
  skillIndex: number
) => void;

export function updateHeroBots(
  bots: ActiveHeroEntity[],
  allHeroes: ActiveHeroEntity[],
  allMinions: MinionEntity[],
  turrets: TurretEntity[],
  cores: Record<'blue' | 'red', BaseCoreEntity>,
  botRoles: Map<string, BotRoleAssignment>,
  dt: number,
  onHeroKilled: (victim: ActiveHeroEntity, killer: ActiveHeroEntity) => void,
  onBotCastSkill?: BotCastSkillHandler
) {
  bots.forEach((bot) => {
    if (bot.isPlayer) return;

    const heroDef = HERO_REGISTRY[bot.heroDefId] || HERO_REGISTRY.layla;

    // Handle Dead state & Respawn countdown
    if (bot.state === 'dead') {
      bot.respawnTimer = Math.max(0, bot.respawnTimer - dt);
      if (bot.respawnTimer <= 0) {
        // Respawn at base
        const spawn = BASE_SPAWNS[bot.team];
        bot.position = { ...spawn };
        bot.currentHp = heroDef.baseStats.maxHp;
        bot.currentMana = heroDef.baseStats.maxMana;
        bot.state = 'idle';
        const role = botRoles.get(bot.id);
        if (role) {
          role.combatState = 'laning';
          role.waypointIndex = 2;
        }
      }
      return;
    }

    // Handle CC state (Stun, Airborne, Slow)
    if (bot.ccState && bot.ccState.duration > 0) {
      bot.ccState.duration = Math.max(0, bot.ccState.duration - dt);
      if (bot.ccState.duration === 0) {
        bot.ccState.type = 'none';
      } else if (bot.ccState.type === 'stun' || bot.ccState.type === 'airborne' || bot.ccState.type === 'knockup') {
        bot.state = 'idle';
        return; // Paralyzed! Cannot move or attack
      }
    }

    // Skill cooldown tick for bots
    bot.skillCooldowns[0] = Math.max(0, bot.skillCooldowns[0] - dt);
    bot.skillCooldowns[1] = Math.max(0, bot.skillCooldowns[1] - dt);
    bot.skillCooldowns[2] = Math.max(0, bot.skillCooldowns[2] - dt);

    // Decrement revealTimer if active
    if (bot.revealTimer && bot.revealTimer > 0) {
      bot.revealTimer = Math.max(0, bot.revealTimer - dt);
    }

    let role = botRoles.get(bot.id);
    if (!role) {
      role = {
        heroId: bot.id,
        lane: 'mid',
        waypointIndex: 2,
        combatState: 'laning',
      };
      botRoles.set(bot.id, role);
    }

    // 1. Check Base Fountain Regeneration
    const spawnPoint = BASE_SPAWNS[bot.team];
    const distToBase = Math.hypot(bot.position.x - spawnPoint.x, bot.position.z - spawnPoint.z);
    if (distToBase < 12) {
      bot.currentHp = Math.min(heroDef.baseStats.maxHp, bot.currentHp + 450 * dt);
      bot.currentMana = Math.min(heroDef.baseStats.maxMana, bot.currentMana + 200 * dt);
      if (bot.currentHp >= heroDef.baseStats.maxHp * 0.9) {
        role.combatState = 'laning';
      }
    }

    // 2. Auto-Buy Items for Bots
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

    // 3. Health check -> Retreat if under 25% HP
    if (bot.currentHp < heroDef.baseStats.maxHp * 0.25) {
      role.combatState = 'retreating';
    }

    // State 1: Retreating back to fountain
    if (role.combatState === 'retreating') {
      const dx = spawnPoint.x - bot.position.x;
      const dz = spawnPoint.z - bot.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 3) {
        const step = (heroDef.baseStats.movementSpeed + 1.2) * dt;
        bot.position.x += (dx / dist) * step;
        bot.position.z += (dz / dist) * step;
        bot.rotationY = Math.atan2(dx, dz);
        bot.state = 'walking';
        resolveEntityObstacleCollisions(bot.position, turrets, Object.values(cores), 0.55);
      } else {
        bot.state = 'idle';
      }
      return;
    }

    // State 2: Fighting or Laning
    const hostileTeam = bot.team === 'blue' ? 'red' : 'blue';

    // Scan for visible hostile heroes in detection range (with bush stealth rules!)
    const hostileHeroes = allHeroes.filter((h) => {
      if (h.team !== hostileTeam || h.state === 'dead') return false;
      // Bush Stealth Check:
      if (h.inBush) {
        const sameBush = bot.inBush && bot.currentBushId && bot.currentBushId === h.currentBushId;
        const isRevealed = (h.revealTimer || 0) > 0;
        if (!sameBush && !isRevealed) {
          return false; // Hidden in bush! Bot cannot detect
        }
      }
      return true;
    });

    let targetHero: ActiveHeroEntity | null = null;
    let minHeroDist = 13;
    for (const opp of hostileHeroes) {
      const dist = Math.hypot(opp.position.x - bot.position.x, opp.position.z - bot.position.z);
      if (dist < minHeroDist) {
        minHeroDist = dist;
        targetHero = opp;
      }
    }

    // If a hostile hero is spotted, engage them
    if (targetHero) {
      const dx = targetHero.position.x - bot.position.x;
      const dz = targetHero.position.z - bot.position.z;
      const dist = Math.hypot(dx, dz);
      bot.rotationY = Math.atan2(dx, dz);

      // Bot Skill AI: Try casting skills in combat (Ult > S2 > S1)
      if (dist <= 11) {
        const skillsPriority = [2, 1, 0];
        for (const sIdx of skillsPriority) {
          const skill = heroDef.skills[sIdx];
          if (!skill) continue;
          const manaCost = skill.manaCostByLevel[0] || 50;
          const castRange = skill.castRange || 8;

          if (bot.skillCooldowns[sIdx] <= 0 && bot.currentMana >= manaCost && dist <= castRange) {
            bot.currentMana -= manaCost;
            bot.skillCooldowns[sIdx] = skill.cooldownByLevel[0] || 8;
            if (bot.inBush) bot.revealTimer = 2.5;

            if (onBotCastSkill) {
              onBotCastSkill(bot, targetHero, sIdx);
            }
            break;
          }
        }
      }

      if (dist > heroDef.baseStats.attackRange) {
        const step = heroDef.baseStats.movementSpeed * dt;
        bot.position.x += (dx / dist) * step;
        bot.position.z += (dz / dist) * step;
        bot.state = 'walking';
        resolveEntityObstacleCollisions(bot.position, turrets, Object.values(cores), 0.55);
      } else {
        bot.state = 'attacking';
        if (bot.inBush) bot.revealTimer = 2.5;

        // Deal damage using combatEngine
        const dmgResult = calculateDamage(
          {
            sourceId: bot.id,
            targetId: targetHero.id,
            rawAmount: heroDef.baseStats.physicalAttack * (1 + bot.level * 0.08),
            damageType: 'physical',
          },
          targetHero.team === 'blue' ? 25 : 30,
          15,
          bot,
          targetHero
        );
        targetHero.currentHp -= dmgResult.finalDamage * dt * heroDef.baseStats.attackSpeed;

        if (targetHero.currentHp <= 0) {
          targetHero.state = 'dead';
          targetHero.deaths += 1;
          targetHero.respawnTimer = 6 + targetHero.level * 2;
          bot.kills += 1;
          bot.gold += 300;
          onHeroKilled(targetHero, bot);
        }
      }
      return;
    }

    // 4. If no hostile hero spotted, target hostile minions in range
    const hostileMinions = allMinions.filter(
      (m) => !m.isDead && m.team === hostileTeam && Math.hypot(m.position.x - bot.position.x, m.position.z - bot.position.z) <= 10
    );

    if (hostileMinions.length > 0) {
      const targetMinion = hostileMinions[0];
      const dx = targetMinion.position.x - bot.position.x;
      const dz = targetMinion.position.z - bot.position.z;
      const dist = Math.hypot(dx, dz);
      bot.rotationY = Math.atan2(dx, dz);

      if (dist > heroDef.baseStats.attackRange) {
        const step = heroDef.baseStats.movementSpeed * dt;
        bot.position.x += (dx / dist) * step;
        bot.position.z += (dz / dist) * step;
        bot.state = 'walking';
        resolveEntityObstacleCollisions(bot.position, turrets, Object.values(cores), 0.55);
      } else {
        bot.state = 'attacking';
        if (bot.inBush) bot.revealTimer = 2.5;
        targetMinion.currentHp -= heroDef.baseStats.physicalAttack * dt * heroDef.baseStats.attackSpeed;
        if (targetMinion.currentHp <= 0) {
          targetMinion.isDead = true;
          bot.gold += targetMinion.goldReward;
        }
      }
      return;
    }

    // 5. If no minions, target hostile turrets or cores in attack range
    const hostileTurrets = turrets.filter(
      (t) => !t.isDestroyed && t.team === hostileTeam && Math.hypot(t.position.x - bot.position.x, t.position.z - bot.position.z) <= heroDef.baseStats.attackRange + 2
    );
    if (hostileTurrets.length > 0) {
      const targetTurret = hostileTurrets[0];
      bot.rotationY = Math.atan2(targetTurret.position.x - bot.position.x, targetTurret.position.z - bot.position.z);
      bot.state = 'attacking';
      targetTurret.currentHp -= heroDef.baseStats.physicalAttack * dt * 0.7;
      return;
    }

    const enemyCore = cores[hostileTeam];
    if (
      !enemyCore.isDestroyed &&
      Math.hypot(enemyCore.position.x - bot.position.x, enemyCore.position.z - bot.position.z) <= heroDef.baseStats.attackRange + 2
    ) {
      bot.rotationY = Math.atan2(enemyCore.position.x - bot.position.x, enemyCore.position.z - bot.position.z);
      bot.state = 'attacking';
      enemyCore.currentHp -= heroDef.baseStats.physicalAttack * dt * 0.7;
      return;
    }

    // 6. Otherwise march along lane waypoints
    const laneKey = role.lane === 'jungle' ? 'mid' : role.lane;
    const laneWaypoints = LANE_WAYPOINTS[laneKey][bot.team];
    const targetWp = laneWaypoints[role.waypointIndex] || laneWaypoints[laneWaypoints.length - 1];

    const dx = targetWp.x - bot.position.x;
    const dz = targetWp.z - bot.position.z;
    const distWp = Math.hypot(dx, dz);

    if (distWp < 3.5) {
      if (role.waypointIndex < laneWaypoints.length - 1) {
        role.waypointIndex += 1;
      }
    } else {
      const step = heroDef.baseStats.movementSpeed * dt;
      bot.position.x += (dx / distWp) * step;
      bot.position.z += (dz / distWp) * step;
      bot.rotationY = Math.atan2(dx, dz);
      bot.state = 'walking';
      resolveEntityObstacleCollisions(bot.position, turrets, Object.values(cores), 0.55);
    }
  });
}
