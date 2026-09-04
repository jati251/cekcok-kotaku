export type MusicGenre = 'house' | 'electro' | 'pop' | 'disco' | 'synthwave';

export type FurnitureCategory =
  | 'bar'
  | 'dance_floor'
  | 'dj_booth'
  | 'vip_lounge'
  | 'lighting'
  | 'audio'
  | 'decoration';

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  price: number;
  luxePrice?: number;
  levelReq: number;
  hypeBonus: number;
  width: number; // grid tiles
  height: number;
  colorTheme: string;
  description: string;
}

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  gridX: number;
  gridY: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface DrinkRecipe {
  id: string;
  name: string;
  category: 'beer' | 'cocktail' | 'shot' | 'champagne';
  prepTimeSec: number;
  cost: number;
  revenue: number;
  xpReward: number;
  servings: number;
  levelReq: number;
  color: string;
  description: string;
}

export interface ActiveBarStation {
  barInstanceId: string;
  activeDrinkId: string | null;
  startedAt: number; // timestamp ms
  prepDurationSec: number;
  servingsRemaining: number;
  isReady: boolean;
}

export type GuestState =
  | 'dancing'
  | 'ordering_drink'
  | 'vip_chilling'
  | 'wandering'
  | 'leaving';

export interface Guest {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: GuestState;
  mood: number; // 0 to 100
  danceStep: number;
  color: string;
  isCelebrity?: boolean;
  celebrityName?: string;
  tipReady?: number; // amount of tip waiting to be tapped/collected
}

export interface DoorQueueGuest {
  id: string;
  name: string;
  styleRating: number; // 1 to 5 stars
  isVIP: boolean;
  isTroublemaker: boolean;
  entryFee: number;
  avatarColor: string;
}

export type StaffRole = 'bartender' | 'bouncer' | 'dancer' | 'dj';

export interface StaffMember {
  role: StaffRole;
  name: string;
  level: number;
  maxLevel: number;
  upgradeCost: number;
  benefit: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  genre: MusicGenre;
  bpm: number;
  hypeMultiplier: number;
}

export interface CelebrityGuest {
  id: string;
  name: string;
  title: string;
  minHypeReq: number;
  tipBonus: number;
  starBonus: number;
  avatarColor: string;
}

export interface ClubQuest {
  id: string;
  title: string;
  description: string;
  targetType: 'serve_drinks' | 'admit_vips' | 'buy_furniture' | 'dj_scratch' | 'reach_hype';
  targetCount: number;
  currentCount: number;
  rewardCash: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export type ClubModalType =
  | 'bar_menu'
  | 'shop_furniture'
  | 'dj_booth'
  | 'bouncer_rope'
  | 'staff'
  | 'quests'
  | null;
