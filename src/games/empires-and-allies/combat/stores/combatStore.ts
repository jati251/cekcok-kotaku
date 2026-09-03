import { create } from 'zustand';
import type { CombatUnit, UnitClass, CampaignSector } from "@/types";
import { COMBAT_UNITS_CATALOG, CAMPAIGN_SECTORS } from "@/config/gameData";
import { soundManager } from "@/utils/audio";
import { useEconomyStore } from "@/games/empires-and-allies/economy/stores/economyStore";
import { useQuestStore } from "@/games/empires-and-allies/quests/stores/questStore";
import { useWarRoomStore } from "@/games/empires-and-allies/economy/stores/warRoomStore";
import confetti from 'canvas-confetti';

export type CombatPhase = 'idle' | 'player_turn' | 'enemy_turn' | 'animating' | 'victory' | 'defeat';

export interface ProjectileVFX {
  id: string;
  type: 'bullet' | 'shell' | 'missile' | 'laser';
  isPlayerAttacker: boolean;
  attackerSlot: number;
  targetSlot: number;
}

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
  currentSectorId: string;
  isCampaignMapOpen: boolean;
  campaignSectors: CampaignSector[];
  playerUnits: CombatUnit[];
  enemyUnits: CombatUnit[];
  selectedPlayerSlot: number | null;
  selectedEnemySlot: number | null;
  airstrikesAvailable: number;
  medikitsAvailable: number;
  combatLog: string[];
  activeDamageEffects: DamageEffect[];
  activeProjectile: ProjectileVFX | null;
  screenShake: boolean;
  lootRewards: {
    coins: number;
    oil: number;
    xp: number;
    rareMaterial?: string;
  };

  // Actions
  openCampaignMap: () => void;
  closeCampaignMap: () => void;
  initiateBattle: (sectorId: string) => void;
  selectPlayerUnit: (slotIndex: number) => void;
  selectEnemyTarget: (slotIndex: number) => void;
  executePlayerAttack: () => void;
  executeAirstrike: () => void;
  executeMedikit: () => void;
  executeSuperweapon: (weaponId: string) => void;
  claimBattleVictory: () => void;
  exitBattle: () => void;
}

function calculateMultiplier(attackerClass: UnitClass, targetClass: UnitClass): { multiplier: number; advantage: 'strong' | 'weak' | 'neutral' } {
  if (attackerClass === 'infantry' && targetClass === 'artillery') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'artillery' && targetClass === 'armor') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'armor' && targetClass === 'infantry') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'aircraft' && targetClass === 'naval') return { multiplier: 1.6, advantage: 'strong' };
  if (attackerClass === 'artillery' && targetClass === 'aircraft') return { multiplier: 1.4, advantage: 'strong' };
  if (attackerClass === 'naval' && targetClass === 'armor') return { multiplier: 1.5, advantage: 'strong' };

  if (attackerClass === 'infantry' && targetClass === 'armor') return { multiplier: 0.6, advantage: 'weak' };
  if (attackerClass === 'armor' && targetClass === 'artillery') return { multiplier: 0.6, advantage: 'weak' };
  if (attackerClass === 'artillery' && targetClass === 'infantry') return { multiplier: 0.6, advantage: 'weak' };
  if (attackerClass === 'naval' && targetClass === 'aircraft') return { multiplier: 0.6, advantage: 'weak' };

  return { multiplier: 1.0, advantage: 'neutral' };
}

function getProjectileType(uClass: UnitClass): 'bullet' | 'shell' | 'missile' | 'laser' {
  switch (uClass) {
    case 'infantry': return 'bullet';
    case 'armor': return 'shell';
    case 'artillery': return 'shell';
    case 'aircraft': return 'missile';
    case 'naval': return 'missile';
    default: return 'bullet';
  }
}

export const useCombatStore = create<CombatState>((set, get) => ({
  phase: 'idle',
  currentSectorId: 'sector_1',
  isCampaignMapOpen: false,
  campaignSectors: CAMPAIGN_SECTORS,
  playerUnits: [],
  enemyUnits: [],
  selectedPlayerSlot: null,
  selectedEnemySlot: null,
  airstrikesAvailable: 2,
  medikitsAvailable: 2,
  combatLog: [],
  activeDamageEffects: [],
  activeProjectile: null,
  screenShake: false,
  lootRewards: { coins: 500, oil: 60, xp: 220, rareMaterial: 'steel' },

  openCampaignMap: () => {
    soundManager.playClick();
    set({ isCampaignMapOpen: true });
  },

  closeCampaignMap: () => {
    soundManager.playClick();
    set({ isCampaignMapOpen: false });
  },

  initiateBattle: (sectorId) => {
    soundManager.playAlert();
    const sector = get().campaignSectors.find((s) => s.id === sectorId) || get().campaignSectors[0];

    // Player units squad
    const rifleman = COMBAT_UNITS_CATALOG.find((u) => u.id === 'rifleman')!;
    const commando = COMBAT_UNITS_CATALOG.find((u) => u.id === 'commando')!;
    const tank = COMBAT_UNITS_CATALOG.find((u) => u.id === 'medium_tank')!;
    const jet = COMBAT_UNITS_CATALOG.find((u) => u.id === 'f18_raptor')!;

    const playerUnits: CombatUnit[] = [
      { ...tank, instanceId: 'p_0', currentHp: tank.hp, isPlayer: true, slotIndex: 0 },
      { ...rifleman, instanceId: 'p_1', currentHp: rifleman.hp, isPlayer: true, slotIndex: 1 },
      { ...commando, instanceId: 'p_2', currentHp: commando.hp, isPlayer: true, slotIndex: 2 },
      { ...jet, instanceId: 'p_3', currentHp: jet.hp, isPlayer: true, slotIndex: 3 },
    ];

    // Generate enemies scaled to sector difficulty
    const diff = sector.difficulty;
    const enemyUnits: CombatUnit[] = [
      {
        ...rifleman,
        name: `Raven Raider Alpha`,
        instanceId: 'e_0',
        currentHp: 100 + diff * 15,
        attackPower: 30 + diff * 6,
        isPlayer: false,
        slotIndex: 0,
      },
      {
        ...tank,
        name: `Raven Heavy Panzer`,
        instanceId: 'e_1',
        currentHp: 220 + diff * 25,
        attackPower: 55 + diff * 10,
        isPlayer: false,
        slotIndex: 1,
      },
      {
        ...rifleman,
        name: `Raven Mortar Unit`,
        unitClass: 'artillery',
        instanceId: 'e_2',
        currentHp: 120 + diff * 15,
        attackPower: 65 + diff * 12,
        isPlayer: false,
        slotIndex: 2,
      },
      {
        ...jet,
        name: `Raven Black Falcon`,
        instanceId: 'e_3',
        currentHp: 150 + diff * 20,
        attackPower: 60 + diff * 10,
        isPlayer: false,
        slotIndex: 3,
      },
    ];

    set({
      phase: 'player_turn',
      currentSectorId: sectorId,
      isCampaignMapOpen: false,
      playerUnits,
      enemyUnits,
      selectedPlayerSlot: 0,
      selectedEnemySlot: 0,
      airstrikesAvailable: 2,
      medikitsAvailable: 2,
      combatLog: [`Engaging enemy forces in ${sector.name}! Commander, choose your target and fire!`],
      activeDamageEffects: [],
      activeProjectile: null,
      screenShake: false,
      lootRewards: {
        coins: sector.rewards.coins,
        oil: sector.rewards.oil,
        xp: sector.rewards.xp,
        rareMaterial: sector.rewards.rareMaterial,
      },
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

  executePlayerAttack: () => {
    const { phase, selectedPlayerSlot, selectedEnemySlot, playerUnits, enemyUnits } = get();
    if (phase !== 'player_turn' || selectedPlayerSlot === null || selectedEnemySlot === null) return;

    const attacker = playerUnits.find((u) => u.slotIndex === selectedPlayerSlot);
    const target = enemyUnits.find((u) => u.slotIndex === selectedEnemySlot);
    if (!attacker || attacker.currentHp <= 0 || !target || target.currentHp <= 0) return;

    // Trigger attack animation with projectile VFX
    const projType = getProjectileType(attacker.unitClass);
    set({
      phase: 'animating',
      activeProjectile: {
        id: `proj_${Date.now()}`,
        type: projType,
        isPlayerAttacker: true,
        attackerSlot: selectedPlayerSlot,
        targetSlot: selectedEnemySlot,
      },
    });

    soundManager.playShoot();

    const { multiplier, advantage } = calculateMultiplier(attacker.unitClass, target.unitClass);
    const isCrit = Math.random() < attacker.criticalChance;
    const baseDmg = attacker.attackPower * (isCrit ? 1.5 : 1.0);
    const finalDamage = Math.round(baseDmg * multiplier);

    setTimeout(() => {
      // Impact & Screen Shake
      soundManager.playExplosion();
      const nextEnemyHp = Math.max(0, target.currentHp - finalDamage);
      const damageId = `dmg_${Date.now()}`;

      const updatedEnemies = enemyUnits.map((u) =>
        u.slotIndex === selectedEnemySlot ? { ...u, currentHp: nextEnemyHp } : u
      );

      const logMsg = `${attacker.name} struck ${target.name} for ${finalDamage} damage! ${
        advantage === 'strong' ? '(CRITICAL ADVANTAGE!)' : advantage === 'weak' ? '(Ineffective)' : ''
      }`;

      set((state) => ({
        enemyUnits: updatedEnemies,
        activeProjectile: null,
        screenShake: isCrit || attacker.unitClass === 'artillery',
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

      setTimeout(() => set({ screenShake: false }), 250);

      // Check victory
      const allEnemiesDead = updatedEnemies.every((u) => u.currentHp <= 0);
      if (allEnemiesDead) {
        soundManager.playVictory();
        confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
        set({ phase: 'victory' });
        return;
      }

      // Enemy counter-attack after brief pause
      setTimeout(() => {
        const enemiesAlive = get().enemyUnits.filter((u) => u.currentHp > 0);
        const playersAlive = get().playerUnits.filter((u) => u.currentHp > 0);
        if (enemiesAlive.length === 0 || playersAlive.length === 0) return;

        const enemyAttacker = enemiesAlive[Math.floor(Math.random() * enemiesAlive.length)];
        const playerTarget = playersAlive[Math.floor(Math.random() * playersAlive.length)];

        set({
          activeProjectile: {
            id: `eproj_${Date.now()}`,
            type: getProjectileType(enemyAttacker.unitClass),
            isPlayerAttacker: false,
            attackerSlot: enemyAttacker.slotIndex,
            targetSlot: playerTarget.slotIndex,
          },
        });

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

          set((state) => ({
            playerUnits: updatedPlayers,
            activeProjectile: null,
            screenShake: true,
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
            combatLog: [`${enemyAttacker.name} returned fire on ${playerTarget.name} for ${eDmg} damage!`, ...state.combatLog.slice(0, 10)],
          }));

          setTimeout(() => set({ screenShake: false }), 250);

          // Check defeat
          if (updatedPlayers.every((u) => u.currentHp <= 0)) {
            set({ phase: 'defeat' });
            return;
          }

          const alivePlayer = updatedPlayers.find((u) => u.currentHp > 0);
          set({
            phase: 'player_turn',
            selectedPlayerSlot: alivePlayer ? alivePlayer.slotIndex : 0,
          });
        }, 500);
      }, 700);
    }, 450);
  },

  executeAirstrike: () => {
    const { phase, airstrikesAvailable, enemyUnits } = get();
    if (phase !== 'player_turn' || airstrikesAvailable <= 0) return;

    soundManager.playShoot();
    set({ phase: 'animating', airstrikesAvailable: airstrikesAvailable - 1, screenShake: true });

    setTimeout(() => {
      soundManager.playExplosion();
      const updatedEnemies = enemyUnits.map((u) => ({
        ...u,
        currentHp: Math.max(0, u.currentHp - 70),
      }));

      set((state) => ({
        enemyUnits: updatedEnemies,
        screenShake: false,
        combatLog: ['AIRSTRIKE CALLED! Heavy ordnance showered all enemy positions for 70 damage each!', ...state.combatLog],
      }));

      if (updatedEnemies.every((u) => u.currentHp <= 0)) {
        soundManager.playVictory();
        confetti({ particleCount: 150, spread: 90 });
        set({ phase: 'victory' });
      } else {
        set({ phase: 'player_turn' });
      }
    }, 600);
  },

  executeSuperweapon: (weaponId) => {
    const { phase, enemyUnits } = get();
    if (phase !== 'player_turn') return;

    const warRoom = useWarRoomStore.getState();
    const consumed = warRoom.consumeSuperweapon(weaponId);
    if (!consumed) {
      soundManager.playAlert();
      return;
    }

    soundManager.playShoot();
    set({ phase: 'animating', screenShake: true });

    const dmg = weaponId === 'tactical_nuke' ? 120 : weaponId === 'orbital_laser' ? 160 : 75;

    setTimeout(() => {
      soundManager.playExplosion();
      const updatedEnemies = enemyUnits.map((u) => ({
        ...u,
        currentHp: Math.max(0, u.currentHp - dmg),
      }));

      set((state) => ({
        enemyUnits: updatedEnemies,
        screenShake: false,
        combatLog: [`SUPERWEAPON DETONATED! Dealt ${dmg} catastrophic damage across enemy lines!`, ...state.combatLog],
      }));

      if (updatedEnemies.every((u) => u.currentHp <= 0)) {
        soundManager.playVictory();
        confetti({ particleCount: 160, spread: 100 });
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
      currentHp: Math.min(u.maxHp, u.currentHp + 80),
    }));

    set((state) => ({
      medikitsAvailable: state.medikitsAvailable - 1,
      playerUnits: updatedPlayers,
      combatLog: ['Field Medikit deployed! All squads repaired by +80 HP.', ...state.combatLog],
    }));
  },

  claimBattleVictory: () => {
    const { currentSectorId, lootRewards, campaignSectors } = get();
    const economy = useEconomyStore.getState();
    const warRoom = useWarRoomStore.getState();

    economy.addResource('coins', lootRewards.coins);
    economy.addResource('oil', lootRewards.oil);
    economy.addXp(lootRewards.xp);

    if (lootRewards.rareMaterial) {
      warRoom.addMaterial(lootRewards.rareMaterial as any, 2);
    }

    // Unlock next sector in campaign
    const updatedSectors = campaignSectors.map((sec, idx) => {
      if (sec.id === currentSectorId) {
        return { ...sec, isCompleted: true, stars: 3 };
      }
      if (idx > 0 && campaignSectors[idx - 1].id === currentSectorId) {
        return { ...sec, isUnlocked: true };
      }
      return sec;
    });

    // Update quest progress
    useQuestStore.getState().checkProgress('combat', currentSectorId, 1);
    useQuestStore.getState().checkProgress('combat', 'any', 1);

    set({ phase: 'idle', campaignSectors: updatedSectors });
  },

  exitBattle: () => {
    soundManager.playClick();
    set({ phase: 'idle' });
  },
}));
