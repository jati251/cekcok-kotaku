use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resources {
    pub coins: u32,
    pub wood: u32,
    pub oil: u32,
    pub energy: u32,
    pub max_energy: u32,
    pub honor: u32,
    pub xp: u32,
    pub level: u32,
}

impl Default for Resources {
    fn default() -> Self {
        Self {
            coins: 2500,
            wood: 800,
            oil: 400,
            energy: 30,
            max_energy: 30,
            honor: 50,
            xp: 0,
            level: 1,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildingInstance {
    pub id: String,
    pub building_type: String,
    pub grid_x: i32,
    pub grid_y: i32,
    pub level: u32,
    pub constructed_at: u64,
    pub is_completed: bool,
    pub last_harvest_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestProgress {
    pub quest_id: String,
    pub current_count: u32,
    pub target_count: u32,
    pub is_completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerProfile {
    pub commander_name: String,
    pub rank_title: String,
    pub avatar_id: String,
}

impl Default for PlayerProfile {
    fn default() -> Self {
        Self {
            commander_name: "Commander Jati".to_string(),
            rank_title: "Brigadier General".to_string(),
            avatar_id: "commander_1".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    pub sfx_volume: f32,
    pub music_volume: f32,
    pub show_grid: bool,
    pub zoom_level: f32,
}

impl Default for GameSettings {
    fn default() -> Self {
        Self {
            sfx_volume: 0.8,
            music_volume: 0.6,
            show_grid: true,
            zoom_level: 1.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub player: PlayerProfile,
    pub resources: Resources,
    pub buildings: Vec<BuildingInstance>,
    pub quests: Vec<QuestProgress>,
    pub settings: GameSettings,
    pub last_saved_at: u64,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineProgressReport {
    pub elapsed_seconds: u64,
    pub energy_restored: u32,
    pub coins_generated: u32,
    pub wood_generated: u32,
    pub oil_generated: u32,
}
