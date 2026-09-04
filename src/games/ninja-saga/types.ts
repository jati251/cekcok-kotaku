export type NinjaElement = 'fire' | 'water' | 'earth' | 'wind' | 'lightning';

export type NinjaRank =
  | 'academy_student'
  | 'genin'
  | 'chunin'
  | 'jounin'
  | 'special_jounin';

export type StatusEffectType =
  | 'burn'
  | 'stun'
  | 'bleed'
  | 'blind'
  | 'sleep'
  | 'poison'
  | 'attack_buff'
  | 'defense_buff'
  | 'agility_buff'
  | 'shield';

export interface ActiveStatusEffect {
  type: StatusEffectType;
  duration: number; // in turns
  value: number; // damage per turn, buff percentage, or shield amount
  sourceName: string;
}

export type JutsuCategory = 'ninjutsu' | 'taijutsu' | 'genjutsu' | 'kinjutsu';

export interface Jutsu {
  id: string;
  name: string;
  element: NinjaElement | 'neutral';
  category: JutsuCategory;
  requiredLevel: number;
  cpCost: number;
  cooldown: number; // cooldown in turns
  damageMultiplier: number; // e.g. 1.5 = 150% attack power
  target: 'single' | 'all';
  statusEffect?: {
    type: StatusEffectType;
    chance: number; // 0 to 1
    duration: number;
    value: number;
  };
  description: string;
  iconColor: string;
}

export type ItemType = 'weapon' | 'armor' | 'back_item' | 'consumable' | 'material';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  levelReq: number;
  price: number;
  sellPrice: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
  stats?: {
    attack?: number;
    defense?: number;
    agility?: number;
    hp?: number;
    cp?: number;
    critRate?: number;
    dodgeRate?: number;
  };
  consumableEffect?: {
    type: 'heal_hp' | 'restore_cp' | 'cleanse' | 'all';
    amount: number;
  };
  upgradeLevel?: number; // for weapons (+0 to +10)
}

export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'crow' | 'dragon' | 'fox';
  level: number;
  skillName: string;
  skillDescription: string;
  cooldownTurns: number;
  bonusStats: {
    attack?: number;
    agility?: number;
    dodgeRate?: number;
    critRate?: number;
  };
}

export interface MissionEnemy {
  id: string;
  name: string;
  element: NinjaElement | 'neutral';
  level: number;
  hp: number;
  maxHp: number;
  cp: number;
  maxCp: number;
  attack: number;
  defense: number;
  agility: number;
  jutsus: string[]; // Jutsu IDs
  avatarType: 'bandit' | 'rogue_ninja' | 'anbu_mask' | 'demon_ninja' | 'boss_ginkotsu' | 'boss_snake' | 'boss_byakko' | 'boss_kyuubi';
}

export type MissionGrade = 'D' | 'C' | 'B' | 'A' | 'S';

export interface Mission {
  id: string;
  grade: MissionGrade;
  title: string;
  description: string;
  recommendedLevel: number;
  enemy: MissionEnemy;
  rewards: {
    xp: number;
    gold: number;
    tokens?: number;
    itemDrop?: string; // item id
    dropRate?: number; // 0 to 1
  };
  isExam?: boolean;
}

export interface WorldBoss {
  id: string;
  name: string;
  title: string;
  level: number;
  element: NinjaElement;
  hp: number;
  maxHp: number;
  cp: number;
  maxCp: number;
  attack: number;
  defense: number;
  agility: number;
  jutsus: string[];
  specialAbility: string;
  rewards: {
    xp: number;
    gold: number;
    tokens: number;
    legendaryItem: string;
  };
  avatarType: 'boss_ginkotsu' | 'boss_snake' | 'boss_byakko' | 'boss_kyuubi';
}

export interface CharacterAttributes {
  fire: number; // boosts attack & crit damage
  water: number; // boosts max CP & healing
  earth: number; // boosts max HP & defense
  wind: number; // boosts agility & dodge
  lightning: number; // boosts crit rate
}

export interface NinjaCharacter {
  name: string;
  element: NinjaElement;
  gender: 'male' | 'female';
  rank: NinjaRank;
  level: number;
  xp: number;
  maxXp: number;
  gold: number;
  tokens: number;
  attributePoints: number;
  attributes: CharacterAttributes;

  // Equipment
  equippedWeapon: Item | null;
  equippedArmor: Item | null;
  equippedBackItem: Item | null;

  // Active Jutsu Deck (up to 6 slots)
  equippedJutsuIds: string[];
  learnedJutsuIds: string[];

  // Inventory
  inventory: { item: Item; quantity: number }[];

  // Companion Pet
  activePet: Pet | null;
  ownedPets: Pet[];

  // Completed Missions
  completedMissionIds: string[];
  arenaPoints: number;
  arenaRank: string;
}

export interface BattleFighter {
  id: string;
  name: string;
  isPlayer: boolean;
  element: NinjaElement | 'neutral';
  level: number;
  hp: number;
  maxHp: number;
  cp: number;
  maxCp: number;
  attack: number;
  defense: number;
  agility: number;
  critRate: number;
  dodgeRate: number;
  equippedJutsus: Jutsu[];
  jutsuCooldowns: Record<string, number>;
  statusEffects: ActiveStatusEffect[];
  shield: number;
  avatarType: string;
}

export type BattleActionType = 'attack' | 'jutsu' | 'charge' | 'item' | 'pet' | 'flee';

export interface BattleLogEntry {
  id: string;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'crit' | 'heal' | 'status';
}

export interface BattleInstance {
  missionId?: string;
  bossId?: string;
  isPvP?: boolean;
  player: BattleFighter;
  enemy: BattleFighter;
  currentTurn: 'player' | 'enemy';
  turnCount: number;
  petCooldown: number;
  isOver: boolean;
  winner: 'player' | 'enemy' | null;
  logs: BattleLogEntry[];
  rewards?: {
    xp: number;
    gold: number;
    tokens?: number;
    itemDrop?: Item;
  };
}

export type VillageModalType =
  | 'kage_room'
  | 'academy'
  | 'shop'
  | 'blacksmith'
  | 'hunting_house'
  | 'arena'
  | 'pet_house'
  | 'character'
  | null;
