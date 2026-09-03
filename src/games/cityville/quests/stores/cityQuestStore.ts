// CityVille Quest Store: Mayor Directives & Milestones

import { create } from 'zustand';
import { INITIAL_CITY_QUESTS } from '../../config/quests';
import type { CityQuest } from '../../types';
import { useCityEconomyStore } from '../../economy/stores/cityEconomyStore';
import { soundManager } from '@/utils/audio';

interface CityQuestState {
  quests: CityQuest[];
  dialogue: {
    isOpen: boolean;
    speaker: string;
    avatar: string;
    messages: string[];
    currentStep: number;
  };

  // Actions
  checkProgress: (type: CityQuest['targetType'], key: string, count?: number) => void;
  claimReward: (questId: string) => void;
  nextDialogueStep: () => void;
  closeDialogue: () => void;
}

export const useCityQuestStore = create<CityQuestState>((set, get) => ({
  quests: INITIAL_CITY_QUESTS,
  dialogue: {
    isOpen: true,
    speaker: 'Mayor Samantha',
    avatar: 'mayor_samantha',
    messages: [
      'Welcome, City Planner! I am Mayor Samantha.',
      'Our fertile valley is ready to blossom into a bustling metropolis.',
      'Start by opening the Build Menu and placing a Cozy Cottage for our first residents!',
    ],
    currentStep: 0,
  },

  checkProgress: (type, key, count = 1) => {
    set((state) => ({
      quests: state.quests.map((q) => {
        if (q.isCompleted) return q;
        if (q.targetType === type && (q.targetKey === 'any' || q.targetKey === key)) {
          const nextCount = q.currentCount + count;
          const isDone = nextCount >= q.targetCount;
          if (isDone && !q.isCompleted) {
            soundManager.playVictory();
          }
          return {
            ...q,
            currentCount: Math.min(q.targetCount, nextCount),
            isCompleted: isDone,
          };
        }
        return q;
      }),
    }));
  },

  claimReward: (questId) => {
    const quest = get().quests.find((q) => q.id === questId);
    if (!quest || !quest.isCompleted) return;

    soundManager.playHarvest();
    const economy = useCityEconomyStore.getState();

    if (quest.rewards.coins) economy.addCoins(quest.rewards.coins);
    if (quest.rewards.goods) economy.addGoods(quest.rewards.goods);
    if (quest.rewards.xp) economy.gainXp(quest.rewards.xp);

    set((state) => ({
      quests: state.quests.filter((q) => q.id !== questId),
    }));
  },

  nextDialogueStep: () => {
    const { dialogue } = get();
    soundManager.playClick();
    if (dialogue.currentStep + 1 < dialogue.messages.length) {
      set({
        dialogue: { ...dialogue, currentStep: dialogue.currentStep + 1 },
      });
    } else {
      set({
        dialogue: { ...dialogue, isOpen: false, currentStep: 0 },
      });
    }
  },

  closeDialogue: () => {
    soundManager.playClick();
    set((state) => ({
      dialogue: { ...state.dialogue, isOpen: false },
    }));
  },
}));
