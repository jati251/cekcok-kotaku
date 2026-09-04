import type { DamageInstance, DamageCalculationResult } from '../types/combat';
import type { ActiveHeroEntity } from '../types/hero';

export function calculateDamage(
  instance: DamageInstance,
  targetArmor: number,
  targetMagicRes: number,
  sourceHero?: ActiveHeroEntity,
  targetHero?: ActiveHeroEntity
): DamageCalculationResult {
  let raw = instance.rawAmount;
  let isCrit = false;
  let lifestealHeal = 0;

  // 1. Source Hero Item Passives & Crit
  if (sourceHero) {
    // Check Blade of Despair
    if (targetHero && targetHero.currentHp / (targetHero.currentHp + 1) < 0.5) {
      if (sourceHero.items.includes('blade_of_despair')) {
        raw *= 1.25;
      }
    }

    // Check Demon Hunter Sword (% current HP bonus)
    if (targetHero && sourceHero.items.includes('demon_hunter_sword') && !instance.isSkill) {
      const bonusDmg = targetHero.currentHp * 0.08;
      raw += bonusDmg;
    }

    // Check Critical Strike (on basic attacks)
    if (!instance.isSkill && instance.damageType === 'physical') {
      let critChance = 0.1;
      let critMult = 2.0;
      if (sourceHero.items.includes('berserkers_fury')) {
        critChance += 0.25;
        critMult += 0.4;
      }
      if (sourceHero.items.includes('windtalker')) {
        critChance += 0.1;
      }

      if (Math.random() < critChance) {
        raw *= critMult;
        isCrit = true;
      }
    }
  }

  // 2. Resistance Formulas
  let finalDamage = raw;
  if (instance.damageType === 'physical') {
    let effectiveArmor = Math.max(0, targetArmor);
    if (sourceHero) {
      if (sourceHero.items.includes('malefic_roar')) {
        effectiveArmor *= 0.65; // 35% armor pen
      }
      if (sourceHero.items.includes('hunter_strike')) {
        effectiveArmor = Math.max(0, effectiveArmor - 15);
      }
    }
    const armorReduction = 120 / (120 + effectiveArmor);
    finalDamage = raw * armorReduction;

    // Target Blade Armor reflection
    if (targetHero && targetHero.items.includes('blade_armor') && !instance.isSkill && sourceHero) {
      const reflected = finalDamage * 0.2;
      sourceHero.currentHp = Math.max(1, sourceHero.currentHp - reflected);
    }
  } else if (instance.damageType === 'magic') {
    let effectiveMagicRes = Math.max(0, targetMagicRes);
    if (sourceHero) {
      if (sourceHero.items.includes('divine_glaive')) {
        effectiveMagicRes *= 0.6; // 40% magic pen
      }
      if (sourceHero.items.includes('genius_wand')) {
        effectiveMagicRes = Math.max(0, effectiveMagicRes - 10);
      }
    }
    // Target Athena's Shield reduction
    if (targetHero && targetHero.items.includes('athena_shield')) {
      effectiveMagicRes += 35;
      finalDamage *= 0.75;
    }
    const magicReduction = 120 / (120 + effectiveMagicRes);
    finalDamage = raw * magicReduction;
  } else {
    // True Damage penetrates all armor/resistance
    finalDamage = raw;
  }

  finalDamage = Math.max(1, Math.round(finalDamage));

  // 3. Lifesteal
  if (sourceHero && !instance.isSkill && instance.damageType === 'physical') {
    let lifestealRatio = 0;
    if (sourceHero.items.includes('haas_claws')) lifestealRatio += 0.2;
    if (sourceHero.items.includes('endless_battle')) lifestealRatio += 0.1;
    if (sourceHero.items.includes('demon_hunter_sword')) lifestealRatio += 0.05;
    if (sourceHero.heroDefId === 'alucard') lifestealRatio += 0.2; // Native

    if (lifestealRatio > 0) {
      lifestealHeal = Math.round(finalDamage * lifestealRatio);
    }
  }

  return {
    finalDamage,
    isCrit,
    lifestealHeal,
  };
}
