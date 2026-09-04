import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import RubikCube from './RubikCube';
import type { RubikCubeHandle } from './RubikCube';
import type { CubeTheme } from './types';

interface CubeSceneProps {
  cubeRef: React.RefObject<RubikCubeHandle | null>;
  theme?: CubeTheme;
}

export function CubeScene({ cubeRef, theme = 'competition' }: CubeSceneProps) {
  const isCyber = theme === 'cyberpunk';

  return (
    <Canvas
      shadows
      camera={{ position: [4.5, 3.5, 4.5], fov: 35 }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmic
        toneMappingExposure: isCyber ? 1.4 : 1.2,
      }}
      style={{
        background: isCyber
          ? 'radial-gradient(ellipse at center, #0b132b 0%, #060913 60%, #020307 100%)'
          : 'radial-gradient(ellipse at center, #111827 0%, #090d16 60%, #030712 100%)',
      }}
    >
      {/* Lighting Setup */}
      <ambientLight intensity={isCyber ? 0.6 : 0.45} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-5, 6, -4]}
        intensity={0.7}
        color={isCyber ? '#38bdf8' : '#8888ff'}
      />
      <directionalLight
        position={[0, -3, 6]}
        intensity={0.4}
        color={isCyber ? '#f43f5e' : '#ff8844'}
      />

      {/* Cyber Rim Light */}
      <directionalLight
        position={[-4, 0, 5]}
        intensity={0.5}
        color={isCyber ? '#a855f7' : '#4466ff'}
      />

      {/* Speedcube with gentle float dynamics */}
      <Float speed={1.4} rotationIntensity={0.04} floatIntensity={0.12}>
        <RubikCube ref={cubeRef} theme={theme} />
      </Float>

      {/* Contact Floor Shadow */}
      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.65}
        scale={8.5}
        blur={2.8}
        far={4}
        resolution={512}
      />

      {/* Floor Ground Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.25, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color={isCyber ? '#030712' : '#080d1a'}
          transparent
          opacity={0.45}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Precision Orbit Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={9.5}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
      />
    </Canvas>
  );
}

export default CubeScene;
