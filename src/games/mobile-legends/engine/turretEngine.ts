import type { TurretEntity, MinionEntity, BaseCoreEntity } from '../types/map';
import type { ActiveHeroEntity } from '../types/hero';
import { mobaAudio } from './audioEngine';

export interface TurretShotEvent {
  turretId: string;
  sourcePos: { x: number; y: number; z: number };
  targetId: string;
  targetPos: { x: number; y: number; z: number };
  damage: number;
  color: string;
  team: 'blue' | 'red';
}

export function updateTurrets(
  turrets: TurretEntity[],
  cores: Record<'blue' | 'red', BaseCoreEntity>,
  allHeroes: ActiveHeroEntity[],
  allMinions: MinionEntity[],
  dt: number,
  onTurretDestroyed: (turret: TurretEntity) => void,
  onCoreDestroyed: (team: 'blue' | 'red') => void,
  onTurretShoot?: (event: TurretShotEvent) => void
) {
  turrets.forEach((turret) => {
    if (turret.isDestroyed) return;

    if (turret.currentHp <= 0) {
      turret.isDestroyed = true;
      turret.targetEntityId = null;
      mobaAudio.playTurretDestroyed();
      onTurretDestroyed(turret);
      return;
    }

    turret.attackCooldown = Math.max(0, turret.attackCooldown - dt);

    // Find targets within turret range
    const hostileTeam = turret.team === 'blue' ? 'red' : 'blue';

    // Hostile minions in range
    const hostileMinions = allMinions.filter(
      (m) =>
        !m.isDead &&
        m.team === hostileTeam &&
        Math.hypot(m.position.x - turret.position.x, m.position.z - turret.position.z) <= turret.range
    );

    // Hostile heroes in range (turret has true sight, but only attacks if alive)
    const hostileHeroes = allHeroes.filter(
      (h) =>
        h.state !== 'dead' &&
        h.team === hostileTeam &&
        Math.hypot(h.position.x - turret.position.x, h.position.z - turret.position.z) <= turret.range
    );

    // Priority 1: Minions first (standard MOBA wave diving protection)
    // Priority 2: Hostile heroes
    let chosenTarget: { id: string; position: { x: number; y: number; z: number }; isHero: boolean } | null = null;

    if (hostileMinions.length > 0) {
      // Pick closest minion
      hostileMinions.sort(
        (a, b) =>
          Math.hypot(a.position.x - turret.position.x, a.position.z - turret.position.z) -
          Math.hypot(b.position.x - turret.position.x, b.position.z - turret.position.z)
      );
      chosenTarget = { id: hostileMinions[0].id, position: { ...hostileMinions[0].position }, isHero: false };
    } else if (hostileHeroes.length > 0) {
      // Pick closest hero
      hostileHeroes.sort(
        (a, b) =>
          Math.hypot(a.position.x - turret.position.x, a.position.z - turret.position.z) -
          Math.hypot(b.position.x - turret.position.x, b.position.z - turret.position.z)
      );
      chosenTarget = { id: hostileHeroes[0].id, position: { ...hostileHeroes[0].position }, isHero: true };
    }

    turret.targetEntityId = chosenTarget ? chosenTarget.id : null;

    if (chosenTarget) {
      turret.laserProgress = (turret.laserProgress + dt * 2.0) % 1.0;

      // When attack cooldown expires, FIRE A POWERFUL HOMING PROJECTILE!
      if (turret.attackCooldown <= 0) {
        turret.attackCooldown = 1.3; // Attack every 1.3 seconds
        mobaAudio.playAttack('arrow');

        let dmg = turret.physicalAttack;
        if (chosenTarget.isHero) {
          turret.consecutiveHitsOnTarget += 1;
          const ramp = 1 + Math.min(1.5, turret.consecutiveHitsOnTarget * 0.25);
          dmg *= ramp;
        } else {
          turret.consecutiveHitsOnTarget = 0;
          dmg *= 1.4; // Bonus damage against minions
        }

        if (onTurretShoot) {
          onTurretShoot({
            turretId: turret.id,
            sourcePos: { x: turret.position.x, y: 5.2, z: turret.position.z },
            targetId: chosenTarget.id,
            targetPos: chosenTarget.position,
            damage: Math.round(dmg),
            color: turret.team === 'blue' ? '#38bdf8' : '#ef4444',
            team: turret.team,
          });
        }
      }
    } else {
      turret.consecutiveHitsOnTarget = 0;
      turret.laserProgress = 0;
    }
  });

  // Base Cores defense shots
  (['blue', 'red'] as const).forEach((team) => {
    const core = cores[team];
    if (core.isDestroyed) return;

    if (core.currentHp <= 0) {
      core.isDestroyed = true;
      mobaAudio.playTurretDestroyed();
      onCoreDestroyed(team);
      return;
    }

    const hostileTeam = team === 'blue' ? 'red' : 'blue';
    const hostileHeroes = allHeroes.filter(
      (h) =>
        h.state !== 'dead' &&
        h.team === hostileTeam &&
        Math.hypot(h.position.x - core.position.x, h.position.z - core.position.z) <= core.range
    );

    if (hostileHeroes.length > 0) {
      core.targetEntityId = hostileHeroes[0].id;
      hostileHeroes[0].currentHp -= core.physicalAttack * dt * 0.8;
    } else {
      core.targetEntityId = null;
    }
  });
}
