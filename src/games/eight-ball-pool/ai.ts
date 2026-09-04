import { Ball, PoolGameState, TableConfig, AIDifficulty } from './types';
import { BALL_RADIUS, dist } from './physics';
import { hasPlayerClearedGroup } from './engine';

export interface AIShotPlan {
  angle: number;
  power: number;
  targetBall: Ball | null;
  targetPocket: { x: number; y: number } | null;
}

// Check if a line segment between (x1, y1) and (x2, y2) intersects any ball
function isPathBlocked(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  balls: Ball[],
  ignoreIds: number[]
): boolean {
  const lineDist = dist(x1, y1, x2, y2);
  if (lineDist < 1) return false;

  const dirX = (x2 - x1) / lineDist;
  const dirY = (y2 - y1) / lineDist;

  for (const b of balls) {
    if (b.isPocketed || ignoreIds.includes(b.number)) continue;

    const ox = b.x - x1;
    const oy = b.y - y1;
    const proj = ox * dirX + oy * dirY;

    if (proj <= BALL_RADIUS || proj >= lineDist - BALL_RADIUS) continue;

    const perpSq = ox * ox + oy * oy - proj * proj;
    if (perpSq < (BALL_RADIUS * 2) * (BALL_RADIUS * 2)) {
      return true; // Path is blocked by ball b
    }
  }

  return false;
}

// Compute best shot for AI
export function computeAIShot(
  state: PoolGameState,
  table: TableConfig,
  difficulty: AIDifficulty
): AIShotPlan {
  const cueBall = state.balls.find((b) => b.number === 0);
  if (!cueBall || cueBall.isPocketed) {
    return { angle: 0, power: 0.5, targetBall: null, targetPocket: null };
  }

  const aiGroup = state.turn === 'player1' ? state.player1Group : state.player2Group;
  const hasCleared = hasPlayerClearedGroup(state.balls, aiGroup);

  // 1. Gather legal candidate balls
  const candidateBalls: Ball[] = [];

  for (const b of state.balls) {
    if (b.isPocketed || b.number === 0) continue;

    if (state.tableState === 'open') {
      if (b.number !== 8) candidateBalls.push(b);
    } else if (hasCleared) {
      if (b.number === 8) candidateBalls.push(b);
    } else if (aiGroup) {
      const isSolid = b.number >= 1 && b.number <= 7;
      if ((aiGroup === 'solids') === isSolid) {
        candidateBalls.push(b);
      }
    }
  }

  // Fallback if no legal candidate found (e.g. only 8-ball left)
  if (candidateBalls.length === 0) {
    const eight = state.balls.find((b) => b.number === 8 && !b.isPocketed);
    if (eight) candidateBalls.push(eight);
  }

  interface ShotCandidate {
    ball: Ball;
    pocket: { x: number; y: number };
    angle: number;
    power: number;
    score: number;
  }

  const validShots: ShotCandidate[] = [];

  for (const b of candidateBalls) {
    for (const pocket of table.pockets) {
      // Vector from ball to pocket
      const ballToPocketDist = dist(b.x, b.y, pocket.x, pocket.y);
      if (ballToPocketDist < 1) continue;

      const toPocketX = (pocket.x - b.x) / ballToPocketDist;
      const toPocketY = (pocket.y - b.y) / ballToPocketDist;

      // Check if path from object ball to pocket is clear
      if (isPathBlocked(b.x, b.y, pocket.x, pocket.y, state.balls, [b.number])) {
        continue;
      }

      // Ghost ball position (directly opposite to pocket direction)
      const ghostX = b.x - toPocketX * (BALL_RADIUS * 2);
      const ghostY = b.y - toPocketY * (BALL_RADIUS * 2);

      // Check if cue ball can reach the ghost ball
      if (isPathBlocked(cueBall.x, cueBall.y, ghostX, ghostY, state.balls, [0, b.number])) {
        continue;
      }

      // Vector from cue ball to ghost ball
      const cueToGhostDist = dist(cueBall.x, cueBall.y, ghostX, ghostY);
      const cueDirX = (ghostX - cueBall.x) / cueToGhostDist;
      const cueDirY = (ghostY - cueBall.y) / cueToGhostDist;

      // Cut angle (dot product between cue direction and ball-to-pocket direction)
      const dot = cueDirX * toPocketX + cueDirY * toPocketY;
      if (dot <= 0.15) {
        // Cut angle too extreme (> 80 degrees)
        continue;
      }

      // Calculate shot angle
      const aimAngle = Math.atan2(ghostY - cueBall.y, ghostX - cueBall.x);

      // Calculate required power based on total distance and cut angle
      const totalDist = cueToGhostDist + ballToPocketDist;
      const basePower = Math.min(1, Math.max(0.25, totalDist / 1100 + (1 - dot) * 0.25));

      // Score: prefer direct shots (high dot), short distance to pocket
      const score = dot * 100 - ballToPocketDist * 0.08 - cueToGhostDist * 0.04;

      validShots.push({
        ball: b,
        pocket,
        angle: aimAngle,
        power: basePower,
        score,
      });
    }
  }

  // If clean shot found, select the highest scored candidate
  if (validShots.length > 0) {
    validShots.sort((a, b) => b.score - a.score);
    const chosen = validShots[0];

    // Apply difficulty variation
    let angleJitter = 0;
    let powerJitter = 1;

    if (difficulty === 'easy') {
      angleJitter = (Math.random() - 0.5) * 0.08; // ~4.5 degree error
      powerJitter = 0.8 + Math.random() * 0.4;
    } else if (difficulty === 'medium') {
      angleJitter = (Math.random() - 0.5) * 0.03; // ~1.7 degree error
      powerJitter = 0.9 + Math.random() * 0.2;
    } else {
      // Hard / Pro: tiny variation
      angleJitter = (Math.random() - 0.5) * 0.008; // < 0.5 degree
      powerJitter = 0.98 + Math.random() * 0.04;
    }

    return {
      angle: chosen.angle + angleJitter,
      power: Math.min(1, Math.max(0.2, chosen.power * powerJitter)),
      targetBall: chosen.ball,
      targetPocket: chosen.pocket,
    };
  }

  // If no clean pocket shot available, do defensive safety / direct bump
  if (candidateBalls.length > 0) {
    const target = candidateBalls[0];
    const angle = Math.atan2(target.y - cueBall.y, target.x - cueBall.x);
    return {
      angle: angle + (Math.random() - 0.5) * 0.05,
      power: 0.35 + Math.random() * 0.25,
      targetBall: target,
      targetPocket: null,
    };
  }

  // Fallback random shot
  return {
    angle: Math.random() * Math.PI * 2,
    power: 0.4,
    targetBall: null,
    targetPocket: null,
  };
}
