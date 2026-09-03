export type ResourceType = 'coins' | 'wood' | 'oil' | 'energy' | 'honor';

export interface PlayerResources {
  coins: number;
  wood: number;
  oil: number;
  energy: number;
  maxEnergy: number;
  honor: number;
  xp: number;
  level: number;
  population: number;
  maxPopulation: number;
}

export type BuildingCategory = 'military' | 'production' | 'defense' | 'residential' | 'community' | 'infrastructure';

export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  category: BuildingCategory;
  width: number;
  height: number;
  cost: {
    coins?: number;
    wood?: number;
    oil?: number;
  };
  requiredLevel: number;
  constructionTimeSeconds: number;
  production?: {
    resource: ResourceType;
    amount: number;
    intervalSeconds: number;
  };
  populationCapacity?: number; // For residences
  populationBonus?: number;   // For community buildings raising cap
  defenseScore?: number;
  isCoastal?: boolean;        // For shipyard / docks
  color: string;
  accentColor: string;
  icon: string;
}

export interface PlacedBuilding {
  id: string;
  buildingTypeId: string;
  gridX: number;
  gridY: number;
  level: number;
  placedAt: number;
  constructedAt: number;
  isCompleted: boolean;
  lastHarvestAt: number;
}

export type UnitClass = 'infantry' | 'armor' | 'artillery' | 'aircraft' | 'naval';

export interface UnitDefinition {
  id: string;
  name: string;
  unitClass: UnitClass;
  hp: number;
  maxHp: number;
  attackPower: number;
  speed: number;
  criticalChance: number;
  strongAgainst: UnitClass;
  weakAgainst: UnitClass;
  trainingCost: {
    coins?: number;
    wood?: number;
    oil?: number;
    population: number;
  };
  trainingTimeSeconds: number;
  buildingSourceId: string;
  icon: string;
  description: string;
}

export interface CombatUnit extends UnitDefinition {
  instanceId: string;
  currentHp: number;
  isPlayer: boolean;
  slotIndex: number;
}

export interface WildernessObstacle {
  id: string;
  gridX: number;
  gridY: number;
  type: 'jungle_tree' | 'granite_rock' | 'crashed_salvage';
  name: string;
  clearCost: {
    energy: number;
    coins: number;
  };
  rewards: {
    wood?: number;
    coins?: number;
    oil?: number;
    xp: number;
    materialItem?: string;
  };
}

export interface WarMaterials {
  aluminum: number;
  steel: number;
  rubber: number;
  copper: number;
  microchips: number;
}

export interface Superweapon {
  id: string;
  name: string;
  description: string;
  damage: number;
  cost: Partial<WarMaterials>;
  icon: string;
}

export interface CampaignSector {
  id: string;
  name: string;
  subtitle: string;
  enemyCommander: string;
  difficulty: number;
  rewards: {
    coins: number;
    oil: number;
    xp: number;
    rareMaterial: keyof WarMaterials;
  };
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
}

export interface AllyCommander {
  id: string;
  name: string;
  title: string;
  avatar: string;
  level: number;
  reputation: number;
  hasVisitedToday: boolean;
  buildings: PlacedBuilding[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  advisorName: string;
  advisorAvatar: string;
  dialogue: string[];
  targetType: 'build' | 'harvest' | 'combat' | 'level' | 'clear' | 'train' | 'visit';
  targetKey: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  rewards: {
    coins?: number;
    wood?: number;
    oil?: number;
    xp?: number;
    energy?: number;
    honor?: number;
  };
}

export type ActiveGameTab = 'launcher' | 'game' | 'combat' | 'visiting_ally';

export interface LauncherGame {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  status: 'playable' | 'in_development' | 'coming_soon';
  releaseYear: string;
  bannerImage: string;
  description: string;
  features: string[];
}
