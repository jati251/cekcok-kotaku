import {
  HeroType,
  DifficultyLevel,
  BattleScenario,
  TacticalBase,
  BaseAffiliation,
  ComboRank,
  MissionObjective,
  ItemType,
} from '../types';
import * as Constants from '../constants';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface HeroState3D {
  heroType: HeroType;
  position: Vector3D;
  velocity: Vector3D;
  rotationY: number;
  targetRotationY: number;
  health: number;
  maxHealth: number;
  musou: number;
  musouMax: number;
  attackStage: number; // 0: none, 1..6: normal combo chain
  isChargeAttack: boolean;
  attackTimer: number;
  attackDuration: number;
  isMusouActive: boolean;
  musouTimer: number;
  dashTimer: number;
  isDashing: boolean;
  isHitStunned: boolean;
  hitStunTimer: number;
  isMoving: boolean;
  speed: number;
  damage: number;
}

export type EnemyType3D =
  | 'GRUNT'
  | 'SHIELD'
  | 'ARCHER'
  | 'SORCERER'
  | 'CAPTAIN'
  | 'BOSS';

export interface EnemyEntity3D {
  id: string;
  type: EnemyType3D;
  position: Vector3D;
  velocity: Vector3D;
  rotationY: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  radius: number;
  isDead: boolean;
  deathTimer: number;
  attackCooldown: number;
  isAirborne: boolean;
  airTumbleAngle: number;
  hitFlashTimer: number;
  name?: string;
  title?: string;
  color?: string;
}

export interface AlliedSoldier3D {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  rotationY: number;
  health: number;
  maxHealth: number;
  speed: number;
  radius: number;
  attackCooldown: number;
  targetEnemyId?: string;
}

export interface SlashEffect3D {
  id: string;
  heroType: HeroType;
  position: Vector3D;
  rotationY: number;
  radius: number;
  color: string;
  progress: number;
  maxLife: number;
  isMusou: boolean;
  isCharge: boolean;
}

export interface Shockwave3D {
  id: string;
  position: Vector3D;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FireZone3D {
  id: string;
  position: Vector3D;
  radius: number;
  life: number;
  maxLife: number;
}

export interface Arrow3D {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  life: number;
  damage: number;
}

export interface DamageNumberData3D {
  id: string;
  position: Vector3D;
  value: number | string;
  color: string;
  isCrit: boolean;
  life: number;
  maxLife: number;
}

export interface ItemDrop3D {
  id: string;
  type: ItemType;
  position: Vector3D;
  rotationY: number;
  life: number;
}

export interface Dynasty3DWorldState {
  player: HeroState3D;
  enemies: EnemyEntity3D[];
  allies: AlliedSoldier3D[];
  slashes: SlashEffect3D[];
  shockwaves: Shockwave3D[];
  fireZones: FireZone3D[];
  arrows: Arrow3D[];
  damageNumbers: DamageNumberData3D[];
  items: ItemDrop3D[];
  bases: TacticalBase[];
  objectives: MissionObjective[];
  koCount: number;
  comboCount: number;
  comboTimer: number;
  comboRank: ComboRank;
  alliedMorale: number;
  enemyMorale: number;
  screenShake: { intensity: number; duration: number };
  bossSpawned: boolean;
  bossEntity?: EnemyEntity3D;
  isVictory: boolean;
  isDefeat: boolean;
}

// Convert 2D scenario positions (0..3000) to 3D world coordinates (-150..150)
export function mapTo3D(pos2D: { x: number; y: number }, worldScale = 0.1): Vector3D {
  return {
    x: (pos2D.x - 1500) * worldScale,
    y: 0,
    z: (pos2D.y - 1500) * worldScale,
  };
}

export function toMinimapCoords(pos3D: Vector3D, worldScale = 0.1): { x: number; y: number } {
  return {
    x: pos3D.x / worldScale + 1500,
    y: pos3D.z / worldScale + 1500,
  };
}

export function init3DWorld(
  scenario: BattleScenario,
  heroType: HeroType,
  difficulty: DifficultyLevel
): Dynasty3DWorldState {
  const heroStat = Constants.HERO_STATS[heroType];
  const diffConfig = Constants.DIFFICULTY_CONFIGS[difficulty];

  // Base positions in 3D
  const bases3D: TacticalBase[] = JSON.parse(JSON.stringify(scenario.bases));
  const alliedBase = bases3D.find((b) => b.affiliation === BaseAffiliation.ALLIED) || bases3D[0];
  const playerSpawn = mapTo3D({ x: alliedBase.x, y: alliedBase.y });

  const player: HeroState3D = {
    heroType,
    position: { x: playerSpawn.x, y: 0, z: playerSpawn.z },
    velocity: { x: 0, y: 0, z: 0 },
    rotationY: 0,
    targetRotationY: 0,
    health: heroStat.hp,
    maxHealth: heroStat.hp,
    musou: 0,
    musouMax: Constants.MUSOU_GAUGE_MAX,
    attackStage: 0,
    isChargeAttack: false,
    attackTimer: 0,
    attackDuration: 0,
    isMusouActive: false,
    musouTimer: 0,
    dashTimer: 0,
    isDashing: false,
    isHitStunned: false,
    hitStunTimer: 0,
    isMoving: false,
    speed: heroStat.speed * 0.08,
    damage: Math.floor(400 / heroStat.cooldown),
  };

  // Spawn initial enemy clusters near enemy bases and patrol corridors
  const enemies: EnemyEntity3D[] = [];
  const enemyBases = bases3D.filter((b) => b.affiliation === BaseAffiliation.ENEMY);

  let enemyIdSeq = 1;
  enemyBases.forEach((base) => {
    const baseCenter = mapTo3D({ x: base.x, y: base.y });
    // Spawn 1 Gate Captain per enemy base
    enemies.push({
      id: `captain_${base.id}`,
      type: 'CAPTAIN',
      position: {
        x: baseCenter.x + (Math.random() - 0.5) * 6,
        y: 0,
        z: baseCenter.z + (Math.random() - 0.5) * 6,
      },
      velocity: { x: 0, y: 0, z: 0 },
      rotationY: Math.random() * Math.PI * 2,
      health: 800 * diffConfig.bossHpMult,
      maxHealth: 800 * diffConfig.bossHpMult,
      speed: 1.8 * diffConfig.enemySpeedMult,
      damage: 28 * diffConfig.enemyDmgMult,
      radius: 1.2,
      isDead: false,
      deathTimer: 0,
      attackCooldown: 1.5,
      isAirborne: false,
      airTumbleAngle: 0,
      hitFlashTimer: 0,
      name: `${base.name} Guard Captain`,
      title: 'Gate Keeper',
      color: '#fbbf24',
    });

    // Spawn Grunt, Archer, Shield squads around base (Dense Koei Battlefield Garrison)
    const squadSize = 16 + Math.floor(diffConfig.waveSizeBonus * 0.8);
    for (let i = 0; i < squadSize; i++) {
      const angle = (i / squadSize) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 3.5 + Math.random() * 11;
      const typeRoll = Math.random();
      let enemyType: EnemyType3D = 'GRUNT';
      let hp = 100 * diffConfig.enemyHpMult;
      let dmg = 12 * diffConfig.enemyDmgMult;
      let radius = 0.8;

      if (typeRoll < 0.25) {
        enemyType = 'ARCHER';
        hp = 70 * diffConfig.enemyHpMult;
        dmg = 10 * diffConfig.enemyDmgMult;
      } else if (typeRoll < 0.5) {
        enemyType = 'SHIELD';
        hp = 180 * diffConfig.enemyHpMult;
        dmg = 15 * diffConfig.enemyDmgMult;
        radius = 0.9;
      } else if (typeRoll < 0.6 && scenario.id === 'yellow-turbans') {
        enemyType = 'SORCERER';
        hp = 120 * diffConfig.enemyHpMult;
        dmg = 20 * diffConfig.enemyDmgMult;
      }

      enemies.push({
        id: `enemy_${enemyIdSeq++}`,
        type: enemyType,
        position: {
          x: baseCenter.x + Math.cos(angle) * dist,
          y: 0,
          z: baseCenter.z + Math.sin(angle) * dist,
        },
        velocity: { x: 0, y: 0, z: 0 },
        rotationY: Math.random() * Math.PI * 2,
        health: hp,
        maxHealth: hp,
        speed: (2.0 + Math.random() * 0.8) * diffConfig.enemySpeedMult,
        damage: dmg,
        radius,
        isDead: false,
        deathTimer: 0,
        attackCooldown: 1.0 + Math.random() * 1.5,
        isAirborne: false,
        airTumbleAngle: 0,
        hitFlashTimer: 0,
      });
    }
  });

  // Spawn Forward Enemy Vanguard marching down the road towards Player Base (16 troops + Captain)
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 2 + Math.random() * 6;
    const isVanguardCaptain = i === 0;
    const type: EnemyType3D = isVanguardCaptain ? 'CAPTAIN' : i % 3 === 0 ? 'SHIELD' : i % 4 === 0 ? 'ARCHER' : 'GRUNT';
    const hp = (isVanguardCaptain ? 500 : type === 'SHIELD' ? 180 : 100) * diffConfig.enemyHpMult;

    enemies.push({
      id: `vanguard_enemy_${enemyIdSeq++}`,
      type,
      position: {
        x: playerSpawn.x + Math.sin(angle) * dist,
        y: 0,
        z: playerSpawn.z + 18 + Math.cos(angle) * (dist * 0.6),
      },
      velocity: { x: 0, y: 0, z: 0 },
      rotationY: Math.PI, // Facing towards allied base
      health: hp,
      maxHealth: hp,
      speed: 2.1 * diffConfig.enemySpeedMult,
      damage: (isVanguardCaptain ? 24 : 12) * diffConfig.enemyDmgMult,
      radius: isVanguardCaptain ? 1.1 : 0.8,
      isDead: false,
      deathTimer: 0,
      attackCooldown: 1.0 + Math.random(),
      isAirborne: false,
      airTumbleAngle: 0,
      hitFlashTimer: 0,
      name: isVanguardCaptain ? 'Vanguard Raid Captain' : undefined,
      title: isVanguardCaptain ? 'Forward Officer' : undefined,
      color: isVanguardCaptain ? '#f59e0b' : undefined,
    });
  }

  // Central River Crossing Ambush Squad (12 troops near Bridge [-25, 0, 25])
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 2.5 + Math.random() * 5.5;
    const isBridgeCaptain = i === 0;
    const type: EnemyType3D = isBridgeCaptain ? 'CAPTAIN' : i % 2 === 0 ? 'ARCHER' : 'GRUNT';
    const hp = (isBridgeCaptain ? 480 : 100) * diffConfig.enemyHpMult;

    enemies.push({
      id: `bridge_ambush_${enemyIdSeq++}`,
      type,
      position: {
        x: -25 + Math.cos(angle) * dist,
        y: 0,
        z: 25 + Math.sin(angle) * dist,
      },
      velocity: { x: 0, y: 0, z: 0 },
      rotationY: Math.random() * Math.PI * 2,
      health: hp,
      maxHealth: hp,
      speed: 2.0 * diffConfig.enemySpeedMult,
      damage: 13 * diffConfig.enemyDmgMult,
      radius: isBridgeCaptain ? 1.1 : 0.8,
      isDead: false,
      deathTimer: 0,
      attackCooldown: 1.2 + Math.random(),
      isAirborne: false,
      airTumbleAngle: 0,
      hitFlashTimer: 0,
      name: isBridgeCaptain ? 'Bridge Guard Officer' : undefined,
      title: isBridgeCaptain ? 'Tactical Defense' : undefined,
      color: isBridgeCaptain ? '#e11d48' : undefined,
    });
  }

  // Spawn Allied Vanguard to fight alongside player
  const allies: AlliedSoldier3D[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 2 + Math.random() * 6;
    allies.push({
      id: `ally_${i + 1}`,
      position: {
        x: playerSpawn.x + Math.cos(angle) * dist,
        y: 0,
        z: playerSpawn.z + Math.sin(angle) * dist,
      },
      velocity: { x: 0, y: 0, z: 0 },
      rotationY: Math.random() * Math.PI * 2,
      health: 160,
      maxHealth: 160,
      speed: 2.2,
      radius: 0.8,
      attackCooldown: 1.0 + Math.random(),
    });
  }

  return {
    player,
    enemies,
    allies,
    slashes: [],
    shockwaves: [],
    fireZones: [],
    arrows: [],
    damageNumbers: [],
    items: [],
    bases: bases3D,
    objectives: JSON.parse(JSON.stringify(scenario.objectives)),
    koCount: 0,
    comboCount: 0,
    comboTimer: 0,
    comboRank: 'D',
    alliedMorale: 50,
    enemyMorale: 50,
    screenShake: { intensity: 0, duration: 0 },
    bossSpawned: false,
    isVictory: false,
    isDefeat: false,
  };
}

export function updateComboRank(combo: number): ComboRank {
  if (combo >= 150) return 'SSS';
  if (combo >= 100) return 'SS';
  if (combo >= 60) return 'S';
  if (combo >= 35) return 'A';
  if (combo >= 20) return 'B';
  if (combo >= 8) return 'C';
  return 'D';
}

export function spawnBoss3D(
  scenario: BattleScenario,
  difficulty: DifficultyLevel
): EnemyEntity3D {
  const diffConfig = Constants.DIFFICULTY_CONFIGS[difficulty];
  const citadelBase = scenario.bases[scenario.bases.length - 1];
  const bossPos = mapTo3D({ x: citadelBase.x, y: citadelBase.y });

  return {
    id: `boss_${scenario.id}`,
    type: 'BOSS',
    position: { x: bossPos.x, y: 0, z: bossPos.z },
    velocity: { x: 0, y: 0, z: 0 },
    rotationY: Math.PI,
    health: 3500 * diffConfig.bossHpMult,
    maxHealth: 3500 * diffConfig.bossHpMult,
    speed: 2.5 * diffConfig.enemySpeedMult,
    damage: 45 * diffConfig.enemyDmgMult,
    radius: 1.8,
    isDead: false,
    deathTimer: 0,
    attackCooldown: 1.8,
    isAirborne: false,
    airTumbleAngle: 0,
    hitFlashTimer: 0,
    name: scenario.bossName,
    title: scenario.bossTitle,
    color: '#ef4444',
  };
}

export function dropItem3D(pos: Vector3D): ItemDrop3D {
  const roll = Math.random();
  let type: ItemType = ItemType.HEALTH_BUN;
  if (roll < 0.4) type = ItemType.HEALTH_BUN;
  else if (roll < 0.7) type = ItemType.WINE_MUSOU;
  else if (roll < 0.85) type = ItemType.WAR_DRUM;
  else if (roll < 0.95) type = ItemType.SPEED_BOOTS;
  else type = ItemType.IMPERIAL_SEAL;

  return {
    id: `item_${Date.now()}_${Math.random()}`,
    type,
    position: { x: pos.x, y: 0.5, z: pos.z },
    rotationY: 0,
    life: 25.0,
  };
}
