import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type CloudType = 'cumulus' | 'wide' | 'puffy';

// Procedurally generate authentic cartoon cloud textures with cel-shaded undersides
function generateCartoonCloudTexture(type: CloudType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 256);

  interface CloudLobe {
    x: number;
    y: number;
    r: number;
  }

  let lobes: CloudLobe[] = [];
  let baseRect = { x: 100, y: 140, w: 312, h: 46, r: 22 };

  if (type === 'cumulus') {
    // Classic 5-dome Mario Kart cumulus cloud
    lobes = [
      { x: 256, y: 106, r: 76 }, // Center high dome
      { x: 184, y: 130, r: 58 }, // Left mid dome
      { x: 328, y: 130, r: 58 }, // Right mid dome
      { x: 122, y: 154, r: 44 }, // Far-left flank
      { x: 390, y: 154, r: 44 }, // Far-right flank
    ];
    baseRect = { x: 100, y: 142, w: 312, h: 48, r: 24 };
  } else if (type === 'wide') {
    // Wide horizontal drifting cloud
    lobes = [
      { x: 210, y: 124, r: 56 },
      { x: 290, y: 114, r: 64 },
      { x: 370, y: 128, r: 52 },
      { x: 138, y: 146, r: 44 },
      { x: 436, y: 150, r: 40 },
      { x: 84, y: 160, r: 34 },
    ];
    baseRect = { x: 70, y: 148, w: 376, h: 44, r: 22 };
  } else {
    // Cute 3-dome compact puff
    lobes = [
      { x: 256, y: 120, r: 68 },
      { x: 196, y: 142, r: 50 },
      { x: 316, y: 142, r: 50 },
      { x: 148, y: 160, r: 36 },
      { x: 364, y: 160, r: 36 },
    ];
    baseRect = { x: 132, y: 152, w: 248, h: 42, r: 20 };
  }

  // Helper to draw the unified cloud silhouette path
  const drawCloudPath = (offsetY: number = 0) => {
    ctx.beginPath();
    // Draw flat/rounded bottom pill base
    const { x, y, w, h, r } = baseRect;
    ctx.roundRect(x, y + offsetY, w, h, [0, 0, r, r]);

    // Add overlapping puffy top lobes
    lobes.forEach((lobe) => {
      ctx.moveTo(lobe.x + lobe.r, lobe.y + offsetY);
      ctx.arc(lobe.x, lobe.y + offsetY, lobe.r, 0, Math.PI * 2);
    });
  };

  // Step 1: Draw the bottom shadow layer (soft sky-blue cel shade for cartoon depth)
  ctx.fillStyle = '#bae6fd'; // Light sky blue
  drawCloudPath(10); // Offset downwards by 10px to form the underside shadow band
  ctx.fill();

  // Step 2: Draw the main pure white cloud body
  ctx.fillStyle = '#ffffff';
  drawCloudPath(0);
  ctx.fill();

  // Step 3: Draw soft bright white puffy highlights on top edges
  lobes.forEach((lobe) => {
    const highlightGrad = ctx.createRadialGradient(
      lobe.x - lobe.r * 0.25,
      lobe.y - lobe.r * 0.35,
      lobe.r * 0.1,
      lobe.x,
      lobe.y,
      lobe.r
    );
    highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    highlightGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = highlightGrad;
    ctx.beginPath();
    ctx.arc(lobe.x, lobe.y, lobe.r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function Clouds3D({ isNight = false }: { isNight?: boolean }) {
  const cloudsRef = useRef<THREE.Group>(null);
  const balloonRef = useRef<THREE.Group>(null);

  // Generate 3 cartoon cloud textures
  const [cumulusTex, wideTex, puffyTex] = useMemo(() => {
    return [
      generateCartoonCloudTexture('cumulus'),
      generateCartoonCloudTexture('wide'),
      generateCartoonCloudTexture('puffy'),
    ];
  }, []);

  // 18 High-altitude cartoon clouds placed panoramically around the horizon
  const cloudData = useMemo(() => {
    const list: {
      x: number;
      y: number;
      z: number;
      width: number;
      height: number;
      speed: number;
      opacity: number;
      texture: THREE.CanvasTexture;
    }[] = [];

    const textures = [cumulusTex, wideTex, puffyTex];

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const dist = 240 + Math.random() * 200; // Far in the background sky
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = 85 + Math.random() * 65; // High sky altitude (85m - 150m)

      const typeIndex = i % 3;
      const baseWidth = typeIndex === 1 ? 120 : typeIndex === 0 ? 95 : 75;
      const width = baseWidth * (0.85 + Math.random() * 0.4);
      const height = width * 0.5;
      const speed = 1.2 + Math.random() * 1.5;
      const opacity = isNight ? 0.45 : (0.9 + Math.random() * 0.1);

      list.push({
        x,
        y,
        z,
        width,
        height,
        speed,
        opacity,
        texture: textures[typeIndex],
      });
    }

    return list;
  }, [cumulusTex, wideTex, puffyTex, isNight]);

  // Panoramic Sky Dome vertical gradient (Day vs Night)
  const skyDomeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      if (isNight) {
        grad.addColorStop(0, '#020617'); // Cosmic Deep Black
        grad.addColorStop(0.35, '#0f172a'); // Space Navy
        grad.addColorStop(0.7, '#1e1b4b'); // Cyber Indigo
        grad.addColorStop(1, '#312e81'); // Horizon Neon Twilight
      } else {
        grad.addColorStop(0, '#0284c7'); // Top Zenith
        grad.addColorStop(0.35, '#0ea5e9'); // Mid sky
        grad.addColorStop(0.7, '#38bdf8'); // Soft azure
        grad.addColorStop(1, '#bae6fd'); // Horizon
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [isNight]);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((sprite, idx) => {
        const c = cloudData[idx];
        if (c) {
          sprite.position.x += delta * c.speed;
          if (sprite.position.x > 450) {
            sprite.position.x = -450;
          }
        }
      });
    }

    // Slow bobbing and drifting for the Mario Kart hot-air balloon
    if (balloonRef.current) {
      balloonRef.current.position.x += delta * 0.8;
      balloonRef.current.position.y = 95 + Math.sin(Date.now() * 0.001) * 2.5;
      if (balloonRef.current.position.x > 400) {
        balloonRef.current.position.x = -400;
      }
    }
  });

  return (
    <>
      {/* 0. Panoramic Sky Dome: Deep gradient enveloping the world */}
      <mesh scale={[-1, 1, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[520, 32, 16]} />
        <meshBasicMaterial map={skyDomeTexture} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* 1. Clouds Group: Each cloud is a single unified billboard sprite that always faces the camera */}
      <group ref={cloudsRef}>
        {cloudData.map((c, idx) => (
          <sprite
            key={idx}
            position={[c.x, c.y, c.z]}
            scale={[c.width, c.height, 1]}
          >
            <spriteMaterial
              map={c.texture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              fog={false} // Prevents murky grey fog wash-out, keeping clouds vivid and bright in the sky
            />
          </sprite>
        ))}
      </group>

      {/* 2. Iconic Mario Kart Style Hot-Air Balloon Drifting in Sky */}
      <group ref={balloonRef} position={[-160, 95, 220]} scale={[1.4, 1.4, 1.4]}>
        {/* Balloon Body */}
        <mesh position={[0, 8, 0]}>
          <sphereGeometry args={[7, 16, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        {/* Yellow Stripe */}
        <mesh position={[0, 8, 0]} scale={[1.02, 0.35, 1.02]}>
          <sphereGeometry args={[7, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.4} />
        </mesh>
        {/* White Star Emblem Motif */}
        <mesh position={[0, 8, 7.1]}>
          <circleGeometry args={[1.8, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Basket */}
        <mesh position={[0, -2, 0]}>
          <cylinderGeometry args={[2, 1.6, 2, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Ropes */}
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 6, 4]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
      </group>
    </>
  );
}
