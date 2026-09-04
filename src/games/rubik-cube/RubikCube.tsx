import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  THEME_COLORS,
  CUBIE_SIZE,
  GAP,
  ANIMATION_DURATION,
  SCRAMBLE_MOVES,
  FACE_CUBIES,
  FACE_ROTATIONS,
  getAllPositions,
} from './constants';
import type { FaceKey, CubeTheme } from './types';
import { rubikAudio } from './audio';

const FACE_KEYS = ['right', 'left', 'top', 'bottom', 'front', 'back'] as const;

function createCubieMaterials(pos: [number, number, number], theme: CubeTheme = 'competition'): THREE.MeshStandardMaterial[] {
  const [x, y, z] = pos;
  const conditions = [x === 1, x === -1, y === 1, y === -1, z === 1, z === -1];
  const themeData = THEME_COLORS[theme];

  return FACE_KEYS.map((key, i) => {
    const isOuter = conditions[i];
    const color = isOuter ? themeData[key] : themeData.inside;
    return new THREE.MeshStandardMaterial({
      color,
      roughness: isOuter ? themeData.roughness : 0.7,
      metalness: isOuter ? themeData.metalness : 0.0,
      emissive: isOuter && themeData.emissiveIntensity ? color : '#000000',
      emissiveIntensity: isOuter ? themeData.emissiveIntensity || 0 : 0,
    });
  });
}

interface QueuedMove {
  face: FaceKey;
  startTime: number;
  indices: number[];
  prime?: boolean;
}

export interface RubikCubeHandle {
  rotateFace: (face: FaceKey, prime?: boolean) => void;
  scramble: () => string;
  reset: () => void;
  checkIsSolved: () => boolean;
  setTheme: (theme: CubeTheme) => void;
  readonly isAnimating: boolean;
  readonly moveCount: number;
  onMove: (fn: (count: number) => void) => () => void;
}

const ROTATE_POS: Record<FaceKey, (p: [number, number, number]) => [number, number, number]> = {
  R: ([x, y, z]) => [x, z, -y],
  L: ([x, y, z]) => [x, -z, y],
  U: ([x, y, z]) => [-z, y, x],
  D: ([x, y, z]) => [z, y, -x],
  F: ([x, y, z]) => [y, -x, z],
  B: ([x, y, z]) => [-y, x, z],
};

const ROOT_HALF = Math.SQRT1_2;
const QUANTUM = [0, 0.5, -0.5, ROOT_HALF, -ROOT_HALF, 1, -1];
const THRESHOLD = 0.05;

function quantizeQuat(q: THREE.Quaternion): THREE.Quaternion {
  const c = [q.x, q.y, q.z, q.w];
  for (let i = 0; i < 4; i++) {
    let best = c[i];
    let bestDist = Infinity;
    for (const v of QUANTUM) {
      const d = Math.abs(c[i] - v);
      if (d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    c[i] = bestDist < THRESHOLD ? best : c[i];
  }
  const len = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2] + c[3] * c[3]);
  if (len < 1e-10) return q;
  return new THREE.Quaternion(c[0] / len, c[1] / len, c[2] / len, c[3] / len);
}

const _quat = new THREE.Quaternion();

interface RubikCubeProps {
  theme?: CubeTheme;
}

const RubikCube = forwardRef<RubikCubeHandle, RubikCubeProps>(({ theme = 'competition' }, ref) => {
  const sceneRef = useRef<THREE.Group>(null!);
  const cubieRefs = useRef<THREE.Mesh[]>([]);
  const cubiePositions = useRef<[number, number, number][]>(getAllPositions());
  const moveQueue = useRef<QueuedMove[]>([]);
  const isAnimatingRef = useRef(false);
  const moveCountRef = useRef(0);
  const moveListenersRef = useRef<Set<(count: number) => void>>(new Set());
  const activePivotRef = useRef<THREE.Group | null>(null);
  const currentThemeRef = useRef<CubeTheme>(theme);

  const onMove = useCallback((fn: (count: number) => void) => {
    moveListenersRef.current.add(fn);
    return () => moveListenersRef.current.delete(fn);
  }, []);

  const updateMaterialsForTheme = useCallback((newTheme: CubeTheme) => {
    currentThemeRef.current = newTheme;
    const positions = getAllPositions();
    const meshes = cubieRefs.current;
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      if (!mesh) continue;
      const newMats = createCubieMaterials(positions[i], newTheme);
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      mesh.material = newMats;
    }
  }, []);

  useEffect(() => {
    updateMaterialsForTheme(theme);
  }, [theme, updateMaterialsForTheme]);

  // Create cubies once
  useEffect(() => {
    const group = sceneRef.current;
    const positions = getAllPositions();
    const meshes: THREE.Mesh[] = [];

    positions.forEach((pos) => {
      const materials = createCubieMaterials(pos, currentThemeRef.current);
      const geo = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
      const mesh = new THREE.Mesh(geo, materials);
      mesh.position.set(pos[0] * GAP, pos[1] * GAP, pos[2] * GAP);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const edgeMat = new THREE.LineBasicMaterial({
        color: currentThemeRef.current === 'cyberpunk' ? 0x38bdf8 : 0x000000,
        transparent: true,
        opacity: currentThemeRef.current === 'cyberpunk' ? 0.4 : 0.25,
      });
      const edgeGeo = new THREE.EdgesGeometry(geo);
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

      group.add(mesh);
      meshes.push(mesh);
    });
    cubieRefs.current = meshes;

    return () => {
      meshes.forEach((m) => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
      });
    };
  }, []);

  const getFaceIndices = useCallback((face: FaceKey): number[] => {
    const predicate = FACE_CUBIES[face];
    const out: number[] = [];
    for (let i = 0; i < cubiePositions.current.length; i++) {
      if (predicate(cubiePositions.current[i])) out.push(i);
    }
    return out;
  }, []);

  const executeNextMove = useCallback((): boolean => {
    if (moveQueue.current.length === 0) return false;

    const item = moveQueue.current[0];
    const group = sceneRef.current;
    const meshes = cubieRefs.current;
    const indices = getFaceIndices(item.face);
    if (indices.length === 0) {
      moveQueue.current.shift();
      return executeNextMove();
    }

    const pivot = new THREE.Group();
    let moved = 0;
    for (const idx of indices) {
      const mesh = meshes[idx];
      if (mesh.parent === group) {
        group.remove(mesh);
        pivot.add(mesh);
        moved++;
      }
    }
    if (moved === 0) {
      moveQueue.current.shift();
      return executeNextMove();
    }

    group.add(pivot);
    item.startTime = performance.now();
    item.indices = indices;
    activePivotRef.current = pivot;

    moveCountRef.current++;
    moveListenersRef.current.forEach((fn) => fn(moveCountRef.current));
    rubikAudio.playTurn(!!item.prime);
    return true;
  }, [getFaceIndices]);

  useFrame(() => {
    if (!activePivotRef.current) {
      isAnimatingRef.current = executeNextMove();
      return;
    }

    const item = moveQueue.current[0];
    if (!item) {
      activePivotRef.current = null;
      isAnimatingRef.current = false;
      return;
    }

    const pivot = activePivotRef.current;
    const indices = item.indices;
    const { axis, angle } = FACE_ROTATIONS[item.face];
    const targetAngle = item.prime ? -angle : angle;
    const elapsed = performance.now() - item.startTime;
    const t = Math.min(elapsed / ANIMATION_DURATION, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    pivot.quaternion.setFromAxisAngle(
      new THREE.Vector3(axis[0], axis[1], axis[2]),
      targetAngle * eased
    );
    if (t < 1) return;

    // Complete move baking
    const rotate = ROTATE_POS[item.face];
    const group = sceneRef.current;
    const meshes = cubieRefs.current;

    pivot.quaternion.setFromAxisAngle(new THREE.Vector3(axis[0], axis[1], axis[2]), targetAngle);

    for (const idx of indices) {
      const mesh = meshes[idx];
      if (mesh.parent !== pivot) continue;

      let newPos = cubiePositions.current[idx];
      // Prime move is equivalent to 3 standard turns
      const times = item.prime ? 3 : 1;
      for (let k = 0; k < times; k++) {
        newPos = rotate(newPos);
      }

      mesh.getWorldQuaternion(_quat);
      pivot.remove(mesh);

      mesh.position.set(newPos[0] * GAP, newPos[1] * GAP, newPos[2] * GAP);
      mesh.quaternion.copy(quantizeQuat(_quat));
      group.add(mesh);

      cubiePositions.current[idx][0] = newPos[0];
      cubiePositions.current[idx][1] = newPos[1];
      cubiePositions.current[idx][2] = newPos[2];
    }
    group.remove(pivot);

    activePivotRef.current = null;
    moveQueue.current.shift();
    isAnimatingRef.current = executeNextMove();
  });

  const rotateFaceAnimated = useCallback((face: FaceKey, prime = false) => {
    if (activePivotRef.current) {
      const indices = getFaceIndices(face);
      if (indices.some((idx) => cubieRefs.current[idx]?.parent === activePivotRef.current)) return;
    }
    moveQueue.current.push({ face, startTime: 0, indices: [], prime });
    isAnimatingRef.current = true;
  }, [getFaceIndices]);

  const scramble = useCallback((): string => {
    const faces: FaceKey[] = ['R', 'L', 'U', 'D', 'F', 'B'];
    let prevFace = '';
    moveCountRef.current = 0;
    moveListenersRef.current.forEach((fn) => fn(0));

    const scrambleSequence: string[] = [];

    for (let i = 0; i < SCRAMBLE_MOVES; i++) {
      let face: FaceKey;
      do face = faces[Math.floor(Math.random() * faces.length)];
      while (face === prevFace);
      prevFace = face;

      const isPrime = Math.random() < 0.35;
      scrambleSequence.push(isPrime ? `${face}'` : face);
      moveQueue.current.push({ face, startTime: 0, indices: [], prime: isPrime });
    }
    isAnimatingRef.current = true;
    return scrambleSequence.join(' ');
  }, []);

  const solveQuick = useCallback(() => {
    if (activePivotRef.current) {
      const meshes = cubieRefs.current;
      for (const mesh of meshes) {
        if (mesh.parent === activePivotRef.current) {
          activePivotRef.current.remove(mesh);
          sceneRef.current.add(mesh);
        }
      }
      sceneRef.current.remove(activePivotRef.current);
      activePivotRef.current = null;
    }
    moveQueue.current = [];
    isAnimatingRef.current = false;
    moveCountRef.current = 0;
    moveListenersRef.current.forEach((fn) => fn(0));

    const group = sceneRef.current;
    const meshes = cubieRefs.current;
    const positions = getAllPositions();

    for (let i = 0; i < positions.length; i++) {
      const mesh = meshes[i];
      if (!mesh) continue;
      const pos = positions[i];
      if (mesh.parent && mesh.parent !== group) mesh.parent.remove(mesh);
      if (mesh.parent !== group) group.add(mesh);
      mesh.position.set(pos[0] * GAP, pos[1] * GAP, pos[2] * GAP);
      mesh.quaternion.identity();
      const newMats = createCubieMaterials(pos, currentThemeRef.current);
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      mesh.material = newMats;
    }
    cubiePositions.current = positions.map((p) => [...p] as [number, number, number]);
    rubikAudio.playReset();
  }, []);

  const checkIsSolved = useCallback((): boolean => {
    const meshes = cubieRefs.current;
    const positions = getAllPositions();
    if (meshes.length !== positions.length) return false;

    // Check if every cubie is at its home position and has identity rotation
    for (let i = 0; i < positions.length; i++) {
      const p = cubiePositions.current[i];
      const home = positions[i];
      if (p[0] !== home[0] || p[1] !== home[1] || p[2] !== home[2]) return false;

      const q = meshes[i].quaternion;
      // Normal identity check
      if (Math.abs(q.x) > 0.05 || Math.abs(q.y) > 0.05 || Math.abs(q.z) > 0.05 || Math.abs(q.w - 1) > 0.05) {
        return false;
      }
    }
    return true;
  }, []);

  // Raycast direct click on 3D face to rotate
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.face) return;
    const normal = e.face.normal.clone().applyQuaternion(e.object.quaternion);

    let face: FaceKey | null = null;
    if (Math.abs(normal.x) > 0.8) face = normal.x > 0 ? 'R' : 'L';
    else if (Math.abs(normal.y) > 0.8) face = normal.y > 0 ? 'U' : 'D';
    else if (Math.abs(normal.z) > 0.8) face = normal.z > 0 ? 'F' : 'B';

    if (face) {
      const isRightClick = e.button === 2 || e.nativeEvent.shiftKey;
      rotateFaceAnimated(face, isRightClick);
    }
  };

  useImperativeHandle(ref, () => ({
    rotateFace: rotateFaceAnimated,
    scramble,
    reset: solveQuick,
    checkIsSolved,
    setTheme: updateMaterialsForTheme,
    get isAnimating() { return isAnimatingRef.current; },
    get moveCount() { return moveCountRef.current; },
    onMove,
  }), [rotateFaceAnimated, scramble, solveQuick, checkIsSolved, updateMaterialsForTheme, onMove]);

  return <group ref={sceneRef} onPointerDown={handlePointerDown} />;
});

RubikCube.displayName = 'RubikCube';
export default RubikCube;
