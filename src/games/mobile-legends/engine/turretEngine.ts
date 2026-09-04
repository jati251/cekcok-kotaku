import type { TurretEntity, MinionEntity, BaseCoreEntity } from '../types/map';
import type { ActiveHeroEntity } from '../types/hero';
import { mobaAudio } from './audioEngine';

export function updateTurrets(
  turrets: TurretEntity[],
  cores: Record<'blue' | 'red', BaseCoreEntity>,
  allHeroes: ActiveHeroEntity[],
  allMinions: MinionEntity[],
  dt: number,
  onTurretDestroyed: (turret: TurretEntity) => void,
  onCoreDestroyed: (team: 'blue' | 'red') => void
) {
  turrets.forEach((turret) => {
    if (turret.isDestroyed) return;

    if (turret.currentHp <= 0) {
      turret.isDestroyed = true;
      mobaAudio.playTurretDestroyed();
      onTurretDestroyed(turret);
      return;
    }

    // Find targets within turret range
    const hostileTeam = turret.team === 'blue' ? 'red' : 'blue';
    const hostileMinions = allMinions.filter(
      (m) => !m.isDead && m.team === hostileTeam && Math.hypot(m.position.x - turret.position.x, m.position.z - turret.position.z) <= turret.range
    );
    const hostileHeroes = allHeroes.filter(
      (h) => h.state !== 'dead' && h.team === hostileTeam && Math.hypot(h.position.x - turret.position.x, h.position.z - turret.position.z) <= turret.range
    );

    // Target priority: Minions first to protect heroes, unless an enemy hero attacks an ally
    let chosenTargetId: string | null = null;
    if (hostileMinions.length > 0) {
      chosenTargetId = hostileMinions[0].id;
    } else if (hostileHeroes.length > 0) {
      chosenTargetId = hostileHeroes[0].id;
    }

    turret.targetEntityId = chosenTargetId;

    if (chosenTargetId) {
      turret.laserProgress = (turret.laserProgress + dt * 1.5) % 1.0;
      // Fire tick
      const targetMinion = hostileMinions.find((m) => m.id === chosenTargetId);
      const targetHero = hostileHeroes.find((h) => h.id === chosenTargetId);

      if (targetMinion) {
        targetMinion.currentHp -= turret.physicalAttack * dt * 1.2;
        if (targetMinion.currentHp <= 0) targetMinion.isDead = true;
      } else if (targetHero) {
        // Consecutive hits ramp damage
        turret.consecutiveHitsOnTarget += dt;
        const rampMult = 1 + Math.min(1.5, turret.consecutiveHitsOnTarget * 0.3);
        targetHero.currentHp -= turret.physicalAttack * rampMult * dt * 0.8;
      }
    } else {
      turret.consecutiveHitsOnTarget = 0;
      turret.laserProgress = 0;
    }
  });

  // Check Base Cores
  (['blue', 'red'] as const).forEach((team) => {
    const core = cores[team];
    if (core.isDestroyed) return;

    if (core.currentHp <= 0) {
      core.isDestroyed = true;
      mobaAudio.playTurretDestroyed();
      onCoreDestroyed(team);
      return;
    }

    // Core also fires on enemies within range
    const hostileTeam = team === 'blue' ? 'red' : 'blue';
    const hostileHeroes = allHeroes.filter(
      (h) => h.state !== 'dead' && h.team === hostileTeam && Math.hypot(h.position.x - core.position.x, h.position.z - core.position.z) <= core.range
    );
    if (hostileHeroes.length > 0) {
      core.targetEntityId = hostileHeroes[0].id;
      hostileHeroes[0].currentHp -= core.physicalAttack * dt * 0.8;
    } else {
      core.targetEntityId = null;
    }
  });
}
