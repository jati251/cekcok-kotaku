// Platform Core Types & Re-exports
export * from '../games/empires-and-allies/types';

export type ActiveGameTab = 'launcher' | 'game' | 'combat' | 'visiting_ally' | 'cityville';

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
