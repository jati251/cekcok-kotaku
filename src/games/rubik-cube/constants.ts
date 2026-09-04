import type { FaceKey, FaceRotation, CubeTheme } from './types';

export const THEME_COLORS: Record<CubeTheme, {
  right: string;
  left: string;
  top: string;
  bottom: string;
  front: string;
  back: string;
  inside: string;
  roughness: number;
  metalness: number;
  emissiveIntensity?: number;
}> = {
  competition: {
    right: '#dc2626',   // Bold Red
    left: '#ea580c',    // Speed Orange
    top: '#f8fafc',     // Clean White
    bottom: '#facc15',  // Canary Yellow
    front: '#16a34a',   // Emerald Green
    back: '#2563eb',    // Cobalt Blue
    inside: '#0f172a',  // Dark core
    roughness: 0.18,
    metalness: 0.05,
  },
  cyberpunk: {
    right: '#f43f5e',   // Neon Rose
    left: '#fb923c',    // Neon Amber
    top: '#e0e7ff',     // Bright Cyan White
    bottom: '#fef08a',  // Neon Laser Yellow
    front: '#10b981',   // Cyber Emerald
    back: '#06b6d4',    // Electric Cyan
    inside: '#030712',  // Obsidian Black
    roughness: 0.12,
    metalness: 0.35,
    emissiveIntensity: 0.25,
  },
  pastel: {
    right: '#fda4af',   // Pastel Rose
    left: '#fed7aa',    // Pastel Peach
    top: '#ffffff',     // Snow White
    bottom: '#fef08a',  // Pastel Butter
    front: '#a7f3d0',   // Pastel Mint
    back: '#bae6fd',    // Pastel Sky
    inside: '#334155',  // Slate core
    roughness: 0.45,
    metalness: 0.0,
  },
};

export const CUBIE_SIZE = 0.95;
export const GAP = 1;
export const ANIMATION_DURATION = 150; // ms per turn for snappy speedcube feel
export const SCRAMBLE_MOVES = 25;

// Face definitions – which cubies belong to each face
export const FACE_CUBIES: Record<FaceKey, (pos: [number, number, number]) => boolean> = {
  R: ([x]) => x === 1,
  L: ([x]) => x === -1,
  U: ([, y]) => y === 1,
  D: ([, y]) => y === -1,
  F: ([, , z]) => z === 1,
  B: ([, , z]) => z === -1,
};

// Rotation axis & angle for each face (right-hand rule)
export const FACE_ROTATIONS: Record<FaceKey, FaceRotation> = {
  R: { axis: [1, 0, 0], angle: -Math.PI / 2 },
  L: { axis: [1, 0, 0], angle: Math.PI / 2 },
  U: { axis: [0, 1, 0], angle: -Math.PI / 2 },
  D: { axis: [0, 1, 0], angle: Math.PI / 2 },
  F: { axis: [0, 0, 1], angle: -Math.PI / 2 },
  B: { axis: [0, 0, 1], angle: Math.PI / 2 },
};

export const FACE_LABELS: Record<FaceKey, string> = {
  R: 'Right',
  L: 'Left',
  U: 'Up',
  D: 'Down',
  F: 'Front',
  B: 'Back',
};

// All cubie positions in a 3×3×3 grid (excluding the invisible centre at 0,0,0)
export function getAllPositions(): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        positions.push([x, y, z]);
      }
    }
  }
  return positions;
}
