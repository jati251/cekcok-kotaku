use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClubSimulationInput {
    pub delta_seconds: f32,
    pub club_popularity: f32, // 0 to 100
    pub max_capacity: i32,
    pub current_guests: i32,
    pub current_vibe: f32, // 0 to 100
    pub dj_hype_level: i32,
    pub drink_price_multiplier: f32,
    pub bar_level: i32,
    pub vip_guest_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClubSimulationOutput {
    pub new_guest_count: i32,
    pub new_vibe: f32,
    pub generated_cash: f32,
    pub generated_xp: i32,
    pub drink_orders_served: i32,
    pub new_vip_arrived: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DJTrackHypeResult {
    pub hype_multiplier: f32,
    pub bonus_cash: f32,
    pub bonus_popularity: f32,
    pub crowd_cheer: bool,
}

#[tauri::command]
pub fn simulate_club_tick(input: ClubSimulationInput) -> Result<ClubSimulationOutput, String> {
    let dt = input.delta_seconds.clamp(0.1, 60.0);

    // 1. Desired crowd target based on club popularity
    let target_guests = ((input.max_capacity as f32) * (input.club_popularity / 100.0).clamp(0.15, 1.0)) as i32;
    let mut guests = input.current_guests;

    if guests < target_guests {
        // Influx of clubbers
        let influx = ((target_guests - guests) as f32 * 0.15 * dt).ceil() as i32;
        guests = (guests + influx.max(1)).min(input.max_capacity);
    } else if guests > target_guests {
        // Natural exit
        let outflow = ((guests - target_guests) as f32 * 0.10 * dt).ceil() as i32;
        guests = (guests - outflow.max(1)).max(0);
    }

    // 2. Vibe calculation (DJ hype + capacity ratio + VIP presence)
    let occupancy_ratio = if input.max_capacity > 0 {
        (guests as f32) / (input.max_capacity as f32)
    } else {
        0.5
    };

    let base_vibe = 40.0 + occupancy_ratio * 40.0 + (input.dj_hype_level as f32) * 4.0;
    let vip_vibe_bonus = (input.vip_guest_count as f32) * 5.0;
    let target_vibe = (base_vibe + vip_vibe_bonus).clamp(10.0, 100.0);
    let new_vibe = input.current_vibe + (target_vibe - input.current_vibe) * 0.10 * dt;

    // 3. Economy: Drink sales per minute
    // Higher vibe and higher bar level = more frequent drink rounds
    let drink_rate_per_sec = (guests as f32) * 0.08 * (new_vibe / 100.0) * (1.0 + (input.bar_level as f32) * 0.20);
    let drinks_served = (drink_rate_per_sec * dt).round() as i32;

    let base_drink_price = 15.0;
    let drink_revenue = (drinks_served as f32) * base_drink_price * input.drink_price_multiplier;
    let vip_tips = (input.vip_guest_count as f32) * 25.0 * dt * 0.05;
    let generated_cash = drink_revenue + vip_tips;

    let generated_xp = ((drinks_served as f32 * 1.5) + (new_vibe * 0.05 * dt)).round() as i32;

    // 4. VIP arrival chance (if high vibe > 80 and not maxed)
    let new_vip_arrived = new_vibe > 80.0 && guests > (input.max_capacity / 2) && dt > 1.0;

    Ok(ClubSimulationOutput {
        new_guest_count: guests,
        new_vibe: new_vibe.clamp(0.0, 100.0),
        generated_cash,
        generated_xp,
        drink_orders_served: drinks_served,
        new_vip_arrived,
    })
}

#[tauri::command]
pub fn calculate_dj_track_hype(
    track_bpm: i32,
    dj_level: i32,
    vibe: f32,
) -> Result<DJTrackHypeResult, String> {
    // Optimal club track range: 120 - 132 BPM
    let bpm_score = if track_bpm >= 120 && track_bpm <= 132 {
        1.35
    } else if track_bpm >= 115 && track_bpm <= 140 {
        1.15
    } else {
        0.90
    };

    let dj_bonus = 1.0 + (dj_level as f32) * 0.10;
    let vibe_factor = (vibe / 100.0).clamp(0.5, 1.5);

    let total_multiplier = (bpm_score * dj_bonus * vibe_factor).clamp(0.8, 3.5);
    let bonus_cash = total_multiplier * 50.0;
    let bonus_pop = total_multiplier * 2.5;
    let crowd_cheer = total_multiplier >= 1.5;

    Ok(DJTrackHypeResult {
        hype_multiplier: total_multiplier,
        bonus_cash,
        bonus_popularity: bonus_pop,
        crowd_cheer,
    })
}
