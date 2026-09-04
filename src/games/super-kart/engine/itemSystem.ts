import * as THREE from 'three';
import { type KartItemType } from '../stores/kartStore';

export interface ItemBoxEntity {
  id: string;
  position: [number, number, number];
  isActive: boolean;
  respawnTimer: number;
}

export interface HazardEntity {
  id: string;
  type: 'banana';
  position: THREE.Vector3;
  isActive: boolean;
}

export interface ProjectileEntity {
  id: string;
  type: 'green-shell' | 'red-shell';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  splineProgress?: number;
  lifeTime: number;
  isActive: boolean;
}

// 2 clusters of 3 item boxes along the circuit
export const INITIAL_ITEM_BOXES: ItemBoxEntity[] = [
  // Cluster 1 (Before turn 1)
  { id: 'box-1', position: [-4, 1.2, 75], isActive: true, respawnTimer: 0 },
  { id: 'box-2', position: [0, 1.2, 75], isActive: true, respawnTimer: 0 },
  { id: 'box-3', position: [4, 1.2, 75], isActive: true, respawnTimer: 0 },

  // Cluster 2 (Back straightaway)
  { id: 'box-4', position: [156, 1.2, -45], isActive: true, respawnTimer: 0 },
  { id: 'box-5', position: [160, 1.2, -45], isActive: true, respawnTimer: 0 },
  { id: 'box-6', position: [164, 1.2, -45], isActive: true, respawnTimer: 0 },
];

export const ITEM_POOL: KartItemType[] = ['mushroom', 'banana', 'green-shell', 'red-shell', 'star'];

export function getRandomItem(): KartItemType {
  const rand = Math.random();
  if (rand < 0.35) return 'mushroom';
  if (rand < 0.6) return 'banana';
  if (rand < 0.8) return 'green-shell';
  if (rand < 0.93) return 'red-shell';
  return 'star';
}
