
export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT'
}

export enum HeroType {
  WARRIOR = 'WARRIOR',
  VIKING = 'VIKING',
  SAMURAI = 'SAMURAI'
}

export enum MapTheme {
  GRASSLAND = 'GRASSLAND',
  DESERT = 'DESERT',
  SNOW = 'SNOW',
  VOLCANIC = 'VOLCANIC',
  FOREST = 'FOREST'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY_GRUNT = 'ENEMY_GRUNT',
  ENEMY_ARCHER = 'ENEMY_ARCHER',
  ENEMY_CAPTAIN = 'ENEMY_CAPTAIN',
  ENEMY_CAVALRY = 'ENEMY_CAVALRY',
  BOSS = 'BOSS'
}

export enum DifficultyLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  NIGHTMARE = 'NIGHTMARE'
}

export interface DifficultyConfig {
  label: string;
  description: string;
  enemyHpMult: number;
  enemyDmgMult: number;
  enemySpeedMult: number;
  waveSizeBonus: number;
  waveIntervalReduction: number;
  bossHpMult: number;
  bossExtraAttacks: number;
  dropChanceMult: number;
  cavalryThreshold: number;
  archerFireRateReduction: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface MobileInputState {
  moveVector: Vector2;
  isAttacking: boolean;
  isMusou: boolean;
  active: boolean;
}

export interface Entity {
  id: string;
  type: EntityType;
  heroType?: HeroType;
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth: number;
  radius: number;
  color: string;
  label: string;
  isDead: boolean;
  deathTimer: number;
  attackCooldown: number;
  facing: number;
  walkFrame: number;
  attackProgress: number;
  weaponLevel: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  radius: number;
  color: string;
  isEnemy: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface DamageText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface BattleScenario {
  title: string;
  description: string;
  bossName: string;
  bossQuote: string;
  heroObjective: string;
  requiredKills: number;
  mapTheme: MapTheme;
}

export enum PropType {
  TREE = 'TREE',
  BUILDING = 'BUILDING',
  ROCK = 'ROCK',
  DECOR = 'DECOR'
}

export interface MapProp {
  id: string;
  type: PropType;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  variant: number;
  collisionRadius?: number;
  collisionWidth?: number;
  collisionDepth?: number;
}

export enum ItemType {
  HEALTH_BUN = 'HEALTH_BUN'
}

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  bouncePhase: number;
}
