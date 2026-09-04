// Car Town Domain Types

export type CarCategory = 'jdm' | 'muscle' | 'supercar' | 'classic' | 'utility';

export interface CarModel {
  id: string;
  name: string;
  brand: string;
  category: CarCategory;
  priceCoins: number;
  priceBucks: number;
  levelRequired: number;
  baseHp: number;
  baseWeightKg: number;
  baseTopSpeedMph: number;
  baseAccel060: number; // in seconds
  description: string;
  defaultColor: string;
}

export interface VisualCustomization {
  color: string;
  livery: 'none' | 'racing_stripes' | 'flames' | 'drift_star' | 'carbon_hood';
  rimStyle: 'stock' | 'sport_alloy' | 'deep_dish' | 'gold_mesh' | 'forged_black';
  spoiler: 'none' | 'ducktail' | 'gt_wing' | 'carbon_race';
  neonUnderglow: 'none' | 'neon_blue' | 'neon_red' | 'neon_green' | 'neon_purple';
}

export interface PerformanceUpgrades {
  engineStage: number; // 0 to 4
  turboStage: number; // 0 to 4
  tiresStage: number; // 0 to 4
  nitroStage: number; // 0 to 4
  weightReductionStage: number; // 0 to 4
  gearboxStage: number; // 0 to 4
}

export interface OwnedCar {
  id: string;
  modelId: string;
  nickname: string;
  visuals: VisualCustomization;
  performance: PerformanceUpgrades;
  dirtLevel: number; // 0 (clean) to 100 (filthy)
  mileageMiles: number;
  purchasedAt: number;
}

export interface UpgradePartDefinition {
  type: keyof PerformanceUpgrades;
  stage: number;
  name: string;
  priceCoins: number;
  priceBucks: number;
  levelReq: number;
  hpBonus: number;
  weightReductionKg: number;
  accelBonus: number;
}

export interface VisualPartOption<T> {
  id: T;
  name: string;
  priceCoins: number;
  priceBucks: number;
  previewColor?: string;
}

export interface ServiceJob {
  id: string;
  title: string;
  durationSeconds: number;
  payoutCoins: number;
  xpReward: number;
  icon: string;
  description: string;
}

export interface ActiveServiceBay {
  bayId: number;
  currentJob: ServiceJob | null;
  startedAt: number | null;
  assignedCarId: string | null;
}

export interface DragRaceOpponent {
  id: string;
  name: string;
  carName: string;
  tier: 'rookie' | 'street' | 'pro' | 'outlaw';
  avatar: string;
  hp: number;
  weightKg: number;
  reactionTime: number; // in seconds (e.g. 0.3s)
  shiftQuality: number; // 0 to 1 (probability of hitting perfect shift)
  rewardCoins: number;
  rewardXp: number;
  color: string;
}

export interface RaceState {
  isActive: boolean;
  stage: 'countdown' | 'racing' | 'finished';
  countdownStep: number; // 3 (yellow), 2 (yellow), 1 (yellow), 0 (green!)
  playerRpm: number; // 0 to 8000
  playerGear: number; // 1 to 6
  playerSpeedMph: number;
  playerDistanceM: number; // target: 402m (1/4 mile)
  playerTimeSeconds: number;
  playerNitroActive: boolean;
  playerNitroCharge: number; // 0 to 100%
  opponentSpeedMph: number;
  opponentDistanceM: number;
  opponentTimeSeconds: number;
  opponent: DragRaceOpponent | null;
  lastShiftRating: 'early' | 'good' | 'perfect' | 'redline' | null;
  winner: 'player' | 'opponent' | null;
}

export interface GarageDecorItem {
  id: string;
  name: string;
  category: 'flooring' | 'lift' | 'toolbox' | 'neon' | 'decoration';
  priceCoins: number;
  priceBucks: number;
  levelRequired: number;
  bonusPercent: number; // bonus job speed or payout
  description: string;
}

export interface CarTownQuest {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardBucks: number;
  rewardXp: number;
  targetType: 'buy_car' | 'win_race' | 'wash_car' | 'complete_job' | 'tune_part';
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export type CarTownModalType =
  | null
  | 'dealership'
  | 'tuning'
  | 'jobs'
  | 'car_wash'
  | 'garage_decor'
  | 'drag_race'
  | 'quests';
