// CityVille Domain Types

export type CityBuildingType =
  | 'residential'
  | 'business'
  | 'community'
  | 'farming'
  | 'decoration'
  | 'road';

export interface CityBuildingDefinition {
  id: string;
  name: string;
  category: CityBuildingType;
  description: string;
  width: number;
  height: number;
  costCoins: number;
  requiredLevel: number;
  constructionTimeSeconds: number;
  populationYield?: number;
  populationCapBonus?: number;
  rentPayout?: {
    amount: number;
    intervalSeconds: number;
  };
  goodsCost?: number;
  revenueCoins?: number;
  businessDurationSeconds?: number;
  payoutBonusPercent?: number;
  color: string;
  accentColor: string;
  icon: string;
}

export interface CropDefinition {
  id: string;
  name: string;
  growthSeconds: number;
  costCoins: number;
  goodsYield: number;
  xpYield: number;
  icon: string;
  description: string;
}

export interface PlacedCityBuilding {
  id: string;
  buildingTypeId: string;
  gridX: number;
  gridY: number;
  level: number;
  placedAt: number;
  constructedAt: number;
  isCompleted: boolean;
  lastHarvestAt: number;
  isStocked?: boolean;
  stockedAt?: number;
  cropId?: string | null;
  plantedAt?: number | null;
}

export interface FreightContract {
  id: string;
  title: string;
  transportType: 'cargo_ship' | 'freight_train';
  costCoins: number;
  goodsReward: number;
  deliverySeconds: number;
  isDelivering: boolean;
  orderedAt: number | null;
}

export interface CityQuest {
  id: string;
  title: string;
  description: string;
  advisorName: string;
  advisorAvatar: string;
  dialogue: string[];
  targetType: 'build' | 'harvest_crop' | 'restock' | 'collect_rent' | 'population';
  targetKey: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  rewards: {
    coins?: number;
    goods?: number;
    xp?: number;
    energy?: number;
  };
}
