import React, { useRef, useEffect } from 'react';
import {
  Entity,
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
  BattleAnnouncement,
  FireZone,
  MinimapData,
} from '../types';
import * as Constants from '../constants';
import {
  initBattlefieldEntities,
  spawnBossEntity,
  spawnRandomWaveEnemy,
  generateBattlefieldProps,
  updateObjectiveProgress,
  calculateArmyMorale,
  executeEnemyCombat,
  updateDeadEntities,
  applyHordeSeparationPhysics,
  resolvePropCollisions,
} from './battleEngine';
import {
  updateCombatEffects,
  handleItemPickups,
  renderBattlefieldScene,
} from './combatEffects';
import {
  handlePlayerDash,
  handlePlayerAttackAction,
  handlePlayerMusouAction,
  updatePlayerMovement,
  createLiveMinimapData,
  resolveRankAndWeapon,
} from './combatActions';
import { audioEngine } from '../services/audioEngine';
import { isTauriEnvironment } from '../services/rustDynastyBridge';

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
    weaponName?: string,
    minimap?: MinimapData,
    isRustEngine?: boolean
  ) => void;
  onGameOver: (victory: boolean) => void;
  onTogglePause?: () => void;
  onAnnouncement?: (announcement: BattleAnnouncement) => void;
  mobileInputRef?: React.MutableRefObject<MobileInputState>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  selectedHero,
  selectedDifficulty,
  scenario,
  onUpdateStats,
  onGameOver,
  onTogglePause,
  onAnnouncement,
  mobileInputRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playerRef = useRef<Entity | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const propsRef = useRef<MapProp[]>([]);
  const particlesRef = useRef<any[]>([]);
  const slashesRef = useRef<SlashArc[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const fireZonesRef = useRef<FireZone[]>([]);
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
  const isRustActiveRef = useRef(false);

  const comboCountRef = useRef(0);
  const comboTimerRef = useRef(0);

  // Initialize Game World
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    basesRef.current = JSON.parse(JSON.stringify(scenario.bases));
    objectivesRef.current = JSON.parse(JSON.stringify(scenario.objectives));
    propsRef.current = generateBattlefieldProps(scenario);

    const init = initBattlefieldEntities(scenario.bases, selectedHero, selectedDifficulty);
    playerRef.current = init.player;
    cameraRef.current = { ...init.startPos };
    entitiesRef.current = init.entities;

    particlesRef.current = [];
    slashesRef.current = [];
    shockwavesRef.current = [];
    fireZonesRef.current = [];
    musouGaugeRef.current = 0;
    koCountRef.current = 0;
    bossSpawnedRef.current = false;
    comboCountRef.current = 0;

    audioEngine.startBattleDrums();
    isTauriEnvironment().then((active) => {
      isRustActiveRef.current = active;
    });

    return () => audioEngine.stopBattleDrums();
  }, [status, scenario, selectedHero, selectedDifficulty]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'Escape') {
        e.preventDefault();
        onTogglePause?.();
      } else if (e.key === 'Shift') {
        e.preventDefault();
        triggerDash();
      } else if (e.key === ' ') {
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
        triggerDash();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onTogglePause]);

  const triggerDash = () => {
    handlePlayerDash(playerRef.current, shockwavesRef.current, status === GameStatus.PAUSED);
  };

  const triggerAttack = () => {
    const res = handlePlayerAttackAction(
      playerRef.current,
      entitiesRef.current,
      koCountRef.current,
      isMusouActiveRef.current,
      objectivesRef.current,
      damageTextsRef.current,
      particlesRef.current,
      slashesRef.current,
      itemsRef.current,
      scenario,
      status === GameStatus.PAUSED,
      (intensity, duration) => { screenShakeRef.current = { intensity, duration }; },
      onAnnouncement,
      onGameOver
    );

    koCountRef.current = res.newKoCount;
    if (res.newComboHits > 0) {
      comboCountRef.current += res.newComboHits;
      comboTimerRef.current = 120;
      if (!isMusouActiveRef.current && res.musouDelta > 0) {
        musouGaugeRef.current = Math.min(Constants.MUSOU_GAUGE_MAX, musouGaugeRef.current + res.musouDelta);
      }
    }
  };

  const triggerMusou = () => {
    const res = handlePlayerMusouAction(
      playerRef.current,
      musouGaugeRef.current,
      isMusouActiveRef.current,
      entitiesRef.current,
      shockwavesRef.current,
      particlesRef.current,
      objectivesRef.current,
      status === GameStatus.PAUSED,
      (intensity, duration) => { screenShakeRef.current = { intensity, duration }; },
      onGameOver
    );

    if (res.activated) {
      isMusouActiveRef.current = true;
      koCountRef.current += res.kills;
    }
  };

  // Main Loop
  useEffect(() => {
    if (status !== GameStatus.PLAYING && status !== GameStatus.PAUSED) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const loop = () => {
      if (status === GameStatus.PAUSED) {
        renderBattlefieldScene(
          ctx,
          cameraRef.current.x,
          cameraRef.current.y,
          basesRef.current,
          propsRef.current,
          itemsRef.current,
          entitiesRef.current,
          slashesRef.current,
          particlesRef.current,
          shockwavesRef.current,
          fireZonesRef.current,
          scenario.mapTheme,
          timeRef.current,
          isMusouActiveRef.current
        );
        animId = requestAnimationFrame(loop);
        return;
      }

      timeRef.current += 0.016;
      const player = playerRef.current;

      if (screenShakeRef.current.duration > 0) screenShakeRef.current.duration--;

      // Handle Player Movement & Input
      if (player && !player.isDead) {
        updatePlayerMovement(
          player,
          keysRef.current,
          mobileInputRef?.current,
          isMusouActiveRef.current,
          cameraRef.current,
          triggerAttack,
          triggerMusou
        );

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
              audioEngine.playFanfare();
              onAnnouncement?.({
                id: `base_${base.id}`,
                title: 'OUTPOST CAPTURED!',
                subtitle: `${base.name} is now secured by Allied forces!`,
                type: 'morale',
                color: '#38bdf8',
              });
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
        audioEngine.playFanfare();
        onAnnouncement?.({
          id: 'boss_spawn',
          title: 'SUPREME COMMANDER APPROACHES!',
          subtitle: `${scenario.bossName} has entered the battlefield!`,
          type: 'officer_slain',
          color: '#f43f5e',
        });
      }

      // Wave Spawns
      waveTimerRef.current++;
      if (waveTimerRef.current > Constants.WAVE_INTERVAL && entitiesRef.current.length < Constants.MAX_ENEMIES) {
        waveTimerRef.current = 0;
        const enemyBase = basesRef.current.find((b) => b.affiliation === BaseAffiliation.ENEMY);
        if (enemyBase) {
          for (let i = 0; i < 4; i++) {
            entitiesRef.current.push(
              spawnRandomWaveEnemy(
                `wave_${Date.now()}_${i}`,
                { x: enemyBase.x + (Math.random() - 0.5) * 100, y: enemyBase.y + (Math.random() - 0.5) * 100 },
                selectedDifficulty
              )
            );
          }
        }
      }

      // Unit Separation & Horde Physics
      applyHordeSeparationPhysics(entitiesRef.current);

      // Solid Collision with Battlefield Obstacles (rocks, barricades, buildings)
      resolvePropCollisions(entitiesRef.current, propsRef.current);

      // Enemy Combat (AI attacks player, deals damage, triggers hit flash & damage numbers)
      if (player) {
        executeEnemyCombat(
          entitiesRef.current,
          player,
          damageTextsRef.current,
          onGameOver,
          (intensity, duration) => { screenShakeRef.current = { intensity, duration }; }
        );
      }

      // Clean up dead entities
      entitiesRef.current = updateDeadEntities(entitiesRef.current);

      // Update Effects & Pickups
      const effects = updateCombatEffects(
        particlesRef.current,
        slashesRef.current,
        shockwavesRef.current,
        fireZonesRef.current,
        player
      );
      particlesRef.current = effects.activeParticles;
      slashesRef.current = effects.activeSlashes;
      shockwavesRef.current = effects.activeShockwaves;
      fireZonesRef.current = effects.activeFireZones;

      if (player && !player.isDead) {
        itemsRef.current = handleItemPickups(
          player,
          itemsRef.current,
          () => { musouGaugeRef.current = Constants.MUSOU_GAUGE_MAX; },
          () => { audioEngine.playPickup(); }
        );
      }

      // Morale, Objectives & Live Minimap Telemetry
      const morale = calculateArmyMorale(basesRef.current, koCountRef.current);
      const { rank, weaponName } = resolveRankAndWeapon(
        comboCountRef.current,
        koCountRef.current,
        player?.heroType || HeroType.GUAN_YU
      );
      const activeObjective = objectivesRef.current.find((o) => !o.completed);
      const liveMinimap = createLiveMinimapData(
        player,
        entitiesRef.current,
        basesRef.current,
        itemsRef.current,
        cameraRef.current
      );

      onUpdateStats(
        player ? player.health : 0,
        musouGaugeRef.current,
        koCountRef.current,
        morale.allied,
        morale.enemy,
        activeObjective,
        comboCountRef.current,
        rank,
        weaponName,
        liveMinimap,
        isRustActiveRef.current
      );

      // Rendering Pass
      ctx.fillStyle = Constants.MAP_THEMES[scenario.mapTheme].groundBase;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current.duration > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current.intensity;
      }

      renderBattlefieldScene(
        ctx,
        cameraRef.current.x + shakeX,
        cameraRef.current.y + shakeY,
        basesRef.current,
        propsRef.current,
        itemsRef.current,
        entitiesRef.current,
        slashesRef.current,
        particlesRef.current,
        shockwavesRef.current,
        fireZonesRef.current,
        scenario.mapTheme,
        timeRef.current,
        isMusouActiveRef.current
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [status, scenario, selectedHero, selectedDifficulty, onGameOver, onUpdateStats, onAnnouncement]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="absolute inset-0 w-full h-full block cursor-crosshair"
    />
  );
};
