import { create } from 'zustand';
import type { MatchState, AnnouncerBanner, AnnouncerEventType } from '../types/game';
import type { Team } from '../types/hero';
import type { ItemDefinition } from '../types/item';
import { HERO_REGISTRY } from '../constants/heroes';
import { ITEM_REGISTRY } from '../constants/items';
import { mobaAudio } from '../engine/audioEngine';

export interface PlayerTelemetry {
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  netWorth: number;
  kills: number;
  deaths: number;
  assists: number;
  items: string[];
  skillLevels: [number, number, number];
  skillCooldowns: [number, number, number];
  spellCooldown: number;
  regenCooldown: number;
  recallTimer: number;
  isRecalling: boolean;
  canLevelSkill: [boolean, boolean, boolean];
  unspentSkillPoints: number;
  inBush: boolean;
  isDead: boolean;
  respawnTimer: number;
  position: { x: number; y: number; z: number };
}

export interface MinimapRadarData {
  destroyedTurretIds: string[];
  heroes: {
    id: string;
    team: Team;
    isPlayer: boolean;
    x: number;
    z: number;
    isVisible: boolean;
  }[];
}

interface MobaState {
  matchState: MatchState;
  selectedHeroId: string;
  selectedSpellId: string;
  matchDuration: number;
  blueScore: number;
  redScore: number;

  playerTelemetry: PlayerTelemetry;
  activeBanners: AnnouncerBanner[];
  isShopOpen: boolean;
  isScoreboardOpen: boolean;
  quickBuyItem: ItemDefinition | null;
  activeMinimapPing: { type: 'attack' | 'retreat' | 'gather'; x: number; z: number; text: string } | null;
  minimapRadar: MinimapRadarData;

  // Actions
  selectHero: (heroId: string) => void;
  selectSpell: (spellId: string) => void;
  startMatch: () => void;
  exitMatch: () => void;
  toggleShop: () => void;
  openShop: () => void;
  closeShop: () => void;
  toggleScoreboard: () => void;
  buyItem: (itemId: string) => boolean;
  sellItem: (index: number) => void;
  upgradeSkill: (skillIndex: 0 | 1 | 2) => void;
  triggerMinimapPing: (type: 'attack' | 'retreat' | 'gather', x?: number, z?: number) => void;
  pushAnnouncerBanner: (type: AnnouncerEventType, title: string, subtitle: string, team: Team) => void;
  updateTelemetry: (data: Partial<PlayerTelemetry>) => void;
  updateMinimapRadar: (data: MinimapRadarData) => void;
  incrementMatchDuration: (dt: number) => void;
  recordKill: (isPlayerTeamKill: boolean) => void;
  endMatch: (isVictory: boolean) => void;
  resetToLobby: () => void;
}

const INITIAL_PLAYER_TELEMETRY: PlayerTelemetry = {
  currentHp: 2500,
  maxHp: 2500,
  currentMana: 450,
  maxMana: 450,
  level: 1,
  exp: 0,
  expToNext: 200,
  gold: 300,
  netWorth: 300,
  kills: 0,
  deaths: 0,
  assists: 0,
  items: [],
  skillLevels: [1, 0, 0], // Start with Skill 1 unlocked
  skillCooldowns: [0, 0, 0],
  spellCooldown: 0,
  regenCooldown: 0,
  recallTimer: 0,
  isRecalling: false,
  canLevelSkill: [false, false, false],
  unspentSkillPoints: 0,
  inBush: false,
  isDead: false,
  respawnTimer: 0,
  position: { x: -42, y: 0, z: 42 },
};

export const useMobaStore = create<MobaState>((set, get) => ({
  matchState: 'hero_select',
  selectedHeroId: 'layla',
  selectedSpellId: 'flicker',
  matchDuration: 0,
  blueScore: 0,
  redScore: 0,

  playerTelemetry: { ...INITIAL_PLAYER_TELEMETRY },
  activeBanners: [],
  isShopOpen: false,
  isScoreboardOpen: false,
  quickBuyItem: null,
  activeMinimapPing: null,
  minimapRadar: {
    destroyedTurretIds: [],
    heroes: [],
  },

  selectHero: (heroId) => {
    mobaAudio.playSkill('dash');
    const heroDef = HERO_REGISTRY[heroId] || HERO_REGISTRY.layla;
    set({
      selectedHeroId: heroId,
      playerTelemetry: {
        ...INITIAL_PLAYER_TELEMETRY,
        currentHp: heroDef.baseStats.maxHp,
        maxHp: heroDef.baseStats.maxHp,
        currentMana: heroDef.baseStats.maxMana,
        maxMana: heroDef.baseStats.maxMana,
      },
      quickBuyItem: heroDef.recommendedBuild[0] ? ITEM_REGISTRY[heroDef.recommendedBuild[0]] || null : null,
    });
  },

  selectSpell: (spellId) => {
    mobaAudio.playSkill('dash');
    set({ selectedSpellId: spellId });
  },

  startMatch: () => {
    const heroId = get().selectedHeroId;
    const heroDef = HERO_REGISTRY[heroId] || HERO_REGISTRY.layla;
    mobaAudio.playSkill('ult');

    set({
      matchState: 'battle',
      matchDuration: 0,
      blueScore: 0,
      redScore: 0,
      activeBanners: [],
      isShopOpen: false,
      isScoreboardOpen: false,
      playerTelemetry: {
        ...INITIAL_PLAYER_TELEMETRY,
        currentHp: heroDef.baseStats.maxHp,
        maxHp: heroDef.baseStats.maxHp,
        currentMana: heroDef.baseStats.maxMana,
        maxMana: heroDef.baseStats.maxMana,
        position: { x: -70, y: 0, z: 70 },
      },
      quickBuyItem: heroDef.recommendedBuild[0] ? ITEM_REGISTRY[heroDef.recommendedBuild[0]] || null : null,
    });
  },

  exitMatch: () => {
    set({
      matchState: 'hero_select',
      isShopOpen: false,
      isScoreboardOpen: false,
      activeBanners: [],
    });
  },

  toggleShop: () => {
    mobaAudio.playSkill('dash');
    set((state) => ({ isShopOpen: !state.isShopOpen }));
  },

  openShop: () => {
    mobaAudio.playSkill('dash');
    set({ isShopOpen: true });
  },

  closeShop: () => {
    set({ isShopOpen: false });
  },

  toggleScoreboard: () => {
    mobaAudio.playSkill('dash');
    set((state) => ({ isScoreboardOpen: !state.isScoreboardOpen }));
  },

  buyItem: (itemId) => {
    const item = ITEM_REGISTRY[itemId];
    if (!item) return false;

    const { playerTelemetry, selectedHeroId } = get();
    if (playerTelemetry.items.length >= 6) return false;
    if (playerTelemetry.gold < item.cost) return false;

    mobaAudio.playLastHitGold();
    const newItems = [...playerTelemetry.items, itemId];
    const newGold = playerTelemetry.gold - item.cost;

    // Recalculate next recommended item
    const heroDef = HERO_REGISTRY[selectedHeroId] || HERO_REGISTRY.layla;
    const nextRecId = heroDef.recommendedBuild.find((id) => !newItems.includes(id));
    const nextRecItem = nextRecId ? ITEM_REGISTRY[nextRecId] || null : null;

    set({
      playerTelemetry: {
        ...playerTelemetry,
        items: newItems,
        gold: newGold,
      },
      quickBuyItem: nextRecItem,
    });
    return true;
  },

  sellItem: (index) => {
    const { playerTelemetry } = get();
    const itemId = playerTelemetry.items[index];
    if (!itemId) return;

    const item = ITEM_REGISTRY[itemId];
    const refund = item ? Math.floor(item.cost * 0.6) : 0;
    const newItems = playerTelemetry.items.filter((_, i) => i !== index);

    mobaAudio.playLastHitGold();
    set({
      playerTelemetry: {
        ...playerTelemetry,
        items: newItems,
        gold: playerTelemetry.gold + refund,
      },
    });
  },

  upgradeSkill: (skillIndex) => {
    const { playerTelemetry } = get();
    if (playerTelemetry.unspentSkillPoints <= 0) return;

    const currentLevels = [...playerTelemetry.skillLevels] as [number, number, number];
    const maxSkillLevel = skillIndex === 2 ? 3 : 4;
    if (currentLevels[skillIndex] >= maxSkillLevel) return;

    // Ultimate only at lv 4, 8, 12
    if (skillIndex === 2) {
      const allowedUltLevel = Math.floor(playerTelemetry.level / 4);
      if (currentLevels[2] >= allowedUltLevel) return;
    }

    currentLevels[skillIndex] += 1;
    const unspent = playerTelemetry.unspentSkillPoints - 1;

    mobaAudio.playLevelUp();
    set({
      playerTelemetry: {
        ...playerTelemetry,
        skillLevels: currentLevels,
        unspentSkillPoints: unspent,
        canLevelSkill: [
          unspent > 0 && currentLevels[0] < 4,
          unspent > 0 && currentLevels[1] < 4,
          unspent > 0 && currentLevels[2] < Math.floor(playerTelemetry.level / 4),
        ],
      },
    });
  },

  triggerMinimapPing: (type, x = 0, z = 0) => {
    mobaAudio.playSkill('lightning');
    const texts = {
      attack: '⚔️ Attack!',
      retreat: '⚠️ Retreat!',
      gather: '🛡️ Gather / Request Backup!',
    };
    set({
      activeMinimapPing: { type, x, z, text: texts[type] },
    });
    setTimeout(() => {
      set({ activeMinimapPing: null });
    }, 3500);
  },

  pushAnnouncerBanner: (type, title, subtitle, team) => {
    mobaAudio.playAnnouncer(type);
    const newBanner: AnnouncerBanner = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      title,
      subtitle,
      team,
      timestamp: Date.now(),
    };

    set((state) => ({
      activeBanners: [...state.activeBanners.slice(-2), newBanner],
    }));

    setTimeout(() => {
      set((state) => ({
        activeBanners: state.activeBanners.filter((b) => b.id !== newBanner.id),
      }));
    }, 4200);
  },

  updateTelemetry: (data) => {
    set((state) => ({
      playerTelemetry: {
        ...state.playerTelemetry,
        ...data,
      },
    }));
  },

  updateMinimapRadar: (data) => {
    set({ minimapRadar: data });
  },

  incrementMatchDuration: (dt) => {
    set((state) => ({ matchDuration: state.matchDuration + dt }));
  },

  recordKill: (isPlayerTeamKill) => {
    set((state) => ({
      blueScore: isPlayerTeamKill ? state.blueScore + 1 : state.blueScore,
      redScore: !isPlayerTeamKill ? state.redScore + 1 : state.redScore,
    }));
  },

  endMatch: (isVictory) => {
    mobaAudio.playAnnouncer(isVictory ? 'victory' : 'defeat');
    set({ matchState: isVictory ? 'victory' : 'defeat' });
  },

  resetToLobby: () => {
    set({
      matchState: 'hero_select',
      matchDuration: 0,
      blueScore: 0,
      redScore: 0,
      isShopOpen: false,
      isScoreboardOpen: false,
      activeBanners: [],
      playerTelemetry: { ...INITIAL_PLAYER_TELEMETRY },
    });
  },
}));
