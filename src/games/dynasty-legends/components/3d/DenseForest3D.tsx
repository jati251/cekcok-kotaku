import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapTheme } from '../../types';
import { getTerrainHeight, getRiverCenterX, RIVER_HALF_WIDTH } from '../../engine/terrainHeightEngine';
import { proceduralTextures } from './textures/proceduralTextures';

export interface ForestTreeData {
  x: number;
  z: number;
  scale: number;
  rotationY: number;
}

/**
 * Deterministic pseudo-random generator for consistent, natural tree scattering
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Precomputes all dense forest tree placements across the hills and valleys.
 * Automatically excludes:
 * - Military Highway (diagonal corridor)
 * - Flowing River channel & banks
 * - Allied and Enemy military bases
 * - Village center and bridge portals
 */
export function generateForestPlacements(): {
  pinePlacements: ForestTreeData[];
  canopyPlacements: ForestTreeData[];
  bambooPlacements: ForestTreeData[];
  shrubPlacements: ForestTreeData[];
  treeColliders: { x: number; z: number; radius: number }[];
} {
  const rng = pseudoRandom(1337);
  const pinePlacements: ForestTreeData[] = [];
  const canopyPlacements: ForestTreeData[] = [];
  const bambooPlacements: ForestTreeData[] = [];
  const shrubPlacements: ForestTreeData[] = [];
  const treeColliders: { x: number; z: number; radius: number }[] = [];

  // Generate candidate forest points across a 480m x 480m battlefield area
  const candidateCount = 1100;

  for (let i = 0; i < candidateCount; i++) {
    const x = (rng() - 0.5) * 440;
    const z = (rng() - 0.5) * 440;
    const distFromCenter = Math.hypot(x, z);

    // Skip extreme outer void
    if (distFromCenter > 220) continue;

    // 1. Filter out Main Highway corridor (x - z = 0, rotated 45 deg)
    const distFromRoad = Math.abs(x - z) * 0.7071;
    if (distFromRoad < 12.5) continue;

    // 2. Filter out River channel and pebble shores
    const riverCx = getRiverCenterX(z);
    const distFromRiver = Math.abs(x - riverCx);
    if (distFromRiver < RIVER_HALF_WIDTH + 4.5) continue;

    // 3. Filter out Allied Base (-85, -85) and Enemy Base (120, 120)
    const distToAllied = Math.hypot(x - (-85), z - (-85));
    const distToEnemy = Math.hypot(x - 120, z - 120);
    if (distToAllied < 36 || distToEnemy < 38) continue;

    // 4. Filter out Village Hamlet (-72, 45)
    const distToVillage = Math.hypot(x - (-72), z - 45);
    if (distToVillage < 24) continue;

    // 5. Filter out Main Bridge approach (-32, -32) and Northern Bridge approach (-7.5, 48)
    if (Math.hypot(x - (-32), z - (-32)) < 22) continue;
    if (Math.hypot(x - (-7.5), z - 48) < 18) continue;

    const scale = 0.85 + rng() * 0.5;
    const rot = rng() * Math.PI * 2;
    const treeData: ForestTreeData = { x, z, scale, rotationY: rot };

    // Categorize by elevation & terrain sector:
    const terrainY = getTerrainHeight(x, z);

    // Bamboo clusters favor low valleys and river valley margins (west & north)
    if (distFromRiver >= RIVER_HALF_WIDTH + 4.5 && distFromRiver < 42 && z > -30) {
      if (rng() < 0.65) {
        bambooPlacements.push(treeData);
        if (distFromCenter < 125) {
          treeColliders.push({ x, z, radius: 0.6 * scale });
        }
        continue;
      }
    }

    // High rolling hills favor Ancient Mountain Pines
    if (terrainY > 1.4 || (x > 40 && z < -40) || (x < -60 && z < -60)) {
      pinePlacements.push(treeData);
      if (distFromCenter < 125) {
        treeColliders.push({ x, z, radius: 0.75 * scale });
      }
    } else if (rng() < 0.6) {
      // Broadleaf deciduous canopy trees in meadow basins
      canopyPlacements.push(treeData);
      if (distFromCenter < 125) {
        treeColliders.push({ x, z, radius: 0.85 * scale });
      }
    } else {
      // Undergrowth shrubs
      shrubPlacements.push(treeData);
    }
  }

  return {
    pinePlacements,
    canopyPlacements,
    bambooPlacements,
    shrubPlacements,
    treeColliders,
  };
}

export const PRECOMPUTED_FOREST = generateForestPlacements();

/**
 * GPU Instanced Dense Three Kingdoms Forest System
 * Renders hundreds of trees and foliage pads in exactly 4 draw calls
 */
export const DenseForest3D: React.FC<{ theme: MapTheme }> = ({ theme }) => {
  const isSnow = theme === MapTheme.HULAO_SNOW;
  const isFire = theme === MapTheme.CHIBI_FIRE;

  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineLeavesRef = useRef<THREE.InstancedMesh>(null);
  const canopyTrunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyLeavesRef = useRef<THREE.InstancedMesh>(null);
  const bambooRef = useRef<THREE.InstancedMesh>(null);
  const shrubRef = useRef<THREE.InstancedMesh>(null);

  const barkTex = useMemo(() => proceduralTextures.getTreeBarkTexture(), []);

  const pineFoliageCol = isSnow ? '#334155' : isFire ? '#451a03' : '#14532d';
  const canopyFoliageCol = isSnow ? '#64748b' : isFire ? '#9a3412' : '#15803d';
  const bambooCol = isSnow ? '#94a3b8' : isFire ? '#b45309' : '#16a34a';
  const shrubCol = isSnow ? '#475569' : isFire ? '#78350f' : '#3f6212';

  const { pinePlacements, canopyPlacements, bambooPlacements, shrubPlacements } = PRECOMPUTED_FOREST;

  // Set transform matrices for each instanced tree
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    // 1. Pine Trees (Trunk & Needles)
    if (pineTrunkRef.current && pineLeavesRef.current) {
      pinePlacements.forEach((p, i) => {
        const y = getTerrainHeight(p.x, p.z);
        // Trunk
        dummy.position.set(p.x, y + 2.0 * p.scale, p.z);
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.rotation.set(0.04, p.rotationY, 0.06);
        dummy.updateMatrix();
        pineTrunkRef.current?.setMatrixAt(i, dummy.matrix);

        // Foliage Crown
        dummy.position.set(p.x, y + 4.8 * p.scale, p.z);
        dummy.rotation.set(0, p.rotationY + 0.4, 0);
        dummy.updateMatrix();
        pineLeavesRef.current?.setMatrixAt(i, dummy.matrix);
      });
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
      pineLeavesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Deciduous Canopy Trees
    if (canopyTrunkRef.current && canopyLeavesRef.current) {
      canopyPlacements.forEach((c, i) => {
        const y = getTerrainHeight(c.x, c.z);
        // Trunk
        dummy.position.set(c.x, y + 1.8 * c.scale, c.z);
        dummy.scale.set(c.scale, c.scale, c.scale);
        dummy.rotation.set(0, c.rotationY, 0);
        dummy.updateMatrix();
        canopyTrunkRef.current?.setMatrixAt(i, dummy.matrix);

        // Canopy Dome
        dummy.position.set(c.x, y + 4.6 * c.scale, c.z);
        dummy.rotation.set(0.1, c.rotationY, -0.08);
        dummy.updateMatrix();
        canopyLeavesRef.current?.setMatrixAt(i, dummy.matrix);
      });
      canopyTrunkRef.current.instanceMatrix.needsUpdate = true;
      canopyLeavesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Bamboo Stalks
    if (bambooRef.current) {
      bambooPlacements.forEach((b, i) => {
        const y = getTerrainHeight(b.x, b.z);
        dummy.position.set(b.x, y + 3.2 * b.scale, b.z);
        dummy.scale.set(b.scale, b.scale * 1.1, b.scale);
        dummy.rotation.set(0.03, b.rotationY, 0.03);
        dummy.updateMatrix();
        bambooRef.current?.setMatrixAt(i, dummy.matrix);
      });
      bambooRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Wild Bushes
    if (shrubRef.current) {
      shrubPlacements.forEach((s, i) => {
        const y = getTerrainHeight(s.x, s.z);
        dummy.position.set(s.x, y + 0.6 * s.scale, s.z);
        dummy.scale.set(s.scale * 1.2, s.scale * 0.8, s.scale * 1.2);
        dummy.rotation.set(0, s.rotationY, 0);
        dummy.updateMatrix();
        shrubRef.current?.setMatrixAt(i, dummy.matrix);
      });
      shrubRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [pinePlacements, canopyPlacements, bambooPlacements, shrubPlacements]);

  return (
    <group>
      {/* 1. Mountain Pines */}
      <instancedMesh
        ref={pineTrunkRef}
        args={[undefined, undefined, pinePlacements.length]}
        castShadow
      >
        <cylinderGeometry args={[0.24, 0.55, 4.2, 6]} />
        <meshStandardMaterial map={barkTex} color="#3e2723" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={pineLeavesRef}
        args={[undefined, undefined, pinePlacements.length]}
        castShadow
      >
        <coneGeometry args={[2.2, 3.4, 7]} />
        <meshStandardMaterial color={pineFoliageCol} roughness={0.88} flatShading />
      </instancedMesh>

      {/* 2. Deciduous Canopies */}
      <instancedMesh
        ref={canopyTrunkRef}
        args={[undefined, undefined, canopyPlacements.length]}
        castShadow
      >
        <cylinderGeometry args={[0.3, 0.65, 3.8, 6]} />
        <meshStandardMaterial map={barkTex} color="#3b1d11" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={canopyLeavesRef}
        args={[undefined, undefined, canopyPlacements.length]}
        castShadow
      >
        <dodecahedronGeometry args={[2.4, 0]} />
        <meshStandardMaterial color={canopyFoliageCol} roughness={0.86} flatShading />
      </instancedMesh>

      {/* 3. Bamboo Sea */}
      <instancedMesh
        ref={bambooRef}
        args={[undefined, undefined, bambooPlacements.length]}
        castShadow
      >
        <cylinderGeometry args={[0.1, 0.16, 6.8, 5]} />
        <meshStandardMaterial color={bambooCol} roughness={0.75} />
      </instancedMesh>

      {/* 4. Meadow Shrubs */}
      <instancedMesh
        ref={shrubRef}
        args={[undefined, undefined, shrubPlacements.length]}
        receiveShadow
      >
        <dodecahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color={shrubCol} roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
};
