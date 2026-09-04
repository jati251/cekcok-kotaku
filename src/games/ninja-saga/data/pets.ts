import { Pet } from '../types';

export const PETS: Pet[] = [
  {
    id: 'pet_shiro_dog',
    name: 'Shiro the Ninja Hound',
    species: 'dog',
    level: 1,
    skillName: 'Fang Over Fang Bite',
    skillDescription: 'Rushes forward to viciously bite the opponent, dealing 120 physical damage and stunning for 1 turn.',
    cooldownTurns: 4,
    bonusStats: {
      attack: 18,
      agility: 8,
    },
  },
  {
    id: 'pet_kage_crow',
    name: 'Kage the Shadow Crow',
    species: 'crow',
    level: 1,
    skillName: 'Feather Mirage Genjutsu',
    skillDescription: 'Scatters black illusion feathers to blind the opponent, reducing their accuracy by 40% for 2 turns.',
    cooldownTurns: 3,
    bonusStats: {
      dodgeRate: 8,
      agility: 12,
    },
  },
  {
    id: 'pet_ryu_dragon',
    name: 'Ryu the Celestial Wyrm',
    species: 'dragon',
    level: 1,
    skillName: 'Dragon Roar Blaze',
    skillDescription: 'Spits a searing breath of azure flame, dealing 180 fire damage and granting you a 25% Attack Buff for 2 turns.',
    cooldownTurns: 4,
    bonusStats: {
      attack: 30,
      critRate: 6,
    },
  },
  {
    id: 'pet_kitsune_fox',
    name: 'Kitsune the Spirit Fox',
    species: 'fox',
    level: 1,
    skillName: 'Spirit Orb Purification',
    skillDescription: 'Spins mystical spirit orbs to heal you for 250 HP and restore 150 CP.',
    cooldownTurns: 4,
    bonusStats: {
      dodgeRate: 6,
      critRate: 6,
    },
  },
];
