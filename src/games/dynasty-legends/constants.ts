import {
  HeroType,
  DifficultyLevel,
  DifficultyConfig,
  MapTheme,
  ComboRank,
} from './types';

export { SCENARIOS } from './scenarios';

export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;
export const WORLD_SIZE = 3800; // Grand Battlefield Scale
export const TILE_SIZE = 64;

// SPEEDS & COMBAT
export const ENEMY_SPEED = 1.1;
export const ALLIED_SPEED = 1.2;
export const ARCHER_SPEED = 0.85;
export const BOSS_SPEED = 1.7;
export const CAVALRY_SPEED = 3.0;

// WAVE SPAWNING
export const WAVE_INTERVAL = 260;
export const MAX_ENEMIES = 140;
export const MAX_ALLIES = 40;

export const MUSOU_GAUGE_MAX = 100;
export const MUSOU_DRAIN_RATE = 0.7;
export const KILLS_TO_FILL_MUSOU = 2.0;

// Drops
export const DROP_CHANCE_HEALTH = 0.05;
export const DROP_CHANCE_SPECIAL = 0.03;
export const ITEM_HEAL_AMOUNT = 80;

// Archer Mechanics
export const ARCHER_RANGE = 380;
export const ARROW_SPEED = 7;
export const ARROW_DAMAGE = 12;

// Player Combat Defaults
export const PLAYER_ATTACK_ARC = Math.PI / 1.4;
export const PLAYER_MAX_HP = 350;

// --- HERO PROFILES ---
export const HERO_STATS = {
  [HeroType.GUAN_YU]: {
    name: 'Guan Yu',
    title: 'God of War · Lord of the Beautiful Beard',
    weaponName: 'Green Dragon Crescent Blade',
    speed: 3.6,
    hp: 420,
    cooldown: 13,
    range: 165,
    color: '#16a34a',
    accentColor: '#4ade80',
    desc: 'Wields the mighty Guan Dao with sweeping broad slashes that decimate soldier clusters.',
  },
  [HeroType.ZHAO_YUN]: {
    name: 'Zhao Yun',
    title: 'Dragon of Changban',
    weaponName: 'Fierce Dragon Spear',
    speed: 4.5,
    hp: 330,
    cooldown: 8,
    range: 145,
    color: '#38bdf8',
    accentColor: '#bae6fd',
    desc: 'Peerless spear technique with lightning thrusts, exceptional mobility, and quick recovery.',
  },
  [HeroType.LU_BU]: {
    name: 'Lu Bu',
    title: 'The Flying General · Peerless Among Men',
    weaponName: 'Sky Piercer Halberd',
    speed: 4.0,
    hp: 550,
    cooldown: 18,
    range: 190,
    color: '#dc2626',
    accentColor: '#f87171',
    desc: 'Unrivaled raw power. Each swing creates ground shockwaves that shatter enemy armor.',
  },
  [HeroType.LU_XUN]: {
    name: 'Lu Xun',
    title: 'Grand Strategist of Wu',
    weaponName: 'Twin Swallow Sabres',
    speed: 4.3,
    hp: 310,
    cooldown: 7,
    range: 135,
    color: '#f97316',
    accentColor: '#fed7aa',
    desc: 'Dual blades infused with flame whirlwinds. Fast combo strikes build Musou rapidly.',
  },
};

// Weapon Evolution Stats
export const WEAPON_TIERS = {
  [HeroType.GUAN_YU]: [
    { kills: 0, range: 165, damage: 35, name: 'Iron Crescent Blade' },
    { kills: 40, range: 185, damage: 60, name: 'Dragonhead Glaive' },
    { kills: 90, range: 215, damage: 95, name: 'Azure Dragon Blade' },
    { kills: 160, range: 250, damage: 155, name: 'Divine Green Dragon' },
  ],
  [HeroType.ZHAO_YUN]: [
    { kills: 0, range: 145, damage: 22, name: 'Steel Pike' },
    { kills: 40, range: 160, damage: 40, name: 'Silver Dragon Spear' },
    { kills: 90, range: 180, damage: 70, name: 'Thunder Drake Lance' },
    { kills: 160, range: 210, damage: 120, name: 'Heavenly Dragon Pierce' },
  ],
  [HeroType.LU_BU]: [
    { kills: 0, range: 190, damage: 55, name: 'Heavy Battleaxe' },
    { kills: 40, range: 210, damage: 85, name: 'Demon Cleaver' },
    { kills: 90, range: 235, damage: 130, name: 'Sky Piercing Halberd' },
    { kills: 160, range: 275, damage: 210, name: 'Asura God Sunderer' },
  ],
  [HeroType.LU_XUN]: [
    { kills: 0, range: 135, damage: 20, name: 'Bronze Daggers' },
    { kills: 40, range: 150, damage: 36, name: 'Crimson Swallow Sabres' },
    { kills: 90, range: 170, damage: 62, name: 'Firestorm Twin Blades' },
    { kills: 160, range: 195, damage: 105, name: 'Phoenix Fire Wings' },
  ],
};

export const COMBO_RANKS: { rank: ComboRank; threshold: number; label: string; color: string }[] = [
  { rank: 'SSS', threshold: 120, label: 'TRUE WARRIOR OF THE THREE KINGDOMS!', color: '#eab308' },
  { rank: 'SS', threshold: 80, label: 'SUPREME WARLORD!', color: '#ef4444' },
  { rank: 'S', threshold: 50, label: 'SENSATIONAL!', color: '#ec4899' },
  { rank: 'A', threshold: 30, label: 'AWESOME!', color: '#a855f7' },
  { rank: 'B', threshold: 18, label: 'GREAT!', color: '#3b82f6' },
  { rank: 'C', threshold: 8, label: 'GOOD!', color: '#10b981' },
  { rank: 'D', threshold: 0, label: 'FIGHTING', color: '#94a3b8' },
];

export const COLORS = {
  PLAYER: '#3b82f6',
  ALLIED: '#38bdf8',
  ALLIED_DARK: '#0284c7',
  ALLIED_BANNER: '#0284c7',

  ENEMY: '#dc2626',
  ENEMY_DARK: '#991b1b',
  ENEMY_ARCHER: '#ea580c',
  ENEMY_CAPTAIN: '#f43f5e',
  BOSS: '#450a0a',
  BOSS_GOLD: '#fbbf24',

  ARROW: '#fef3c7',
  ARROW_TRAIL: '#ea580c',

  SKIN: '#ffcdb2',
  SKIN_SHADOW: '#e0a899',
  HORSE_BODY: '#451a03',
  HORSE_MANE: '#1c1917',

  MUSOU_ACTIVE: '#fbbf24',
  TEXT_DAMAGE: '#ffffff',
  TEXT_CRIT: '#fbbf24',
  TEXT_HEAL: '#4ade80',
};

// --- MAP THEMES ---
export interface MapThemeConfig {
  groundBase: string;
  groundVar1: string;
  grassDark: string;
  grassLight: string;
  treeLeaves: string;
  treeLeavesLight: string;
  treeLeavesShadow: string;
  treeTrunk: string;
  buildingRoof: string;
  buildingRoofShadow: string;
  buildingWall: string;
  rock: string;
  rockLight: string;
  rockDark: string;
  ambientParticleColor: string;
  ambientParticleType: 'ember' | 'snow' | 'leaf' | 'dust';
  ambientParticleRate: number;
  fogColor: string;
}

export const MAP_THEMES: Record<MapTheme, MapThemeConfig> = {
  [MapTheme.GRASSLAND]: {
    groundBase: '#2d3728',
    groundVar1: '#374332',
    grassDark: '#1c2419',
    grassLight: '#46563e',
    treeLeaves: '#2e4c1e',
    treeLeavesLight: '#44722c',
    treeLeavesShadow: '#1a2c11',
    treeTrunk: '#3e2415',
    buildingRoof: '#881337',
    buildingRoofShadow: '#4c0519',
    buildingWall: '#d6d3d1',
    rock: '#57534e',
    rockLight: '#78716c',
    rockDark: '#292524',
    ambientParticleColor: '#84cc16',
    ambientParticleType: 'leaf',
    ambientParticleRate: 0.05,
    fogColor: 'rgba(30, 41, 20, 0.1)',
  },
  [MapTheme.HULAO_SNOW]: {
    groundBase: '#475569',
    groundVar1: '#64748b',
    grassDark: '#334155',
    grassLight: '#94a3b8',
    treeLeaves: '#475569',
    treeLeavesLight: '#cbd5e1',
    treeLeavesShadow: '#1e293b',
    treeTrunk: '#334155',
    buildingRoof: '#991b1b',
    buildingRoofShadow: '#450a0a',
    buildingWall: '#f1f5f9',
    rock: '#94a3b8',
    rockLight: '#e2e8f0',
    rockDark: '#475569',
    ambientParticleColor: '#f8fafc',
    ambientParticleType: 'snow',
    ambientParticleRate: 0.12,
    fogColor: 'rgba(226, 232, 240, 0.15)',
  },
  [MapTheme.CHIBI_FIRE]: {
    groundBase: '#291e1a',
    groundVar1: '#3b2820',
    grassDark: '#1a120e',
    grassLight: '#4a3225',
    treeLeaves: '#78350f',
    treeLeavesLight: '#b45309',
    treeLeavesShadow: '#451a03',
    treeTrunk: '#1c1917',
    buildingRoof: '#b91c1c',
    buildingRoofShadow: '#450a0a',
    buildingWall: '#78716c',
    rock: '#44403c',
    rockLight: '#78716c',
    rockDark: '#1c1917',
    ambientParticleColor: '#f97316',
    ambientParticleType: 'ember',
    ambientParticleRate: 0.15,
    fogColor: 'rgba(120, 53, 15, 0.2)',
  },
  [MapTheme.RAVINE]: {
    groundBase: '#382e25',
    groundVar1: '#4a3d31',
    grassDark: '#261f18',
    grassLight: '#5c4b3c',
    treeLeaves: '#365314',
    treeLeavesLight: '#4d7c0f',
    treeLeavesShadow: '#1a2e05',
    treeTrunk: '#292524',
    buildingRoof: '#7f1d1d',
    buildingRoofShadow: '#450a0a',
    buildingWall: '#a8a29e',
    rock: '#57534e',
    rockLight: '#78716c',
    rockDark: '#292524',
    ambientParticleColor: '#d97706',
    ambientParticleType: 'dust',
    ambientParticleRate: 0.06,
    fogColor: 'rgba(74, 61, 49, 0.15)',
  },
  [MapTheme.DESERT]: {
    groundBase: '#78593a',
    groundVar1: '#8c6b47',
    grassDark: '#5e4329',
    grassLight: '#9e7b54',
    treeLeaves: '#545229',
    treeLeavesLight: '#7c7a3d',
    treeLeavesShadow: '#363417',
    treeTrunk: '#45321f',
    buildingRoof: '#883b13',
    buildingRoofShadow: '#4c1e05',
    buildingWall: '#d6c7b2',
    rock: '#786857',
    rockLight: '#9c8874',
    rockDark: '#4a3e31',
    ambientParticleColor: '#eab308',
    ambientParticleType: 'dust',
    ambientParticleRate: 0.08,
    fogColor: 'rgba(120, 89, 58, 0.15)',
  },
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.EASY]: {
    label: 'Easy',
    description: 'Relaxed campaign experience. Enemies have reduced health.',
    enemyHpMult: 0.7,
    enemyDmgMult: 0.5,
    enemySpeedMult: 0.85,
    waveSizeBonus: -2,
    bossHpMult: 0.65,
    dropChanceMult: 1.8,
  },
  [DifficultyLevel.NORMAL]: {
    label: 'Normal',
    description: 'Authentic Musou battlefield warfare with balanced forces.',
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    enemySpeedMult: 1.0,
    waveSizeBonus: 0,
    bossHpMult: 1.0,
    dropChanceMult: 1.0,
  },
  [DifficultyLevel.HARD]: {
    label: 'Hard',
    description: 'Aggressive enemy officers and tough fortress garrisons.',
    enemyHpMult: 1.45,
    enemyDmgMult: 1.4,
    enemySpeedMult: 1.15,
    waveSizeBonus: 3,
    bossHpMult: 1.6,
    dropChanceMult: 0.6,
  },
  [DifficultyLevel.CHAOS]: {
    label: 'Chaos',
    description: 'Relentless hordes and lethal officers. For master warlords only.',
    enemyHpMult: 2.2,
    enemyDmgMult: 2.2,
    enemySpeedMult: 1.35,
    waveSizeBonus: 6,
    bossHpMult: 2.5,
    dropChanceMult: 0.35,
  },
};
