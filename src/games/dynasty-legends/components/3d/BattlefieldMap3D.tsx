import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BattleScenario, TacticalBase, MapTheme } from '../../types';
import { proceduralTextures } from './textures/proceduralTextures';
import { getTerrainHeight } from '../../engine/terrainHeightEngine';
import {
  MountainPine3D,
  GnarledCanopyTree3D,
  WeepingWillow3D,
  BambooGrove3D,
} from './Vegetation3D';
import {
  MilitaryTent3D,
  WoodenBarricade3D,
  Watchtower3D,
  VillageHouse3D,
  WarDrum3D,
} from './map/BattlefieldStructures3D';
import {
  TacticalCampfireBrazier3D,
  ClayUrn3D,
  MilitarySuppliesCrate3D,
  RoadsideWarBanner3D,
} from './map/BattlefieldProps3D';
import {
  DistantMountainRange3D,
  TerrainWaterRiver3D,
  ImperialStoneArchBridge3D,
  NorthernFlankTimberBridge3D,
} from './map/BattlefieldTerrain3D';

interface BattlefieldMap3DProps {
  scenario: BattleScenario;
  bases: TacticalBase[];
  playerPos?: { x: number; y: number; z: number };
}

export interface MapObstacle {
  x: number;
  z: number;
  radius: number;
}

export const MAP_OBSTACLES: MapObstacle[] = [
  // Bases perimeter clearings
  { x: -95, z: -95, radius: 12.0 },
  { x: 125, z: 125, radius: 14.0 },
  { x: -85, z: 65, radius: 8.0 },
  { x: 65, z: -85, radius: 8.0 },
  { x: -45, z: 25, radius: 3.5 },
  { x: 35, z: -40, radius: 3.8 },
  { x: -75, z: -15, radius: 4.2 },
  { x: 85, z: 15, radius: 4.0 },
  { x: -115, z: -110, radius: 1.5 },
  { x: -125, z: -75, radius: 1.4 },
  { x: -95, z: -135, radius: 1.6 },
  { x: 55, z: -115, radius: 1.5 },
  { x: 85, z: -90, radius: 1.7 },
  { x: 110, z: -130, radius: 1.5 },
  { x: -130, z: 60, radius: 1.6 },
  { x: -105, z: 95, radius: 1.8 },
  { x: 70, z: 130, radius: 1.7 },
  { x: 100, z: 85, radius: 1.5 },
  { x: 130, z: 70, radius: 1.4 },
  { x: 125, z: -40, radius: 1.6 },
  { x: -60, z: -120, radius: 1.8 },
  { x: -40, z: -70, radius: 2.0 },
  { x: -50, z: -20, radius: 1.7 },
  { x: -15, z: -100, radius: 1.9 },
  { x: 15, z: -75, radius: 1.8 },
  { x: -30, z: 85, radius: 2.1 },
  { x: 20, z: 60, radius: 1.8 },
  { x: 60, z: 75, radius: 1.9 },
  { x: 90, z: 40, radius: 1.7 },
  { x: 40, z: 115, radius: 1.9 },
  // Major structures with collision radii (Placed safely off the road)
  { x: -115, z: -90, radius: 5.5 }, // Allied Commander Tent
  { x: -105, z: -110, radius: 5.2 },
  { x: 135, z: 115, radius: 5.5 }, // Enemy Command Tent
  { x: 148, z: 98, radius: 5.2 },
  { x: 115, z: 80, radius: 3.5 }, // Enemy Watchtower
  { x: 80, z: 115, radius: 3.5 },
];

export const BattlefieldMap3D: React.FC<BattlefieldMap3DProps> = ({ scenario }) => {
  const isSnow = scenario.mapTheme === MapTheme.HULAO_SNOW;

  // High-Resolution Smooth Deformed 3D Rolling Heightmap Ground Plane
  const groundGeometry = useMemo(() => {
    // 800x800m area with 160x160 segments gives smooth 5m vertex spacing
    const geo = new THREE.PlaneGeometry(800, 800, 160, 160);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Terrain-Conforming Military Highway Ribbon
  const roadGeometry = useMemo(() => {
    const lengthSegments = 100;
    const widthSegments = 6;
    const halfWidth = 7.0; // 14m wide road
    const tMin = -210;
    const tMax = 210;

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Highway axis runs along (1, 1) / sqrt(2)
    // Perpendicular vector is (-1, 1) / sqrt(2)
    const perpX = -0.7071;
    const perpZ = 0.7071;

    for (let j = 0; j <= lengthSegments; j++) {
      const tNorm = j / lengthSegments;
      const t = tMin + tNorm * (tMax - tMin);
      const centerX = t;
      const centerZ = t;

      for (let i = 0; i <= widthSegments; i++) {
        const wNorm = i / widthSegments; // 0..1 across road
        const offset = (wNorm - 0.5) * (halfWidth * 2);

        const vx = centerX + perpX * offset;
        const vz = centerZ + perpZ * offset;
        // Float road 0.02m above terrain to eliminate Z-fighting
        const vy = getTerrainHeight(vx, vz) + 0.02;

        vertices.push(vx, vy, vz);
        uvs.push(wNorm, tNorm * 32);
      }
    }

    const rowStride = widthSegments + 1;
    for (let j = 0; j < lengthSegments; j++) {
      for (let i = 0; i < widthSegments; i++) {
        const a = j * rowStride + i;
        const b = (j + 1) * rowStride + i;
        const c = (j + 1) * rowStride + (i + 1);
        const d = j * rowStride + (i + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Terrain-Conforming Village Dirt Connector Trail
  const villageTrailGeo = useMemo(() => {
    // Spline-like trail from Highway (-48, -20) to Village (-72, 45) to Northern Bridge (-7.5, 48)
    const waypoints = [
      { x: -48, z: -20 },
      { x: -62, z: 5 },
      { x: -74, z: 28 },
      { x: -72, z: 45 },
      { x: -42, z: 47 },
      { x: -20, z: 48 },
    ];
    const curve = new THREE.CatmullRomCurve3(
      waypoints.map((p) => new THREE.Vector3(p.x, 0, p.z))
    );
    const points = curve.getPoints(50);
    const halfWidth = 3.5; // 7m wide rustic dirt trail

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j < points.length; j++) {
      const p = points[j];
      const tangent =
        j < points.length - 1
          ? points[j + 1].clone().sub(p).normalize()
          : points[j].clone().sub(points[j - 1]).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

      const left = p.clone().addScaledVector(normal, -halfWidth);
      const right = p.clone().addScaledVector(normal, halfWidth);

      const leftY = getTerrainHeight(left.x, left.z) + 0.025;
      const rightY = getTerrainHeight(right.x, right.z) + 0.025;

      vertices.push(left.x, leftY, left.z);
      vertices.push(right.x, rightY, right.z);

      const vNorm = j / (points.length - 1);
      uvs.push(0, vNorm * 8);
      uvs.push(1, vNorm * 8);
    }

    for (let j = 0; j < points.length - 1; j++) {
      const a = j * 2;
      const b = (j + 1) * 2;
      const c = (j + 1) * 2 + 1;
      const d = j * 2 + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const mountainPines = useMemo(() => {
    const raw = [
      { x: -135, z: -125, s: 1.25, rot: 0.4 },
      { x: -145, z: -80, s: 1.1, rot: -0.6 },
      { x: -105, z: -145, s: 1.35, rot: 1.2 },
      { x: 65, z: -125, s: 1.2, rot: 2.1 },
      { x: 95, z: -95, s: 1.3, rot: -1.1 },
      { x: 125, z: -135, s: 1.35, rot: 0.8 },
      { x: -140, z: 75, s: 1.25, rot: 1.5 },
      { x: -115, z: 105, s: 1.4, rot: -0.3 },
      { x: 80, z: 140, s: 1.3, rot: 0.9 },
      { x: 110, z: 95, s: 1.15, rot: -1.8 },
      { x: 140, z: 65, s: 1.1, rot: 2.4 },
    ];
    return raw.map((p) => ({
      pos: [p.x, getTerrainHeight(p.x, p.z), p.z] as [number, number, number],
      s: p.s,
      rot: p.rot,
    }));
  }, []);

  const canopyTrees = useMemo(() => {
    const raw = [
      { x: -65, z: -130, s: 1.2, rot: 0.2 },
      { x: -45, z: -85, s: 1.3, rot: -0.8 },
      { x: -65, z: -35, s: 1.15, rot: 1.4 },
      { x: 50, z: -90, s: 1.25, rot: 0.9 },
      { x: -40, z: 90, s: 1.35, rot: -1.2 },
      { x: 30, z: 75, s: 1.2, rot: 0.6 },
      { x: 65, z: 85, s: 1.25, rot: -0.4 },
      { x: 95, z: 45, s: 1.15, rot: 1.8 },
    ];
    return raw.map((c) => ({
      pos: [c.x, getTerrainHeight(c.x, c.z), c.z] as [number, number, number],
      s: c.s,
      rot: c.rot,
    }));
  }, []);

  // Weeping Willows placed on dry, elevated river bluffs (safely clear of water)
  const weepingWillows = useMemo(() => {
    const raw = [
      // Left River Bluff
      { x: -58, z: -55, s: 1.25, rot: 0.3 },
      { x: -45, z: -10, s: 1.2, rot: -0.5 },
      { x: -35, z: 25, s: 1.3, rot: 1.1 },
      // Right River Bluff
      { x: -24, z: -55, s: 1.15, rot: -0.9 },
      { x: -10, z: -10, s: 1.25, rot: 0.7 },
      { x: 2, z: 25, s: 1.35, rot: -1.4 },
      { x: 15, z: 75, s: 1.2, rot: 0.4 },
    ];
    return raw.map((w) => ({
      pos: [w.x, getTerrainHeight(w.x, w.z), w.z] as [number, number, number],
      s: w.s,
      rot: w.rot,
    }));
  }, []);

  // Clustered Rural Village Hamlet
  const villageHouses = useMemo(() => {
    const raw = [
      { x: -72, z: 45, rot: 0.35, s: 1.1 },
      { x: -84, z: 54, rot: -0.25, s: 1.15 },
      { x: -68, z: 62, rot: 0.7, s: 1.05 },
      { x: -80, z: 32, rot: 1.2, s: 1.1 },
    ];
    return raw.map((h) => ({
      pos: [h.x, getTerrainHeight(h.x, h.z), h.z] as [number, number, number],
      rot: h.rot,
      s: h.s,
    }));
  }, []);

  const bambooGroves = useMemo(() => {
    const raw = [
      { x: -115, z: 22, s: 1.15, rot: 0.4 },
      { x: -85, z: 80, s: 1.25, rot: -0.6 },
      { x: 75, z: 120, s: 1.2, rot: -0.8 },
      { x: 120, z: 45, s: 1.25, rot: 0.5 },
    ];
    return raw.map((b) => ({
      pos: [b.x, getTerrainHeight(b.x, b.z), b.z] as [number, number, number],
      s: b.s,
      rot: b.rot,
    }));
  }, []);

  // Roadside War Banners along Highway Shoulders (excluding bridge area)
  const roadsideBannerPositions = useMemo(() => {
    const raw = [
      // Left shoulder (offset by -9m)
      { x: -108, z: -94 },
      { x: -60, z: -46 },
      { x: 0, z: 14 },
      { x: 55, z: 69 },
      { x: 108, z: 122 },
      // Right shoulder (offset by +9m)
      { x: -94, z: -108 },
      { x: -46, z: -60 },
      { x: 14, z: 0 },
      { x: 69, z: 55 },
      { x: 122, z: 108 },
    ];
    return raw.map(
      (b) => [b.x, getTerrainHeight(b.x, b.z), b.z] as [number, number, number]
    );
  }, []);

  const terrainTex = useMemo(
    () => proceduralTextures.getTerrainTexture(scenario.mapTheme),
    [scenario.mapTheme]
  );
  const roadTex = useMemo(
    () => proceduralTextures.getRoadTexture(scenario.mapTheme),
    [scenario.mapTheme]
  );

  return (
    <group>
      {/* 1. Distant Mountain Ranges (Majestic Shan Shui peaks) */}
      <DistantMountainRange3D theme={scenario.mapTheme} />

      {/* 2. Procedural 3D Rolling Heightmap Ground Plane */}
      <mesh geometry={groundGeometry} position={[0, -0.01, 0]} receiveShadow>
        <meshStandardMaterial map={terrainTex} color="#ffffff" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* 3. Terrain-Conforming Military Highway Ribbon */}
      <mesh geometry={roadGeometry} receiveShadow>
        <meshStandardMaterial
          map={roadTex}
          roughness={0.92}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 4. Terrain-Conforming Village Dirt Connector Trail */}
      <mesh geometry={villageTrailGeo} receiveShadow>
        <meshStandardMaterial
          map={roadTex}
          color="#a88a68"
          roughness={0.94}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 5. Organic Flowing River Valley */}
      <TerrainWaterRiver3D isSnow={isSnow} />

      {/* 6. Imperial Stone Arch Bridge (Main Highway Crossing at [-32, -32]) */}
      <ImperialStoneArchBridge3D />

      {/* 7. Northern Flank Timber Trestle Bridge (Village Crossing at [-7.5, 48]) */}
      <NorthernFlankTimberBridge3D />

      {/* 8. Clustered Rural Village Hamlet */}
      {villageHouses.map((h, idx) => (
        <VillageHouse3D key={idx} position={h.pos} rotationY={h.rot} scale={h.s} />
      ))}

      {/* 9. Roadside War Banners lining the Highway */}
      {roadsideBannerPositions.map((pos, idx) => (
        <RoadsideWarBanner3D key={idx} position={pos} rotationY={idx % 2 === 0 ? 0.3 : -0.3} />
      ))}

      {/* 10. Structured Allied Base Compound (South-West Clearing) */}
      <MilitaryTent3D position={[-115, getTerrainHeight(-115, -90), -90]} rotationY={0.4} isAllied={true} />
      <MilitaryTent3D position={[-105, getTerrainHeight(-105, -110), -110]} rotationY={-0.3} isAllied={true} />
      <MilitaryTent3D position={[-125, getTerrainHeight(-125, -75), -75]} rotationY={0.8} isAllied={true} />
      <TacticalCampfireBrazier3D position={[-110, getTerrainHeight(-110, -85), -85]} />
      <WarDrum3D position={[-118, getTerrainHeight(-118, -98), -98]} rotationY={0.5} />
      <MilitarySuppliesCrate3D position={[-105, getTerrainHeight(-105, -80), -80]} rotationY={0.3} />
      <ClayUrn3D position={[-108, getTerrainHeight(-108, -78), -78]} />
      {/* Camp Perimeter Barricades */}
      <WoodenBarricade3D position={[-75, getTerrainHeight(-75, -55), -55]} rotationY={0.4} />
      <WoodenBarricade3D position={[-55, getTerrainHeight(-55, -75), -75]} rotationY={-0.4} />

      {/* 11. Fortified Enemy Stronghold (North-East Garrison) */}
      <MilitaryTent3D position={[135, getTerrainHeight(135, 115), 115]} rotationY={Math.PI * 0.8} isAllied={false} />
      <MilitaryTent3D position={[148, getTerrainHeight(148, 98), 98]} rotationY={Math.PI * 0.6} isAllied={false} />
      <Watchtower3D position={[115, getTerrainHeight(115, 80), 80]} rotationY={0.5} />
      <Watchtower3D position={[80, getTerrainHeight(80, 115), 115]} rotationY={-0.5} />
      <TacticalCampfireBrazier3D position={[125, getTerrainHeight(125, 108), 108]} />
      <WoodenBarricade3D position={[105, getTerrainHeight(105, 85), 85]} rotationY={-0.4} />
      <WoodenBarricade3D position={[85, getTerrainHeight(85, 105), 105]} rotationY={0.6} />

      {/* 12. Scenic Groves & Riverbank Willows */}
      {mountainPines.map((p, idx) => (
        <MountainPine3D key={`pine_${idx}`} position={p.pos} scale={p.s} rotationY={p.rot} isSnow={isSnow} />
      ))}

      {canopyTrees.map((c, idx) => (
        <GnarledCanopyTree3D key={`canopy_${idx}`} position={c.pos} scale={c.s} rotationY={c.rot} theme={scenario.mapTheme} />
      ))}

      {bambooGroves.map((b, idx) => (
        <BambooGrove3D key={`bamboo_${idx}`} position={b.pos} scale={b.s} rotationY={b.rot} />
      ))}

      {weepingWillows.map((w, idx) => (
        <WeepingWillow3D key={`willow_${idx}`} position={w.pos} scale={w.s} rotationY={w.rot} />
      ))}
    </group>
  );
};

