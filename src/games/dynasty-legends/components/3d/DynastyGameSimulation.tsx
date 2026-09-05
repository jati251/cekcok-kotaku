import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BattleScenario,
  DifficultyLevel,
  MobileInputState,
  BattleAnnouncement,
  BaseAffiliation,
  ItemType,
  DebugStats,
} from '../../types';
import {
  spawnBoss3D,
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

  // Main Game Loop Tick
  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05); // Cap delta to avoid frame spikes

    const instantFps = dt > 0 ? 1 / dt : 60;
    fpsSmoothRef.current = fpsSmoothRef.current * 0.9 + instantFps * 0.1;

    const player = world.player;

    // Developer God Mode: Lock health and musou to max
    if (godMode) {
      player.health = player.maxHealth;
      player.musou = player.musouMax;
    }

    // Throttle Live Minimap & Stats to React Parent at 10 FPS (every 100ms) to eliminate React re-render lag
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

    // If in menu, story intro, victory, or defeat, pause gameplay physics
    if (!isGamePlaying || world.isVictory || world.isDefeat) {
      player.isMoving = false;
      return;
    }

    // 1. Update Screen Shake Duration
    if (world.screenShake.duration > 0) {
      world.screenShake.duration -= dt;
      if (world.screenShake.duration <= 0) {
        world.screenShake.intensity = 0;
      }
    }

    // 2. Mobile Action Button Triggers
    if (mobileInputRef?.current) {
      if (mobileInputRef.current.isAttacking && player.attackStage === 0) {
        onTriggerAttack();
      }
      if (mobileInputRef.current.isCharge && !player.isChargeAttack) {
        onTriggerCharge();
      }
      if (mobileInputRef.current.isMusou && !player.isMusouActive) {
        onTriggerMusou();
      }
      if (mobileInputRef.current.isDashing && !player.isDashing) {
        onTriggerDash();
      }
    }

    // 3. Process Movement Input (Relative to Camera Yaw with authentic DW5 martial jogging speed)
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

    calculatePlayerMovement(
      player,
      velocityRef.current,
      camYaw,
      inputForward,
      inputRight,
      dt,
      MAP_OBSTACLES
    );

    // Grounded martial arts stance step (subtle, natural weight transfer without sudden teleports)
    if (player.attackStage > 0 && !player.isHitStunned) {
      const attackProgress = player.attackTimer / (player.attackDuration || 0.25);
      if (attackProgress < 0.45) {
        const lungeFactor = 1 - attackProgress / 0.45;
        const stepMagnitude = player.isChargeAttack
          ? 2.2
          : player.attackStage === 6
          ? 2.6
          : player.attackStage === 5
          ? 1.6
          : 0.9;
        player.position.x += Math.sin(player.rotationY) * stepMagnitude * lungeFactor * dt * 2.2;
        player.position.z += Math.cos(player.rotationY) * stepMagnitude * lungeFactor * dt * 2.2;
      }
    }

    // 4. Dash Timer & Cooldown
    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
      }
    }

    // 5. Hit Stun
    if (player.isHitStunned) {
      player.hitStunTimer -= dt;
      if (player.hitStunTimer <= 0) {
        player.isHitStunned = false;
      }
    }

    // 6. Attack Timer & Recovery
    if (player.attackStage > 0) {
      player.attackTimer += dt;
      if (player.attackTimer >= player.attackDuration) {
        player.attackStage = 0;
        player.isChargeAttack = false;
      }
    }

    // 7. Musou Ultimate Active Loop
    if (player.isMusouActive) {
      player.musouTimer -= dt;
      world.screenShake.intensity = 3.5;
      world.screenShake.duration = 0.1;

      // Multi-hit aura pulses damaging surrounding enemies
      if (Math.random() < 0.3) {
        audioEngine.playHit(true);
      }

      world.enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const dx = enemy.position.x - player.position.x;
        const dz = enemy.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 11) {
          const dmg = oneHitKill ? 99999 : 45;
          enemy.health -= dmg;
          enemy.hitFlashTimer = 0.15;
          // Launch into air
          enemy.isAirborne = true;
          enemy.velocity.y = 8 + Math.random() * 4;
          enemy.velocity.x = (dx / (dist || 1)) * 9;
          enemy.velocity.z = (dz / (dist || 1)) * 9;

          // Damage Number (limit to max 35)
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

          if (enemy.health <= 0) {
            handleEnemyDefeat(enemy);
          }
        }
      });

      if (player.musouTimer <= 0) {
        player.isMusouActive = false;
        // Final devastating blast
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

    // 8. Combo Decay Timer
    if (world.comboCount > 0) {
      world.comboTimer -= dt;
      if (world.comboTimer <= 0) {
        world.comboCount = 0;
        world.comboRank = 'D';
      }
    }

    // 9. Update Enemies (Non-oscillating movement, air ragdoll, obstacle collision, and flocking)
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

    // 10. Update Flying Arrows
    for (let i = world.arrows.length - 1; i >= 0; i--) {
      const arr = world.arrows[i];
      arr.position.x += arr.velocity.x * dt;
      arr.position.y += arr.velocity.y * dt;
      arr.position.z += arr.velocity.z * dt;
      arr.velocity.y -= 6 * dt;
      arr.life -= dt;

      const dx = player.position.x - arr.position.x;
      const dz = player.position.z - arr.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.0 && Math.abs(player.position.y - arr.position.y) < 1.5) {
        if (!godMode && !player.isDashing && !player.isMusouActive) {
          player.health = Math.max(0, player.health - arr.damage);
          audioEngine.playHit(false);
        }
        world.arrows.splice(i, 1);
        continue;
      }

      if (arr.life <= 0 || arr.position.y <= 0) {
        world.arrows.splice(i, 1);
      }
    }

    // 11. Update Fire Zones
    for (let i = world.fireZones.length - 1; i >= 0; i--) {
      const fz = world.fireZones[i];
      fz.life -= dt;

      const dx = player.position.x - fz.position.x;
      const dz = player.position.z - fz.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < fz.radius && Math.random() < 0.05) {
        if (!godMode && !player.isDashing && !player.isMusouActive) {
          player.health = Math.max(0, player.health - 6);
        }
      }

      if (fz.life <= 0) {
        world.fireZones.splice(i, 1);
      }
    }

    // 12. Update Visual Effects (Slashes, Shockwaves, Damage Numbers)
    for (let i = world.slashes.length - 1; i >= 0; i--) {
      const slash = world.slashes[i];
      slash.progress += dt;
      if (slash.progress >= slash.maxLife) {
        world.slashes.splice(i, 1);
      }
    }

    for (let i = world.shockwaves.length - 1; i >= 0; i--) {
      const sw = world.shockwaves[i];
      sw.life += dt;
      if (sw.life >= sw.maxLife) {
        world.shockwaves.splice(i, 1);
      }
    }

    for (let i = world.damageNumbers.length - 1; i >= 0; i--) {
      const dn = world.damageNumbers[i];
      dn.life += dt;
      if (dn.life >= dn.maxLife) {
        world.damageNumbers.splice(i, 1);
      }
    }

    // 13. Check Tactical Base Capture Progress
    world.bases.forEach((base) => {
      const baseCenter3D = {
        x: (base.x - 1500) * 0.1,
        y: 0,
        z: (base.y - 1500) * 0.1,
      };
      const radius3D = base.radius * 0.1;
      const dx = player.position.x - baseCenter3D.x;
      const dz = player.position.z - baseCenter3D.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < radius3D && base.affiliation === BaseAffiliation.ENEMY) {
        base.captureProgress += dt * 14;
        if (base.captureProgress >= 100) {
          base.affiliation = BaseAffiliation.ALLIED;
          world.alliedMorale = Math.min(100, world.alliedMorale + 15);
          world.enemyMorale = Math.max(0, world.enemyMorale - 15);

          audioEngine.playGong();
          onAnnouncement?.({
            id: `base_${base.id}`,
            title: 'TACTICAL BASE CAPTURED!',
            subtitle: `${base.name} has been liberated by allied forces!`,
            type: 'milestone',
            color: '#3b82f6',
          });

          world.items.push(dropItem3D(baseCenter3D));
          world.items.push(dropItem3D(baseCenter3D));

          world.objectives.forEach((obj) => {
            if (obj.type === 'capture_base' && obj.targetId === base.id) {
              obj.completed = true;
              obj.currentCount = 1;
            }
          });
        }
      }
    });

    // 14. Item Pickups
    for (let i = world.items.length - 1; i >= 0; i--) {
      const it = world.items[i];
      it.life -= dt;
      const dx = player.position.x - it.position.x;
      const dz = player.position.z - it.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.4) {
        audioEngine.playPickup();
        if (it.type === ItemType.HEALTH_BUN) {
          player.health = Math.min(player.maxHealth, player.health + 200);
        } else if (it.type === ItemType.WINE_MUSOU) {
          player.musou = Math.min(player.musouMax, player.musou + 50);
        } else if (it.type === ItemType.WAR_DRUM) {
          player.damage *= 1.3;
        } else if (it.type === ItemType.SPEED_BOOTS) {
          player.speed *= 1.25;
        }
        world.items.splice(i, 1);
        continue;
      }
      if (it.life <= 0) {
        world.items.splice(i, 1);
      }
    }

    // 15. Objective & Boss Spawn Check
    if (!world.bossSpawned && world.koCount >= 40) {
      world.bossSpawned = true;
      const boss = spawnBoss3D(scenario, selectedDifficulty);
      world.enemies.push(boss);
      world.bossEntity = boss;

      audioEngine.playGong();
      onAnnouncement?.({
        id: `boss_appear_${scenario.id}`,
        title: 'ENEMY COMMANDER APPEARS!',
        subtitle: `${scenario.bossName} - "${scenario.bossQuote}"`,
        type: 'officer_slain',
        color: '#ef4444',
      });
    }
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
      <BattlefieldMap3D scenario={scenario} bases={world.bases} playerPos={world.player.position} />
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
