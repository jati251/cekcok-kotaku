import { create } from 'zustand';
import {
  NinjaCharacter,
  NinjaElement,
  VillageModalType,
  BattleInstance,
  Item,
  Jutsu,
  Pet,
  CharacterAttributes,
} from '../types';
import { ITEMS } from '../data/items';
import { JUTSUS } from '../data/jutsus';
import { PETS } from '../data/pets';
import { ninjaAudio } from '../audio';

interface NinjaSagaState {
  character: NinjaCharacter | null;
  activeModal: VillageModalType;
  activeBattle: BattleInstance | null;

  // Actions
  createCharacter: (name: string, gender: 'male' | 'female', element: NinjaElement) => void;
  openModal: (modal: VillageModalType) => void;
  closeModal: () => void;

  // Progression & Stats
  allocateAttributePoint: (attr: keyof CharacterAttributes) => void;
  gainRewards: (xp: number, gold: number, tokens?: number, itemDrop?: Item) => void;

  // Inventory & Equipment
  equipItem: (item: Item) => void;
  unequipItem: (slot: 'weapon' | 'armor' | 'back_item') => void;
  buyItem: (item: Item) => boolean;
  sellItem: (item: Item) => void;
  upgradeWeaponAtBlacksmith: (weapon: Item) => { success: boolean; newLevel: number };

  // Jutsu Management
  learnJutsu: (jutsu: Jutsu) => boolean;
  equipJutsuToDeck: (jutsuId: string, slotIndex: number) => void;
  unequipJutsuFromDeck: (slotIndex: number) => void;

  // Pet Management
  setActivePet: (pet: Pet | null) => void;
  adoptPet: (pet: Pet) => boolean;

  // Battle Lifecycle
  startBattle: (battle: BattleInstance) => void;
  updateBattle: (updater: (prev: BattleInstance) => BattleInstance) => void;
  endBattle: () => void;
}

const INITIAL_STARTER_ITEMS: { item: Item; quantity: number }[] = [
  { item: ITEMS.find((i) => i.id === 'weapon_wooden_bokken')!, quantity: 1 },
  { item: ITEMS.find((i) => i.id === 'armor_academy_gi')!, quantity: 1 },
  { item: ITEMS.find((i) => i.id === 'potion_hp_small')!, quantity: 5 },
  { item: ITEMS.find((i) => i.id === 'potion_cp_small')!, quantity: 5 },
  { item: ITEMS.find((i) => i.id === 'mat_enhancement_stone')!, quantity: 3 },
];

export const useNinjaSagaStore = create<NinjaSagaState>((set, get) => ({
  character: null,
  activeModal: null,
  activeBattle: null,

  createCharacter: (name, gender, element) => {
    // Pick starter jutsu for the chosen element
    const starterJutsu = JUTSUS.find((j) => j.element === element && j.requiredLevel === 1);
    const starterJutsuId = starterJutsu ? starterJutsu.id : 'fire_ball';

    const starterWeapon = ITEMS.find((i) => i.id === 'weapon_wooden_bokken') || null;
    const starterArmor = ITEMS.find((i) => i.id === 'armor_academy_gi') || null;

    const newChar: NinjaCharacter = {
      name: name.trim() || 'Shinobi Ren',
      gender,
      element,
      rank: 'academy_student',
      level: 1,
      xp: 0,
      maxXp: 120,
      gold: 500,
      tokens: 10,
      attributePoints: 3,
      attributes: {
        fire: element === 'fire' ? 3 : 1,
        water: element === 'water' ? 3 : 1,
        earth: element === 'earth' ? 3 : 1,
        wind: element === 'wind' ? 3 : 1,
        lightning: element === 'lightning' ? 3 : 1,
      },
      equippedWeapon: starterWeapon,
      equippedArmor: starterArmor,
      equippedBackItem: null,
      equippedJutsuIds: [starterJutsuId],
      learnedJutsuIds: [starterJutsuId],
      inventory: [...INITIAL_STARTER_ITEMS],
      activePet: null,
      ownedPets: [PETS[0]], // Start with Shiro the Ninja Dog!
      completedMissionIds: [],
      arenaPoints: 1000,
      arenaRank: 'Novice Genin',
    };

    ninjaAudio.playLevelUp();
    set({ character: newChar });
  },

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  allocateAttributePoint: (attr) => {
    const char = get().character;
    if (!char || char.attributePoints <= 0) return;

    ninjaAudio.playChakraCharge();
    set({
      character: {
        ...char,
        attributePoints: char.attributePoints - 1,
        attributes: {
          ...char.attributes,
          [attr]: char.attributes[attr] + 1,
        },
      },
    });
  },

  gainRewards: (xp, gold, tokens = 0, itemDrop) => {
    const char = get().character;
    if (!char) return;

    let newXp = char.xp + xp;
    let newLevel = char.level;
    let newMaxXp = char.maxXp;
    let newPoints = char.attributePoints;
    let didLevelUp = false;

    // Check level up threshold
    while (newXp >= newMaxXp && newLevel < 60) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.floor(newMaxXp * 1.35 + 50);
      newPoints += 3;
      didLevelUp = true;
    }

    if (didLevelUp) {
      ninjaAudio.playLevelUp();
    }

    // Update Rank
    let rank = char.rank;
    if (newLevel >= 32) rank = 'jounin';
    else if (newLevel >= 15) rank = 'chunin';
    else if (newLevel >= 5) rank = 'genin';

    // Add item drop to inventory if any
    const updatedInventory = [...char.inventory];
    if (itemDrop) {
      const existing = updatedInventory.find((i) => i.item.id === itemDrop.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        updatedInventory.push({ item: itemDrop, quantity: 1 });
      }
    }

    set({
      character: {
        ...char,
        level: newLevel,
        xp: newXp,
        maxXp: newMaxXp,
        gold: char.gold + gold,
        tokens: char.tokens + tokens,
        attributePoints: newPoints,
        rank,
        inventory: updatedInventory,
      },
    });
  },

  equipItem: (item) => {
    const char = get().character;
    if (!char) return;

    ninjaAudio.playSlash();
    if (item.type === 'weapon') {
      set({ character: { ...char, equippedWeapon: item } });
    } else if (item.type === 'armor') {
      set({ character: { ...char, equippedArmor: item } });
    } else if (item.type === 'back_item') {
      set({ character: { ...char, equippedBackItem: item } });
    }
  },

  unequipItem: (slot) => {
    const char = get().character;
    if (!char) return;

    if (slot === 'weapon') {
      set({ character: { ...char, equippedWeapon: null } });
    } else if (slot === 'armor') {
      set({ character: { ...char, equippedArmor: null } });
    } else if (slot === 'back_item') {
      set({ character: { ...char, equippedBackItem: null } });
    }
  },

  buyItem: (item) => {
    const char = get().character;
    if (!char || char.gold < item.price) return false;

    ninjaAudio.playChakraCharge();
    const updatedInventory = [...char.inventory];
    const existing = updatedInventory.find((i) => i.item.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      updatedInventory.push({ item, quantity: 1 });
    }

    set({
      character: {
        ...char,
        gold: char.gold - item.price,
        inventory: updatedInventory,
      },
    });
    return true;
  },

  sellItem: (item) => {
    const char = get().character;
    if (!char) return;

    const updatedInventory = [...char.inventory];
    const index = updatedInventory.findIndex((i) => i.item.id === item.id);
    if (index === -1) return;

    if (updatedInventory[index].quantity > 1) {
      updatedInventory[index].quantity -= 1;
    } else {
      updatedInventory.splice(index, 1);
    }

    ninjaAudio.playChakraCharge();
    set({
      character: {
        ...char,
        gold: char.gold + item.sellPrice,
        inventory: updatedInventory,
      },
    });
  },

  upgradeWeaponAtBlacksmith: (weapon) => {
    const char = get().character;
    if (!char) return { success: false, newLevel: 0 };

    const currentLvl = weapon.upgradeLevel || 0;
    if (currentLvl >= 10) return { success: false, newLevel: currentLvl };

    const cost = (currentLvl + 1) * 350;
    const stoneItem = char.inventory.find(
      (i) => i.item.id === 'mat_enhancement_stone' && i.quantity > 0
    );

    if (char.gold < cost || !stoneItem) {
      return { success: false, newLevel: currentLvl };
    }

    // Deduct stone and gold
    stoneItem.quantity -= 1;
    const updatedInventory = char.inventory.filter((i) => i.quantity > 0);

    // Success rate decreases as level increases (100% at +0 -> 50% at +9)
    const successRate = Math.max(0.45, 1.0 - currentLvl * 0.06);
    const isSuccess = Math.random() <= successRate;

    if (isSuccess) {
      ninjaAudio.playLevelUp();
      const newLvl = currentLvl + 1;
      const updatedWeapon: Item = {
        ...weapon,
        upgradeLevel: newLvl,
        stats: {
          ...weapon.stats,
          attack: Math.round((weapon.stats?.attack || 20) * 1.15),
          critRate: (weapon.stats?.critRate || 5) + 1,
        },
      };

      // Also update equipped weapon if it matches
      const equipped =
        char.equippedWeapon?.id === weapon.id ? updatedWeapon : char.equippedWeapon;

      set({
        character: {
          ...char,
          gold: char.gold - cost,
          inventory: updatedInventory,
          equippedWeapon: equipped,
        },
      });
      return { success: true, newLevel: newLvl };
    } else {
      ninjaAudio.playDefeat();
      set({
        character: {
          ...char,
          gold: char.gold - cost,
          inventory: updatedInventory,
        },
      });
      return { success: false, newLevel: currentLvl };
    }
  },

  learnJutsu: (jutsu) => {
    const char = get().character;
    if (!char) return false;

    if (char.learnedJutsuIds.includes(jutsu.id)) return false;
    if (char.level < jutsu.requiredLevel) return false;

    const cost = jutsu.requiredLevel * 250;
    if (char.gold < cost) return false;

    ninjaAudio.playChakraCharge();
    set({
      character: {
        ...char,
        gold: char.gold - cost,
        learnedJutsuIds: [...char.learnedJutsuIds, jutsu.id],
      },
    });
    return true;
  },

  equipJutsuToDeck: (jutsuId, slotIndex) => {
    const char = get().character;
    if (!char) return;

    const newDeck = [...char.equippedJutsuIds];
    // Remove if already in another slot
    const existingIdx = newDeck.indexOf(jutsuId);
    if (existingIdx !== -1) {
      newDeck.splice(existingIdx, 1);
    }

    // Insert into slotIndex
    if (slotIndex < newDeck.length) {
      newDeck[slotIndex] = jutsuId;
    } else {
      newDeck.push(jutsuId);
    }

    ninjaAudio.playSlash();
    set({
      character: {
        ...char,
        equippedJutsuIds: newDeck.slice(0, 6),
      },
    });
  },

  unequipJutsuFromDeck: (slotIndex) => {
    const char = get().character;
    if (!char) return;

    const newDeck = [...char.equippedJutsuIds];
    newDeck.splice(slotIndex, 1);

    set({
      character: {
        ...char,
        equippedJutsuIds: newDeck,
      },
    });
  },

  setActivePet: (pet) => {
    const char = get().character;
    if (!char) return;
    set({ character: { ...char, activePet: pet } });
  },

  adoptPet: (pet) => {
    const char = get().character;
    if (!char || char.tokens < 15) return false;

    if (char.ownedPets.some((p) => p.id === pet.id)) return false;

    ninjaAudio.playLevelUp();
    set({
      character: {
        ...char,
        tokens: char.tokens - 15,
        ownedPets: [...char.ownedPets, pet],
        activePet: pet,
      },
    });
    return true;
  },

  startBattle: (battle) => {
    set({ activeBattle: battle, activeModal: null });
  },

  updateBattle: (updater) => {
    const current = get().activeBattle;
    if (!current) return;
    set({ activeBattle: updater(current) });
  },

  endBattle: () => {
    set({ activeBattle: null });
  },
}));
