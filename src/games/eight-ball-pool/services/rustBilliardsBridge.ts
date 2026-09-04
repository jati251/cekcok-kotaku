import { Ball, AimTrajectory } from '../types';

export interface RustBilliardBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  is_pocketed: boolean;
  pocket_id: number | null;
}

export interface RustBilliardsSimResult {
  balls: RustBilliardBall[];
  newly_pocketed: number[];
  first_collided_ball_id: number | null;
  any_moving: boolean;
}

export interface RustTrajectoryPoint {
  x: number;
  y: number;
}

export interface RustCueTrajectoryResult {
  aim_line_start: RustTrajectoryPoint;
  aim_line_end: RustTrajectoryPoint;
  ghost_ball: RustTrajectoryPoint | null;
  target_ball_id: number | null;
  target_line_end: RustTrajectoryPoint | null;
  cue_deflection_end: RustTrajectoryPoint | null;
  cushion_bounce_end: RustTrajectoryPoint | null;
}

export async function isTauriEnvironment(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function ballToRustBall(b: Ball): RustBilliardBall {
  return {
    id: b.id,
    x: b.x,
    y: b.y,
    vx: b.vx,
    vy: b.vy,
    is_pocketed: b.isPocketed,
    pocket_id: null,
  };
}

export async function nativeSimulateBilliardsStep(
  balls: Ball[],
  substeps: number = 4
): Promise<RustBilliardsSimResult | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const rustBalls = balls.map(ballToRustBall);
    return await invoke<RustBilliardsSimResult>('simulate_billiards_step', {
      balls: rustBalls,
      substeps,
    });
  } catch {
    return null;
  }
}

export async function nativePredictCueTrajectory(
  cueX: number,
  cueY: number,
  angle: number,
  balls: Ball[]
): Promise<AimTrajectory | null> {
  if (!(await isTauriEnvironment())) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const rustBalls = balls.map(ballToRustBall);
    const result = await invoke<RustCueTrajectoryResult>('predict_cue_trajectory', {
      cueX,
      cueY,
      angle,
      balls: rustBalls,
    });

    if (!result) return null;

    const ghost = result.ghost_ball;
    const targetDir =
      result.target_line_end && ghost
        ? {
            x: result.target_line_end.x - ghost.x,
            y: result.target_line_end.y - ghost.y,
          }
        : null;

    const cueReflectionDir =
      result.cue_deflection_end && ghost
        ? {
            x: result.cue_deflection_end.x - ghost.x,
            y: result.cue_deflection_end.y - ghost.y,
          }
        : null;

    return {
      cueStart: { x: result.aim_line_start.x, y: result.aim_line_start.y },
      cueEnd: { x: result.aim_line_end.x, y: result.aim_line_end.y },
      ghostBall: ghost ? { x: ghost.x, y: ghost.y } : null,
      targetBall:
        result.target_ball_id !== null
          ? balls.find((b) => b.id === result.target_ball_id) ?? null
          : null,
      targetDir,
      cueReflectionDir,
    };
  } catch {
    return null;
  }
}
