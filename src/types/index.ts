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
}

export type BuildingCategory = 'military' | 'production' | 'defense' | 'infrastructure';

export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  category: BuildingCategory;
  width: number; // Grid width (e.g., 2)
  height: number; // Grid height (e.g., 2)
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
  populationCapacity?: number;
  defenseScore?: number;
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
  icon: string;
  description: string;
}

export interface CombatUnit extends UnitDefinition {
  instanceId: string;
  currentHp: number;
  isPlayer: boolean;
  slotIndex: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  advisorName: string;
  advisorAvatar: string;
  dialogue: string[];
  targetType: 'build' | 'harvest' | 'combat' | 'level';
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
  };
}

export type ActiveGameTab = 'launcher' | 'game' | 'combat';

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
