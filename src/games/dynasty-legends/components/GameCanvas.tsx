import React, { useRef, useEffect } from 'react';
import {
  Entity,
  EntityType,
  Particle,
  DamageText,
  GameStatus,
  Vector2,
  MapProp,
  Item,
  HeroType,
  MobileInputState,
  DifficultyLevel,
  BattleScenario,
  TacticalBase,
  BaseAffiliation,
  Shockwave,
  SlashArc,
  ComboRank,
  MissionObjective,
} from '../types';
import * as Constants from '../constants';
import {
  createPlayerEntity,
  spawnAlliedSoldier,
  spawnEnemyGrunt,
  spawnEnemyCaptain,
  spawnBossEntity,
  generateBattlefieldProps,
  updateObjectiveProgress,
  calculateArmyMorale,
  executePlayerAttack,
  executeMusouBlast,
  applyHordeSeparationPhysics,
} from './battleEngine';
import {
  updateCombatEffects,
  handleItemPickups,
  renderBattlefieldScene,
} from './combatEffects';

interface GameCanvasProps {
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
    weaponName?: string
  ) => void;
  onGameOver: (victory: boolean) => void;
  mobileInputRef?: React.MutableRefObject<MobileInputState>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  selectedHero,
  selectedDifficulty,
  scenario,
  onUpdateStats,
  onGameOver,
  mobileInputRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playerRef = useRef<Entity | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const propsRef = useRef<MapProp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const slashesRef = useRef<SlashArc[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const damageTextsRef = useRef<DamageText[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const basesRef = useRef<TacticalBase[]>([]);
  const objectivesRef = useRef<MissionObjective[]>([]);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraRef = useRef<Vector2>({ x: 600, y: 600 });
  const screenShakeRef = useRef({ intensity: 0, duration: 0 });
  const timeRef = useRef(0);
  const waveTimerRef = useRef(0);
  const isMusouActiveRef = useRef(false);
  const musouGaugeRef = useRef(0);
  const koCountRef = useRef(0);
  const bossSpawnedRef = useRef(false);

  const comboCountRef = useRef(0);
  const comboTimerRef = useRef(0);

  // Initialize Game World
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    basesRef.current = JSON.parse(JSON.stringify(scenario.bases));
    objectivesRef.current = JSON.parse(JSON.stringify(scenario.objectives));
    propsRef.current = generateBattlefieldProps(scenario);

    const alliedBase = scenario.bases.find((b) => b.affiliation === BaseAffiliation.ALLIED);
    const startPos = alliedBase ? { x: alliedBase.x, y: alliedBase.y } : { x: 600, y: 600 };

    const player = createPlayerEntity(selectedHero, startPos);
    playerRef.current = player;
    cameraRef.current = { ...startPos };

    entitiesRef.current = [player];

    for (let i = 0; i < 8; i++) {
      entitiesRef.current.push(spawnAlliedSoldier(`ally_${i}`, startPos));
    }

    let eid = 100;
    for (const base of scenario.bases) {
      if (base.affiliation === BaseAffiliation.ENEMY) {
        entitiesRef.current.push(spawnEnemyCaptain(`cap_${eid++}`, { x: base.x, y: base.y }, selectedDifficulty));
        for (let j = 0; j < 5; j++) {
          entitiesRef.current.push(
            spawnEnemyGrunt(
              `grunt_${eid++}`,
              { x: base.x + (Math.random() - 0.5) * 80, y: base.y + (Math.random() - 0.5) * 80 },
              selectedDifficulty
            )
          );
        }
      }
    }

    particlesRef.current = [];
    slashesRef.current = [];
    shockwavesRef.current = [];
    musouGaugeRef.current = 0;
    koCountRef.current = 0;
    bossSpawnedRef.current = false;
    comboCountRef.current = 0;
  }, [status, scenario, selectedHero, selectedDifficulty]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        triggerMusou();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) triggerAttack();
      if (e.button === 2) {
        e.preventDefault();
        triggerMusou();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const triggerAttack = () => {
    const player = playerRef.current;
    if (!player || player.isDead || player.attackCooldown > 0) return;

    player.attackProgress = 1.0;
    const heroCfg = Constants.HERO_STATS[player.heroType || HeroType.GUAN_YU];
    player.attackCooldown = heroCfg.cooldown;

    const res = executePlayerAttack(
      player,
      entitiesRef.current,
      koCountRef.current,
      isMusouActiveRef.current,
      objectivesRef.current,
      damageTextsRef.current,
      particlesRef.current,
      slashesRef.current,
      itemsRef.current,
      scenario.bossName
    );

    if (res.hitCount > 0) {
      screenShakeRef.current = { intensity: 4, duration: 5 };
      comboCountRef.current += res.hitCount;
      comboTimerRef.current = 120;
      if (!isMusouActiveRef.current) {
        musouGaugeRef.current = Math.min(
          Constants.MUSOU_GAUGE_MAX,
          musouGaugeRef.current + res.hitCount * Constants.KILLS_TO_FILL_MUSOU
        );
      }
    }

    koCountRef.current = res.newKoCount;
    if (res.won) onGameOver(true);
  };

  const triggerMusou = () => {
    if (musouGaugeRef.current < Constants.MUSOU_GAUGE_MAX || isMusouActiveRef.current) return;
    isMusouActiveRef.current = true;
    screenShakeRef.current = { intensity: 14, duration: 18 };

    const player = playerRef.current;
    if (player) {
      const kills = executeMusouBlast(player, entitiesRef.current, shockwavesRef.current, particlesRef.current);
      koCountRef.current += kills;
      if (kills > 0) {
        const won = updateObjectiveProgress(objectivesRef.current, 'kill_count', kills);
        if (won) onGameOver(true);
      }
    }
  };

  // Main Loop
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const loop = () => {
      timeRef.current += 0.016;
      const player = playerRef.current;

      // Handle screen shake
      if (screenShakeRef.current.duration > 0) {
        screenShakeRef.current.duration--;
      }

      // Handle Player Movement with momentum
      if (player && !player.isDead) {
        let mx = 0;
        let my = 0;
        if (keysRef.current['w'] || keysRef.current['arrowup']) my -= 1;
        if (keysRef.current['s'] || keysRef.current['arrowdown']) my += 1;
        if (keysRef.current['a'] || keysRef.current['arrowleft']) mx -= 1;
        if (keysRef.current['d'] || keysRef.current['arrowright']) mx += 1;

        if (mobileInputRef?.current?.active) {
          mx = mobileInputRef.current.moveVector.x;
          my = mobileInputRef.current.moveVector.y;
          if (mobileInputRef.current.isAttacking) triggerAttack();
          if (mobileInputRef.current.isMusou) triggerMusou();
        }

        const heroCfg = Constants.HERO_STATS[player.heroType || HeroType.GUAN_YU];
        const maxSpeed = heroCfg.speed * (isMusouActiveRef.current ? 1.3 : 1.0);

        if (mx !== 0 || my !== 0) {
          const len = Math.hypot(mx, my);
          player.velocity.x += (mx / len) * 0.9;
          player.velocity.y += (my / len) * 0.9;
          player.facing = Math.atan2(my, mx);
          player.walkFrame += 0.2;
        }

        // Apply friction & speed clamp
        player.velocity.x *= 0.82;
        player.velocity.y *= 0.82;
        const currentSpeed = Math.hypot(player.velocity.x, player.velocity.y);
        if (currentSpeed > maxSpeed) {
          player.velocity.x = (player.velocity.x / currentSpeed) * maxSpeed;
          player.velocity.y = (player.velocity.y / currentSpeed) * maxSpeed;
        }

        player.position.x = Math.max(100, Math.min(Constants.WORLD_SIZE - 100, player.position.x + player.velocity.x));
        player.position.y = Math.max(100, Math.min(Constants.WORLD_SIZE - 100, player.position.y + player.velocity.y));

        if (player.attackCooldown > 0) player.attackCooldown--;
        if (player.attackProgress > 0) player.attackProgress = Math.max(0, player.attackProgress - 0.1);

        cameraRef.current.x += (player.position.x - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (player.position.y - cameraRef.current.y) * 0.1;

        if (isMusouActiveRef.current) {
          musouGaugeRef.current -= Constants.MUSOU_DRAIN_RATE;
          if (musouGaugeRef.current <= 0) {
            musouGaugeRef.current = 0;
            isMusouActiveRef.current = false;
          }
        }
      }

      if (comboTimerRef.current > 0) {
        comboTimerRef.current--;
        if (comboTimerRef.current <= 0) comboCountRef.current = 0;
      }

      // Base Captures Check
      for (const base of basesRef.current) {
        if (base.affiliation === BaseAffiliation.ENEMY && player) {
          if (Math.hypot(player.position.x - base.x, player.position.y - base.y) < base.radius) {
            base.defenseHp -= 0.6;
            if (base.defenseHp <= 0) {
              base.affiliation = BaseAffiliation.ALLIED;
              base.defenseHp = base.maxDefenseHp;
              const won = updateObjectiveProgress(objectivesRef.current, 'capture_base', 1, base.id);
              if (won) onGameOver(true);
            }
          }
        }
      }

      // Boss Spawn Check
      if (!bossSpawnedRef.current && (koCountRef.current >= 25 || objectivesRef.current[0]?.completed)) {
        bossSpawnedRef.current = true;
        const citadel = basesRef.current.find((b) => b.id === 'base_citadel') || { x: 2800, y: 2800 };
        entitiesRef.current.push(spawnBossEntity('boss', scenario.bossName, citadel, selectedDifficulty));
      }

      // Wave Spawns
      waveTimerRef.current++;
      if (waveTimerRef.current > Constants.WAVE_INTERVAL && entitiesRef.current.length < Constants.MAX_ENEMIES) {
        waveTimerRef.current = 0;
        const enemyBase = basesRef.current.find((b) => b.affiliation === BaseAffiliation.ENEMY);
        if (enemyBase) {
          for (let i = 0; i < 4; i++) {
            entitiesRef.current.push(
              spawnEnemyGrunt(
                `wave_${Date.now()}_${i}`,
                { x: enemyBase.x + (Math.random() - 0.5) * 100, y: enemyBase.y + (Math.random() - 0.5) * 100 },
                selectedDifficulty
              )
            );
          }
        }
      }

      // Apply Enemy Flock Separation Physics
      applyHordeSeparationPhysics(entitiesRef.current);

      // Enemy & Ally Movement & Knockback Deceleration
      for (const e of entitiesRef.current) {
        if (e.isDead || e.type === EntityType.PLAYER) continue;

        // Apply knockback velocity & friction
        e.position.x += e.velocity.x;
        e.position.y += e.velocity.y;
        e.velocity.x *= 0.82;
        e.velocity.y *= 0.82;

        if (e.hitFlashTimer && e.hitFlashTimer > 0) e.hitFlashTimer--;
        if (e.hitStunTimer && e.hitStunTimer > 0) {
          e.hitStunTimer--;
          continue; // Stunned enemies cannot move or attack!
        }

        const target = player;
        if (target && !e.isAllied) {
          const dx = target.position.x - e.position.x;
          const dy = target.position.y - e.position.y;
          const dist = Math.hypot(dx, dy);

          if (dist > e.radius + 15) {
            e.position.x += (dx / dist) * Constants.ENEMY_SPEED;
            e.position.y += (dy / dist) * Constants.ENEMY_SPEED;
            e.facing = Math.atan2(dy, dx);
            e.walkFrame += 0.15;
          } else if (e.attackCooldown <= 0) {
            e.attackCooldown = 40;
            e.attackProgress = 1.0;
            target.health = Math.max(0, target.health - 6);
            if (target.health <= 0) {
              target.isDead = true;
              onGameOver(false);
            }
          }
        }
        if (e.attackCooldown > 0) e.attackCooldown--;
        if (e.attackProgress > 0) e.attackProgress -= 0.1;
      }

      // Update Particles, Blade Slashes, Shockwaves & Items
      const effects = updateCombatEffects(particlesRef.current, slashesRef.current, shockwavesRef.current);
      particlesRef.current = effects.activeParticles;
      slashesRef.current = effects.activeSlashes;
      shockwavesRef.current = effects.activeShockwaves;

      if (player && !player.isDead) {
        itemsRef.current = handleItemPickups(player, itemsRef.current, () => {
          musouGaugeRef.current = Constants.MUSOU_GAUGE_MAX;
        });
      }

      // Morale, Objectives, and Weapon Stats
      const morale = calculateArmyMorale(basesRef.current, koCountRef.current);
      let rank: ComboRank = 'D';
      for (const r of Constants.COMBO_RANKS) {
        if (comboCountRef.current >= r.threshold) {
          rank = r.rank;
          break;
        }
      }

      const activeObjective = objectivesRef.current.find((o) => !o.completed);
      const tiers = Constants.WEAPON_TIERS[player?.heroType || HeroType.GUAN_YU];
      let activeWeapon = tiers[0]?.name;
      for (const t of tiers) {
        if (koCountRef.current >= t.kills) activeWeapon = t.name;
      }

      onUpdateStats(
        player ? player.health : 0,
        musouGaugeRef.current,
        koCountRef.current,
        morale.allied,
        morale.enemy,
        activeObjective,
        comboCountRef.current,
        rank,
        activeWeapon
      );

      // --- RENDERING PASS ---
      ctx.fillStyle = Constants.MAP_THEMES[scenario.mapTheme].groundBase;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current.duration > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current.intensity;
      }

      const camX = cameraRef.current.x + shakeX;
      const camY = cameraRef.current.y + shakeY;

      renderBattlefieldScene(
        ctx,
        camX,
        camY,
        basesRef.current,
        propsRef.current,
        itemsRef.current,
        entitiesRef.current,
        slashesRef.current,
        particlesRef.current,
        shockwavesRef.current,
        scenario.mapTheme,
        timeRef.current,
        isMusouActiveRef.current
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [status, scenario, selectedHero, selectedDifficulty]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="absolute inset-0 w-full h-full block cursor-crosshair"
    />
  );
};
