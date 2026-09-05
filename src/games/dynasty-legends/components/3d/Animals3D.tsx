import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { proceduralTextures } from './textures/proceduralTextures';

// Individual 3D Han Warhorse (Cavalry Steed)
export const Warhorse3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  coatColor?: string;
  hasSaddle?: boolean;
}> = ({
  position,
  rotationY = 0,
  scale = 1,
  coatColor = '#78350f', // Chestnut bay / Black / White
  hasSaddle = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const animOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const coatTex = useMemo(() => proceduralTextures.getHorseCoatTexture(coatColor), [coatColor]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + animOffset;

    // Subtle head bob & grazing motion
    if (headRef.current) {
      headRef.current.rotation.x = 0.35 + Math.sin(t * 1.5) * 0.12;
      headRef.current.rotation.y = Math.sin(t * 0.8) * 0.08;
    }

    // Natural tail swish
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3.2) * 0.25;
      tailRef.current.rotation.x = -0.2 + Math.cos(t * 2.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* 1. Muscular Horse Torso / Barrel */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.75, 0.85, 1.8]} />
        <meshStandardMaterial map={coatTex} color={coatColor} roughness={0.7} />
      </mesh>

      {/* Rump / Haunches rounding */}
      <mesh position={[0, 1.35, -0.85]} castShadow>
        <sphereGeometry args={[0.42, 8, 8]} />
        <meshStandardMaterial color={coatColor} roughness={0.7} />
      </mesh>

      {/* Chest / Shoulder rounding */}
      <mesh position={[0, 1.4, 0.82]} castShadow>
        <sphereGeometry args={[0.44, 8, 8]} />
        <meshStandardMaterial color={coatColor} roughness={0.7} />
      </mesh>

      {/* 2. Neck & Head Group */}
      <group position={[0, 1.65, 0.85]}>
        {/* Arching Muscular Neck */}
        <mesh position={[0, 0.45, 0.25]} rotation={[0.65, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.35, 1.0, 8]} />
          <meshStandardMaterial color={coatColor} roughness={0.7} />
        </mesh>

        {/* Mane along Neck Ridge */}
        <mesh position={[0, 0.58, 0.12]} rotation={[0.65, 0, 0]}>
          <boxGeometry args={[0.08, 0.95, 0.22]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>

        {/* Articulated Head & Muzzle */}
        <group ref={headRef} position={[0, 0.9, 0.55]}>
          {/* Skull */}
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.32, 0.55]} />
            <meshStandardMaterial color={coatColor} roughness={0.7} />
          </mesh>

          {/* Muzzle & Nostrils */}
          <mesh position={[0, -0.1, 0.32]} castShadow>
            <boxGeometry args={[0.22, 0.2, 0.28]} />
            <meshStandardMaterial color="#29180c" roughness={0.8} />
          </mesh>

          {/* Left & Right Ears */}
          <mesh position={[-0.1, 0.24, -0.1]} rotation={[-0.2, 0, -0.15]}>
            <coneGeometry args={[0.05, 0.18, 4]} />
            <meshStandardMaterial color={coatColor} roughness={0.8} />
          </mesh>
          <mesh position={[0.1, 0.24, -0.1]} rotation={[-0.2, 0, 0.15]}>
            <coneGeometry args={[0.05, 0.18, 4]} />
            <meshStandardMaterial color={coatColor} roughness={0.8} />
          </mesh>

          {/* Leather War Bridle & Reins */}
          <mesh position={[0, 0.02, 0.1]}>
            <boxGeometry args={[0.32, 0.34, 0.05]} />
            <meshStandardMaterial color="#dc2626" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* 3. Four Articulated Legs */}
      {[
        { x: -0.28, z: 0.72, rotX: 0.05 },  // Front Left
        { x: 0.28, z: 0.72, rotX: -0.05 },  // Front Right
        { x: -0.28, z: -0.72, rotX: -0.05 }, // Rear Left
        { x: 0.28, z: -0.72, rotX: 0.05 },  // Rear Right
      ].map((leg, i) => (
        <group key={i} position={[leg.x, 1.0, leg.z]} rotation={[leg.rotX, 0, 0]}>
          {/* Upper Thigh */}
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.08, 0.55, 6]} />
            <meshStandardMaterial color={coatColor} roughness={0.7} />
          </mesh>
          {/* Lower Hock / Cannon Bone */}
          <mesh position={[0, -0.65, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.065, 0.55, 6]} />
            <meshStandardMaterial color={coatColor} roughness={0.7} />
          </mesh>
          {/* Black Hoof */}
          <mesh position={[0, -0.96, 0.02]}>
            <cylinderGeometry args={[0.08, 0.09, 0.14, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 4. Flowing Horse Tail */}
      <mesh ref={tailRef} position={[0, 1.45, -1.05]} rotation={[-0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.12, 1.1, 6]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>

      {/* 5. Han Military War Saddle & Decorative Blanket */}
      {hasSaddle && (
        <group position={[0, 1.76, 0.05]}>
          {/* Silk Saddle Blanket */}
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.82, 0.06, 0.9]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.6} />
          </mesh>
          {/* Leather Saddle Seat */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.55, 0.12, 0.65]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          {/* Front Pommel */}
          <mesh position={[0, 0.18, 0.28]}>
            <boxGeometry args={[0.35, 0.18, 0.08]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
          {/* Rear Cantle */}
          <mesh position={[0, 0.2, -0.28]}>
            <boxGeometry args={[0.42, 0.2, 0.08]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* Ground Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.7, 1.4, 1]}>
        <circleGeometry args={[0.9, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
};

// High-Altitude Circling Eagles / Battle Crows
export const SoaringEagles3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  const eagles = useMemo(
    () => [
      { radius: 65, height: 95, speed: 0.35, phase: 0 },
      { radius: 85, height: 110, speed: 0.28, phase: 2.1 },
      { radius: 50, height: 100, speed: 0.42, phase: 4.3 },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const e = eagles[i];
        if (!e) return;
        const angle = t * e.speed + e.phase;
        child.position.set(
          Math.sin(angle) * e.radius,
          e.height + Math.sin(t * 0.5 + i) * 3,
          Math.cos(angle) * e.radius
        );
        child.rotation.y = angle + Math.PI / 2;

        // Wing flap
        const flap = Math.sin(t * 3.5 + i * 1.5) * 0.25;
        const leftWing = child.getObjectByName('leftWing');
        const rightWing = child.getObjectByName('rightWing');
        if (leftWing) leftWing.rotation.z = flap;
        if (rightWing) rightWing.rotation.z = -flap;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {eagles.map((_, idx) => (
        <group key={idx}>
          {/* Bird Body */}
          <mesh>
            <coneGeometry args={[0.4, 2.2, 5]} />
            <meshBasicMaterial color="#1e1b4b" fog={false} />
          </mesh>
          {/* Left Wing */}
          <group name="leftWing" position={[-0.4, 0, 0]}>
            <mesh position={[-1.2, 0, 0]}>
              <planeGeometry args={[2.4, 0.8]} />
              <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} fog={false} />
            </mesh>
          </group>
          {/* Right Wing */}
          <group name="rightWing" position={[0.4, 0, 0]}>
            <mesh position={[1.2, 0, 0]}>
              <planeGeometry args={[2.4, 0.8]} />
              <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} fog={false} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

// Composite Ecosystem Component
export const Animals3D: React.FC<{ playerPos?: { x: number; y: number; z: number } }> = ({
  playerPos,
}) => {
  // Strategic Horse Grazing & Cavalry Encampment Positions
  const horses = useMemo(
    () => [
      // Near Coalition Camp Outpost
      { pos: [-82, 0, -78] as [number, number, number], rot: 0.8, color: '#78350f', saddle: true },
      { pos: [-86, 0, -74] as [number, number, number], rot: -1.2, color: '#1c1917', saddle: true },
      { pos: [-78, 0, -84] as [number, number, number], rot: 2.1, color: '#f8fafc', saddle: false }, // White steed

      // Grazing peacefully in lush pasture near the riverbank
      { pos: [-38, 0, -18] as [number, number, number], rot: -0.4, color: '#92400e', saddle: false },
      { pos: [-42, 0, -26] as [number, number, number], rot: 1.4, color: '#78350f', saddle: false },
      { pos: [-20, 0, 35] as [number, number, number], rot: 2.8, color: '#451a03', saddle: false },

      // East Guard Garrison Outpost
      { pos: [58, 0, -72] as [number, number, number], rot: -1.8, color: '#78350f', saddle: true },
      { pos: [64, 0, -78] as [number, number, number], rot: 0.3, color: '#1c1917', saddle: true },

      // Near Citadel Gate Encampment
      { pos: [98, 0, 92] as [number, number, number], rot: -2.2, color: '#991b1b', saddle: true }, // Red steed (Red Hare lineage)
    ],
    []
  );

  // View distance culling on horses (within 85m of player)
  const visibleHorses = useMemo(() => {
    if (!playerPos) return horses;
    const maxDistSq = 85 * 85;
    return horses.filter(
      (h) => (h.pos[0] - playerPos.x) ** 2 + (h.pos[2] - playerPos.z) ** 2 <= maxDistSq
    );
  }, [horses, playerPos?.x, playerPos?.z]);

  return (
    <group>
      {/* 1. Tactical Warhorses & Grazing Steeds */}
      {visibleHorses.map((h, i) => (
        <Warhorse3D
          key={i}
          position={h.pos}
          rotationY={h.rot}
          coatColor={h.color}
          hasSaddle={h.saddle}
          scale={1.1}
        />
      ))}

      {/* 2. Soaring Eagles Circling Above Battlefield */}
      <SoaringEagles3D />
    </group>
  );
};
