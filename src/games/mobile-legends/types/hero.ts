export type HeroClass = 'marksman' | 'tank' | 'mage' | 'fighter' | 'assassin' | 'support';
export type HeroRole = 'gold_lane' | 'exp_lane' | 'mid_lane' | 'roamer' | 'jungler';
export type Team = 'blue' | 'red';

export interface HeroBaseStats {
  maxHp: number;
  hpRegen: number;
  maxMana: number;
  manaRegen: number;
  physicalAttack: number;
  magicPower: number;
  physicalDefense: number;
  magicDefense: number;
  attackSpeed: number; // Attacks per second, e.g. 1.0
  movementSpeed: number; // In units per second
  attackRange: number; // In units
  critChance: number; // 0 to 1
  critDamage: number; // default 2.0 (200%)
  cooldownReduction: number; // 0 to 0.4 (cap 40%)
  physicalLifesteal: number; // 0 to 1
  magicLifesteal: number; // 0 to 1
  physicalPenetration: number;
  magicPenetration: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  cooldownByLevel: number[]; // seconds per level [lv1, lv2, lv3, lv4]
  manaCostByLevel: number[];
  castRange: number;
  radius: number;
  skillType: 'targeted' | 'skillshot' | 'aoe' | 'self' | 'dash';
  damageType: 'physical' | 'magic' | 'true';
  baseDamageByLevel: number[];
  scalingRatio: number; // % of Phys ATK or Magic Power
  crowdControl?: {
    type: 'stun' | 'slow' | 'knockup' | 'airborne' | 'silence';
    duration: number; // in seconds
    intensity?: number; // e.g., 0.4 for 40% slow
  };
}

export interface HeroPassive {
  name: string;
  description: string;
  icon: string;
}

export interface HeroDefinition {
  id: string;
  name: string;
  title: string;
  heroClass: HeroClass;
  primaryRole: HeroRole;
  avatar: string;
  color: string;
  accentColor: string;
  baseStats: HeroBaseStats;
  growthStats: {
    hpPerLevel: number;
    manaPerLevel: number;
    physAtkPerLevel: number;
    armorPerLevel: number;
  };
  passive: HeroPassive;
  skills: [SkillDefinition, SkillDefinition, SkillDefinition]; // Skill 1, Skill 2, Ultimate
  recommendedBuild: string[]; // item IDs
  spellId: string;
}

export interface ActiveHeroEntity {
  id: string; // unique match instance id, e.g., 'player', 'bot_1'
  heroDefId: string; // e.g. 'layla', 'tigreal'
  team: Team;
  name: string;
  isPlayer: boolean;
  level: number;
  exp: number;
  expToNextLevel: number;
  currentHp: number;
  currentMana: number;
  gold: number;
  netWorth: number;
  position: { x: number; y: number; z: number };
  rotationY: number;
  targetPosition: { x: number; y: number; z: number } | null;
  targetEntityId: string | null;
  state: 'idle' | 'walking' | 'attacking' | 'casting' | 'recalling' | 'dead';
  skillLevels: [number, number, number]; // [skill1, skill2, ult] (0 = locked)
  skillCooldowns: [number, number, number]; // remaining cooldowns in seconds
  spellCooldown: number;
  regenCooldown: number;
  recallTimer: number; // channeled recall countdown
  respawnTimer: number; // remaining seconds until revive
  kills: number;
  deaths: number;
  assists: number;
  items: string[]; // up to 6 item IDs
  buffs: {
    hasBlueBuff: boolean;
    blueBuffTimer: number;
    hasRedBuff: boolean;
    redBuffTimer: number;
    turtleShield: number;
    turtleShieldTimer: number;
    immortalityAvailable: boolean;
    immortalityCooldown: number;
  };
  ccState: {
    type: 'stun' | 'slow' | 'knockup' | 'airborne' | 'silence' | 'none';
    duration: number;
    slowIntensity?: number;
  };
  inBush: boolean;
  currentBushId?: string | null;
  revealTimer?: number; // duration during which hero is revealed even in bush (e.g. after attack)
  isStealthed: boolean;
  stealthTimer: number;
}
