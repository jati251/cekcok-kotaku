import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapTheme } from '../../../types';
import { proceduralTextures } from '../textures/proceduralTextures';
import {
  getRiverCenterX,
  RIVER_WATER_Y,
  RIVER_BED_DEPTH,
  RIVER_WATER_HALF_WIDTH,
  MAIN_BRIDGE_CENTER,
  FLANK_BRIDGE_CENTER,
} from '../../../engine/terrainHeightEngine';

// ============================================================================
// 1. MAJESTIC SHAN SHUI THREE KINGDOMS MOUNTAIN RANGES
// ============================================================================

/**
 * Creates an authentic Chinese jagged mountain massif with sharp peaks,
 * sheer rock faces, and sloping crags instead of crude cylinders.
 */
function createMountainMassifGeo(
  baseRadius: number,
  height: number,
  facets: number = 7
): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(baseRadius, height, facets, 5);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Add jagged crag perturbation along vertical strata
    if (v.y > -height * 0.45 && v.y < height * 0.45) {
      const angle = Math.atan2(v.z, v.x);
      const ridgeNoise = Math.sin(angle * 4) * (baseRadius * 0.16);
      const verticalJitter = Math.sin(v.y * 0.12) * (baseRadius * 0.08);
      v.x += (v.x / (baseRadius || 1)) * (ridgeNoise + verticalJitter);
      v.z += (v.z / (baseRadius || 1)) * (ridgeNoise + verticalJitter);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export const DistantMountainRange3D: React.FC<{ theme: MapTheme }> = ({ theme }) => {
  const isSnow = theme === MapTheme.HULAO_SNOW;
  const isFire = theme === MapTheme.CHIBI_FIRE;

  const mountainRockColor = isSnow ? '#64748b' : isFire ? '#3b1d11' : '#334155';
  const peakCrestColor = isSnow ? '#f8fafc' : isFire ? '#7c2d12' : '#475569';
  const rockTex = useMemo(() => proceduralTextures.getMountainRockTexture(theme), [theme]);

  // Major Towering Horizon Mountain Peaks (Outer Ring 380m - 520m away)
  const outerPeaks = useMemo(
    () => [
      // Northern Great Range (High barrier wall)
      { x: -390, z: -430, r: 135, h: 260, rot: 0.35, cragH: 140 },
      { x: -180, z: -480, r: 155, h: 295, rot: -0.25, cragH: 160 },
      { x: 70, z: -490, r: 145, h: 275, rot: 0.5, cragH: 150 },
      { x: 330, z: -440, r: 140, h: 250, rot: -0.4, cragH: 135 },
      // Eastern High Ridge
      { x: 480, z: -190, r: 150, h: 280, rot: 0.6, cragH: 155 },
      { x: 510, z: 120, r: 160, h: 300, rot: -0.3, cragH: 165 },
      { x: 410, z: 390, r: 140, h: 260, rot: 0.25, cragH: 140 },
      // Southern Wall
      { x: 140, z: 490, r: 150, h: 285, rot: -0.45, cragH: 155 },
      { x: -150, z: 480, r: 155, h: 290, rot: 0.4, cragH: 160 },
      { x: -410, z: 380, r: 135, h: 255, rot: -0.35, cragH: 140 },
      // Western Ramparts
      { x: -490, z: 130, r: 150, h: 280, rot: 0.55, cragH: 150 },
      { x: -480, z: -160, r: 145, h: 270, rot: -0.5, cragH: 145 },
    ],
    []
  );

  // Middle-distance Pass Walls & Jagged Cliffs (240m - 340m away)
  const middleRidges = useMemo(
    () => [
      { x: -280, z: -310, r: 85, h: 145, rot: 0.2 },
      { x: -40, z: -350, r: 95, h: 160, rot: -0.3 },
      { x: 220, z: -320, r: 80, h: 140, rot: 0.4 },
      { x: 350, z: -90, r: 90, h: 150, rot: -0.2 },
      { x: 360, z: 210, r: 92, h: 155, rot: 0.35 },
      { x: 190, z: 340, r: 85, h: 145, rot: -0.4 },
      { x: -50, z: 360, r: 90, h: 150, rot: 0.25 },
      { x: -290, z: 280, r: 80, h: 135, rot: -0.3 },
      { x: -350, z: -30, r: 90, h: 150, rot: 0.45 },
    ],
    []
  );

  // Foothill Outcroppings (150m - 230m)
  const valleyFoothills = useMemo(
    () => [
      { x: -190, z: -210, r: 50, h: 65, rot: 0.1 },
      { x: 160, z: -230, r: 55, h: 70, rot: -0.2 },
      { x: 240, z: 90, r: 48, h: 60, rot: 0.3 },
      { x: -220, z: 150, r: 52, h: 68, rot: -0.15 },
    ],
    []
  );

  // Precompute geometries for performance and crisp silhouette rendering
  const outerGeos = useMemo(
    () => outerPeaks.map((p) => createMountainMassifGeo(p.r, p.h, 7)),
    [outerPeaks]
  );
  const midGeos = useMemo(
    () => middleRidges.map((r) => createMountainMassifGeo(r.r, r.h, 6)),
    [middleRidges]
  );
  const foothillGeos = useMemo(
    () => valleyFoothills.map((f) => createMountainMassifGeo(f.r, f.h, 6)),
    [valleyFoothills]
  );

  return (
    <group>
      {/* 1. Distant Towering Peaks with Crest Pinnacles */}
      {outerPeaks.map((pk, i) => (
        <group key={`outer_peak_${i}`} position={[pk.x, 0, pk.z]} rotation={[0, pk.rot, 0]}>
          {/* Main jagged mountain pyramid massif */}
          <mesh position={[0, pk.h * 0.45, 0]} geometry={outerGeos[i]}>
            <meshStandardMaterial
              map={rockTex}
              color={mountainRockColor}
              roughness={0.92}
              flatShading
            />
          </mesh>
          {/* Subsidiary needle spire crest */}
          <mesh
            position={[pk.r * 0.22, pk.h * 0.65, -pk.r * 0.15]}
            rotation={[0.08, i * 0.4, -0.06]}
          >
            <coneGeometry args={[pk.r * 0.32, pk.cragH, 6, 2]} />
            <meshStandardMaterial
              map={rockTex}
              color={peakCrestColor}
              roughness={0.88}
              flatShading
            />
          </mesh>
          {/* Shoulder cliff buttress */}
          <mesh
            position={[-pk.r * 0.35, pk.h * 0.28, pk.r * 0.2]}
            rotation={[-0.1, -i * 0.3, 0.1]}
          >
            <coneGeometry args={[pk.r * 0.45, pk.h * 0.55, 6, 2]} />
            <meshStandardMaterial
              map={rockTex}
              color={mountainRockColor}
              roughness={0.95}
              flatShading
            />
          </mesh>
        </group>
      ))}

      {/* 2. Middle Mountain Ridges */}
      {middleRidges.map((rd, i) => (
        <group key={`mid_ridge_${i}`} position={[rd.x, 0, rd.z]} rotation={[0, rd.rot, 0]}>
          <mesh position={[0, rd.h * 0.45, 0]} geometry={midGeos[i]}>
            <meshStandardMaterial
              map={rockTex}
              color={mountainRockColor}
              roughness={0.95}
              flatShading
            />
          </mesh>
          <mesh position={[rd.r * 0.2, rd.h * 0.3, -rd.r * 0.1]} rotation={[0, 0.5, 0]}>
            <coneGeometry args={[rd.r * 0.35, rd.h * 0.5, 5]} />
            <meshStandardMaterial
              map={rockTex}
              color={peakCrestColor}
              roughness={0.92}
              flatShading
            />
          </mesh>
        </group>
      ))}

      {/* 3. Rolling Foothill Crags */}
      {valleyFoothills.map((fh, i) => (
        <group key={`foothill_${i}`} position={[fh.x, 0, fh.z]} rotation={[0, fh.rot, 0]}>
          <mesh position={[0, fh.h * 0.42, 0]} geometry={foothillGeos[i]}>
            <meshStandardMaterial
              map={rockTex}
              color={mountainRockColor}
              roughness={0.96}
              flatShading
            />
          </mesh>
        </group>
      ))}

      {/* 4. Atmospheric Layered Mountain Valley Mist Rings */}
      <mesh position={[0, 22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[260, 520, 48]} />
        <meshBasicMaterial
          color={isSnow ? '#f1f5f9' : isFire ? '#451a03' : '#cbd5e1'}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 48, 0]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[340, 580, 48]} />
        <meshBasicMaterial
          color={isSnow ? '#e2e8f0' : isFire ? '#7c2d12' : '#94a3b8'}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ============================================================================
// 2. ORGANIC FLOWING CURVED RIVER SYSTEM
// ============================================================================

export const TerrainWaterRiver3D: React.FC<{ isSnow?: boolean }> = ({ isSnow }) => {
  const waterRef = useRef<THREE.Mesh>(null);
  const waterTex = useMemo(() => proceduralTextures.getWaterTexture(isSnow), [isSnow]);

  // Animate flowing river stream caustics
  useFrame((_, delta) => {
    if (waterTex) {
      waterTex.offset.y += delta * 0.07;
      waterTex.offset.x = Math.sin(waterTex.offset.y * 2.5) * 0.015;
    }
  });

  // Generate curved river water surface ribbon matching getRiverCenterX(z)
  const waterRibbonGeo = useMemo(() => {
    const zMin = -360;
    const zMax = 360;
    const zSegments = 90; // 8m per segment
    const uSegments = 8;
    const halfW = RIVER_WATER_HALF_WIDTH; // 9.5m (19m wide active water channel)

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= zSegments; j++) {
      const zNorm = j / zSegments;
      const z = zMin + zNorm * (zMax - zMin);
      const centerX = getRiverCenterX(z);

      for (let i = 0; i <= uSegments; i++) {
        const uNorm = i / uSegments; // 0..1 across river
        const xOffset = (uNorm - 0.5) * (halfW * 2);
        const x = centerX + xOffset;
        const y = RIVER_WATER_Y; // -0.55m

        vertices.push(x, y, z);
        uvs.push(uNorm * 3, zNorm * 24);
      }
    }

    const rowStride = uSegments + 1;
    for (let j = 0; j < zSegments; j++) {
      for (let i = 0; i < uSegments; i++) {
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

  // Generate curved riverbed silt ground directly beneath water
  const riverbedGeo = useMemo(() => {
    const zMin = -360;
    const zMax = 360;
    const zSegments = 72;
    const uSegments = 6;
    const halfW = 12.0;

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= zSegments; j++) {
      const zNorm = j / zSegments;
      const z = zMin + zNorm * (zMax - zMin);
      const centerX = getRiverCenterX(z);

      for (let i = 0; i <= uSegments; i++) {
        const uNorm = i / uSegments;
        const xOffset = (uNorm - 0.5) * (halfW * 2);
        const x = centerX + xOffset;
        const y = RIVER_BED_DEPTH + 0.05; // -1.70m

        vertices.push(x, y, z);
      }
    }

    const rowStride = uSegments + 1;
    for (let j = 0; j < zSegments; j++) {
      for (let i = 0; i < uSegments; i++) {
        const a = j * rowStride + i;
        const b = (j + 1) * rowStride + i;
        const c = (j + 1) * rowStride + (i + 1);
        const d = j * rowStride + (i + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Curved shoreline foam lines
  const [leftFoamGeo, rightFoamGeo] = useMemo(() => {
    const createShoreFoamGeo = (isRight: boolean) => {
      const zMin = -360;
      const zMax = 360;
      const zSegments = 72;
      const stripWidth = 0.9;
      const offsetSign = isRight ? 1 : -1;
      const baseDist = RIVER_WATER_HALF_WIDTH - 0.3;

      const geo = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const indices: number[] = [];

      for (let j = 0; j <= zSegments; j++) {
        const zNorm = j / zSegments;
        const z = zMin + zNorm * (zMax - zMin);
        const cx = getRiverCenterX(z);

        const xInner = cx + offsetSign * (baseDist - stripWidth);
        const xOuter = cx + offsetSign * baseDist;
        const y = RIVER_WATER_Y + 0.02;

        vertices.push(xInner, y, z);
        vertices.push(xOuter, y, z);
      }

      for (let j = 0; j < zSegments; j++) {
        const a = j * 2;
        const b = (j + 1) * 2;
        const c = (j + 1) * 2 + 1;
        const d = j * 2 + 1;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };

    return [createShoreFoamGeo(false), createShoreFoamGeo(true)];
  }, []);

  // Natural River Boulders along curved banks (safe distance from bridge crossings)
  const riverRocks = useMemo(() => {
    const zList = [-220, -170, -110, -70, 0, 20, 85, 130, 180, 240];
    return zList.map((z, idx) => {
      const cx = getRiverCenterX(z);
      const isLeft = idx % 2 === 0;
      const bankOffset = isLeft ? -RIVER_WATER_HALF_WIDTH - 1.2 : RIVER_WATER_HALF_WIDTH + 1.2;
      return {
        x: cx + bankOffset,
        y: -0.25,
        z,
        scale: 1.1 + (idx % 3) * 0.35,
        rot: idx * 0.7,
      };
    });
  }, []);

  const deepWaterColor = isSnow ? '#0284c7' : '#0369a1';

  return (
    <group>
      {/* 1. Dark Silt Riverbed Ground */}
      <mesh geometry={riverbedGeo} receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.98} />
      </mesh>

      {/* 2. Flowing Translucent Water Surface */}
      <mesh ref={waterRef} geometry={waterRibbonGeo} receiveShadow>
        <meshStandardMaterial
          map={waterTex}
          color={deepWaterColor}
          roughness={0.06}
          metalness={0.75}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 3. Shoreline Gentle Foam Edges */}
      <mesh geometry={leftFoamGeo}>
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.38} />
      </mesh>
      <mesh geometry={rightFoamGeo}>
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.38} />
      </mesh>

      {/* 4. Natural Riverbed & Shore Boulders */}
      {riverRocks.map((r, i) => (
        <mesh
          key={`rock_${i}`}
          position={[r.x, r.y, r.z]}
          scale={[r.scale, r.scale * 0.8, r.scale]}
          rotation={[0.1, r.rot, -0.1]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color="#475569" roughness={0.86} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ============================================================================
// 3. IMPERIAL STONE ARCH BRIDGE (MAIN HIGHWAY CROSSING)
// ============================================================================

export const ImperialStoneArchBridge3D: React.FC = () => {
  const stoneTex = useMemo(() => proceduralTextures.getStoneMasonryTexture(), []);
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  const { x: cx, z: cz } = MAIN_BRIDGE_CENTER; // [-32, -32]

  return (
    <group position={[cx, 0, cz]} rotation={[0, Math.PI / 4, 0]}>
      {/* 1. Stone Abutments (Riverbank anchor blocks) */}
      <mesh position={[-15.5, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 3.8, 11.2]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.88} />
      </mesh>
      <mesh position={[15.5, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 3.8, 11.2]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.88} />
      </mesh>

      {/* 2. Main Center Pier with Triangular Stream Cutwaters */}
      <group position={[0, -1.1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.6, 3.0, 11.2]} />
          <meshStandardMaterial map={stoneTex} color="#334155" roughness={0.9} />
        </mesh>
        {/* Upstream Triangular Cutwater */}
        <mesh position={[0, 0, 6.2]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[0.01, 1.6, 3.0, 4]} />
          <meshStandardMaterial map={stoneTex} color="#334155" roughness={0.9} />
        </mesh>
        {/* Downstream Cutwater */}
        <mesh position={[0, 0, -6.2]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[0.01, 1.6, 3.0, 4]} />
          <meshStandardMaterial map={stoneTex} color="#334155" roughness={0.9} />
        </mesh>
      </group>

      {/* 3. Arched Stone Deck (Segmented along arch to smoothly elevate characters) */}
      {/* Left Approach Ramp */}
      <mesh position={[-9.5, 0.45, 0]} rotation={[0, 0, 0.075]} receiveShadow>
        <boxGeometry args={[9.5, 0.5, 11.0]} />
        <meshStandardMaterial map={stoneTex} color="#64748b" roughness={0.84} />
      </mesh>
      {/* Center Arched Crown */}
      <mesh position={[0, 0.95, 0]} receiveShadow>
        <boxGeometry args={[10.5, 0.5, 11.0]} />
        <meshStandardMaterial map={stoneTex} color="#64748b" roughness={0.84} />
      </mesh>
      {/* Right Approach Ramp */}
      <mesh position={[9.5, 0.45, 0]} rotation={[0, 0, -0.075]} receiveShadow>
        <boxGeometry args={[9.5, 0.5, 11.0]} />
        <meshStandardMaterial map={stoneTex} color="#64748b" roughness={0.84} />
      </mesh>

      {/* 4. Arched Stone Balustrades with Classical Pillar Posts */}
      {[-5.3, 5.3].map((railZ, sIdx) => (
        <group key={`balustrade_${sIdx}`}>
          {/* Railing beam */}
          <mesh position={[0, 1.55, railZ]} castShadow>
            <boxGeometry args={[30.0, 0.65, 0.38]} />
            <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.88} />
          </mesh>

          {/* Balustrade Support Posts & Finials */}
          {[-14, -10, -6, -2, 2, 6, 10, 14].map((px, pIdx) => {
            const postY = 1.0 + 0.5 * (1 - Math.pow(px / 15, 2));
            return (
              <group key={`post_${pIdx}`} position={[px, postY, railZ]}>
                <mesh position={[0, 0.45, 0]} castShadow>
                  <boxGeometry args={[0.45, 0.9, 0.45]} />
                  <meshStandardMaterial map={stoneTex} color="#334155" />
                </mesh>
                {/* Traditional Stone Ball Finial */}
                <mesh position={[0, 1.05, 0]}>
                  <sphereGeometry args={[0.22, 8, 8]} />
                  <meshStandardMaterial map={stoneTex} color="#334155" />
                </mesh>
                {/* Han Dynasty Hanging Red Lanterns at bridge portals and center */}
                {(pIdx === 0 || pIdx === 3 || pIdx === 7) && (
                  <group position={[0, 1.6, 0]}>
                    <mesh position={[0, 0.2, 0]}>
                      <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
                      <meshStandardMaterial map={woodTex} color="#1c0a00" />
                    </mesh>
                    <mesh position={[0, -0.15, 0]}>
                      <cylinderGeometry args={[0.3, 0.35, 0.5, 8]} />
                      <meshStandardMaterial color="#dc2626" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, -0.45, 0]}>
                      <coneGeometry args={[0.12, 0.3, 6]} />
                      <meshStandardMaterial color="#facc15" roughness={0.6} />
                    </mesh>
                  </group>
                )}
              </group>
            );
          })}
        </group>
      ))}

      {/* 5. Entrance Imperial War Banners */}
      {[-15.2, 15.2].map((bx, bIdx) => (
        <group key={`banner_pair_${bIdx}`}>
          {[-5.8, 5.8].map((bz, zIdx) => (
            <group key={`flag_${zIdx}`} position={[bx, 0.3, bz]}>
              <mesh position={[0, 2.5, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.1, 5.0, 6]} />
                <meshStandardMaterial map={woodTex} color="#3e2723" />
              </mesh>
              <mesh position={[bIdx === 0 ? 0.7 : -0.7, 4.0, 0]} rotation={[0, 0, bIdx === 0 ? -0.1 : 0.1]}>
                <planeGeometry args={[1.5, 1.8]} />
                <meshStandardMaterial color="#b91c1c" side={THREE.DoubleSide} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

// ============================================================================
// 4. NORTHERN FLANK TIMBER TRESTLE BRIDGE (VILLAGE FLANK CROSSING)
// ============================================================================

export const NorthernFlankTimberBridge3D: React.FC = () => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);
  const { x: cx, z: cz } = FLANK_BRIDGE_CENTER; // [-7.5, 48]

  return (
    <group position={[cx, 0, cz]}>
      {/* 1. Heavy Timber Log Deck Planks */}
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[26.0, 0.38, 7.2]} />
        <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.88} />
      </mesh>

      {/* 2. Cross Timber Planks */}
      {[-10, -6, -2, 2, 6, 10].map((px, i) => (
        <mesh key={i} position={[px, 0.65, 0]} receiveShadow>
          <boxGeometry args={[0.35, 0.08, 7.0]} />
          <meshStandardMaterial map={woodTex} color="#291003" roughness={0.92} />
        </mesh>
      ))}

      {/* 3. Trestle Log Pilings sunk into Riverbed */}
      {[-8, 0, 8].map((tx, idx) => (
        <group key={`trestle_${idx}`} position={[tx, -0.6, 0]}>
          <mesh position={[0, 0, -2.6]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 3.2, 6]} />
            <meshStandardMaterial map={woodTex} color="#1c0a00" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0, 2.6]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 3.2, 6]} />
            <meshStandardMaterial map={woodTex} color="#1c0a00" roughness={0.95} />
          </mesh>
          {/* Diagonal timber cross brace */}
          <mesh position={[0, 0, 0]} rotation={[0.5, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 5.2, 6]} />
            <meshStandardMaterial map={woodTex} color="#1c0a00" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* 4. Rustic Log Railings */}
      {[-3.4, 3.4].map((rz, rIdx) => (
        <group key={`log_rail_${rIdx}`}>
          <mesh position={[0, 1.25, rz]} castShadow>
            <boxGeometry args={[26.0, 0.22, 0.22]} />
            <meshStandardMaterial map={woodTex} color="#291003" roughness={0.92} />
          </mesh>
          {[-12, -8, -4, 0, 4, 8, 12].map((postX, pIdx) => (
            <mesh key={`post_${pIdx}`} position={[postX, 0.95, rz]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 1.2, 6]} />
              <meshStandardMaterial map={woodTex} color="#1c0a00" roughness={0.94} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

export const StoneTimberBridge3D: React.FC<{
  position?: [number, number, number] | number[];
  rotationY?: number;
}> = ({ position, rotationY }) => {
  if (position) {
    return (
      <group position={position as [number, number, number]} rotation={[0, rotationY ?? 0, 0]}>
        <ImperialStoneArchBridge3D />
      </group>
    );
  }
  return <ImperialStoneArchBridge3D />;
};
