export interface RustHordeEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  is_allied: boolean;
  is_dead: boolean;
  hit_flash: number;
  hit_stun: number;
}

export interface RustCleaveResult {
  entities: RustHordeEntity[];
  hit_count: number;
  kills: number;
  total_damage: number;
}

export interface DynastyProfile {
  total_kills: number;
  battles_won: number;
  highest_combo: number;
  completed_chapters: string[];
  unlocked_weapons: string[];
  last_played_hero: string;
}

export async function isTauriEnvironment(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function nativeSimulateHorde(
  entities: RustHordeEntity[],
  worldSize: number
): Promise<RustHordeEntity[] | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustHordeEntity[]>('simulate_battlefield_horde', {
      entities,
      worldSize,
    });
  } catch {
    return null;
  }
}

export async function nativeResolveCleave(
  playerX: number,
  playerY: number,
  reach: number,
  damage: number,
  isMusou: boolean,
  entities: RustHordeEntity[]
): Promise<RustCleaveResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RustCleaveResult>('resolve_musou_cleave', {
      playerX,
      playerY,
      reach,
      damage,
      isMusou,
      entities,
    });
  } catch {
    return null;
  }
}

export async function nativeSaveProfile(profile: DynastyProfile): Promise<boolean> {
  if (!(await isTauriEnvironment())) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<boolean>('save_dynasty_profile', { profile });
  } catch {
    return false;
  }
}

export async function nativeLoadProfile(): Promise<DynastyProfile | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<DynastyProfile>('load_dynasty_profile');
  } catch {
    return null;
  }
}
