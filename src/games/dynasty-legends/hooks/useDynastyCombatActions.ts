import { useCallback } from 'react';
import { HeroType, BattleAnnouncement } from '../types';
import * as Constants from '../constants';
import {
  dropItem3D,
  type Dynasty3DWorldState,
} from '../engine/dynasty3dEngine';
import { executeHeroAttackHit } from '../engine/dynastyCombatSystem';
import { audioEngine } from '../services/audioEngine';

interface UseDynastyCombatActionsOptions {
  worldRef: React.MutableRefObject<Dynasty3DWorldState>;
  cameraYawRef: React.MutableRefObject<number>;
  oneHitKill: boolean;
  onAnnouncement?: (announcement: BattleAnnouncement) => void;
  onGameOver: (victory: boolean) => void;
}

export function useDynastyCombatActions({
  worldRef,
  cameraYawRef,
  oneHitKill,
  onAnnouncement,
  onGameOver,
}: UseDynastyCombatActionsOptions) {
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

          if (
            worldState.items.length < 25 &&
            (Math.random() < 0.25 || enemy.type === 'CAPTAIN' || enemy.type === 'BOSS')
          ) {
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

  const triggerNormalAttack = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.player.isMusouActive || currentWorld.player.isHitStunned) return;

    const p = currentWorld.player;
    if (!p.isMoving) {
      p.rotationY = cameraYawRef.current;
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

    checkHeroHits(currentWorld, 5.2, Math.PI * 1.15, p.damage, false, oneHitKill);
  }, [checkHeroHits, cameraYawRef, oneHitKill, worldRef]);

  const triggerChargeAttack = useCallback(() => {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.player.isMusouActive || currentWorld.player.isHitStunned) return;

    const p = currentWorld.player;
    if (!p.isMoving) {
      p.rotationY = cameraYawRef.current;
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
      checkHeroHits(currentWorld, 6.2, Math.PI * 1.2, p.damage * 1.8, true, oneHitKill);
    } else if (comboStage === 2) {
      currentWorld.screenShake.intensity = 3.6;
      currentWorld.screenShake.duration = 0.25;
      checkHeroHits(currentWorld, 6.8, Math.PI * 1.4, p.damage * 2.0, true, oneHitKill);
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
      checkHeroHits(currentWorld, 9.5, Math.PI * 1.9, p.damage * 2.5, true, oneHitKill);
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
      checkHeroHits(currentWorld, 8.8, Math.PI * 2.0, p.damage * 2.7, true, oneHitKill);
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
      checkHeroHits(currentWorld, 11.0, Math.PI * 2.0, p.damage * 3.2, true, oneHitKill);
    }

    p.attackStage = 0;
  }, [checkHeroHits, cameraYawRef, oneHitKill, worldRef]);

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
  }, [onAnnouncement, worldRef]);

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
  }, [worldRef]);

  return {
    checkHeroHits,
    triggerNormalAttack,
    triggerChargeAttack,
    triggerMusou,
    triggerDash,
  };
}
