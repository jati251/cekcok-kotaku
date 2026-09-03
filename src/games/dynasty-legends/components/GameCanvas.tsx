
import React, { useRef, useEffect, useCallback } from 'react';
import { Entity, EntityType, Particle, DamageText, GameStatus, Vector2, MapProp, PropType, Item, ItemType, HeroType, Projectile, MobileInputState, DifficultyLevel, MapTheme } from '../types';
import * as Constants from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  selectedHero: HeroType;
  selectedDifficulty: DifficultyLevel;
  onUpdateStats: (hp: number, musou: number, ko: number) => void;
  onGameOver: (victory: boolean) => void;
  bossName: string;
  requiredKills: number;
  mobileInputRef?: React.MutableRefObject<MobileInputState>;
  mapTheme?: MapTheme;
}

const ZOOM_LEVEL = 2.2;

const LABEL_COLORS: Record<string, string> = {
  player: '#3b82f6',
  grunt: '#ef4444',
  archer: '#f59e0b',
  captain: '#ec4899',
  cavalry: '#8b5cf6',
  boss: '#fbbf24',
};

const ENTITY_LABELS: Record<EntityType, string> = {
  [EntityType.PLAYER]: '',
  [EntityType.ENEMY_GRUNT]: 'Grunt',
  [EntityType.ENEMY_ARCHER]: 'Archer',
  [EntityType.ENEMY_CAPTAIN]: 'Captain',
  [EntityType.ENEMY_CAVALRY]: 'Cavalry',
  [EntityType.BOSS]: '',
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ status, selectedHero, selectedDifficulty, onUpdateStats, onGameOver, bossName, requiredKills, mobileInputRef, mapTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  
  const entitiesRef = useRef<Entity[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const propsRef = useRef<MapProp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageTextsRef = useRef<DamageText[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const playerRef = useRef<Entity | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  const mouseRef = useRef<Vector2>({ x: 0, y: 0 });
  const mouseWorldRef = useRef<Vector2>({ x: 0, y: 0 });
  
  const statsRef = useRef({ hp: 0, musou: 0, ko: 0 });
  const waveTimerRef = useRef(0);
  const isMusouActiveRef = useRef(false);
  const timeRef = useRef(0);
  const cameraRef = useRef<Vector2>({ x: Constants.WORLD_SIZE / 2, y: Constants.WORLD_SIZE / 2 });
  const bossSpawnedRef = useRef(false);
  const gameTimeRef = useRef(0);
  const difficultyRef = useRef(selectedDifficulty);
  const screenShakeRef = useRef({ intensity: 0, duration: 0 });
  const themeRef = useRef<MapTheme>(mapTheme || MapTheme.GRASSLAND);
  // Performance: counter IDs instead of Date.now()
  const idCounter = useRef(0);

  const bossStateRef = useRef<{
    lastChargeTime: number;
    lastAoeTime: number;
    lastSummonTime: number;
    attackPattern: number;
    phase: number;
  }>({ lastChargeTime: 0, lastAoeTime: 0, lastSummonTime: 0, attackPattern: 0, phase: 0 });

  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const getDifficulty = () => Constants.DIFFICULTY_CONFIGS[difficultyRef.current];
  const getTheme = () => Constants.MAP_THEMES[themeRef.current];

  const toScreen = (x: number, y: number, z: number = 0): Vector2 => {
      const cam = cameraRef.current;
      const shake = screenShakeRef.current;
      let shakeX = 0, shakeY = 0;
      if (shake.duration > 0) {
        shakeX = (Math.random() - 0.5) * shake.intensity;
        shakeY = (Math.random() - 0.5) * shake.intensity;
      }
      const cx = window.innerWidth / 2 + shakeX;
      const cy = window.innerHeight / 2 + shakeY;
      const relX = (x - cam.x) * ZOOM_LEVEL;
      const relY = (y - cam.y) * ZOOM_LEVEL;
      const screenX = (relX - relY) + cx;
      const screenY = (relX + relY) * 0.5 + cy - (z * ZOOM_LEVEL);
      return { x: screenX, y: screenY };
  };

  const toWorld = (sx: number, sy: number): Vector2 => {
      const cam = cameraRef.current;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const adjX = sx - cx;
      const adjY = sy - cy;
      const relX = (2 * adjY + adjX) / 2;
      const relY = (2 * adjY - adjX) / 2;
      return { x: (relX / ZOOM_LEVEL) + cam.x, y: (relY / ZOOM_LEVEL) + cam.y };
  };

  // --- COLLISION ---
  const circleVsCircle = (ax: number, ay: number, aRadius: number, bx: number, by: number, bRadius: number): boolean => {
    const dx = ax - bx, dy = ay - by;
    return (dx * dx + dy * dy) < (aRadius + bRadius) * (aRadius + bRadius);
  };

  const circleVsRect = (cx: number, cy: number, cRadius: number, rx: number, ry: number, rw: number, rh: number): boolean => {
    const closestX = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
    const closestY = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));
    const dx = cx - closestX, dy = cy - closestY;
    return (dx * dx + dy * dy) < cRadius * cRadius;
  };

  const resolvePropCollision = (entity: { position: Vector2; radius: number }, props: MapProp[]): boolean => {
    let collided = false;
    for (const prop of props) {
      if (prop.type === PropType.TREE || prop.type === PropType.ROCK) {
        const colRadius = prop.collisionRadius || 15;
        if (circleVsCircle(entity.position.x, entity.position.y, entity.radius, prop.x, prop.y, colRadius)) {
          const dx = entity.position.x - prop.x, dy = entity.position.y - prop.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) { const overlap = entity.radius + colRadius - dist; entity.position.x += (dx / dist) * overlap; entity.position.y += (dy / dist) * overlap; }
          collided = true;
        }
      } else if (prop.type === PropType.BUILDING) {
        const colW = prop.collisionWidth || 100, colD = prop.collisionDepth || 80;
        if (circleVsRect(entity.position.x, entity.position.y, entity.radius, prop.x, prop.y, colW, colD)) {
          const dx = entity.position.x - prop.x, dy = entity.position.y - prop.y;
          if (Math.abs(dx) * colD > Math.abs(dy) * colW) entity.position.x = prop.x + Math.sign(dx) * (colW / 2 + entity.radius);
          else entity.position.y = prop.y + Math.sign(dy) * (colD / 2 + entity.radius);
          collided = true;
        }
      }
    }
    return collided;
  };

  const triggerScreenShake = (intensity: number, duration: number) => {
    screenShakeRef.current = { intensity, duration };
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (mobileInputRef) mobileInputRef.current.active = false;
    };
    const handleMouseDown = () => { keysRef.current['MouseLeft'] = true; if (mobileInputRef) mobileInputRef.current.active = false; };
    const handleMouseUp = () => { keysRef.current['MouseLeft'] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mobileInputRef]);

  // Themed Map Generation
  const generateMap = useCallback((theme: MapTheme) => {
    const props: MapProp[] = [];
    const ws = Constants.WORLD_SIZE;
    const isForest = theme === MapTheme.FOREST;
    const isDesert = theme === MapTheme.DESERT;
    const isSnow = theme === MapTheme.SNOW;
    const isVolcanic = theme === MapTheme.VOLCANIC;
    
    const treeChance = isForest ? 0.8 : (isDesert ? 0.2 : (isSnow ? 0.4 : 0.5));
    const buildChance = isForest ? 0.1 : (isDesert ? 0.3 : 0.3);
    const rockChance = isDesert ? 0.5 : (isVolcanic ? 0.6 : 0.2);
    
    const propCount = isForest ? 120 : (isDesert ? 100 : 80);
    
    for (let i = 0; i < propCount; i++) {
        let attempts = 0;
        let cx: number, cy: number;
        // Try to find a non-overlapping position
        do {
            cx = Math.random() * ws;
            cy = Math.random() * ws;
            attempts++;
        } while (attempts < 10 && Math.hypot(cx - ws/2, cy - ws/2) < 500);
        
        // Skip if too close to center even after retries
        if (Math.hypot(cx - ws/2, cy - ws/2) < 500) continue;
        
        // Check overlap with existing props
        let overlapping = false;
        for (const existing of props) {
            const minDist = existing.type === PropType.BUILDING ? 200 : 100;
            if (Math.hypot(cx - existing.x, cy - existing.y) < minDist) {
                overlapping = true;
                break;
            }
        }
        if (overlapping) continue;
        
        const type = Math.random();
        
        if (type < treeChance) {
             props.push({
                id: `tree_${i}`, type: PropType.TREE, x: cx, y: cy,
                width: 60 + Math.random() * 50, height: 100 + Math.random() * 60,
                scale: 0.8 + Math.random() * 0.4, variant: Math.floor(Math.random() * 3), collisionRadius: 15
            });
        } else if (type < treeChance + buildChance) {
             props.push({
                id: `build_${i}`, type: PropType.BUILDING, x: cx, y: cy,
                width: 150, height: 150, scale: 1, variant: Math.floor(Math.random() * 3), collisionWidth: 130, collisionDepth: 110
            });
        } else if (type < treeChance + buildChance + rockChance) {
             props.push({
                id: `rock_${i}`, type: PropType.ROCK, x: cx, y: cy,
                width: 30 + Math.random() * 40, height: 25 + Math.random() * 20, scale: 1, variant: 0, collisionRadius: 18
             });
        }
    }
    propsRef.current = props;
  }, []);

  // Initialize
  const initGame = useCallback(() => {
    const center = Constants.WORLD_SIZE / 2;
    cameraRef.current = { x: center, y: center };
    difficultyRef.current = selectedDifficulty;
    themeRef.current = mapTheme || MapTheme.GRASSLAND;
    
    const heroConfig = Constants.HERO_STATS[selectedHero];
    let pColor = Constants.COLORS.PLAYER;
    const heroNames: Record<HeroType, string> = { [HeroType.WARRIOR]: 'Dynasty General', [HeroType.VIKING]: 'Norse Viking', [HeroType.SAMURAI]: 'Ronin Samurai' };
    if (selectedHero === HeroType.VIKING) pColor = Constants.COLORS.HERO_VIKING;
    if (selectedHero === HeroType.SAMURAI) pColor = Constants.COLORS.HERO_SAMURAI;

    playerRef.current = {
      id: 'player', type: EntityType.PLAYER, heroType: selectedHero,
      position: { x: center, y: center }, velocity: { x: 0, y: 0 },
      health: heroConfig.hp, maxHealth: heroConfig.hp, radius: 15,
      color: pColor, label: heroNames[selectedHero], isDead: false, deathTimer: 0, attackCooldown: 0,
      facing: 0, walkFrame: 0, attackProgress: 0, weaponLevel: 0
    };

    entitiesRef.current = [playerRef.current];
    statsRef.current = { hp: heroConfig.hp, musou: 0, ko: 0 };
    isMusouActiveRef.current = false;
    particlesRef.current = [];
    damageTextsRef.current = [];
    itemsRef.current = [];
    projectilesRef.current = [];
    waveTimerRef.current = Constants.WAVE_INTERVAL;
    bossSpawnedRef.current = false;
    gameTimeRef.current = 0;
    screenShakeRef.current = { intensity: 0, duration: 0 };
    bossStateRef.current = { lastChargeTime: 0, lastAoeTime: 0, lastSummonTime: 0, attackPattern: 0, phase: 0 };
    generateMap(themeRef.current);
  }, [selectedHero, generateMap, selectedDifficulty, mapTheme]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) initGame();
  }, [status, initGame]);

  const spawnParticles = (x: number, y: number, count: number, color: string, speed: number, isBlood: boolean = false) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      particlesRef.current.push({
        x, y, vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel,
        life: 1.0, maxLife: 1.0,
        color: isBlood ? (Math.random() > 0.5 ? '#991b1b' : '#7f1d1d') : color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const spawnDamageText = (x: number, y: number, dmg: number, isCrit: boolean, isHeal: boolean = false) => {
    damageTextsRef.current.push({
      x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 10,
      text: isHeal ? `+${dmg}` : dmg.toString(),
      life: 1.0,
      color: isHeal ? Constants.COLORS.TEXT_HEAL : (isCrit ? Constants.COLORS.TEXT_CRIT : Constants.COLORS.TEXT_DAMAGE)
    });
  };

  const getTimeScaling = (): number => {
    const timeSeconds = gameTimeRef.current / 60;
    const intervals = Math.floor(timeSeconds / 30);
    const scale = 1 + intervals * Constants.ENEMY_SCALING_PER_30S.hpBonus;
    return Math.min(scale, Constants.ENEMY_SCALING_PER_30S.maxScale);
  };

  const spawnWave = () => {
     if (entitiesRef.current.length >= Constants.MAX_ENEMIES) return;
     if (!playerRef.current) return;
     const config = getDifficulty();
     const timeScale = getTimeScaling();
     const angle = Math.random() * Math.PI * 2;
     const distance = 500 / ZOOM_LEVEL + 100;
     const spawnCenterX = playerRef.current.position.x + Math.cos(angle) * distance;
     const spawnCenterY = playerRef.current.position.y + Math.sin(angle) * distance;
     const waveSize = 4 + Math.floor(Math.random() * 4) + config.waveSizeBonus + Math.floor(gameTimeRef.current / 1800);
     const hasArcher = Math.random() < (0.4 + (difficultyRef.current === DifficultyLevel.NIGHTMARE ? 0.2 : 0));
     const hasCavalry = statsRef.current.ko > config.cavalryThreshold && Math.random() < 0.2;
     
     for(let i=0; i<Math.min(waveSize, 15); i++) {
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        let x = spawnCenterX + offsetX, y = spawnCenterY + offsetY;
        x = Math.max(50, Math.min(Constants.WORLD_SIZE - 50, x));
        y = Math.max(50, Math.min(Constants.WORLD_SIZE - 50, y));
        let type = EntityType.ENEMY_GRUNT;
        let hp = Math.floor(30 * config.enemyHpMult * timeScale);
        let radius = 14;
        let color = Constants.COLORS.ENEMY;
        let label = ENTITY_LABELS[EntityType.ENEMY_GRUNT];
        if (i === 0 && hasCavalry) {
            type = EntityType.ENEMY_CAVALRY; hp = Math.floor(70 * config.enemyHpMult * timeScale); radius = 22; color = Constants.COLORS.ENEMY_DARK; label = ENTITY_LABELS[EntityType.ENEMY_CAVALRY];
        } else if (i === 1 && hasArcher) {
            type = EntityType.ENEMY_ARCHER; hp = Math.floor(25 * config.enemyHpMult * timeScale); radius = 14; color = Constants.COLORS.ENEMY_ARCHER; label = ENTITY_LABELS[EntityType.ENEMY_ARCHER];
        } else if (i === 0 && Math.random() < (0.1 + Math.min(0.2, gameTimeRef.current / 6000))) {
            type = EntityType.ENEMY_CAPTAIN; hp = Math.floor(120 * config.enemyHpMult * timeScale); radius = 20; color = Constants.COLORS.ENEMY_CAPTAIN; label = ENTITY_LABELS[EntityType.ENEMY_CAPTAIN];
        }
        entitiesRef.current.push({
            id: `e_${idCounter.current++}`, type, position: { x, y }, velocity: { x: 0, y: 0 },
            health: hp, maxHealth: hp, radius, color, label,
            isDead: false, deathTimer: 0, attackCooldown: Math.random() * 60,
            facing: 0, walkFrame: Math.random() * 100, attackProgress: 0, weaponLevel: 0
        });
     }
  };

  const spawnBoss = () => {
      if (!playerRef.current) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 400;
      const x = playerRef.current.position.x + Math.cos(angle) * dist;
      const y = playerRef.current.position.y + Math.sin(angle) * dist;
      const config = getDifficulty();
      const timeScale = getTimeScaling();
      const bossHp = Math.floor(2000 * config.bossHpMult * timeScale);
      triggerScreenShake(8, 0.3);
      spawnParticles(x, y, 60, Constants.COLORS.BOSS_GOLD, 10);
      entitiesRef.current.push({
          id: 'boss', type: EntityType.BOSS,
          position: { x, y }, velocity: { x: 0, y: 0 },
          health: bossHp, maxHealth: bossHp, radius: 35, color: Constants.COLORS.BOSS, label: bossName,
          isDead: false, deathTimer: 0, attackCooldown: 60,
          facing: 0, walkFrame: 0, attackProgress: 0, weaponLevel: 0
      });
      const guardCount = 4 + config.bossExtraAttacks;
      for(let i=0; i<guardCount; i++) {
         const guardHp = Math.floor(150 * config.enemyHpMult * timeScale);
         entitiesRef.current.push({
             id: `guard_${i}`, type: EntityType.ENEMY_CAPTAIN,
             position: { x: x + (Math.random()-0.5)*60, y: y + (Math.random()-0.5)*60 },
             velocity: { x: 0, y: 0 }, health: guardHp, maxHealth: guardHp,
             radius: 20, color: Constants.COLORS.ENEMY_CAPTAIN, label: 'Elite Guard',
             isDead: false, deathTimer: 0, attackCooldown: 60, facing: 0, walkFrame: 0, attackProgress: 0, weaponLevel: 0
         });
      }
      bossStateRef.current = { lastChargeTime: 0, lastAoeTime: 0, lastSummonTime: 0, attackPattern: 0, phase: 0 };
  };

  const applyDamage = (enemy: Entity, amount: number, knockbackAngle: number) => {
      const config = getDifficulty();
      const finalDmg = Math.floor(amount);
      enemy.health -= finalDmg;
      const kbForce = isMusouActiveRef.current ? 30 : 12;
      enemy.position.x += Math.cos(knockbackAngle) * kbForce;
      enemy.position.y += Math.sin(knockbackAngle) * kbForce;
      spawnDamageText(enemy.position.x, enemy.position.y, finalDmg, isMusouActiveRef.current);
      spawnParticles(enemy.position.x, enemy.position.y, 6, '#991b1b', 5, true);
      if (enemy.health <= 0 && !enemy.isDead) {
          enemy.isDead = true;
          enemy.deathTimer = 4.0;
          statsRef.current.ko++;
          const deathParticles = enemy.type === EntityType.BOSS ? 80 : (enemy.type === EntityType.ENEMY_CAVALRY ? 20 : 8);
          const deathColor = enemy.type === EntityType.BOSS ? Constants.COLORS.BOSS_GOLD : '#991b1b';
          spawnParticles(enemy.position.x, enemy.position.y, deathParticles, deathColor, 8, true);
          if (enemy.type === EntityType.BOSS) { triggerScreenShake(12, 0.5); setTimeout(() => onGameOver(true), 2500); }
          const dropRate = Constants.DROP_CHANCE_HEALTH * config.dropChanceMult;
          if (Math.random() < dropRate) {
              itemsRef.current.push({ id: `i_${idCounter.current++}`, type: ItemType.HEALTH_BUN, x: enemy.position.x, y: enemy.position.y, bouncePhase: Math.random() * Math.PI });
          }
          if (!isMusouActiveRef.current) statsRef.current.musou = Math.min(Constants.MUSOU_GAUGE_MAX, statsRef.current.musou + Constants.KILLS_TO_FILL_MUSOU);
      }
  };

  const applyBossAoe = (boss: Entity) => {
    if (!playerRef.current) return;
    const dist = Math.hypot(playerRef.current.position.x - boss.position.x, playerRef.current.position.y - boss.position.y);
    if (dist < Constants.BOSS_AOE_RADIUS) {
      const config = getDifficulty();
      const timeScale = getTimeScaling();
      const dmg = Math.floor(Constants.BOSS_AOE_DAMAGE * config.enemyDmgMult * timeScale);
      playerRef.current.health -= dmg;
      spawnDamageText(playerRef.current.position.x, playerRef.current.position.y, dmg, false);
      spawnParticles(playerRef.current.position.x, playerRef.current.position.y, 20, '#ff0000', 6);
      triggerScreenShake(6, 0.2);
      if (playerRef.current.health <= 0) onGameOver(false);
    }
    spawnParticles(boss.position.x, boss.position.y, 40, '#ff6b00', 8);
    triggerScreenShake(10, 0.3);
  };

  const bossChargeAttack = (boss: Entity) => {
    if (!playerRef.current) return;
    const dx = playerRef.current.position.x - boss.position.x;
    const dy = playerRef.current.position.y - boss.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      const chargeSpeed = Constants.BOSS_SPEED * Constants.BOSS_CHARGE_SPEED_MULT * 2;
      boss.position.x += (dx / dist) * chargeSpeed;
      boss.position.y += (dy / dist) * chargeSpeed;
      if (dist < boss.radius + playerRef.current.radius + 20) {
        const config = getDifficulty();
        const timeScale = getTimeScaling();
        const dmg = Math.floor(15 * config.enemyDmgMult * timeScale);
        playerRef.current.health -= dmg;
        spawnDamageText(playerRef.current.position.x, playerRef.current.position.y, dmg, false);
        spawnParticles(playerRef.current.position.x, playerRef.current.position.y, 15, '#ff0000', 5);
        triggerScreenShake(8, 0.3);
        if (playerRef.current.health <= 0) onGameOver(false);
      }
    }
    spawnParticles(boss.position.x, boss.position.y, 15, Constants.COLORS.BOSS_GOLD, 6);
  };

  const bossSummon = (boss: Entity) => {
    const config = getDifficulty();
    const count = Constants.BOSS_SUMMON_COUNT + config.bossExtraAttacks;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      const sx = boss.position.x + Math.cos(angle) * dist;
      const sy = boss.position.y + Math.sin(angle) * dist;
      entitiesRef.current.push({
        id: `s_${idCounter.current++}`, type: EntityType.ENEMY_GRUNT,
        position: { x: sx, y: sy }, velocity: { x: 0, y: 0 },
        health: Math.floor(20 * config.enemyHpMult), maxHealth: Math.floor(20 * config.enemyHpMult),
        radius: 12, color: '#374151', label: 'Summon',
        isDead: false, deathTimer: 0, attackCooldown: 30, facing: 0, walkFrame: 0, attackProgress: 0, weaponLevel: 0
      });
    }
    spawnParticles(boss.position.x, boss.position.y, 25, '#374151', 5);
  };

  // --- MAIN UPDATE ---
  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    timeRef.current += 0.016;
    gameTimeRef.current++;
    
    if (screenShakeRef.current.duration > 0) {
      screenShakeRef.current.duration -= 0.016;
      screenShakeRef.current.intensity *= 0.9;
    }

    const player = playerRef.current;
    if (!player) return;
    const config = getDifficulty();
    const timeScale = getTimeScaling();

    if (!bossSpawnedRef.current && statsRef.current.ko >= requiredKills) {
        bossSpawnedRef.current = true;
        spawnBoss();
    }

    const prevLevel = player.weaponLevel;
    let nextLevel = 0;
    if (statsRef.current.ko >= 120) nextLevel = 3;
    else if (statsRef.current.ko >= 70) nextLevel = 2;
    else if (statsRef.current.ko >= 30) nextLevel = 1;
    if (nextLevel > prevLevel) {
        player.weaponLevel = nextLevel;
        spawnParticles(player.position.x, player.position.y, 40, '#fbbf24', 8);
        spawnDamageText(player.position.x, player.position.y - 50, 0, true);
    }

    mouseWorldRef.current = toWorld(mouseRef.current.x, mouseRef.current.y);

    let dx = 0, dy = 0, usingMobile = false;
    if (mobileInputRef && mobileInputRef.current) {
        const m = mobileInputRef.current;
        if (m.active && (m.moveVector.x !== 0 || m.moveVector.y !== 0)) {
            dx = m.moveVector.x; dy = m.moveVector.y; usingMobile = true;
            player.facing = Math.atan2(dy, dx);
        }
    }
    if (!usingMobile) {
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dy = -1;
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dy = 1;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dx = -1;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dx = 1;
    }
    if (dx !== 0 || dy !== 0) {
        const worldDx = (2 * dy + dx) / 2, worldDy = (2 * dy - dx) / 2;
        const len = Math.hypot(worldDx, worldDy);
        const heroStats = Constants.HERO_STATS[selectedHero];
        const speed = isMusouActiveRef.current ? heroStats.speed * 1.3 : heroStats.speed;
        player.position.x += (worldDx / len) * speed;
        player.position.y += (worldDy / len) * speed;
        player.walkFrame += 0.2;
        resolvePropCollision(player, propsRef.current);
        player.position.x = Math.max(20, Math.min(Constants.WORLD_SIZE-20, player.position.x));
        player.position.y = Math.max(20, Math.min(Constants.WORLD_SIZE-20, player.position.y));
    }
    cameraRef.current.x += (player.position.x - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (player.position.y - cameraRef.current.y) * 0.1;
    const isMobileActive = mobileInputRef && mobileInputRef.current && mobileInputRef.current.active;
    if (!isMobileActive) player.facing = Math.atan2(mouseWorldRef.current.y - player.position.y, mouseWorldRef.current.x - player.position.x);

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.attackProgress > 0) {
        const speedMod = selectedHero === HeroType.SAMURAI ? 0.15 : (selectedHero === HeroType.VIKING ? 0.05 : 0.08);
        player.attackProgress += speedMod;
        if (player.attackProgress >= 1) player.attackProgress = 0;
    }
    const mobileMusou = mobileInputRef?.current?.isMusou;
    if ((keysRef.current['Space'] || mobileMusou) && statsRef.current.musou >= Constants.MUSOU_GAUGE_MAX && !isMusouActiveRef.current) {
      isMusouActiveRef.current = true;
      triggerScreenShake(6, 0.2);
      spawnParticles(player.position.x, player.position.y, 30, Constants.COLORS.MUSOU_ACTIVE, 8);
    }
    if (isMusouActiveRef.current) {
      statsRef.current.musou -= Constants.MUSOU_DRAIN_RATE;
      if (statsRef.current.musou <= 0) isMusouActiveRef.current = false;
      player.attackCooldown = 0;
      if (Math.random() < 0.3) spawnParticles(player.position.x + (Math.random() - 0.5) * 30, player.position.y + (Math.random() - 0.5) * 30, 1, Constants.COLORS.MUSOU_ACTIVE, 2);
    }
    const mobileAttack = mobileInputRef?.current?.isAttacking;
    const isAttacking = (keysRef.current['MouseLeft'] || mobileAttack || isMusouActiveRef.current) && player.attackCooldown <= 0 && player.attackProgress === 0;
    if (isAttacking) {
        const heroConfig = Constants.HERO_STATS[selectedHero];
        player.attackCooldown = isMusouActiveRef.current ? 5 : heroConfig.cooldown;
        player.attackProgress = 0.01;
        const weaponList = Constants.WEAPON_TIERS[selectedHero];
        const weapon = weaponList[player.weaponLevel];
        const damage = isMusouActiveRef.current ? weapon.damage * 2.0 : weapon.damage;
        let hitCount = 0;
        entitiesRef.current.forEach(enemy => {
            if (enemy.type === EntityType.PLAYER || enemy.isDead) return;
            const dist = Math.hypot(enemy.position.x - player.position.x, enemy.position.y - player.position.y);
            let hitRange = weapon.range;
            if (isMusouActiveRef.current) hitRange *= 1.5;
            if (dist < hitRange) {
                const angleToEnemy = Math.atan2(enemy.position.y - player.position.y, enemy.position.x - player.position.x);
                let angleDiff = angleToEnemy - player.facing;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const arc = selectedHero === HeroType.SAMURAI ? Math.PI / 2.5 : Constants.PLAYER_ATTACK_ARC;
                if (Math.abs(angleDiff) < arc / 2 || isMusouActiveRef.current) {
                    applyDamage(enemy, damage, angleToEnemy);
                    hitCount++;
                }
            }
        });
        if (hitCount > 0) spawnParticles(player.position.x + Math.cos(player.facing) * 40, player.position.y + Math.sin(player.facing) * 40, 5, '#ffffff', 3);
    }

    const effectiveWaveInterval = Math.max(60, Constants.WAVE_INTERVAL + config.waveIntervalReduction);
    waveTimerRef.current++;
    if (waveTimerRef.current > effectiveWaveInterval) { spawnWave(); waveTimerRef.current = 0; }
    
    entitiesRef.current = entitiesRef.current.filter(e => !e.isDead || e.deathTimer > 0);
    
    let bossHpCurrent = 0;
    let bossHpMax = 0;
    let bossAlive = false;
    // Ambient particles based on theme
    const theme = getTheme();
    if (Math.random() < theme.ambientParticleRate) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 200;
      if (playerRef.current) {
        particlesRef.current.push({
          x: playerRef.current.position.x + Math.cos(angle) * dist,
          y: playerRef.current.position.y + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 0.2, vy: -Math.sin(angle) * 0.2 - 0.1,
          life: 1.0, maxLife: 1.0, color: theme.ambientParticleColor, size: 2
        });
      }
    }

    entitiesRef.current.forEach(entity => {
        if (entity.type === EntityType.PLAYER) return;
        if (entity.isDead) { entity.deathTimer -= 0.016; return; }
        if (entity.attackProgress > 0) { entity.attackProgress += 0.05; if (entity.attackProgress >= 1) entity.attackProgress = 0; }
        if (entity.attackCooldown > 0) entity.attackCooldown--;
        const ddx = player.position.x - entity.position.x, ddy = player.position.y - entity.position.y;
        const dist = Math.hypot(ddx, ddy);
        const angleToPlayer = Math.atan2(ddy, ddx);

        if (entity.type === EntityType.BOSS) {
          bossHpCurrent = entity.health;
          bossHpMax = entity.maxHealth;
          bossAlive = true;
          const now = gameTimeRef.current;
          const bossState = bossStateRef.current;
          const hpPct = entity.health / entity.maxHealth;
          let newPhase = 0;
          if (hpPct < 0.25) newPhase = 3;
          else if (hpPct < 0.5) newPhase = 2;
          else if (hpPct < 0.75) newPhase = 1;
          if (newPhase > bossState.phase) { bossState.phase = newPhase; triggerScreenShake(8, 0.4); spawnParticles(entity.position.x, entity.position.y, 50, Constants.COLORS.BOSS_GOLD, 10); }
          const attackDelay = Math.max(120, 240 - bossState.phase * 30);
          if (now - bossState.lastChargeTime > attackDelay && dist > 150) { bossState.attackPattern = 0; bossState.lastChargeTime = now; bossChargeAttack(entity); return; }
          if (now - bossState.lastAoeTime > attackDelay + 60 && dist < 200) { bossState.attackPattern = 1; bossState.lastAoeTime = now; applyBossAoe(entity); return; }
          if (now - bossState.lastSummonTime > attackDelay + 30 && bossState.phase >= 1) { bossState.attackPattern = 2; bossState.lastSummonTime = now; bossSummon(entity); return; }
        }

        if (entity.type === EntityType.ENEMY_ARCHER) {
            if (dist > Constants.ARCHER_RANGE) {
                const speed = Constants.ARCHER_SPEED * config.enemySpeedMult * timeScale;
                entity.position.x += (ddx / dist) * speed; entity.position.y += (ddy / dist) * speed;
                resolvePropCollision(entity, propsRef.current);
                entity.walkFrame += 0.2; entity.facing = angleToPlayer;
            } else {
                entity.facing = angleToPlayer;
                const fireRate = Math.max(60, 180 + config.archerFireRateReduction);
                if (entity.attackCooldown <= 0) {
                    entity.attackCooldown = fireRate; entity.attackProgress = 0.01;
                    const arrowSpeed = Constants.ARROW_SPEED * (1 + Math.max(0, (timeScale - 1) * 0.3));
                    const arrowDmg = Math.floor(Constants.ARROW_DAMAGE * config.enemyDmgMult * timeScale);
                    projectilesRef.current.push({
                        id: `proj_${idCounter.current++}`, x: entity.position.x, y: entity.position.y,
                        vx: Math.cos(angleToPlayer) * arrowSpeed, vy: Math.sin(angleToPlayer) * arrowSpeed,
                        life: 100, damage: arrowDmg, radius: 4, color: Constants.COLORS.ARROW, isEnemy: true
                    });
                }
            }
        } else {
            let moved = false;
            if (dist > player.radius + entity.radius) {
                moved = true;
                let speed = Constants.ENEMY_SPEED * config.enemySpeedMult * timeScale;
                if (entity.type === EntityType.BOSS) speed = Constants.BOSS_SPEED * config.enemySpeedMult * timeScale;
                if (entity.type === EntityType.ENEMY_CAVALRY) speed = Constants.CAVALRY_SPEED * config.enemySpeedMult * timeScale;
                let vx = (ddx / dist) * speed, vy = (ddy / dist) * speed;
                entitiesRef.current.forEach(other => {
                    if (entity === other || other.isDead) return;
                    const odx = entity.position.x - other.position.x, ody = entity.position.y - other.position.y;
                    const odist = Math.hypot(odx, ody);
                    if (odist < 25) { vx += (odx / odist) * 0.1; vy += (ody / odist) * 0.1; }
                });
                entity.position.x += vx; entity.position.y += vy;
                resolvePropCollision(entity, propsRef.current);
                entity.facing = Math.atan2(ddy, ddx);
                entity.position.x = Math.max(20, Math.min(Constants.WORLD_SIZE-20, entity.position.x));
                entity.position.y = Math.max(20, Math.min(Constants.WORLD_SIZE-20, entity.position.y));
            }
            if (moved) entity.walkFrame += 0.2;
            const atkRange = entity.type === EntityType.BOSS ? 40 : entity.radius + player.radius + 15;
            if (dist < atkRange && entity.attackCooldown <= 0) {
                entity.attackCooldown = entity.type === EntityType.ENEMY_CAVALRY ? 120 : (entity.type === EntityType.BOSS ? 60 : 90);
                entity.attackProgress = 0.01;
                let baseDmg = entity.type === EntityType.ENEMY_CAVALRY ? 15 : (entity.type === EntityType.BOSS ? 30 : 5);
                const dmg = Math.floor(baseDmg * config.enemyDmgMult * timeScale);
                player.health -= dmg;
                spawnDamageText(player.position.x, player.position.y, dmg, false);
                spawnParticles(player.position.x, player.position.y, 5, '#ff0000', 4);
                if (entity.type === EntityType.BOSS) triggerScreenShake(6, 0.2);
                if (player.health <= 0) onGameOver(false);
            }
        }
    });

    projectilesRef.current = projectilesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        let hitProp = false;
        for (const prop of propsRef.current) {
          if (prop.type === PropType.TREE || prop.type === PropType.ROCK) {
            if (circleVsCircle(p.x, p.y, p.radius, prop.x, prop.y, prop.collisionRadius || 15)) { hitProp = true; spawnParticles(p.x, p.y, 5, '#9ca3af', 3); break; }
          } else if (prop.type === PropType.BUILDING) {
            if (circleVsRect(p.x, p.y, p.radius, prop.x, prop.y, prop.collisionWidth || 100, prop.collisionDepth || 80)) { hitProp = true; spawnParticles(p.x, p.y, 5, '#9ca3af', 3); break; }
          }
        }
        if (hitProp) return false;
        if (p.isEnemy) {
            const dist = Math.hypot(p.x - player.position.x, p.y - player.position.y);
            if (dist < player.radius + p.radius) {
                player.health -= p.damage;
                spawnDamageText(player.position.x, player.position.y, p.damage, false);
                spawnParticles(player.position.x, player.position.y, 3, '#ff0000', 3);
                if (player.health <= 0) onGameOver(false);
                return false;
            }
        }
        return p.life > 0;
    });

    itemsRef.current = itemsRef.current.filter(item => {
        item.bouncePhase += 0.1;
        const dist = Math.hypot(item.x - player.position.x, item.y - player.position.y);
        if (dist < player.radius + 20) {
             if (item.type === ItemType.HEALTH_BUN) {
                 const missing = player.maxHealth - player.health;
                 if (missing > 0) { const heal = Math.min(missing, Constants.ITEM_HEAL_AMOUNT); player.health += heal; spawnDamageText(player.position.x, player.position.y, heal, false, true); spawnParticles(player.position.x, player.position.y, 15, Constants.COLORS.TEXT_HEAL, 4); return false; }
             }
        }
        return true;
    });

    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; p.size *= 0.95; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    damageTextsRef.current.forEach(t => { t.life -= 0.02; });
    damageTextsRef.current = damageTextsRef.current.filter(t => t.life > 0);

    onUpdateStats(Math.floor(player.health), Math.floor(statsRef.current.musou), statsRef.current.ko);

    if (bossAlive) {
      window.dispatchEvent(new CustomEvent('bossUpdate', { detail: { hp: bossHpCurrent, maxHp: bossHpMax, name: bossName } }));
    } else if (bossSpawnedRef.current) {
      window.dispatchEvent(new CustomEvent('bossUpdate', { detail: null }));
    }
    const enemies = entitiesRef.current.filter(e => e.type !== EntityType.PLAYER && !e.isDead).map(e => ({ x: e.position.x, y: e.position.y, isBoss: e.type === EntityType.BOSS }));
    const minimapItems = itemsRef.current.map(i => ({ x: i.x, y: i.y }));
    window.dispatchEvent(new CustomEvent('minimapUpdate', { detail: { playerX: player.position.x, playerY: player.position.y, worldSize: Constants.WORLD_SIZE, enemies, items: minimapItems, cameraX: cameraRef.current.x, cameraY: cameraRef.current.y, viewWidth: window.innerWidth / ZOOM_LEVEL, viewHeight: window.innerHeight / ZOOM_LEVEL } }));

  }, [status, selectedHero, onUpdateStats, onGameOver, requiredKills, mobileInputRef, bossName]);

  // --- DRAWING ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cam = cameraRef.current;
    const theme = getTheme();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background
    ctx.fillStyle = theme.groundBase;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground Detail - camera-space culling with extended view margin
    const gridStep = Constants.TILE_SIZE / 2;
    const viewMargin = 1.5; // 50% extra view area to prevent edge pop-in
    const viewW = canvas.width / ZOOM_LEVEL * viewMargin;
    const viewH = canvas.height / ZOOM_LEVEL * viewMargin;
    const startX = Math.floor((cam.x - viewW/2) / gridStep) * gridStep;
    const endX = Math.ceil((cam.x + viewW/2) / gridStep) * gridStep;
    const startY = Math.floor((cam.y - viewH/2) / gridStep) * gridStep;
    const endY = Math.ceil((cam.y + viewH/2) / gridStep) * gridStep;
    // Pre-cache toScreen for grid center offset
    const halfGrid = gridStep / 2;
    // Cache theme refs to avoid property lookups
    const gBase = theme.groundVar1;
    const gDark = theme.grassDark;
    const gLight = theme.grassLight;
    const isSnowOrVolcanic = themeRef.current === MapTheme.SNOW || themeRef.current === MapTheme.VOLCANIC;
    
    for (let x = startX; x <= endX; x += gridStep) {
        for (let y = startY; y <= endY; y += gridStep) {
            const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            const rand = seed - Math.floor(seed);
            const sx = (x + halfGrid - cam.x) * ZOOM_LEVEL;
            const sy = (y + halfGrid - cam.y) * ZOOM_LEVEL;
            const screenX = (sx - sy) + canvas.width/2;
            const screenY = (sx + sy) * 0.5 + canvas.height/2;
            
            if (rand < 0.1) {
              ctx.fillStyle = gBase;
              ctx.fillRect(screenX - gridStep * ZOOM_LEVEL, screenY - gridStep * ZOOM_LEVEL * 0.5, gridStep * ZOOM_LEVEL * 2, gridStep * ZOOM_LEVEL);
            }
            if (rand > 0.7) {
                 const gScale = ZOOM_LEVEL * (0.5 + rand * 0.5);
                 ctx.fillStyle = rand > 0.85 ? gLight : gDark;
                 ctx.beginPath(); ctx.moveTo(screenX, screenY); ctx.lineTo(screenX - 2*gScale, screenY - 6*gScale); ctx.lineTo(screenX + 2*gScale, screenY - 6*gScale); ctx.fill();
            }
            if (rand > 0.92 && !isSnowOrVolcanic) {
              ctx.fillStyle = '#ffaaaa';
              ctx.beginPath(); ctx.arc(screenX, screenY - 3*ZOOM_LEVEL, 1.5*ZOOM_LEVEL, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#ffff88';
              ctx.beginPath(); ctx.arc(screenX, screenY - 2*ZOOM_LEVEL, 1*ZOOM_LEVEL, 0, Math.PI*2); ctx.fill();
            }
        }
    }

    // Fog layer
    ctx.fillStyle = theme.fogColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderList: any[] = [];
    propsRef.current.forEach(prop => {
        const screenPos = toScreen(prop.x, prop.y);
        if (screenPos.x < -400 || screenPos.x > canvas.width + 400 || screenPos.y < -400 || screenPos.y > canvas.height + 400) return;
        renderList.push({ depth: screenPos.y, type: 'PROP', data: prop, pos: screenPos });
    });
    entitiesRef.current.forEach(entity => {
        const screenPos = toScreen(entity.position.x, entity.position.y);
        if (screenPos.x < -400 || screenPos.x > canvas.width + 400 || screenPos.y < -400 || screenPos.y > canvas.height + 400) return;
        renderList.push({ depth: screenPos.y, type: 'ENTITY', data: entity, pos: screenPos });
    });
    itemsRef.current.forEach(item => {
        const screenPos = toScreen(item.x, item.y);
        renderList.push({ depth: screenPos.y, type: 'ITEM', data: item, pos: screenPos });
    });
    renderList.sort((a, b) => a.depth - b.depth);

    renderList.forEach(item => {
        if (item.type === 'PROP') drawProp(ctx, item.data, item.pos, theme);
        else if (item.type === 'ITEM') drawItem(ctx, item.data, item.pos);
        else drawEntity(ctx, item.data, item.pos);
    });

    projectilesRef.current.forEach(proj => {
        const screenPos = toScreen(proj.x, proj.y);
        drawProjectile(ctx, proj, screenPos);
    });

    drawSlashes(ctx);

    particlesRef.current.forEach(p => {
        const pos = toScreen(p.x, p.y);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(pos.x, pos.y - 20, p.size * ZOOM_LEVEL, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    damageTextsRef.current.forEach(t => {
        const pos = toScreen(t.x, t.y);
        const floatY = (1.0 - t.life) * 80;
        ctx.globalAlpha = t.life;
        ctx.font = `900 ${20 * ZOOM_LEVEL}px 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = 'black';
        ctx.strokeText(t.text, pos.x, pos.y - 80 - floatY);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, pos.x, pos.y - 80 - floatY);
    });
    ctx.globalAlpha = 1;

    if (playerRef.current && playerRef.current.health < playerRef.current.maxHealth * 0.3 && !playerRef.current.isDead) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.05 + Math.sin(timeRef.current * 8) * 0.03})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // --- DRAW HELPERS ---
  const drawProjectile = (ctx: CanvasRenderingContext2D, proj: Projectile, pos: Vector2) => {
      const scale = ZOOM_LEVEL;
      ctx.save();
      ctx.translate(pos.x, pos.y - 25 * scale);
      ctx.rotate(Math.atan2(proj.vy, proj.vx));
      ctx.fillStyle = '#5c4033'; ctx.fillRect(-10*scale, -1*scale, 20*scale, 2*scale);
      ctx.fillStyle = '#d1d5db'; ctx.beginPath(); ctx.moveTo(10*scale, -3*scale); ctx.lineTo(14*scale, 0); ctx.lineTo(10*scale, 3*scale); ctx.fill();
      ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.moveTo(-10*scale, 0); ctx.lineTo(-14*scale, -3*scale); ctx.lineTo(-12*scale, 0); ctx.lineTo(-14*scale, 3*scale); ctx.fill();
      ctx.restore();
  };

  const drawItem = (ctx: CanvasRenderingContext2D, item: Item, pos: Vector2) => {
     const scale = ZOOM_LEVEL;
     const bounce = Math.sin(item.bouncePhase) * 5 * scale;
     ctx.fillStyle = 'rgba(0,0,0,0.3)';
     ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 12 * scale, 6 * scale, 0, 0, Math.PI*2); ctx.fill();
     if (item.type === ItemType.HEALTH_BUN) {
         ctx.translate(pos.x, pos.y - 15 * scale - bounce);
         const grad = ctx.createRadialGradient(0, -2*scale, 2*scale, 0, 0, 10*scale);
         grad.addColorStop(0, '#fffbeb'); grad.addColorStop(1, '#fcd34d');
         ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 9 * scale, 0, Math.PI*2); ctx.fill();
         ctx.strokeStyle = Constants.COLORS.TEXT_HEAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 2*scale, 12*scale + bounce/4, 0, Math.PI*2); ctx.stroke();
         ctx.translate(-pos.x, -(pos.y - 15 * scale - bounce));
     }
  };

  const drawProp = (ctx: CanvasRenderingContext2D, prop: MapProp, pos: Vector2, theme: Constants.MapThemeConfig) => {
      const scale = prop.scale * ZOOM_LEVEL;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      const shadowW = prop.type === PropType.BUILDING ? 100 * scale : 20 * scale;
      const shadowH = prop.type === PropType.BUILDING ? 60 * scale : 10 * scale;
      ctx.beginPath(); ctx.ellipse(pos.x + 10, pos.y + 5, shadowW, shadowH, 0, 0, Math.PI*2); ctx.fill();

      if (prop.type === PropType.TREE) {
          ctx.fillStyle = theme.treeTrunk;
          const trunkW = 16 * scale, trunkH = 35 * scale;
          ctx.fillRect(pos.x - trunkW/2, pos.y - trunkH, trunkW, trunkH);
          // Root bumps
          ctx.fillStyle = theme.treeTrunk; 
          ctx.beginPath(); ctx.arc(pos.x - 6*scale, pos.y - 2*scale, 4*scale, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(pos.x + 6*scale, pos.y - 3*scale, 3*scale, 0, Math.PI*2); ctx.fill();
          const layers = 5;
          const sway = Math.sin(timeRef.current * 1.5 + prop.x) * (3 * scale);
          for(let i=0; i<layers; i++) {
              const size = (prop.width * scale) * (1.0 - i*0.12);
              const yOffset = (35 * scale) + i * (22 * scale);
              ctx.fillStyle = theme.treeLeavesShadow;
              ctx.beginPath(); ctx.arc(pos.x + sway * (i+1)*0.4, pos.y - yOffset + 5, size/2, 0, Math.PI*2); ctx.fill();
              const grad = ctx.createRadialGradient(pos.x + sway, pos.y - yOffset - size/4, 0, pos.x + sway, pos.y - yOffset, size);
              grad.addColorStop(0, theme.treeLeavesLight); grad.addColorStop(1, theme.treeLeaves);
              ctx.fillStyle = grad;
              ctx.beginPath(); ctx.arc(pos.x + sway * (i+1)*0.4, pos.y - yOffset, size/2, 0, Math.PI*2);
              ctx.arc(pos.x + sway * (i+1)*0.4 - size/2.5, pos.y - yOffset + size/4, size/3, 0, Math.PI*2);
              ctx.arc(pos.x + sway * (i+1)*0.4 + size/2.5, pos.y - yOffset + size/4, size/3, 0, Math.PI*2); ctx.fill();
          }
          // Highlight on top
          ctx.fillStyle = theme.treeLeavesLight;
          ctx.globalAlpha = 0.3;
          ctx.beginPath(); ctx.arc(pos.x + sway * 0.4, pos.y - 35*scale, 5*scale, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 1;
      } else if (prop.type === PropType.BUILDING) {
          const w = (prop.collisionWidth || 100) * ZOOM_LEVEL;
          const h = (prop.collisionDepth || 80) * ZOOM_LEVEL * 0.6;
          const height = 110 * ZOOM_LEVEL;
          // Foundation base
          ctx.fillStyle = '#44403c';
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x - w/2, pos.y - h/2); ctx.lineTo(pos.x - w/2, pos.y - h/2 - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x, pos.y - 10 * ZOOM_LEVEL); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x + w/2, pos.y - h/2 - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x + w/2, pos.y - h/2 - height); ctx.lineTo(pos.x, pos.y - height); ctx.closePath(); ctx.fill();
          // Left wall (back)
          ctx.fillStyle = theme.buildingWall;
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x - w/2, pos.y - h/2 - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x - w/2, pos.y - h/2 - height); ctx.lineTo(pos.x, pos.y - height); ctx.closePath(); ctx.fill();
          // Right wall (front) - brighter
          ctx.fillStyle = '#c8b8a8';
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x + w/2, pos.y - h/2 - 10 * ZOOM_LEVEL); ctx.lineTo(pos.x + w/2, pos.y - h/2 - height); ctx.lineTo(pos.x, pos.y - height); ctx.closePath(); ctx.fill();
          // Door (simple rectangle at front-center)
          const doorW = 18 * ZOOM_LEVEL; const doorH = 30 * ZOOM_LEVEL;
          const doorX = pos.x + w/4 - doorW/2;
          const doorY = pos.y - h/4 - doorH;
          ctx.fillStyle = '#5a3a1a';
          ctx.fillRect(doorX, doorY, doorW, doorH);
          // Roof
          ctx.fillStyle = theme.buildingRoofShadow;
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - height); ctx.lineTo(pos.x - w/2 - 6 * ZOOM_LEVEL, pos.y - h/2 - height + 5); ctx.lineTo(pos.x, pos.y - height - 60 * ZOOM_LEVEL); ctx.lineTo(pos.x + w/2 + 6 * ZOOM_LEVEL, pos.y - h/2 - height + 5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = theme.buildingRoof;
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - height + 3); ctx.lineTo(pos.x - w/2 - 6 * ZOOM_LEVEL, pos.y - h/2 - height + 8); ctx.lineTo(pos.x, pos.y - height - 60 * ZOOM_LEVEL); ctx.lineTo(pos.x + w/2 + 6 * ZOOM_LEVEL, pos.y - h/2 - height + 8); ctx.closePath(); ctx.fill();
      } else if (prop.type === PropType.ROCK) {
          const rw = prop.width * ZOOM_LEVEL, rh = prop.width * 0.7 * ZOOM_LEVEL;
          ctx.fillStyle = theme.rockDark; ctx.beginPath(); ctx.ellipse(pos.x + 2, pos.y + 2, rw, rh, 0, 0, Math.PI*2); ctx.fill();
          const grad = ctx.createLinearGradient(pos.x, pos.y - rh, pos.x, pos.y + rh);
          grad.addColorStop(0, theme.rockLight); grad.addColorStop(1, theme.rock);
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.moveTo(pos.x - rw, pos.y); ctx.lineTo(pos.x - rw/2, pos.y - rh); ctx.lineTo(pos.x + rw/2, pos.y - rh*0.8); ctx.lineTo(pos.x + rw, pos.y); ctx.lineTo(pos.x + rw/2, pos.y + rh*0.8); ctx.lineTo(pos.x - rw/2, pos.y + rh); ctx.fill();
          // Crack detail
          ctx.strokeStyle = theme.rockDark;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - rh*0.3); ctx.lineTo(pos.x + rw*0.2, pos.y + rh*0.1); ctx.lineTo(pos.x - rw*0.1, pos.y + rh*0.3); ctx.stroke();
      }
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, entity: Entity, pos: Vector2) => {
      const isPlayer = entity.type === EntityType.PLAYER;
      const isBoss = entity.type === EntityType.BOSS;
      const isCavalry = entity.type === EntityType.ENEMY_CAVALRY;
      const isArcher = entity.type === EntityType.ENEMY_ARCHER;
      const isCaptain = entity.type === EntityType.ENEMY_CAPTAIN;
      const scale = ZOOM_LEVEL;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 2, 18 * scale, 8 * scale, 0, 0, Math.PI*2); ctx.fill();
      if (entity.isDead) {
          ctx.globalAlpha = entity.deathTimer / 4; ctx.rotate(Math.PI / 2); ctx.translate(15 * scale, 0);
      }
      const facingX = Math.cos(entity.facing);
      ctx.scale(facingX > 0 ? 1 : -1, 1);
      const bounce = Math.abs(Math.sin(entity.walkFrame)) * (4 * scale);
      const idleBob = Math.sin(timeRef.current * 2) * (1.5 * scale); // Idle breathing

      // Musou aura
      if (isPlayer && isMusouActiveRef.current) {
        ctx.shadowBlur = 30; ctx.shadowColor = Constants.COLORS.MUSOU_ACTIVE;
        ctx.globalAlpha = 0.3 + Math.sin(timeRef.current * 10) * 0.15;
        ctx.fillStyle = Constants.COLORS.MUSOU_ACTIVE;
        ctx.beginPath(); ctx.arc(0, -20 * scale, 30 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }

      let riderY = 0;
      if (isCavalry) {
          riderY = -20 * scale;
          // Horse body
          ctx.fillStyle = Constants.COLORS.HORSE_BODY;
          ctx.beginPath(); ctx.ellipse(0, -15 * scale + bounce/2, 28 * scale, 14 * scale, 0, 0, Math.PI*2); ctx.fill();
          // Horse head
          ctx.save(); ctx.translate(22 * scale, -28 * scale + bounce/2); ctx.rotate(Math.PI/6);
          ctx.fillStyle = Constants.COLORS.HORSE_BODY; ctx.beginPath(); ctx.ellipse(0, 0, 14 * scale, 8 * scale, 0, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = Constants.COLORS.HORSE_MANE; ctx.beginPath(); ctx.arc(-5*scale, -5*scale, 6*scale, 0, Math.PI*2); ctx.fill();
          // Eye
          ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(5*scale, -2*scale, 2*scale, 0, Math.PI*2); ctx.fill();
          ctx.restore();
          // Horse legs
          ctx.fillStyle = Constants.COLORS.HORSE_MANE;
          ctx.fillRect(-15*scale, -8*scale + Math.sin(timeRef.current * 5) * 3*scale, 4*scale, 12*scale);
          ctx.fillRect(10*scale, -8*scale + Math.sin(timeRef.current * 5 + Math.PI) * 3*scale, 4*scale, 12*scale);
      }

      ctx.translate(0, riderY);
      
      if (!isCavalry) {
          // Legs with boots
          const legH = 14 * scale;
          ctx.fillStyle = '#1f2937';
          ctx.save(); ctx.translate(-5*scale, -12*scale + bounce + idleBob); ctx.rotate(Math.sin(entity.walkFrame)*0.6); ctx.fillRect(-3*scale, 0, 6*scale, legH); ctx.restore();
          ctx.save(); ctx.translate(5*scale, -12*scale + bounce + idleBob); ctx.rotate(Math.sin(entity.walkFrame + Math.PI)*0.6); ctx.fillRect(-3*scale, 0, 6*scale, legH); ctx.restore();
          // Boots
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(-7*scale, -2*scale + bounce + idleBob, 4*scale, 4*scale);
          ctx.fillRect(3*scale, -2*scale + bounce + idleBob, 4*scale, 4*scale);
      }

      // Body with armor details
      const bodyTop = -34 * scale + bounce + idleBob;
      
      if (isPlayer && entity.heroType !== undefined) {
        // --- HERO-SPECIFIC BODY ---
        const heroType = entity.heroType;
        if (heroType === HeroType.WARRIOR) {
          // Chinese lamellar armor
          const bodyGrad = ctx.createLinearGradient(-10*scale, bodyTop, 10*scale, bodyTop + 24*scale);
          bodyGrad.addColorStop(0, '#3b82f6'); bodyGrad.addColorStop(1, '#1e3a5f');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath(); ctx.roundRect(-9 * scale, bodyTop, 18 * scale, 24 * scale, 2*scale); ctx.fill();
          // Lamellar pattern (horizontal lines)
          ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 0.5;
          for (let l = 0; l < 4; l++) {
            ctx.beginPath(); ctx.moveTo(-7*scale, bodyTop + 4*scale + l*5*scale); ctx.lineTo(7*scale, bodyTop + 4*scale + l*5*scale); ctx.stroke();
          }
          // Belt
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-9*scale, bodyTop + 18*scale, 18*scale, 3*scale);
          // Wide shoulder pads
          ctx.fillStyle = '#1e3a5f';
          ctx.beginPath(); ctx.arc(-11*scale, bodyTop + 2*scale, 6*scale, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(11*scale, bodyTop + 2*scale, 6*scale, 0, Math.PI*2); ctx.fill();
          // Gold trim
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(-11*scale, bodyTop + 2*scale, 3*scale, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(11*scale, bodyTop + 2*scale, 3*scale, 0, Math.PI*2); ctx.fill();
        } else if (heroType === HeroType.VIKING) {
          // Fur and leather
          const bodyGrad = ctx.createLinearGradient(-10*scale, bodyTop, 10*scale, bodyTop + 24*scale);
          bodyGrad.addColorStop(0, '#7f1d1d'); bodyGrad.addColorStop(1, '#3a0a0a');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath(); ctx.roundRect(-9 * scale, bodyTop, 18 * scale, 24 * scale, 2*scale); ctx.fill();
          // Fur collar
          ctx.fillStyle = '#8a6a4a';
          ctx.beginPath(); ctx.arc(0, bodyTop + 2*scale, 11*scale, 0, Math.PI); ctx.fill();
          ctx.fillStyle = '#6a4a2a';
          ctx.beginPath(); ctx.arc(0, bodyTop + 2*scale, 8*scale, 0, Math.PI); ctx.fill();
          // Leather belt
          ctx.fillStyle = '#451a03';
          ctx.fillRect(-9*scale, bodyTop + 18*scale, 18*scale, 4*scale);
          // No shoulder pads - bare arms look
        } else if (heroType === HeroType.SAMURAI) {
          // Light samurai armor (do)
          const bodyGrad = ctx.createLinearGradient(-10*scale, bodyTop, 10*scale, bodyTop + 24*scale);
          bodyGrad.addColorStop(0, '#1f2937'); bodyGrad.addColorStop(1, '#0a0a0a');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath(); ctx.roundRect(-9 * scale, bodyTop, 18 * scale, 24 * scale, 2*scale); ctx.fill();
          // Armor panel lines
          ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(-7*scale, bodyTop + 6*scale); ctx.lineTo(7*scale, bodyTop + 6*scale); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-7*scale, bodyTop + 12*scale); ctx.lineTo(7*scale, bodyTop + 12*scale); ctx.stroke();
          // Obi (belt/sash)
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-9*scale, bodyTop + 18*scale, 18*scale, 3*scale);
          // Small shoulder plates
          ctx.fillStyle = '#374151';
          ctx.beginPath(); ctx.arc(-9*scale, bodyTop + 3*scale, 4*scale, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(9*scale, bodyTop + 3*scale, 4*scale, 0, Math.PI*2); ctx.fill();
        }
      } else {
        // Default body for non-player entities
        const bodyGrad = ctx.createLinearGradient(-10*scale, bodyTop, 10*scale, bodyTop + 24*scale);
        bodyGrad.addColorStop(0, entity.color); bodyGrad.addColorStop(1, '#111827');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.roundRect(-9 * scale, bodyTop, 18 * scale, 24 * scale, 2*scale); ctx.fill();
        
        // Chest plate detail
        ctx.fillStyle = '#9ca3af';
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.roundRect(-5*scale, bodyTop + 4*scale, 10*scale, 8*scale, 1*scale); ctx.fill();
        ctx.globalAlpha = 1;
        
        // Belt
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-9*scale, bodyTop + 16*scale, 18*scale, 3*scale);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2*scale, bodyTop + 16*scale, 4*scale, 3*scale);

        // Shoulder pads
        ctx.fillStyle = '#374151';
        ctx.beginPath(); ctx.arc(-10*scale, bodyTop + 4*scale, 5*scale, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(10*scale, bodyTop + 4*scale, 5*scale, 0, Math.PI*2); ctx.fill();
        if (isCaptain || isBoss) {
          ctx.fillStyle = isBoss ? Constants.COLORS.BOSS_GOLD : '#fbbf24';
          ctx.beginPath(); ctx.arc(-10*scale, bodyTop + 4*scale, 3*scale, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(10*scale, bodyTop + 4*scale, 3*scale, 0, Math.PI*2); ctx.fill();
        }
      }

      // Cape for captains/boss
      if (isCaptain || isBoss) {
        ctx.fillStyle = isBoss ? '#7f1d1d' : '#991b1b';
        ctx.globalAlpha = 0.6;
        const capeSway = Math.sin(timeRef.current * 3 + entity.id.length) * (3*scale);
        ctx.beginPath(); ctx.moveTo(-8*scale, bodyTop + 5*scale);
        ctx.quadraticCurveTo(-12*scale + capeSway, bodyTop + 30*scale, -3*scale + capeSway*0.5, bodyTop + 40*scale);
        ctx.quadraticCurveTo(3*scale + capeSway*0.5, bodyTop + 35*scale, 8*scale, bodyTop + 5*scale);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Boss glow
      if (isBoss && !entity.isDead) {
        ctx.shadowBlur = 20; ctx.shadowColor = Constants.COLORS.BOSS_GOLD;
        ctx.strokeStyle = Constants.COLORS.BOSS_GOLD; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-12 * scale, bodyTop - 3*scale, 24 * scale, 28 * scale, 3*scale); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      // Head
      const headY = -38 * scale + bounce + idleBob;
      ctx.fillStyle = Constants.COLORS.SKIN; ctx.beginPath(); ctx.arc(0, headY, 8 * scale, 0, Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(-3*scale, headY - 1*scale, 1.5*scale, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(3*scale, headY - 1*scale, 1.5*scale, 0, Math.PI*2); ctx.fill();
      
      // Hero-specific headgear
      if (isPlayer && entity.heroType !== undefined) {
        const heroType = entity.heroType;
        if (heroType === HeroType.WARRIOR) {
          // Chinese general helmet
          ctx.fillStyle = '#1e3a5f';
          ctx.beginPath(); ctx.moveTo(-8*scale, headY - 1*scale); ctx.quadraticCurveTo(0, headY - 14*scale, 8*scale, headY - 1*scale); ctx.lineTo(8*scale, headY + 3*scale); ctx.lineTo(-8*scale, headY + 3*scale); ctx.fill();
          // Gold trim
          ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-8*scale, headY - 1*scale); ctx.quadraticCurveTo(0, headY - 14*scale, 8*scale, headY - 1*scale); ctx.stroke();
          // Red feather/plume
          ctx.fillStyle = '#dc2626';
          ctx.beginPath(); ctx.moveTo(-1*scale, headY - 12*scale); ctx.lineTo(0, headY - 20*scale); ctx.lineTo(1*scale, headY - 12*scale); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-1*scale, headY - 12*scale); ctx.lineTo(-3*scale, headY - 18*scale); ctx.lineTo(0, headY - 12*scale); ctx.fill();
        } else if (heroType === HeroType.VIKING) {
          // Horned helmet
          ctx.fillStyle = '#4a4a4a';
          ctx.beginPath(); ctx.moveTo(-8*scale, headY - 1*scale); ctx.quadraticCurveTo(0, headY - 12*scale, 8*scale, headY - 1*scale); ctx.lineTo(8*scale, headY + 3*scale); ctx.lineTo(-8*scale, headY + 3*scale); ctx.fill();
          // Left horn
          ctx.fillStyle = '#6a6a6a';
          ctx.beginPath(); ctx.moveTo(-7*scale, headY - 6*scale); ctx.lineTo(-14*scale, headY - 18*scale); ctx.lineTo(-10*scale, headY - 12*scale); ctx.fill();
          // Right horn
          ctx.beginPath(); ctx.moveTo(7*scale, headY - 6*scale); ctx.lineTo(14*scale, headY - 18*scale); ctx.lineTo(10*scale, headY - 12*scale); ctx.fill();
          // Nose guard
          ctx.fillStyle = '#6a6a6a';
          ctx.fillRect(-2*scale, headY - 2*scale, 4*scale, 6*scale);
        } else if (heroType === HeroType.SAMURAI) {
          // Kabuto helmet
          ctx.fillStyle = '#1a1a2e';
          ctx.beginPath(); ctx.moveTo(-8*scale, headY - 1*scale); ctx.quadraticCurveTo(0, headY - 14*scale, 8*scale, headY - 1*scale); ctx.lineTo(8*scale, headY + 3*scale); ctx.lineTo(-8*scale, headY + 3*scale); ctx.fill();
          // Front crest (maedate)
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.moveTo(-1*scale, headY - 12*scale); ctx.lineTo(0, headY - 22*scale); ctx.lineTo(3*scale, headY - 18*scale); ctx.lineTo(1*scale, headY - 12*scale); ctx.fill();
          // Shikoro (neck guard flaps)
          ctx.fillStyle = '#374151';
          ctx.fillRect(-9*scale, headY + 3*scale, 18*scale, 4*scale);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-9*scale, headY + 7*scale, 18*scale, 2*scale);
        }
      } else {
        // Default helmet for non-player entities
        ctx.fillStyle = isBoss ? Constants.COLORS.BOSS_GOLD : (isArcher ? '#78350f' : '#374151');
        if (isArcher) {
             ctx.beginPath(); ctx.arc(0, headY, 8.5 * scale, Math.PI, 0); ctx.fill();
             ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5;
             ctx.beginPath(); ctx.arc(0, headY, 8.5 * scale, Math.PI, 0); ctx.stroke();
        } else {
             ctx.beginPath(); ctx.moveTo(-8*scale, headY - 2*scale); ctx.quadraticCurveTo(0, headY - 14*scale, 8*scale, headY - 2*scale); ctx.lineTo(8*scale, headY + 3*scale); ctx.lineTo(-8*scale, headY + 3*scale); ctx.fill();
             ctx.fillStyle = isBoss ? '#ff0000' : '#dc2626';
             ctx.beginPath(); ctx.moveTo(-2*scale, headY - 8*scale); ctx.lineTo(0, headY - 16*scale); ctx.lineTo(2*scale, headY - 8*scale); ctx.fill();
        }
      }

      // Shield for captain
      if (isCaptain) {
        ctx.save();
        ctx.translate(10*scale, bodyTop + 8*scale);
        ctx.fillStyle = '#374151';
        ctx.beginPath(); ctx.ellipse(0, 0, 6*scale, 10*scale, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 6*scale, 10*scale, 0, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(0, 0, 3*scale, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // Arms & Weapon
      ctx.save();
      ctx.translate((8 * scale), -26 * scale + bounce + idleBob);
      
      let aimAngle = 0;
      if (isArcher) {
          aimAngle = 0;
          if (entity.attackProgress > 0) aimAngle = -0.2;
      } else if (entity.attackProgress > 0) {
          aimAngle = Math.sin(entity.attackProgress * Math.PI) * 2.5;
      } else {
          aimAngle = -0.3 + Math.sin(timeRef.current * 2) * 0.05;
      }
      ctx.rotate(aimAngle);
      ctx.fillStyle = Constants.COLORS.SKIN; ctx.beginPath(); ctx.ellipse(-5*scale, 0, 6*scale, 3*scale, 0, 0, Math.PI*2); ctx.fill();

      if (isArcher) {
          // Bow
          ctx.lineWidth = 2 * scale; ctx.strokeStyle = '#5c4033';
          ctx.beginPath(); ctx.arc(-5*scale, 0, 15*scale, -Math.PI/2, Math.PI/2); ctx.stroke();
          ctx.lineWidth = 1; ctx.strokeStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(-5*scale, -15*scale); ctx.lineTo(-5*scale - (entity.attackProgress > 0 ? 5*scale : 0), 0); ctx.lineTo(-5*scale, 15*scale); ctx.stroke();
      } else if (isPlayer && entity.heroType !== undefined) {
          const heroType = entity.heroType;
          const wLevel = entity.weaponLevel || 0;
          if (heroType === HeroType.WARRIOR) {
            // Guan Dao (polearm with blade at top)
            ctx.fillStyle = '#451a03'; ctx.fillRect(-2 * scale, -70*scale, 4 * scale, 80*scale);
            // Blade at top
            if (wLevel === 3) { ctx.shadowBlur = 15; ctx.shadowColor = '#be185d'; }
            ctx.fillStyle = wLevel === 3 ? '#be185d' : '#9ca3af';
            ctx.beginPath(); ctx.moveTo(-6*scale, -70*scale); ctx.lineTo(6*scale, -58*scale); ctx.lineTo(6*scale, -45*scale); ctx.lineTo(-6*scale, -50*scale); ctx.fill();
            ctx.shadowBlur = 0;
            // Red tassel at base of blade
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.arc(0, -48*scale, 4*scale, 0, Math.PI*2); ctx.fill();
          } else if (heroType === HeroType.VIKING) {
            // Bearded axe
            ctx.fillStyle = '#451a03'; ctx.fillRect(-2 * scale, -55*scale, 4 * scale, 65*scale);
            if (wLevel === 3) { ctx.shadowBlur = 15; ctx.shadowColor = '#be185d'; }
            ctx.fillStyle = wLevel === 3 ? '#be185d' : '#9ca3af';
            // Axe head
            ctx.beginPath(); ctx.moveTo(4*scale, -55*scale); ctx.lineTo(18*scale, -55*scale); ctx.lineTo(18*scale, -40*scale); ctx.lineTo(4*scale, -40*scale); ctx.fill();
            // Bearded lower hook
            ctx.beginPath(); ctx.moveTo(4*scale, -40*scale); ctx.lineTo(14*scale, -32*scale); ctx.lineTo(4*scale, -35*scale); ctx.fill();
            ctx.shadowBlur = 0;
          } else if (heroType === HeroType.SAMURAI) {
            // Katana
            ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-1 * scale, -65*scale, 2 * scale, 75*scale);
            // Tsuba (guard)
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath(); ctx.arc(0, -58*scale, 6*scale, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#451a03';
            ctx.beginPath(); ctx.arc(0, -58*scale, 4*scale, 0, Math.PI*2); ctx.fill();
            // Blade
            if (wLevel === 3) { ctx.shadowBlur = 15; ctx.shadowColor = '#be185d'; }
            ctx.fillStyle = wLevel === 3 ? '#be185d' : '#d1d5db';
            ctx.beginPath(); ctx.moveTo(-3*scale, -55*scale); ctx.lineTo(-3*scale, -85*scale); ctx.quadraticCurveTo(0, -95*scale, 3*scale, -85*scale); ctx.lineTo(3*scale, -55*scale); ctx.fill();
            ctx.shadowBlur = 0;
          }
      } else {
          const wLevel = entity.weaponLevel || 0;
          ctx.fillStyle = '#451a03'; ctx.fillRect(-2 * scale, -60*scale, 4 * scale, 70*scale);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-8*scale, -58*scale, 16*scale, 3*scale);
          if (isPlayer && wLevel === 3) { ctx.shadowBlur = 15; ctx.shadowColor = '#be185d'; }
          ctx.fillStyle = (isPlayer && wLevel === 3) ? '#be185d' : '#9ca3af';
          ctx.beginPath(); ctx.moveTo(-4*scale, -20*scale); ctx.lineTo(-4*scale, -55*scale); ctx.quadraticCurveTo(0, -75*scale, 8*scale, -55*scale); ctx.quadraticCurveTo(4*scale, -40*scale, 4*scale, -20*scale); ctx.fill();
          ctx.shadowBlur = 0;
      }
      ctx.restore();

      ctx.restore();
      // NOTE: First restore exits the entity transform (flip, position, etc.)
      // Label is drawn outside flip transform so text is never mirrored

      // Entity Label (name tag)
      if (!entity.isDead && entity.label) {
        const labelY = pos.y - 60 * ZOOM_LEVEL;
        ctx.font = `bold ${10 * ZOOM_LEVEL}px sans-serif`;
        const textWidth = ctx.measureText(entity.label).width;
        const pad = 4 * ZOOM_LEVEL;
        const bgW = textWidth + pad * 2;
        const bgH = 14 * ZOOM_LEVEL;
        
        // Label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath(); ctx.roundRect(pos.x - bgW/2, labelY - bgH/2, bgW, bgH, 3*ZOOM_LEVEL); ctx.fill();
        
        // Label border
        const labelColor = isPlayer ? LABEL_COLORS.player : (isBoss ? LABEL_COLORS.boss : (entity.color || '#ef4444'));
        ctx.strokeStyle = labelColor; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(pos.x - bgW/2, labelY - bgH/2, bgW, bgH, 3*ZOOM_LEVEL); ctx.stroke();
        
        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.label, pos.x, labelY);
      }

      // Health bar below
      if (!isPlayer && !entity.isDead && entity.health < entity.maxHealth) {
         const hpPct = entity.health / entity.maxHealth;
         ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(pos.x - 18 * scale, pos.y - 100 * scale, 36 * scale, 6 * scale, 2*scale); ctx.fill();
         ctx.fillStyle = isBoss ? Constants.COLORS.BOSS_GOLD : '#dc2626'; ctx.beginPath(); ctx.roundRect(pos.x - 17 * scale, pos.y - 99 * scale, 34 * scale * hpPct, 4 * scale, 1*scale); ctx.fill();
      }
  };

  const drawSlashes = (ctx: CanvasRenderingContext2D) => {
      const player = playerRef.current;
      if (player && !player.isDead && player.attackProgress > 0) {
          const pos = toScreen(player.position.x, player.position.y);
          const scale = ZOOM_LEVEL;
          ctx.save();
          ctx.translate(pos.x, pos.y - 30 * scale);
          ctx.scale(1 * scale, 0.6 * scale);
          ctx.rotate(player.facing);
          let color = isMusouActiveRef.current ? Constants.COLORS.MUSOU_ACTIVE : Constants.COLORS.PLAYER_ATTACK;
          const range = Constants.WEAPON_TIERS[selectedHero][player.weaponLevel].range * 0.85;
          const alpha = Math.sin(player.attackProgress * Math.PI);
          ctx.globalCompositeOperation = 'screen';
          ctx.shadowBlur = 25; ctx.shadowColor = color;
          const grad = ctx.createRadialGradient(0, 0, range * 0.4, 0, 0, range);
          grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(0.6, color); grad.addColorStop(0.9, 'white'); grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, range, -Math.PI/2.2, Math.PI/2.2); ctx.bezierCurveTo(range * 0.6, 0, range * 0.6, 0, 0, 0); ctx.closePath();
          ctx.globalAlpha = alpha; ctx.fill();
          ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, range, -Math.PI/2.2, Math.PI/2.2); ctx.stroke();
          ctx.restore(); ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
      }
  };

  const updateRef = useRef(update);
  const drawRef = useRef(draw);

  useEffect(() => { updateRef.current = update; }, [update]);
  useEffect(() => { drawRef.current = draw; }, [draw]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulatorRef.current += deltaTime;
      if (accumulatorRef.current > 200) accumulatorRef.current = 200;
      const FIXED_STEP = 1000 / 60;
      while (accumulatorRef.current >= FIXED_STEP) {
          updateRef.current();
          accumulatorRef.current -= FIXED_STEP;
      }
      drawRef.current();
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current) {
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = window.innerHeight;
          }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="block absolute inset-0 z-0" />;
};
