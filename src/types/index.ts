// Platform Core Types & Re-exports
export * from '../games/empires-and-allies/types';

export type ActiveGameTab = 'launcher' | 'game' | 'combat' | 'visiting_ally' | 'cityville';

export type GameCategory = 'all' | 'playable' | 'strategy' | 'tycoon' | 'farming' | 'rpg' | 'simulation' | 'casual';

export interface LauncherGame {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  category: 'strategy' | 'tycoon' | 'farming' | 'rpg' | 'simulation' | 'casual';
  status: 'playable' | 'in_development' | 'coming_soon';
  releaseYear: string;
  bannerImage: string;
  description: string;
  features: string[];
  developer?: string;
  rating?: number;
  playerCount?: string;
  storageSize?: string;
  accentColor?: string;
}
