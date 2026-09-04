import { BattleFighter, Jutsu } from '../types';

export interface RustNinjaStatusEffect {
  id: string;
  name: string;
  effect_type: string;
  value: number;
  duration: number;
}

export interface RustNinjaJutsuDef {
  id: string;
  name: string;
  element: string;
  cp_cost: number;
  cooldown: number;
  damage_multiplier: number;
  effect_type: string | null;
  effect_value: number | null;
  effect_duration: number | null;
}

export interface RustNinjaCombatant {
  id: string;
  name: string;
  is_player: boolean;
  element: string;
  level: number;
  hp: number;
  max_hp: number;
  cp: number;
  max_cp: number;
  attack: number;
  defense: number;
  agility: number;
  crit_rate: number;
  dodge_rate: number;
  status_effects: RustNinjaStatusEffect[];
  jutsu_cooldowns: Record<string, number>;
  shield: number;
}

export interface RustNinjaDamageResult {
  damage: number;
  absorbed_by_shield: number;
  is_crit: boolean;
  is_dodge: boolean;
  remaining_target_hp: number;
  remaining_target_shield: number;
}

export interface RustNinjaTurnEffectsResult {
  is_stunned: boolean;
  total_dot_damage: number;
  log_messages: string[];
  updated_status_effects: RustNinjaStatusEffect[];
  updated_cooldowns: Record<string, number>;
  remaining_hp: number;
}

export interface RustNinjaAIDecision {
  action_type: 'jutsu' | 'attack' | 'charge';
  selected_jutsu_id: string | null;
}

export interface RustNinjaRewardsResult {
  earned_xp: number;
  earned_ryo: number;
  new_level: number;
  new_xp: number;
  new_max_xp: number;
  leveled_up: boolean;
}

export async function isTauriEnvironment(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function fighterToRustCombatant(f: BattleFighter): RustNinjaCombatant {
  return {
    id: f.id,
    name: f.name,
    is_player: f.isPlayer,
    element: f.element,
    level: f.level,
    hp: f.hp,
    max_hp: f.maxHp,
    cp: f.cp,
    max_cp: f.maxCp,
    attack: f.attack,
    defense: f.defense,
    agility: f.agility,
    crit_rate: f.critRate,
    dodge_rate: f.dodgeRate,
    status_effects: f.statusEffects.map((se) => ({
      id: se.type,
      name: se.sourceName,
      effect_type: se.type,
      value: se.value,
      duration: se.duration,
    })),
    jutsu_cooldowns: { ...f.jutsuCooldowns },
    shield: f.shield,
  };
}

export function jutsuToRustDef(j: Jutsu): RustNinjaJutsuDef {
  return {
    id: j.id,
    name: j.name,
    element: j.element,
    cp_cost: j.cpCost,
    cooldown: j.cooldown,
    damage_multiplier: j.damageMultiplier,
    effect_type: j.statusEffect?.type ?? null,
    effect_value: j.statusEffect?.value ?? null,
    effect_duration: j.statusEffect?.duration ?? null,
  };
}

export async function nativeCalculateNinjaDamage(
  attacker: BattleFighter,
  defender: BattleFighter,
  multiplier: number = 1.0,
  jutsuElement?: string
): Promise<RustNinjaDamageResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustNinjaDamageResult>('calculate_ninja_damage', {
      attacker: fighterToRustCombatant(attacker),
      defender: fighterToRustCombatant(defender),
      multiplier,
      jutsuElement: jutsuElement ?? attacker.element,
      rngSeed: Math.floor(Math.random() * 1_000_000),
    });
  } catch {
    return null;
  }
}

export async function nativeResolveTurnEffects(
  fighter: BattleFighter
): Promise<RustNinjaTurnEffectsResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustNinjaTurnEffectsResult>('resolve_ninja_turn_effects', {
      fighter: fighterToRustCombatant(fighter),
    });
  } catch {
    return null;
  }
}

export async function nativeDecideNinjaAI(
  aiFighter: BattleFighter,
  availableJutsus: Jutsu[]
): Promise<RustNinjaAIDecision | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustNinjaAIDecision>('decide_ninja_ai_turn', {
      ai: fighterToRustCombatant(aiFighter),
      availableJutsus: availableJutsus.map(jutsuToRustDef),
    });
  } catch {
    return null;
  }
}

export async function nativeCalculateNinjaRewards(
  currentLevel: number,
  currentXp: number,
  currentMaxXp: number,
  baseRewardXp: number,
  baseRewardRyo: number,
  isVictory: boolean
): Promise<RustNinjaRewardsResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustNinjaRewardsResult>('calculate_ninja_rewards', {
      currentLevel,
      currentXp,
      currentMaxXp,
      baseRewardXp,
      baseRewardRyo,
      isVictory,
    });
  } catch {
    return null;
  }
}
