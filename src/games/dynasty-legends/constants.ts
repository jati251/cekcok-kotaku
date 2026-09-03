
import { HeroType, BattleScenario, DifficultyLevel, DifficultyConfig, MapTheme } from "./types";

export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;
export const WORLD_SIZE = 2400; // Larger world for armies
export const TILE_SIZE = 64; 

// SPEEDS & COMBAT
export const ENEMY_SPEED = 0.9; 
export const ARCHER_SPEED = 0.7;
export const BOSS_SPEED = 1.6; 
export const CAVALRY_SPEED = 2.8; 

// WAVE SPAWNING
export const WAVE_INTERVAL = 300; // Frames between waves
export const MAX_ENEMIES = 120; // More enemies for "bulk" feel

export const MUSOU_GAUGE_MAX = 100;
export const MUSOU_DRAIN_RATE = 0.8; // Lasts slightly longer
export const KILLS_TO_FILL_MUSOU = 1.5;

// Drops
export const DROP_CHANCE_HEALTH = 0.03; // Reduced to 3% (Harder)
export const ITEM_HEAL_AMOUNT = 60;

// Archer Mechanics
export const ARCHER_RANGE = 350;
export const ARROW_SPEED = 6;
export const ARROW_DAMAGE = 10;

// Player Combat Defaults
export const PLAYER_ATTACK_ARC = Math.PI / 1.5;
export const PLAYER_MAX_HP = 300;

// --- HERO STATS ---
export const HERO_STATS = {
  [HeroType.WARRIOR]: {
    speed: 3.5, 
    hp: 300,
    cooldown: 14,
    range: 130,
    desc: "Balanced General. Wide sweeping attacks."
  },
  [HeroType.VIKING]: {
    speed: 3.0, 
    hp: 450,
    cooldown: 24,
    range: 110, 
    desc: "Heavy Berserker. Slow but devastating axe strikes."
  },
  [HeroType.SAMURAI]: {
    speed: 4.4, 
    hp: 240,
    cooldown: 7, 
    range: 120,
    desc: "Swift Ronin. Rapid, critical katana slashes."
  }
};

// Weapon Evolution Stats
export const WEAPON_TIERS = {
  [HeroType.WARRIOR]: [
    { kills: 0, range: 130, damage: 25, name: "Iron Blade" },
    { kills: 30, range: 160, damage: 45, name: "Steel Glaive" },
    { kills: 70, range: 190, damage: 70, name: "Golden Halberd" },
    { kills: 120, range: 230, damage: 120, name: "Dragon Slayer" }
  ],
  [HeroType.VIKING]: [
    { kills: 0, range: 110, damage: 40, name: "Hand Axe" },
    { kills: 30, range: 120, damage: 65, name: "Bearded Axe" },
    { kills: 70, range: 130, damage: 90, name: "Runed Greataxe" },
    { kills: 120, range: 150, damage: 150, name: "Mjolnir's Might" }
  ],
  [HeroType.SAMURAI]: [
    { kills: 0, range: 120, damage: 15, name: "Uchigatana" },
    { kills: 30, range: 130, damage: 25, name: "Tachi" },
    { kills: 70, range: 140, damage: 40, name: "Muramasa" },
    { kills: 120, range: 150, damage: 70, name: "Masamune" }
  ]
};

export const COLORS = {
  PLAYER: '#3b82f6', 
  PLAYER_DARK: '#1e40af',
  PLAYER_ATTACK: '#60a5fa',
  
  HERO_WARRIOR: '#3b82f6', 
  HERO_VIKING: '#7f1d1d',  
  HERO_SAMURAI: '#1f2937', 
  
  ENEMY: '#b91c1c', // Deep Red
  ENEMY_DARK: '#7f1d1d',
  ENEMY_ARCHER: '#92400e', // Brown/Leather
  ENEMY_CAPTAIN: '#fca5a5', // Pinkish Red
  BOSS: '#450a0a', // Almost black red
  BOSS_GOLD: '#fbbf24',
  
  // Projectiles
  ARROW: '#fef3c7',
  ARROW_TRAIL: '#92400e',

  // Units
  SKIN: '#ffcdb2',
  SKIN_SHADOW: '#e0a899',
  HORSE_BODY: '#5F4025',
  HORSE_MANE: '#28180B',
  
  // UI
  MUSOU_ACTIVE: '#fbbf24', 
  TEXT_DAMAGE: '#ffffff',
  TEXT_CRIT: '#fbbf24',
  TEXT_HEAL: '#4ade80',
  
  // Environment
  GROUND_BASE: '#3f4d3a', // Desaturated battlefield green
  GROUND_VAR_1: '#4a5944', 
  GRASS_DARK: '#283324',
  GRASS_LIGHT: '#586e4e', 
  
  TREE_LEAVES: '#365314',
  TREE_LEAVES_LIGHT: '#4d7c0f',
  TREE_LEAVES_SHADOW: '#1a2e05',
  TREE_TRUNK: '#451a03',
  
  BUILDING_ROOF: '#7f1d1d',
  BUILDING_ROOF_SHADOW: '#450a0a',
  BUILDING_WALL: '#e5e5e5',
  BUILDING_WOOD: '#451a03',
  
  ROCK: '#57534e',
  ROCK_LIGHT: '#78716c',
  ROCK_DARK: '#292524',
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
  ambientParticleRate: number;
  fogColor: string;
}

export const MAP_THEMES: Record<MapTheme, MapThemeConfig> = {
  [MapTheme.GRASSLAND]: {
    groundBase: '#3f4d3a', groundVar1: '#4a5944',
    grassDark: '#283324', grassLight: '#586e4e',
    treeLeaves: '#365314', treeLeavesLight: '#4d7c0f', treeLeavesShadow: '#1a2e05',
    treeTrunk: '#451a03',
    buildingRoof: '#7f1d1d', buildingRoofShadow: '#450a0a', buildingWall: '#e5e5e5',
    rock: '#57534e', rockLight: '#78716c', rockDark: '#292524',
    ambientParticleColor: '#a3e635', ambientParticleRate: 0.02,
    fogColor: 'rgba(180,200,160,0.08)',
  },
  [MapTheme.DESERT]: {
    groundBase: '#a9845a', groundVar1: '#b8936a',
    grassDark: '#8a6e4a', grassLight: '#c4a87a',
    treeLeaves: '#7a5a3a', treeLeavesLight: '#9a7a4a', treeLeavesShadow: '#4a3a2a',
    treeTrunk: '#5a3a1a',
    buildingRoof: '#8a6a3a', buildingRoofShadow: '#5a4a2a', buildingWall: '#d4c4a4',
    rock: '#8a7a5a', rockLight: '#b4a47a', rockDark: '#5a4a3a',
    ambientParticleColor: '#d4b47a', ambientParticleRate: 0.05,
    fogColor: 'rgba(220,200,160,0.12)',
  },
  [MapTheme.SNOW]: {
    groundBase: '#c8c8d0', groundVar1: '#d4d4dc',
    grassDark: '#b0b0b8', grassLight: '#e0e0e8',
    treeLeaves: '#8a8a94', treeLeavesLight: '#b0b0b8', treeLeavesShadow: '#6a6a74',
    treeTrunk: '#5a5a5a',
    buildingRoof: '#8a2a2a', buildingRoofShadow: '#5a1a1a', buildingWall: '#e8e8f0',
    rock: '#9a9aa4', rockLight: '#c0c0c8', rockDark: '#6a6a74',
    ambientParticleColor: '#e8e8f0', ambientParticleRate: 0.08,
    fogColor: 'rgba(200,200,220,0.15)',
  },
  [MapTheme.VOLCANIC]: {
    groundBase: '#2a1a1a', groundVar1: '#3a2222',
    grassDark: '#1a1010', grassLight: '#3a2828',
    treeLeaves: '#6a2a2a', treeLeavesLight: '#8a3a3a', treeLeavesShadow: '#3a1a1a',
    treeTrunk: '#4a2020',
    buildingRoof: '#5a1a1a', buildingRoofShadow: '#3a0a0a', buildingWall: '#6a4a4a',
    rock: '#4a3a3a', rockLight: '#6a4a4a', rockDark: '#2a1a1a',
    ambientParticleColor: '#ff6a00', ambientParticleRate: 0.06,
    fogColor: 'rgba(60,20,10,0.2)',
  },
  [MapTheme.FOREST]: {
    groundBase: '#2a3a2a', groundVar1: '#3a4a3a',
    grassDark: '#1a2a1a', grassLight: '#4a6a4a',
    treeLeaves: '#2a5a2a', treeLeavesLight: '#3a7a3a', treeLeavesShadow: '#1a3a1a',
    treeTrunk: '#3a2a1a',
    buildingRoof: '#5a3a2a', buildingRoofShadow: '#3a2a1a', buildingWall: '#8a7a6a',
    rock: '#5a5a4a', rockLight: '#7a7a6a', rockDark: '#3a3a2a',
    ambientParticleColor: '#6aaa6a', ambientParticleRate: 0.03,
    fogColor: 'rgba(40,60,30,0.12)',
  },
};

// --- DIFFICULTY CONFIGURATIONS ---
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.EASY]: {
    label: 'Easy',
    description: 'Relaxed. Enemies are weaker and drops are plentiful.',
    enemyHpMult: 0.7,
    enemyDmgMult: 0.5,
    enemySpeedMult: 0.8,
    waveSizeBonus: -2,
    waveIntervalReduction: -60,
    bossHpMult: 0.6,
    bossExtraAttacks: 0,
    dropChanceMult: 2.0,
    cavalryThreshold: 60,
    archerFireRateReduction: 30,
  },
  [DifficultyLevel.NORMAL]: {
    label: 'Normal',
    description: 'Standard battlefield experience.',
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    enemySpeedMult: 1.0,
    waveSizeBonus: 0,
    waveIntervalReduction: 0,
    bossHpMult: 1.0,
    bossExtraAttacks: 0,
    dropChanceMult: 1.0,
    cavalryThreshold: 40,
    archerFireRateReduction: 0,
  },
  [DifficultyLevel.HARD]: {
    label: 'Hard',
    description: 'Formidable. Enemies are tougher and more aggressive.',
    enemyHpMult: 1.5,
    enemyDmgMult: 1.5,
    enemySpeedMult: 1.2,
    waveSizeBonus: 3,
    waveIntervalReduction: -60,
    bossHpMult: 1.8,
    bossExtraAttacks: 1,
    dropChanceMult: 0.5,
    cavalryThreshold: 25,
    archerFireRateReduction: -30,
  },
  [DifficultyLevel.NIGHTMARE]: {
    label: 'Nightmare',
    description: 'Death awaits at every turn. Only the strongest survive.',
    enemyHpMult: 2.2,
    enemyDmgMult: 2.5,
    enemySpeedMult: 1.5,
    waveSizeBonus: 6,
    waveIntervalReduction: -120,
    bossHpMult: 3.0,
    bossExtraAttacks: 2,
    dropChanceMult: 0.17,
    cavalryThreshold: 10,
    archerFireRateReduction: -60,
  }
};

// Enemy scaling over time (per 30 seconds)
export const ENEMY_SCALING_PER_30S = {
  hpBonus: 0.05,    // +5% HP every 30s
  dmgBonus: 0.03,   // +3% damage every 30s
  speedBonus: 0.02, // +2% speed every 30s
  maxScale: 2.0,    // Cap at 2x after ~5 minutes (100% increase)
};

// Boss attack patterns
export const BOSS_CHARGE_SPEED_MULT = 3.0;
export const BOSS_AOE_RADIUS = 120;
export const BOSS_AOE_DAMAGE = 20;
export const BOSS_SUMMON_COUNT = 3;

// HARDCODED SCENARIOS
export const SCENARIOS: BattleScenario[] = [
  {
    title: "Rebellion of the Yellow Turbans",
    description: "A fanatical sect has risen. Their numbers are endless, and their faith makes them fearless.",
    bossName: "Zhang Jiao",
    bossQuote: "The Blue Sky is dead! The Yellow Sky shall rise!",
    heroObjective: "Crush the peasant rebellion.",
    requiredKills: 80,
    mapTheme: MapTheme.GRASSLAND
  },
  {
    title: "The Tiger Cage of Hulao",
    description: "The coalition has cornered the tyrant, but his greatest weapon stands at the gate.",
    bossName: "Lu Bu",
    bossQuote: "Do not pursue Lu Bu!",
    heroObjective: "Survive the God of War.",
    requiredKills: 100,
    mapTheme: MapTheme.FOREST
  },
  {
    title: "Flames of Red Cliffs",
    description: "The river burns. The northern fleet is chained together, creating a massive platform of fire.",
    bossName: "Cao Cao",
    bossQuote: "Impossible... My ambition cannot end here!",
    heroObjective: "Defeat the Wei forces amidst the fire.",
    requiredKills: 120,
    mapTheme: MapTheme.VOLCANIC
  },
  {
    title: "Battle of Fan Castle",
    description: "Torrential rains have flooded the castle. The God of War, Guan Yu, approaches.",
    bossName: "Guan Yu",
    bossQuote: "My blade remains sharp. Come, face your destiny.",
    heroObjective: "Defeat the God of War.",
    requiredKills: 110,
    mapTheme: MapTheme.SNOW
  },
  {
    title: "The Fall of Shu",
    description: "The northern army has bypassed the mountains. The capital is defenseless.",
    bossName: "Deng Ai",
    bossQuote: "Speed is the essence of war.",
    heroObjective: "Defend the capital gates.",
    requiredKills: 90,
    mapTheme: MapTheme.FOREST
  },
  {
    title: "Defense of Changban",
    description: "One bridge. One warrior. A million soldiers.",
    bossName: "Xiahou Dun",
    bossQuote: "Out of my way, scum!",
    heroObjective: "Hold the bridge at all costs.",
    requiredKills: 150,
    mapTheme: MapTheme.GRASSLAND
  },
  {
    title: "Showdown at Wuzhang Plains",
    description: "The final battle between the Dragon and the Tiger. The stars are falling.",
    bossName: "Sima Yi",
    bossQuote: "The heavens have revealed your fate.",
    heroObjective: "Break the Strategist's formation.",
    requiredKills: 130,
    mapTheme: MapTheme.DESERT
  },
  {
    title: "Assault on He Fei",
    description: "The Demon of He Fei guards the castle. The sounds of bells strike terror.",
    bossName: "Zhang Liao",
    bossQuote: "Does anyone else wish to die?!",
    heroObjective: "Silence the Demon's bells.",
    requiredKills: 100,
    mapTheme: MapTheme.GRASSLAND
  },
  {
    title: "Revenge at Yi Ling",
    description: "Consumed by rage, the Shu army marches into a fire trap.",
    bossName: "Lu Xun",
    bossQuote: "Your anger blinds you. Burn!",
    heroObjective: "Escape the fire trap.",
    requiredKills: 110,
    mapTheme: MapTheme.VOLCANIC
  },
  {
    title: "Skirmish at Guandu",
    description: "Supply depots are the target. Whoever controls the food, controls the war.",
    bossName: "Yuan Shao",
    bossQuote: "My noble heritage is unmatched!",
    heroObjective: "Raid the supply depot.",
    requiredKills: 70,
    mapTheme: MapTheme.DESERT
  }
];
