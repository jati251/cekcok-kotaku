import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface OceanWaterProps {
  size?: number;
  segments?: number;
}

const oceanVertexShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  struct GerstnerWave {
    vec2 direction;
    float steepness;
    float wavelength;
    float speed;
  };

  void main() {
    // 4 Gerstner Waves matching CPU waveMath.ts
    GerstnerWave waves[4];
    waves[0] = GerstnerWave(normalize(vec2(1.0, 0.3)), 0.35, 48.0, 3.2);
    waves[1] = GerstnerWave(normalize(vec2(0.7, 0.7)), 0.25, 26.0, 2.6);
    waves[2] = GerstnerWave(normalize(vec2(-0.2, 0.98)), 0.2, 14.0, 2.0);
    waves[3] = GerstnerWave(normalize(vec2(-0.8, -0.6)), 0.15, 7.0, 1.5);

    vec3 displaced = position;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);

    float pi = 3.14159265359;

    for (int i = 0; i < 4; i++) {
      float k = 2.0 * pi / waves[i].wavelength;
      float c = waves[i].speed;
      float a = waves[i].steepness / k;
      vec2 d = waves[i].direction;

      float dotPos = dot(d, position.xz);
      float phase = k * (dotPos - c * uTime);

      float cosP = cos(phase);
      float sinP = sin(phase);

      displaced.x += d.x * (a * cosP);
      displaced.y += a * sinP;
      displaced.z += d.y * (a * cosP);

      tangent.y += d.x * (k * a * cosP);
      binormal.y += d.y * (k * a * cosP);
    }

    vec3 calculatedNormal = normalize(cross(binormal, tangent));
    vNormal = normalize(mat3(modelMatrix) * calculatedNormal);

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    vWaveHeight = displaced.y;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const oceanFragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uSkyColor;
  uniform float uTime;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Fresnel reflectance factor (Schlick's approximation)
    float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0);
    fresnel = clamp(fresnel, 0.02, 0.85);

    // Water depth color blend based on wave crest height
    float heightMix = smoothstep(-1.2, 1.8, vWaveHeight);
    vec3 waterColor = mix(uDeepColor, uShallowColor, heightMix);

    // Sun Specular Highlight
    vec3 lightDir = normalize(uSunDirection);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(0.0, dot(normal, halfVec)), 128.0);
    vec3 specular = uSunColor * spec * 2.2;

    // Foam on sharp wave crests
    float foamFactor = smoothstep(1.3, 2.2, vWaveHeight);
    // Add micro-noise texture pattern to foam
    float foamNoise = sin(vWorldPosition.x * 2.5 + uTime * 2.0) * cos(vWorldPosition.z * 2.5 - uTime);
    foamFactor = clamp(foamFactor + foamNoise * 0.15, 0.0, 1.0);

    // Combine diffuse water, sky reflection, foam, and sun specular
    vec3 finalColor = mix(waterColor, uSkyColor, fresnel * 0.6);
    finalColor = mix(finalColor, uFoamColor, foamFactor * 0.7);
    finalColor += specular;

    // Subsurface scattering hint
    float sss = pow(max(0.0, dot(viewDir, -lightDir)), 3.0) * max(0.0, vWaveHeight + 0.5);
    finalColor += vec3(0.0, 0.25, 0.28) * sss * 0.4;

    gl_FragColor = vec4(finalColor, 0.92);
  }
`;

export const OceanWater: React.FC<OceanWaterProps> = ({ size = 900, segments = 160 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color('#03224c') }, // Deep Caribbean Navy
      uShallowColor: { value: new THREE.Color('#0284c7') }, // Vibrant Azure
      uFoamColor: { value: new THREE.Color('#ffffff') }, // White Sea Foam
      uSunDirection: { value: new THREE.Vector3(0.6, 0.7, 0.4).normalize() },
      uSunColor: { value: new THREE.Color('#fef08a') }, // Golden Caribbean sun
      uSkyColor: { value: new THREE.Color('#38bdf8') }, // Sky reflection
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
    // Reposition ocean mesh horizontally around camera so the horizon feels endless
    if (meshRef.current) {
      meshRef.current.position.x = state.camera.position.x;
      meshRef.current.position.z = state.camera.position.z;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[size, size, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite
      />
    </mesh>
  );
};
