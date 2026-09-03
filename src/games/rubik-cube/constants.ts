import type { FaceKey, FaceRotation } from './types'

export const COLORS = {
  right: '#B71234',   // Red
  left: '#FF8C00',    // Orange (more yellow, less red-ish)
  top: '#FFFFFF',     // White
  bottom: '#FFD500',  // Yellow
  front: '#009E60',   // Green
  back: '#0046AD',    // Blue
  inside: '#1a1a1a',  // Dark internal
} as const

export const CUBIE_SIZE = 0.95
export const GAP = 1
export const ANIMATION_DURATION = 180 // ms
export const SCRAMBLE_MOVES = 30

// Face definitions – which cubies belong to each face
export const FACE_CUBIES: Record<FaceKey, (pos: [number, number, number]) => boolean> = {
  R: ([x]) => x === 1,
  L: ([x]) => x === -1,
  U: ([, y]) => y === 1,
  D: ([, y]) => y === -1,
  F: ([, , z]) => z === 1,
  B: ([, , z]) => z === -1,
}

// Rotation axis & angle for each face (right-hand rule)
export const FACE_ROTATIONS: Record<FaceKey, FaceRotation> = {
  R: { axis: [1, 0, 0], angle: -Math.PI / 2 },
  L: { axis: [1, 0, 0], angle: Math.PI / 2 },
  U: { axis: [0, 1, 0], angle: -Math.PI / 2 },
  D: { axis: [0, 1, 0], angle: Math.PI / 2 },
  F: { axis: [0, 0, 1], angle: -Math.PI / 2 },
  B: { axis: [0, 0, 1], angle: Math.PI / 2 },
}

export const FACE_LABELS: Record<FaceKey, string> = {
  R: 'R',
  L: 'L',
  U: 'U',
  D: 'D',
  F: 'F',
  B: 'B',
}

// All cubie positions in a 3×3×3 grid (excluding the invisible centre at 0,0,0)
export function getAllPositions(): [number, number, number][] {
  const positions: [number, number, number][] = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue
        positions.push([x, y, z])
      }
    }
  }
  return positions
}
