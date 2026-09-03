import {
  Entity,
  EntityType,
  HeroType,
  BattleAnnouncement,
  Shockwave,
  Particle,
  SlashArc,
  DamageText,
  Item,
  BattleScenario,
  MissionObjective,
  MobileInputState,
  Vector2,
  TacticalBase,
  MinimapData,
  ComboRank,
} from '../types';
import * as Constants from '../constants';
import { executePlayerAttack, executeMusouBlast, updateObjectiveProgress } from './battleEngine';
import { audioEngine } from '../services/audioEngine';

export function handlePlayerDash(
  player: Entity | null,
  shockwaves: Shockwave[],
  isPaused: boolean
) {
  if (!player || player.isDead || (player.dashTimer && player.dashTimer > 0) || isPaused) return;

  player.dashTimer = 16;
  const dashSpeed = 16;
  player.velocity.x += Math.cos(player.facing) * dashSpeed;
  player.velocity.y += Math.sin(player.facing) * dashSpeed;
  audioEngine.playDash();

  shockwaves.push({
    x: player.position.x,
    y: player.position.y,
    radius: 10,
    maxRadius: 70,
    color: '#38bdf8',
    life: 0,
    maxLife: 15,
  });
}

export function handlePlayerAttackAction(
  player: Entity | null,
  entities: Entity[],
  koCount: number,
  isMusouActive: boolean,
  objectives: MissionObjective[],
  damageTexts: DamageText[],
  particles: Particle[],
  slashes: SlashArc[],
  items: Item[],
  scenario: BattleScenario,
  isPaused: boolean,
  onScreenShake: (intensity: number, duration: number) => void,
  onAnnouncement?: (announcement: BattleAnnouncement) => void,
  onGameOver?: (victory: boolean) => void
): { newKoCount: number; newComboHits: number; musouDelta: number } {
  if (!player || player.isDead || player.attackCooldown > 0 || isPaused) {
    return { newKoCount: koCount, newComboHits: 0, musouDelta: 0 };
  }

  player.attackProgress = 1.0;
  const heroCfg = Constants.HERO_STATS[player.heroType || HeroType.GUAN_YU];
  player.attackCooldown = heroCfg.cooldown;
  audioEngine.playSwing();

  const res = executePlayerAttack(
    player,
    entities,
    koCount,
    isMusouActive,
    objectives,
    damageTexts,
    particles,
    slashes,
    items,
    scenario.bossName
  );

  let newComboHits = 0;
  let musouDelta = 0;

  if (res.hitCount > 0) {
    audioEngine.playHit(isMusouActive);
    onScreenShake(4, 5);
    newComboHits = res.hitCount;
    if (!isMusouActive) {
      musouDelta = res.hitCount * Constants.KILLS_TO_FILL_MUSOU;
    }
  }

  if (res.defeatedOfficer) {
    audioEngine.playFanfare();
    onAnnouncement?.({
      id: `officer_${Date.now()}`,
      title: 'ENEMY OFFICER DEFEATED!',
      subtitle: `${res.defeatedOfficer} has fallen to ${heroCfg.name}!`,
      type: 'officer_slain',
      color: '#eab308',
    });
  }

  if (res.newKoCount === 50 || res.newKoCount === 100 || res.newKoCount === 200) {
    audioEngine.playFanfare();
    onAnnouncement?.({
      id: `ko_${res.newKoCount}`,
      title: `${res.newKoCount} K.O. MILESTONE!`,
      subtitle: 'True Warrior of the Three Kingdoms!',
      type: 'milestone',
      color: '#38bdf8',
    });
  }

  if (res.won && onGameOver) onGameOver(true);

  return { newKoCount: res.newKoCount, newComboHits, musouDelta };
}

export function handlePlayerMusouAction(
  player: Entity | null,
  musouGauge: number,
  isMusouActive: boolean,
  entities: Entity[],
  shockwaves: Shockwave[],
  particles: Particle[],
  objectives: MissionObjective[],
  isPaused: boolean,
  onScreenShake: (intensity: number, duration: number) => void,
  onGameOver?: (victory: boolean) => void
): { activated: boolean; kills: number } {
  if (musouGauge < Constants.MUSOU_GAUGE_MAX || isMusouActive || isPaused || !player) {
    return { activated: false, kills: 0 };
  }

  audioEngine.playMusouBlast();
  onScreenShake(14, 18);

  const kills = executeMusouBlast(player, entities, shockwaves, particles);
  if (kills > 0) {
    const won = updateObjectiveProgress(objectives, 'kill_count', kills);
    if (won && onGameOver) onGameOver(true);
  }

  return { activated: true, kills };
}

export function updatePlayerMovement(
  player: Entity,
  keys: { [key: string]: boolean },
  mobileInput: MobileInputState | undefined,
  isMusouActive: boolean,
  camera: Vector2,
  onAttack: () => void,
  onMusou: () => void
) {
  let mx = 0;
  let my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;

  if (mobileInput?.active) {
    mx = mobileInput.moveVector.x;
    my = mobileInput.moveVector.y;
    if (mobileInput.isAttacking) onAttack();
    if (mobileInput.isMusou) onMusou();
  }

  const heroCfg = Constants.HERO_STATS[player.heroType || HeroType.GUAN_YU];
  const maxSpeed = heroCfg.speed * (isMusouActive ? 1.3 : 1.0);

  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    player.velocity.x += (mx / len) * 0.9;
    player.velocity.y += (my / len) * 0.9;
    player.facing = Math.atan2(my, mx);
    player.walkFrame += 0.2;
  }

  player.velocity.x *= 0.82;
  player.velocity.y *= 0.82;
  const currentSpeed = Math.hypot(player.velocity.x, player.velocity.y);
  if (currentSpeed > maxSpeed && (!player.dashTimer || player.dashTimer <= 0)) {
    player.velocity.x = (player.velocity.x / currentSpeed) * maxSpeed;
    player.velocity.y = (player.velocity.y / currentSpeed) * maxSpeed;
  }

  player.position.x = Math.max(100, Math.min(Constants.WORLD_SIZE - 100, player.position.x + player.velocity.x));
  player.position.y = Math.max(100, Math.min(Constants.WORLD_SIZE - 100, player.position.y + player.velocity.y));

  if (player.dashTimer && player.dashTimer > 0) player.dashTimer--;
  if (player.hitFlashTimer && player.hitFlashTimer > 0) player.hitFlashTimer--;
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.attackProgress > 0) player.attackProgress = Math.max(0, player.attackProgress - 0.1);

  camera.x += (player.position.x - camera.x) * 0.1;
  camera.y += (player.position.y - camera.y) * 0.1;
}

export function createLiveMinimapData(
  player: Entity | null,
  entities: Entity[],
  bases: TacticalBase[],
  items: Item[],
  camera: Vector2
): MinimapData {
  return {
    playerX: player ? player.position.x : 600,
    playerY: player ? player.position.y : 600,
    worldSize: Constants.WORLD_SIZE,
    enemies: entities
      .filter((e) => !e.isAllied && !e.isDead)
      .map((e) => ({
        x: e.position.x,
        y: e.position.y,
        isBoss: e.type === EntityType.BOSS || e.type === EntityType.ENEMY_CAPTAIN,
      })),
    bases,
    items: items.map((it) => ({ x: it.x, y: it.y })),
    cameraX: camera.x,
    cameraY: camera.y,
    viewWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
    viewHeight: typeof window !== 'undefined' ? window.innerHeight : 720,
  };
}

export function resolveRankAndWeapon(
  comboCount: number,
  koCount: number,
  heroType: HeroType
): { rank: ComboRank; weaponName: string } {
  let rank: ComboRank = 'D';
  for (const r of Constants.COMBO_RANKS) {
    if (comboCount >= r.threshold) {
      rank = r.rank;
      break;
    }
  }

  const tiers = Constants.WEAPON_TIERS[heroType || HeroType.GUAN_YU];
  let weaponName = tiers[0]?.name || 'Iron Blade';
  for (const t of tiers) {
    if (koCount >= t.kills) weaponName = t.name;
  }

  return { rank, weaponName };
}
