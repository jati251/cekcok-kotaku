use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaStatusEffect {
    pub id: String,
    pub name: String,
    pub effect_type: String, // "burn", "bleed", "poison", "stun", "sleep", "attack_buff", "defense_buff", "shield"
    pub value: f32,
    pub duration: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaJutsuDef {
    pub id: String,
    pub name: String,
    pub element: String,
    pub cp_cost: i32,
    pub cooldown: i32,
    pub damage_multiplier: f32,
    pub effect_type: Option<String>,
    pub effect_value: Option<f32>,
    pub effect_duration: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaCombatant {
    pub id: String,
    pub name: String,
    pub is_player: bool,
    pub element: String,
    pub level: i32,
    pub hp: f32,
    pub max_hp: f32,
    pub cp: f32,
    pub max_cp: f32,
    pub attack: f32,
    pub defense: f32,
    pub agility: f32,
    pub crit_rate: f32,
    pub dodge_rate: f32,
    pub status_effects: Vec<NinjaStatusEffect>,
    pub jutsu_cooldowns: HashMap<String, i32>,
    pub shield: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaDamageResult {
    pub damage: f32,
    pub absorbed_by_shield: f32,
    pub is_crit: bool,
    pub is_dodge: bool,
    pub remaining_target_hp: f32,
    pub remaining_target_shield: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaTurnEffectsResult {
    pub is_stunned: bool,
    pub total_dot_damage: f32,
    pub log_messages: Vec<String>,
    pub updated_status_effects: Vec<NinjaStatusEffect>,
    pub updated_cooldowns: HashMap<String, i32>,
    pub remaining_hp: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaAIDecision {
    pub action_type: String, // "jutsu", "attack", "charge"
    pub selected_jutsu_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NinjaRewardsResult {
    pub earned_xp: i32,
    pub earned_ryo: i32,
    pub new_level: i32,
    pub new_xp: i32,
    pub new_max_xp: i32,
    pub leveled_up: bool,
}

// Elemental advantage lookup: Fire > Wind > Lightning > Earth > Water > Fire
fn get_elemental_multiplier(attacker_el: &str, defender_el: &str) -> f32 {
    let att = attacker_el.to_lowercase();
    let def = defender_el.to_lowercase();

    if att == "neutral" || def == "neutral" {
        return 1.0;
    }

    let is_advantage = match att.as_str() {
        "fire" => def == "wind",
        "wind" => def == "lightning",
        "lightning" => def == "earth",
        "earth" => def == "water",
        "water" => def == "fire",
        _ => false,
    };

    if is_advantage {
        return 1.25;
    }

    let is_disadvantage = match att.as_str() {
        "wind" => def == "fire",
        "lightning" => def == "wind",
        "earth" => def == "lightning",
        "water" => def == "earth",
        "fire" => def == "water",
        _ => false,
    };

    if is_disadvantage {
        0.8
    } else {
        1.0
    }
}

// Pseudo-random helper without extra external crate
fn pseudo_rand(seed: u64) -> f32 {
    let s = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
    ((s >> 32) as u32 as f32) / (u32::MAX as f32)
}

#[tauri::command]
pub fn calculate_ninja_damage(
    attacker: NinjaCombatant,
    mut defender: NinjaCombatant,
    multiplier: f32,
    jutsu_element: Option<String>,
    rng_seed: Option<u64>,
) -> Result<NinjaDamageResult, String> {
    let seed = rng_seed.unwrap_or(123456789);
    let rand1 = pseudo_rand(seed);
    let rand2 = pseudo_rand(seed.wrapping_add(101));
    let rand3 = pseudo_rand(seed.wrapping_add(202));

    // 1. Dodge check
    let dodge_chance = (defender.dodge_rate / 100.0).clamp(0.02, 0.50);
    if rand1 < dodge_chance {
        return Ok(NinjaDamageResult {
            damage: 0.0,
            absorbed_by_shield: 0.0,
            is_crit: false,
            is_dodge: true,
            remaining_target_hp: defender.hp,
            remaining_target_shield: defender.shield,
        });
    }

    // 2. Attack and Defense status modifiers
    let mut effective_atk = attacker.attack;
    for se in &attacker.status_effects {
        if se.effect_type == "attack_buff" {
            effective_atk *= 1.0 + (se.value / 100.0);
        }
    }

    let mut effective_def = defender.defense;
    for se in &defender.status_effects {
        if se.effect_type == "defense_buff" {
            effective_def *= 1.0 + (se.value / 100.0);
        }
    }

    // 3. Elemental multiplier
    let el = jutsu_element.unwrap_or_else(|| attacker.element.clone());
    let elem_mult = get_elemental_multiplier(&el, &defender.element);

    // 4. Critical hit check
    let crit_chance = (attacker.crit_rate / 100.0).clamp(0.05, 0.60);
    let is_crit = rand2 < crit_chance;
    let crit_mult = if is_crit { 1.65 } else { 1.0 };

    // 5. Base damage formula with variance
    let base_dmg = (effective_atk * 1.7 - effective_def * 0.65).max(15.0);
    let variance = 0.92 + (rand3 * 0.16); // +/- 8%
    let calculated_dmg = (base_dmg * multiplier * elem_mult * crit_mult * variance).round().max(1.0);

    // 6. Shield mitigation
    let mut absorbed = 0.0;
    let mut final_dmg = calculated_dmg;

    if defender.shield > 0.0 {
        if defender.shield >= calculated_dmg {
            defender.shield -= calculated_dmg;
            absorbed = calculated_dmg;
            final_dmg = 0.0;
        } else {
            absorbed = defender.shield;
            final_dmg = calculated_dmg - defender.shield;
            defender.shield = 0.0;
        }
    }

    defender.hp = (defender.hp - final_dmg).max(0.0);

    Ok(NinjaDamageResult {
        damage: final_dmg,
        absorbed_by_shield: absorbed,
        is_crit,
        is_dodge: false,
        remaining_target_hp: defender.hp,
        remaining_target_shield: defender.shield,
    })
}

#[tauri::command]
pub fn resolve_ninja_turn_effects(
    mut fighter: NinjaCombatant,
) -> Result<NinjaTurnEffectsResult, String> {
    let mut is_stunned = false;
    let mut total_dot_damage = 0.0;
    let mut log_messages = Vec::new();
    let mut updated_status_effects = Vec::new();

    for se in fighter.status_effects {
        match se.effect_type.as_str() {
            "burn" | "bleed" | "poison" => {
                let dot_dmg = se.value;
                total_dot_damage += dot_dmg;
                fighter.hp = (fighter.hp - dot_dmg).max(0.0);
                log_messages.push(format!(
                    "{} suffered {:.0} {} damage!",
                    fighter.name, dot_dmg, se.effect_type
                ));
            }
            "stun" | "sleep" => {
                is_stunned = true;
                log_messages.push(format!(
                    "{} is immobilized by {}!",
                    fighter.name,
                    se.effect_type.to_uppercase()
                ));
            }
            _ => {}
        }

        let new_duration = se.duration - 1;
        if new_duration > 0 {
            updated_status_effects.push(NinjaStatusEffect {
                duration: new_duration,
                ..se
            });
        }
    }

    // Decrement cooldowns
    let mut updated_cooldowns = HashMap::new();
    for (jutsu_id, cd) in fighter.jutsu_cooldowns {
        if cd > 0 {
            updated_cooldowns.insert(jutsu_id, cd - 1);
        }
    }

    Ok(NinjaTurnEffectsResult {
        is_stunned,
        total_dot_damage,
        log_messages,
        updated_status_effects,
        updated_cooldowns,
        remaining_hp: fighter.hp,
    })
}

#[tauri::command]
pub fn decide_ninja_ai_turn(
    ai: NinjaCombatant,
    available_jutsus: Vec<NinjaJutsuDef>,
) -> Result<NinjaAIDecision, String> {
    // 1. If low on CP (< 20% max), charge CP
    if ai.cp < ai.max_cp * 0.20 {
        return Ok(NinjaAIDecision {
            action_type: "charge".to_string(),
            selected_jutsu_id: None,
        });
    }

    // 2. Find ready jutsus that AI can afford
    let mut ready_jutsus = Vec::new();
    for j in available_jutsus {
        let cd = *ai.jutsu_cooldowns.get(&j.id).unwrap_or(&0);
        if cd <= 0 && (j.cp_cost as f32) <= ai.cp {
            ready_jutsus.push(j);
        }
    }

    // Prioritize highest damage multiplier
    if let Some(best) = ready_jutsus.into_iter().max_by(|a, b| {
        a.damage_multiplier
            .partial_cmp(&b.damage_multiplier)
            .unwrap_or(std::cmp::Ordering::Equal)
    }) {
        return Ok(NinjaAIDecision {
            action_type: "jutsu".to_string(),
            selected_jutsu_id: Some(best.id),
        });
    }

    // Otherwise standard attack
    Ok(NinjaAIDecision {
        action_type: "attack".to_string(),
        selected_jutsu_id: None,
    })
}

#[tauri::command]
pub fn calculate_ninja_rewards(
    current_level: i32,
    current_xp: i32,
    current_max_xp: i32,
    base_reward_xp: i32,
    base_reward_ryo: i32,
    is_victory: bool,
) -> Result<NinjaRewardsResult, String> {
    let mult = if is_victory { 1.0 } else { 0.25 };
    let earned_xp = ((base_reward_xp as f32) * mult).round() as i32;
    let earned_ryo = ((base_reward_ryo as f32) * mult).round() as i32;

    let mut new_xp = current_xp + earned_xp;
    let mut new_level = current_level;
    let mut new_max_xp = current_max_xp;
    let mut leveled_up = false;

    while new_xp >= new_max_xp {
        new_xp -= new_max_xp;
        new_level += 1;
        new_max_xp = ((new_max_xp as f32) * 1.35).round() as i32;
        leveled_up = true;
    }

    Ok(NinjaRewardsResult {
        earned_xp,
        earned_ryo,
        new_level,
        new_xp,
        new_max_xp,
        leveled_up,
    })
}
