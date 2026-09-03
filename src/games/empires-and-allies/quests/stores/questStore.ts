import { create } from 'zustand';
import type { Quest } from "@/types";
import { INITIAL_QUESTS } from "@/config/gameData";
import { soundManager } from "@/utils/audio";
import { useEconomyStore } from "@/games/empires-and-allies/economy/stores/economyStore";

interface DialogueState {
  isOpen: boolean;
  speaker: string;
  avatar: string;
  messages: string[];
  currentStep: number;
}

interface QuestState {
  quests: Quest[];
  dialogue: DialogueState;

  // Actions
  checkProgress: (type: 'build' | 'harvest' | 'combat' | 'level' | 'clear' | 'train' | 'visit', key: string, count?: number) => void;
  claimReward: (questId: string) => void;
  openDialogue: (speaker: string, avatar: string, messages: string[]) => void;
  nextDialogueStep: () => void;
  closeDialogue: () => void;
  setAllQuests: (quests: Quest[]) => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: INITIAL_QUESTS,
  dialogue: {
    isOpen: true,
    speaker: 'Major Foley',
    avatar: 'major_foley',
    messages: [
      'Commander! Welcome to your new island command station.',
      'The Raven Syndicate is actively mobilizing in the archipelago.',
      'Construct a Military Barracks and fortify our perimeter before they strike!',
    ],
    currentStep: 0,
  },

  checkProgress: (type, key, count = 1) => {
    set((state) => {
      let anyChanged = false;
      const updated = state.quests.map((q) => {
        if (!q.isCompleted && q.targetType === type && (q.targetKey === key || q.targetKey === 'any')) {
          const nextCount = q.currentCount + count;
          const isDone = nextCount >= q.targetCount;
          anyChanged = true;
          if (isDone) {
            soundManager.playVictory();
          }
          return {
            ...q,
            currentCount: Math.min(q.targetCount, nextCount),
            isCompleted: isDone,
          };
        }
        return q;
      });

      return anyChanged ? { quests: updated } : {};
    });
  },

  claimReward: (questId) => {
    const q = get().quests.find((item) => item.id === questId);
    if (!q || !q.isCompleted) return;

    soundManager.playHarvest();
    const economy = useEconomyStore.getState();

    if (q.rewards.coins) economy.addResource('coins', q.rewards.coins);
    if (q.rewards.wood) economy.addResource('wood', q.rewards.wood);
    if (q.rewards.oil) economy.addResource('oil', q.rewards.oil);
    if (q.rewards.energy) economy.restoreEnergy(q.rewards.energy);
    if (q.rewards.xp) economy.addXp(q.rewards.xp);

    // Remove or archive completed quest
    set((state) => ({
      quests: state.quests.filter((item) => item.id !== questId),
    }));
  },

  openDialogue: (speaker, avatar, messages) => {
    soundManager.playAlert();
    set({
      dialogue: {
        isOpen: true,
        speaker,
        avatar,
        messages,
        currentStep: 0,
      },
    });
  },

  nextDialogueStep: () => {
    soundManager.playClick();
    set((state) => {
      const next = state.dialogue.currentStep + 1;
      if (next >= state.dialogue.messages.length) {
        return {
          dialogue: { ...state.dialogue, isOpen: false, currentStep: 0 },
        };
      }
      return {
        dialogue: { ...state.dialogue, currentStep: next },
      };
    });
  },

  closeDialogue: () => {
    soundManager.playClick();
    set((state) => ({
      dialogue: { ...state.dialogue, isOpen: false },
    }));
  },

  setAllQuests: (quests) => {
    set({ quests });
  },
}));
