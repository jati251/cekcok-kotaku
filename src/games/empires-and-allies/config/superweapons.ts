import type { Superweapon } from '../types';

export const SUPERWEAPONS: Superweapon[] = [
  {
    id: 'tactical_nuke',
    name: 'Tactical Warhead',
    description: 'Unleashes devastating thermal devastation dealing 120 damage to all enemy units.',
    damage: 120,
    cost: { aluminum: 3, microchips: 2, steel: 4 },
    icon: 'Radiation',
  },
  {
    id: 'orbital_laser',
    name: 'Orbital Ion Cannon',
    description: 'Satellite beam that instantly annihilates an enemy armored or naval flagship for 180 damage.',
    damage: 180,
    cost: { microchips: 4, copper: 5 },
    icon: 'Zap',
  },
  {
    id: 'napalm_strike',
    name: 'Napalm Carpet Bomb',
    description: 'Incinerates the battlefield, dealing 75 damage across all enemy positions.',
    damage: 75,
    cost: { rubber: 4, aluminum: 3 },
    icon: 'Flame',
  },
];
