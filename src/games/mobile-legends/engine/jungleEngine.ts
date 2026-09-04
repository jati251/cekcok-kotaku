import type { JungleCampEntity } from '../types/map';
import type { ActiveHeroEntity } from '../types/hero';
import { mobaAudio } from './audioEngine';

export interface EnhancedLordEntity {
  id: string;
  team: 'blue' | 'red';
  maxHp: number;
  currentHp: number;
  physicalAttack: number;
  position: { x: number; y: number; z: number };
  waypointIndex: number;
  lane: 'top' | 'mid' | 'bot';
  isDead: boolean;
}

export function updateJungleCamps(
  camps: JungleCampEntity[],
  allHeroes: ActiveHeroEntity[],
  dt: number,
  onCampKilled: (camp: JungleCampEntity, killerHero: ActiveHeroEntity) => void
) {
  camps.forEach((camp) => {
    // 1. Handle Respawn
    if (!camp.isAlive) {
      camp.remainingRespawnTimer -= dt;
      if (camp.remainingRespawnTimer <= 0) {
        camp.isAlive = true;
        camp.currentHp = camp.maxHp;
        camp.position = { ...camp.spawnPosition };
        camp.targetEntityId = null;

        if (camp.campType === 'turtle') mobaAudio.playAnnouncer('turtle_spawned');
        if (camp.campType === 'lord') mobaAudio.playAnnouncer('lord_spawned');
      }
      return;
    }

    // 2. Check for Nearby Heroes
    let nearestHero: ActiveHeroEntity | null = null;
    let minDist = camp.attackRange + 2;

    for (const hero of allHeroes) {
      if (hero.state === 'dead') continue;
      const dx = hero.position.x - camp.position.x;
      const dz = hero.position.z - camp.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < minDist) {
        minDist = dist;
        nearestHero = hero;
      }
    }

    if (nearestHero) {
      camp.targetEntityId = nearestHero.id;

      // Attack hero
      nearestHero.currentHp -= camp.physicalAttack * dt * 0.7;

      // Check distance from spawn (Leash limit)
      const distFromSpawn = Math.hypot(
        camp.position.x - camp.spawnPosition.x,
        camp.position.z - camp.spawnPosition.z
      );
      if (distFromSpawn > camp.leashRadius) {
        // Reset and rapidly regenerate
        camp.targetEntityId = null;
        camp.position = { ...camp.spawnPosition };
        camp.currentHp = Math.min(camp.maxHp, camp.currentHp + camp.maxHp * 0.25 * dt);
      }
    } else {
      camp.targetEntityId = null;
      // Slowly regenerate if idle
      if (camp.currentHp < camp.maxHp) {
        camp.currentHp = Math.min(camp.maxHp, camp.currentHp + 30 * dt);
      }
    }

    // Check Death
    if (camp.currentHp <= 0) {
      camp.isAlive = false;
      camp.remainingRespawnTimer = camp.respawnTimeSeconds;
      mobaAudio.playLastHitGold();

      const killer = allHeroes.find((h) => h.id === camp.targetEntityId) || allHeroes[0];
      onCampKilled(camp, killer);
    }
  });
}
