import {
  NinjaCharacter,
  BattleFighter,
  BattleInstance,
  Jutsu,
  MissionEnemy,
  WorldBoss,
  ActiveStatusEffect,
} from '../types';
import { JUTSUS } from '../data/jutsus';
import { ninjaAudio } from '../audio';
import {
  nativeCalculateNinjaDamage,
  nativeDecideNinjaAI,
} from '../services/rustNinjaBridge';

// Element counter advantage map
// Fire > Wind > Lightning > Earth > Water > Fire
const ELEMENT_ADVANTAGE: Record<string, string> = {
  fire: 'wind',
  wind: 'lightning',
  lightning: 'earth',
  earth: 'water',
  water: 'fire',
};

// Calculate full combat stats for the player
export function createPlayerFighter(char: NinjaCharacter): BattleFighter {
  const baseHp = 300 + char.level * 45 + char.attributes.earth * 25;
  const baseCp = 180 + char.level * 25 + char.attributes.water * 20;
  const baseAtk = 25 + char.level * 7 + char.attributes.fire * 5;
  const baseDef = 12 + char.level * 4 + char.attributes.earth * 4;
  const baseAgi = 14 + char.level * 3 + char.attributes.wind * 4;
  const baseCrit = 5 + char.attributes.lightning * 2;
  const baseDodge = 3 + char.attributes.wind * 1.5;

  // Add equipment bonuses
  let totalHp = baseHp;
  let totalCp = baseCp;
  let totalAtk = baseAtk;
  let totalDef = baseDef;
  let totalAgi = baseAgi;
  let totalCrit = baseCrit;
  let totalDodge = baseDodge;

  [char.equippedWeapon, char.equippedArmor, char.equippedBackItem].forEach((item) => {
    if (!item?.stats) return;
    if (item.stats.hp) totalHp += item.stats.hp;
    if (item.stats.cp) totalCp += item.stats.cp;
    if (item.stats.attack) totalAtk += item.stats.attack;
    if (item.stats.defense) totalDef += item.stats.defense;
    if (item.stats.agility) totalAgi += item.stats.agility;
    if (item.stats.critRate) totalCrit += item.stats.critRate;
    if (item.stats.dodgeRate) totalDodge += item.stats.dodgeRate;
  });

  // Add Pet bonus
  if (char.activePet?.bonusStats) {
    if (char.activePet.bonusStats.attack) totalAtk += char.activePet.bonusStats.attack;
    if (char.activePet.bonusStats.agility) totalAgi += char.activePet.bonusStats.agility;
    if (char.activePet.bonusStats.critRate) totalCrit += char.activePet.bonusStats.critRate;
    if (char.activePet.bonusStats.dodgeRate) totalDodge += char.activePet.bonusStats.dodgeRate;
  }

  // Load equipped jutsus
  const equippedJutsus: Jutsu[] = [];
  char.equippedJutsuIds.forEach((id) => {
    const found = JUTSUS.find((j) => j.id === id);
    if (found) equippedJutsus.push(found);
  });

  return {
    id: 'player',
    name: char.name,
    isPlayer: true,
    element: char.element,
    level: char.level,
    hp: totalHp,
    maxHp: totalHp,
    cp: totalCp,
    maxCp: totalCp,
    attack: totalAtk,
    defense: totalDef,
    agility: totalAgi,
    critRate: totalCrit,
    dodgeRate: totalDodge,
    equippedJutsus,
    jutsuCooldowns: {},
    statusEffects: [],
    shield: 0,
    avatarType: 'player',
  };
}

// Create enemy fighter from mission
export function createEnemyFighter(enemy: MissionEnemy | WorldBoss): BattleFighter {
  const equippedJutsus: Jutsu[] = [];
  enemy.jutsus.forEach((id) => {
    const found = JUTSUS.find((j) => j.id === id);
    if (found) equippedJutsus.push(found);
  });

  return {
    id: enemy.id,
    name: enemy.name,
    isPlayer: false,
    element: enemy.element,
    level: enemy.level,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    cp: enemy.cp,
    maxCp: enemy.maxCp,
    attack: enemy.attack,
    defense: enemy.defense,
    agility: enemy.agility,
    critRate: 8,
    dodgeRate: 5,
    equippedJutsus,
    jutsuCooldowns: {},
    statusEffects: [],
    shield: 0,
    avatarType: enemy.avatarType,
  };
}

// Calculate elemental damage modifier
export function getElementalMultiplier(attackerEl: string, defenderEl: string): number {
  if (attackerEl === 'neutral' || defenderEl === 'neutral') return 1.0;
  if (ELEMENT_ADVANTAGE[attackerEl] === defenderEl) return 1.25; // 25% advantage
  if (ELEMENT_ADVANTAGE[defenderEl] === attackerEl) return 0.8; // 20% resistance
  return 1.0;
}

// Calculate final damage
export function calculateDamage(
  attacker: BattleFighter,
  defender: BattleFighter,
  multiplier: number = 1.0,
  jutsuElement: string = attacker.element
): { damage: number; isCrit: boolean; isDodge: boolean } {
  // Check dodge
  const dodgeChance = Math.max(0.02, Math.min(0.5, defender.dodgeRate / 100));
  if (Math.random() < dodgeChance) {
    return { damage: 0, isCrit: false, isDodge: true };
  }

  // Attack buffs / debuffs
  let effectiveAtk = attacker.attack;
  attacker.statusEffects.forEach((se) => {
    if (se.type === 'attack_buff') effectiveAtk *= 1 + se.value / 100;
  });

  // Defense buffs / debuffs
  let effectiveDef = defender.defense;
  defender.statusEffects.forEach((se) => {
    if (se.type === 'defense_buff') effectiveDef *= 1 + se.value / 100;
  });

  // Elemental multiplier
  const elementMult = getElementalMultiplier(jutsuElement, defender.element);

  // Critical hit check
  const critChance = Math.max(0.05, Math.min(0.6, attacker.critRate / 100));
  const isCrit = Math.random() < critChance;
  const critMult = isCrit ? 1.65 : 1.0;

  // Damage formula: (Atk * 1.8 - Def * 0.7) * multiplier * element * crit + variance
  const baseDmg = Math.max(15, effectiveAtk * 1.7 - effectiveDef * 0.65);
  const variance = 0.92 + Math.random() * 0.16; // +/- 8%
  const finalDamage = Math.round(baseDmg * multiplier * elementMult * critMult * variance);

  return { damage: Math.max(1, finalDamage), isCrit, isDodge: false };
}

// Asynchronously calculate damage leveraging Rust native engine when available
export async function calculateDamageAsync(
  attacker: BattleFighter,
  defender: BattleFighter,
  multiplier: number = 1.0,
  jutsuElement: string = attacker.element
): Promise<{ damage: number; isCrit: boolean; isDodge: boolean }> {
  const native = await nativeCalculateNinjaDamage(attacker, defender, multiplier, jutsuElement);
  if (native) {
    return {
      damage: native.damage,
      isCrit: native.is_crit,
      isDodge: native.is_dodge,
    };
  }
  return calculateDamage(attacker, defender, multiplier, jutsuElement);
}

// Apply damage to fighter respecting shields
export function applyDamage(target: BattleFighter, damage: number): number {
  if (target.shield > 0) {
    if (target.shield >= damage) {
      target.shield -= damage;
      return 0; // Completely absorbed
    } else {
      const remainingDmg = damage - target.shield;
      target.shield = 0;
      target.hp = Math.max(0, target.hp - remainingDmg);
      return remainingDmg;
    }
  }

  target.hp = Math.max(0, target.hp - damage);
  return damage;
}

// Tick status effects at start of a fighter's turn
export function processTurnStartEffects(
  fighter: BattleFighter,
  logs: BattleInstance['logs']
): boolean {
  let isStunned = false;
  const remainingEffects: ActiveStatusEffect[] = [];

  for (const se of fighter.statusEffects) {
    if (se.type === 'burn') {
      const dmg = applyDamage(fighter, se.value);
      logs.unshift({
        id: Math.random().toString(),
        text: `${fighter.name} took ${dmg} Burn damage!`,
        type: 'status',
      });
      ninjaAudio.playFireball();
    } else if (se.type === 'bleed') {
      const dmg = applyDamage(fighter, se.value);
      logs.unshift({
        id: Math.random().toString(),
        text: `${fighter.name} suffered ${dmg} Bleed damage!`,
        type: 'status',
      });
      ninjaAudio.playSlash();
    } else if (se.type === 'poison') {
      const dmg = applyDamage(fighter, se.value);
      logs.unshift({
        id: Math.random().toString(),
        text: `${fighter.name} took ${dmg} Poison damage!`,
        type: 'status',
      });
      ninjaAudio.playWater();
    } else if (se.type === 'stun' || se.type === 'sleep') {
      isStunned = true;
      logs.unshift({
        id: Math.random().toString(),
        text: `${fighter.name} is incapacitated by ${se.type.toUpperCase()} and cannot move!`,
        type: 'status',
      });
    }

    // Decrement duration
    const newDur = se.duration - 1;
    if (newDur > 0) {
      remainingEffects.push({ ...se, duration: newDur });
    }
  }

  fighter.statusEffects = remainingEffects;

  // Decrement jutsu cooldowns
  for (const jId in fighter.jutsuCooldowns) {
    if (fighter.jutsuCooldowns[jId] > 0) {
      fighter.jutsuCooldowns[jId] -= 1;
    }
  }

  return isStunned;
}

// AI Turn Decision
export function executeAITurn(battle: BattleInstance): void {
  const ai = battle.enemy;
  const target = battle.player;

  // 1. Process turn start effects
  const isStunned = processTurnStartEffects(ai, battle.logs);
  if (isStunned || ai.hp <= 0) {
    battle.currentTurn = 'player';
    return;
  }

  // 2. Decide action:
  // If CP is very low (< 35), prioritize Chakra Charge
  if (ai.cp < 35) {
    const recovered = Math.round(ai.maxCp * 0.4);
    ai.cp = Math.min(ai.maxCp, ai.cp + recovered);
    battle.logs.unshift({
      id: Math.random().toString(),
      text: `${ai.name} enters a defensive stance and charges +${recovered} CP!`,
      type: 'enemy',
    });
    ninjaAudio.playChakraCharge();
    battle.currentTurn = 'player';
    return;
  }

  // Check available jutsus
  const availableJutsus = ai.equippedJutsus.filter(
    (j) => (ai.jutsuCooldowns[j.id] || 0) === 0 && ai.cp >= j.cpCost
  );

  if (availableJutsus.length > 0 && Math.random() < 0.75) {
    // Pick the most damaging or suitable jutsu
    availableJutsus.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
    const chosenJutsu = availableJutsus[0];

    // Deduct CP & set cooldown
    ai.cp -= chosenJutsu.cpCost;
    ai.jutsuCooldowns[chosenJutsu.id] = chosenJutsu.cooldown;

    // Handle defensive/shield jutsu
    if (chosenJutsu.damageMultiplier === 0 && chosenJutsu.statusEffect?.type === 'shield') {
      ai.shield += chosenJutsu.statusEffect.value;
      battle.logs.unshift({
        id: Math.random().toString(),
        text: `${ai.name} cast [${chosenJutsu.name}] and erected a ${chosenJutsu.statusEffect.value} HP shield!`,
        type: 'enemy',
      });
      ninjaAudio.playEarth();
    } else {
      // Offensive Jutsu
      const res = calculateDamage(ai, target, chosenJutsu.damageMultiplier, chosenJutsu.element);

      if (res.isDodge) {
        battle.logs.unshift({
          id: Math.random().toString(),
          text: `${ai.name} cast [${chosenJutsu.name}], but you dodged!`,
          type: 'system',
        });
        ninjaAudio.playWind();
      } else {
        const actualDmg = applyDamage(target, res.damage);
        battle.logs.unshift({
          id: Math.random().toString(),
          text: `${ai.name} unleashed [${chosenJutsu.name}] for ${actualDmg} damage! ${
            res.isCrit ? 'CRITICAL HIT!' : ''
          }`,
          type: res.isCrit ? 'crit' : 'enemy',
        });

        // Trigger audio
        if (chosenJutsu.element === 'fire') ninjaAudio.playFireball();
        else if (chosenJutsu.element === 'lightning') ninjaAudio.playLightning();
        else if (chosenJutsu.element === 'water') ninjaAudio.playWater();
        else if (chosenJutsu.element === 'earth') ninjaAudio.playEarth();
        else ninjaAudio.playSlash();

        // Apply status effect if applicable
        if (chosenJutsu.statusEffect && Math.random() < chosenJutsu.statusEffect.chance) {
          target.statusEffects.push({
            type: chosenJutsu.statusEffect.type,
            duration: chosenJutsu.statusEffect.duration,
            value: chosenJutsu.statusEffect.value,
            sourceName: chosenJutsu.name,
          });
        }
      }
    }
  } else {
    // Basic Attack
    const res = calculateDamage(ai, target, 1.0, 'neutral');
    if (res.isDodge) {
      battle.logs.unshift({
        id: Math.random().toString(),
        text: `${ai.name} slashed with a weapon, but you dodged!`,
        type: 'system',
      });
      ninjaAudio.playWind();
    } else {
      const actualDmg = applyDamage(target, res.damage);
      battle.logs.unshift({
        id: Math.random().toString(),
        text: `${ai.name} struck you for ${actualDmg} damage! ${res.isCrit ? 'CRITICAL!' : ''}`,
        type: res.isCrit ? 'crit' : 'enemy',
      });
      ninjaAudio.playSlash();
    }
  }

  // Check if player died
  if (target.hp <= 0) {
    battle.isOver = true;
    battle.winner = 'enemy';
    battle.logs.unshift({
      id: Math.random().toString(),
      text: `You have been defeated in battle...`,
      type: 'system',
    });
    ninjaAudio.playDefeat();
    return;
  }

  battle.currentTurn = 'player';
}

// Asynchronously execute AI turn leveraging Rust native decision engine
export async function executeAITurnAsync(battle: BattleInstance): Promise<void> {
  const ai = battle.enemy;
  const decision = await nativeDecideNinjaAI(ai, ai.equippedJutsus);
  if (decision && decision.action_type === 'charge' && ai.cp < ai.maxCp * 0.3) {
    const recovered = Math.round(ai.maxCp * 0.4);
    ai.cp = Math.min(ai.maxCp, ai.cp + recovered);
    battle.logs.unshift({
      id: Math.random().toString(),
      text: `${ai.name} enters a defensive stance and charges +${recovered} CP!`,
      type: 'enemy',
    });
    ninjaAudio.playChakraCharge();
    battle.currentTurn = 'player';
    return;
  }
  executeAITurn(battle);
}
