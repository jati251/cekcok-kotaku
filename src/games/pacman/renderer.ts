import {
  Direction,
  FloatingScore,
  FruitEntity,
  GhostEntity,
  PacmanEntity,
  PacmanGameState,
  Particle,
} from './types';
import {
  TILE_SIZE,
  MAZE_COLS,
  MAZE_ROWS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './maze';

export function renderPacmanGame(
  ctx: CanvasRenderingContext2D,
  maze: number[][],
  pacman: PacmanEntity,
  ghosts: GhostEntity[],
  gameState: PacmanGameState,
  floatingScores: FloatingScore[],
  particles: Particle[],
  showScanlines: boolean
) {
  // Clear screen with deep arcade black
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Maze flashing on level clear
  const wallColor = gameState.flashMaze ? '#ffffff' : '#2563eb';
  const wallGlow = gameState.flashMaze ? '#93c5fd' : '#1d4ed8';

  // 1. Draw Maze Walls
  ctx.save();
  ctx.shadowColor = wallGlow;
  ctx.shadowBlur = 4;
  ctx.lineWidth = 2;
  ctx.strokeStyle = wallColor;

  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = maze[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (cell === 1) {
        // Wall block
        ctx.fillStyle = '#0b132b';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      } else if (cell === 4) {
        // Ghost House Gate
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(x, y + TILE_SIZE * 0.4, TILE_SIZE, TILE_SIZE * 0.2);
      }
    }
  }
  ctx.restore();

  // 2. Draw Dots & Energizers
  const time = Date.now();
  const energizerPulse = 0.8 + 0.3 * Math.sin(time * 0.008);

  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = maze[r][c];
      const centerX = (c + 0.5) * TILE_SIZE;
      const centerY = (r + 0.5) * TILE_SIZE;

      if (cell === 2) {
        // Small pellet
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
      } else if (cell === 3) {
        // Energizer (Power Pellet)
        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6 * energizerPulse, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // 3. Draw Bonus Fruit
  if (gameState.fruit && gameState.fruit.active) {
    drawFruit(ctx, gameState.fruit);
  }

  // 4. Draw Particles
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 5. Draw Pac-Man
  if (!pacman.isDying) {
    drawPacman(ctx, pacman);
  } else {
    drawPacmanDying(ctx, pacman);
  }

  // 6. Draw Ghosts
  ghosts.forEach((ghost) => {
    drawGhost(ctx, ghost, time);
  });

  // 7. Draw Floating Scores
  floatingScores.forEach((fs) => {
    ctx.save();
    ctx.globalAlpha = fs.opacity;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = fs.color;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(fs.text, fs.x, fs.y);
    ctx.restore();
  });

  // 8. Banners: READY!, GAME OVER, PAUSED, LEVEL CLEARED
  if (gameState.status === 'ready') {
    ctx.save();
    ctx.font = '900 18px monospace';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ca8a04';
    ctx.shadowBlur = 10;
    ctx.fillText('READY!', (13.5 + 0.5) * TILE_SIZE, 17.5 * TILE_SIZE);
    ctx.restore();
  } else if (gameState.status === 'game_over') {
    ctx.save();
    ctx.font = '900 22px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#991b1b';
    ctx.shadowBlur = 12;
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 17.5 * TILE_SIZE);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#f87171';
    ctx.fillText('PRESS R OR CLICK RESTART', CANVAS_WIDTH / 2, 19.5 * TILE_SIZE);
    ctx.restore();
  } else if (gameState.status === 'level_cleared') {
    ctx.save();
    ctx.font = '900 20px monospace';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#059669';
    ctx.shadowBlur = 12;
    ctx.fillText('STAGE CLEARED!', CANVAS_WIDTH / 2, 17.5 * TILE_SIZE);
    ctx.restore();
  } else if (gameState.isPaused) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = '900 24px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PRESS P OR SPACE TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.restore();
  }

  // 9. Retro CRT Scanlines
  if (showScanlines) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1.2);
    }
    ctx.restore();
  }
}

function drawPacman(ctx: CanvasRenderingContext2D, pacman: PacmanEntity) {
  ctx.save();
  ctx.translate(pacman.x, pacman.y);

  let rotation = 0;
  if (pacman.dir === 'RIGHT') rotation = 0;
  else if (pacman.dir === 'DOWN') rotation = Math.PI * 0.5;
  else if (pacman.dir === 'LEFT') rotation = Math.PI;
  else if (pacman.dir === 'UP') rotation = -Math.PI * 0.5;

  ctx.rotate(rotation);

  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const angle = pacman.mouthAngle;
  ctx.arc(0, 0, TILE_SIZE * 0.72, angle * Math.PI, (2 - angle) * Math.PI);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = '#facc15';
  ctx.fill();

  ctx.restore();
}

function drawPacmanDying(ctx: CanvasRenderingContext2D, pacman: PacmanEntity) {
  ctx.save();
  ctx.translate(pacman.x, pacman.y);

  const progress = Math.min(1, pacman.deathProgress);
  const startAngle = progress * Math.PI;
  const endAngle = (2 - progress) * Math.PI;

  if (startAngle < endAngle) {
    ctx.beginPath();
    ctx.arc(0, 0, TILE_SIZE * 0.72, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = '#facc15';
    ctx.fill();
  }

  ctx.restore();
}

function drawGhost(ctx: CanvasRenderingContext2D, ghost: GhostEntity, time: number) {
  ctx.save();
  ctx.translate(ghost.x, ghost.y);

  const radius = TILE_SIZE * 0.68;

  if (ghost.mode === 'EATEN') {
    // Only eyes flying back
    drawGhostEyes(ctx, ghost.dir, radius);
    ctx.restore();
    return;
  }

  // Determine ghost body color
  let bodyColor = ghost.color;
  if (ghost.mode === 'FRIGHTENED') {
    const isFlashing = ghost.frightenedTimer < 160 && Math.floor(time / 140) % 2 === 0;
    bodyColor = isFlashing ? '#f8fafc' : '#1d4ed8';
  }

  ctx.shadowColor = bodyColor;
  ctx.shadowBlur = 6;
  ctx.fillStyle = bodyColor;

  // Head semi-circle and body
  ctx.beginPath();
  ctx.arc(0, -2, radius, Math.PI, 0, false);
  ctx.lineTo(radius, radius);

  // Wavy skirt feet (3 waves undulating)
  const waveOffset = Math.sin(time * 0.015) * 1.5;
  const feet = 3;
  const step = (radius * 2) / feet;
  for (let i = 0; i < feet; i++) {
    const startX = radius - i * step;
    const midX = startX - step * 0.5;
    const endX = startX - step;
    const bottomY = radius + (i % 2 === 0 ? waveOffset : -waveOffset);
    ctx.quadraticCurveTo(midX, bottomY - 3, endX, radius);
  }

  ctx.closePath();
  ctx.fill();

  // Face
  if (ghost.mode === 'FRIGHTENED') {
    // Frightened face (small dots and wavy mouth)
    const eyeColor = bodyColor === '#f8fafc' ? '#dc2626' : '#f97316';
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-4, -2, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Wavy mouth
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(-4, 2);
    ctx.lineTo(-2, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(2, 4);
    ctx.lineTo(4, 2);
    ctx.lineTo(6, 4);
    ctx.stroke();
  } else {
    // Normal eyes looking in movement direction
    drawGhostEyes(ctx, ghost.dir, radius);
  }

  ctx.restore();
}

function drawGhostEyes(ctx: CanvasRenderingContext2D, dir: Direction, radius: number) {
  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-4.5, -3, radius * 0.35, 0, Math.PI * 2);
  ctx.arc(4.5, -3, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Pupils offset
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  if (dir === 'LEFT') pupilOffsetX = -2;
  else if (dir === 'RIGHT') pupilOffsetX = 2;
  else if (dir === 'UP') pupilOffsetY = -2;
  else if (dir === 'DOWN') pupilOffsetY = 2;

  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.arc(-4.5 + pupilOffsetX, -3 + pupilOffsetY, radius * 0.18, 0, Math.PI * 2);
  ctx.arc(4.5 + pupilOffsetX, -3 + pupilOffsetY, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawFruit(ctx: CanvasRenderingContext2D, fruit: FruitEntity) {
  ctx.save();
  ctx.translate(fruit.x, fruit.y);

  ctx.shadowColor = fruit.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = fruit.color;

  // Round fruit body
  ctx.beginPath();
  ctx.arc(-3, 1, 5, 0, Math.PI * 2);
  ctx.arc(3, 1, 5, 0, Math.PI * 2);
  ctx.fill();

  // Green stem
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-3, -3);
  ctx.quadraticCurveTo(0, -8, 4, -7);
  ctx.stroke();

  ctx.restore();
}
