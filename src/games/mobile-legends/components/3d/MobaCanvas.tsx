import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
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
import { updateTurrets, type TurretShotEvent } from '../../engine/turretEngine';
import { updateJungleCamps } from '../../engine/jungleEngine';
import { updateHeroBots, type BotRoleAssignment } from '../../engine/aiController';
import { calculateDamage } from '../../engine/combatEngine';
import { mobaAudio } from '../../engine/audioEngine';
import { resolveEntityObstacleCollisions } from '../../engine/collisionEngine';

// Ground Raycast Plane for Mouse Click-to-Move and Skill Aiming
function GroundInteractionPlane({
  onGroundClick,
  onPointerMoveWorld,
}: {
  onGroundClick: (pt: THREE.Vector3) => void;
  onPointerMoveWorld: (pt: THREE.Vector3) => void;
}) {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      visible={false}
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        onGroundClick(e.point);
      }}
      onClick={(e) => {
        onGroundClick(e.point);
      }}
      onPointerMove={(e) => {
        raycaster.setFromCamera(e.pointer, camera);
        if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
          onPointerMoveWorld(intersectPoint);
        }
      }}
    >
      <planeGeometry args={[130, 130]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

// Click Destination Waypoint Ping Marker
function DestinationMarker({ targetPos }: { targetPos: { x: number; y: number; z: number } | null }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current && targetPos) {
      const s = 1.0 + Math.sin(clock.getElapsedTime() * 10) * 0.2;
      ringRef.current.scale.set(s, s, s);
    }
  });

  if (!targetPos) return null;

  return (
    <group position={[targetPos.x, 0.05, targetPos.z]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.9, 24]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function MobaSimulation() {
  const {
    selectedHeroId,
    selectedSpellId,
    updateTelemetry,
    updateMinimapRadar,
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
    currentBushId: null,
    revealTimer: 0,
    isStealthed: false,
    stealthTimer: 0,
  });

  // 9 AI Bots scaled to 110x110 map
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
      position: { x: -38, y: 0, z: 40 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: -38, y: 0, z: 38 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: -40, y: 0, z: 36 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: -40, y: 0, z: 38 },
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
      currentBushId: null,
      revealTimer: 0,
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
      currentHp: 2400,
      currentMana: 440,
      gold: 300,
      netWorth: 300,
      position: { x: 38, y: 0, z: -40 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: 38, y: 0, z: -38 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: 40, y: 0, z: -38 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: 40, y: 0, z: -36 },
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
      currentBushId: null,
      revealTimer: 0,
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
      position: { x: 36, y: 0, z: -40 },
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
      currentBushId: null,
      revealTimer: 0,
      isStealthed: false,
      stealthTimer: 0,
    },
  ]);

  const botRolesRef = useRef<Map<string, BotRoleAssignment>>(
    new Map([
      ['bot_blue_tigreal', { heroId: 'bot_blue_tigreal', lane: 'bot', waypointIndex: 1, combatState: 'laning' }],
      ['bot_blue_eudora', { heroId: 'bot_blue_eudora', lane: 'mid', waypointIndex: 1, combatState: 'laning' }],
      ['bot_blue_saber', { heroId: 'bot_blue_saber', lane: 'jungle', waypointIndex: 1, combatState: 'laning' }],
      ['bot_blue_alucard', { heroId: 'bot_blue_alucard', lane: 'top', waypointIndex: 1, combatState: 'laning' }],
      ['bot_red_miya', { heroId: 'bot_red_miya', lane: 'bot', waypointIndex: 1, combatState: 'laning' }],
      ['bot_red_tigreal', { heroId: 'bot_red_tigreal', lane: 'bot', waypointIndex: 1, combatState: 'laning' }],
      ['bot_red_eudora', { heroId: 'bot_red_eudora', lane: 'mid', waypointIndex: 1, combatState: 'laning' }],
      ['bot_red_saber', { heroId: 'bot_red_saber', lane: 'jungle', waypointIndex: 1, combatState: 'laning' }],
      ['bot_red_alucard', { heroId: 'bot_red_alucard', lane: 'top', waypointIndex: 1, combatState: 'laning' }],
    ])
  );

  const turretsRef = useRef<TurretEntity[]>(JSON.parse(JSON.stringify(INITIAL_TURRETS)));
  const coresRef = useRef<Record<'blue' | 'red', BaseCoreEntity>>(JSON.parse(JSON.stringify(INITIAL_BASE_CORES)));
  const jungleCampsRef = useRef<JungleCampEntity[]>(JSON.parse(JSON.stringify(INITIAL_JUNGLE_CAMPS)));
  const minionsRef = useRef<MinionEntity[]>([]);
  const vfxRef = useRef<ActiveSkillVFX[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // State for rendering
  const [minions, setMinions] = useState<MinionEntity[]>([]);
  const [vfxList, setVfxList] = useState<ActiveSkillVFX[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [destinationPos, setDestinationPos] = useState<{ x: number; y: number; z: number } | null>(null);
  const [turretTargets, setTurretTargets] = useState<Record<string, { x: number; y: number; z: number } | null>>({});

  const waveTimerRef = useRef(0);
  const throttleRef = useRef(0);
  const playerAttackCooldownRef = useRef(0);
  const mouseWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const keysPressed = useRef<Record<string, boolean>>({});

  // Add floating combat numbers and status text (STUNNED, SLOWED, etc.)
  const spawnDamageText = (
    amount: number | string,
    pos: { x: number; y: number; z: number },
    color: string = '#ef4444',
    isCrit: boolean = false
  ) => {
    const textStr = typeof amount === 'string' ? amount : `${isCrit ? '💥 ' : ''}${Math.round(amount)}`;
    floatingTextsRef.current.push({
      id: `${Date.now()}_ft_${Math.random()}`,
      text: textStr,
      position: { x: pos.x + (Math.random() - 0.5) * 0.4, y: 2.8, z: pos.z + (Math.random() - 0.5) * 0.4 },
      color: isCrit ? '#f59e0b' : color,
      scale: isCrit ? 1.4 : 1.0,
      opacity: 1.0,
      lifeTime: 0,
      maxLifeTime: 0.9,
    });
  };

  // Input Keyboard Listeners - Clean separation of WASD movement from Skills!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      const player = playerHeroRef.current;
      if (player.state === 'dead') return;

      // Cancel click-to-move when WASD is pressed
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        player.targetPosition = null;
        setDestinationPos(null);
      }

      // Skills: 1, 2, 3 OR J, K, L
      if (key === '1' || key === 'j') {
        castPlayerSkill(0);
      }
      if (key === '2' || key === 'k') {
        castPlayerSkill(1);
      }
      if (key === '3' || key === 'l') {
        castPlayerSkill(2);
      }

      // Battle Spell: F or 4
      if (key === 'f' || key === '4') {
        castPlayerSpell();
      }

      // Recall: B
      if (key === 'b') {
        player.state = 'recalling';
        player.recallTimer = 5.0;
        mobaAudio.playSkill('dash');
      }

      // Basic Attack: Space
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

  // Click on Ground plane handler (Right-Click to Move)
  const handleGroundClick = (point: THREE.Vector3) => {
    const player = playerHeroRef.current;
    if (player.state === 'dead') return;

    player.targetPosition = { x: point.x, y: 0, z: point.z };
    setDestinationPos({ x: point.x, y: 0, z: point.z });
    mobaAudio.playSkill('dash');
  };

  // Pointer move world coordinates tracking for directional skill aiming
  const handlePointerMoveWorld = (point: THREE.Vector3) => {
    mouseWorldPosRef.current.copy(point);
  };

  // Unified Skill Damage & Crowd Control Application for Player and Bots
  const applySkillDamageAndCC = (
    source: ActiveHeroEntity,
    target: ActiveHeroEntity,
    skill: (typeof heroDef.skills)[0],
    skillIndex: number
  ) => {
    const sourceDef = HERO_REGISTRY[source.heroDefId] || heroDef;
    const rawDmg =
      (skill.baseDamageByLevel[Math.max(0, source.skillLevels[skillIndex] - 1)] || 200) +
      sourceDef.baseStats.physicalAttack * skill.scalingRatio;

    const result = calculateDamage(
      {
        sourceId: source.id,
        targetId: target.id,
        rawAmount: rawDmg,
        damageType: skill.damageType,
        isSkill: true,
      },
      30,
      20,
      source,
      target
    );

    target.currentHp -= result.finalDamage;
    spawnDamageText(result.finalDamage, target.position, '#a855f7', result.isCrit);

    // Apply Crowd Control (Stun, Slow, Airborne, Silence)
    if (skill.crowdControl) {
      target.ccState = {
        type: skill.crowdControl.type,
        duration: skill.crowdControl.duration,
        slowIntensity: skill.crowdControl.intensity,
      };

      const ccText =
        skill.crowdControl.type === 'stun'
          ? '⚡ STUNNED'
          : skill.crowdControl.type === 'airborne'
          ? '🌪️ AIRBORNE'
          : skill.crowdControl.type === 'slow'
          ? '❄️ SLOWED'
          : 'SILENCED';
      spawnDamageText(ccText, target.position, '#f59e0b', true);
    }

    if (target.currentHp <= 0) {
      target.state = 'dead';
      target.deaths += 1;
      target.respawnTimer = 6 + target.level * 2;
      source.kills += 1;
      source.gold += 300;

      if (source.isPlayer) {
        recordKill(true);
        pushAnnouncerBanner('enemy_slain', 'Enemy Slain!', `${source.name} eliminated ${target.name}`, 'blue');
      } else if (target.isPlayer) {
        recordKill(false);
        pushAnnouncerBanner('ally_slain', 'You Have Been Slain!', `${source.name} eliminated you`, 'red');
      }
    }
  };

  // Player Skill Casting with Directional Aiming & Multi-Skill Dynamics
  const castPlayerSkill = (skillIndex: 0 | 1 | 2) => {
    const player = playerHeroRef.current;
    if (player.state === 'dead' || player.skillLevels[skillIndex] === 0 || player.skillCooldowns[skillIndex] > 0) return;

    // Crowd control check: cannot cast when stunned, airborne, or silenced
    if (
      player.ccState &&
      player.ccState.duration > 0 &&
      ['stun', 'airborne', 'knockup', 'silence'].includes(player.ccState.type)
    ) {
      spawnDamageText('STUNNED!', player.position, '#f59e0b');
      return;
    }

    const skill = heroDef.skills[skillIndex];
    const manaCost = skill.manaCostByLevel[player.skillLevels[skillIndex] - 1] || 0;
    if (player.currentMana < manaCost) return;

    player.currentMana -= manaCost;
    player.skillCooldowns[skillIndex] = skill.cooldownByLevel[player.skillLevels[skillIndex] - 1] || 8;

    if (player.inBush) {
      player.revealTimer = 2.5;
    }

    const aimDir = new THREE.Vector3(
      mouseWorldPosRef.current.x - player.position.x,
      0,
      mouseWorldPosRef.current.z - player.position.z
    ).normalize();

    if (aimDir.lengthSq() > 0.01) {
      player.rotationY = Math.atan2(aimDir.x, aimDir.z);
    }

    // 1. DASH / LEAP SKILLS (Saber S2, Tigreal S2, Alucard S1)
    if (skill.skillType === 'dash') {
      mobaAudio.playSkill('dash');
      const dashDist = Math.min(skill.castRange || 6, 7.5);
      player.position.x += aimDir.x * dashDist;
      player.position.z += aimDir.z * dashDist;
      resolveEntityObstacleCollisions(player.position, turretsRef.current, Object.values(coresRef.current), 0.6);

      vfxRef.current.push({
        id: `${Date.now()}_dash_${Math.random()}`,
        vfxType: 'ground_slam',
        sourcePos: { ...player.position },
        color: heroDef.accentColor,
        radius: skill.radius || 3,
        duration: 0.5,
        elapsed: 0,
      });

      // Hit enemies in landing zone / charge path
      botsRef.current.forEach((bot) => {
        if (bot.team !== 'red' || bot.state === 'dead') return;
        const dist = Math.hypot(bot.position.x - player.position.x, bot.position.z - player.position.z);
        if (dist <= (skill.radius || 2.5) + 1.2) {
          applySkillDamageAndCC(player, bot, skill, skillIndex);
        }
      });
      return;
    }

    // 2. SELF / BUFF SKILLS (Miya S1, Miya Ult, Alucard Ult)
    if (skill.skillType === 'self') {
      mobaAudio.playSkill(skillIndex === 2 ? 'ult' : 'dash');
      vfxRef.current.push({
        id: `${Date.now()}_self_${Math.random()}`,
        vfxType: 'recall_beam',
        sourcePos: { ...player.position },
        color: heroDef.accentColor,
        radius: 2.5,
        duration: 0.6,
        elapsed: 0,
      });

      if (heroDef.id === 'miya' && skillIndex === 2) {
        // Miya Ult: Cleanse CC + Stealth 3.5s + Speed Boost
        player.ccState = { type: 'none', duration: 0 };
        player.isStealthed = true;
        player.stealthTimer = 3.5;
        spawnDamageText('👻 STEALTH', player.position, '#a5b4fc');
      } else if (heroDef.id === 'miya' && skillIndex === 0) {
        spawnDamageText('✨ MOON ARROWS', player.position, '#818cf8');
      } else if (heroDef.id === 'alucard' && skillIndex === 2) {
        spawnDamageText('⚔️ FISSION WAVE', player.position, '#f43f5e');
      }
      return;
    }

    // 3. TARGETED SKILLS (Saber Ult, Eudora S2)
    if (skill.skillType === 'targeted') {
      mobaAudio.playSkill(skillIndex === 2 ? 'ult' : 'lightning');

      // Find nearest hostile hero in range
      let bestTarget: ActiveHeroEntity | null = null;
      let minTargetDist = skill.castRange + 3;
      for (const bot of botsRef.current) {
        if (bot.team !== 'red' || bot.state === 'dead') continue;
        const dist = Math.hypot(bot.position.x - player.position.x, bot.position.z - player.position.z);
        if (dist < minTargetDist) {
          minTargetDist = dist;
          bestTarget = bot;
        }
      }

      if (bestTarget) {
        // Leap to target if Saber Ult
        if (heroDef.id === 'saber' && skillIndex === 2) {
          player.position.x = bestTarget.position.x - aimDir.x * 1.5;
          player.position.z = bestTarget.position.z - aimDir.z * 1.5;
          resolveEntityObstacleCollisions(player.position, turretsRef.current, Object.values(coresRef.current), 0.6);
        }

        vfxRef.current.push({
          id: `${Date.now()}_target_${Math.random()}`,
          vfxType: skillIndex === 2 ? 'lightning_bolt' : 'malefic_laser',
          sourcePos: { ...player.position },
          targetPos: { ...bestTarget.position },
          color: heroDef.accentColor,
          radius: 2,
          duration: 0.6,
          elapsed: 0,
        });

        applySkillDamageAndCC(player, bestTarget, skill, skillIndex);
      }
      return;
    }

    // 4. AOE SKILLS (Tigreal Ult, Miya S2, Layla S2, Eudora S1)
    if (skill.skillType === 'aoe') {
      mobaAudio.playSkill(skillIndex === 2 ? 'ult' : 'lightning');
      const targetPos = {
        x: player.position.x + aimDir.x * Math.min(skill.castRange, 8),
        y: 0,
        z: player.position.z + aimDir.z * Math.min(skill.castRange, 8),
      };

      vfxRef.current.push({
        id: `${Date.now()}_aoe_${Math.random()}`,
        vfxType: skillIndex === 2 ? 'ground_slam' : 'lightning_bolt',
        sourcePos: targetPos,
        targetPos,
        color: heroDef.accentColor,
        radius: skill.radius || 4,
        duration: 0.7,
        elapsed: 0,
      });

      botsRef.current.forEach((bot) => {
        if (bot.team !== 'red' || bot.state === 'dead') return;
        const dist = Math.hypot(bot.position.x - targetPos.x, bot.position.z - targetPos.z);
        if (dist <= (skill.radius || 3.5) + 1.2) {
          // Tigreal Ult Pull Mechanic
          if (heroDef.id === 'tigreal' && skillIndex === 2) {
            bot.position.x = player.position.x + (bot.position.x - player.position.x) * 0.35;
            bot.position.z = player.position.z + (bot.position.z - player.position.z) * 0.35;
          }
          applySkillDamageAndCC(player, bot, skill, skillIndex);
        }
      });
      return;
    }

    // 5. SKILLSHOT (Layla S1, Layla S3, Tigreal S1)
    mobaAudio.playSkill(skillIndex === 2 ? 'ult' : 'lightning');
    const targetPos = {
      x: player.position.x + aimDir.x * skill.castRange,
      y: 0,
      z: player.position.z + aimDir.z * skill.castRange,
    };

    vfxRef.current.push({
      id: `${Date.now()}_vfx_${Math.random()}`,
      vfxType: skillIndex === 2 ? 'malefic_laser' : 'lightning_bolt',
      sourcePos: { ...player.position },
      targetPos,
      color: heroDef.accentColor,
      radius: skill.radius || 3,
      duration: skillIndex === 2 ? 0.75 : 0.6,
      elapsed: 0,
    });

    botsRef.current.forEach((bot) => {
      if (bot.team !== 'red' || bot.state === 'dead') return;

      const v = new THREE.Vector2(aimDir.x, aimDir.z);
      const w = new THREE.Vector2(bot.position.x - player.position.x, bot.position.z - player.position.z);
      const projection = w.dot(v);
      if (projection >= 0 && projection <= skill.castRange) {
        const perpDist = Math.abs(w.x * v.y - w.y * v.x);
        if (perpDist <= (skill.radius || 1.5) + 1.2) {
          applySkillDamageAndCC(player, bot, skill, skillIndex);
        }
      }
    });
  };

  // Battle Spell (Flicker / Execute)
  const castPlayerSpell = () => {
    const player = playerHeroRef.current;
    if (player.spellCooldown > 0) return;

    if (selectedSpellId === 'flicker') {
      const aimDir = new THREE.Vector3(
        mouseWorldPosRef.current.x - player.position.x,
        0,
        mouseWorldPosRef.current.z - player.position.z
      ).normalize();

      player.position.x += aimDir.x * 8;
      player.position.z += aimDir.z * 8;
      player.spellCooldown = 120;
      mobaAudio.playSkill('dash');

      vfxRef.current.push({
        id: `${Date.now()}_flicker`,
        vfxType: 'recall_beam',
        sourcePos: { ...player.position },
        color: '#a855f7',
        radius: 2,
        duration: 0.4,
        elapsed: 0,
      });
    } else if (selectedSpellId === 'execute') {
      const enemy = botsRef.current.find(
        (b) => b.team === 'red' && b.state !== 'dead' && Math.hypot(b.position.x - player.position.x, b.position.z - player.position.z) < 5
      );
      if (enemy) {
        const dmg = 450 + (enemy.currentHp < 1000 ? 250 : 0);
        enemy.currentHp -= dmg;
        player.spellCooldown = 90;
        mobaAudio.playSkill('lightning');
        spawnDamageText(dmg, enemy.position, '#ef4444', true);

        if (enemy.currentHp <= 0) {
          enemy.state = 'dead';
          enemy.deaths += 1;
          enemy.respawnTimer = 6 + enemy.level * 2;
          player.kills += 1;
          recordKill(true);
          pushAnnouncerBanner('enemy_slain', 'Executed!', `${player.name} executed ${enemy.name}`, 'blue');
        }
      }
    }
  };

  // Player Basic Attack with Cadence & Multi-Target Support
  const performPlayerBasicAttack = () => {
    const player = playerHeroRef.current;
    if (playerAttackCooldownRef.current > 0 || player.state === 'dead') return;

    playerAttackCooldownRef.current = 1 / heroDef.baseStats.attackSpeed;

    if (player.inBush) {
      player.revealTimer = 2.5;
    }

    const range = heroDef.baseStats.attackRange;

    // 1. Target Priority: Hostile Hero (respecting bush stealth)
    const targetBot = botsRef.current.find((b) => {
      if (b.team !== 'red' || b.state === 'dead') return false;
      const dist = Math.hypot(b.position.x - player.position.x, b.position.z - player.position.z);
      if (dist > range) return false;

      if (b.inBush) {
        const sameBush = player.inBush && player.currentBushId && player.currentBushId === b.currentBushId;
        const isRevealed = (b.revealTimer || 0) > 0;
        if (!sameBush && !isRevealed) return false;
      }
      return true;
    });

    // 2. Target Priority: Hostile Turret
    const targetTurret = turretsRef.current.find(
      (t) => !t.isDestroyed && t.team === 'red' && Math.hypot(t.position.x - player.position.x, t.position.z - player.position.z) <= range + 1.5
    );

    // 3. Target Priority: Hostile Minion
    const targetMinion = minionsRef.current.find(
      (m) => !m.isDead && m.team === 'red' && Math.hypot(m.position.x - player.position.x, m.position.z - player.position.z) <= range
    );

    // 4. Target Priority: Hostile Base Core
    const redCore = coresRef.current.red;
    const canHitCore =
      !redCore.isDestroyed && Math.hypot(redCore.position.x - player.position.x, redCore.position.z - player.position.z) <= range + 2.0;

    // Execute Attack
    if (targetBot) {
      player.rotationY = Math.atan2(targetBot.position.x - player.position.x, targetBot.position.z - player.position.z);
      mobaAudio.playAttack(heroDef.heroClass === 'marksman' ? 'arrow' : 'sword');

      const dmgResult = calculateDamage(
        {
          sourceId: player.id,
          targetId: targetBot.id,
          rawAmount: heroDef.baseStats.physicalAttack * (1 + player.level * 0.08),
          damageType: 'physical',
        },
        25,
        15,
        player,
        targetBot
      );

      if (dmgResult.lifestealHeal > 0) {
        player.currentHp = Math.min(heroDef.baseStats.maxHp, player.currentHp + dmgResult.lifestealHeal);
      }

      if (heroDef.baseStats.attackRange > 3.5) {
        projectilesRef.current.push({
          id: `${Date.now()}_proj_${Math.random()}`,
          sourceId: player.id,
          targetId: targetBot.id,
          position: { ...player.position },
          velocity: {
            x: (targetBot.position.x - player.position.x) * 2.5,
            y: 0,
            z: (targetBot.position.z - player.position.z) * 2.5,
          },
          damage: dmgResult.finalDamage,
          damageType: 'physical',
          isCrit: dmgResult.isCrit,
          color: heroDef.color,
          rangeRemaining: 16,
          speed: 26,
        });
      } else {
        targetBot.currentHp -= dmgResult.finalDamage;
        spawnDamageText(dmgResult.finalDamage, targetBot.position, '#ef4444', dmgResult.isCrit);
        if (targetBot.currentHp <= 0) {
          targetBot.state = 'dead';
          targetBot.deaths += 1;
          targetBot.respawnTimer = 6 + targetBot.level * 2;
          player.kills += 1;
          player.gold += 300;
          recordKill(true);
          pushAnnouncerBanner('enemy_slain', 'Enemy Slain!', `${player.name} eliminated ${targetBot.name}`, 'blue');
        }
      }
    } else if (targetTurret) {
      player.rotationY = Math.atan2(targetTurret.position.x - player.position.x, targetTurret.position.z - player.position.z);
      mobaAudio.playAttack('sword');
      const dmg = heroDef.baseStats.physicalAttack * 0.85;
      targetTurret.currentHp -= dmg;
      spawnDamageText(dmg, targetTurret.position, '#f59e0b');
    } else if (targetMinion) {
      player.rotationY = Math.atan2(targetMinion.position.x - player.position.x, targetMinion.position.z - player.position.z);
      mobaAudio.playAttack(heroDef.heroClass === 'marksman' ? 'arrow' : 'sword');
      const dmg = heroDef.baseStats.physicalAttack;
      targetMinion.currentHp -= dmg;
      spawnDamageText(dmg, targetMinion.position, '#ef4444');
      if (targetMinion.currentHp <= 0) {
        targetMinion.isDead = true;
        player.gold += targetMinion.goldReward * 1.5;
        mobaAudio.playLastHitGold();
      }
    } else if (canHitCore) {
      player.rotationY = Math.atan2(redCore.position.x - player.position.x, redCore.position.z - player.position.z);
      mobaAudio.playAttack('sword');
      const dmg = heroDef.baseStats.physicalAttack * 0.8;
      redCore.currentHp -= dmg;
      spawnDamageText(dmg, redCore.position, '#f43f5e');
    }
  };

  // Main 60 FPS Engine Tick
  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    incrementMatchDuration(dt);

    const player = playerHeroRef.current;
    const allHeroes = [player, ...botsRef.current];

    playerAttackCooldownRef.current = Math.max(0, playerAttackCooldownRef.current - dt);

    // 1. Passive Gold & Cooldowns
    player.gold += 5 * dt;
    player.netWorth = player.gold;
    player.skillCooldowns[0] = Math.max(0, player.skillCooldowns[0] - dt);
    player.skillCooldowns[1] = Math.max(0, player.skillCooldowns[1] - dt);
    player.skillCooldowns[2] = Math.max(0, player.skillCooldowns[2] - dt);
    player.spellCooldown = Math.max(0, player.spellCooldown - dt);
    if (player.revealTimer && player.revealTimer > 0) {
      player.revealTimer = Math.max(0, player.revealTimer - dt);
    }

    // 2. Player Death & Respawn Cycle
    if (player.state === 'dead') {
      player.respawnTimer = Math.max(0, player.respawnTimer - dt);
      if (player.respawnTimer <= 0) {
        player.position = { ...BASE_SPAWNS.blue };
        player.currentHp = heroDef.baseStats.maxHp;
        player.currentMana = heroDef.baseStats.maxMana;
        player.state = 'idle';
        player.targetPosition = null;
        setDestinationPos(null);
        pushAnnouncerBanner('respawned', 'Revived!', 'You returned to battle', 'blue');
      }
    }

    // 3. Base Fountain Healing
    const distToBase = Math.hypot(player.position.x - BASE_SPAWNS.blue.x, player.position.z - BASE_SPAWNS.blue.z);
    if (distToBase < 10 && player.state !== 'dead') {
      player.currentHp = Math.min(heroDef.baseStats.maxHp, player.currentHp + 500 * dt);
      player.currentMana = Math.min(heroDef.baseStats.maxMana, player.currentMana + 250 * dt);
    }

    // 4. Player Movement (WASD Keyboard + Click-to-Move)
    if (player.state !== 'dead') {
      let canMove = true;
      let speedMultiplier = 1.0;

      // Handle Player CC State (Stun, Airborne, Slow)
      if (player.ccState && player.ccState.duration > 0) {
        player.ccState.duration = Math.max(0, player.ccState.duration - dt);
        if (player.ccState.duration === 0) {
          player.ccState.type = 'none';
        } else if (['stun', 'airborne', 'knockup'].includes(player.ccState.type)) {
          canMove = false;
        } else if (player.ccState.type === 'slow') {
          speedMultiplier = Math.max(0.2, 1.0 - (player.ccState.slowIntensity || 0.4));
        }
      }

      if (!canMove) {
        player.state = 'idle';
        player.targetPosition = null;
        setDestinationPos(null);
      } else {
        let moveX = 0;
        let moveZ = 0;
        if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveZ -= 1;
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveZ += 1;
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX -= 1;
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
          player.state = 'walking';
          player.targetPosition = null;
          setDestinationPos(null);
          const len = Math.hypot(moveX, moveZ);
          const step = heroDef.baseStats.movementSpeed * speedMultiplier * dt;
          player.position.x += (moveX / len) * step;
          player.position.z += (moveZ / len) * step;
          player.rotationY = Math.atan2(moveX, moveZ);
        } else if (player.targetPosition) {
          const dx = player.targetPosition.x - player.position.x;
          const dz = player.targetPosition.z - player.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.8) {
            player.state = 'walking';
            const step = Math.min(dist, heroDef.baseStats.movementSpeed * speedMultiplier * dt);
            player.position.x += (dx / dist) * step;
            player.position.z += (dz / dist) * step;
            player.rotationY = Math.atan2(dx, dz);
          } else {
            player.state = 'idle';
            player.targetPosition = null;
            setDestinationPos(null);
          }
        } else if (player.state === 'walking') {
          player.state = 'idle';
        }
      }

      // Hard Obstacle Collision Check against Standing Turrets and Base Cores
      resolveEntityObstacleCollisions(
        player.position,
        turretsRef.current,
        Object.values(coresRef.current),
        0.6
      );
    }

    // 5. Bush Detection for ALL Heroes
    allHeroes.forEach((h) => {
      const bush = BUSH_ZONES.find(
        (b) => h.position.x >= b.minX && h.position.x <= b.maxX && h.position.z >= b.minZ && h.position.z <= b.maxZ
      );
      h.inBush = !!bush;
      h.currentBushId = bush ? bush.id : null;
    });

    // 6. Minion Wave Spawning
    waveTimerRef.current += dt;
    if (waveTimerRef.current >= 26) {
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

    // 7. Update Minions Movement & Mandatory Turret Siege
    const blueMinions = minionsRef.current.filter((m) => m.team === 'blue');
    const redMinions = minionsRef.current.filter((m) => m.team === 'red');
    updateMinionMovementAndCombat(blueMinions, redMinions, dt, turretsRef.current, coresRef.current);
    updateMinionMovementAndCombat(redMinions, blueMinions, dt, turretsRef.current, coresRef.current);

    // 8. Update Turrets & Cores (with real homing projectiles!)
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
        endMatch(team === 'red');
      },
      // On Turret Fire Event -> Launch Turret Energy Blast Projectile!
      (shotEvent: TurretShotEvent) => {
        const dx = shotEvent.targetPos.x - shotEvent.sourcePos.x;
        const dz = shotEvent.targetPos.z - shotEvent.sourcePos.z;
        const dist = Math.hypot(dx, dz) || 1;

        projectilesRef.current.push({
          id: `${Date.now()}_turret_shot_${Math.random()}`,
          sourceId: shotEvent.turretId,
          targetId: shotEvent.targetId,
          position: { ...shotEvent.sourcePos },
          velocity: {
            x: (dx / dist) * 26,
            y: 0,
            z: (dz / dist) * 26,
          },
          damage: shotEvent.damage,
          damageType: 'physical',
          isCrit: false,
          color: shotEvent.color,
          rangeRemaining: dist + 2,
          speed: 26,
        });
      }
    );

    // 9. Update Jungle Camps
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

    // 10. Update Bots AI
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
      },
      (bot, target, skillIndex) => {
        const botDef = HERO_REGISTRY[bot.heroDefId] || heroDef;
        const skill = botDef.skills[skillIndex];
        if (!skill) return;

        mobaAudio.playSkill(skillIndex === 2 ? 'ult' : 'lightning');

        // Directional leap for dash skills
        if (skill.skillType === 'dash') {
          const dashDir = new THREE.Vector3(
            target.position.x - bot.position.x,
            0,
            target.position.z - bot.position.z
          ).normalize();
          const dist = Math.min(skill.castRange || 5, 6);
          bot.position.x += dashDir.x * dist;
          bot.position.z += dashDir.z * dist;
          resolveEntityObstacleCollisions(bot.position, turretsRef.current, Object.values(coresRef.current), 0.55);
        }

        vfxRef.current.push({
          id: `${Date.now()}_bot_skill_${Math.random()}`,
          vfxType: skillIndex === 2 ? 'malefic_laser' : skillIndex === 1 ? 'lightning_bolt' : 'ground_slam',
          sourcePos: { ...bot.position },
          targetPos: { ...target.position },
          color: botDef.accentColor,
          radius: skill.radius || 3,
          duration: 0.6,
          elapsed: 0,
        });

        applySkillDamageAndCC(bot, target, skill, skillIndex);
      }
    );

    // 11. Update Projectiles & Damage Impacts (Hero shots + Turret shots!)
    projectilesRef.current.forEach((p) => {
      p.position.x += p.velocity.x * dt;
      p.position.z += p.velocity.z * dt;
      p.rangeRemaining -= p.speed * dt;

      if (p.rangeRemaining <= 0) {
        const targetHero = allHeroes.find((h) => h.id === p.targetId);
        const targetMinion = minionsRef.current.find((m) => m.id === p.targetId);

        if (targetHero && targetHero.state !== 'dead') {
          targetHero.currentHp -= p.damage;
          spawnDamageText(p.damage, targetHero.position, p.color === '#38bdf8' ? '#38bdf8' : '#ef4444', p.isCrit);
          if (targetHero.currentHp <= 0) {
            targetHero.state = 'dead';
            targetHero.deaths += 1;
            targetHero.respawnTimer = 6 + targetHero.level * 2;
            if (targetHero.isPlayer) {
              pushAnnouncerBanner('ally_slain', 'You Have Been Slain!', 'Defeated in battle', 'red');
            } else {
              player.kills += 1;
              recordKill(true);
              pushAnnouncerBanner('enemy_slain', 'Enemy Slain!', `${player.name} eliminated ${targetHero.name}`, 'blue');
            }
          }
        } else if (targetMinion && !targetMinion.isDead) {
          targetMinion.currentHp -= p.damage;
          spawnDamageText(p.damage, targetMinion.position, '#ef4444');
          if (targetMinion.currentHp <= 0) {
            targetMinion.isDead = true;
          }
        }
      }
    });
    projectilesRef.current = projectilesRef.current.filter((p) => p.rangeRemaining > 0);

    // 12. Update Floating Combat Numbers
    floatingTextsRef.current.forEach((ft) => {
      ft.lifeTime += dt;
      ft.position.y += 1.8 * dt;
      ft.opacity = Math.max(0, 1 - ft.lifeTime / ft.maxLifeTime);
    });
    floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.lifeTime < ft.maxLifeTime);

    // 13. Update VFX and Prune Expired
    vfxRef.current.forEach((vfx) => {
      vfx.elapsed += dt;
    });
    vfxRef.current = vfxRef.current.filter((vfx) => vfx.elapsed < vfx.duration);

    // 14. Throttle UI Telemetry & Sync State (~15 times/sec)
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
        respawnTimer: Math.ceil(player.respawnTimer),
        position: { ...player.position },
      });

      // Synchronize Minimap Live Radar (destroyed turrets + visible heroes)
      updateMinimapRadar({
        destroyedTurretIds: turretsRef.current.filter((t) => t.isDestroyed).map((t) => t.id),
        heroes: allHeroes.map((h) => ({
          id: h.id,
          team: h.team,
          isPlayer: h.isPlayer,
          x: h.position.x,
          z: h.position.z,
          isVisible:
            h.state !== 'dead' &&
            (!h.inBush ||
              (h.revealTimer || 0) > 0 ||
              h.team === 'blue' ||
              (player.inBush && player.currentBushId === h.currentBushId)),
        })),
      });

      // Synchronize Turret Target Positions so 3D targeting laser renders live!
      const targetsMap: Record<string, { x: number; y: number; z: number } | null> = {};
      turretsRef.current.forEach((t) => {
        if (t.targetEntityId) {
          const ent = [...botsRef.current, playerHeroRef.current, ...minionsRef.current].find((e) => e.id === t.targetEntityId);
          targetsMap[t.id] = ent ? { ...ent.position } : null;
        } else {
          targetsMap[t.id] = null;
        }
      });
      setTurretTargets(targetsMap);

      setMinions([...minionsRef.current.filter((m) => !m.isDead)]);
      setProjectiles([...projectilesRef.current]);
      setVfxList([...vfxRef.current]);
      setFloatingTexts([...floatingTextsRef.current]);
    }
  });

  return (
    <>
      {/* Dynamic Sunlight & MOBA Atmosphere */}
      <ambientLight intensity={0.95} />
      <directionalLight
        position={[40, 70, 35]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <fog attach="fog" args={['#0f172a', 50, 160]} />

      {/* 3D Camera - Closer, heroic framing */}
      <MobaCamera targetPos={playerHeroRef.current.position} />

      {/* Ground Raycast Interaction Plane */}
      <GroundInteractionPlane
        onGroundClick={handleGroundClick}
        onPointerMoveWorld={handlePointerMoveWorld}
      />

      {/* Destination Marker */}
      <DestinationMarker targetPos={destinationPos} />

      {/* 3D Battlefield Map */}
      <LandOfDawnMap />

      {/* 3D Turrets & Bases with live targeting lasers */}
      {turretsRef.current.map((t) => (
        <Turret3D
          key={t.id}
          turret={t}
          targetPos={turretTargets[t.id]}
        />
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

      {/* 3D Heroes (Player + 9 Bots with Bush Visibility) */}
      <HeroEntity3D hero={playerHeroRef.current} playerBushId={playerHeroRef.current.currentBushId} />
      {botsRef.current.map((b) => (
        <HeroEntity3D key={b.id} hero={b} playerBushId={playerHeroRef.current.currentBushId} />
      ))}

      {/* 3D VFX & Projectiles (including Turret Energy Blasts) */}
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
        camera={{ position: [-42, 14, 53], fov: 44 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <MobaSimulation />
      </Canvas>
    </div>
  );
};
