pub mod commands;
pub mod state;

use commands::{
    calculate_offline_progress, load_game_state, reset_game_save, save_game_state,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_game_state,
            load_game_state,
            reset_game_save,
            calculate_offline_progress,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
