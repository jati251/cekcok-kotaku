import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMobaStore } from '../../stores/mobaStore';
import { HERO_REGISTRY } from '../../constants/heroes';
import {
  INITIAL_TURRETS,
  INITIAL_BASE_CORES,
  INITIAL_JUNGLE_CAMPS,
  BUSH_ZONES,
  BASE_SPAWNS,
} from '../../constants/mapData';
import type { ActiveHeroEntity } from '../../types/hero';
import type { MinionEntity, TurretEntity, BaseCoreEntity, JungleCampEntity } from '../../types/map';
import type { ActiveSkillVFX, Projectile, FloatingText } from '../../types/combat';
import { LandOfDawnMap } from './LandOfDawnMap';
import { Turret3D } from './Turret3D';
import { BaseCore3D } from './BaseCore3D';
import { HeroEntity3D } from './HeroEntity3D';
import { Minion3D } from './Minion3D';
import { JungleMonster3D } from './JungleMonster3D';
import { SkillVFX3D } from './SkillVFX3D';
import { DamageNumber3D } from './DamageNumber3D';
import { MobaCamera } from './MobaCamera';
import { spawnMinionWave, updateMinionMovementAndCombat } from '../../engine/minionEngine';
import { updateTurrets } from '../../engine/turretEngine';
import { updateJungleCamps } from '../../engine/jungleEngine';
import { updateHeroBots, type BotRoleAssignment } from '../../engine/aiController';
import { mobaAudio } from '../../engine/audioEngine';

function MobaSimulation() {
  const {
    selectedHeroId,
    selectedSpellId,
    updateTelemetry,
    incrementMatchDuration,
    recordKill,
    pushAnnouncerBanner,
    endMatch,
  } = useMobaStore();

  const heroDef = HERO_REGISTRY[selectedHeroId] || HERO_REGISTRY.layla;

  // --- 1. Entities Simulation State via Refs for 60 FPS performance ---
  const playerHeroRef = useRef<ActiveHeroEntity>({
    id: 'player_hero',
    heroDefId: selectedHeroId,
    team: 'blue',
    name: heroDef.name,
    isPlayer: true,
    level: 1,
    exp: 0,
    expToNextLevel: 200,
    currentHp: heroDef.baseStats.maxHp,
    currentMana: heroDef.baseStats.maxMana,
    gold: 300,
    netWorth: 300,
    position: { ...BASE_SPAWNS.blue },
    rotationY: 0,
    targetPosition: null,
    targetEntityId: null,
    state: 'idle',
    skillLevels: [1, 0, 0],
    skillCooldowns: [0, 0, 0],
    spellCooldown: 0,
    regenCooldown: 0,
    recallTimer: 0,
    respawnTimer: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    items: [],
    buffs: {
      hasBlueBuff: false,
      blueBuffTimer: 0,
      hasRedBuff: false,
      redBuffTimer: 0,
      turtleShield: 0,
      turtleShieldTimer: 0,
      immortalityAvailable: true,
      immortalityCooldown: 0,
    },
    ccState: { type: 'none', duration: 0 },
    inBush: false,
    isStealthed: false,
    stealthTimer: 0,
  });

  // 9 AI Bots
  const botsRef = useRef<ActiveHeroEntity[]>([
    // Blue Allies
    {
      id: 'bot_blue_tigreal',
      heroDefId: 'tigreal',
      team: 'blue',
      name: 'Allied Tigreal',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 3200,
      currentMana: 450,
      gold: 300,
      netWorth: 300,
      position: { x: -65, y: 0, z: 65 },
      rotationY: 0,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_blue_eudora',
      heroDefId: 'eudora',
      team: 'blue',
      name: 'Allied Eudora',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2450,
      currentMana: 500,
      gold: 300,
      netWorth: 300,
      position: { x: -62, y: 0, z: 68 },
      rotationY: 0,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_blue_saber',
      heroDefId: 'saber',
      team: 'blue',
      name: 'Allied Saber',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2600,
      currentMana: 430,
      gold: 300,
      netWorth: 300,
      position: { x: -68, y: 0, z: 62 },
      rotationY: 0,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_blue_alucard',
      heroDefId: 'alucard',
      team: 'blue',
      name: 'Allied Alucard',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2850,
      currentMana: 0,
      gold: 300,
      netWorth: 300,
      position: { x: -64, y: 0, z: 64 },
      rotationY: 0,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },

    // Red Enemies
    {
      id: 'bot_red_miya',
      heroDefId: 'miya',
      team: 'red',
      name: 'Enemy Miya',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2520,
      currentMana: 440,
      gold: 300,
      netWorth: 300,
      position: { x: 65, y: 0, z: -65 },
      rotationY: Math.PI,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_red_tigreal',
      heroDefId: 'tigreal',
      team: 'red',
      name: 'Enemy Tigreal',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 3200,
      currentMana: 450,
      gold: 300,
      netWorth: 300,
      position: { x: 62, y: 0, z: -68 },
      rotationY: Math.PI,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_red_eudora',
      heroDefId: 'eudora',
      team: 'red',
      name: 'Enemy Eudora',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2450,
      currentMana: 500,
      gold: 300,
      netWorth: 300,
      position: { x: 68, y: 0, z: -62 },
      rotationY: Math.PI,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_red_saber',
      heroDefId: 'saber',
      team: 'red',
      name: 'Enemy Saber',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2600,
      currentMana: 430,
      gold: 300,
      netWorth: 300,
      position: { x: 64, y: 0, z: -64 },
      rotationY: Math.PI,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
    {
      id: 'bot_red_alucard',
      heroDefId: 'alucard',
      team: 'red',
      name: 'Enemy Alucard',
      isPlayer: false,
      level: 1,
      exp: 0,
      expToNextLevel: 200,
      currentHp: 2850,
      currentMana: 0,
      gold: 300,
      netWorth: 300,
      position: { x: 66, y: 0, z: -66 },
      rotationY: Math.PI,
      targetPosition: null,
      targetEntityId: null,
      state: 'idle',
      skillLevels: [1, 0, 0],
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      regenCooldown: 0,
      recallTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      items: [],
      buffs: { hasBlueBuff: false, blueBuffTimer: 0, hasRedBuff: false, redBuffTimer: 0, turtleShield: 0, turtleShieldTimer: 0, immortalityAvailable: true, immortalityCooldown: 0 },
      ccState: { type: 'none', duration: 0 },
      inBush: false,
      isStealthed: false,
      stealthTimer: 0,
    },
  ]);

  const botRolesRef = useRef<Map<string, BotRoleAssignment>>(
    new Map([
      ['bot_blue_tigreal', { heroId: 'bot_blue_tigreal', lane: 'bot', waypointIndex: 2, combatState: 'laning' }],
      ['bot_blue_eudora', { heroId: 'bot_blue_eudora', lane: 'mid', waypointIndex: 2, combatState: 'laning' }],
      ['bot_blue_saber', { heroId: 'bot_blue_saber', lane: 'jungle', waypointIndex: 1, combatState: 'laning' }],
      ['bot_blue_alucard', { heroId: 'bot_blue_alucard', lane: 'top', waypointIndex: 2, combatState: 'laning' }],
      ['bot_red_miya', { heroId: 'bot_red_miya', lane: 'bot', waypointIndex: 2, combatState: 'laning' }],
      ['bot_red_tigreal', { heroId: 'bot_red_tigreal', lane: 'bot', waypointIndex: 2, combatState: 'laning' }],
      ['bot_red_eudora', { heroId: 'bot_red_eudora', lane: 'mid', waypointIndex: 2, combatState: 'laning' }],
      ['bot_red_saber', { heroId: 'bot_red_saber', lane: 'jungle', waypointIndex: 1, combatState: 'laning' }],
      ['bot_red_alucard', { heroId: 'bot_red_alucard', lane: 'top', waypointIndex: 2, combatState: 'laning' }],
    ])
  );

  const turretsRef = useRef<TurretEntity[]>(JSON.parse(JSON.stringify(INITIAL_TURRETS)));
  const coresRef = useRef<Record<'blue' | 'red', BaseCoreEntity>>(JSON.parse(JSON.stringify(INITIAL_BASE_CORES)));
  const jungleCampsRef = useRef<JungleCampEntity[]>(JSON.parse(JSON.stringify(INITIAL_JUNGLE_CAMPS)));
  const minionsRef = useRef<MinionEntity[]>([]);
  const vfxRef = useRef<ActiveSkillVFX[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);

  // State for rendering
  const [minions, setMinions] = useState<MinionEntity[]>([]);
  const [vfxList, setVfxList] = useState<ActiveSkillVFX[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [floatingTexts] = useState<FloatingText[]>([]);

  const waveTimerRef = useRef(0);
  const throttleRef = useRef(0);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Input Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      const player = playerHeroRef.current;
      if (player.state === 'dead') return;

      // Skill 1 (Q)
      if (e.key.toLowerCase() === 'q') {
        castPlayerSkill(0);
      }
      // Skill 2 (W)
      if (e.key.toLowerCase() === 'w') {
        castPlayerSkill(1);
      }
      // Skill 3 / Ult (E)
      if (e.key.toLowerCase() === 'e') {
        castPlayerSkill(2);
      }
      // Spell (D)
      if (e.key.toLowerCase() === 'd') {
        castPlayerSpell();
      }
      // Recall (B)
      if (e.key.toLowerCase() === 'b') {
        player.state = 'recalling';
        player.recallTimer = 5.0;
        mobaAudio.playSkill('dash');
      }
      // Basic Attack (Space)
      if (e.code === 'Space') {
        performPlayerBasicAttack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedSpellId]);

  // Player Actions
  const castPlayerSkill = (skillIndex: 0 | 1 | 2) => {
    const player = playerHeroRef.current;
    if (player.skillLevels[skillIndex] === 0 || player.skillCooldowns[skillIndex] > 0) return;

    const skill = heroDef.skills[skillIndex];
    if (player.currentMana < (skill.manaCostByLevel[player.skillLevels[skillIndex] - 1] || 0)) return;

    player.currentMana -= skill.manaCostByLevel[player.skillLevels[skillIndex] - 1] || 0;
    player.skillCooldowns[skillIndex] = skill.cooldownByLevel[player.skillLevels[skillIndex] - 1] || 8;

    mobaAudio.playSkill(skillIndex === 2 ? 'ult' : 'lightning');

    // Add VFX
    vfxRef.current.push({
      id: `${Date.now()}_vfx`,
      vfxType: skillIndex === 2 ? 'malefic_laser' : 'ground_slam',
      sourcePos: { ...player.position },
      color: heroDef.accentColor,
      radius: skill.radius || 4,
      duration: 0.8,
      elapsed: 0,
    });

    // Damage enemies in radius
    botsRef.current.forEach((bot) => {
      if (bot.team !== 'red' || bot.state === 'dead') return;
      const dist = Math.hypot(bot.position.x - player.position.x, bot.position.z - player.position.z);
      if (dist <= skill.castRange + skill.radius) {
        const dmg = (skill.baseDamageByLevel[player.skillLevels[skillIndex] - 1] || 200) + heroDef.baseStats.physicalAttack * skill.scalingRatio;
        bot.currentHp -= dmg;
        if (bot.currentHp <= 0) {
          bot.state = 'dead';
          bot.deaths += 1;
          player.kills += 1;
          player.gold += 300;
          recordKill(true);
          pushAnnouncerBanner('enemy_slain', 'Enemy Slain!', `${player.name} eliminated ${bot.name}`, 'blue');
        }
      }
    });
  };

  const castPlayerSpell = () => {
    const player = playerHeroRef.current;
    if (player.spellCooldown > 0) return;

    if (selectedSpellId === 'flicker') {
      // Dash forward
      player.position.x += Math.sin(player.rotationY) * 6;
      player.position.z += Math.cos(player.rotationY) * 6;
      player.spellCooldown = 120;
      mobaAudio.playSkill('dash');
    } else if (selectedSpellId === 'execute') {
      // Execute nearby enemy
      const enemy = botsRef.current.find(
        (b) => b.team === 'red' && b.state !== 'dead' && Math.hypot(b.position.x - player.position.x, b.position.z - player.position.z) < 4
      );
      if (enemy) {
        enemy.currentHp -= 450;
        player.spellCooldown = 90;
        mobaAudio.playSkill('lightning');
        if (enemy.currentHp <= 0) {
          enemy.state = 'dead';
          player.kills += 1;
          recordKill(true);
          pushAnnouncerBanner('enemy_slain', 'Executed!', `${player.name} executed ${enemy.name}`, 'blue');
        }
      }
    }
  };

  const performPlayerBasicAttack = () => {
    const player = playerHeroRef.current;
    // Find nearest hostile target
    const targetBot = botsRef.current.find(
      (b) => b.team === 'red' && b.state !== 'dead' && Math.hypot(b.position.x - player.position.x, b.position.z - player.position.z) <= heroDef.baseStats.attackRange
    );
    const targetMinion = minionsRef.current.find(
      (m) => m.team === 'red' && !m.isDead && Math.hypot(m.position.x - player.position.x, m.position.z - player.position.z) <= heroDef.baseStats.attackRange
    );

    if (targetBot) {
      player.rotationY = Math.atan2(targetBot.position.x - player.position.x, targetBot.position.z - player.position.z);
      mobaAudio.playAttack(heroDef.heroClass === 'marksman' ? 'arrow' : 'sword');

      // Create Projectile if ranged
      if (heroDef.baseStats.attackRange > 3) {
        projectilesRef.current.push({
          id: `${Date.now()}_proj`,
          sourceId: player.id,
          targetId: targetBot.id,
          position: { ...player.position },
          velocity: {
            x: (targetBot.position.x - player.position.x) * 2,
            y: 0,
            z: (targetBot.position.z - player.position.z) * 2,
          },
          damage: heroDef.baseStats.physicalAttack * (1 + player.level * 0.08),
          damageType: 'physical',
          isCrit: false,
          color: heroDef.color,
          rangeRemaining: 15,
          speed: 25,
        });
      } else {
        // Melee hit
        targetBot.currentHp -= heroDef.baseStats.physicalAttack * (1 + player.level * 0.08);
        if (targetBot.currentHp <= 0) {
          targetBot.state = 'dead';
          player.kills += 1;
          recordKill(true);
          pushAnnouncerBanner('enemy_slain', 'Enemy Slain!', `${player.name} eliminated ${targetBot.name}`, 'blue');
        }
      }
    } else if (targetMinion) {
      player.rotationY = Math.atan2(targetMinion.position.x - player.position.x, targetMinion.position.z - player.position.z);
      mobaAudio.playAttack('arrow');
      targetMinion.currentHp -= heroDef.baseStats.physicalAttack;
      if (targetMinion.currentHp <= 0) {
        targetMinion.isDead = true;
        player.gold += targetMinion.goldReward * 2; // Last hit bonus!
        mobaAudio.playLastHitGold();
      }
    }
  };

  // Main 60 FPS Engine Tick
  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    incrementMatchDuration(dt);

    const player = playerHeroRef.current;
    const allHeroes = [player, ...botsRef.current];

    // 1. Passive Gold & Cooldowns
    player.gold += 5 * dt;
    player.netWorth = player.gold;
    player.skillCooldowns[0] = Math.max(0, player.skillCooldowns[0] - dt);
    player.skillCooldowns[1] = Math.max(0, player.skillCooldowns[1] - dt);
    player.skillCooldowns[2] = Math.max(0, player.skillCooldowns[2] - dt);
    player.spellCooldown = Math.max(0, player.spellCooldown - dt);

    // 2. Base Fountain Healing
    const distToBase = Math.hypot(player.position.x - BASE_SPAWNS.blue.x, player.position.z - BASE_SPAWNS.blue.z);
    if (distToBase < 12) {
      player.currentHp = Math.min(heroDef.baseStats.maxHp, player.currentHp + 450 * dt);
      player.currentMana = Math.min(heroDef.baseStats.maxMana, player.currentMana + 200 * dt);
    }

    // 3. Player Movement (WASD)
    let moveX = 0;
    let moveZ = 0;
    if (keysPressed.current['w']) moveZ -= 1;
    if (keysPressed.current['s']) moveZ += 1;
    if (keysPressed.current['a']) moveX -= 1;
    if (keysPressed.current['d']) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      player.state = 'walking';
      const len = Math.hypot(moveX, moveZ);
      const step = heroDef.baseStats.movementSpeed * dt;
      player.position.x += (moveX / len) * step;
      player.position.z += (moveZ / len) * step;
      player.rotationY = Math.atan2(moveX, moveZ);
    } else if (player.state === 'walking') {
      player.state = 'idle';
    }

    // 4. Bush Detection
    player.inBush = BUSH_ZONES.some(
      (b) => player.position.x >= b.minX && player.position.x <= b.maxX && player.position.z >= b.minZ && player.position.z <= b.maxZ
    );

    // 5. Minion Wave Spawning
    waveTimerRef.current += dt;
    if (waveTimerRef.current >= 28) {
      waveTimerRef.current = 0;
      const newMinions = [
        ...spawnMinionWave('blue', 'top'),
        ...spawnMinionWave('blue', 'mid'),
        ...spawnMinionWave('blue', 'bot'),
        ...spawnMinionWave('red', 'top'),
        ...spawnMinionWave('red', 'mid'),
        ...spawnMinionWave('red', 'bot'),
      ];
      minionsRef.current.push(...newMinions);
    }

    // 6. Update Minions
    const blueMinions = minionsRef.current.filter((m) => m.team === 'blue');
    const redMinions = minionsRef.current.filter((m) => m.team === 'red');
    updateMinionMovementAndCombat(blueMinions, redMinions, dt);
    updateMinionMovementAndCombat(redMinions, blueMinions, dt);

    // 7. Update Turrets & Cores
    updateTurrets(
      turretsRef.current,
      coresRef.current,
      allHeroes,
      minionsRef.current,
      dt,
      (turret) => {
        pushAnnouncerBanner(
          turret.team === 'red' ? 'turret_destroyed' : 'enemy_turret_destroyed',
          turret.team === 'red' ? 'Turret Destroyed!' : 'Turret Lost!',
          `A ${turret.lane} turret was demolished`,
          turret.team === 'red' ? 'blue' : 'red'
        );
      },
      (team) => {
        endMatch(team === 'red'); // Victory if red core destroyed
      }
    );

    // 8. Update Jungle Camps
    updateJungleCamps(jungleCampsRef.current, allHeroes, dt, (camp, killer) => {
      killer.gold += camp.goldReward;
      killer.exp += camp.expReward;
      if (camp.campType === 'turtle') {
        pushAnnouncerBanner('turtle_slain', 'Turtle Slain!', `${killer.name} captured the Turtle!`, killer.team);
      }
      if (camp.campType === 'lord') {
        pushAnnouncerBanner('lord_summoned', 'Lord Summoned!', `${killer.name} summoned the mighty Lord!`, killer.team);
      }
    });

    // 9. Update Bots AI
    updateHeroBots(
      botsRef.current,
      allHeroes,
      minionsRef.current,
      turretsRef.current,
      coresRef.current,
      botRolesRef.current,
      dt,
      (victim, killer) => {
        recordKill(killer.team === 'blue');
        pushAnnouncerBanner(
          killer.team === 'blue' ? 'enemy_slain' : 'ally_slain',
          killer.team === 'blue' ? 'Enemy Slain!' : 'An Ally Has Been Slain',
          `${killer.name} defeated ${victim.name}`,
          killer.team
        );
      }
    );

    // 10. Update Projectiles
    projectilesRef.current.forEach((p) => {
      p.position.x += p.velocity.x * dt;
      p.position.z += p.velocity.z * dt;
      p.rangeRemaining -= p.speed * dt;
      if (p.rangeRemaining <= 0) {
        // Impact
        const target = allHeroes.find((h) => h.id === p.targetId);
        if (target) {
          target.currentHp -= p.damage;
        }
      }
    });
    projectilesRef.current = projectilesRef.current.filter((p) => p.rangeRemaining > 0);

    // 11. Throttle UI Telemetry (~15 times/sec)
    throttleRef.current += dt;
    if (throttleRef.current >= 0.066) {
      throttleRef.current = 0;
      updateTelemetry({
        currentHp: Math.max(0, player.currentHp),
        currentMana: Math.max(0, player.currentMana),
        gold: Math.floor(player.gold),
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        skillCooldowns: [...player.skillCooldowns] as [number, number, number],
        spellCooldown: player.spellCooldown,
        inBush: player.inBush,
        position: { ...player.position },
      });

      setMinions([...minionsRef.current.filter((m) => !m.isDead)]);
      setProjectiles([...projectilesRef.current]);
      setVfxList([...vfxRef.current]);
    }
  });

  return (
    <>
      {/* Dynamic Sunlight & MOBA Atmosphere */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[60, 100, 50]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <fog attach="fog" args={['#0f172a', 60, 220]} />

      {/* 3D Camera */}
      <MobaCamera targetPos={playerHeroRef.current.position} />

      {/* 3D Battlefield Map */}
      <LandOfDawnMap />

      {/* 3D Turrets & Bases */}
      {turretsRef.current.map((t) => (
        <Turret3D key={t.id} turret={t} />
      ))}
      <BaseCore3D core={coresRef.current.blue} />
      <BaseCore3D core={coresRef.current.red} />

      {/* 3D Jungle Monsters */}
      {jungleCampsRef.current.map((c) => (
        <JungleMonster3D key={c.id} camp={c} />
      ))}

      {/* 3D Minions */}
      {minions.map((m) => (
        <Minion3D key={m.id} minion={m} />
      ))}

      {/* 3D Heroes (Player + 9 Bots) */}
      <HeroEntity3D hero={playerHeroRef.current} />
      {botsRef.current.map((b) => (
        <HeroEntity3D key={b.id} hero={b} />
      ))}

      {/* 3D VFX & Projectiles */}
      <SkillVFX3D vfxList={vfxList} projectiles={projectiles} />
      <DamageNumber3D texts={floatingTexts} />
    </>
  );
}

export const MobaCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        camera={{ position: [-70, 24, 88], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <MobaSimulation />
      </Canvas>
    </div>
  );
};
