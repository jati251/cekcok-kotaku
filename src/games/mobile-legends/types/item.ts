export type ItemCategory = 'attack' | 'magic' | 'defense' | 'movement';

export interface ItemStats {
  physicalAttack?: number;
  magicPower?: number;
  physicalDefense?: number;
  magicDefense?: number;
  hp?: number;
  mana?: number;
  movementSpeed?: number;
  attackSpeed?: number; // e.g. 0.15 = +15%
  cooldownReduction?: number; // e.g. 0.10 = +10%
  critChance?: number; // e.g. 0.20 = +20%
  lifesteal?: number; // e.g. 0.15 = +15%
  physicalPenetration?: number;
  magicPenetration?: number;
}

export interface ItemPassive {
  name: string;
  description: string;
  effectType:
    | 'despair' // +25% Phys Atk against targets under 50% HP
    | 'demon_hunter' // 8% of target current HP as bonus damage
    | 'berserker_crit' // +40% Crit damage
    | 'windtalker_typhoon' // basic attack triggers splash magic damage
    | 'holy_mystery' // +21% - 35% Magic Power scaling
    | 'lightning_echo' // magic echo burst every 6s
    | 'immortality_resurrect' // revive upon death with 16% HP + shield
    | 'blade_armor_reflect' // reflects physical basic attacks
    | 'athena_shield' // 25% magic damage reduction shield
    | 'warrior_valor' // stacks armor upon taking physical hit
    | 'none';
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  tier: 1 | 2 | 3;
  cost: number;
  icon: string;
  stats: ItemStats;
  passive?: ItemPassive;
  components?: string[]; // IDs of tier 1 or 2 items used to craft this
  description: string;
}
