import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  GameStatus,
  HeroType,
  DifficultyLevel,
  BattleScenario,
  MobileInputState,
  ComboRank,
  MissionObjective,
  BattleAnnouncement,
  MapTheme,
  DebugStats,
} from '../../types';
import * as Constants from '../../constants';
import {
  init3DWorld,
  spawnBoss3D,
  type Dynasty3DWorldState,
} from '../../engine/dynasty3dEngine';
import { audioEngine } from '../../services/audioEngine';
import type { MinimapData } from '../GameHUD';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { useDynastyControls } from '../../hooks/useDynastyControls';
import { useDynastyCombatActions } from '../../hooks/useDynastyCombatActions';
import { DynastyGameSimulation } from './DynastyGameSimulation';
import { DevToolsOverlay } from './DevToolsOverlay';

export type { DebugStats };

export interface DynastyCanvas3DProps {
  status: GameStatus;
  selectedHero: HeroType;
  selectedDifficulty: DifficultyLevel;
  scenario: BattleScenario;
  onUpdateStats: (
    hp: number,
    musou: number,
    ko: number,
    alliedMorale: number,
    enemyMorale: number,
    currentObj?: MissionObjective,
    combo?: number,
    comboRank?: ComboRank,
    weaponName?: string,
    minimap?: MinimapData,
    isRustEngine?: boolean
  ) => void;
  onGameOver: (victory: boolean) => void;
  onTogglePause?: () => void;
  onAnnouncement?: (announcement: BattleAnnouncement) => void;
  mobileInputRef?: React.MutableRefObject<MobileInputState>;
}

const DynastyCanvas3DComponent: React.FC<DynastyCanvas3DProps> = ({
  status,
  selectedHero,
  selectedDifficulty,
  scenario,
  onUpdateStats,
  onGameOver,
  onTogglePause,
  onAnnouncement,
  mobileInputRef,
}) => {
  const [world, setWorld] = useState<Dynasty3DWorldState>(() =>
    init3DWorld(scenario, selectedHero, selectedDifficulty)
  );
  const worldRef = useRef<Dynasty3DWorldState>(world);
  worldRef.current = world;

  const [debugStats, setDebugStats] = useState<DebugStats | null>(null);

  // Controls Hook
  const controls = useDynastyControls({
    status,
    onTogglePause,
    onTriggerAttack: () => combat.triggerNormalAttack(),
    onTriggerCharge: () => combat.triggerChargeAttack(),
    onTriggerMusou: () => combat.triggerMusou(),
    onTriggerDash: () => combat.triggerDash(),
    getPlayerRotationY: () => worldRef.current?.player.rotationY ?? 0,
  });

  // Combat Actions Hook
  const combat = useDynastyCombatActions({
    worldRef,
    cameraYawRef: controls.cameraYawRef,
    oneHitKill: controls.oneHitKill,
    onAnnouncement,
    onGameOver,
  });

  // World Reset on Scenario / Hero / Difficulty Change
  useEffect(() => {
    const newWorld = init3DWorld(scenario, selectedHero, selectedDifficulty);
    setWorld(newWorld);
    worldRef.current = newWorld;

    if (status === GameStatus.PLAYING) {
      audioEngine.startBattleDrums();
    }

    return () => {
      audioEngine.stopBattleDrums();
    };
  }, [scenario, selectedHero, selectedDifficulty, status]);

  // Dev Quick Actions
  const handleKillNearby = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld) return;
    const p = currentWorld.player;
    currentWorld.enemies.forEach((e) => {
      if (e.isDead) return;
      const dx = e.position.x - p.position.x;
      const dz = e.position.z - p.position.z;
      if (dx * dx + dz * dz < 45 * 45) {
        e.health = 0;
        e.isDead = true;
        e.deathTimer = 0;
        e.hitFlashTimer = 0.3;
        currentWorld.koCount += 1;
      }
    });
    audioEngine.playGong();
  }, []);

  const handleFullRestore = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld) return;
    currentWorld.player.health = currentWorld.player.maxHealth;
    currentWorld.player.musou = currentWorld.player.musouMax;
    audioEngine.playFanfare();
  }, []);

  const handleSpawnBoss = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld) return;
    const boss = spawnBoss3D(scenario, selectedDifficulty);
    currentWorld.enemies.push(boss);
    audioEngine.playGong();
  }, [scenario, selectedDifficulty]);

  const handleStatsSync = useCallback(
    (minimap: MinimapData) => {
      const currentWorld = worldRef.current;
      if (!currentWorld) return;

      onUpdateStats(
        currentWorld.player.health,
        currentWorld.player.musou,
        currentWorld.koCount,
        currentWorld.alliedMorale,
        currentWorld.enemyMorale,
        currentWorld.objectives[0],
        currentWorld.comboCount,
        currentWorld.comboRank,
        Constants.HERO_STATS[currentWorld.player.heroType].weaponName,
        minimap,
        false
      );
    },
    [onUpdateStats]
  );

  const isSnow = scenario.mapTheme === MapTheme.HULAO_SNOW;
  const isFire = scenario.mapTheme === MapTheme.CHIBI_FIRE;
  const skyColor = isSnow ? '#93c5fd' : isFire ? '#7c2d12' : '#38bdf8';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 1.5]}
        camera={{
          position: [world.player.position.x, 8.5, world.player.position.z - 12.5],
          fov: 52,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        className="w-full h-full"
      >
        <color attach="background" args={[skyColor]} />
        <fog attach="fog" args={[skyColor, 75, 420]} />

        <hemisphereLight args={[skyColor, '#4d7c0f', 1.25]} />
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[world.player.position.x + 35, 65, world.player.position.z + 35]}
          intensity={1.6}
          castShadow
          shadow-bias={-0.0004}
          shadow-normalBias={0.04}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-75}
          shadow-camera-right={75}
          shadow-camera-top={75}
          shadow-camera-bottom={-75}
          shadow-camera-near={0.5}
          shadow-camera-far={200}
        />

        <DynastyGameSimulation
          world={world}
          isGamePlaying={status === GameStatus.PLAYING}
          keysRef={controls.keysRef}
          mobileInputRef={mobileInputRef}
          scenario={scenario}
          selectedDifficulty={selectedDifficulty}
          godMode={controls.godMode}
          oneHitKill={controls.oneHitKill}
          onAnnouncement={onAnnouncement}
          onGameOver={onGameOver}
          onStatsSync={handleStatsSync}
          onDebugSync={setDebugStats}
          onTriggerAttack={combat.triggerNormalAttack}
          onTriggerCharge={combat.triggerChargeAttack}
          onTriggerMusou={combat.triggerMusou}
          onTriggerDash={combat.triggerDash}
          cameraYawRef={controls.cameraYawRef}
          cameraPitchRef={controls.cameraPitchRef}
          targetYawRef={controls.targetYawRef}
          targetPitchRef={controls.targetPitchRef}
          zoomDistRef={controls.zoomDistRef}
        />

        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom intensity={0.5} luminanceThreshold={0.82} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.45} />
          <ToneMapping />
        </EffectComposer>
      </Canvas>

      <DevToolsOverlay
        debugOpen={controls.debugOpen}
        setDebugOpen={controls.setDebugOpen}
        godMode={controls.godMode}
        setGodMode={controls.setGodMode}
        oneHitKill={controls.oneHitKill}
        setOneHitKill={controls.setOneHitKill}
        debugStats={debugStats}
        onFullRestore={handleFullRestore}
        onKillNearby={handleKillNearby}
        onSpawnBoss={handleSpawnBoss}
      />
    </div>
  );
};

export const DynastyCanvas3D = React.memo(DynastyCanvas3DComponent);
