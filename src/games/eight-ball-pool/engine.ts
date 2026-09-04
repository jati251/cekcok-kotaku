import {
  Ball,
  BallGroup,
  PoolGameState,
  ShotOutcome,
  TableConfig,
  GameMode,
  AIDifficulty,
  PlayerId,
} from './types';
import { TABLE, BALL_RADIUS } from './physics';

// Ball color constants
export const BALL_COLORS: Record<number, { base: string; name: string }> = {
  0: { base: '#ffffff', name: 'Cue' },
  1: { base: '#fbbf24', name: 'Yellow (Solid)' },
  2: { base: '#2563eb', name: 'Blue (Solid)' },
  3: { base: '#dc2626', name: 'Red (Solid)' },
  4: { base: '#7c3aed', name: 'Purple (Solid)' },
  5: { base: '#ea580c', name: 'Orange (Solid)' },
  6: { base: '#16a34a', name: 'Green (Solid)' },
  7: { base: '#7f1d1d', name: 'Maroon (Solid)' },
  8: { base: '#111827', name: 'Black (8-Ball)' },
  9: { base: '#fbbf24', name: 'Yellow (Stripe)' },
  10: { base: '#2563eb', name: 'Blue (Stripe)' },
  11: { base: '#dc2626', name: 'Red (Stripe)' },
  12: { base: '#7c3aed', name: 'Purple (Stripe)' },
  13: { base: '#ea580c', name: 'Orange (Stripe)' },
  14: { base: '#16a34a', name: 'Green (Stripe)' },
  15: { base: '#7f1d1d', name: 'Maroon (Stripe)' },
};

// Generate standard 15-ball triangle rack at the foot spot
export function createRack(table: TableConfig): Ball[] {
  const balls: Ball[] = [];

  // Cue Ball placed in the kitchen (behind head string)
  balls.push({
    id: 0,
    number: 0,
    type: 'cue',
    x: table.headStringX,
    y: table.height / 2,
    vx: 0,
    vy: 0,
    spinX: 0,
    spinY: 0,
    isPocketed: false,
    pocketAnimProgress: 0,
    scale: 1,
    rotation: 0,
    color: BALL_COLORS[0].base,
  });

  // Standard 8-ball triangle rack placement
  // Row 1 (1 ball): Apex ball
  // Row 2 (2 balls)
  // Row 3 (3 balls): 8-ball in center!
  // Row 4 (4 balls)
  // Row 5 (5 balls): Bottom corners must be one solid and one stripe
  const r = BALL_RADIUS;
  const startX = table.footSpotX;
  const startY = table.height / 2;

  // Rack layout ball numbers: 1 apex, 8 center, 1 solid bottom left, 1 stripe bottom right
  const rackPattern = [
    [1],
    [9, 2],
    [3, 8, 10],
    [11, 4, 12, 5],
    [7, 13, 6, 14, 15],
  ];

  const dx = Math.sqrt(3) * r + 0.3; // Distance between row apexes
  const dy = 2 * r + 0.3; // Vertical spacing

  rackPattern.forEach((row, rowIndex) => {
    const rowX = startX + rowIndex * dx;
    const rowStartY = startY - ((row.length - 1) * dy) / 2;

    row.forEach((num, colIndex) => {
      const rowY = rowStartY + colIndex * dy;
      let type: 'solid' | 'stripe' | 'eight' = 'solid';
      if (num === 8) type = 'eight';
      else if (num > 8) type = 'stripe';

      balls.push({
        id: num,
        number: num,
        type,
        x: rowX,
        y: rowY,
        vx: 0,
        vy: 0,
        spinX: 0,
        spinY: 0,
        isPocketed: false,
        pocketAnimProgress: 0,
        scale: 1,
        rotation: 0,
        color: BALL_COLORS[num].base,
      });
    });
  });

  return balls;
}

// Initial Game State Factory
export function createInitialPoolState(
  mode: GameMode = 'ai',
  aiDifficulty: AIDifficulty = 'medium',
  table: TableConfig = TABLE
): PoolGameState {
  return {
    mode,
    aiDifficulty,
    turn: 'player1',
    player1Group: null,
    player2Group: null,
    tableState: 'open',
    phase: 'aiming',
    foul: null,
    isBallInHand: false,
    isBreakShot: true,
    winner: null,
    winReason: null,
    balls: createRack(table),
    cueStick: {
      angle: 0,
      power: 0.35,
      isPulling: false,
      pullDistance: 0,
      spin: { x: 0, y: 0 },
    },
    scoreP1: 0,
    scoreP2: 0,
    feltTheme: 'emerald',
    turnCountdown: 30,
    isAIThinking: false,
  };
}

// Check if player has cleared all of their assigned group balls
export function hasPlayerClearedGroup(balls: Ball[], group: BallGroup | null): boolean {
  if (!group) return false;
  const isSolid = group === 'solids';

  for (const b of balls) {
    if (b.number === 0 || b.number === 8) continue;
    const isBallSolid = b.number >= 1 && b.number <= 7;
    if (isSolid === isBallSolid && !b.isPocketed) {
      return false;
    }
  }
  return true;
}

// Evaluate shot according to official 8-Ball pool rules
export function evaluateShot(
  state: PoolGameState,
  outcome: ShotOutcome,
  table: TableConfig
): void {
  const currentTurn = state.turn;
  const opponent: PlayerId = currentTurn === 'player1' ? 'player2' : 'player1';
  const currentGroup = currentTurn === 'player1' ? state.player1Group : state.player2Group;

  let foulOccurred = false;
  let foulReason: string | null = null;
  let switchTurn = true;

  // 1. Check Cue Ball Pocketed (Scratch)
  if (outcome.cueBallPocketed) {
    foulOccurred = true;
    foulReason = 'Scratch! Cue ball was pocketed.';
  }

  // 2. Check 8-Ball Pocketed
  const eightBall = state.balls.find((b) => b.number === 8);
  const eightPocketed = outcome.ballsPocketed.includes(8) || eightBall?.isPocketed;

  if (eightPocketed) {
    if (state.isBreakShot) {
      // 8-ball on break: spot back to table foot spot
      if (eightBall) {
        eightBall.isPocketed = false;
        eightBall.scale = 1;
        eightBall.pocketAnimProgress = 0;
        eightBall.x = table.footSpotX;
        eightBall.y = table.height / 2;
        eightBall.vx = 0;
        eightBall.vy = 0;
      }
    } else {
      const hasCleared = hasPlayerClearedGroup(state.balls, currentGroup);

      if (foulOccurred || !hasCleared) {
        // Premature 8-ball or 8-ball with scratch = IMMEDIATE LOSS
        state.phase = 'game_over';
        state.winner = opponent;
        state.winReason = !hasCleared
          ? `${currentTurn === 'player1' ? 'Player 1' : 'Player 2'} pocketed the 8-ball before clearing all group balls!`
          : `${currentTurn === 'player1' ? 'Player 1' : 'Player 2'} scratched while pocketing the 8-ball!`;
        return;
      } else {
        // Legal 8-ball potted on final shot = WIN!
        state.phase = 'game_over';
        state.winner = currentTurn;
        state.winReason = `${currentTurn === 'player1' ? 'Player 1' : 'Player 2'} legally pocketed the 8-ball for victory!`;
        return;
      }
    }
  }

  // 3. First Ball Hit Rule
  if (!foulOccurred) {
    if (outcome.firstBallHit === null) {
      foulOccurred = true;
      foulReason = 'Foul! Cue ball failed to contact any ball.';
    } else if (state.tableState === 'assigned' && currentGroup) {
      const hitBall = state.balls.find((b) => b.number === outcome.firstBallHit);
      if (hitBall) {
        const hasCleared = hasPlayerClearedGroup(state.balls, currentGroup);

        if (hasCleared) {
          // Must hit the 8-ball first
          if (hitBall.number !== 8) {
            foulOccurred = true;
            foulReason = 'Foul! Must contact the 8-ball first.';
          }
        } else {
          // Must hit own group ball first
          const isHitSolid = hitBall.number >= 1 && hitBall.number <= 7;
          const isCurrentSolid = currentGroup === 'solids';

          if (isHitSolid !== isCurrentSolid || hitBall.number === 8) {
            foulOccurred = true;
            foulReason = `Foul! Contacted opponent's ball or 8-ball first.`;
          }
        }
      }
    }
  }

  // 4. Cushion Contact Rule
  // If no ball was pocketed and contact was made, at least one ball must hit a cushion
  if (!foulOccurred && outcome.ballsPocketed.length === 0 && !outcome.cushionHitAfterBallContact) {
    foulOccurred = true;
    foulReason = 'Foul! No ball reached a cushion after contact.';
  }

  // 5. Group Assignment & Turn Retention
  const objectBallsPocketed = outcome.ballsPocketed.filter((n) => n > 0 && n !== 8);

  if (!foulOccurred && objectBallsPocketed.length > 0) {
    if (state.tableState === 'open') {
      // First legal ball pocketed assigns groups
      const firstPocketed = objectBallsPocketed[0];
      const isSolid = firstPocketed >= 1 && firstPocketed <= 7;

      if (currentTurn === 'player1') {
        state.player1Group = isSolid ? 'solids' : 'stripes';
        state.player2Group = isSolid ? 'stripes' : 'solids';
      } else {
        state.player2Group = isSolid ? 'solids' : 'stripes';
        state.player1Group = isSolid ? 'stripes' : 'solids';
      }
      state.tableState = 'assigned';
      switchTurn = false; // Keep shooting
    } else if (currentGroup) {
      // Check if player pocketed any of their own balls
      const isSolid = currentGroup === 'solids';
      const pocketedOwn = objectBallsPocketed.some((n) => {
        const ballSolid = n >= 1 && n <= 7;
        return ballSolid === isSolid;
      });

      if (pocketedOwn) {
        switchTurn = false; // Player keeps turn!
      }
    }
  }

  // Apply state outcomes
  state.isBreakShot = false;

  if (foulOccurred) {
    state.foul = foulReason;
    state.turn = opponent;
    state.isBallInHand = true;
    state.phase = 'ball_in_hand';

    // Respawn cue ball if pocketed
    const cue = state.balls.find((b) => b.number === 0);
    if (cue) {
      cue.isPocketed = false;
      cue.scale = 1;
      cue.pocketAnimProgress = 0;
      cue.vx = 0;
      cue.vy = 0;
      cue.x = table.headStringX;
      cue.y = table.height / 2;
    }
  } else {
    state.foul = null;
    if (switchTurn) {
      state.turn = opponent;
    }
    state.phase = 'aiming';
    state.isBallInHand = false;
  }
}
