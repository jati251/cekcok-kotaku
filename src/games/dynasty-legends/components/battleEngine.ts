import {
  Entity,
  EntityType,
  Vector2,
  MapProp,
  PropType,
  Item,
  ItemType,
  HeroType,
  TacticalBase,
  BaseAffiliation,
  BattleScenario,
  MissionObjective,
  DifficultyLevel,
  DamageText,
  Shockwave,
  Particle,
  SlashArc,
} from '../types';
import * as Constants from '../constants';

export function createPlayerEntity(heroType: HeroType, startPos: Vector2): Entity {
  const stats = Constants.HERO_STATS[heroType];
  return {
    id: 'player',
    type: EntityType.PLAYER,
    heroType,
    position: { ...startPos },
    velocity: { x: 0, y: 0 },
    health: stats.hp,
    maxHealth: stats.hp,
    radius: 18,
    color: stats.color,
    label: stats.name,
    isDead: false,
    deathTimer: 0,
    attackCooldown: 0,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 0,
    isAllied: true,
  };
}

export function spawnAlliedSoldier(id: string, pos: Vector2): Entity {
  return {
    id,
    type: EntityType.ALLIED_SOLDIER,
    position: { x: pos.x + (Math.random() - 0.5) * 60, y: pos.y + (Math.random() - 0.5) * 60 },
    velocity: { x: 0, y: 0 },
    health: 90,
    maxHealth: 90,
    radius: 14,
    color: Constants.COLORS.ALLIED,
    label: 'Allied Spearman',
    isDead: false,
    deathTimer: 0,
    attackCooldown: Math.random() * 20,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 0,
    isAllied: true,
  };
}

export function spawnEnemyGrunt(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 55 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_GRUNT,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 14,
    color: Constants.COLORS.ENEMY,
    label: 'Rebel Grunt',
    isDead: false,
    deathTimer: 0,
    attackCooldown: Math.random() * 25,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 0,
    isAllied: false,
  };
}

export function spawnEnemyArcher(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 40 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_ARCHER,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 14,
    color: Constants.COLORS.ENEMY_ARCHER,
    label: 'Rebel Archer',
    isDead: false,
    deathTimer: 0,
    attackCooldown: 30 + Math.random() * 40,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 0,
    isAllied: false,
  };
}

export function spawnEnemyCaptain(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 180 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_CAPTAIN,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 18,
    color: Constants.COLORS.ENEMY_CAPTAIN,
    label: 'Gate Captain',
    isDead: false,
    deathTimer: 0,
    attackCooldown: 20,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 1,
    isAllied: false,
  };
}

export function spawnBossEntity(
  id: string,
  bossName: string,
  pos: Vector2,
  diff: DifficultyLevel
): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 850 * cfg.bossHpMult;
  return {
    id,
    type: EntityType.BOSS,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 24,
    color: Constants.COLORS.BOSS_GOLD,
    label: bossName,
    isDead: false,
    deathTimer: 0,
    attackCooldown: 15,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 3,
    isAllied: false,
  };
}

export function generateBattlefieldProps(scenario: BattleScenario): MapProp[] {
  const props: MapProp[] = [];
  let id = 1;

  for (const base of scenario.bases) {
    props.push({
      id: `torch_${id++}`,
      type: PropType.TORCH,
      x: base.x - 45,
      y: base.y - 35,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `torch_${id++}`,
      type: PropType.TORCH,
      x: base.x + 45,
      y: base.y - 35,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `barricade_${id++}`,
      type: PropType.BARRICADE,
      x: base.x - 70,
      y: base.y + 30,
      width: 40,
      height: 20,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `barricade_${id++}`,
      type: PropType.BARRICADE,
      x: base.x + 70,
      y: base.y + 30,
      width: 40,
      height: 20,
      scale: 1,
      variant: 0,
    });
  }

  const size = Constants.WORLD_SIZE;
  for (let i = 0; i < 40; i++) {
    props.push({
      id: `tree_${id++}`,
      type: PropType.TREE,
      x: Math.random() * (size - 400) + 200,
      y: Math.random() * (size - 400) + 200,
      width: 50 + Math.random() * 25,
      height: 60,
      scale: 0.9 + Math.random() * 0.3,
      variant: Math.floor(Math.random() * 3),
    });
  }

  for (let i = 0; i < 25; i++) {
    props.push({
      id: `rock_${id++}`,
      type: PropType.ROCK,
      x: Math.random() * (size - 400) + 200,
      y: Math.random() * (size - 400) + 200,
      width: 25 + Math.random() * 20,
      height: 20,
      scale: 1,
      variant: 0,
    });
  }

  return props;
}

export function updateObjectiveProgress(
  objectives: MissionObjective[],
  type: 'kill_count' | 'capture_base' | 'boss',
  delta: number = 1,
  targetId?: string
): boolean {
  let allDone = true;
  for (const obj of objectives) {
    if (!obj.completed && obj.type === type) {
      if (!targetId || obj.targetId === targetId) {
        obj.currentCount = Math.min(obj.targetCount, obj.currentCount + delta);
        if (obj.currentCount >= obj.targetCount) {
          obj.completed = true;
        }
      }
    }
    if (!obj.completed) allDone = false;
  }
  return allDone;
}

export function calculateArmyMorale(
  bases: TacticalBase[],
  koCount: number
): { allied: number; enemy: number } {
  let alliedScore = 30 + Math.min(30, koCount * 0.3);
  let enemyScore = 50;

  for (const base of bases) {
    if (base.affiliation === BaseAffiliation.ALLIED) {
      alliedScore += 20;
    } else if (base.affiliation === BaseAffiliation.ENEMY) {
      enemyScore += 15;
    }
  }

  const total = alliedScore + enemyScore;
  const alliedPct = Math.max(10, Math.min(90, (alliedScore / total) * 100));
  return { allied: alliedPct, enemy: 100 - alliedPct };
}

export function executePlayerAttack(
  player: Entity,
  entities: Entity[],
  koCount: number,
  isMusou: boolean,
  objectives: MissionObjective[],
  damageTexts: DamageText[],
  particles: Particle[],
  slashes: SlashArc[],
  items: Item[],
  bossName: string
): { hitCount: number; newKoCount: number; won: boolean } {
  const tiers = Constants.WEAPON_TIERS[player.heroType || HeroType.GUAN_YU];
  let activeTier = tiers[0];
  for (const t of tiers) {
    if (koCount >= t.kills) activeTier = t;
  }

  const heroStats = Constants.HERO_STATS[player.heroType || HeroType.GUAN_YU];
  const reach = activeTier.range;
  const dmg = activeTier.damage * (isMusou ? 2.2 : 1.0);
  let hitCount = 0;
  let currentKo = koCount;
  let won = false;

  // Spawn visual blade slash arc trail
  slashes.push({
    x: player.position.x,
    y: player.position.y,
    angle: player.facing,
    radius: reach * 0.8,
    arcLength: Math.PI * 0.9,
    color: heroStats.accentColor,
    life: 0,
    maxLife: 10,
  });

  for (const e of entities) {
    if (e.isAllied || e.isDead) continue;
    const dx = e.position.x - player.position.x;
    const dy = e.position.y - player.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist < reach + e.radius) {
      e.health -= dmg;
      hitCount++;

      // Hit reaction: Flinch, Flash, Knockback Physics
      const impactAngle = Math.atan2(dy, dx);
      const knockback = (isMusou ? 14 : 7) / (e.type === EntityType.BOSS ? 3 : 1);
      e.velocity.x += Math.cos(impactAngle) * knockback;
      e.velocity.y += Math.sin(impactAngle) * knockback;
      e.hitFlashTimer = 6;
      e.hitStunTimer = 12;

      // Spawn Sparks & Blood Particles
      for (let i = 0; i < 4; i++) {
        const pAngle = impactAngle + (Math.random() - 0.5) * 1.5;
        const pSpeed = 3 + Math.random() * 5;
        particles.push({
          x: e.position.x,
          y: e.position.y,
          vx: Math.cos(pAngle) * pSpeed,
          vy: Math.sin(pAngle) * pSpeed,
          color: Math.random() < 0.6 ? '#fbbf24' : '#ef4444',
          size: 2 + Math.random() * 3,
          life: 14 + Math.random() * 10,
          maxLife: 24,
        });
      }

      damageTexts.push({
        x: e.position.x,
        y: e.position.y - 18,
        text: Math.round(dmg).toString(),
        life: 30,
        color: isMusou ? Constants.COLORS.TEXT_CRIT : Constants.COLORS.TEXT_DAMAGE,
      });

      if (e.health <= 0) {
        e.isDead = true;
        e.deathTimer = 1.0;
        e.velocity.x += Math.cos(impactAngle) * 12;
        e.velocity.y += Math.sin(impactAngle) * 12;
        currentKo++;

        const isObjectiveWon = updateObjectiveProgress(objectives, 'kill_count', 1);
        if (e.type === EntityType.BOSS) {
          updateObjectiveProgress(objectives, 'boss', 1, bossName);
          won = true;
        }
        if (isObjectiveWon) won = true;

        if (Math.random() < Constants.DROP_CHANCE_HEALTH) {
          items.push({
            id: `item_${Date.now()}_${Math.random()}`,
            type: Math.random() < 0.3 ? ItemType.WINE_MUSOU : ItemType.HEALTH_BUN,
            x: e.position.x,
            y: e.position.y,
            bouncePhase: 0,
          });
        }
      }
    }
  }

  return { hitCount, newKoCount: currentKo, won };
}

export function executeMusouBlast(
  player: Entity,
  entities: Entity[],
  shockwaves: Shockwave[],
  particles: Particle[]
): number {
  shockwaves.push({
    x: player.position.x,
    y: player.position.y,
    radius: 20,
    maxRadius: 300,
    color: '#fbbf24',
    life: 0,
    maxLife: 40,
  });

  // Massive radial sparks
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const speed = 5 + Math.random() * 6;
    particles.push({
      x: player.position.x,
      y: player.position.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#fef08a',
      size: 3 + Math.random() * 3,
      life: 25,
      maxLife: 25,
    });
  }

  let kills = 0;
  for (const e of entities) {
    if (e.isAllied || e.isDead) continue;
    const dist = Math.hypot(e.position.x - player.position.x, e.position.y - player.position.y);
    if (dist < 300) {
      e.health -= 140;
      const angle = Math.atan2(e.position.y - player.position.y, e.position.x - player.position.x);
      e.velocity.x += Math.cos(angle) * 16;
      e.velocity.y += Math.sin(angle) * 16;
      e.hitFlashTimer = 10;
      e.hitStunTimer = 20;

      if (e.health <= 0) {
        e.isDead = true;
        kills++;
      }
    }
  }
  return kills;
}

export function applyHordeSeparationPhysics(entities: Entity[]) {
  const len = entities.length;
  for (let i = 0; i < len; i++) {
    const e1 = entities[i];
    if (e1.isDead) continue;

    for (let j = i + 1; j < len; j++) {
      const e2 = entities[j];
      if (e2.isDead) continue;

      const dx = e2.position.x - e1.position.x;
      const dy = e2.position.y - e1.position.y;
      const dist = Math.hypot(dx, dy);
      const minDist = e1.radius + e2.radius;

      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) * 0.25;
        const nx = dx / dist;
        const ny = dy / dist;

        e1.position.x -= nx * overlap;
        e1.position.y -= ny * overlap;
        e2.position.x += nx * overlap;
        e2.position.y += ny * overlap;
      }
    }
  }
}
