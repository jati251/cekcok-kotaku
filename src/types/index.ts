// Platform Core Types & Re-exports
export * from '../games/empires-and-allies/types';

export type ActiveGameTab = 'launcher' | 'game' | 'combat' | 'visiting_ally' | 'cityville' | 'tetris';

export interface LauncherGame {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  category: 'strategy' | 'tycoon' | 'farming' | 'rpg' | 'simulation' | 'casual' | 'arcade';
  status: 'playable' | 'in_development' | 'coming_soon';
  releaseYear: string;
  description: string;
  features: string[];
  accentColor: string;
}
