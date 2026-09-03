use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HordeEntity {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub vx: f32,
    pub vy: f32,
    pub radius: f32,
    pub health: f32,
    pub is_allied: bool,
    pub is_dead: bool,
    pub hit_flash: u32,
    pub hit_stun: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleaveResult {
    pub entities: Vec<HordeEntity>,
    pub hit_count: u32,
    pub kills: u32,
    pub total_damage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DynastyProfile {
    pub total_kills: u32,
    pub battles_won: u32,
    pub highest_combo: u32,
    pub completed_chapters: Vec<String>,
    pub unlocked_weapons: Vec<String>,
    pub last_played_hero: String,
}

fn get_profile_path(_app: &AppHandle) -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| format!("Failed to read home dir: {}", e))?;
    let dir = PathBuf::from(home).join(".cekcok-kotaku");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    Ok(dir.join("dynasty_legends_profile.json"))
}

#[tauri::command]
pub fn simulate_battlefield_horde(
    mut entities: Vec<HordeEntity>,
    world_size: f32,
) -> Result<Vec<HordeEntity>, String> {
    let len = entities.len();

    // 1. Mutual circle-circle separation (Horde Flocking Physics)
    for i in 0..len {
        if entities[i].is_dead {
            continue;
        }

        for j in (i + 1)..len {
            if entities[j].is_dead {
                continue;
            }

            let dx = entities[j].x - entities[i].x;
            let dy = entities[j].y - entities[i].y;
            let dist_sq = dx * dx + dy * dy;
            let min_dist = entities[i].radius + entities[j].radius;

            if dist_sq < min_dist * min_dist && dist_sq > 0.001 {
                let dist = dist_sq.sqrt();
                let overlap = (min_dist - dist) * 0.35;
                let nx = dx / dist;
                let ny = dy / dist;

                entities[i].x -= nx * overlap;
                entities[i].y -= ny * overlap;
                entities[j].x += nx * overlap;
                entities[j].y += ny * overlap;
            }
        }
    }

    // 2. Apply knockback velocity, friction deceleration, and boundary clamping
    let margin = 80.0;
    for e in &mut entities {
        if e.is_dead {
            e.vx *= 0.75;
            e.vy *= 0.75;
            e.x += e.vx;
            e.y += e.vy;
            continue;
        }

        e.x += e.vx;
        e.y += e.vy;
        e.vx *= 0.82;
        e.vy *= 0.82;

        if e.hit_flash > 0 {
            e.hit_flash -= 1;
        }
        if e.hit_stun > 0 {
            e.hit_stun -= 1;
        }

        // Clamp to battlefield boundaries
        e.x = e.x.clamp(margin, world_size - margin);
        e.y = e.y.clamp(margin, world_size - margin);
    }

    Ok(entities)
}

#[tauri::command]
pub fn resolve_musou_cleave(
    player_x: f32,
    player_y: f32,
    reach: f32,
    damage: f32,
    is_musou: bool,
    mut entities: Vec<HordeEntity>,
) -> Result<CleaveResult, String> {
    let mut hit_count = 0;
    let mut kills = 0;
    let mut total_damage = 0.0;

    for e in &mut entities {
        if e.is_allied || e.is_dead {
            continue;
        }

        let dx = e.x - player_x;
        let dy = e.y - player_y;
        let dist = (dx * dx + dy * dy).sqrt();

        if dist < reach + e.radius {
            e.health -= damage;
            hit_count += 1;
            total_damage += damage;

            // Directional knockback impulse
            let angle = dy.atan2(dx);
            let knockback = if is_musou { 16.0 } else { 8.0 };
            e.vx += angle.cos() * knockback;
            e.vy += angle.sin() * knockback;
            e.hit_flash = 6;
            e.hit_stun = 12;

            if e.health <= 0.0 {
                e.is_dead = true;
                e.vx += angle.cos() * 12.0;
                e.vy += angle.sin() * 12.0;
                kills += 1;
            }
        }
    }

    Ok(CleaveResult {
        entities,
        hit_count,
        kills,
        total_damage,
    })
}

#[tauri::command]
pub fn save_dynasty_profile(app: AppHandle, profile: DynastyProfile) -> Result<bool, String> {
    let path = get_profile_path(&app)?;
    let serialized = serde_json::to_string_pretty(&profile)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(&path, serialized)
        .map_err(|e| format!("Failed to write profile: {}", e))?;
    Ok(true)
}

#[tauri::command]
pub fn load_dynasty_profile(app: AppHandle) -> Result<DynastyProfile, String> {
    let path = get_profile_path(&app)?;
    if !path.exists() {
        return Ok(DynastyProfile::default());
    }
    let contents = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read profile: {}", e))?;
    let profile: DynastyProfile = serde_json::from_str(&contents)
        .map_err(|e| format!("Corrupt profile file: {}", e))?;
    Ok(profile)
}
