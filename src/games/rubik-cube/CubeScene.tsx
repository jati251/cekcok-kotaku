import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Float } from '@react-three/drei'
import RubikCube from './RubikCube'
import type { RubikCubeHandle } from './RubikCube'

interface CubeSceneProps {
  cubeRef: React.RefObject<RubikCubeHandle | null>
}

function CubeScene({ cubeRef }: CubeSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [4.5, 3.5, 4.5], fov: 35 }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmic
        toneMappingExposure: 1.2,
      }}
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0d0d1a 50%, #050510 100%)',
      }}
    >
      {/* ── Lighting ── */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-4, 6, -3]}
        intensity={0.6}
        color="#8888ff"
      />
      <directionalLight
        position={[0, -2, 6]}
        intensity={0.3}
        color="#ff8844"
      />

      {/* Subtle rim light */}
      <directionalLight
        position={[-3, 0, 5]}
        intensity={0.4}
        color="#4466ff"
      />

      {/* ── Cube with subtle float animation ── */}
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
        <RubikCube ref={cubeRef} />
      </Float>

      {/* ── Ground shadow ── */}
      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.6}
        scale={8}
        blur={3}
        far={4}
        resolution={512}
      />

      {/* ── Floor grid for depth reference ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.25, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial
          color="#0a0a1a"
          transparent
          opacity={0.4}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* ── Controls ── */}
      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={10}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
      />
    </Canvas>
  )
}

export default CubeScene
