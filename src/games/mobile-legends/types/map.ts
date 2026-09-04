import type { Team } from './hero';

export type Lane = 'top' | 'mid' | 'bot';

export type TurretTier = 'outer' | 'inner' | 'base';

export interface TurretEntity {
  id: string;
  lane: Lane;
  tier: TurretTier;
  team: Team;
  maxHp: number;
  currentHp: number;
  physicalAttack: number;
  physicalDefense: number;
  range: number;
  position: { x: number; y: number; z: number };
  targetEntityId: string | null;
  laserProgress: number; // For rendering 3D beam animation
  isDestroyed: boolean;
  hasShieldPlating: boolean; // First 5 minutes damage reduction
  consecutiveHitsOnTarget: number;
}

export interface BaseCoreEntity {
  id: string;
  team: Team;
  maxHp: number;
  currentHp: number;
  physicalAttack: number;
  range: number;
  position: { x: number; y: number; z: number };
  targetEntityId: string | null;
  isDestroyed: boolean;
}

export type MinionType = 'melee' | 'ranged' | 'siege' | 'super';

export interface MinionEntity {
  id: string;
  lane: Lane;
  team: Team;
  type: MinionType;
  maxHp: number;
  currentHp: number;
  physicalAttack: number;
  physicalDefense: number;
  attackSpeed: number;
  attackRange: number;
  movementSpeed: number;
  position: { x: number; y: number; z: number };
  rotationY: number;
  waypointIndex: number;
  targetEntityId: string | null;
  isDead: boolean;
  goldReward: number;
  expReward: number;
}

export type JungleCampType =
  | 'blue_buff'
  | 'red_buff'
  | 'rock_golem'
  | 'scaled_lizard'
  | 'turtle'
  | 'lord';

export interface JungleCampEntity {
  id: string;
  campType: JungleCampType;
  name: string;
  maxHp: number;
  currentHp: number;
  physicalAttack: number;
  attackRange: number;
  position: { x: number; y: number; z: number };
  spawnPosition: { x: number; y: number; z: number };
  leashRadius: number;
  respawnTimeSeconds: number;
  remainingRespawnTimer: number;
  isAlive: boolean;
  targetEntityId: string | null;
  goldReward: number;
  expReward: number;
  buffType?: 'blue' | 'red' | 'turtle' | 'lord';
}

export interface BushZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  center: { x: number; y: number; z: number };
}

export interface MapWaypoint {
  x: number;
  y: number;
  z: number;
}
