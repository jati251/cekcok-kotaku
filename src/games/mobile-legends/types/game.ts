import type { Team } from './hero';

export type MatchState = 'lobby' | 'hero_select' | 'battle' | 'victory' | 'defeat';

export type AnnouncerEventType =
  | 'first_blood'
  | 'double_kill'
  | 'triple_kill'
  | 'maniac'
  | 'savage'
  | 'shutdown'
  | 'legendary'
  | 'ally_slain'
  | 'enemy_slain'
  | 'turret_destroyed'
  | 'enemy_turret_destroyed'
  | 'turtle_spawned'
  | 'turtle_slain'
  | 'lord_spawned'
  | 'lord_summoned'
  | 'respawned'
  | 'victory'
  | 'defeat';

export interface AnnouncerBanner {
  id: string;
  type: AnnouncerEventType;
  title: string;
  subtitle: string;
  killerName?: string;
  victimName?: string;
  team: Team;
  timestamp: number;
}

export interface PlayerKDAStats {
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damageDealt: number;
  damageTaken: number;
  turretKills: number;
  mvpScore: number;
}

export interface MatchScoreboardData {
  blueKills: number;
  redKills: number;
  matchDurationSeconds: number;
  blueScore: number;
  redScore: number;
}
