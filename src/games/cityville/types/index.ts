// CityVille Retro Scoped Domain Types

export type CityZone = 'residential' | 'commercial' | 'industrial' | 'community' | 'decoration';

export interface CityBuilding {
  id: string;
  name: string;
  zone: CityZone;
  cost: number;
  populationRequired: number;
  goodsRequired: number;
  revenueCoins: number;
}

export interface CityGameState {
  population: number;
  maxPopulation: number;
  coins: number;
  goods: number;
  cityLevel: number;
}
