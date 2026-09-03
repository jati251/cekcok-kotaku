import { Entity, EntityType, Vector2, HeroType, DifficultyLevel } from '../types';
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

export function spawnEnemyShield(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 110 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_SHIELD,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 16,
    color: '#475569',
    label: 'Shield Guard',
    isDead: false,
    deathTimer: 0,
    attackCooldown: 35,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 1,
    isAllied: false,
  };
}

export function spawnEnemyCavalry(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 95 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_CAVALRY,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 18,
    color: '#78350f',
    label: 'Mounted Raider',
    isDead: false,
    deathTimer: 0,
    attackCooldown: 25,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 1,
    isAllied: false,
  };
}

export function spawnEnemyBomber(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 50 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_BOMBER,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 14,
    color: '#ca8a04',
    label: 'Firepot Grenadier',
    isDead: false,
    deathTimer: 0,
    attackCooldown: 50,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 0,
    isAllied: false,
  };
}

export function spawnEnemySorcerer(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const cfg = Constants.DIFFICULTY_CONFIGS[diff];
  const hp = 60 * cfg.enemyHpMult;
  return {
    id,
    type: EntityType.ENEMY_SORCERER,
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    health: hp,
    maxHealth: hp,
    radius: 14,
    color: '#9333ea',
    label: 'Daoist Sorcerer',
    isDead: false,
    deathTimer: 0,
    attackCooldown: 60,
    facing: 0,
    walkFrame: 0,
    attackProgress: 0,
    weaponLevel: 2,
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

export function spawnRandomWaveEnemy(id: string, pos: Vector2, diff: DifficultyLevel): Entity {
  const r = Math.random();
  if (r < 0.35) return spawnEnemyGrunt(id, pos, diff);
  if (r < 0.55) return spawnEnemyArcher(id, pos, diff);
  if (r < 0.75) return spawnEnemyShield(id, pos, diff);
  if (r < 0.88) return spawnEnemyCavalry(id, pos, diff);
  if (r < 0.96) return spawnEnemyBomber(id, pos, diff);
  return spawnEnemySorcerer(id, pos, diff);
}

export function initBattlefieldEntities(
  scenarioBases: any[],
  selectedHero: HeroType,
  selectedDifficulty: DifficultyLevel
): { player: Entity; entities: Entity[]; startPos: Vector2 } {
  const alliedBase = scenarioBases.find((b: any) => b.affiliation === 'ALLIED');
  const startPos = alliedBase ? { x: alliedBase.x, y: alliedBase.y } : { x: 600, y: 600 };

  const player = createPlayerEntity(selectedHero, startPos);
  const entities: Entity[] = [player];

  for (let i = 0; i < 8; i++) {
    entities.push(spawnAlliedSoldier(`ally_${i}`, startPos));
  }

  let eid = 100;
  for (const base of scenarioBases) {
    if (base.affiliation === 'ENEMY') {
      entities.push(spawnEnemyCaptain(`cap_${eid++}`, { x: base.x, y: base.y }, selectedDifficulty));
      for (let j = 0; j < 5; j++) {
        entities.push(
          spawnRandomWaveEnemy(
            `init_${eid++}`,
            { x: base.x + (Math.random() - 0.5) * 80, y: base.y + (Math.random() - 0.5) * 80 },
            selectedDifficulty
          )
        );
      }
    }
  }

  return { player, entities, startPos };
}
