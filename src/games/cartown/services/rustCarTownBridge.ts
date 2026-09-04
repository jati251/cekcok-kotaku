export interface RustCarPerformanceParams {
  base_hp: number;
  base_weight_kg: number;
  base_top_speed_mph: number;
  engine_stage: number;
  turbo_stage: number;
  nitro_stage: number;
  weight_reduction_stage: number;
  gearbox_stage: number;
}

export interface RustCarPowerSpecs {
  total_hp: number;
  effective_weight_kg: number;
  hp_to_weight_ratio: number;
  max_top_speed_mph: number;
  est_quarter_mile_sec: number;
}

export interface RustDragRaceTickInput {
  delta_seconds: number;
  player_speed_mph: number;
  player_rpm: number;
  player_distance_m: number;
  player_time_seconds: number;
  player_nitro_active: boolean;
  player_nitro_charge: number;
  player_params: RustCarPerformanceParams;
  opponent_hp: number;
  opponent_weight_kg: number;
  opponent_speed_mph: number;
  opponent_distance_m: number;
  opponent_time_seconds: number;
}

export interface RustDragRaceTickOutput {
  player_speed_mph: number;
  player_rpm: number;
  player_distance_m: number;
  player_time_seconds: number;
  player_nitro_active: boolean;
  player_nitro_charge: number;
  opponent_speed_mph: number;
  opponent_distance_m: number;
  opponent_time_seconds: number;
  is_finished: boolean;
  player_won: boolean;
}

export interface RustShiftEvaluationResult {
  new_gear: number;
  new_rpm: number;
  speed_boost_mph: number;
  shift_rating: string;
}

export async function isTauriEnvironment(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function nativeCalculateCarPowerSpecs(
  params: RustCarPerformanceParams
): Promise<RustCarPowerSpecs | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustCarPowerSpecs>('calculate_car_power_specs', { params });
  } catch {
    return null;
  }
}

export async function nativeEvaluateGearShift(
  currentGear: number,
  currentRpm: number,
  gearboxStage: number
): Promise<RustShiftEvaluationResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustShiftEvaluationResult>('evaluate_gear_shift', {
      currentGear,
      currentRpm,
      gearboxStage,
    });
  } catch {
    return null;
  }
}

export async function nativeSimulateDragRaceTick(
  input: RustDragRaceTickInput
): Promise<RustDragRaceTickOutput | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustDragRaceTickOutput>('simulate_drag_race_tick', { input });
  } catch {
    return null;
  }
}
