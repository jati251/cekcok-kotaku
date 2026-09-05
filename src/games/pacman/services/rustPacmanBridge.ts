import {
  Direction,
  GhostEntity,
  PacmanEntity,
  PacmanGameState,
} from '../types';

export interface RustPoint {
  x: number;
  y: number;
}

export interface RustPacman {
  x: number;
  y: number;
  dir: Direction;
  next_dir: Direction;
  speed: number;
  mouth_angle: number;
  mouth_dir: number;
  is_dying: boolean;
  death_progress: number;
}

export interface RustGhost {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  speed: number;
  mode: string;
  frightened_timer: number;
  in_house: boolean;
  target: RustPoint;
  scatter_target: RustPoint;
  last_tile_x: number;
  last_tile_y: number;
}

export interface RustPacmanGameState {
  score: number;
  high_score: number;
  lives: number;
  level: number;
  dots_remaining: number;
  total_dots: number;
  status: string;
  ghost_combo: number;
  global_mode: string;
  mode_timer: number;
}

export interface RustPacmanTickResult {
  pacman: RustPacman;
  ghosts: RustGhost[];
  maze: number[][];
  game_state?: RustPacmanGameState;
  gameState?: RustPacmanGameState;
  ate_dot?: boolean;
  ateDot?: boolean;
  ate_energizer?: boolean;
  ateEnergizer?: boolean;
  pacman_died?: boolean;
  pacmanDied?: boolean;
  eaten_ghost_id?: string | null;
  eatenGhostId?: string | null;
  ghost_points?: number;
  ghostPoints?: number;
}

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function pacmanToRust(p: PacmanEntity): RustPacman {
  return {
    x: p.x,
    y: p.y,
    dir: p.dir,
    next_dir: p.nextDir,
    speed: p.speed,
    mouth_angle: p.mouthAngle,
    mouth_dir: p.mouthDir,
    is_dying: p.isDying,
    death_progress: p.deathProgress,
  };
}

export function ghostToRust(g: GhostEntity): RustGhost {
  return {
    id: g.id,
    name: g.name,
    color: g.color,
    x: g.x,
    y: g.y,
    dir: g.dir,
    speed: g.speed,
    mode: g.mode,
    frightened_timer: g.frightenedTimer,
    in_house: g.inHouse,
    target: { x: g.target.x, y: g.target.y },
    scatter_target: { x: g.scatterTarget.x, y: g.scatterTarget.y },
    last_tile_x: g.lastTileX,
    last_tile_y: g.lastTileY,
  };
}

export async function nativeSimulatePacmanTick(
  pacman: PacmanEntity,
  ghosts: GhostEntity[],
  maze: number[][],
  gameState: PacmanGameState,
  requestedDir?: Direction
): Promise<RustPacmanTickResult | null> {
  if (!isTauriEnvironment()) return null;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const rustPacman = pacmanToRust(pacman);
    const rustGhosts = ghosts.map(ghostToRust);
    const rustGameState: RustPacmanGameState = {
      score: gameState.score,
      high_score: gameState.highScore,
      lives: gameState.lives,
      level: gameState.level,
      dots_remaining: gameState.dotsRemaining,
      total_dots: gameState.totalDots,
      status: gameState.status,
      ghost_combo: gameState.ghostCombo,
      global_mode: gameState.globalMode,
      mode_timer: gameState.modeTimer,
    };

    return await invoke<RustPacmanTickResult>('simulate_pacman_tick', {
      pacman: rustPacman,
      ghosts: rustGhosts,
      maze,
      gameState: rustGameState,
      requestedDir: requestedDir ?? null,
    });
  } catch (err) {
    console.warn('Rust native pacman simulation fallback to TS:', err);
    return null;
  }
}
