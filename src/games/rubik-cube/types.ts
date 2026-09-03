import type * as THREE from 'three'

export type FaceKey = 'R' | 'L' | 'U' | 'D' | 'F' | 'B'

export interface FaceRotation {
  axis: [number, number, number]
  angle: number
}

export interface CubieData {
  position: [number, number, number]
  mesh: THREE.Mesh | null
}

export interface AnimationQueueItem {
  face: FaceKey
  cubieIndices: number[]
  pivot: THREE.Group
  startTime: number
}
