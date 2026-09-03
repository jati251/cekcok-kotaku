import {
  Entity,
  EntityType,
  MapProp,
  PropType,
  Item,
  ItemType,
  HeroType,
  TacticalBase,
  BaseAffiliation,
  BattleScenario,
  MissionObjective,
  DamageText,
  Shockwave,
  Particle,
  SlashArc,
} from '../types';
import * as Constants from '../constants';
export * from './enemySpawners';

export function generateBattlefieldProps(scenario: BattleScenario): MapProp[] {
  const props: MapProp[] = [];
  let id = 1;

  for (const base of scenario.bases) {
    props.push({
      id: `torch_${id++}`,
      type: PropType.TORCH,
      x: base.x - 45,
      y: base.y - 35,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `torch_${id++}`,
      type: PropType.TORCH,
      x: base.x + 45,
      y: base.y - 35,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `barricade_${id++}`,
      type: PropType.BARRICADE,
      x: base.x - 70,
      y: base.y + 30,
      width: 40,
      height: 20,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `barricade_${id++}`,
      type: PropType.BARRICADE,
      x: base.x + 70,
      y: base.y + 30,
      width: 40,
      height: 20,
      scale: 1,
      variant: 0,
    });
  }

  const size = Constants.WORLD_SIZE;
  for (let i = 0; i < 40; i++) {
    props.push({
      id: `tree_${id++}`,
      type: PropType.TREE,
      x: Math.random() * (size - 400) + 200,
      y: Math.random() * (size - 400) + 200,
      width: 50 + Math.random() * 25,
      height: 60,
      scale: 0.9 + Math.random() * 0.3,
      variant: Math.floor(Math.random() * 3),
    });
  }

  for (let i = 0; i < 25; i++) {
    props.push({
      id: `rock_${id++}`,
      type: PropType.ROCK,
      x: Math.random() * (size - 400) + 200,
      y: Math.random() * (size - 400) + 200,
      width: 25 + Math.random() * 20,
      height: 20,
      scale: 1,
      variant: 0,
    });
  }

  return props;
}

export function updateObjectiveProgress(
  objectives: MissionObjective[],
  type: 'kill_count' | 'capture_base' | 'boss',
  delta: number = 1,
  targetId?: string
): boolean {
  let allDone = true;
  for (const obj of objectives) {
    if (!obj.completed && obj.type === type) {
      if (!targetId || obj.targetId === targetId) {
        obj.currentCount = Math.min(obj.targetCount, obj.currentCount + delta);
        if (obj.currentCount >= obj.targetCount) {
          obj.completed = true;
        }
      }
    }
    if (!obj.completed) allDone = false;
  }
  return allDone;
}

export function calculateArmyMorale(
  bases: TacticalBase[],
  koCount: number
): { allied: number; enemy: number } {
  let alliedScore = 30 + Math.min(30, koCount * 0.3);
  let enemyScore = 50;

  for (const base of bases) {
    if (base.affiliation === BaseAffiliation.ALLIED) {
      alliedScore += 20;
    } else if (base.affiliation === BaseAffiliation.ENEMY) {
      enemyScore += 15;
    }
  }

  const total = alliedScore + enemyScore;
  const alliedPct = Math.max(10, Math.min(90, (alliedScore / total) * 100));
  return { allied: alliedPct, enemy: 100 - alliedPct };
}

export function executePlayerAttack(
  player: Entity,
  entities: Entity[],
  koCount: number,
  isMusou: boolean,
  objectives: MissionObjective[],
  damageTexts: DamageText[],
  particles: Particle[],
  slashes: SlashArc[],
  items: Item[],
  bossName: string
): { hitCount: number; newKoCount: number; won: boolean; defeatedOfficer?: string } {
  const tiers = Constants.WEAPON_TIERS[player.heroType || HeroType.GUAN_YU];
  let activeTier = tiers[0];
  for (const t of tiers) {
    if (koCount >= t.kills) activeTier = t;
  }

  const heroStats = Constants.HERO_STATS[player.heroType || HeroType.GUAN_YU];
  const reach = activeTier.range;
  const dmg = activeTier.damage * (isMusou ? 2.2 : 1.0);
  let hitCount = 0;
  let currentKo = koCount;
  let won = false;
  let defeatedOfficer: string | undefined;

  slashes.push({
    x: player.position.x,
    y: player.position.y,
    angle: player.facing,
    radius: reach * 0.8,
    arcLength: Math.PI * 0.9,
    color: heroStats.accentColor,
    life: 0,
    maxLife: 10,
  });

  for (const e of entities) {
    if (e.isAllied || e.isDead) continue;
    const dx = e.position.x - player.position.x;
    const dy = e.position.y - player.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist < reach + e.radius) {
      // Shield guards block 60% of damage from the front unless hit by Musou
      let actualDmg = dmg;
      if (e.type === EntityType.ENEMY_SHIELD && !isMusou) {
        actualDmg *= 0.4;
      }

      e.health -= actualDmg;
      hitCount++;

      const impactAngle = Math.atan2(dy, dx);
      const knockback = (isMusou ? 15 : 8) / (e.type === EntityType.BOSS ? 3 : 1);
      e.velocity.x += Math.cos(impactAngle) * knockback;
      e.velocity.y += Math.sin(impactAngle) * knockback;
      e.hitFlashTimer = 6;
      e.hitStunTimer = 12;

      for (let i = 0; i < 4; i++) {
        const pAngle = impactAngle + (Math.random() - 0.5) * 1.5;
        const pSpeed = 3 + Math.random() * 5;
        particles.push({
          x: e.position.x,
          y: e.position.y,
          vx: Math.cos(pAngle) * pSpeed,
          vy: Math.sin(pAngle) * pSpeed,
          color: Math.random() < 0.6 ? '#fbbf24' : '#ef4444',
          size: 2 + Math.random() * 3,
          life: 14 + Math.random() * 10,
          maxLife: 24,
        });
      }

      damageTexts.push({
        x: e.position.x,
        y: e.position.y - 18,
        text: Math.round(actualDmg).toString(),
        life: 30,
        color: isMusou ? Constants.COLORS.TEXT_CRIT : Constants.COLORS.TEXT_DAMAGE,
      });

      if (e.health <= 0) {
        e.isDead = true;
        e.deathTimer = 45; // 45 frames airborne tumble & fade
        e.velocity.x += Math.cos(impactAngle) * 12;
        e.velocity.y += Math.sin(impactAngle) * 12;
        currentKo++;

        if (e.type === EntityType.BOSS || e.type === EntityType.ENEMY_CAPTAIN) {
          defeatedOfficer = e.label;
        }

        const isObjectiveWon = updateObjectiveProgress(objectives, 'kill_count', 1);
        if (e.type === EntityType.BOSS) {
          updateObjectiveProgress(objectives, 'boss', 1, bossName);
          won = true;
        }
        if (isObjectiveWon) won = true;

        if (Math.random() < Constants.DROP_CHANCE_HEALTH || e.type === EntityType.BOSS) {
          items.push({
            id: `item_${Date.now()}_${Math.random()}`,
            type: Math.random() < 0.35 ? ItemType.WINE_MUSOU : ItemType.HEALTH_BUN,
            x: e.position.x,
            y: e.position.y,
            bouncePhase: 0,
          });
        }
      }
    }
  }

  return { hitCount, newKoCount: currentKo, won, defeatedOfficer };
}

export function executeMusouBlast(
  player: Entity,
  entities: Entity[],
  shockwaves: Shockwave[],
  particles: Particle[]
): number {
  shockwaves.push({
    x: player.position.x,
    y: player.position.y,
    radius: 20,
    maxRadius: 320,
    color: '#fbbf24',
    life: 0,
    maxLife: 40,
  });

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const speed = 5 + Math.random() * 6;
    particles.push({
      x: player.position.x,
      y: player.position.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#fef08a',
      size: 3 + Math.random() * 3,
      life: 25,
      maxLife: 25,
    });
  }

  let kills = 0;
  for (const e of entities) {
    if (e.isAllied || e.isDead) continue;
    const dist = Math.hypot(e.position.x - player.position.x, e.position.y - player.position.y);
    if (dist < 320) {
      e.health -= 150;
      const angle = Math.atan2(e.position.y - player.position.y, e.position.x - player.position.x);
      e.velocity.x += Math.cos(angle) * 16;
      e.velocity.y += Math.sin(angle) * 16;
      e.hitFlashTimer = 10;
      e.hitStunTimer = 20;

      if (e.health <= 0) {
        e.isDead = true;
        e.deathTimer = 45;
        kills++;
      }
    }
  }
  return kills;
}

export function executeEnemyCombat(
  entities: Entity[],
  player: Entity,
  damageTexts: DamageText[],
  onGameOver: (won: boolean) => void,
  onScreenShake: (intensity: number, duration: number) => void
) {
  for (const e of entities) {
    if (e.isDead || e.type === EntityType.PLAYER) continue;

    // Knockback deceleration
    e.position.x += e.velocity.x;
    e.position.y += e.velocity.y;
    e.velocity.x *= 0.82;
    e.velocity.y *= 0.82;

    if (e.hitFlashTimer && e.hitFlashTimer > 0) e.hitFlashTimer--;
    if (e.hitStunTimer && e.hitStunTimer > 0) {
      e.hitStunTimer--;
      continue;
    }

    if (e.attackCooldown > 0) e.attackCooldown--;
    if (e.attackProgress > 0) e.attackProgress = Math.max(0, e.attackProgress - 0.1);

    if (e.isAllied) continue;

    const dx = player.position.x - e.position.x;
    const dy = player.position.y - e.position.y;
    const dist = Math.hypot(dx, dy);

    const isRanged = e.type === EntityType.ENEMY_ARCHER || e.type === EntityType.ENEMY_SORCERER;
    const isBomber = e.type === EntityType.ENEMY_BOMBER;
    const attackReach = isRanged ? 220 : isBomber ? 140 : e.type === EntityType.BOSS ? 52 : 38;
    const minDistance = e.radius + player.radius + attackReach;

    if (dist > minDistance) {
      const speed = e.type === EntityType.ENEMY_CAVALRY ? Constants.ENEMY_SPEED * 1.5 : Constants.ENEMY_SPEED;
      e.position.x += (dx / dist) * speed;
      e.position.y += (dy / dist) * speed;
      e.facing = Math.atan2(dy, dx);
      e.walkFrame += 0.18;
    } else {
      e.facing = Math.atan2(dy, dx);
      if (e.attackCooldown <= 0 && !player.isDead) {
        e.attackCooldown = isRanged ? 60 : 40;
        e.attackProgress = 1.0;

        const baseDmg = e.type === EntityType.BOSS ? 22 : e.type === EntityType.ENEMY_CAPTAIN ? 14 : 7;
        player.health = Math.max(0, player.health - baseDmg);
        player.hitFlashTimer = 6;
        onScreenShake(6, 6);

        damageTexts.push({
          x: player.position.x + (Math.random() - 0.5) * 20,
          y: player.position.y - 20,
          text: `-${baseDmg}`,
          life: 30,
          color: '#ef4444',
        });

        if (player.health <= 0) {
          player.isDead = true;
          player.deathTimer = 45;
          onGameOver(false);
          return;
        }
      }
    }
  }
}

export function updateDeadEntities(entities: Entity[]): Entity[] {
  for (const e of entities) {
    if (e.isDead && e.deathTimer > 0) {
      e.deathTimer--;
      e.position.x += e.velocity.x;
      e.position.y += e.velocity.y;
      e.velocity.x *= 0.85;
      e.velocity.y *= 0.85;
    }
  }
  return entities.filter((e) => !e.isDead || e.deathTimer > 0);
}

export function applyHordeSeparationPhysics(entities: Entity[]) {
  const len = entities.length;
  for (let i = 0; i < len; i++) {
    const e1 = entities[i];
    if (e1.isDead) continue;

    for (let j = i + 1; j < len; j++) {
      const e2 = entities[j];
      if (e2.isDead) continue;

      const dx = e2.position.x - e1.position.x;
      const dy = e2.position.y - e1.position.y;
      const dist = Math.hypot(dx, dy);
      const minDist = e1.radius + e2.radius;

      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) * 0.28;
        const nx = dx / dist;
        const ny = dy / dist;

        e1.position.x -= nx * overlap;
        e1.position.y -= ny * overlap;
        e2.position.x += nx * overlap;
        e2.position.y += ny * overlap;
      }
    }
  }
}
