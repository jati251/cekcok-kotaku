pub mod commands;
pub mod games;
pub mod state;

use commands::{
    calculate_offline_progress, load_game_state, reset_game_save, save_game_state,
};
use games::billiards::{predict_cue_trajectory, simulate_billiards_step};
use games::car_town::{
    calculate_car_power_specs, evaluate_gear_shift, simulate_drag_race_tick,
};
use games::dynasty::{
    load_dynasty_profile, resolve_musou_cleave, save_dynasty_profile, simulate_battlefield_horde,
};
use games::nightclub::{calculate_dj_track_hype, simulate_club_tick};
use games::ninja_saga::{
    calculate_ninja_damage, calculate_ninja_rewards, decide_ninja_ai_turn,
    resolve_ninja_turn_effects,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // Base Core State
            save_game_state,
            load_game_state,
            reset_game_save,
            calculate_offline_progress,
            // Dynasty Legends Engine
            simulate_battlefield_horde,
            resolve_musou_cleave,
            save_dynasty_profile,
            load_dynasty_profile,
            // Ninja Saga Engine
            calculate_ninja_damage,
            resolve_ninja_turn_effects,
            decide_ninja_ai_turn,
            calculate_ninja_rewards,
            // 8 Ball Pool Billiards Engine
            simulate_billiards_step,
            predict_cue_trajectory,
            // Car Town Engine
            calculate_car_power_specs,
            evaluate_gear_shift,
            simulate_drag_race_tick,
            // Nightclub City Engine
            simulate_club_tick,
            calculate_dj_track_hype,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
