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
  dropItem3D,
  type Dynasty3DWorldState,
} from '../../engine/dynasty3dEngine';
import { executeHeroAttackHit } from '../../engine/dynastyCombatSystem';
import { audioEngine } from '../../services/audioEngine';
import type { MinimapData } from '../GameHUD';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { useDynastyControls } from '../../hooks/useDynastyControls';
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
  // Synchronous State Initialization: World exists from the very first frame!
  const [world, setWorld] = useState<Dynasty3DWorldState>(() =>
    init3DWorld(scenario, selectedHero, selectedDifficulty)
  );
  const worldRef = useRef<Dynasty3DWorldState>(world);
  worldRef.current = world;

  const [debugStats, setDebugStats] = useState<DebugStats | null>(null);

  // Combat Execution Helper
  const checkHeroHits = useCallback(
    (
      worldState: Dynasty3DWorldState,
      range: number,
      angleSpread: number,
      baseDamage: number,
      isHeavy: boolean,
      isOneHit: boolean
    ) => {
      const effectiveDamage = isOneHit ? 99999 : baseDamage;
      const result = executeHeroAttackHit(
        worldState,
        range,
        angleSpread,
        effectiveDamage,
        isHeavy,
        (enemy) => {
          enemy.isDead = true;
          enemy.health = 0;
          enemy.deathTimer = 0;
          worldState.koCount += 1;

          const p = worldState.player;
          p.musou = Math.min(
            p.musouMax,
            p.musou + (enemy.type === 'BOSS' ? 50 : enemy.type === 'CAPTAIN' ? 20 : 6)
          );

          if (worldState.items.length < 25 && (Math.random() < 0.25 || enemy.type === 'CAPTAIN' || enemy.type === 'BOSS')) {
            worldState.items.push(dropItem3D(enemy.position));
          }

          if ([50, 100, 250, 500, 1000].includes(worldState.koCount)) {
            audioEngine.playGong();
            onAnnouncement?.({
              id: `ko_${worldState.koCount}`,
              title: `${worldState.koCount} K.O.!`,
              subtitle: 'TRUE WARRIOR OF THE THREE KINGDOMS!',
              type: 'milestone',
              color: '#facc15',
            });
          }

          if (enemy.type === 'BOSS') {
            worldState.isVictory = true;
            audioEngine.playGong();
            onAnnouncement?.({
              id: `boss_slain_${Date.now()}`,
              title: 'ENEMY COMMANDER DEFEATED!',
              subtitle: `${enemy.name} has fallen! VICTORY IS OURS!`,
              type: 'officer_slain',
              color: '#22c55e',
            });
            setTimeout(() => onGameOver(true), 2500);
          } else if (enemy.type === 'CAPTAIN') {
            onAnnouncement?.({
              id: `officer_${enemy.id}`,
              title: 'ENEMY OFFICER SLAIN!',
              subtitle: `${enemy.name} has been defeated!`,
              type: 'officer_slain',
              color: '#fbbf24',
            });
          }
        }
      );

      if (result.hitCount > 0) {
        audioEngine.playHit(isHeavy);
      }
    },
    [onAnnouncement, onGameOver]
  );

  // Attack Action Callbacks
  const triggerNormalAttack = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.player.isMusouActive || currentWorld.player.isHitStunned) return;

    const p = currentWorld.player;
    if (!p.isMoving) {
      p.rotationY = controls.cameraYawRef.current;
    }

    p.attackStage = (p.attackStage % 6) + 1;
    p.isChargeAttack = false;
    p.attackTimer = 0;
    p.attackDuration = 0.22;

    audioEngine.playSwing();

    const slashColors = {
      [HeroType.GUAN_YU]: '#4ade80',
      [HeroType.ZHAO_YUN]: '#38bdf8',
      [HeroType.LU_BU]: '#ef4444',
      [HeroType.LU_XUN]: '#f97316',
    };

    currentWorld.slashes.push({
      id: `slash_${Date.now()}_${Math.random()}`,
      heroType: p.heroType,
      position: { ...p.position },
      rotationY: p.rotationY,
      radius: 4.8,
      color: slashColors[p.heroType],
      progress: 0,
      maxLife: 0.26,
      isMusou: false,
      isCharge: false,
    });

    checkHeroHits(currentWorld, 5.2, Math.PI * 1.15, p.damage, false, controls.oneHitKill);
  }, [checkHeroHits]);

  const triggerChargeAttack = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.player.isMusouActive || currentWorld.player.isHitStunned) return;

    const p = currentWorld.player;
    if (!p.isMoving) {
      p.rotationY = controls.cameraYawRef.current;
    }

    p.isChargeAttack = true;
    p.attackTimer = 0;
    p.attackDuration = 0.44;

    audioEngine.playSwing();
    audioEngine.playHit(true);

    const comboStage = p.attackStage;

    if (comboStage <= 1) {
      currentWorld.screenShake.intensity = 3.2;
      currentWorld.screenShake.duration = 0.22;
      currentWorld.shockwaves.push({
        id: `shock_${Date.now()}`,
        position: { ...p.position },
        radius: 1.0,
        maxRadius: 6.5,
        color: '#38bdf8',
        life: 0,
        maxLife: 0.35,
      });
      checkHeroHits(currentWorld, 6.2, Math.PI * 1.2, p.damage * 1.8, true, controls.oneHitKill);
    } else if (comboStage === 2) {
      currentWorld.screenShake.intensity = 3.6;
      currentWorld.screenShake.duration = 0.25;
      checkHeroHits(currentWorld, 6.8, Math.PI * 1.4, p.damage * 2.0, true, controls.oneHitKill);
    } else if (comboStage === 3) {
      currentWorld.screenShake.intensity = 4.4;
      currentWorld.screenShake.duration = 0.3;
      currentWorld.shockwaves.push({
        id: `shock_${Date.now()}`,
        position: { ...p.position },
        radius: 1.5,
        maxRadius: 10.5,
        color: '#ef4444',
        life: 0,
        maxLife: 0.45,
      });
      checkHeroHits(currentWorld, 9.5, Math.PI * 1.9, p.damage * 2.5, true, controls.oneHitKill);
    } else if (comboStage === 4) {
      currentWorld.screenShake.intensity = 4.6;
      currentWorld.screenShake.duration = 0.32;
      currentWorld.shockwaves.push({
        id: `shock_${Date.now()}`,
        position: { ...p.position },
        radius: 1.0,
        maxRadius: 9.0,
        color: '#f59e0b',
        life: 0,
        maxLife: 0.48,
      });
      checkHeroHits(currentWorld, 8.8, Math.PI * 2.0, p.damage * 2.7, true, controls.oneHitKill);
    } else {
      currentWorld.screenShake.intensity = 5.2;
      currentWorld.screenShake.duration = 0.36;
      currentWorld.shockwaves.push({
        id: `shock_${Date.now()}`,
        position: { ...p.position },
        radius: 1.8,
        maxRadius: 12.5,
        color: '#eab308',
        life: 0,
        maxLife: 0.55,
      });
      checkHeroHits(currentWorld, 11.0, Math.PI * 2.0, p.damage * 3.2, true, controls.oneHitKill);
    }

    p.attackStage = 0;
  }, [checkHeroHits]);

  const triggerMusou = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld) return;
    const p = currentWorld.player;

    if (p.musou >= p.musouMax && !p.isMusouActive) {
      p.isMusouActive = true;
      p.musou = 0;
      p.musouTimer = 4.2;

      audioEngine.playMusouBlast();
      onAnnouncement?.({
        id: `musou_${Date.now()}`,
        title: 'TRUE MUSOU ACTIVATED!',
        subtitle: `${Constants.HERO_STATS[p.heroType].title} unleashes the Dragon Fury!`,
        type: 'milestone',
        color: '#ef4444',
      });
    }
  }, [onAnnouncement]);

  const triggerDash = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.player.isDashing) return;

    currentWorld.player.isDashing = true;
    currentWorld.player.dashTimer = 0.35;
    audioEngine.playDash();

    currentWorld.shockwaves.push({
      id: `dash_${Date.now()}`,
      position: { ...currentWorld.player.position },
      radius: 0.5,
      maxRadius: 2.2,
      color: '#94a3b8',
      life: 0,
      maxLife: 0.2,
    });
  }, []);

  // Controls Hook
  const controls = useDynastyControls({
    status,
    onTogglePause,
    onTriggerAttack: triggerNormalAttack,
    onTriggerCharge: triggerChargeAttack,
    onTriggerMusou: triggerMusou,
    onTriggerDash: triggerDash,
    getPlayerRotationY: () => worldRef.current?.player.rotationY ?? 0,
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
        {/* Scenario Sky Color */}
        <color attach="background" args={[skyColor]} />

        {/* Atmospheric Depth Fog (Soft ambient haze across battlefield and mountains) */}
        <fog attach="fog" args={[skyColor, 75, 420]} />

        {/* Natural Warm Dynasty Warriors Battlefield Lighting */}
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
          onTriggerAttack={triggerNormalAttack}
          onTriggerCharge={triggerChargeAttack}
          onTriggerMusou={triggerMusou}
          onTriggerDash={triggerDash}
          cameraYawRef={controls.cameraYawRef}
          cameraPitchRef={controls.cameraPitchRef}
          targetYawRef={controls.targetYawRef}
          targetPitchRef={controls.targetPitchRef}
          zoomDistRef={controls.zoomDistRef}
        />

        {/* Cinematic High-Performance Post-Processing Pipeline */}
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.82}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.45} />
          <ToneMapping />
        </EffectComposer>
      </Canvas>

      {/* DEVELOPER TOOLS & DEBUG STATISTICS OVERLAY */}
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
