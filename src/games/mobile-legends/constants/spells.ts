export interface BattleSpellDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number; // in seconds
  castRange: number;
}

export const BATTLE_SPELLS: Record<string, BattleSpellDefinition> = {
  flicker: {
    id: 'flicker',
    name: 'Flicker',
    description: 'Teleports a short distance in the specified direction. Gains +5 Physical & Magic Defense for 1s after.',
    icon: '⚡',
    cooldown: 120,
    castRange: 6.0,
  },
  execute: {
    id: 'execute',
    name: 'Execute',
    description: 'Deals 200 (+20 per level) plus 13% of target’s lost HP as True Damage to an adjacent enemy hero.',
    icon: '🗡️',
    cooldown: 90,
    castRange: 3.5,
  },
  retribution: {
    id: 'retribution',
    name: 'Retribution',
    description: 'Deals 1000 True Damage to the target jungle monster or minion. Reduces damage taken from creeps.',
    icon: '🔥',
    cooldown: 35,
    castRange: 5.5,
  },
  purify: {
    id: 'purify',
    name: 'Purify',
    description: 'Immediately removes all debuffs and crowd control effects, gaining CC immunity and +15% movement speed for 1.2s.',
    icon: '✨',
    cooldown: 90,
    castRange: 0,
  },
  flameshot: {
    id: 'flameshot',
    name: 'Flameshot',
    description: 'Fires a fiery shot in the target direction, dealing magic damage that scales with distance and knocking back nearby enemies.',
    icon: '🎯',
    cooldown: 50,
    castRange: 16.0,
  },
  aegis: {
    id: 'aegis',
    name: 'Aegis',
    description: 'Generates a 750 (+50 per level) shield for 3s. Nearby allied heroes also gain 70% of the shield.',
    icon: '🛡️',
    cooldown: 90,
    castRange: 0,
  },
};
