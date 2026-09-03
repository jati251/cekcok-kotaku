export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  STORY_INTRO = 'STORY_INTRO',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
}

export enum HeroType {
  GUAN_YU = 'GUAN_YU',
  ZHAO_YUN = 'ZHAO_YUN',
  LU_BU = 'LU_BU',
  LU_XUN = 'LU_XUN',
}

export enum MapTheme {
  GRASSLAND = 'GRASSLAND',
  HULAO_SNOW = 'HULAO_SNOW',
  CHIBI_FIRE = 'CHIBI_FIRE',
  RAVINE = 'RAVINE',
  DESERT = 'DESERT',
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ALLIED_SOLDIER = 'ALLIED_SOLDIER',
  ALLIED_OFFICER = 'ALLIED_OFFICER',
  ENEMY_GRUNT = 'ENEMY_GRUNT',
  ENEMY_ARCHER = 'ENEMY_ARCHER',
  ENEMY_SHIELD = 'ENEMY_SHIELD',
  ENEMY_BOMBER = 'ENEMY_BOMBER',
  ENEMY_SORCERER = 'ENEMY_SORCERER',
  ENEMY_CAPTAIN = 'ENEMY_CAPTAIN',
  ENEMY_CAVALRY = 'ENEMY_CAVALRY',
  BOSS = 'BOSS',
}

export interface BattleAnnouncement {
  id: string;
  title: string;
  subtitle: string;
  type: 'officer_slain' | 'milestone' | 'morale';
  color: string;
}

export enum DifficultyLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  CHAOS = 'CHAOS',
}

export interface DifficultyConfig {
  label: string;
  description: string;
  enemyHpMult: number;
  enemyDmgMult: number;
  enemySpeedMult: number;
  waveSizeBonus: number;
  bossHpMult: number;
  dropChanceMult: number;
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
  isAllied?: boolean;
  hitFlashTimer?: number;
  hitStunTimer?: number;
  dashTimer?: number;
}

export interface FireZone {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface MinimapData {
  playerX: number;
  playerY: number;
  worldSize: number;
  enemies: { x: number; y: number; isBoss: boolean }[];
  bases?: TacticalBase[];
  items: { x: number; y: number }[];
  cameraX: number;
  cameraY: number;
  viewWidth: number;
  viewHeight: number;
}

export interface SlashArc {
  x: number;
  y: number;
  angle: number;
  radius: number;
  arcLength: number;
  color: string;
  life: number;
  maxLife: number;
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

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface DamageText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export enum BaseAffiliation {
  ALLIED = 'ALLIED',
  ENEMY = 'ENEMY',
  NEUTRAL = 'NEUTRAL',
}

export interface TacticalBase {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  affiliation: BaseAffiliation;
  captureProgress: number; // 0 to 100
  defenseHp: number;
  maxDefenseHp: number;
  bonusDesc: string;
}

export interface StoryDialog {
  speaker: string;
  title: string;
  avatarColor: string;
  text: string;
  alignment: 'allied' | 'enemy' | 'narrator';
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  type: 'kill_count' | 'capture_base' | 'defeat_officer' | 'boss';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  targetId?: string; // base id or boss name
}

export interface BattleScenario {
  id: string;
  title: string;
  chapter: string;
  subtitle: string;
  description: string;
  bossName: string;
  bossTitle: string;
  bossQuote: string;
  heroObjective: string;
  mapTheme: MapTheme;
  introDialogs: StoryDialog[];
  victoryDialogs: StoryDialog[];
  objectives: MissionObjective[];
  bases: TacticalBase[];
}

export enum PropType {
  TREE = 'TREE',
  BUILDING = 'BUILDING',
  ROCK = 'ROCK',
  BARRICADE = 'BARRICADE',
  TORCH = 'TORCH',
  BANNER = 'BANNER',
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
  isBurning?: boolean;
  collisionRadius?: number;
  collisionWidth?: number;
  collisionDepth?: number;
}

export enum ItemType {
  HEALTH_BUN = 'HEALTH_BUN',
  WINE_MUSOU = 'WINE_MUSOU',
  IMPERIAL_SEAL = 'IMPERIAL_SEAL',
  WAR_DRUM = 'WAR_DRUM',
  SPEED_BOOTS = 'SPEED_BOOTS',
}

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  bouncePhase: number;
}

export type ComboRank = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
