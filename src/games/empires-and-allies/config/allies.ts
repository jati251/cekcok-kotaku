import type { AllyCommander } from '../types';

export const INITIAL_ALLIES: AllyCommander[] = [
  {
    id: 'ally_major_foley',
    name: 'Major Foley',
    title: 'Senior Island Advisor',
    avatar: 'major_foley',
    level: 4,
    reputation: 150,
    hasVisitedToday: false,
    buildings: [
      { id: 'foley_hq', buildingTypeId: 'headquarters', gridX: 10, gridY: 10, level: 2, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'foley_barracks', buildingTypeId: 'tent_barracks', gridX: 14, gridY: 10, level: 2, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'foley_cottage', buildingTypeId: 'commander_cottage', gridX: 7, gridY: 10, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'foley_mine', buildingTypeId: 'gold_mine', gridX: 7, gridY: 13, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
    ],
  },
  {
    id: 'ally_sophia',
    name: 'Captain Sophia',
    title: 'Naval Armada Specialist',
    avatar: 'captain_sophia',
    level: 6,
    reputation: 320,
    hasVisitedToday: false,
    buildings: [
      { id: 'sophia_hq', buildingTypeId: 'headquarters', gridX: 10, gridY: 10, level: 3, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'sophia_shipyard', buildingTypeId: 'naval_shipyard', gridX: 14, gridY: 10, level: 2, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'sophia_airfield', buildingTypeId: 'hangar_airfield', gridX: 6, gridY: 9, level: 2, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
    ],
  },
  {
    id: 'ally_ramirez',
    name: 'Lt. Ramirez',
    title: 'Frontline Logistics Officer',
    avatar: 'lt_ramirez',
    level: 3,
    reputation: 90,
    hasVisitedToday: false,
    buildings: [
      { id: 'ramirez_hq', buildingTypeId: 'headquarters', gridX: 10, gridY: 10, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'ramirez_lumber', buildingTypeId: 'lumber_mill', gridX: 14, gridY: 10, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
      { id: 'ramirez_refinery', buildingTypeId: 'oil_refinery', gridX: 10, gridY: 14, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
    ],
  },
];
