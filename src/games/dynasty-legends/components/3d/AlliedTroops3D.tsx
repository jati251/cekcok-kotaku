import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AlliedSoldier3D } from '../../engine/dynasty3dEngine';

interface AlliedTroops3DProps {
  allies: AlliedSoldier3D[];
}

const AlliedSoldierUnit3D: React.FC<{ soldier: AlliedSoldier3D }> = ({ soldier }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const lastPosRef = useRef({ x: soldier.position.x, z: soldier.position.z });
  const walkPhaseRef = useRef<number>(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    groupRef.current.position.set(soldier.position.x, soldier.position.y, soldier.position.z);
    groupRef.current.rotation.y = soldier.rotationY;

    // Movement tracking via displacement
    const dx = soldier.position.x - lastPosRef.current.x;
    const dz = soldier.position.z - lastPosRef.current.z;
    lastPosRef.current.x = soldier.position.x;
    lastPosRef.current.z = soldier.position.z;

    const moveSpeed = Math.hypot(dx, dz) / Math.max(0.001, dt);
    const isMoving = moveSpeed > 0.1 || Math.abs(soldier.velocity.x) > 0.1 || Math.abs(soldier.velocity.z) > 0.1;

    if (isMoving) {
      walkPhaseRef.current += dt * 10;
      const stride = Math.sin(walkPhaseRef.current);
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * 0.6;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.6;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -stride * 0.45;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      const time = state.clock.getElapsedTime();
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(time * 3) * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body Torso - Imperial Han Blue Tunic & Brigandine */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.42, 0.54, 0.28]} />
        <meshStandardMaterial color="#1e40af" roughness={0.6} />
      </mesh>
      {/* Iron Cuirass Plate */}
      <mesh position={[0, 0.74, 0.02]}>
        <boxGeometry args={[0.44, 0.4, 0.29]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Head with Imperial Han Helmet */}
      <group position={[0, 1.16, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 0.14, 10]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <coneGeometry args={[0.05, 0.16, 6]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      </group>

      {/* Left Arm & Shoulder Armor */}
      <mesh position={[-0.28, 0.7, 0]}>
        <cylinderGeometry args={[0.065, 0.055, 0.38, 6]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[-0.28, 0.88, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.2]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>

      {/* Right Arm with Allied Spear & Blue Tassel */}
      <group ref={rightArmRef} position={[0.28, 0.7, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.38, 6]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        <group position={[0, -0.25, 0.1]}>
          {/* Spear Shaft */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 1.6, 6]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          {/* Iron Spearhead */}
          <mesh position={[0, 1.3, 0]}>
            <coneGeometry args={[0.065, 0.32, 6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          {/* Blue Silk Tassel */}
          <mesh position={[0, 1.1, 0]}>
            <coneGeometry args={[0.055, 0.16, 6]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, 0.35, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.38, 6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, 0.35, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.38, 6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export const AlliedTroops3D: React.FC<AlliedTroops3DProps> = ({ allies }) => {
  return (
    <group>
      {allies.map((soldier) => (
        <AlliedSoldierUnit3D key={soldier.id} soldier={soldier} />
      ))}
    </group>
  );
};
