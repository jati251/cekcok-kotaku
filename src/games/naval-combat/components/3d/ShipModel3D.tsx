import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ShipConfig, SailState } from '../../types';

interface ShipModel3DProps {
  config: ShipConfig;
  sailState?: SailState;
  rudderAngle?: number; // -1 to 1
  isEnemy?: boolean;
}

export const ShipModel3D: React.FC<ShipModel3DProps> = ({
  config,
  sailState = 'HALF_SAIL',
  rudderAngle = 0,
  isEnemy = false,
}) => {
  const sailsGroupRef = useRef<THREE.Group>(null);
  const flagRef = useRef<THREE.Mesh>(null);
  const rudderMeshRef = useRef<THREE.Mesh>(null);

  const {
    hullColor,
    trimColor,
    sailColor,
    length,
    width,
    cannonsPerSide,
    id: shipClass,
  } = config;

  // Mast counts: sloop=1, brig=2, frigate=3
  const mastCount = shipClass === 'sloop' ? 1 : shipClass === 'brig' ? 2 : 3;

  // Mast positions along ship length (-Z to +Z)
  const mastPositions = useMemo(() => {
    if (mastCount === 1) return [0];
    if (mastCount === 2) return [-length * 0.22, length * 0.18];
    return [-length * 0.3, 0, length * 0.28];
  }, [mastCount, length]);

  // Cannon port spacing
  const cannonPositions = useMemo(() => {
    const positions: number[] = [];
    const span = length * 0.65;
    const step = span / (cannonsPerSide + 1);
    for (let i = 1; i <= cannonsPerSide; i++) {
      positions.push(-span * 0.5 + i * step);
    }
    return positions;
  }, [cannonsPerSide, length]);

  // Dynamic fluttering animation for flag and sail breathing
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 8) * 0.15;
      flagRef.current.rotation.z = Math.cos(t * 6) * 0.1;
    }

    if (sailsGroupRef.current) {
      // Wind billow effect scales with sail state
      const billowAmount = sailState === 'FULL_SAIL' ? 1.0 : sailState === 'HALF_SAIL' ? 0.65 : 0.15;
      sailsGroupRef.current.scale.set(
        1.0,
        sailState === 'ANCHOR' ? 0.25 : sailState === 'HALF_SAIL' ? 0.7 : 1.0,
        1.0 + Math.sin(t * 3.5) * 0.06 * billowAmount
      );
    }

    if (rudderMeshRef.current) {
      rudderMeshRef.current.rotation.y = -rudderAngle * 0.55;
    }
  });

  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isEnemy ? '#3b1d11' : hullColor,
        roughness: 0.85,
        metalness: 0.08,
      }),
    [hullColor, isEnemy]
  );

  const trimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isEnemy ? '#b91c1c' : trimColor,
        roughness: 0.6,
        metalness: 0.2,
      }),
    [trimColor, isEnemy]
  );

  const deckMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#854d0e',
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  );

  const cannonMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.35,
        metalness: 0.85,
      }),
    []
  );

  const sailMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isEnemy ? '#f8fafc' : sailColor,
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    [sailColor, isEnemy]
  );

  const flagMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isEnemy ? '#0f172a' : '#1e1b4b',
        roughness: 0.8,
        side: THREE.DoubleSide,
      }),
    [isEnemy]
  );

  return (
    <group>
      {/* --- HULL STRUCTURE --- */}
      {/* Main Keel & Lower Hull (Tapered) */}
      <mesh position={[0, 0.4, 0]} material={woodMaterial} castShadow receiveShadow>
        <boxGeometry args={[width, 1.8, length * 0.92]} />
      </mesh>

      {/* Pointed Bow / Prow */}
      <mesh
        position={[0, 0.7, length * 0.48]}
        rotation={[0, 0, 0]}
        material={woodMaterial}
        castShadow
      >
        <cylinderGeometry args={[0.2, width * 0.5, length * 0.18, 4]} />
      </mesh>

      {/* Bowsprit Spar pointing forward */}
      <mesh
        position={[0, 1.8, length * 0.55]}
        rotation={[Math.PI * 0.12, 0, 0]}
        material={woodMaterial}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.18, length * 0.28, 8]} />
      </mesh>

      {/* Upper Gunwale Trim Band */}
      <mesh position={[0, 1.25, 0]} material={trimMaterial} castShadow>
        <boxGeometry args={[width + 0.15, 0.22, length * 0.94]} />
      </mesh>

      {/* Deck Floor */}
      <mesh position={[0, 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} material={deckMaterial}>
        <planeGeometry args={[width * 0.9, length * 0.88]} />
      </mesh>

      {/* Raised Stern Quarterdeck */}
      <mesh
        position={[0, 1.8, -length * 0.35]}
        material={woodMaterial}
        castShadow
      >
        <boxGeometry args={[width * 0.88, 1.1, length * 0.24]} />
      </mesh>

      {/* Captain's Cabin Windows at Stern */}
      <mesh position={[0, 1.85, -length * 0.475]} material={trimMaterial}>
        <boxGeometry args={[width * 0.65, 0.6, 0.1]} />
      </mesh>

      {/* Rudder Blade */}
      <mesh
        ref={rudderMeshRef}
        position={[0, -0.4, -length * 0.47]}
        material={woodMaterial}
        castShadow
      >
        <boxGeometry args={[0.15, 1.2, 0.9]} />
      </mesh>

      {/* --- BROADSIDE CANNONS (Port & Starboard) --- */}
      {cannonPositions.map((posZ, idx) => (
        <group key={`gun-${idx}`} position={[0, 1.1, posZ]}>
          {/* Port Gun (Left side: -X) */}
          <group position={[-width * 0.51, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={cannonMaterial} castShadow>
              <cylinderGeometry args={[0.09, 0.14, 0.75, 8]} />
            </mesh>
            {/* Gunport frame */}
            <mesh position={[0, 0.05, 0]} material={trimMaterial}>
              <boxGeometry args={[0.3, 0.08, 0.3]} />
            </mesh>
          </group>

          {/* Starboard Gun (Right side: +X) */}
          <group position={[width * 0.51, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh material={cannonMaterial} castShadow>
              <cylinderGeometry args={[0.09, 0.14, 0.75, 8]} />
            </mesh>
            {/* Gunport frame */}
            <mesh position={[0, 0.05, 0]} material={trimMaterial}>
              <boxGeometry args={[0.3, 0.08, 0.3]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* --- MASTS, RIGGING & DYNAMIC SAILS --- */}
      <group ref={sailsGroupRef}>
        {mastPositions.map((posZ, idx) => {
          const mastHeight = length * 0.68 + (idx === 1 ? 2.5 : 0);
          const yardWidth = width * 1.5 - idx * 0.4;
          return (
            <group key={`mast-${idx}`} position={[0, 1.3, posZ]}>
              {/* Main Vertical Mast Pole */}
              <mesh position={[0, mastHeight * 0.5, 0]} material={woodMaterial} castShadow>
                <cylinderGeometry args={[0.14, 0.24, mastHeight, 10]} />
              </mesh>

              {/* Lower Yard Spar */}
              <mesh position={[0, mastHeight * 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={woodMaterial} castShadow>
                <cylinderGeometry args={[0.08, 0.1, yardWidth, 8]} />
              </mesh>
              {/* Lower Square Sail */}
              <mesh position={[0, mastHeight * 0.32, 0.2]} material={sailMaterial} castShadow>
                <planeGeometry args={[yardWidth * 0.95, mastHeight * 0.32]} />
              </mesh>

              {/* Crow's Nest Platform */}
              <mesh position={[0, mastHeight * 0.65, 0]} material={woodMaterial}>
                <cylinderGeometry args={[0.55, 0.45, 0.35, 8]} />
              </mesh>

              {/* Upper Topsail Yard Spar */}
              <mesh position={[0, mastHeight * 0.85, 0]} rotation={[0, 0, Math.PI / 2]} material={woodMaterial} castShadow>
                <cylinderGeometry args={[0.06, 0.08, yardWidth * 0.75, 8]} />
              </mesh>
              {/* Upper Topsail */}
              <mesh position={[0, mastHeight * 0.78, 0.15]} material={sailMaterial} castShadow>
                <planeGeometry args={[yardWidth * 0.7, mastHeight * 0.26]} />
              </mesh>

              {/* Flag atop highest mast */}
              {idx === (mastCount === 1 ? 0 : 1) && (
                <mesh
                  ref={flagRef}
                  position={[0, mastHeight + 0.5, -0.6]}
                  rotation={[0, 0, 0]}
                  material={flagMaterial}
                >
                  <planeGeometry args={[1.4, 0.8]} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};
