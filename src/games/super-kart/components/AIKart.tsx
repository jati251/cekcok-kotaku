import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface AIKartProps {
  color: string;
  kartColor: string;
  name: string;
}

export function AIKart({ color, kartColor, name: _name }: AIKartProps) {
  const wheelsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (wheelsRef.current) {
      wheelsRef.current.children.forEach((w) => {
        w.rotation.x += delta * 20;
      });
    }
  });

  return (
    <group>
      {/* Carbon Underfloor Tray */}
      <mesh position={[0, 0.16, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 0.08, 2.3]} />
        <meshStandardMaterial color="#09090b" roughness={0.7} metalness={0.9} />
      </mesh>

      {/* Main Body */}
      <mesh position={[0, 0.36, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.26, 1.7]} />
        <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
      </mesh>

      {/* Dual Sculpted Sidepods */}
      <mesh position={[-0.58, 0.33, 0.05]} castShadow>
        <boxGeometry args={[0.26, 0.22, 1.25]} />
        <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
      </mesh>
      <mesh position={[0.58, 0.33, 0.05]} castShadow>
        <boxGeometry args={[0.26, 0.22, 1.25]} />
        <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
      </mesh>

      {/* Front Nose Wedge */}
      <mesh position={[0, 0.31, 1.05]} rotation={[-0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.88, 0.18, 0.65]} />
        <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
      </mesh>

      {/* Front Splitter Wing */}
      <mesh position={[0, 0.18, 1.38]} castShadow>
        <boxGeometry args={[1.52, 0.06, 0.36]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* Dual Headlights */}
      <mesh position={[-0.32, 0.29, 1.28]} rotation={[-0.2, 0.1, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.12]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.32, 0.29, 1.28]} rotation={[-0.2, -0.1, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.12]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Racing Stripe */}
      <mesh position={[0, 0.42, 0.1]}>
        <boxGeometry args={[0.26, 0.16, 1.68]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>

      {/* Rear High-Downforce Wing */}
      <group position={[0, 0.72, -1.1]}>
        <mesh position={[-0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.48, 0.16]} />
          <meshStandardMaterial color="#09090b" />
        </mesh>
        <mesh position={[0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.48, 0.16]} />
          <meshStandardMaterial color="#09090b" />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[-0.06, 0, 0]} castShadow>
          <boxGeometry args={[1.56, 0.06, 0.38]} />
          <meshStandardMaterial color={kartColor} roughness={0.2} metalness={0.4} />
        </mesh>
      </group>

      {/* Twin Exhausts */}
      <mesh position={[-0.28, 0.32, -1.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.42, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} />
      </mesh>
      <mesh position={[0.28, 0.32, -1.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.42, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} />
      </mesh>

      {/* Driver Avatar & Detailed Helmet */}
      <group position={[0, 0.74, -0.25]}>
        <mesh castShadow>
          <sphereGeometry args={[0.29, 20, 20]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.25} />
        </mesh>
        {/* Iridescent Visor */}
        <mesh position={[0, 0.02, 0.19]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.34, 0.14, 0.2]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>

      {/* 4 Detailed Wheels */}
      <group ref={wheelsRef}>
        {/* Front Left */}
        <group position={[-0.82, 0.30, 0.82]}>
          <AIDetailedWheel />
        </group>
        {/* Front Right */}
        <group position={[0.82, 0.30, 0.82]}>
          <AIDetailedWheel isRight />
        </group>
        {/* Rear Left */}
        <group position={[-0.86, 0.32, -0.75]} scale={[1.15, 1.15, 1.15]}>
          <AIDetailedWheel />
        </group>
        {/* Rear Right */}
        <group position={[0.86, 0.32, -0.75]} scale={[1.15, 1.15, 1.15]}>
          <AIDetailedWheel isRight />
        </group>
      </group>
    </group>
  );
}

function AIDetailedWheel({ isRight }: { isRight?: boolean }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Rubber Tire */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.28, 16]} />
        <meshStandardMaterial color="#18181b" roughness={0.85} />
      </mesh>
      {/* Rim Barrel */}
      <mesh>
        <cylinderGeometry args={[0.21, 0.21, 0.29, 14]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Caliper */}
      <mesh position={[0.13, isRight ? -0.06 : 0.06, 0]}>
        <boxGeometry args={[0.07, 0.04, 0.12]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Center cap */}
      <mesh position={[0, isRight ? 0.145 : -0.145, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 10]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} />
      </mesh>
    </group>
  );
}
