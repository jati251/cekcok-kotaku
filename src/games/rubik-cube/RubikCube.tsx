import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, CUBIE_SIZE, GAP, ANIMATION_DURATION, SCRAMBLE_MOVES, FACE_CUBIES, FACE_ROTATIONS, getAllPositions } from './constants'
import type { FaceKey } from './types'

const FACE_KEYS: (keyof typeof COLORS)[] = ['right', 'left', 'top', 'bottom', 'front', 'back']

function createCubieMaterials(pos: [number, number, number]): THREE.MeshStandardMaterial[] {
  const [x, y, z] = pos
  const conditions = [x === 1, x === -1, y === 1, y === -1, z === 1, z === -1]
  return FACE_KEYS.map((key, i) => {
    const isOuter = conditions[i]
    return new THREE.MeshStandardMaterial({
      color: isOuter ? COLORS[key] : '#0d0d0d',
      roughness: isOuter ? 0.2 : 0.7,
      metalness: isOuter ? 0.05 : 0.0,
    })
  })
}

interface QueuedMove {
  face: FaceKey
  startTime: number
  indices: number[]
}

export interface RubikCubeHandle {
  rotateFace: (face: FaceKey) => void
  scramble: () => void
  reset: () => void
  readonly isAnimating: boolean
  readonly moveCount: number
  onMove: (fn: (count: number) => void) => () => void
}

// ── Exact position rotation (integer math, zero drift) ──
const ROTATE_POS: Record<FaceKey, (p: [number, number, number]) => [number, number, number]> = {
  R: ([x, y, z]) => [x, z, -y],
  L: ([x, y, z]) => [x, -z, y],
  U: ([x, y, z]) => [-z, y, x],
  D: ([x, y, z]) => [z, y, -x],
  F: ([x, y, z]) => [y, -x, z],
  B: ([x, y, z]) => [-y, x, z],
}

// ── Valid quaternion component values for cube 90° rotations ──
const ROOT_HALF = Math.SQRT1_2 // 0.7071067811865476
const QUANTUM = [0, 0.5, -0.5, ROOT_HALF, -ROOT_HALF, 1, -1]
const THRESHOLD = 0.05

/** Snap a quaternion to the nearest valid cube rotation */
function quantizeQuat(q: THREE.Quaternion): THREE.Quaternion {
  const c = [q.x, q.y, q.z, q.w]
  for (let i = 0; i < 4; i++) {
    let best = c[i]
    let bestDist = Infinity
    for (const v of QUANTUM) {
      const d = Math.abs(c[i] - v)
      if (d < bestDist) { bestDist = d; best = v }
    }
    c[i] = bestDist < THRESHOLD ? best : c[i]
  }
  const len = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2] + c[3] * c[3])
  if (len < 1e-10) return q
  return new THREE.Quaternion(c[0] / len, c[1] / len, c[2] / len, c[3] / len)
}

const _quat = new THREE.Quaternion()

const RubikCube = forwardRef<RubikCubeHandle>((_props, ref) => {
  const sceneRef = useRef<THREE.Group>(null!)
  const cubieRefs = useRef<THREE.Mesh[]>([])
  const cubiePositions = useRef<[number, number, number][]>(getAllPositions())
  const moveQueue = useRef<QueuedMove[]>([])
  const isAnimatingRef = useRef(false)
  const moveCountRef = useRef(0)
  const moveListenersRef = useRef<Set<(count: number) => void>>(new Set())
  const activePivotRef = useRef<THREE.Group | null>(null)

  const onMove = useCallback((fn: (count: number) => void) => {
    moveListenersRef.current.add(fn)
    return () => moveListenersRef.current.delete(fn)
  }, [])

  // ── Create cubies once ──
  useEffect(() => {
    const group = sceneRef.current
    const positions = getAllPositions()
    const meshes: THREE.Mesh[] = []

    positions.forEach((pos) => {
      const materials = createCubieMaterials(pos)
      const geo = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE)
      const mesh = new THREE.Mesh(geo, materials)
      mesh.position.set(pos[0] * GAP, pos[1] * GAP, pos[2] * GAP)
      mesh.castShadow = true
      mesh.receiveShadow = true

      const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 })
      const edgeGeo = new THREE.EdgesGeometry(geo)
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat))

      group.add(mesh)
      meshes.push(mesh)
    })
    cubieRefs.current = meshes

    return () => {
      meshes.forEach((m) => {
        m.geometry.dispose()
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose())
      })
    }
  }, [])

  // ── Get live face indices ──
  const getFaceIndices = useCallback((face: FaceKey): number[] => {
    const predicate = FACE_CUBIES[face]
    const out: number[] = []
    for (let i = 0; i < cubiePositions.current.length; i++) {
      if (predicate(cubiePositions.current[i])) out.push(i)
    }
    return out
  }, [])

  // ── Execute one rotation ──
  const executeNextMove = useCallback((): boolean => {
    if (moveQueue.current.length === 0) return false

    const item = moveQueue.current[0]
    const group = sceneRef.current
    const meshes = cubieRefs.current
    const indices = getFaceIndices(item.face)
    if (indices.length === 0) { moveQueue.current.shift(); return executeNextMove() }

    const pivot = new THREE.Group()
    let moved = 0
    for (const idx of indices) {
      const mesh = meshes[idx]
      if (mesh.parent === group) { group.remove(mesh); pivot.add(mesh); moved++ }
    }
    if (moved === 0) { moveQueue.current.shift(); return executeNextMove() }

    group.add(pivot)
    item.startTime = performance.now()
    item.indices = indices
    activePivotRef.current = pivot

    moveCountRef.current++
    moveListenersRef.current.forEach((fn) => fn(moveCountRef.current))
    return true
  }, [getFaceIndices])

  // ── Animation loop ──
  useFrame(() => {
    if (!activePivotRef.current) {
      isAnimatingRef.current = executeNextMove()
      return
    }

    const item = moveQueue.current[0]
    if (!item) { activePivotRef.current = null; isAnimatingRef.current = false; return }

    const pivot = activePivotRef.current
    const indices = item.indices
    const { axis, angle } = FACE_ROTATIONS[item.face]
    const elapsed = performance.now() - item.startTime
    const t = Math.min(elapsed / ANIMATION_DURATION, 1)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    pivot.quaternion.setFromAxisAngle(
      new THREE.Vector3(axis[0], axis[1], axis[2]),
      angle * eased,
    )
    if (t < 1) return

    // ── Complete: bake with exact math ──
    const rotate = ROTATE_POS[item.face]
    const group = sceneRef.current
    const meshes = cubieRefs.current

    pivot.quaternion.setFromAxisAngle(new THREE.Vector3(axis[0], axis[1], axis[2]), angle)

    for (const idx of indices) {
      const mesh = meshes[idx]
      if (mesh.parent !== pivot) continue

      // Exact position via integer rotation
      const newPos = rotate(cubiePositions.current[idx])
      // Exact orientation via quantized quaternion
      mesh.getWorldQuaternion(_quat)
      pivot.remove(mesh)

      mesh.position.set(newPos[0] * GAP, newPos[1] * GAP, newPos[2] * GAP)
      mesh.quaternion.copy(quantizeQuat(_quat))
      group.add(mesh)

      cubiePositions.current[idx][0] = newPos[0]
      cubiePositions.current[idx][1] = newPos[1]
      cubiePositions.current[idx][2] = newPos[2]
    }
    group.remove(pivot)

    activePivotRef.current = null
    moveQueue.current.shift()
    isAnimatingRef.current = executeNextMove()
  })

  // ── Rotate face ──
  const rotateFaceAnimated = useCallback((face: FaceKey) => {
    if (activePivotRef.current) {
      const indices = getFaceIndices(face)
      if (indices.some((idx) => cubieRefs.current[idx]?.parent === activePivotRef.current)) return
    }
    moveQueue.current.push({ face, startTime: 0, indices: [] })
    isAnimatingRef.current = true
  }, [getFaceIndices])

  // ── Scramble ──
  const scramble = useCallback(() => {
    const faces: FaceKey[] = ['R', 'L', 'U', 'D', 'F', 'B']
    let prevFace = ''
    moveCountRef.current = 0
    moveListenersRef.current.forEach((fn) => fn(0))

    for (let i = 0; i < SCRAMBLE_MOVES; i++) {
      let face: FaceKey
      do face = faces[Math.floor(Math.random() * faces.length)]
      while (face === prevFace)
      prevFace = face
      moveQueue.current.push({ face, startTime: 0, indices: [] })
    }
    isAnimatingRef.current = true
    moveListenersRef.current.forEach((fn) => fn(moveCountRef.current))
  }, [])

  // ── Reset ──
  const solveQuick = useCallback(() => {
    if (activePivotRef.current) {
      const meshes = cubieRefs.current
      for (const mesh of meshes) {
        if (mesh.parent === activePivotRef.current) {
          activePivotRef.current.remove(mesh)
          sceneRef.current.add(mesh)
        }
      }
      sceneRef.current.remove(activePivotRef.current)
      activePivotRef.current = null
    }
    moveQueue.current = []
    isAnimatingRef.current = false
    moveCountRef.current = 0
    moveListenersRef.current.forEach((fn) => fn(0))

    const group = sceneRef.current
    const meshes = cubieRefs.current
    const positions = getAllPositions()

    for (let i = 0; i < positions.length; i++) {
      const mesh = meshes[i]
      if (!mesh) continue
      const pos = positions[i]
      if (mesh.parent && mesh.parent !== group) mesh.parent.remove(mesh)
      if (mesh.parent !== group) group.add(mesh)
      mesh.position.set(pos[0] * GAP, pos[1] * GAP, pos[2] * GAP)
      mesh.quaternion.identity()
      const newMats = createCubieMaterials(pos)
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose())
      mesh.material = newMats
    }
    cubiePositions.current = positions.map((p) => [...p] as [number, number, number])
  }, [])

  useImperativeHandle(ref, () => ({
    rotateFace: rotateFaceAnimated,
    scramble,
    reset: solveQuick,
    get isAnimating() { return isAnimatingRef.current },
    get moveCount() { return moveCountRef.current },
    onMove,
  }), [rotateFaceAnimated, scramble, solveQuick, onMove])

  return <group ref={sceneRef} />
})

RubikCube.displayName = 'RubikCube'
export default RubikCube
