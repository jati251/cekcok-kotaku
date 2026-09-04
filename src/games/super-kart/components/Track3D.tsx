import { useMemo } from 'react';
import * as THREE from 'three';
import {
  TRACK_WIDTH,
  type TrackDefinition,
  type BoostPadData,
} from '../engine/trackData';

interface Track3DProps {
  spline: THREE.CatmullRomCurve3;
  trackDef: TrackDefinition;
}

export const BARRIER_COLLIDERS: { position: [number, number, number]; radius: number }[] = [];

// Procedural high-detail asphalt road texture with painted centerline & edge lines
function generateAsphaltTexture(isNight = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Asphalt base with grain
  ctx.fillStyle = isNight ? '#0b1120' : '#1e293b';
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle asphalt speckles
  ctx.fillStyle = isNight ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 1024;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Left & Right white boundary lines
  ctx.fillStyle = isNight ? '#38bdf8' : '#ffffff';
  ctx.fillRect(16, 0, 10, 1024);
  ctx.fillRect(486, 0, 10, 1024);

  // Dashed centerline
  ctx.fillStyle = isNight ? '#06b6d4' : '#f8fafc';
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(250, y + 20, 12, 80);
  }

  // Tire rubber skid marks
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(120, 0, 45, 1024);
  ctx.fillRect(350, 0, 45, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.needsUpdate = true;
  return texture;
}

// Procedural alternating two-tone curb texture
function generateCurbTexture(colorA: string, colorB: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  for (let y = 0; y < 256; y += 64) {
    ctx.fillStyle = colorA;
    ctx.fillRect(0, y, 128, 32);
    ctx.fillStyle = colorB;
    ctx.fillRect(0, y + 32, 128, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 60);
  texture.needsUpdate = true;
  return texture;
}

export function Track3D({ spline, trackDef }: Track3DProps) {
  const isNight = trackDef.theme === 'night';

  const roadTexture = useMemo(() => generateAsphaltTexture(isNight), [isNight]);
  const curbTexture = useMemo(
    () => generateCurbTexture(trackDef.curbColorA, trackDef.curbColorB),
    [trackDef.curbColorA, trackDef.curbColorB]
  );

  // Generate asphalt road geometry & curbs along the Catmull-Rom spline
  const { roadGeometry, leftCurbGeometry, rightCurbGeometry } = useMemo(() => {
    const segments = 240;
    const roadVertices: number[] = [];
    const roadIndices: number[] = [];
    const roadUvs: number[] = [];

    const leftCurbVertices: number[] = [];
    const leftCurbIndices: number[] = [];
    const rightCurbVertices: number[] = [];
    const rightCurbIndices: number[] = [];

    const halfWidth = TRACK_WIDTH / 2;
    const curbWidth = 1.8;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Road surface at Y = 0.05
      const leftPos = point.clone().addScaledVector(right, -halfWidth);
      const rightPos = point.clone().addScaledVector(right, halfWidth);

      roadVertices.push(leftPos.x, 0.05, leftPos.z);
      roadVertices.push(rightPos.x, 0.05, rightPos.z);

      roadUvs.push(0, t);
      roadUvs.push(1, t);

      // Left curb
      const curbLeftOuter = point.clone().addScaledVector(right, -(halfWidth + curbWidth));
      leftCurbVertices.push(curbLeftOuter.x, 0.14, curbLeftOuter.z);
      leftCurbVertices.push(leftPos.x, 0.08, leftPos.z);

      // Right curb
      const curbRightOuter = point.clone().addScaledVector(right, halfWidth + curbWidth);
      rightCurbVertices.push(rightPos.x, 0.08, rightPos.z);
      rightCurbVertices.push(curbRightOuter.x, 0.14, curbRightOuter.z);

      if (i < segments) {
        const base = i * 2;
        // Road quad
        roadIndices.push(base, base + 1, base + 2);
        roadIndices.push(base + 1, base + 3, base + 2);

        // Curb quads
        leftCurbIndices.push(base, base + 1, base + 2);
        leftCurbIndices.push(base + 1, base + 3, base + 2);

        rightCurbIndices.push(base, base + 1, base + 2);
        rightCurbIndices.push(base + 1, base + 3, base + 2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const leftCurbGeo = new THREE.BufferGeometry();
    leftCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftCurbVertices, 3));
    leftCurbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    leftCurbGeo.setIndex(leftCurbIndices);
    leftCurbGeo.computeVertexNormals();

    const rightCurbGeo = new THREE.BufferGeometry();
    rightCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightCurbVertices, 3));
    rightCurbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    rightCurbGeo.setIndex(rightCurbIndices);
    rightCurbGeo.computeVertexNormals();

    return {
      roadGeometry: roadGeo,
      leftCurbGeometry: leftCurbGeo,
      rightCurbGeometry: rightCurbGeo,
    };
  }, [spline]);

  // Scenery: Grandstands, Billboards, Trees, Barriers
  const { trees, cornerBarriers, billboards } = useMemo(() => {
    const treesList: [number, number, number, number][] = [];
    const barriersList: [number, number, number, number][] = [];
    const boardsList: { pos: [number, number, number]; rotY: number; text: string; color: string }[] = [];

    BARRIER_COLLIDERS.length = 0;

    // Outer trees
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) + (Math.random() - 0.5) * 0.05;
      const pt = spline.getPointAt((t + 1) % 1);
      const tangent = spline.getTangentAt((t + 1) % 1).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = 16 + Math.random() * 30;
      const side = i % 2 === 0 ? 1 : -1;
      const treePos = pt.clone().addScaledVector(right, side * dist);
      treesList.push([treePos.x, 0, treePos.z, 0.85 + Math.random() * 0.45]);
    }

    // Corner barriers
    const cornerT = [0.14, 0.22, 0.42, 0.52, 0.68, 0.76, 0.88];
    for (const t of cornerT) {
      const pt = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const bPos = pt.clone().addScaledVector(right, TRACK_WIDTH / 2 + 1.8);
      const rotY = Math.atan2(tangent.x, tangent.z);
      barriersList.push([bPos.x, 0.4, bPos.z, rotY]);
      BARRIER_COLLIDERS.push({ position: [bPos.x, 0.4, bPos.z], radius: 2.8 });
    }

    // Sponsor Corner Billboards
    const boardConfigs = [
      { t: 0.18, text: '🍄 MUSHROOM TURBO', color: '#ef4444' },
      { t: 0.46, text: '⭐ SUPER STAR 64', color: '#f59e0b' },
      { t: 0.72, text: '⚡ HYPER NITRO GP', color: '#06b6d4' },
      { t: 0.84, text: '🍌 BANANA POWER', color: '#10b981' },
    ];

    boardConfigs.forEach((cfg) => {
      const pt = spline.getPointAt(cfg.t);
      const tangent = spline.getTangentAt(cfg.t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const bPos = pt.clone().addScaledVector(right, TRACK_WIDTH / 2 + 6);
      const rotY = Math.atan2(tangent.x, tangent.z);
      boardsList.push({ pos: [bPos.x, 2.5, bPos.z], rotY, text: cfg.text, color: cfg.color });
    });

    return { trees: treesList, cornerBarriers: barriersList, billboards: boardsList };
  }, [spline]);

  return (
    <group>
      {/* 1. Ground Plane (Clean solid terrain, 0 bubbles) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial
          color={trackDef.groundColor}
          roughness={0.9}
          metalness={isNight ? 0.3 : 0.05}
        />
      </mesh>

      {/* 2. Textured Asphalt Roadway */}
      <mesh geometry={roadGeometry} receiveShadow>
        <meshStandardMaterial
          map={roadTexture}
          roughness={0.65}
          metalness={isNight ? 0.4 : 0.15}
        />
      </mesh>

      {/* 3. Alternating Striped Curbs */}
      <mesh geometry={leftCurbGeometry} receiveShadow>
        <meshStandardMaterial map={curbTexture} roughness={0.35} />
      </mesh>
      <mesh geometry={rightCurbGeometry} receiveShadow>
        <meshStandardMaterial map={curbTexture} roughness={0.35} />
      </mesh>

      {/* 4. High-Detail Start / Finish Gantry Arch */}
      <group position={[0, 0, 0]}>
        {/* Left Truss Tower */}
        <mesh position={[-TRACK_WIDTH / 2 - 1.8, 3.8, 0]} castShadow>
          <boxGeometry args={[1.2, 7.6, 1.2]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Right Truss Tower */}
        <mesh position={[TRACK_WIDTH / 2 + 1.8, 3.8, 0]} castShadow>
          <boxGeometry args={[1.2, 7.6, 1.2]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Overhead Gantry Bridge */}
        <mesh position={[0, 7.2, 0]} castShadow>
          <boxGeometry args={[TRACK_WIDTH + 4.8, 1.6, 1.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} />
        </mesh>
        {/* Digital LED Race Display */}
        <mesh position={[0, 7.2, 0.72]}>
          <boxGeometry args={[TRACK_WIDTH - 2, 1.1, 0.08]} />
          <meshStandardMaterial
            color="#09090b"
            emissive={isNight ? '#06b6d4' : '#ef4444'}
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Checkered Start Line Stripe on Road */}
        <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[TRACK_WIDTH, 3.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} />
        </mesh>

        {/* 4 Starting Grid Slot Boxes */}
        {[-4.5, 4.5].map((x, col) =>
          [5, 12].map((z, row) => (
            <group key={`${col}-${row}`} position={[x, 0.07, z]}>
              {/* Box Outline */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.8, 4.2]} />
                <meshStandardMaterial
                  color="#ffffff"
                  wireframe
                  roughness={0.2}
                />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* 5. Spectator Grandstand (Alongside Start/Finish straightaway) */}
      <group position={[-TRACK_WIDTH / 2 - 14, 0, 30]}>
        {/* Tiered Seating Steps */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 3, 36]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[-2, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 2.5, 36]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        {/* Canopy Roof */}
        <mesh position={[-1, 6.8, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[15, 0.4, 38]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Support Pillars */}
        {[-15, 0, 15].map((z, i) => (
          <mesh key={i} position={[4, 3.4, z]}>
            <cylinderGeometry args={[0.15, 0.15, 6.8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        ))}
        {/* Grandstand Header Banner */}
        <mesh position={[4.2, 5.8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[34, 1.2, 0.1]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>

      {/* 6. Sponsor Billboards along Corner Apexes */}
      {billboards.map((b, idx) => (
        <group key={idx} position={b.pos} rotation={[0, b.rotY + Math.PI / 2, 0]}>
          {/* Billboard Board Face */}
          <mesh castShadow>
            <boxGeometry args={[10, 3.2, 0.3]} />
            <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.25} />
          </mesh>
          {/* Dual Ground Poles */}
          <mesh position={[-3.8, -2.5, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 5]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[3.8, -2.5, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 5]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 7. Corner Tire Barrier Walls */}
      {cornerBarriers.map((bar, idx) => (
        <group key={idx} position={[bar[0], bar[1], bar[2]]} rotation={[0, bar[3], 0]}>
          {/* Crash Wall with Yellow/Black stripes */}
          <mesh castShadow>
            <boxGeometry args={[5.2, 0.8, 0.9]} />
            <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Stacked Tires in front of wall */}
          {[-1.6, 0, 1.6].map((tx, ti) => (
            <mesh key={ti} position={[tx, 0, 0.6]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.3, 14]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 8. Scenery Trees (Multi-Tier Pine Trees) */}
      {!isNight &&
        trees.map((t, idx) => (
          <group key={idx} position={[t[0], 0, t[1]]} scale={[t[3], t[3], t[3]]}>
            {/* Trunk */}
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.35, 0.55, 2.4, 6]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
            {/* Foliage Cones */}
            <mesh position={[0, 3.2, 0]}>
              <coneGeometry args={[2.5, 3.2, 7]} />
              <meshStandardMaterial color="#15803d" roughness={0.8} />
            </mesh>
            <mesh position={[0, 5.0, 0]}>
              <coneGeometry args={[1.9, 2.6, 7]} />
              <meshStandardMaterial color="#16a34a" roughness={0.8} />
            </mesh>
          </group>
        ))}

      {/* 9. Animated Chevron Boost Pads */}
      {trackDef.boostPads.map((pad: BoostPadData, idx: number) => (
        <group key={idx} position={pad.position} rotation={[0, pad.rotationY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[14, 5]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#38bdf8"
              emissiveIntensity={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Glowing Chevron Arrow Decals */}
          {[-1.2, 0, 1.2].map((offZ, ai) => (
            <mesh key={ai} position={[0, 0.06, offZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[1.2, 2.2, 3]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
