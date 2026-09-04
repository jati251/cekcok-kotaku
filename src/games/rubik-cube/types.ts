import type * as THREE from 'three';

export type FaceKey = 'R' | 'L' | 'U' | 'D' | 'F' | 'B';

export type CubeTheme = 'competition' | 'cyberpunk' | 'pastel';

export interface FaceRotation {
  axis: [number, number, number];
  angle: number;
}

export interface CubieData {
  position: [number, number, number];
  mesh: THREE.Mesh | null;
}

export interface AnimationQueueItem {
  face: FaceKey;
  cubieIndices: number[];
  pivot: THREE.Group;
  startTime: number;
}

export interface RubikSolveStats {
  timeMs: number;
  moves: number;
  tps: number;
  scramble: string;
}
