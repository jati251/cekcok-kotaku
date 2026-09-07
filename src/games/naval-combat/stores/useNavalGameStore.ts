import { create } from 'zustand';
import type { ShipClass, ShipConfig, SailState, NavalGameStage, EnemyShipData } from '../types';
import { navalAudio } from '../services/navalAudio';

export const SHIP_PRESETS: Record<ShipClass, ShipConfig> = {
  sloop: {
    id: 'sloop',
    name: 'Swift Wind Sloop',
    subtitle: 'High Agility Coastal Raider',
    description:
      'Light single-masted vessel boasting unmatched maneuverability and shallow draft. Ideal for outrunning heavy warships and harrying foes from a distance.',
    maxHealth: 380,
    topSpeed: 14.0,
    acceleration: 3.5,
    turnSpeed: 1.15,
    cannonsPerSide: 4,
    reloadTime: 2.2,
    cannonDamage: 35,
    length: 12,
    width: 4.5,
    hullColor: '#6e4726',
    trimColor: '#eab308',
    sailColor: '#f1f5f9',
    flagType: 'pirate',
  },
  brig: {
    id: 'brig',
    name: 'Sea Serpent Brig',
    subtitle: 'Twin-Masted Corsair Flagship',
    description:
      'The quintessential privateer warship. Balanced firepower, sturdy oak planking, and dependable speed make it a lethal force on the open seas.',
    maxHealth: 700,
    topSpeed: 11.2,
    acceleration: 2.4,
    turnSpeed: 0.85,
    cannonsPerSide: 8,
    reloadTime: 3.0,
    cannonDamage: 45,
    length: 18,
    width: 6.2,
    hullColor: '#452613',
    trimColor: '#dc2626',
    sailColor: '#e2e8f0',
    flagType: 'rebel',
  },
  frigate: {
    id: 'frigate',
    name: 'Queen Anne Frigate',
    subtitle: 'Three-Masted Heavy Dreadnought',
    description:
      'An iron-armored maritime fortress bristling with dual broadside batteries. Slow to pivot, but a single synchronized salvo will shatter enemy hulls in seconds.',
    maxHealth: 1250,
    topSpeed: 8.5,
    acceleration: 1.6,
    turnSpeed: 0.55,
    cannonsPerSide: 14,
    reloadTime: 4.2,
    cannonDamage: 55,
    length: 24,
    width: 8.0,
    hullColor: '#2b1b12',
    trimColor: '#38bdf8',
    sailColor: '#cbd5e1',
    flagType: 'royal',
  },
};

interface NavalGameState {
  stage: NavalGameStage;
  selectedShipClass: ShipClass;
  playerHealth: number;
  playerMaxHealth: number;
  sailState: SailState;
  currentSpeedKnots: number;
  rudderAngle: number; // -1 to 1

  // Cannon reload timers (0 = ready, > 0 = reloading)
  portReload: number;
  starboardReload: number;

  // Aim direction ('port' | 'starboard' | 'none')
  aimDirection: 'port' | 'starboard' | 'none';
  isAiming: boolean;

  // Enemies
  enemies: EnemyShipData[];

  // Combat Stats
  score: number;
  bootyGold: number;
  shipsSunk: number;
  shotsFired: number;
  shotsHit: number;

  // Wind direction (radians)
  windDirection: number;
  windStrength: number; // in knots

  // Actions
  setStage: (stage: NavalGameStage) => void;
  selectShipClass: (shipClass: ShipClass) => void;
  setSailState: (state: SailState) => void;
  cycleSailState: (direction: 'up' | 'down') => void;
  setRudderAngle: (angle: number) => void;
  setSpeedKnots: (speed: number) => void;
  damagePlayer: (amount: number) => void;
  repairPlayer: (amount: number) => void;
  setAimDirection: (dir: 'port' | 'starboard' | 'none', isAiming: boolean) => void;
  fireBroadside: (side: 'port' | 'starboard') => boolean;
  tickReloads: (delta: number) => void;
  damageEnemy: (enemyId: string, amount: number) => void;
  initBattle: () => void;
  resetGame: () => void;
}

export const useNavalGameStore = create<NavalGameState>((set, get) => ({
  stage: 'MAIN_MENU',
  selectedShipClass: 'brig',
  playerHealth: SHIP_PRESETS.brig.maxHealth,
  playerMaxHealth: SHIP_PRESETS.brig.maxHealth,
  sailState: 'HALF_SAIL',
  currentSpeedKnots: 0,
  rudderAngle: 0,

  portReload: 0,
  starboardReload: 0,
  aimDirection: 'none',
  isAiming: false,

  enemies: [],

  score: 0,
  bootyGold: 120,
  shipsSunk: 0,
  shotsFired: 0,
  shotsHit: 0,

  windDirection: Math.PI * 0.25, // Blowing northeast
  windStrength: 15.0,

  setStage: (stage) => set({ stage }),

  selectShipClass: (shipClass) => {
    const config = SHIP_PRESETS[shipClass];
    set({
      selectedShipClass: shipClass,
      playerHealth: config.maxHealth,
      playerMaxHealth: config.maxHealth,
    });
  },

  setSailState: (state) => {
    navalAudio.playSailShift();
    set({ sailState: state });
  },

  cycleSailState: (direction) => {
    const current = get().sailState;
    let next: SailState = current;
    if (direction === 'up') {
      if (current === 'ANCHOR') next = 'HALF_SAIL';
      else if (current === 'HALF_SAIL') next = 'FULL_SAIL';
    } else {
      if (current === 'FULL_SAIL') next = 'HALF_SAIL';
      else if (current === 'HALF_SAIL') next = 'ANCHOR';
    }
    if (next !== current) {
      navalAudio.playSailShift();
      set({ sailState: next });
    }
  },

  setRudderAngle: (angle) => set({ rudderAngle: Math.max(-1, Math.min(1, angle)) }),

  setSpeedKnots: (speed) => set({ currentSpeedKnots: speed }),

  damagePlayer: (amount) => {
    const current = get().playerHealth;
    const next = Math.max(0, current - amount);
    navalAudio.playWoodHit();
    set({ playerHealth: next });
    if (next <= 0) {
      navalAudio.playDefeat();
      set({ stage: 'DEFEAT' });
    }
  },

  repairPlayer: (amount) => {
    const max = get().playerMaxHealth;
    set((state) => ({ playerHealth: Math.min(max, state.playerHealth + amount) }));
  },

  setAimDirection: (dir, isAiming) => set({ aimDirection: dir, isAiming }),

  fireBroadside: (side) => {
    const state = get();
    const config = SHIP_PRESETS[state.selectedShipClass];
    const reload = side === 'port' ? state.portReload : state.starboardReload;

    if (reload > 0) return false;

    // Trigger cannon fire sound & stats
    navalAudio.playCannonFire();

    if (side === 'port') {
      set({
        portReload: config.reloadTime,
        shotsFired: state.shotsFired + config.cannonsPerSide,
      });
    } else {
      set({
        starboardReload: config.reloadTime,
        shotsFired: state.shotsFired + config.cannonsPerSide,
      });
    }

    return true;
  },

  tickReloads: (delta) => {
    set((state) => ({
      portReload: Math.max(0, state.portReload - delta),
      starboardReload: Math.max(0, state.starboardReload - delta),
    }));
  },

  damageEnemy: (enemyId, amount) => {
    const state = get();
    const enemy = state.enemies.find((e) => e.id === enemyId);
    if (!enemy || enemy.state === 'SINKING') return;

    navalAudio.playWoodHit();
    const newHealth = Math.max(0, enemy.health - amount);
    const isDestroyed = newHealth <= 0;

    const updatedEnemies: EnemyShipData[] = state.enemies.map((e) => {
      if (e.id === enemyId) {
        return {
          ...e,
          health: newHealth,
          state: isDestroyed ? 'SINKING' : e.state,
          sinkProgress: isDestroyed ? 0 : e.sinkProgress,
        };
      }
      return e;
    });

    const newScore = state.score + (isDestroyed ? 500 : 50);
    const newGold = state.bootyGold + (isDestroyed ? 250 : 20);
    const newSunk = state.shipsSunk + (isDestroyed ? 1 : 0);

    set({
      enemies: updatedEnemies,
      score: newScore,
      bootyGold: newGold,
      shipsSunk: newSunk,
      shotsHit: state.shotsHit + 1,
    });

    if (isDestroyed) {
      navalAudio.playShipBell();
      const allSunk = updatedEnemies.every((e) => e.state === 'SINKING');
      if (allSunk) {
        navalAudio.playVictory();
        setTimeout(() => {
          set({ stage: 'VICTORY' });
        }, 3200);
      }
    }
  },

  initBattle: () => {
    const config = SHIP_PRESETS[get().selectedShipClass];
    const initialEnemies: EnemyShipData[] = [
      {
        id: 'enemy_1',
        shipClass: 'sloop',
        name: 'Bloodhound Sloop',
        position: [90, 0, -80],
        rotationY: Math.PI * 0.7,
        health: 280,
        maxHealth: 280,
        speed: 6.5,
        state: 'PATROL',
        reloadTimer: 1.5,
      },
      {
        id: 'enemy_2',
        shipClass: 'brig',
        name: 'Iron Corsair Brig',
        position: [-110, 0, 95],
        rotationY: -Math.PI * 0.3,
        health: 550,
        maxHealth: 550,
        speed: 5.0,
        state: 'PATROL',
        reloadTimer: 2.0,
      },
      {
        id: 'enemy_3',
        shipClass: 'sloop',
        name: 'Shadow Viper Sloop',
        position: [140, 0, 110],
        rotationY: Math.PI * 1.2,
        health: 320,
        maxHealth: 320,
        speed: 7.0,
        state: 'PATROL',
        reloadTimer: 3.5,
      },
    ];

    set({
      stage: 'BATTLE',
      playerHealth: config.maxHealth,
      playerMaxHealth: config.maxHealth,
      sailState: 'HALF_SAIL',
      currentSpeedKnots: 0,
      rudderAngle: 0,
      portReload: 0,
      starboardReload: 0,
      enemies: initialEnemies,
      score: 0,
      shipsSunk: 0,
      shotsFired: 0,
      shotsHit: 0,
      aimDirection: 'none',
      isAiming: false,
    });
  },

  resetGame: () => {
    set({
      stage: 'MAIN_MENU',
      playerHealth: SHIP_PRESETS.brig.maxHealth,
      currentSpeedKnots: 0,
      rudderAngle: 0,
      enemies: [],
    });
  },
}));
