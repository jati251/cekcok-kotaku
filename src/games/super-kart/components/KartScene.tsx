import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { createTrackSpline, generateCheckpoints, TRACK_DEFINITIONS } from '../engine/trackData';
import {
  INITIAL_KART_STATE,
  updateKartPhysics,
  type KartInput,
  type KartPhysicsState,
} from '../engine/kartPhysics';
import { useKartStore, RACER_PROFILES } from '../stores/kartStore';
import {
  INITIAL_ITEM_BOXES,
  getRandomItem,
  type ItemBoxEntity,
  type HazardEntity,
  type ProjectileEntity,
} from '../engine/itemSystem';
import {
  INITIAL_AI_COMPETITORS,
  updateAIRacers,
  type AICompetitorState,
} from '../engine/aiRacers';
import { INITIAL_COINS, Coins3D, type CoinEntity } from './Coins3D';
import { Clouds3D } from './Clouds3D';
import { kartAudio } from '../engine/kartAudio';
import { KartModel } from './KartModel';
import { Track3D, BARRIER_COLLIDERS } from './Track3D';
import { ChaseCamera } from './ChaseCamera';
import { ItemBoxes3D } from './ItemBoxes3D';
import { Hazards3D } from './Hazards3D';
import { AIKart } from './AIKart';

// Sub-component to ensure AI Karts are moved via direct WebGL ref in useFrame
function AICompetitorKartItem({ ai }: { ai: AICompetitorState }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(ai.position.x, 0.06, ai.position.z);
      groupRef.current.rotation.y = ai.rotationY;
    }
  });

  return (
    <group ref={groupRef} position={[ai.position.x, 0.06, ai.position.z]}>
      <AIKart color={ai.color} kartColor={ai.kartColor} name={ai.name} />
    </group>
  );
}

function KartSimulation() {
  const {
    raceState,
    speedClass,
    selectedRacerId,
    selectedTrackId,
    updateTelemetry,
    recordCheckpoint,
    tickRaceTime,
    setItem,
    setRouletteSpinning,
    triggerItemUse,
    setAIRacers,
    setPlayerRank,
    addCoin,
    loseCoins,
    setTrickActive,
  } = useKartStore();

  const trackDef = useMemo(
    () => TRACK_DEFINITIONS[selectedTrackId] || TRACK_DEFINITIONS.hills,
    [selectedTrackId]
  );
  const trackSpline = useMemo(() => createTrackSpline(selectedTrackId), [selectedTrackId]);
  const checkpoints = useMemo(() => generateCheckpoints(trackSpline, 24), [trackSpline]);

  const physicsStateRef = useRef<KartPhysicsState>({ ...INITIAL_KART_STATE });
  const kartGroupRef = useRef<THREE.Group>(null);
  const nextCheckpointRef = useRef(1);
  const telemetryThrottleRef = useRef(0);

  // Entities state
  const itemBoxesRef = useRef<ItemBoxEntity[]>([...INITIAL_ITEM_BOXES]);
  const coinsRef = useRef<CoinEntity[]>([...INITIAL_COINS]);
  const hazardsRef = useRef<HazardEntity[]>([]);
  const projectilesRef = useRef<ProjectileEntity[]>([]);
  const aiCompetitorsRef = useRef<AICompetitorState[]>([...INITIAL_AI_COMPETITORS]);

  const [itemBoxes, setItemBoxes] = useState<ItemBoxEntity[]>(INITIAL_ITEM_BOXES);
  const [coins, setCoins] = useState<CoinEntity[]>(INITIAL_COINS);
  const [hazards, setHazards] = useState<HazardEntity[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileEntity[]>([]);

  const inputRef = useRef<KartInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false,
    respawn: false,
  });

  const racerProfile = useMemo(
    () => RACER_PROFILES.find((r) => r.id === selectedRacerId) || RACER_PROFILES[0],
    [selectedRacerId]
  );

  // Audio lifecycle (Engine & BGM)
  useEffect(() => {
    kartAudio.startEngine();
    return () => {
      kartAudio.stopEngine();
      kartAudio.stopBgm();
    };
  }, []);

  // BGM synchronization with race state
  useEffect(() => {
    if (raceState === 'racing') {
      kartAudio.startBgm();
    } else if (raceState === 'finished') {
      kartAudio.stopBgm();
    }
  }, [raceState]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          inputRef.current.forward = true;
          break;
        case 's':
        case 'arrowdown':
          inputRef.current.backward = true;
          break;
        case 'a':
        case 'arrowleft':
          inputRef.current.left = true;
          break;
        case 'd':
        case 'arrowright':
          inputRef.current.right = true;
          break;
        case ' ':
        case 'shift': {
          inputRef.current.drift = true;

          // In-air trick mechanic (press Space while airborne)
          const state = physicsStateRef.current;
          if (!state.isGrounded && Math.abs(state.speed) > 10) {
            kartAudio.playTrick();
            setTrickActive(true);
            state.boostActive = true;
            state.boostTimer = 1.4;
            state.boostMultiplier = 1.35;
            setTimeout(() => setTrickActive(false), 1200);
          }
          break;
        }
        case 'r':
          inputRef.current.respawn = true;
          break;
        case 'e':
        case 'enter':
        case 'q': {
          const item = triggerItemUse();
          if (!item) break;

          const state = physicsStateRef.current;
          if (item === 'mushroom') {
            state.boostActive = true;
            state.boostTimer = 2.2;
            state.speed = Math.max(state.speed, 38);
            kartAudio.playBoost();
          } else if (item === 'star') {
            state.starTimer = 5.5;
            state.speed = Math.max(state.speed, 42);
            kartAudio.playBoost();
          } else if (item === 'banana') {
            const dropPos = state.position
              .clone()
              .add(new THREE.Vector3(-Math.sin(state.rotationY) * 2.2, 0, -Math.cos(state.rotationY) * 2.2));
            const newHazard: HazardEntity = {
              id: `banana-${Date.now()}`,
              type: 'banana',
              position: dropPos,
              isActive: true,
            };
            hazardsRef.current.push(newHazard);
            setHazards([...hazardsRef.current]);
          } else if (item === 'green-shell') {
            const spawnPos = state.position
              .clone()
              .add(new THREE.Vector3(Math.sin(state.rotationY) * 2.4, 0, Math.cos(state.rotationY) * 2.4));
            const vel = new THREE.Vector3(
              Math.sin(state.rotationY) * 45,
              0,
              Math.cos(state.rotationY) * 45
            );
            const newProj: ProjectileEntity = {
              id: `green-${Date.now()}`,
              type: 'green-shell',
              position: spawnPos,
              velocity: vel,
              lifeTime: 8,
              isActive: true,
            };
            projectilesRef.current.push(newProj);
            setProjectiles([...projectilesRef.current]);
            kartAudio.playBoost();
          } else if (item === 'red-shell') {
            const spawnPos = state.position
              .clone()
              .add(new THREE.Vector3(Math.sin(state.rotationY) * 2.4, 0, Math.cos(state.rotationY) * 2.4));
            const newProj: ProjectileEntity = {
              id: `red-${Date.now()}`,
              type: 'red-shell',
              position: spawnPos,
              velocity: new THREE.Vector3(0, 0, 0),
              splineProgress: (nextCheckpointRef.current / checkpoints.length) % 1.0,
              lifeTime: 10,
              isActive: true,
            };
            projectilesRef.current.push(newProj);
            setProjectiles([...projectilesRef.current]);
            kartAudio.playBoost();
          }
          break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          inputRef.current.forward = false;
          break;
        case 's':
        case 'arrowdown':
          inputRef.current.backward = false;
          break;
        case 'a':
        case 'arrowleft':
          inputRef.current.left = false;
          break;
        case 'd':
        case 'arrowright':
          inputRef.current.right = false;
          break;
        case ' ':
        case 'shift':
          inputRef.current.drift = false;
          break;
        case 'r':
          inputRef.current.respawn = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [checkpoints.length, triggerItemUse, setTrickActive]);

  // Main 60 FPS Game Loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const state = physicsStateRef.current;

    tickRaceTime(dt);

    const activeInput: KartInput =
      raceState === 'racing'
        ? inputRef.current
        : { ...inputRef.current, forward: false, backward: false };

    const prevCP =
      checkpoints[(nextCheckpointRef.current - 1 + checkpoints.length) % checkpoints.length];

    const speedMult =
      (speedClass === '50cc' ? 0.8 : speedClass === '100cc' ? 1.0 : 1.22) *
      (racerProfile?.speedBonus || 1.0);

    // 1. Update Kart Physics
    updateKartPhysics(
      state,
      activeInput,
      dt,
      trackSpline,
      prevCP?.center,
      prevCP?.forward,
      speedMult
    );

    // 2. Jump Ramp Interaction (Ramp at [160, 0, -55])
    const rampDistSq = (state.position.x - 160) ** 2 + (state.position.z - -55) ** 2;
    if (rampDistSq < 16 && state.isGrounded && state.speed > 8) {
      state.verticalVelocity = 9.5; // High jump into the air!
      state.isGrounded = false;
      kartAudio.playBoost();
    }

    // 3. Collision: Player vs AI Opponents
    aiCompetitorsRef.current.forEach((ai) => {
      const dx = state.position.x - ai.position.x;
      const dz = state.position.z - ai.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDistance = 2.2;

      if (dist < minDistance && dist > 0.01) {
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = minDistance - dist;

        state.position.x += nx * overlap * 0.55;
        state.position.z += nz * overlap * 0.55;
        ai.position.x -= nx * overlap * 0.55;
        ai.position.z -= nz * overlap * 0.55;

        state.speed *= 0.85;
        kartAudio.playBump();
      }
    });

    // 4. Collision: Player vs Track Corner Barriers (Clean slide, no sticky reverse)
    BARRIER_COLLIDERS.forEach((barrier) => {
      const dx = state.position.x - barrier.position[0];
      const dz = state.position.z - barrier.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      const kartRadius = 1.1;
      const minDist = barrier.radius + kartRadius;

      if (dist < minDist && dist > 0.01) {
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = minDist - dist;

        // Push player smoothly outside the barrier
        state.position.x += nx * overlap * 1.05;
        state.position.z += nz * overlap * 1.05;

        // Glancing friction: retain forward momentum without jitter or reverse lockup!
        state.speed = Math.max(state.speed * 0.75, 0);
        kartAudio.playBump();
      }
    });

    // 5. Synchronize 3D Kart Group (Proper height Y = 0.06 to sit cleanly on asphalt)
    if (kartGroupRef.current) {
      kartGroupRef.current.position.set(state.position.x, 0.06 + state.verticalY - 0.06, state.position.z);
      kartGroupRef.current.rotation.y = state.rotationY;
    }

    // 6. Audio pitch update
    const speedKmh = Math.abs(state.speed) * 3.6;
    kartAudio.updateEnginePitch(speedKmh);

    if (state.isDrifting && state.driftLevel > 0 && Math.random() < 0.1) {
      kartAudio.playDriftScreech();
    }

    // 7. Checkpoint & Lap Progression
    const targetCP = checkpoints[nextCheckpointRef.current];
    if (targetCP) {
      const distSq =
        (state.position.x - targetCP.center.x) ** 2 +
        (state.position.z - targetCP.center.z) ** 2;

      if (distSq < targetCP.radius ** 2) {
        const hitIdx = targetCP.index;
        nextCheckpointRef.current = (hitIdx + 1) % checkpoints.length;
        recordCheckpoint(hitIdx, checkpoints.length);
      }
    }

    // 8. Gold Coin Pickups
    let coinsUpdated = false;
    coinsRef.current.forEach((coin) => {
      if (!coin.isActive) {
        coin.respawnTimer -= dt;
        if (coin.respawnTimer <= 0) {
          coin.isActive = true;
          coinsUpdated = true;
        }
      } else {
        const dSq = (state.position.x - coin.position[0]) ** 2 + (state.position.z - coin.position[2]) ** 2;
        if (dSq < 6.5) {
          coin.isActive = false;
          coin.respawnTimer = 10.0;
          coinsUpdated = true;
          addCoin();
          kartAudio.playCoin();
        }
      }
    });
    if (coinsUpdated) {
      setCoins([...coinsRef.current]);
    }

    // 9. Item Box Pickup Detection
    let boxesUpdated = false;
    itemBoxesRef.current.forEach((box) => {
      if (!box.isActive) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.isActive = true;
          boxesUpdated = true;
        }
      } else {
        const distSq =
          (state.position.x - box.position[0]) ** 2 +
          (state.position.z - box.position[2]) ** 2;
        if (distSq < 9) {
          box.isActive = false;
          box.respawnTimer = 6.0;
          boxesUpdated = true;
          kartAudio.playItemBoxChime();

          setRouletteSpinning(true);
          setTimeout(() => {
            const reward = getRandomItem();
            setItem(reward);
            setRouletteSpinning(false);
          }, 1500);
        }
      }
    });
    if (boxesUpdated) {
      setItemBoxes([...itemBoxesRef.current]);
    }

    // 10. Hazard Collisions (Bananas)
    let hazardsUpdated = false;
    hazardsRef.current.forEach((h) => {
      if (!h.isActive) return;

      const pDistSq = (state.position.x - h.position.x) ** 2 + (state.position.z - h.position.z) ** 2;
      if (pDistSq < 4.0) {
        h.isActive = false;
        hazardsUpdated = true;
        if (!state.hasStar) {
          state.spinoutTimer = 1.3;
          loseCoins(3);
          kartAudio.playSpinout();
        }
      }

      aiCompetitorsRef.current.forEach((ai) => {
        const aiDistSq = (ai.position.x - h.position.x) ** 2 + (ai.position.z - h.position.z) ** 2;
        if (aiDistSq < 4.0) {
          h.isActive = false;
          ai.spinoutTimer = 1.3;
          hazardsUpdated = true;
          kartAudio.playSpinout();
        }
      });
    });
    if (hazardsUpdated) {
      setHazards(hazardsRef.current.filter((h) => h.isActive));
    }

    // 11. Shell Projectiles Update
    let projsUpdated = false;
    projectilesRef.current.forEach((p) => {
      if (!p.isActive) return;

      p.lifeTime -= dt;
      if (p.lifeTime <= 0) {
        p.isActive = false;
        projsUpdated = true;
        return;
      }

      if (p.type === 'green-shell') {
        p.position.addScaledVector(p.velocity, dt);
      } else if (p.type === 'red-shell') {
        p.splineProgress = (p.splineProgress || 0) + dt * 0.08;
        if (p.splineProgress > 1.0) p.splineProgress -= 1.0;
        const pt = trackSpline.getPointAt(p.splineProgress);
        p.position.set(pt.x, 0.45, pt.z);
      }

      aiCompetitorsRef.current.forEach((ai) => {
        const dSq = (ai.position.x - p.position.x) ** 2 + (ai.position.z - p.position.z) ** 2;
        if (dSq < 6) {
          p.isActive = false;
          ai.spinoutTimer = 1.5;
          projsUpdated = true;
          kartAudio.playSpinout();
        }
      });

      const playerDistSq = (state.position.x - p.position.x) ** 2 + (state.position.z - p.position.z) ** 2;
      if (playerDistSq < 5 && p.lifeTime < 9.5) {
        p.isActive = false;
        projsUpdated = true;
        if (!state.hasStar) {
          state.spinoutTimer = 1.5;
          loseCoins(3);
          kartAudio.playSpinout();
        }
      }
    });
    if (projsUpdated) {
      setProjectiles(projectilesRef.current.filter((p) => p.isActive));
    }

    // 12. Update AI Competitors & Ranking
    const playerProgress = (nextCheckpointRef.current / checkpoints.length) % 1.0;
    const playerTotalProgress = (useKartStore.getState().currentLap - 1) + playerProgress;

    const { racersData, playerRank } = updateAIRacers(
      aiCompetitorsRef.current,
      trackSpline,
      dt,
      playerTotalProgress,
      raceState === 'racing'
    );

    // Throttle React Zustand Store updates to ~15 times/sec to eliminate React DOM stutter
    telemetryThrottleRef.current += dt;
    if (telemetryThrottleRef.current >= 0.066) {
      telemetryThrottleRef.current = 0;
      setAIRacers(racersData);
      setPlayerRank(playerRank);

      updateTelemetry({
        speedKmh,
        isDrifting: state.isDrifting,
        driftLevel: state.driftLevel,
        boostActive: state.boostActive,
        boostRemaining: state.boostTimer,
        isOffroad: state.isOffroad,
        isSpinningOut: state.isSpinningOut,
        hasStar: state.hasStar,
        pos: [state.position.x, state.position.y, state.position.z],
        angle: state.rotationY,
      });
    }
  });

  return (
    <>
      {/* 1. Sky & Atmospheric Fog */}
      <color
        attach="background"
        args={[trackDef.theme === 'night' ? '#090d16' : '#38bdf8']}
      />
      <fog attach="fog" args={[trackDef.fogColor, 140, 550]} />

      {/* 2. Dynamic Vibrant Lighting */}
      <hemisphereLight
        args={[
          trackDef.theme === 'night' ? '#38bdf8' : '#bae6fd',
          trackDef.theme === 'night' ? '#090d16' : '#166534',
          trackDef.theme === 'night' ? 0.65 : 0.85,
        ]}
      />
      <directionalLight
        position={[100, 140, 70]}
        intensity={trackDef.theme === 'night' ? 1.4 : 2.1}
        color={trackDef.theme === 'night' ? '#c084fc' : '#ffffff'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-130}
        shadow-camera-right={130}
        shadow-camera-top={130}
        shadow-camera-bottom={-130}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-80, 50, -80]}
        intensity={trackDef.theme === 'night' ? 0.8 : 0.5}
        color={trackDef.theme === 'night' ? '#38bdf8' : '#fef08a'}
      />

      {/* 3. High-Detail 3D Track */}
      <Track3D spline={trackSpline} trackDef={trackDef} />

      {/* 4. High-Altitude Panoramic Clouds & Sky Dome */}
      <Clouds3D isNight={trackDef.theme === 'night'} />

      {/* 5. Gold Coins */}
      <Coins3D coins={coins} />

      {/* 6. Jump Ramp on Back Straightaway */}
      <group position={[160, 0.4, -55]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.4, 0]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[14, 0.4, 6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, -2.5]}>
          <boxGeometry args={[14, 0.1, 0.4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 7. 3D Item Boxes */}
      <ItemBoxes3D itemBoxes={itemBoxes} />

      {/* 8. 3D Hazards & Projectiles */}
      <Hazards3D hazards={hazards} projectiles={projectiles} />

      {/* 9. 3D AI Competitor Karts */}
      {aiCompetitorsRef.current.map((ai) => (
        <AICompetitorKartItem key={ai.id} ai={ai} />
      ))}

      {/* 10. 3D Player Kart Racer */}
      <group ref={kartGroupRef} position={[0, 0.06, 5]} rotation={[0, 0, 0]}>
        <KartModel
          physicsStateRef={physicsStateRef}
          steeringInput={inputRef.current.left ? 1 : inputRef.current.right ? -1 : 0}
          kartColor={racerProfile.kartColor}
          driverColor={racerProfile.color}
        />
      </group>

      {/* 11. Smooth Follow Camera */}
      <ChaseCamera physicsStateRef={physicsStateRef} />
    </>
  );
}

export function KartScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3, -1], fov: 58, near: 0.1, far: 1000 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        background: '#38bdf8',
      }}
    >
      <KartSimulation />
    </Canvas>
  );
}
