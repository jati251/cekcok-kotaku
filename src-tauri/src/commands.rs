use crate::state::{GameState, OfflineProgressReport};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::AppHandle;

fn get_save_file_path(_app: &AppHandle) -> Result<PathBuf, String> {
    // Save to home directory or standard app data dir
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| format!("Failed to read home dir: {}", e))?;
    let dir = PathBuf::from(home).join(".cekcok-kotaku");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create save dir: {}", e))?;
    }
    Ok(dir.join("save_empires_and_allies.json"))
}

#[tauri::command]
pub fn save_game_state(app: AppHandle, mut state: GameState) -> Result<String, String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    state.last_saved_at = now;

    let path = get_save_file_path(&app)?;
    let serialized = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Serialization error: {}", e))?;

    fs::write(&path, serialized)
        .map_err(|e| format!("Failed to write save file: {}", e))?;

    Ok("Game state successfully saved".to_string())
}

#[tauri::command]
pub fn load_game_state(app: AppHandle) -> Result<Option<GameState>, String> {
    let path = get_save_file_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }

    let contents = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read save file: {}", e))?;

    let state: GameState = serde_json::from_str(&contents)
        .map_err(|e| format!("Corrupt save file: {}", e))?;

    Ok(Some(state))
}

#[tauri::command]
pub fn reset_game_save(app: AppHandle) -> Result<bool, String> {
    let path = get_save_file_path(&app)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to remove save file: {}", e))?;
    }
    Ok(true)
}

#[tauri::command]
pub fn calculate_offline_progress(
    last_saved_at: u64,
    current_energy: u32,
    max_energy: u32,
) -> Result<OfflineProgressReport, String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    if last_saved_at == 0 || now <= last_saved_at {
        return Ok(OfflineProgressReport {
            elapsed_seconds: 0,
            energy_restored: 0,
            coins_generated: 0,
            wood_generated: 0,
            oil_generated: 0,
        });
    }

    let elapsed = now - last_saved_at;
    
    // Classic social game rule: 1 energy restored every 300 seconds (5 minutes)
    let energy_ticks = (elapsed / 300) as u32;
    let missing_energy = max_energy.saturating_sub(current_energy);
    let energy_restored = energy_ticks.min(missing_energy);

    // Minor passive resource yields from active islanders (capped at 12 hours)
    let capped_elapsed = elapsed.min(43200);
    let hours = (capped_elapsed / 3600) as u32;
    let coins_generated = hours * 120;
    let wood_generated = hours * 60;
    let oil_generated = hours * 40;

    Ok(OfflineProgressReport {
        elapsed_seconds: elapsed,
        energy_restored,
        coins_generated,
        wood_generated,
        oil_generated,
    })
}
