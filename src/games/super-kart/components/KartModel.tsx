import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { type KartPhysicsState } from '../engine/kartPhysics';

interface KartModelProps {
  physicsStateRef: React.RefObject<KartPhysicsState>;
  steeringInput: number; // -1 (left), 1 (right)
  kartColor?: string;
  driverColor?: string;
}

export function KartModel({
  physicsStateRef,
  steeringInput,
  kartColor = '#ef4444',
  driverColor = '#ef4444',
}: KartModelProps) {
  const modelRootRef = useRef<THREE.Group>(null);

  // Steer pivot groups (handle Y-axis yaw turning only)
  const frontLeftSteerRef = useRef<THREE.Group>(null);
  const frontRightSteerRef = useRef<THREE.Group>(null);

  // Roll spin groups (handle forward wheel rotation only, nested inside steer group)
  const frontLeftRollRef = useRef<THREE.Group>(null);
  const frontRightRollRef = useRef<THREE.Group>(null);
  const rearLeftRollRef = useRef<THREE.Group>(null);
  const rearRightRollRef = useRef<THREE.Group>(null);

  const steeringWheelRef = useRef<THREE.Group>(null);
  const flameLeftRef = useRef<THREE.Mesh>(null);
  const flameRightRef = useRef<THREE.Mesh>(null);
  const sparkLeftRef = useRef<THREE.Mesh>(null);
  const sparkRightRef = useRef<THREE.Mesh>(null);
  const bodyMeshRef = useRef<THREE.Mesh>(null);
  const noseMeshRef = useRef<THREE.Mesh>(null);
  const leftPodMeshRef = useRef<THREE.Mesh>(null);
  const rightPodMeshRef = useRef<THREE.Mesh>(null);
  const spoilerMeshRef = useRef<THREE.Mesh>(null);

  const wheelRotationRef = useRef(0);
  const currentSteerAngleRef = useRef(0);

  const sparkColors = {
    0: 0x000000,
    1: 0x38bdf8, // Blue
    2: 0xf97316, // Orange
    3: 0xc084fc, // Purple
  };

  useFrame((_, delta) => {
    const state = physicsStateRef.current;
    if (!state) return;

    // Apply drift yaw slip and chassis roll
    if (modelRootRef.current) {
      modelRootRef.current.rotation.y = state.driftAngle;
      modelRootRef.current.rotation.z = state.roll;
    }

    // Accumulate forward wheel rolling
    wheelRotationRef.current += (state.speed / 0.35) * delta;

    // Smoothly interpolate front wheel steering yaw angle
    const targetSteerAngle = steeringInput * 0.52;
    currentSteerAngleRef.current = THREE.MathUtils.lerp(
      currentSteerAngleRef.current,
      targetSteerAngle,
      delta * 14
    );

    // 1. Steering Yaw
    if (frontLeftSteerRef.current && frontRightSteerRef.current) {
      frontLeftSteerRef.current.rotation.y = currentSteerAngleRef.current;
      frontRightSteerRef.current.rotation.y = currentSteerAngleRef.current;
    }

    // 2. Cockpit Steering Wheel Turn
    if (steeringWheelRef.current) {
      steeringWheelRef.current.rotation.z = -currentSteerAngleRef.current * 1.8;
    }

    // 3. Wheel Spin
    if (frontLeftRollRef.current && frontRightRollRef.current) {
      frontLeftRollRef.current.rotation.x = wheelRotationRef.current;
      frontRightRollRef.current.rotation.x = wheelRotationRef.current;
    }

    if (rearLeftRollRef.current && rearRightRollRef.current) {
      rearLeftRollRef.current.rotation.x = wheelRotationRef.current;
      rearRightRollRef.current.rotation.x = wheelRotationRef.current;
    }

    // Boost flames
    const isBoosting = state.boostActive || state.hasStar;
    if (flameLeftRef.current && flameRightRef.current) {
      if (isBoosting) {
        const s = 0.9 + Math.random() * 0.7;
        flameLeftRef.current.scale.set(s, s, s * 1.8);
        flameRightRef.current.scale.set(s, s, s * 1.8);
        flameLeftRef.current.visible = true;
        flameRightRef.current.visible = true;
      } else {
        flameLeftRef.current.visible = false;
        flameRightRef.current.visible = false;
      }
    }

    // Drift sparks
    if (sparkLeftRef.current && sparkRightRef.current) {
      if (state.driftLevel > 0) {
        const colorHex = sparkColors[state.driftLevel];
        (sparkLeftRef.current.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        (sparkRightRef.current.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        sparkLeftRef.current.visible = true;
        sparkRightRef.current.visible = true;
      } else {
        sparkLeftRef.current.visible = false;
        sparkRightRef.current.visible = false;
      }
    }

    // Rainbow star effect / dynamic custom color
    const targetColor = state.hasStar
      ? new THREE.Color().setHSL((Date.now() * 0.005) % 1, 1.0, 0.5)
      : new THREE.Color(kartColor);

    if (bodyMeshRef.current) (bodyMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(targetColor);
    if (noseMeshRef.current) (noseMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(targetColor);
    if (leftPodMeshRef.current) (leftPodMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(targetColor);
    if (rightPodMeshRef.current) (rightPodMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(targetColor);
    if (spoilerMeshRef.current) (spoilerMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(targetColor);
  });

  return (
    <group ref={modelRootRef}>
      {/* ===== 1. AERODYNAMIC CHASSIS & FLOOR PAN ===== */}
      {/* Carbon Underfloor Tray */}
      <mesh position={[0, 0.16, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 0.08, 2.3]} />
        <meshStandardMaterial color="#09090b" roughness={0.7} metalness={0.9} />
      </mesh>

      {/* Rear Carbon Diffuser with Strakes */}
      <group position={[0, 0.18, -1.1]}>
        <mesh rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.9} />
        </mesh>
        {[-0.4, -0.15, 0.15, 0.4].map((x, i) => (
          <mesh key={i} position={[x, -0.02, 0.05]}>
            <boxGeometry args={[0.03, 0.12, 0.28]} />
            <meshStandardMaterial color="#09090b" metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ===== 2. SCULPTED MAIN BODYWORK ===== */}
      {/* Central Monocoque Body */}
      <mesh ref={bodyMeshRef} position={[0, 0.36, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.26, 1.7]} />
        <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
      </mesh>

      {/* Dual Sculpted Sidepods with Radiator Inlets */}
      {/* Left Sidepod */}
      <group position={[-0.58, 0.33, 0.05]}>
        <mesh ref={leftPodMeshRef} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.22, 1.25]} />
          <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
        </mesh>
        {/* Radiator Air Intake Mesh */}
        <mesh position={[0, 0.01, 0.63]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.04]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Sidepod */}
      <group position={[0.58, 0.33, 0.05]}>
        <mesh ref={rightPodMeshRef} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.22, 1.25]} />
          <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
        </mesh>
        {/* Radiator Air Intake Mesh */}
        <mesh position={[0, 0.01, 0.63]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.04]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
      </group>

      {/* Aerodynamic Front Nose Wedge */}
      <mesh ref={noseMeshRef} position={[0, 0.31, 1.05]} rotation={[-0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.88, 0.18, 0.65]} />
        <meshStandardMaterial color={kartColor} roughness={0.25} metalness={0.35} />
      </mesh>

      {/* Front Nose Grille & Emblem */}
      <mesh position={[0, 0.24, 1.34]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.42, 0.08, 0.05]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} />
      </mesh>

      {/* Dual Front LED Headlights */}
      <mesh position={[-0.32, 0.29, 1.28]} rotation={[-0.2, 0.1, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.12]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.32, 0.29, 1.28]} rotation={[-0.2, -0.1, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.12]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Front Splitter Wing & Endplates */}
      <group position={[0, 0.18, 1.38]}>
        <mesh castShadow>
          <boxGeometry args={[1.52, 0.06, 0.36]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Left Winglet */}
        <mesh position={[-0.76, 0.08, 0]}>
          <boxGeometry args={[0.04, 0.16, 0.36]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Right Winglet */}
        <mesh position={[0.76, 0.08, 0]}>
          <boxGeometry args={[0.04, 0.16, 0.36]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Racing Center Stripes */}
      <mesh position={[0, 0.42, 0.1]} receiveShadow>
        <boxGeometry args={[0.26, 0.16, 1.68]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>

      {/* ===== 3. DETAILED COCKPIT & DRIVER ===== */}
      {/* Deep Cockpit Bucket Seat */}
      <mesh position={[0, 0.34, -0.2]} castShadow>
        <boxGeometry args={[0.62, 0.18, 0.72]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Digital Dashboard Binnacle */}
      <group position={[0, 0.52, 0.28]} rotation={[-0.35, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.14, 0.16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Glowing LCD Screen */}
        <mesh position={[0, 0.01, 0.08]}>
          <planeGeometry args={[0.34, 0.09]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        {/* RPM Tachometer LEDs */}
        <mesh position={[0, 0.06, 0.08]}>
          <planeGeometry args={[0.32, 0.02]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      {/* F1-Style Butterfly Steering Wheel */}
      <group ref={steeringWheelRef} position={[0, 0.52, 0.14]} rotation={[-0.45, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.13, 0.025, 8, 16, Math.PI * 1.4]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
        {/* Center Horn / Emblem */}
        <mesh>
          <circleGeometry args={[0.04, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>
      </group>

      {/* Dual Aerodynamic Rearview Mirrors */}
      <group position={[-0.48, 0.54, 0.2]}>
        <mesh rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.14, 0.08, 0.06]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.01, 0, 0.035]} rotation={[0, 0.2, 0]}>
          <planeGeometry args={[0.12, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>
      <group position={[0.48, 0.54, 0.2]}>
        <mesh rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.14, 0.08, 0.06]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.01, 0, 0.035]} rotation={[0, -0.2, 0]}>
          <planeGeometry args={[0.12, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>

      {/* Driver Avatar (Torso, Harness, Helmet, Visor) */}
      <group position={[0, 0.74, -0.25]}>
        {/* Driver Body / Suit */}
        <mesh position={[0, -0.22, 0.05]} castShadow>
          <boxGeometry args={[0.48, 0.32, 0.32]} />
          <meshStandardMaterial color={driverColor} roughness={0.5} />
        </mesh>
        {/* Racing Harness Belts */}
        <mesh position={[-0.1, -0.2, 0.22]}>
          <boxGeometry args={[0.06, 0.32, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.1, -0.2, 0.22]}>
          <boxGeometry args={[0.06, 0.32, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Detailed Helmet */}
        <mesh castShadow>
          <sphereGeometry args={[0.29, 24, 24]} />
          <meshStandardMaterial color={driverColor} roughness={0.15} metalness={0.25} />
        </mesh>
        {/* Top Aero Fin on Helmet */}
        <mesh position={[0, 0.22, -0.06]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.22]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Iridescent Mirror Visor */}
        <mesh position={[0, 0.02, 0.19]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.34, 0.14, 0.2]} />
          <meshStandardMaterial
            color="#38bdf8"
            metalness={0.98}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* Overhead Engine Induction Scoop */}
      <mesh position={[0, 0.98, -0.42]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.18, 0.45]} />
        <meshStandardMaterial color="#09090b" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Scoop Air Mouth */}
      <mesh position={[0, 0.98, -0.19]} rotation={[-0.2, 0, 0]}>
        <circleGeometry args={[0.09, 12]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* ===== 4. MID-REAR ENGINE BLOCK & EXHAUSTS ===== */}
      {/* V-Twin Cylinder Heads */}
      <group position={[0, 0.44, -0.72]}>
        {/* Engine Block Core */}
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.32, 0.42]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Chrome Valve Covers */}
        <mesh position={[-0.24, 0.16, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.09, 0.09, 0.36, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0.24, 0.16, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.09, 0.09, 0.36, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Twin Polished Titanium Exhausts */}
      <group position={[-0.28, 0.32, -1.02]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.42, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Heat-Blued Tip */}
        <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.08, 16]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      <group position={[0.28, 0.32, -1.02]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.42, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Heat-Blued Tip */}
        <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.08, 16]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear Full-Width LED Taillight Strip */}
      <mesh position={[0, 0.46, -0.98]}>
        <boxGeometry args={[0.96, 0.05, 0.06]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>

      {/* Dual Exhaust Nitro Boost Flames */}
      <mesh ref={flameLeftRef} position={[-0.28, 0.32, -1.36]} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.14, 0.7, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh ref={flameRightRef} position={[0.28, 0.32, -1.36]} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.14, 0.7, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* ===== 5. HIGH-DOWNFORCE REAR WING ===== */}
      <group position={[0, 0.72, -1.1]}>
        {/* Wing Mounting Pylons (Carbon Fiber) */}
        <mesh position={[-0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.48, 0.16]} />
          <meshStandardMaterial color="#09090b" metalness={0.8} />
        </mesh>
        <mesh position={[0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.48, 0.16]} />
          <meshStandardMaterial color="#09090b" metalness={0.8} />
        </mesh>
        {/* Main Aerofoil Blade */}
        <mesh ref={spoilerMeshRef} position={[0, 0.25, 0]} rotation={[-0.06, 0, 0]} castShadow>
          <boxGeometry args={[1.56, 0.06, 0.38]} />
          <meshStandardMaterial color={kartColor} roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Wing Left Endplate */}
        <mesh position={[-0.78, 0.25, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.42]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Wing Right Endplate */}
        <mesh position={[0.78, 0.25, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.42]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* ===== 6. FOUR HIGH-DETAIL WHEELS WITH DISCS & CALIPERS ===== */}
      {/* Front Left Wheel */}
      <group ref={frontLeftSteerRef} position={[-0.82, 0.30, 0.82]}>
        <group ref={frontLeftRollRef}>
          <DetailedWheelMesh />
        </group>
      </group>

      {/* Front Right Wheel */}
      <group ref={frontRightSteerRef} position={[0.82, 0.30, 0.82]}>
        <group ref={frontRightRollRef}>
          <DetailedWheelMesh isRight />
        </group>
      </group>

      {/* Rear Left Wheel (Wider Stance & Slicks) */}
      <group position={[-0.86, 0.32, -0.75]} scale={[1.15, 1.15, 1.15]}>
        <group ref={rearLeftRollRef}>
          <DetailedWheelMesh />
        </group>
      </group>

      {/* Rear Right Wheel (Wider Stance & Slicks) */}
      <group position={[0.86, 0.32, -0.75]} scale={[1.15, 1.15, 1.15]}>
        <group ref={rearRightRollRef}>
          <DetailedWheelMesh isRight />
        </group>
      </group>

      {/* Drift Tire Spark Particle Meshes */}
      <mesh ref={sparkLeftRef} position={[-0.88, 0.2, -0.8]} visible={false}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh ref={sparkRightRef} position={[0.88, 0.2, -0.8]} visible={false}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

// High-Detail Arcade Wheel: Beveled Tire, 5-Spoke Alloy Rim, Cross-Drilled Rotor & Red Caliper
function DetailedWheelMesh({ isRight }: { isRight?: boolean }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Rubber Tire Main Tread */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.28, 24]} />
        <meshStandardMaterial color="#18181b" roughness={0.85} />
      </mesh>
      {/* Outer Tire Sidewall Bevel */}
      <mesh position={[0, isRight ? 0.14 : -0.14, 0]}>
        <cylinderGeometry args={[0.27, 0.3, 0.04, 24]} />
        <meshStandardMaterial color="#27272a" roughness={0.9} />
      </mesh>

      {/* Deep-Dish Alloy Wheel Rim Barrel */}
      <mesh>
        <cylinderGeometry args={[0.21, 0.21, 0.29, 20]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Cross-Drilled Steel Brake Disc Rotor */}
      <mesh position={[0, isRight ? -0.06 : 0.06, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 20]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Red Brembo Racing Brake Caliper */}
      <mesh position={[0.13, isRight ? -0.06 : 0.06, 0]}>
        <boxGeometry args={[0.07, 0.04, 0.12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* 5-Spoke Star Rim Face */}
      <group position={[0, isRight ? 0.145 : -0.145, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
            <boxGeometry args={[0.045, 0.025, 0.18]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}
        {/* Golden Central Lug Nut / Hub Cap */}
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
