import {
  BattleScenario,
  DifficultyLevel,
  BattleAnnouncement,
  BaseAffiliation,
  ItemType,
} from '../types';
import {
  spawnBoss3D,
  dropItem3D,
  type Dynasty3DWorldState,
} from './dynasty3dEngine';
import { audioEngine } from '../services/audioEngine';

export function updateProjectilesAndHazards(
  world: Dynasty3DWorldState,
  dt: number,
  godMode: boolean
) {
  const player = world.player;

  // Update Flying Arrows
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

  // Update Fire Zones
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

  // Update Visual Effects lifetimes
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
}

export function updateBaseCapturing(
  world: Dynasty3DWorldState,
  dt: number,
  onAnnouncement?: (announcement: BattleAnnouncement) => void
) {
  const player = world.player;

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
}

export function updateItemPickups(world: Dynasty3DWorldState, dt: number) {
  const player = world.player;

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
}

export function checkBossSpawnCondition(
  world: Dynasty3DWorldState,
  scenario: BattleScenario,
  selectedDifficulty: DifficultyLevel,
  onAnnouncement?: (announcement: BattleAnnouncement) => void
) {
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
}
