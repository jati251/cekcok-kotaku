import { create } from 'zustand';
import {
  CarModel,
  OwnedCar,
  VisualCustomization,
  PerformanceUpgrades,
  ActiveServiceBay,
  ServiceJob,
  DragRaceOpponent,
  RaceState,
  CarTownQuest,
  CarTownModalType,
  GarageDecorItem,
} from '../types';
import { CAR_CATALOG } from '../data/cars';
import { INITIAL_CAR_TOWN_QUESTS } from '../data/quests';
import { carTownAudio } from '../audio';
import { nativeEvaluateGearShift } from '../services/rustCarTownBridge';

interface CarTownState {
  coins: number;
  bucks: number;
  level: number;
  xp: number;
  maxXp: number;
  ownedCars: OwnedCar[];
  activeCarId: string;
  garageLevel: number;
  decor: {
    flooring: string;
    lift: string;
    neon: string;
    toolbox: string;
  };
  bays: ActiveServiceBay[];
  activeModal: CarTownModalType;
  quests: CarTownQuest[];
  raceState: RaceState;
  carWashProgress: number; // 0 to 100
  isAudioMuted: boolean;

  // Actions
  openModal: (modal: CarTownModalType) => void;
  closeModal: () => void;
  selectActiveCar: (carId: string) => void;
  buyCar: (carModel: CarModel) => boolean;
  customizeVisuals: (
    carId: string,
    updates: Partial<VisualCustomization>,
    costCoins: number,
    costBucks: number
  ) => boolean;
  upgradePerformance: (
    carId: string,
    partKey: keyof PerformanceUpgrades,
    costCoins: number,
    costBucks: number
  ) => boolean;
  startJob: (bayId: number, job: ServiceJob, carId: string) => void;
  collectJob: (bayId: number) => void;
  washCarStep: () => void;
  finishCarWash: () => void;
  buyDecor: (item: GarageDecorItem) => boolean;
  startDragRace: (opponent: DragRaceOpponent) => void;
  advanceCountdown: () => void;
  shiftGear: () => void;
  activateNitro: () => void;
  tickRace: (deltaSeconds: number) => void;
  claimQuest: (questId: string) => void;
  toggleAudio: () => void;
  tickGlobal: () => void;
}

const initialCar: OwnedCar = {
  id: 'car_initial_ae86',
  modelId: 'car_ae86',
  nickname: 'Panda Trueno',
  visuals: {
    color: '#ffffff',
    livery: 'racing_stripes',
    rimStyle: 'sport_alloy',
    spoiler: 'ducktail',
    neonUnderglow: 'none',
  },
  performance: {
    engineStage: 1,
    turboStage: 0,
    tiresStage: 1,
    nitroStage: 0,
    weightReductionStage: 1,
    gearboxStage: 0,
  },
  dirtLevel: 45,
  mileageMiles: 24,
  purchasedAt: Date.now(),
};

const initialBays: ActiveServiceBay[] = [
  { bayId: 0, currentJob: null, startedAt: null, assignedCarId: null },
  { bayId: 1, currentJob: null, startedAt: null, assignedCarId: null },
  { bayId: 2, currentJob: null, startedAt: null, assignedCarId: null },
];

const initialRaceState: RaceState = {
  isActive: false,
  stage: 'countdown',
  countdownStep: 3,
  playerRpm: 2500,
  playerGear: 1,
  playerSpeedMph: 0,
  playerDistanceM: 0,
  playerTimeSeconds: 0,
  playerNitroActive: false,
  playerNitroCharge: 100,
  opponentSpeedMph: 0,
  opponentDistanceM: 0,
  opponentTimeSeconds: 0,
  opponent: null,
  lastShiftRating: null,
  winner: null,
};

export const useCarTownStore = create<CarTownState>((set, get) => ({
  coins: 12000,
  bucks: 8,
  level: 1,
  xp: 40,
  maxXp: 250,
  ownedCars: [initialCar],
  activeCarId: initialCar.id,
  garageLevel: 1,
  decor: {
    flooring: 'floor_concrete',
    lift: 'lift_standard',
    neon: 'neon_route66',
    toolbox: 'toolbox_red',
  },
  bays: initialBays,
  activeModal: null,
  quests: INITIAL_CAR_TOWN_QUESTS,
  raceState: initialRaceState,
  carWashProgress: 0,
  isAudioMuted: false,

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  selectActiveCar: (carId) => {
    carTownAudio.playEngineRev(0.4);
    set({ activeCarId: carId });
  },

  buyCar: (carModel) => {
    const { coins, bucks, level, ownedCars, quests } = get();
    if (coins < carModel.priceCoins || bucks < carModel.priceBucks || level < carModel.levelRequired) {
      return false;
    }

    const newCar: OwnedCar = {
      id: `car_${Date.now()}_${Math.random()}`,
      modelId: carModel.id,
      nickname: carModel.name,
      visuals: {
        color: carModel.defaultColor,
        livery: 'none',
        rimStyle: 'stock',
        spoiler: 'none',
        neonUnderglow: 'none',
      },
      performance: {
        engineStage: 0,
        turboStage: 0,
        tiresStage: 0,
        nitroStage: 0,
        weightReductionStage: 0,
        gearboxStage: 0,
      },
      dirtLevel: 0,
      mileageMiles: 0,
      purchasedAt: Date.now(),
    };

    carTownAudio.playCoinPayout();
    carTownAudio.playEngineRev(0.6);

    // Update quest progress
    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'buy_car' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    set({
      coins: coins - carModel.priceCoins,
      bucks: bucks - carModel.priceBucks,
      ownedCars: [...ownedCars, newCar],
      activeCarId: newCar.id,
      quests: updatedQuests,
    });
    return true;
  },

  customizeVisuals: (carId, updates, costCoins, costBucks) => {
    const { coins, bucks, ownedCars, quests } = get();
    if (coins < costCoins || bucks < costBucks) return false;

    carTownAudio.playWrench();

    const updatedCars = ownedCars.map((c) => {
      if (c.id === carId) {
        return {
          ...c,
          visuals: {
            ...c.visuals,
            ...updates,
          },
        };
      }
      return c;
    });

    // Update quest
    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'tune_part' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    set({
      coins: coins - costCoins,
      bucks: bucks - costBucks,
      ownedCars: updatedCars,
      quests: updatedQuests,
    });
    return true;
  },

  upgradePerformance: (carId, partKey, costCoins, costBucks) => {
    const { coins, bucks, ownedCars, quests } = get();
    if (coins < costCoins || bucks < costBucks) return false;

    const car = ownedCars.find((c) => c.id === carId);
    if (!car) return false;

    const currentStage = car.performance[partKey];
    if (currentStage >= 4) return false;

    carTownAudio.playWrench();
    if (partKey === 'turboStage') {
      carTownAudio.playTurboBlowOff();
    }

    const updatedCars = ownedCars.map((c) => {
      if (c.id === carId) {
        return {
          ...c,
          performance: {
            ...c.performance,
            [partKey]: currentStage + 1,
          },
        };
      }
      return c;
    });

    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'tune_part' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    set({
      coins: coins - costCoins,
      bucks: bucks - costBucks,
      ownedCars: updatedCars,
      quests: updatedQuests,
    });
    return true;
  },

  startJob: (bayId, job, carId) => {
    const { bays } = get();
    carTownAudio.playWrench();

    const nextBays = bays.map((bay) => {
      if (bay.bayId === bayId) {
        return {
          ...bay,
          currentJob: job,
          startedAt: Date.now(),
          assignedCarId: carId,
        };
      }
      return bay;
    });

    set({ bays: nextBays, activeModal: null });
  },

  collectJob: (bayId) => {
    const { bays, coins, xp, quests } = get();
    const bay = bays.find((b) => b.bayId === bayId);
    if (!bay || !bay.currentJob) return;

    carTownAudio.playCoinPayout();

    const payout = bay.currentJob.payoutCoins;
    const earnedXp = bay.currentJob.xpReward;

    const nextBays = bays.map((b) => {
      if (b.bayId === bayId) {
        return { ...b, currentJob: null, startedAt: null, assignedCarId: null };
      }
      return b;
    });

    // Check quest
    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'complete_job' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    // Add XP & level
    let newXp = xp + earnedXp;
    let newLevel = get().level;
    let newMaxXp = get().maxXp;
    while (newXp >= newMaxXp) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.floor(newMaxXp * 1.4);
      carTownAudio.playFanfare();
    }

    set({
      coins: coins + payout,
      xp: newXp,
      level: newLevel,
      maxXp: newMaxXp,
      bays: nextBays,
      quests: updatedQuests,
    });
  },

  washCarStep: () => {
    const { carWashProgress } = get();
    carTownAudio.playWashSpray();
    const nextProgress = Math.min(100, carWashProgress + 20);

    if (nextProgress >= 100) {
      get().finishCarWash();
    } else {
      set({ carWashProgress: nextProgress });
    }
  },

  finishCarWash: () => {
    const { activeCarId, ownedCars, coins, xp, quests } = get();
    carTownAudio.playCoinPayout();
    carTownAudio.playFanfare();

    const updatedCars = ownedCars.map((c) => {
      if (c.id === activeCarId) {
        return { ...c, dirtLevel: 0 };
      }
      return c;
    });

    // Tip bonus: 350 Coins + 40 XP
    let newXp = xp + 40;
    let newLevel = get().level;
    let newMaxXp = get().maxXp;
    while (newXp >= newMaxXp) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.floor(newMaxXp * 1.4);
    }

    const updatedQuests = quests.map((q) => {
      if (q.targetType === 'wash_car' && !q.completed) {
        const nextCount = q.currentCount + 1;
        return {
          ...q,
          currentCount: nextCount,
          completed: nextCount >= q.targetCount,
        };
      }
      return q;
    });

    set({
      carWashProgress: 0,
      ownedCars: updatedCars,
      coins: coins + 350,
      xp: newXp,
      level: newLevel,
      maxXp: newMaxXp,
      quests: updatedQuests,
      activeModal: null,
    });
  },

  buyDecor: (item) => {
    const { coins, bucks, decor } = get();
    if (coins < item.priceCoins || bucks < item.priceBucks) return false;

    carTownAudio.playWrench();
    const updatedDecor = {
      ...decor,
      [item.category]: item.id,
    };

    set({
      coins: coins - item.priceCoins,
      bucks: bucks - item.priceBucks,
      decor: updatedDecor,
    });
    return true;
  },

  startDragRace: (opponent) => {
    carTownAudio.playTireScreech();
    carTownAudio.playTreeBeep(false);

    set({
      activeModal: 'drag_race',
      raceState: {
        ...initialRaceState,
        isActive: true,
        stage: 'countdown',
        countdownStep: 3,
        opponent,
      },
    });
  },

  advanceCountdown: () => {
    const { raceState } = get();
    if (raceState.stage !== 'countdown') return;

    const nextStep = raceState.countdownStep - 1;
    if (nextStep === 0) {
      // Green light! Launch!
      carTownAudio.playTreeBeep(true);
      carTownAudio.playEngineRev(0.8);
      set({
        raceState: {
          ...raceState,
          stage: 'racing',
          countdownStep: 0,
          playerRpm: 4500,
          playerGear: 1,
        },
      });
    } else if (nextStep > 0) {
      carTownAudio.playTreeBeep(false);
      set({
        raceState: {
          ...raceState,
          countdownStep: nextStep,
        },
      });
    }
  },

  shiftGear: () => {
    const { raceState } = get();
    if (raceState.stage !== 'racing') return;

    const { playerRpm, playerGear } = raceState;
    if (playerGear >= 6) return;

    let rating: 'early' | 'good' | 'perfect' | 'redline' = 'good';
    let isPerfect = false;

    if (playerRpm >= 7000 && playerRpm <= 7600) {
      rating = 'perfect';
      isPerfect = true;
    } else if (playerRpm > 7600) {
      rating = 'redline';
    } else if (playerRpm < 5500) {
      rating = 'early';
    }

    carTownAudio.playGearShift(isPerfect);
    if (rating === 'perfect') {
      carTownAudio.playTurboBlowOff();
    }

    // Drop RPM back to powerband
    let newRpm = 4200;
    let speedBoost = rating === 'perfect' ? 12 : rating === 'good' ? 6 : rating === 'redline' ? -4 : 2;

    // Trigger native Rust shift evaluator when running in Tauri
    nativeEvaluateGearShift(playerGear, playerRpm, 1)
      .then((res) => {
        if (res) {
          set((state) => ({
            raceState: {
              ...state.raceState,
              playerSpeedMph: Math.max(10, state.raceState.playerSpeedMph + (res.speed_boost_mph > 0 ? 2 : 0)),
            },
          }));
        }
      })
      .catch(() => {});

    set({
      raceState: {
        ...raceState,
        playerGear: playerGear + 1,
        playerRpm: newRpm,
        playerSpeedMph: Math.max(10, raceState.playerSpeedMph + speedBoost),
        lastShiftRating: rating,
      },
    });
  },

  activateNitro: () => {
    const { raceState } = get();
    if (raceState.stage !== 'racing' || raceState.playerNitroCharge <= 0) return;

    carTownAudio.playNitroBoost();
    set({
      raceState: {
        ...raceState,
        playerNitroActive: true,
      },
    });
  },

  tickRace: (deltaSeconds) => {
    const { raceState, activeCarId, ownedCars } = get();
    if (!raceState.isActive || raceState.stage !== 'racing') return;

    const car = ownedCars.find((c) => c.id === activeCarId);
    const model = CAR_CATALOG.find((m) => m.id === car?.modelId);
    const opp = raceState.opponent;

    if (!car || !model || !opp) return;

    // Calculate player effective HP & acceleration
    let totalHp = model.baseHp;
    totalHp += (car.performance.engineStage || 0) * 45;
    totalHp += (car.performance.turboStage || 0) * 60;
    if (raceState.playerNitroActive) {
      totalHp += 180 + (car.performance.nitroStage || 0) * 70;
    }

    const weightKg = Math.max(800, model.baseWeightKg - (car.performance.weightReductionStage || 0) * 80);
    const hpToWeight = totalHp / weightKg;

    // Accel step
    const accelRate = hpToWeight * 180 * deltaSeconds;
    const newPlayerSpeed = Math.min(model.baseTopSpeedMph + 60, raceState.playerSpeedMph + accelRate);

    // RPM rising
    let newPlayerRpm = raceState.playerRpm + (totalHp / 40) * deltaSeconds * 120;
    if (newPlayerRpm > 8200) newPlayerRpm = 8200;

    // Distances
    const metersPerSecPlayer = (newPlayerSpeed * 1609.34) / 3600;
    const newPlayerDist = raceState.playerDistanceM + metersPerSecPlayer * deltaSeconds;
    const newPlayerTime = raceState.playerTimeSeconds + deltaSeconds;

    // Nitro depletion
    let newNitroCharge = raceState.playerNitroCharge;
    let isNitro = raceState.playerNitroActive;
    if (isNitro) {
      newNitroCharge -= deltaSeconds * 35;
      if (newNitroCharge <= 0) {
        newNitroCharge = 0;
        isNitro = false;
      }
    }

    // Opponent physics
    const oppHpWeight = opp.hp / opp.weightKg;
    const oppAccel = oppHpWeight * 175 * deltaSeconds;
    const newOppSpeed = raceState.opponentSpeedMph + oppAccel;
    const metersPerSecOpp = (newOppSpeed * 1609.34) / 3600;
    const newOppDist = raceState.opponentDistanceM + metersPerSecOpp * deltaSeconds;
    const newOppTime = raceState.opponentTimeSeconds + deltaSeconds;

    // Check finish line (402m = 1/4 mile)
    if (newPlayerDist >= 402 || newOppDist >= 402) {
      const playerWon = newPlayerDist >= newOppDist;
      const { coins, xp, quests } = get();

      carTownAudio.playFanfare();

      const earnedCoins = playerWon ? opp.rewardCoins : Math.floor(opp.rewardCoins * 0.2);
      const earnedXp = playerWon ? opp.rewardXp : Math.floor(opp.rewardXp * 0.2);

      let newXp = xp + earnedXp;
      let newLevel = get().level;
      let newMaxXp = get().maxXp;
      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.4);
      }

      // Add car dirtiness and mileage
      const updatedCars = ownedCars.map((c) => {
        if (c.id === activeCarId) {
          return {
            ...c,
            dirtLevel: Math.min(100, c.dirtLevel + 18),
            mileageMiles: c.mileageMiles + 1,
          };
        }
        return c;
      });

      const updatedQuests = quests.map((q) => {
        if (q.targetType === 'win_race' && playerWon && !q.completed) {
          const nextCount = q.currentCount + 1;
          return {
            ...q,
            currentCount: nextCount,
            completed: nextCount >= q.targetCount,
          };
        }
        return q;
      });

      set({
        coins: coins + earnedCoins,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        ownedCars: updatedCars,
        quests: updatedQuests,
        raceState: {
          ...raceState,
          stage: 'finished',
          playerSpeedMph: newPlayerSpeed,
          playerDistanceM: 402,
          playerTimeSeconds: newPlayerTime,
          opponentSpeedMph: newOppSpeed,
          opponentDistanceM: newOppDist,
          opponentTimeSeconds: newOppTime,
          winner: playerWon ? 'player' : 'opponent',
        },
      });
      return;
    }

    set({
      raceState: {
        ...raceState,
        playerSpeedMph: newPlayerSpeed,
        playerRpm: newPlayerRpm,
        playerDistanceM: newPlayerDist,
        playerTimeSeconds: newPlayerTime,
        playerNitroActive: isNitro,
        playerNitroCharge: newNitroCharge,
        opponentSpeedMph: newOppSpeed,
        opponentDistanceM: newOppDist,
        opponentTimeSeconds: newOppTime,
      },
    });
  },

  claimQuest: (questId) => {
    const { quests, coins, bucks, xp } = get();
    const target = quests.find((q) => q.id === questId);
    if (!target || !target.completed) return;

    carTownAudio.playCoinPayout();
    carTownAudio.playFanfare();

    let newXp = xp + target.rewardXp;
    let newLevel = get().level;
    let newMaxXp = get().maxXp;
    while (newXp >= newMaxXp) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.floor(newMaxXp * 1.4);
    }

    const updatedQuests = quests.filter((q) => q.id !== questId);

    set({
      coins: coins + target.rewardCoins,
      bucks: bucks + target.rewardBucks,
      xp: newXp,
      level: newLevel,
      maxXp: newMaxXp,
      quests: updatedQuests,
    });
  },

  toggleAudio: () => {
    const nextMuted = !get().isAudioMuted;
    carTownAudio.setMuted(nextMuted);
    set({ isAudioMuted: nextMuted });
  },

  tickGlobal: () => {
    // Check if any service bay jobs have completed
    const { bays } = get();
    const now = Date.now();
    let hasChanges = false;

    const nextBays = bays.map((bay) => {
      if (bay.currentJob && bay.startedAt) {
        const elapsed = (now - bay.startedAt) / 1000;
        if (elapsed >= bay.currentJob.durationSeconds) {
          hasChanges = true;
        }
      }
      return bay;
    });

    if (hasChanges) {
      set({ bays: nextBays });
    }
  },
}));
