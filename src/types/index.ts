// Platform Core Types & Re-exports
export * from '../games/empires-and-allies/types';

export type ActiveGameTab =
  | 'launcher'
  | 'game'
  | 'combat'
  | 'visiting_ally'
  | 'cityville'
  | 'tetris'
  | 'dynasty-legends'
  | 'rubik-cube'
  | 'sky-raid'
  | 'space-blast'
  | 'moto-rush'
  | 'crazy-wheels'
  | 'mini-golf'
  | 'bumper-brawl'
  | 'snowboard-rush'
  | 'balloon-frenzy'
  | 'feeding-frenzy'
  | 'pizza-frenzy'
  | 'saloon-showdown'
  | 'insaniquarium'
  | 'eight-ball-pool'
  | 'ninja-saga'
  | 'nightclub-city'
  | 'cartown'
  | 'super-kart';

export interface LauncherGame {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  category: 'strategy' | 'tycoon' | 'farming' | 'rpg' | 'simulation' | 'casual' | 'arcade' | 'action' | 'puzzle' | 'sports' | 'racing';
  status: 'playable' | 'in_development' | 'coming_soon';
  releaseYear: string;
  description: string;
  features: string[];
  accentColor: string;
}
