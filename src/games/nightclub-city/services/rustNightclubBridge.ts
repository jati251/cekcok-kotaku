export interface RustClubSimulationInput {
  delta_seconds: number;
  club_popularity: number;
  max_capacity: number;
  current_guests: number;
  current_vibe: number;
  dj_hype_level: number;
  drink_price_multiplier: number;
  bar_level: number;
  vip_guest_count: number;
}

export interface RustClubSimulationOutput {
  new_guest_count: number;
  new_vibe: number;
  generated_cash: number;
  generated_xp: number;
  drink_orders_served: number;
  new_vip_arrived: boolean;
}

export interface RustDJTrackHypeResult {
  hype_multiplier: number;
  bonus_cash: number;
  bonus_popularity: number;
  crowd_cheer: boolean;
}

export async function isTauriEnvironment(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function nativeSimulateClubTick(
  input: RustClubSimulationInput
): Promise<RustClubSimulationOutput | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustClubSimulationOutput>('simulate_club_tick', { input });
  } catch {
    return null;
  }
}

export async function nativeCalculateDJTrackHype(
  trackBpm: number,
  djLevel: number,
  vibe: number
): Promise<RustDJTrackHypeResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustDJTrackHypeResult>('calculate_dj_track_hype', {
      trackBpm,
      djLevel,
      vibe,
    });
  } catch {
    return null;
  }
}
