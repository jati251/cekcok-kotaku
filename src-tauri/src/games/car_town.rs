use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CarPerformanceParams {
    pub base_hp: f32,
    pub base_weight_kg: f32,
    pub base_top_speed_mph: f32,
    pub engine_stage: i32,
    pub turbo_stage: i32,
    pub nitro_stage: i32,
    pub weight_reduction_stage: i32,
    pub gearbox_stage: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CarPowerSpecs {
    pub total_hp: f32,
    pub effective_weight_kg: f32,
    pub hp_to_weight_ratio: f32,
    pub max_top_speed_mph: f32,
    pub est_quarter_mile_sec: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DragRaceTickInput {
    pub delta_seconds: f32,
    pub player_speed_mph: f32,
    pub player_rpm: f32,
    pub player_distance_m: f32,
    pub player_time_seconds: f32,
    pub player_nitro_active: bool,
    pub player_nitro_charge: f32,
    pub player_params: CarPerformanceParams,
    pub opponent_hp: f32,
    pub opponent_weight_kg: f32,
    pub opponent_speed_mph: f32,
    pub opponent_distance_m: f32,
    pub opponent_time_seconds: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DragRaceTickOutput {
    pub player_speed_mph: f32,
    pub player_rpm: f32,
    pub player_distance_m: f32,
    pub player_time_seconds: f32,
    pub player_nitro_active: bool,
    pub player_nitro_charge: f32,
    pub opponent_speed_mph: f32,
    pub opponent_distance_m: f32,
    pub opponent_time_seconds: f32,
    pub is_finished: bool,
    pub player_won: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShiftEvaluationResult {
    pub new_gear: i32,
    pub new_rpm: f32,
    pub speed_boost_mph: f32,
    pub shift_rating: String, // "PERFECT", "GOOD", "EARLY", "OVERREV"
}

#[tauri::command]
pub fn calculate_car_power_specs(params: CarPerformanceParams) -> Result<CarPowerSpecs, String> {
    let mut hp = params.base_hp;
    hp += (params.engine_stage as f32) * 45.0;
    hp += (params.turbo_stage as f32) * 60.0;
    hp += (params.nitro_stage as f32) * 35.0;

    let weight = (params.base_weight_kg - (params.weight_reduction_stage as f32) * 80.0).max(800.0);
    let ratio = hp / weight;
    let top_speed = params.base_top_speed_mph + (params.gearbox_stage as f32) * 12.0 + (hp * 0.08);

    // Rough quarter mile estimation formula: t = 5.825 * (weight_lbs / hp)^(1/3)
    let weight_lbs = weight * 2.20462;
    let est_et = 5.825 * (weight_lbs / hp.max(50.0)).cbrt();

    Ok(CarPowerSpecs {
        total_hp: hp,
        effective_weight_kg: weight,
        hp_to_weight_ratio: ratio,
        max_top_speed_mph: top_speed,
        est_quarter_mile_sec: est_et,
    })
}

#[tauri::command]
pub fn evaluate_gear_shift(
    current_gear: i32,
    current_rpm: f32,
    gearbox_stage: i32,
) -> Result<ShiftEvaluationResult, String> {
    if current_gear >= 5 {
        return Ok(ShiftEvaluationResult {
            new_gear: current_gear,
            new_rpm: current_rpm,
            speed_boost_mph: 0.0,
            shift_rating: "MAX_GEAR".to_string(),
        });
    }

    let next_gear = current_gear + 1;
    let gearbox_benefit = (gearbox_stage as f32) * 1.5;

    let (rating, speed_boost, rpm_drop) = if current_rpm >= 6600.0 && current_rpm <= 7400.0 {
        // Perfect shift
        ("PERFECT", 14.0 + gearbox_benefit, 2400.0)
    } else if current_rpm >= 5800.0 && current_rpm < 6600.0 {
        // Good shift
        ("GOOD", 8.0 + gearbox_benefit * 0.6, 2600.0)
    } else if current_rpm > 7400.0 {
        // Over-rev / redline stumble
        ("OVERREV", 2.0, 3000.0)
    } else {
        // Early shift / bog down
        ("EARLY", 1.0, 3400.0)
    };

    let new_rpm = (current_rpm - rpm_drop).max(3200.0);

    Ok(ShiftEvaluationResult {
        new_gear: next_gear,
        new_rpm,
        speed_boost_mph: speed_boost,
        shift_rating: rating.to_string(),
    })
}

#[tauri::command]
pub fn simulate_drag_race_tick(input: DragRaceTickInput) -> Result<DragRaceTickOutput, String> {
    let dt = input.delta_seconds;

    // 1. Calculate player power and acceleration
    let mut total_hp = input.player_params.base_hp;
    total_hp += (input.player_params.engine_stage as f32) * 45.0;
    total_hp += (input.player_params.turbo_stage as f32) * 60.0;

    let mut nitro_active = input.player_nitro_active;
    let mut nitro_charge = input.player_nitro_charge;

    if nitro_active {
        total_hp += 180.0 + (input.player_params.nitro_stage as f32) * 70.0;
        nitro_charge -= dt * 35.0;
        if nitro_charge <= 0.0 {
            nitro_charge = 0.0;
            nitro_active = false;
        }
    }

    let weight_kg = (input.player_params.base_weight_kg
        - (input.player_params.weight_reduction_stage as f32) * 80.0)
        .max(800.0);
    let hp_to_weight = total_hp / weight_kg;

    let accel_rate = hp_to_weight * 180.0 * dt;
    let max_speed = input.player_params.base_top_speed_mph + 60.0;
    let player_speed = (input.player_speed_mph + accel_rate).min(max_speed);

    // RPM acceleration
    let mut player_rpm = input.player_rpm + (total_hp / 40.0) * dt * 120.0;
    if player_rpm > 8200.0 {
        player_rpm = 8200.0;
    }

    // Distance in meters (1 mph = 0.44704 m/s)
    let player_mps = (player_speed * 1609.34) / 3600.0;
    let player_dist = input.player_distance_m + player_mps * dt;
    let player_time = input.player_time_seconds + dt;

    // 2. Opponent physics
    let opp_hp_weight = input.opponent_hp / input.opponent_weight_kg.max(800.0);
    let opp_accel = opp_hp_weight * 175.0 * dt;
    let opp_speed = input.opponent_speed_mph + opp_accel;
    let opp_mps = (opp_speed * 1609.34) / 3600.0;
    let opp_dist = input.opponent_distance_m + opp_mps * dt;
    let opp_time = input.opponent_time_seconds + dt;

    // 3. Quarter-mile check (402.3 meters)
    let finish_line = 402.0;
    let is_finished = player_dist >= finish_line || opp_dist >= finish_line;
    let player_won = player_dist >= opp_dist;

    Ok(DragRaceTickOutput {
        player_speed_mph: player_speed,
        player_rpm,
        player_distance_m: player_dist,
        player_time_seconds: player_time,
        player_nitro_active: nitro_active,
        player_nitro_charge: nitro_charge,
        opponent_speed_mph: opp_speed,
        opponent_distance_m: opp_dist,
        opponent_time_seconds: opp_time,
        is_finished,
        player_won,
    })
}
