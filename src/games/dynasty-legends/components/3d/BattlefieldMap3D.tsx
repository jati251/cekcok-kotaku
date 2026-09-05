import React, { useMemo } from 'react';
import { BattleScenario, TacticalBase, MapTheme } from '../../types';
import { proceduralTextures } from './textures/proceduralTextures';
import {
  MountainPine3D,
  GnarledCanopyTree3D,
  WeepingWillow3D,
  BambooGrove3D,
  DenseShrubThicket3D,
  RiverReeds3D,
  RealisticFieldGrass3D,
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
  BoulderRock3D,
  RoadsideWarBanner3D,
} from './map/BattlefieldProps3D';
import {
  DistantMountainRange3D,
  TerrainWaterRiver3D,
  StoneTimberBridge3D,
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
  { x: -28, z: -45, radius: 1.8 },
  { x: -18, z: -15, radius: 1.7 },
  { x: -32, z: 5, radius: 1.9 },
  { x: -18, z: 42, radius: 1.7 },
  { x: -34, z: 65, radius: 1.8 },
  { x: -16, z: 95, radius: 2.0 },
  { x: -55, z: -45, radius: 5.5 },
  { x: -62, z: -25, radius: 5.5 },
  { x: -52, z: 55, radius: 5.5 },
  { x: 38, z: -65, radius: 5.5 },
  { x: 45, z: 15, radius: 5.5 },
  { x: 35, z: 95, radius: 5.5 },
  { x: -76, z: -76, radius: 2.5 },
  { x: -92, z: -68, radius: 2.5 },
  { x: 88, z: 78, radius: 2.5 },
  { x: 105, z: 92, radius: 2.5 },
  { x: -96, z: -94, radius: 4.8 },
  { x: -84, z: -98, radius: 4.8 },
  { x: -102, z: -82, radius: 4.8 },
  { x: 120, z: 125, radius: 4.8 },
  { x: 135, z: 110, radius: 4.8 },
];

export const BattlefieldMap3D: React.FC<BattlefieldMap3DProps> = ({ scenario }) => {
  const isSnow = scenario.mapTheme === MapTheme.HULAO_SNOW;

  const mountainPines = useMemo(
    () => [
      { pos: [-115, 0, -110] as [number, number, number], s: 1.2, rot: 0.4 },
      { pos: [-125, 0, -75] as [number, number, number], s: 1.0, rot: -0.6 },
      { pos: [-95, 0, -135] as [number, number, number], s: 1.3, rot: 1.2 },
      { pos: [55, 0, -115] as [number, number, number], s: 1.15, rot: 2.1 },
      { pos: [85, 0, -90] as [number, number, number], s: 1.25, rot: -1.1 },
      { pos: [110, 0, -130] as [number, number, number], s: 1.3, rot: 0.8 },
      { pos: [-130, 0, 60] as [number, number, number], s: 1.2, rot: 1.5 },
      { pos: [-105, 0, 95] as [number, number, number], s: 1.35, rot: -0.3 },
      { pos: [70, 0, 130] as [number, number, number], s: 1.25, rot: 0.9 },
      { pos: [100, 0, 85] as [number, number, number], s: 1.1, rot: -1.8 },
      { pos: [130, 0, 70] as [number, number, number], s: 1.05, rot: 2.4 },
      { pos: [125, 0, -40] as [number, number, number], s: 1.2, rot: -0.7 },
    ],
    []
  );

  const canopyTrees = useMemo(
    () => [
      { pos: [-60, 0, -120] as [number, number, number], s: 1.15, rot: 0.2 },
      { pos: [-40, 0, -70] as [number, number, number], s: 1.3, rot: -0.8 },
      { pos: [-50, 0, -20] as [number, number, number], s: 1.1, rot: 1.4 },
      { pos: [-15, 0, -100] as [number, number, number], s: 1.25, rot: -0.5 },
      { pos: [15, 0, -75] as [number, number, number], s: 1.2, rot: 0.9 },
      { pos: [-30, 0, 85] as [number, number, number], s: 1.35, rot: -1.2 },
      { pos: [20, 0, 60] as [number, number, number], s: 1.15, rot: 0.6 },
      { pos: [60, 0, 75] as [number, number, number], s: 1.2, rot: -0.4 },
      { pos: [90, 0, 40] as [number, number, number], s: 1.1, rot: 1.8 },
      { pos: [40, 0, 115] as [number, number, number], s: 1.25, rot: -0.7 },
    ],
    []
  );

  const weepingWillows = useMemo(
    () => [
      { pos: [-28, 0, -45] as [number, number, number], s: 1.2, rot: 0.3 },
      { pos: [-18, 0, -15] as [number, number, number], s: 1.15, rot: -0.5 },
      { pos: [-32, 0, 5] as [number, number, number], s: 1.25, rot: 1.1 },
      { pos: [-18, 0, 42] as [number, number, number], s: 1.1, rot: -0.9 },
      { pos: [-34, 0, 65] as [number, number, number], s: 1.2, rot: 0.7 },
      { pos: [-16, 0, 95] as [number, number, number], s: 1.3, rot: -1.4 },
    ],
    []
  );

  const villageHouses = useMemo(
    () => [
      { pos: [-55, 0, -45] as [number, number, number], rot: 0.35, s: 1.0 },
      { pos: [-62, 0, -25] as [number, number, number], rot: -0.2, s: 1.1 },
      { pos: [-52, 0, 55] as [number, number, number], rot: 0.6, s: 1.05 },
      { pos: [38, 0, -65] as [number, number, number], rot: -0.8, s: 1.15 },
      { pos: [45, 0, 15] as [number, number, number], rot: 1.2, s: 1.0 },
      { pos: [35, 0, 95] as [number, number, number], rot: -0.4, s: 1.1 },
    ],
    []
  );

  const bambooGroves = useMemo(
    () => [
      { pos: [-110, 0, 15] as [number, number, number], s: 1.1, rot: 0.4 },
      { pos: [-70, 0, 45] as [number, number, number], s: 1.2, rot: -0.6 },
      { pos: [-80, 0, 110] as [number, number, number], s: 1.05, rot: 1.2 },
      { pos: [75, 0, 110] as [number, number, number], s: 1.15, rot: -0.8 },
      { pos: [115, 0, 50] as [number, number, number], s: 1.2, rot: 0.5 },
    ],
    []
  );

  const denseShrubs = useMemo(() => {
    const arr: { pos: [number, number, number]; s: number; rot: number }[] = [];
    const seedPoints = [
      [-105, -88], [-78, -96], [-68, -72], [-88, -60],
      [-55, -35], [-35, -55], [-12, -80], [8, -60],
      [-15, 15], [-5, 30], [25, 45], [45, 20],
      [70, 55], [85, 65], [98, 80], [115, 105],
      [-75, 60], [-65, 80], [-85, 95], [-45, 75],
      [15, -15], [30, -35], [50, -65], [70, -75],
      [-42, 10], [-20, -5], [10, 85], [35, 95],
    ];
    seedPoints.forEach(([x, z], i) => {
      arr.push({
        pos: [x, 0, z] as [number, number, number],
        s: 0.85 + (i % 3) * 0.25,
        rot: i * 0.9,
      });
    });
    return arr;
  }, []);

  const riverReeds = useMemo(
    () => [
      [-24, 0, -55] as [number, number, number],
      [-21, 0, -30] as [number, number, number],
      [-29, 0, -8] as [number, number, number],
      [-21, 0, 18] as [number, number, number],
      [-29, 0, 36] as [number, number, number],
      [-20, 0, 58] as [number, number, number],
      [-28, 0, 80] as [number, number, number],
      [-21, 0, 105] as [number, number, number],
    ],
    []
  );

  const grassPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 130; i++) {
      arr.push([
        Math.sin(i * 123.4) * 125,
        0,
        Math.cos(i * 89.7) * 125,
      ]);
    }
    return arr;
  }, []);

  const terrainTex = useMemo(() => proceduralTextures.getTerrainTexture(scenario.mapTheme), [scenario.mapTheme]);
  const roadTex = useMemo(() => proceduralTextures.getRoadTexture(scenario.mapTheme), [scenario.mapTheme]);

  const roadsideBannerPositions = useMemo(
    () => [
      [-75, 0, -75] as [number, number, number],
      [-40, 0, -40] as [number, number, number],
      [-10, 0, -10] as [number, number, number],
      [25, 0, 25] as [number, number, number],
      [60, 0, 60] as [number, number, number],
      [95, 0, 95] as [number, number, number],
    ],
    []
  );

  return (
    <group>
      <DistantMountainRange3D theme={scenario.mapTheme} />

      {/* Main Ground Plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200, 12, 12]} />
        <meshStandardMaterial map={terrainTex} color="#ffffff" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Highway Road (Authentic packed battle dirt with wheel ruts) */}
      <group position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <mesh receiveShadow>
          <planeGeometry args={[14, 520]} />
          <meshStandardMaterial
            map={roadTex}
            roughness={0.92}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
        {/* Left Blended Dirt Shoulder */}
        <mesh position={[-7.5, 0, 0.005]}>
          <planeGeometry args={[2.0, 520]} />
          <meshStandardMaterial color="#6b543c" transparent opacity={0.6} roughness={0.98} />
        </mesh>
        {/* Right Blended Dirt Shoulder */}
        <mesh position={[7.5, 0, 0.005]}>
          <planeGeometry args={[2.0, 520]} />
          <meshStandardMaterial color="#6b543c" transparent opacity={0.6} roughness={0.98} />
        </mesh>
      </group>

      <TerrainWaterRiver3D isSnow={isSnow} />
      <StoneTimberBridge3D position={[-25, 0, -28]} rotationY={Math.PI / 4} />
      <StoneTimberBridge3D position={[-23, 0, 56]} rotationY={Math.PI / 4} />

      {villageHouses.map((h, idx) => (
        <VillageHouse3D key={idx} position={h.pos} rotationY={h.rot} scale={h.s} />
      ))}

      {roadsideBannerPositions.map((pos, idx) => (
        <RoadsideWarBanner3D key={idx} position={pos} rotationY={idx % 2 === 0 ? 0.3 : -0.3} />
      ))}

      <TacticalCampfireBrazier3D position={[-98, 0, -88]} />
      <TacticalCampfireBrazier3D position={[-88, 0, -102]} />
      <TacticalCampfireBrazier3D position={[118, 0, 112]} />
      <TacticalCampfireBrazier3D position={[132, 0, 128]} />

      <MilitarySuppliesCrate3D position={[-82, 0, -92]} rotationY={0.3} />
      <MilitarySuppliesCrate3D position={[-80, 0, -94]} rotationY={-0.4} />
      <ClayUrn3D position={[-84, 0, -90]} />

      {mountainPines.map((p, idx) => (
        <MountainPine3D key={`pine_${idx}`} position={p.pos} scale={p.s} rotationY={p.rot} isSnow={isSnow} />
      ))}

      {canopyTrees.map((c, idx) => (
        <GnarledCanopyTree3D key={`canopy_${idx}`} position={c.pos} scale={c.s} rotationY={c.rot} theme={scenario.mapTheme} />
      ))}

      {weepingWillows.map((w, idx) => (
        <WeepingWillow3D key={`willow_${idx}`} position={w.pos} scale={w.s} rotationY={w.rot} />
      ))}

      {bambooGroves.map((b, idx) => (
        <BambooGrove3D key={`bamboo_${idx}`} position={b.pos} scale={b.s} rotationY={b.rot} />
      ))}

      {denseShrubs.map((s, idx) => (
        <DenseShrubThicket3D key={`shrub_${idx}`} position={s.pos} scale={s.s} rotationY={s.rot} isSnow={isSnow} />
      ))}

      {riverReeds.map((rPos, idx) => (
        <RiverReeds3D key={`reed_${idx}`} position={rPos} scale={1.1} />
      ))}

      <RealisticFieldGrass3D positions={grassPositions} isSnow={isSnow} />

      {MAP_OBSTACLES.filter((_, i) => i >= 4 && i < 12).map((obs, idx) => (
        <BoulderRock3D key={idx} position={[obs.x, 0, obs.z]} scale={obs.radius * 0.55} rotationY={idx * 1.2} />
      ))}

      <MilitaryTent3D position={[-96, 0, -94]} rotationY={0.4} isAllied={true} />
      <MilitaryTent3D position={[-84, 0, -98]} rotationY={-0.3} isAllied={true} />
      <MilitaryTent3D position={[-102, 0, -82]} rotationY={0.8} isAllied={true} />

      <WoodenBarricade3D position={[-76, 0, -76]} rotationY={-Math.PI / 4} />
      <WoodenBarricade3D position={[-92, 0, -68]} rotationY={0.2} />
      <WoodenBarricade3D position={[88, 0, 78]} rotationY={-0.4} />
      <WoodenBarricade3D position={[105, 0, 92]} rotationY={0.6} />

      <Watchtower3D position={[-85, 0, 65]} rotationY={0.5} />
      <Watchtower3D position={[65, 0, -85]} rotationY={-0.5} />

      <MilitaryTent3D position={[120, 0, 125]} rotationY={Math.PI * 0.8} isAllied={false} />
      <MilitaryTent3D position={[135, 0, 110]} rotationY={Math.PI * 0.6} isAllied={false} />

      <WarDrum3D position={[-92, 0, -90]} rotationY={0.5} />
    </group>
  );
};
