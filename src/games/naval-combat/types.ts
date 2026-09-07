import type * as THREE from 'three';

export type ShipClass = 'sloop' | 'brig' | 'frigate';

export type SailState = 'ANCHOR' | 'HALF_SAIL' | 'FULL_SAIL';

export type NavalGameStage = 'MAIN_MENU' | 'SHIP_SELECT' | 'BATTLE' | 'VICTORY' | 'DEFEAT';

export interface ShipConfig {
  id: ShipClass;
  name: string;
  subtitle: string;
  description: string;
  maxHealth: number;
  topSpeed: number; // in knots
  acceleration: number;
  turnSpeed: number; // radians/sec
  cannonsPerSide: number;
  reloadTime: number; // in seconds
  cannonDamage: number;
  length: number; // for buoyancy probing
  width: number; // for buoyancy probing
  hullColor: string;
  trimColor: string;
  sailColor: string;
  flagType: 'pirate' | 'royal' | 'rebel';
}

export interface Cannonball {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  owner: 'player' | 'enemy';
  damage: number;
  life: number;
  maxLife: number;
}

export interface ParticleEffect {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: 'splash' | 'smoke' | 'fire' | 'splinter';
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface EnemyShipData {
  id: string;
  shipClass: ShipClass;
  name: string;
  position: [number, number, number];
  rotationY: number;
  health: number;
  maxHealth: number;
  speed: number;
  state: 'PATROL' | 'CHASE' | 'BROADSIDE_ALIGN' | 'FIRE' | 'SINKING';
  sinkProgress?: number;
  reloadTimer: number;
}

export interface GerstnerWaveParams {
  direction: [number, number]; // Normalized 2D direction (x, z)
  steepness: number; // Q parameter
  wavelength: number; // L
  speed: number; // C
}
