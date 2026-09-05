import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BattleScenario,
  DifficultyLevel,
  MobileInputState,
  BattleAnnouncement,
  DebugStats,
} from '../../types';
import {
  updateComboRank,
  toMinimapCoords,
  dropItem3D,
  type Dynasty3DWorldState,
  type EnemyEntity3D,
} from '../../engine/dynasty3dEngine';
import { Hero3D } from './Hero3D';
import { EnemyHorde3D } from './EnemyHorde3D';
import { AlliedTroops3D } from './AlliedTroops3D';
import { Animals3D } from './Animals3D';
import { BattlefieldMap3D, MAP_OBSTACLES } from './BattlefieldMap3D';
import { SkyAtmosphere3D } from './SkyAtmosphere3D';
import { CombatVFX3D } from './CombatVFX3D';
import { DamageNumbers3D } from './DamageNumbers3D';
import { ItemDrops3D } from './ItemDrops3D';
import { DynastyCamera3D } from './DynastyCamera3D';
import { audioEngine } from '../../services/audioEngine';
import type { MinimapData } from '../GameHUD';
import {
  calculatePlayerMovement,
  updateEnemyPhysicsAndAI,
} from '../../engine/dynastyCombatSystem';
import { getTerrainHeight } from '../../engine/terrainHeightEngine';
import {
  updateProjectilesAndHazards,
  updateBaseCapturing,
  updateItemPickups,
  checkBossSpawnCondition,
} from '../../engine/dynastySimulationSubsystems';

export interface DynastyGameSimulationProps {
  world: Dynasty3DWorldState;
  isGamePlaying: boolean;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  mobileInputRef?: React.MutableRefObject<MobileInputState>;
  scenario: BattleScenario;
  selectedDifficulty: DifficultyLevel;
  godMode: boolean;
  oneHitKill: boolean;
  onAnnouncement?: (announcement: BattleAnnouncement) => void;
  onGameOver: (victory: boolean) => void;
  onStatsSync: (minimap: MinimapData) => void;
  onDebugSync?: (stats: DebugStats) => void;
  onTriggerAttack: () => void;
  onTriggerCharge: () => void;
  onTriggerMusou: () => void;
  onTriggerDash: () => void;
  cameraYawRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  targetYawRef: React.MutableRefObject<number>;
  targetPitchRef: React.MutableRefObject<number>;
  zoomDistRef: React.MutableRefObject<number>;
}

export const DynastyGameSimulation: React.FC<DynastyGameSimulationProps> = ({
  world,
  isGamePlaying,
  keysRef,
  mobileInputRef,
  scenario,
  selectedDifficulty,
  godMode,
  oneHitKill,
  onAnnouncement,
  onGameOver,
  onStatsSync,
  onDebugSync,
  onTriggerAttack,
  onTriggerCharge,
  onTriggerMusou,
  onTriggerDash,
  cameraYawRef,
  cameraPitchRef,
  targetYawRef,
  targetPitchRef,
  zoomDistRef,
}) => {
  const statsTimerRef = useRef(0);
  const velocityRef = useRef({ x: 0, z: 0 });
  const fpsSmoothRef = useRef(60);

  const handleEnemyDefeat = (enemy: EnemyEntity3D) => {
    if (enemy.isDead && (enemy.deathTimer || 0) > 0) return;
    enemy.isDead = true;
    enemy.health = 0;
    enemy.deathTimer = 0;
    world.koCount += 1;
    world.comboCount += 1;
    world.comboTimer = 3.5;
    world.comboRank = updateComboRank(world.comboCount);

    world.player.musou = Math.min(
      world.player.musouMax,
      world.player.musou + (enemy.type === 'BOSS' ? 50 : enemy.type === 'CAPTAIN' ? 25 : 5)
    );

    if (world.items.length < 25 && (Math.random() < 0.25 || enemy.type === 'CAPTAIN' || enemy.type === 'BOSS')) {
      world.items.push(dropItem3D(enemy.position));
    }

    if ([50, 100, 250, 500, 1000].includes(world.koCount)) {
      audioEngine.playGong();
      onAnnouncement?.({
        id: `ko_${world.koCount}`,
        title: `${world.koCount} K.O.!`,
        subtitle: 'TRUE WARRIOR OF THE THREE KINGDOMS!',
        type: 'milestone',
        color: '#facc15',
      });
    }

    if (enemy.type === 'BOSS') {
      audioEngine.playGong();
      onAnnouncement?.({
        id: `boss_slain_${enemy.id}`,
        title: 'ENEMY COMMANDER DEFEATED!',
        subtitle: `${enemy.name} has fallen! VICTORY IS OURS!`,
        type: 'officer_slain',
        color: '#22c55e',
      });
      world.isVictory = true;
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
  };

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);

    const instantFps = dt > 0 ? 1 / dt : 60;
    fpsSmoothRef.current = fpsSmoothRef.current * 0.9 + instantFps * 0.1;

    const player = world.player;

    if (godMode) {
      player.health = player.maxHealth;
      player.musou = player.musouMax;
    }

    statsTimerRef.current += dt;
    if (statsTimerRef.current >= 0.1) {
      statsTimerRef.current = 0;
      const liveMinimap: MinimapData = {
        playerX: toMinimapCoords(player.position).x,
        playerY: toMinimapCoords(player.position).y,
        worldSize: 3000,
        enemies: world.enemies.map((e) => ({
          x: toMinimapCoords(e.position).x,
          y: toMinimapCoords(e.position).y,
          isBoss: e.type === 'BOSS' || e.type === 'CAPTAIN',
        })),
        bases: world.bases,
        items: world.items.map((it) => toMinimapCoords(it.position)),
        cameraX: toMinimapCoords(player.position).x,
        cameraY: toMinimapCoords(player.position).y,
        viewWidth: window.innerWidth,
        viewHeight: window.innerHeight,
      };
      onStatsSync(liveMinimap);

      onDebugSync?.({
        fps: Math.round(fpsSmoothRef.current),
        playerPos: { ...player.position },
        playerRot: player.rotationY,
        camYaw: cameraYawRef.current,
        camPitch: cameraPitchRef.current,
        camZoom: zoomDistRef.current,
        totalEnemies: world.enemies.length,
        nearbyEnemies: world.enemies.filter((e) => {
          const dx = e.position.x - player.position.x;
          const dz = e.position.z - player.position.z;
          return dx * dx + dz * dz < 60 * 60;
        }).length,
        totalAllies: world.allies.length,
        totalDrops: world.items.length,
        totalVFX: world.slashes.length + world.shockwaves.length + world.fireZones.length + world.arrows.length,
      });
    }

    if (!isGamePlaying || world.isVictory || world.isDefeat) {
      player.isMoving = false;
      return;
    }

    if (world.screenShake.duration > 0) {
      world.screenShake.duration -= dt;
      if (world.screenShake.duration <= 0) {
        world.screenShake.intensity = 0;
      }
    }

    if (mobileInputRef?.current) {
      if (mobileInputRef.current.isAttacking && player.attackStage === 0) onTriggerAttack();
      if (mobileInputRef.current.isCharge && !player.isChargeAttack) onTriggerCharge();
      if (mobileInputRef.current.isMusou && !player.isMusouActive) onTriggerMusou();
      if (mobileInputRef.current.isDashing && !player.isDashing) onTriggerDash();
    }

    const camYaw = cameraYawRef.current;
    let inputForward = 0;
    let inputRight = 0;

    if (keysRef.current['w'] || keysRef.current['arrowup']) inputForward += 1;
    if (keysRef.current['s'] || keysRef.current['arrowdown']) inputForward -= 1;
    if (keysRef.current['d'] || keysRef.current['arrowright']) inputRight += 1;
    if (keysRef.current['a'] || keysRef.current['arrowleft']) inputRight -= 1;

    if (mobileInputRef?.current?.active) {
      const mx = mobileInputRef.current.moveVector.x;
      const my = -mobileInputRef.current.moveVector.y;
      if (Math.hypot(mx, my) > 0.05) {
        inputRight = mx;
        inputForward = my;
      }
    }

    calculatePlayerMovement(player, velocityRef.current, camYaw, inputForward, inputRight, dt, MAP_OBSTACLES);

    if (player.attackStage > 0 && !player.isHitStunned) {
      const attackProgress = player.attackTimer / (player.attackDuration || 0.25);
      if (attackProgress < 0.45) {
        const lungeFactor = 1 - attackProgress / 0.45;
        const stepMagnitude = player.isChargeAttack ? 2.2 : player.attackStage === 6 ? 2.6 : player.attackStage === 5 ? 1.6 : 0.9;
        player.position.x += Math.sin(player.rotationY) * stepMagnitude * lungeFactor * dt * 2.2;
        player.position.z += Math.cos(player.rotationY) * stepMagnitude * lungeFactor * dt * 2.2;
        player.position.y = getTerrainHeight(player.position.x, player.position.z);
      }
    }

    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) player.isDashing = false;
    }

    if (player.isHitStunned) {
      player.hitStunTimer -= dt;
      if (player.hitStunTimer <= 0) player.isHitStunned = false;
    }

    if (player.attackStage > 0) {
      player.attackTimer += dt;
      if (player.attackTimer >= player.attackDuration) {
        player.attackStage = 0;
        player.isChargeAttack = false;
      }
    }

    if (player.isMusouActive) {
      player.musouTimer -= dt;
      world.screenShake.intensity = 3.5;
      world.screenShake.duration = 0.1;

      if (Math.random() < 0.3) audioEngine.playHit(true);

      world.enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const dx = enemy.position.x - player.position.x;
        const dz = enemy.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 11) {
          const dmg = oneHitKill ? 99999 : 45;
          enemy.health -= dmg;
          enemy.hitFlashTimer = 0.15;
          enemy.isAirborne = true;
          enemy.velocity.y = 8 + Math.random() * 4;
          enemy.velocity.x = (dx / (dist || 1)) * 9;
          enemy.velocity.z = (dz / (dist || 1)) * 9;

          if (world.damageNumbers.length < 35) {
            world.damageNumbers.push({
              id: `dmg_${Date.now()}_${Math.random()}`,
              position: { ...enemy.position },
              value: Math.floor(dmg),
              color: '#facc15',
              isCrit: true,
              life: 0,
              maxLife: 0.6,
            });
          }

          if (enemy.health <= 0) handleEnemyDefeat(enemy);
        }
      });

      if (player.musouTimer <= 0) {
        player.isMusouActive = false;
        audioEngine.playMusouBlast();
        world.shockwaves.push({
          id: `musou_blast_${Date.now()}`,
          position: { ...player.position },
          radius: 1,
          maxRadius: 18,
          color: '#ef4444',
          life: 0,
          maxLife: 0.8,
        });
        world.screenShake.intensity = 7;
        world.screenShake.duration = 0.5;
      }
    }

    if (world.comboCount > 0) {
      world.comboTimer -= dt;
      if (world.comboTimer <= 0) {
        world.comboCount = 0;
        world.comboRank = 'D';
      }
    }

    updateEnemyPhysicsAndAI(world, dt, MAP_OBSTACLES, (damage) => {
      if (godMode) return;
      player.health = Math.max(0, player.health - damage);
      audioEngine.playHit(false);
      world.screenShake.intensity = 1.5;
      world.screenShake.duration = 0.15;

      if (world.damageNumbers.length < 35) {
        world.damageNumbers.push({
          id: `dmg_p_${Date.now()}`,
          position: { ...player.position },
          value: Math.floor(damage),
          color: '#ef4444',
          isCrit: false,
          life: 0,
          maxLife: 0.6,
        });
      }

      if (player.health <= 0) {
        world.isDefeat = true;
        onGameOver(false);
      }
    });

    updateProjectilesAndHazards(world, dt, godMode);
    updateBaseCapturing(world, dt, onAnnouncement);
    updateItemPickups(world, dt);
    checkBossSpawnCondition(world, scenario, selectedDifficulty, onAnnouncement);
  });

  return (
    <>
      <DynastyCamera3D
        player={world.player}
        screenShake={world.screenShake}
        cameraYawRef={cameraYawRef}
        cameraPitchRef={cameraPitchRef}
        targetYawRef={targetYawRef}
        targetPitchRef={targetPitchRef}
        zoomDistRef={zoomDistRef}
        keysRef={keysRef}
      />
      <SkyAtmosphere3D scenario={scenario} />
      <BattlefieldMap3D scenario={scenario} bases={world.bases} />
      <Animals3D playerPos={world.player.position} />
      <Hero3D player={world.player} />
      <EnemyHorde3D enemies={world.enemies} playerPos={world.player.position} />
      <AlliedTroops3D allies={world.allies} />
      <CombatVFX3D
        slashes={world.slashes}
        shockwaves={world.shockwaves}
        fireZones={world.fireZones}
        arrows={world.arrows}
      />
      <DamageNumbers3D damageNumbers={world.damageNumbers} />
      <ItemDrops3D items={world.items} />
    </>
  );
};
