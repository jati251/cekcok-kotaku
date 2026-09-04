import { create } from 'zustand';
import {
  FurnitureItem,
  PlacedFurniture,
  DrinkRecipe,
  ActiveBarStation,
  Guest,
  DoorQueueGuest,
  StaffMember,
  MusicTrack,
  ClubQuest,
  ClubModalType,
} from '../types';
import { DRINKS } from '../data/drinks';
import { MUSIC_TRACKS } from '../data/music';
import { CELEBRITIES } from '../data/celebrities';
import { INITIAL_QUESTS } from '../data/quests';
import { nightclubAudio } from '../audio';
import { nativeCalculateDJTrackHype } from '../services/rustNightclubBridge';

interface NightclubState {
  clubName: string;
  level: number;
  xp: number;
  maxXp: number;
  cash: number;
  luxeCash: number;
  hype: number; // 0 to 100
  starRating: number;
  capacity: number;
  floorSize: number; // grid dimensions (e.g. 12x12)

  placedFurniture: PlacedFurniture[];
  activeBars: Record<string, ActiveBarStation>;
  currentTrack: MusicTrack;
  isBeatActive: boolean;

  guests: Guest[];
  doorQueue: DoorQueueGuest[];
  staff: Record<string, StaffMember>;
  quests: ClubQuest[];

  activeModal: ClubModalType;
  selectedBarId: string | null;

  // Actions
  openModal: (modal: ClubModalType, barId?: string) => void;
  closeModal: () => void;
  toggleMusicBeat: () => void;
  selectTrack: (track: MusicTrack) => void;

  // Bar Actions
  startDrinkBatch: (barInstanceId: string, drink: DrinkRecipe) => boolean;
  collectBarDrinkRevenue: (barInstanceId: string) => void;

  // Furniture & Decor Actions
  buyAndPlaceFurniture: (item: FurnitureItem, gridX: number, gridY: number) => boolean;
  removeFurniture: (instanceId: string) => void;

  // Door Velvet Rope Actions
  admitGuest: (index: number) => void;
  rejectGuest: (index: number) => void;

  // DJ Scratch Minigame
  scratchDJRecord: () => void;

  // Staff Actions
  upgradeStaff: (role: string) => boolean;

  // Quest Claim
  claimQuest: (questId: string) => void;

  // Tick simulation (guest movement, drink progress, mood)
  tickSimulation: () => void;
  collectTip: (guestId: string) => void;
}

const INITIAL_PLACED: PlacedFurniture[] = [
  // 1. Starter Bar Station
  { instanceId: 'bar_1', furnitureId: 'bar_classic_wood', gridX: 2, gridY: 2, rotation: 0 },
  // 2. Starter Dance Floor
  { instanceId: 'dance_1', furnitureId: 'floor_checkered_vinyl', gridX: 5, gridY: 4, rotation: 0 },
  { instanceId: 'dance_2', furnitureId: 'floor_led_rainbow', gridX: 7, gridY: 4, rotation: 0 },
  // 3. Starter DJ Table
  { instanceId: 'dj_1', furnitureId: 'dj_retro_vinyl', gridX: 6, gridY: 1, rotation: 0 },
  // 4. Starter Speaker
  { instanceId: 'audio_1', furnitureId: 'audio_mega_sub', gridX: 9, gridY: 1, rotation: 0 },
  // 5. Disco Ball
  { instanceId: 'light_1', furnitureId: 'light_disco_ball', gridX: 6, gridY: 5, rotation: 0 },
];

const INITIAL_STAFF: Record<string, StaffMember> = {
  bartender: {
    role: 'bartender',
    name: 'Mixologist Leo',
    level: 1,
    maxLevel: 5,
    upgradeCost: 500,
    benefit: 'Speeds up cocktail preparation by 15%',
  },
  bouncer: {
    role: 'bouncer',
    name: 'Bouncer Bruno',
    level: 1,
    maxLevel: 5,
    upgradeCost: 650,
    benefit: 'Increases velvet rope guest queue by +2 slots',
  },
  dancer: {
    role: 'dancer',
    name: 'Choreographer Roxy',
    level: 1,
    maxLevel: 5,
    upgradeCost: 800,
    benefit: 'Pumps dance floor hype bonus by +10%',
  },
  dj: {
    role: 'dj',
    name: 'Resident DJ Beat',
    level: 1,
    maxLevel: 5,
    upgradeCost: 1200,
    benefit: 'Extends music hype multiplier by +20%',
  },
};

export const useNightclubStore = create<NightclubState>((set, get) => ({
  clubName: 'Club Euphoria',
  level: 1,
  xp: 0,
  maxXp: 150,
  cash: 1200,
  luxeCash: 10,
  hype: 50,
  starRating: 2,
  capacity: 25,
  floorSize: 12,

  placedFurniture: [...INITIAL_PLACED],
  activeBars: {
    bar_1: {
      barInstanceId: 'bar_1',
      activeDrinkId: 'drink_draft_beer',
      startedAt: Date.now() - 20000,
      prepDurationSec: 15,
      servingsRemaining: 15,
      isReady: true,
    },
  },
  currentTrack: MUSIC_TRACKS[0],
  isBeatActive: false,

  guests: [
    {
      id: 'g_1',
      name: 'Rave Mia',
      x: 6,
      y: 5,
      targetX: 6,
      targetY: 5,
      state: 'dancing',
      mood: 90,
      danceStep: 0,
      color: '#f43f5e',
    },
    {
      id: 'g_2',
      name: 'DJ Fan Kai',
      x: 7,
      y: 5,
      targetX: 7,
      targetY: 5,
      state: 'dancing',
      mood: 85,
      danceStep: 2,
      color: '#38bdf8',
    },
    {
      id: 'g_3',
      name: 'Lounge Sam',
      x: 3,
      y: 3,
      targetX: 3,
      targetY: 3,
      state: 'ordering_drink',
      mood: 75,
      danceStep: 0,
      color: '#a855f7',
      tipReady: 25,
    },
  ],

  doorQueue: [
    {
      id: 'q_1',
      name: 'Chloe V.',
      styleRating: 4,
      isVIP: false,
      isTroublemaker: false,
      entryFee: 50,
      avatarColor: '#ec4899',
    },
    {
      id: 'q_2',
      name: 'Lord Sterling',
      styleRating: 5,
      isVIP: true,
      isTroublemaker: false,
      entryFee: 250,
      avatarColor: '#f59e0b',
    },
    {
      id: 'q_3',
      name: 'Rowdy Tyler',
      styleRating: 1,
      isVIP: false,
      isTroublemaker: true,
      entryFee: 10,
      avatarColor: '#64748b',
    },
  ],

  staff: { ...INITIAL_STAFF },
  quests: [...INITIAL_QUESTS],

  activeModal: null,
  selectedBarId: null,

  openModal: (modal, barId) =>
    set({ activeModal: modal, selectedBarId: barId ?? null }),
  closeModal: () => set({ activeModal: null, selectedBarId: null }),

  toggleMusicBeat: () => {
    const isPlaying = nightclubAudio.toggleClubBeat(get().currentTrack.bpm);
    set({ isBeatActive: isPlaying });
  },

  selectTrack: (track) => {
    nightclubAudio.playRecordScratch();
    if (get().isBeatActive) {
      nightclubAudio.startClubBeat(track.bpm);
    }
    set({ currentTrack: track });
  },

  startDrinkBatch: (barInstanceId, drink) => {
    const { cash } = get();
    if (cash < drink.cost) return false;

    nightclubAudio.playCocktailShaker();
    set((state) => ({
      cash: state.cash - drink.cost,
      activeBars: {
        ...state.activeBars,
        [barInstanceId]: {
          barInstanceId,
          activeDrinkId: drink.id,
          startedAt: Date.now(),
          prepDurationSec: drink.prepTimeSec,
          servingsRemaining: drink.servings,
          isReady: false,
        },
      },
    }));
    return true;
  },

  collectBarDrinkRevenue: (barInstanceId) => {
    const { activeBars, quests } = get();
    const station = activeBars[barInstanceId];
    if (!station || !station.activeDrinkId || !station.isReady) return;

    const drink = DRINKS.find((d) => d.id === station.activeDrinkId);
    if (!drink) return;

    nightclubAudio.playCashRegister();
    const earnings = drink.revenue;
    const gainedXp = drink.xpReward;

    // Advance quest if matching
    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'serve_drinks' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    let newXp = get().xp + gainedXp;
    let newLevel = get().level;
    let newMaxXp = get().maxXp;
    let didLevelUp = false;

    while (newXp >= newMaxXp && newLevel < 40) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.floor(newMaxXp * 1.35 + 100);
      didLevelUp = true;
    }

    if (didLevelUp) {
      nightclubAudio.playFanfare();
    }

    set((state) => {
      const nextBars = { ...state.activeBars };
      delete nextBars[barInstanceId];
      return {
        cash: state.cash + earnings,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        activeBars: nextBars,
        quests: updatedQuests,
      };
    });
  },

  buyAndPlaceFurniture: (item, gridX, gridY) => {
    const { cash, luxeCash, quests } = get();
    if (item.luxePrice && luxeCash < item.luxePrice) return false;
    if (item.price && cash < item.price) return false;

    nightclubAudio.playCashRegister();
    const newPlaced: PlacedFurniture = {
      instanceId: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      furnitureId: item.id,
      gridX,
      gridY,
      rotation: 0,
    };

    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'buy_furniture' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    set((state) => ({
      cash: item.price ? state.cash - item.price : state.cash,
      luxeCash: item.luxePrice ? state.luxeCash - item.luxePrice : state.luxeCash,
      hype: Math.min(100, state.hype + item.hypeBonus),
      placedFurniture: [...state.placedFurniture, newPlaced],
      quests: updatedQuests,
    }));
    return true;
  },

  removeFurniture: (instanceId) => {
    set((state) => ({
      placedFurniture: state.placedFurniture.filter((f) => f.instanceId !== instanceId),
    }));
  },

  admitGuest: (index) => {
    const { doorQueue, guests, capacity, quests } = get();
    if (index >= doorQueue.length) return;
    if (guests.length >= capacity) return;

    const guest = doorQueue[index];
    nightclubAudio.playDoorAdmit();

    // Troublemakers penalize hype!
    let hypeDelta = guest.isTroublemaker ? -12 : guest.isVIP ? 8 : 2;

    const newGuest: Guest = {
      id: `guest_${Date.now()}`,
      name: guest.name,
      x: 1,
      y: 8,
      targetX: 6 + Math.floor((Math.random() - 0.5) * 4),
      targetY: 5 + Math.floor((Math.random() - 0.5) * 3),
      state: 'dancing',
      mood: 85,
      danceStep: Math.floor(Math.random() * 4),
      color: guest.avatarColor,
      isCelebrity: guest.isVIP,
    };

    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'admit_vips' && guest.isVIP && !q.completed) {
        const next = q.currentCount + 1;
        return { ...q, currentCount: next, completed: next >= q.targetCount };
      }
      return q;
    });

    set((state) => {
      const nextQueue = [...state.doorQueue];
      nextQueue.splice(index, 1);
      return {
        cash: state.cash + guest.entryFee,
        hype: Math.min(100, Math.max(10, state.hype + hypeDelta)),
        guests: [...state.guests, newGuest],
        doorQueue: nextQueue,
        quests: updatedQuests,
      };
    });
  },

  rejectGuest: (index) => {
    nightclubAudio.playDoorReject();
    set((state) => {
      const nextQueue = [...state.doorQueue];
      const removed = nextQueue.splice(index, 1)[0];
      // Reward bouncer for catching troublemakers
      const bonusRep = removed?.isTroublemaker ? 15 : 0;
      return {
        doorQueue: nextQueue,
        xp: state.xp + bonusRep,
      };
    });
  },

  scratchDJRecord: () => {
    nightclubAudio.playRecordScratch();
    const { quests, currentTrack, hype } = get();

    // Trigger asynchronous native Rust hype computation if in Tauri
    nativeCalculateDJTrackHype(currentTrack?.bpm ?? 128, 1, hype)
      .then((res) => {
        if (res) {
          set((state) => ({
            cash: state.cash + Math.round(res.bonus_cash * 0.1),
            hype: Math.min(100, state.hype + Math.round(res.bonus_popularity)),
          }));
        }
      })
      .catch(() => {});

    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'dj_scratch' && !q.completed) {
        const next = q.currentCount + 1;
        return { ...q, currentCount: next, completed: next >= q.targetCount };
      }
      return q;
    });

    set((state) => ({
      hype: Math.min(100, state.hype + 5),
      quests: updatedQuests,
    }));
  },

  upgradeStaff: (role) => {
    const { staff, cash } = get();
    const member = staff[role];
    if (!member || member.level >= member.maxLevel || cash < member.upgradeCost) {
      return false;
    }

    nightclubAudio.playCashRegister();
    set((state) => ({
      cash: state.cash - member.upgradeCost,
      staff: {
        ...state.staff,
        [role]: {
          ...member,
          level: member.level + 1,
          upgradeCost: Math.round(member.upgradeCost * 1.6),
        },
      },
    }));
    return true;
  },

  claimQuest: (questId) => {
    const quest = get().quests.find((q) => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    nightclubAudio.playFanfare();
    set((state) => ({
      cash: state.cash + quest.rewardCash,
      xp: state.xp + quest.rewardXp,
      quests: state.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
    }));
  },

  collectTip: (guestId) => {
    const guest = get().guests.find((g) => g.id === guestId);
    if (!guest || !guest.tipReady) return;

    nightclubAudio.playCashRegister();
    const tip = guest.tipReady;

    set((state) => ({
      cash: state.cash + tip,
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, tipReady: undefined } : g
      ),
    }));
  },

  tickSimulation: () => {
    const now = Date.now();
    const { activeBars, guests, doorQueue, hype, quests } = get();

    // 1. Update Drink Preparation Status
    let barsChanged = false;
    const nextBars: Record<string, ActiveBarStation> = {};

    for (const id in activeBars) {
      const b = activeBars[id];
      if (!b.isReady) {
        const elapsed = (now - b.startedAt) / 1000;
        if (elapsed >= b.prepDurationSec) {
          nextBars[id] = { ...b, isReady: true };
          barsChanged = true;
          nightclubAudio.playGlassClink();
        } else {
          nextBars[id] = b;
        }
      } else {
        nextBars[id] = b;
      }
    }

    // 2. Animate and update guests
    const updatedGuests = guests.map((g) => {
      // Step dance rhythm
      const nextDanceStep = (g.danceStep + 1) % 4;

      // Random tip generation
      let tipReady = g.tipReady;
      if (!tipReady && Math.random() < 0.03) {
        tipReady = Math.floor(15 + Math.random() * 30);
      }

      return {
        ...g,
        danceStep: nextDanceStep,
        tipReady,
      };
    });

    // 3. Replenish Door Queue if < 4
    let nextQueue = [...doorQueue];
    if (nextQueue.length < 4 && Math.random() < 0.25) {
      const names = ['Jax', 'Zara', 'Milo', 'Sasha', 'Dante', 'Vesper', 'Leo', 'Nova'];
      const celebChance = Math.random() < 0.25;
      const celeb = celebChance ? CELEBRITIES[Math.floor(Math.random() * CELEBRITIES.length)] : null;
      const isVIP = !!celeb;
      const isTroublemaker = !isVIP && Math.random() < 0.15;

      nextQueue.push({
        id: `q_${Date.now()}_${Math.random()}`,
        name: celeb ? celeb.name : names[Math.floor(Math.random() * names.length)],
        styleRating: isVIP ? 5 : isTroublemaker ? 1 : Math.floor(2 + Math.random() * 3),
        isVIP,
        isTroublemaker,
        entryFee: isVIP ? 150 + Math.floor(Math.random() * 200) : 30 + Math.floor(Math.random() * 40),
        avatarColor: isVIP ? '#f59e0b' : isTroublemaker ? '#64748b' : '#38bdf8',
      });
    }

    // Check reach hype quest
    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'reach_hype' && !q.completed) {
        if (hype >= q.targetCount) {
          return { ...q, currentCount: hype, completed: true };
        }
      }
      return q;
    });

    set({
      activeBars: barsChanged ? nextBars : activeBars,
      guests: updatedGuests,
      doorQueue: nextQueue,
      quests: updatedQuests,
    });
  },
}));
