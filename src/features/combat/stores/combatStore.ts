import { create } from 'zustand';
import type { CombatUnit, UnitClass } from '../../../types';
import { COMBAT_UNITS_CATALOG } from '../../../config/gameData';
import { soundManager } from '../../../utils/audio';
import { useEconomyStore } from '../../economy/stores/economyStore';
import { useQuestStore } from '../../quests/stores/questStore';
import confetti from 'canvas-confetti';

export type CombatPhase = 'idle' | 'player_turn' | 'enemy_turn' | 'animating' | 'victory' | 'defeat';

interface DamageEffect {
  id: string;
  targetSlot: number;
  isPlayerTarget: boolean;
  damage: number;
  isCrit: boolean;
  advantage: 'strong' | 'weak' | 'neutral';
}

interface CombatState {
  phase: CombatPhase;
  sectorName: string;
  playerUnits: CombatUnit[];
  enemyUnits: CombatUnit[];
  selectedPlayerSlot: number | null;
  selectedEnemySlot: number | null;
  airstrikesAvailable: number;
  medikitsAvailable: number;
  combatLog: string[];
  activeDamageEffects: DamageEffect[];
  lootRewards: {
    coins: number;
    oil: number;
    xp: number;
  };

  // Actions
  initiateBattle: (sectorId: string) => void;
  selectPlayerUnit: (slotIndex: number) => void;
  selectEnemyTarget: (slotIndex: number) => void;
  executePlayerAttack: () => void;
  executeAirstrike: () => void;
  executeMedikit: () => void;
  claimBattleVictory: () => void;
  exitBattle: () => void;
  clearDamageEffect: (id: string) => void;
}

function calculateMultiplier(attackerClass: UnitClass, targetClass: UnitClass): { multiplier: number; advantage: 'strong' | 'weak' | 'neutral' } {
  if (attackerClass === 'infantry' && targetClass === 'artillery') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'artillery' && targetClass === 'armor') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'armor' && targetClass === 'infantry') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'aircraft' && targetClass === 'naval') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'artillery' && targetClass === 'aircraft') return { multiplier: 1.4, advantage: 'strong' };
  if (attackerClass === 'naval' && targetClass === 'armor') return { multiplier: 1.5, advantage: 'strong' };

  // Weaknesses
  if (attackerClass === 'infantry' && targetClass === 'armor') return { multiplier: 0.6, advantage: 'weak' };
  if (attackerClass === 'armor' && targetClass === 'artillery') return { multiplier: 0.6, advantage: 'weak' };
  if (attackerClass === 'artillery' && targetClass === 'infantry') return { multiplier: 0.6, advantage: 'weak' };
  if (attackerClass === 'naval' && targetClass === 'aircraft') return { multiplier: 0.6, advantage: 'weak' };

  return { multiplier: 1.0, advantage: 'neutral' };
}

export const useCombatStore = create<CombatState>((set, get) => ({
  phase: 'idle',
  sectorName: 'Sector 1: Raven Recon Outpost',
  playerUnits: [],
  enemyUnits: [],
  selectedPlayerSlot: null,
  selectedEnemySlot: null,
  airstrikesAvailable: 1,
  medikitsAvailable: 2,
  combatLog: [],
  activeDamageEffects: [],
  lootRewards: { coins: 500, oil: 60, xp: 220 },

  initiateBattle: (sectorId) => {
    soundManager.playAlert();

    // Setup 4 player units
    const rifleman = COMBAT_UNITS_CATALOG.find((u) => u.id === 'rifleman')!;
    const tank = COMBAT_UNITS_CATALOG.find((u) => u.id === 'medium_tank')!;
    const howitzer = COMBAT_UNITS_CATALOG.find((u) => u.id === 'howitzer')!;
    const jet = COMBAT_UNITS_CATALOG.find((u) => u.id === 'f18_raptor')!;

    const playerUnits: CombatUnit[] = [
      { ...tank, instanceId: 'p_0', currentHp: tank.hp, isPlayer: true, slotIndex: 0 },
      { ...rifleman, instanceId: 'p_1', currentHp: rifleman.hp, isPlayer: true, slotIndex: 1 },
      { ...howitzer, instanceId: 'p_2', currentHp: howitzer.hp, isPlayer: true, slotIndex: 2 },
      { ...jet, instanceId: 'p_3', currentHp: jet.hp, isPlayer: true, slotIndex: 3 },
    ];

    // Setup 4 Raven Syndicate enemy units
    const enemyUnits: CombatUnit[] = [
      { ...rifleman, name: 'Raven Shock Trooper', instanceId: 'e_0', currentHp: 110, isPlayer: false, slotIndex: 0 },
      { ...tank, name: 'Raven Ironclad Tank', instanceId: 'e_1', currentHp: 240, isPlayer: false, slotIndex: 1 },
      { ...howitzer, name: 'Raven Mortar Battery', instanceId: 'e_2', currentHp: 120, isPlayer: false, slotIndex: 2 },
      { ...rifleman, name: 'Raven Elite Guard', instanceId: 'e_3', currentHp: 110, isPlayer: false, slotIndex: 3 },
    ];

    set({
      phase: 'player_turn',
      sectorName: sectorId === 'sector_2' ? 'Sector 2: Raven Naval Fort' : 'Sector 1: Raven Recon Outpost',
      playerUnits,
      enemyUnits,
      selectedPlayerSlot: 0,
      selectedEnemySlot: 0,
      airstrikesAvailable: 1,
      medikitsAvailable: 2,
      combatLog: ['Battle initiated! Commander, select your unit and target to attack.'],
      activeDamageEffects: [],
      lootRewards: { coins: 500, oil: 60, xp: 220 },
    });
  },

  selectPlayerUnit: (slotIndex) => {
    const unit = get().playerUnits.find((u) => u.slotIndex === slotIndex);
    if (!unit || unit.currentHp <= 0) return;
    soundManager.playClick();
    set({ selectedPlayerSlot: slotIndex });
  },

  selectEnemyTarget: (slotIndex) => {
    const unit = get().enemyUnits.find((u) => u.slotIndex === slotIndex);
    if (!unit || unit.currentHp <= 0) return;
    soundManager.playClick();
    set({ selectedEnemySlot: slotIndex });
  },

  clearDamageEffect: (id) => {
    set((state) => ({
      activeDamageEffects: state.activeDamageEffects.filter((e) => e.id !== id),
    }));
  },

  executePlayerAttack: () => {
    const { phase, selectedPlayerSlot, selectedEnemySlot, playerUnits, enemyUnits } = get();
    if (phase !== 'player_turn') return;
    if (selectedPlayerSlot === null || selectedEnemySlot === null) return;

    const attacker = playerUnits.find((u) => u.slotIndex === selectedPlayerSlot);
    const target = enemyUnits.find((u) => u.slotIndex === selectedEnemySlot);
    if (!attacker || attacker.currentHp <= 0 || !target || target.currentHp <= 0) return;

    // Trigger attack animation
    set({ phase: 'animating' });
    soundManager.playShoot();

    const { multiplier, advantage } = calculateMultiplier(attacker.unitClass, target.unitClass);
    const isCrit = Math.random() < attacker.criticalChance;
    const baseDmg = attacker.attackPower * (isCrit ? 1.5 : 1.0);
    const finalDamage = Math.round(baseDmg * multiplier);

    setTimeout(() => {
      soundManager.playExplosion();
      const nextEnemyHp = Math.max(0, target.currentHp - finalDamage);
      const damageId = `dmg_${Date.now()}`;

      const updatedEnemies = enemyUnits.map((u) =>
        u.slotIndex === selectedEnemySlot ? { ...u, currentHp: nextEnemyHp } : u
      );

      const logMsg = `${attacker.name} attacked ${target.name} for ${finalDamage} damage! ${
        advantage === 'strong' ? '(CRITICAL ADVANTAGE!)' : advantage === 'weak' ? '(Ineffective)' : ''
      }`;

      set((state) => ({
        enemyUnits: updatedEnemies,
        activeDamageEffects: [
          ...state.activeDamageEffects,
          {
            id: damageId,
            targetSlot: selectedEnemySlot,
            isPlayerTarget: false,
            damage: finalDamage,
            isCrit,
            advantage,
          },
        ],
        combatLog: [logMsg, ...state.combatLog.slice(0, 10)],
      }));

      // Check for victory
      const allEnemiesDead = updatedEnemies.every((u) => u.currentHp <= 0);
      if (allEnemiesDead) {
        soundManager.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        set({ phase: 'victory' });
        return;
      }

      // Auto-switch enemy target if dead
      const aliveEnemy = updatedEnemies.find((u) => u.currentHp > 0);
      if (aliveEnemy) {
        set({ selectedEnemySlot: aliveEnemy.slotIndex });
      }

      // Enemy turn resolution after brief delay
      setTimeout(() => {
        const enemiesAlive = get().enemyUnits.filter((u) => u.currentHp > 0);
        const playersAlive = get().playerUnits.filter((u) => u.currentHp > 0);
        if (enemiesAlive.length === 0 || playersAlive.length === 0) return;

        // Random alive enemy attacks random alive player
        const enemyAttacker = enemiesAlive[Math.floor(Math.random() * enemiesAlive.length)];
        const playerTarget = playersAlive[Math.floor(Math.random() * playersAlive.length)];

        soundManager.playShoot();
        const eAdv = calculateMultiplier(enemyAttacker.unitClass, playerTarget.unitClass);
        const eDmg = Math.round(enemyAttacker.attackPower * eAdv.multiplier * (0.85 + Math.random() * 0.3));

        setTimeout(() => {
          soundManager.playExplosion();
          const nextPlayerHp = Math.max(0, playerTarget.currentHp - eDmg);
          const pDamageId = `pdmg_${Date.now()}`;

          const updatedPlayers = get().playerUnits.map((u) =>
            u.slotIndex === playerTarget.slotIndex ? { ...u, currentHp: nextPlayerHp } : u
          );

          const enemyLog = `${enemyAttacker.name} returned fire on ${playerTarget.name} for ${eDmg} damage!`;

          set((state) => ({
            playerUnits: updatedPlayers,
            activeDamageEffects: [
              ...state.activeDamageEffects,
              {
                id: pDamageId,
                targetSlot: playerTarget.slotIndex,
                isPlayerTarget: true,
                damage: eDmg,
                isCrit: false,
                advantage: eAdv.advantage,
              },
            ],
            combatLog: [enemyLog, ...state.combatLog.slice(0, 10)],
          }));

          // Check for defeat
          const allPlayersDead = updatedPlayers.every((u) => u.currentHp <= 0);
          if (allPlayersDead) {
            set({ phase: 'defeat' });
            return;
          }

          // Return turn to player
          const alivePlayer = updatedPlayers.find((u) => u.currentHp > 0);
          set({
            phase: 'player_turn',
            selectedPlayerSlot: alivePlayer ? alivePlayer.slotIndex : 0,
          });
        }, 600);
      }, 900);
    }, 400);
  },

  executeAirstrike: () => {
    const { phase, airstrikesAvailable, enemyUnits } = get();
    if (phase !== 'player_turn' || airstrikesAvailable <= 0) return;

    soundManager.playShoot();
    set({ phase: 'animating', airstrikesAvailable: airstrikesAvailable - 1 });

    setTimeout(() => {
      soundManager.playExplosion();
      const updatedEnemies = enemyUnits.map((u) => ({
        ...u,
        currentHp: Math.max(0, u.currentHp - 65),
      }));

      set((state) => ({
        enemyUnits: updatedEnemies,
        combatLog: ['AIRSTRIKE CALLED! Heavy bombardment rained on all enemy positions for 65 damage each!', ...state.combatLog],
      }));

      const allDead = updatedEnemies.every((u) => u.currentHp <= 0);
      if (allDead) {
        soundManager.playVictory();
        confetti({ particleCount: 140, spread: 90 });
        set({ phase: 'victory' });
      } else {
        set({ phase: 'player_turn' });
      }
    }, 700);
  },

  executeMedikit: () => {
    const { phase, medikitsAvailable, playerUnits } = get();
    if (phase !== 'player_turn' || medikitsAvailable <= 0) return;

    soundManager.playHarvest();
    const updatedPlayers = playerUnits.map((u) => ({
      ...u,
      currentHp: Math.min(u.maxHp, u.currentHp + 70),
    }));

    set((state) => ({
      medikitsAvailable: state.medikitsAvailable - 1,
      playerUnits: updatedPlayers,
      combatLog: ['Field Medikit deployed! All squads repaired by +70 HP.', ...state.combatLog],
    }));
  },

  claimBattleVictory: () => {
    const { lootRewards } = get();
    const economy = useEconomyStore.getState();
    economy.addResource('coins', lootRewards.coins);
    economy.addResource('oil', lootRewards.oil);
    economy.addXp(lootRewards.xp);

    // Update quest
    useQuestStore.getState().checkProgress('combat', 'sector_1', 1);

    set({ phase: 'idle' });
  },

  exitBattle: () => {
    soundManager.playClick();
    set({ phase: 'idle' });
  },
}));
