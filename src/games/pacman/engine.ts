import {
  Direction,
  GhostEntity,
  PacmanEntity,
  PacmanGameState,
  Point,
  FloatingScore,
  Particle,
} from './types';
import {
  TILE_SIZE,
  MAZE_COLS,
  MAZE_ROWS,
  CANVAS_WIDTH,
  cloneMaze,
  countTotalDots,
} from './maze';
import { pacmanAudio } from './audio';

const FRUITS_BY_LEVEL: { name: string; points: number; color: string }[] = [
  { name: 'Cherry', points: 100, color: '#ef4444' },
  { name: 'Strawberry', points: 300, color: '#f43f5e' },
  { name: 'Orange', points: 500, color: '#f97316' },
  { name: 'Apple', points: 700, color: '#22c55e' },
  { name: 'Melon', points: 1000, color: '#10b981' },
  { name: 'Galaxian', points: 2000, color: '#eab308' },
  { name: 'Bell', points: 3000, color: '#fbbf24' },
  { name: 'Key', points: 5000, color: '#06b6d4' },
];

export const DIR_OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
  NONE: { dx: 0, dy: 0 },
};

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
  NONE: 'NONE',
};

export function createInitialPacman(): PacmanEntity {
  return {
    x: 13.5 * TILE_SIZE,
    y: 23.5 * TILE_SIZE,
    dir: 'NONE',
    nextDir: 'NONE',
    speed: 2.1,
    mouthAngle: 0.2,
    mouthDir: 1,
    isDying: false,
    deathProgress: 0,
  };
}

export function createInitialGhosts(): GhostEntity[] {
  return [
    {
      id: 'blinky',
      name: 'Blinky',
      color: '#ef4444',
      x: 13.5 * TILE_SIZE,
      y: 11.5 * TILE_SIZE,
      dir: 'LEFT',
      speed: 1.95,
      mode: 'SCATTER',
      frightenedTimer: 0,
      inHouse: false,
      target: { x: 26, y: 0 },
      scatterTarget: { x: 26, y: 0 },
      lastTileX: -1,
      lastTileY: -1,
    },
    {
      id: 'pinky',
      name: 'Pinky',
      color: '#ec4899',
      x: 13.5 * TILE_SIZE,
      y: 14.5 * TILE_SIZE,
      dir: 'UP',
      speed: 1.85,
      mode: 'SCATTER',
      frightenedTimer: 0,
      inHouse: true,
      target: { x: 2, y: 0 },
      scatterTarget: { x: 2, y: 0 },
      lastTileX: -1,
      lastTileY: -1,
    },
    {
      id: 'inky',
      name: 'Inky',
      color: '#06b6d4',
      x: 11.5 * TILE_SIZE,
      y: 14.5 * TILE_SIZE,
      dir: 'UP',
      speed: 1.8,
      mode: 'SCATTER',
      frightenedTimer: 0,
      inHouse: true,
      target: { x: 27, y: 31 },
      scatterTarget: { x: 27, y: 31 },
      lastTileX: -1,
      lastTileY: -1,
    },
    {
      id: 'clyde',
      name: 'Clyde',
      color: '#f97316',
      x: 15.5 * TILE_SIZE,
      y: 14.5 * TILE_SIZE,
      dir: 'UP',
      speed: 1.75,
      mode: 'SCATTER',
      frightenedTimer: 0,
      inHouse: true,
      target: { x: 0, y: 31 },
      scatterTarget: { x: 0, y: 31 },
      lastTileX: -1,
      lastTileY: -1,
    },
  ];
}

export function createInitialGameState(highScore: number = 10000): {
  gameState: PacmanGameState;
  maze: number[][];
  pacman: PacmanEntity;
  ghosts: GhostEntity[];
  floatingScores: FloatingScore[];
  particles: Particle[];
} {
  const maze = cloneMaze();
  const total = countTotalDots(maze);

  return {
    gameState: {
      score: 0,
      highScore,
      lives: 3,
      level: 1,
      dotsRemaining: total,
      totalDots: total,
      status: 'ready',
      isPaused: false,
      ghostCombo: 200,
      globalMode: 'SCATTER',
      modeTimer: 0,
      fruit: null,
      flashMaze: false,
    },
    maze,
    pacman: createInitialPacman(),
    ghosts: createInitialGhosts(),
    floatingScores: [],
    particles: [],
  };
}

export function isWallOrGate(tileX: number, tileY: number, maze: number[][], isGhost: boolean = false, isEaten: boolean = false): boolean {
  if (tileY < 0 || tileY >= MAZE_ROWS) return true;
  // Tunnel wraparounds
  if (tileX < 0 || tileX >= MAZE_COLS) return false;

  const cell = maze[tileY][tileX];
  if (cell === 1) return true; // Wall
  if (cell === 4) {
    // Gate: Eaten ghost or ghost leaving can pass; Pac-Man never can pass
    if (isGhost) return false;
    return true;
  }
  if (cell === 5 && !isGhost && !isEaten) {
    return true; // Pac-man cannot enter ghost house
  }
  return false;
}

export function canMoveInDir(
  x: number,
  y: number,
  dir: Direction,
  maze: number[][],
  isGhost: boolean = false,
  isEaten: boolean = false
): boolean {
  if (dir === 'NONE') return false;

  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  const offset = DIR_OFFSETS[dir];

  const nextTileX = tileX + offset.dx;
  const nextTileY = tileY + offset.dy;

  return !isWallOrGate(nextTileX, nextTileY, maze, isGhost, isEaten);
}

// Distance helper
function distanceSq(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

// Update Pacman position and mouth animation
export function updatePacman(
  pacman: PacmanEntity,
  maze: number[][],
  gameState: PacmanGameState,
  floatingScores: FloatingScore[],
  particles: Particle[]
): { ateDot: boolean; ateEnergizer: boolean } {
  let ateDot = false;
  let ateEnergizer = false;

  if (pacman.isDying) {
    pacman.deathProgress += 0.02;
    return { ateDot, ateEnergizer };
  }

  // Mouth animation
  pacman.mouthAngle += 0.04 * pacman.mouthDir;
  if (pacman.mouthAngle > 0.45) {
    pacman.mouthAngle = 0.45;
    pacman.mouthDir = -1;
  } else if (pacman.mouthAngle < 0.02) {
    pacman.mouthAngle = 0.02;
    pacman.mouthDir = 1;
  }

  // Opposite direction check (instant turnaround anywhere)
  if (pacman.nextDir !== 'NONE' && pacman.nextDir === OPPOSITE_DIR[pacman.dir]) {
    pacman.dir = pacman.nextDir;
    pacman.nextDir = 'NONE';
  }

  const currentTileX = Math.floor(pacman.x / TILE_SIZE);
  const currentTileY = Math.floor(pacman.y / TILE_SIZE);
  const centerTileX = (currentTileX + 0.5) * TILE_SIZE;
  const centerTileY = (currentTileY + 0.5) * TILE_SIZE;

  // If stopped (pacman.dir === 'NONE'), start moving immediately in nextDir if path is clear
  if (pacman.dir === 'NONE' && pacman.nextDir !== 'NONE') {
    const offset = DIR_OFFSETS[pacman.nextDir];
    if (!isWallOrGate(currentTileX + offset.dx, currentTileY + offset.dy, maze, false)) {
      pacman.x = centerTileX;
      pacman.y = centerTileY;
      pacman.dir = pacman.nextDir;
      pacman.nextDir = 'NONE';
    }
  }

  // If turning perpendicular, snap to center of tile when close enough
  if (pacman.nextDir !== 'NONE' && pacman.nextDir !== pacman.dir) {
    const distToCenter = Math.hypot(pacman.x - centerTileX, pacman.y - centerTileY);
    if (distToCenter <= 6.5) {
      const offset = DIR_OFFSETS[pacman.nextDir];
      if (!isWallOrGate(currentTileX + offset.dx, currentTileY + offset.dy, maze, false)) {
        pacman.x = centerTileX;
        pacman.y = centerTileY;
        pacman.dir = pacman.nextDir;
        pacman.nextDir = 'NONE';
      }
    }
  }

  // Move in current direction
  if (pacman.dir !== 'NONE') {
    const offset = DIR_OFFSETS[pacman.dir];
    const nextX = pacman.x + offset.dx * pacman.speed;
    const nextY = pacman.y + offset.dy * pacman.speed;

    // Check collision in current direction
    const checkTileX = Math.floor((nextX + offset.dx * (TILE_SIZE * 0.45)) / TILE_SIZE);
    const checkTileY = Math.floor((nextY + offset.dy * (TILE_SIZE * 0.45)) / TILE_SIZE);

    if (isWallOrGate(checkTileX, checkTileY, maze, false)) {
      // Hit wall, snap to center and stop
      pacman.x = centerTileX;
      pacman.y = centerTileY;
      pacman.dir = 'NONE';
    } else {
      pacman.x = nextX;
      pacman.y = nextY;
      if (pacman.dir === 'LEFT' || pacman.dir === 'RIGHT') {
        pacman.y = centerTileY;
      } else if (pacman.dir === 'UP' || pacman.dir === 'DOWN') {
        pacman.x = centerTileX;
      }
    }
  }

  // Tunnel wrap-around
  if (pacman.x < -TILE_SIZE / 2) {
    pacman.x = CANVAS_WIDTH + TILE_SIZE / 2;
  } else if (pacman.x > CANVAS_WIDTH + TILE_SIZE / 2) {
    pacman.x = -TILE_SIZE / 2;
  }

  // Pellet / Energizer Eating
  const curTileX = Math.floor(pacman.x / TILE_SIZE);
  const curTileY = Math.floor(pacman.y / TILE_SIZE);

  if (curTileX >= 0 && curTileX < MAZE_COLS && curTileY >= 0 && curTileY < MAZE_ROWS) {
    const cell = maze[curTileY][curTileX];
    if (cell === 2) {
      // Normal dot
      maze[curTileY][curTileX] = 0;
      gameState.score += 10;
      gameState.dotsRemaining--;
      ateDot = true;
      pacmanAudio.playWaka();
    } else if (cell === 3) {
      // Energizer
      maze[curTileY][curTileX] = 0;
      gameState.score += 50;
      gameState.dotsRemaining--;
      ateEnergizer = true;
      pacmanAudio.playPowerPellet();

      // Spawn energizer particles
      for (let i = 0; i < 14; i++) {
        const ang = (Math.PI * 2 * i) / 14;
        const spd = 1.5 + Math.random() * 2;
        particles.push({
          x: pacman.x,
          y: pacman.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 20,
          color: '#fbbf24',
          size: 2.5,
        });
      }
    }

    // Fruit eating check
    if (gameState.fruit && gameState.fruit.active) {
      const distToFruit = Math.hypot(pacman.x - gameState.fruit.x, pacman.y - gameState.fruit.y);
      if (distToFruit < TILE_SIZE * 0.8) {
        gameState.score += gameState.fruit.points;
        floatingScores.push({
          id: Date.now() + Math.random(),
          x: gameState.fruit.x,
          y: gameState.fruit.y,
          text: `+${gameState.fruit.points}`,
          color: gameState.fruit.color,
          opacity: 1,
        });
        gameState.fruit.active = false;
        pacmanAudio.playEatFruit();
      }
    }
  }

  // Fruit spawn logic at 70 and 170 eaten dots
  const eatenDots = gameState.totalDots - gameState.dotsRemaining;
  if ((eatenDots === 70 || eatenDots === 170) && !gameState.fruit) {
    const fruitIdx = Math.min(gameState.level - 1, FRUITS_BY_LEVEL.length - 1);
    const fruitData = FRUITS_BY_LEVEL[fruitIdx];
    gameState.fruit = {
      name: fruitData.name,
      points: fruitData.points,
      x: 13.5 * TILE_SIZE,
      y: 17 * TILE_SIZE,
      active: true,
      timer: 600, // ~10 seconds at 60fps
      color: fruitData.color,
    };
  }

  if (gameState.fruit && gameState.fruit.active) {
    gameState.fruit.timer--;
    if (gameState.fruit.timer <= 0) {
      gameState.fruit.active = false;
    }
  }

  return { ateDot, ateEnergizer };
}

// Update ghost target based on personality and mode
function updateGhostTarget(
  ghost: GhostEntity,
  pacman: PacmanEntity,
  blinky: GhostEntity,
  globalMode: 'CHASE' | 'SCATTER'
) {
  if (ghost.mode === 'EATEN') {
    // Return to ghost house door
    ghost.target = { x: 13.5, y: 11 };
    return;
  }

  if (ghost.mode === 'FRIGHTENED') {
    // Target random tile or continue
    return;
  }

  if (globalMode === 'SCATTER') {
    ghost.target = ghost.scatterTarget;
    return;
  }

  // CHASE MODE AI per character
  const pacTileX = Math.floor(pacman.x / TILE_SIZE);
  const pacTileY = Math.floor(pacman.y / TILE_SIZE);
  const pacOffset = DIR_OFFSETS[pacman.dir];

  switch (ghost.id) {
    case 'blinky':
      // Direct chase: pac-man current tile
      ghost.target = { x: pacTileX, y: pacTileY };
      break;

    case 'pinky':
      // Ambush: 4 tiles ahead of pac-man
      ghost.target = {
        x: pacTileX + pacOffset.dx * 4,
        y: pacTileY + pacOffset.dy * 4,
      };
      break;

    case 'inky': {
      // Flanker: 2 tiles ahead of pacman, vector from blinky doubled
      const blinkyTileX = Math.floor(blinky.x / TILE_SIZE);
      const blinkyTileY = Math.floor(blinky.y / TILE_SIZE);
      const intermediateX = pacTileX + pacOffset.dx * 2;
      const intermediateY = pacTileY + pacOffset.dy * 2;
      ghost.target = {
        x: intermediateX + (intermediateX - blinkyTileX),
        y: intermediateY + (intermediateY - blinkyTileY),
      };
      break;
    }

    case 'clyde': {
      // Coward: if distance > 8 tiles, target pacman; else retreat to scatter target
      const clydeTileX = Math.floor(ghost.x / TILE_SIZE);
      const clydeTileY = Math.floor(ghost.y / TILE_SIZE);
      const dist = Math.hypot(clydeTileX - pacTileX, clydeTileY - pacTileY);
      if (dist > 8) {
        ghost.target = { x: pacTileX, y: pacTileY };
      } else {
        ghost.target = ghost.scatterTarget;
      }
      break;
    }
  }
}

// Move individual ghost
export function updateGhost(
  ghost: GhostEntity,
  maze: number[][],
  pacman: PacmanEntity,
  blinky: GhostEntity,
  globalMode: 'CHASE' | 'SCATTER'
) {
  // Check house release
  if (ghost.inHouse) {
    // Float up and exit house gate
    if (ghost.y > 11.5 * TILE_SIZE) {
      ghost.x = 13.5 * TILE_SIZE;
      ghost.y -= 1.0;
      ghost.dir = 'UP';
      return;
    } else {
      ghost.inHouse = false;
      ghost.y = 11.5 * TILE_SIZE;
      ghost.dir = 'LEFT';
      ghost.lastTileX = -1;
      ghost.lastTileY = -1;
    }
  }

  // Check revived if was eaten and reached house
  if (ghost.mode === 'EATEN') {
    const distToHouse = Math.hypot(ghost.x - 13.5 * TILE_SIZE, ghost.y - 11.5 * TILE_SIZE);
    if (distToHouse < TILE_SIZE * 0.8) {
      ghost.mode = globalMode;
      ghost.speed = 1.9;
      ghost.dir = 'UP';
      ghost.lastTileX = -1;
      ghost.lastTileY = -1;
    }
  }

  // Frightened countdown
  if (ghost.mode === 'FRIGHTENED') {
    ghost.frightenedTimer--;
    if (ghost.frightenedTimer <= 0) {
      ghost.mode = globalMode;
      ghost.speed = 1.9;
    }
  }

  updateGhostTarget(ghost, pacman, blinky, globalMode);

  // Intersection navigation
  const tileX = Math.floor(ghost.x / TILE_SIZE);
  const tileY = Math.floor(ghost.y / TILE_SIZE);
  const centerTileX = (tileX + 0.5) * TILE_SIZE;
  const centerTileY = (tileY + 0.5) * TILE_SIZE;
  const distToCenter = Math.hypot(ghost.x - centerTileX, ghost.y - centerTileY);

  if ((ghost.lastTileX !== tileX || ghost.lastTileY !== tileY) && distToCenter <= Math.max(3.5, ghost.speed * 1.5)) {
    ghost.lastTileX = tileX;
    ghost.lastTileY = tileY;

    // Reached intersection, evaluate best next direction
    const possibleDirs: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
    const validDirs: Direction[] = [];

    for (const d of possibleDirs) {
      // Ghost cannot immediately reverse direction
      if (d === OPPOSITE_DIR[ghost.dir]) continue;

      const offset = DIR_OFFSETS[d];
      const nextTileX = tileX + offset.dx;
      const nextTileY = tileY + offset.dy;

      const isEaten = ghost.mode === 'EATEN';
      if (!isWallOrGate(nextTileX, nextTileY, maze, true, isEaten)) {
        validDirs.push(d);
      }
    }

    if (validDirs.length > 0) {
      if (ghost.mode === 'FRIGHTENED') {
        // Pick random valid direction
        const randIdx = Math.floor(Math.random() * validDirs.length);
        ghost.dir = validDirs[randIdx];
      } else {
        // Pick direction minimizing Euclidean distance to target tile
        let bestDir = validDirs[0];
        let bestDist = Infinity;

        for (const d of validDirs) {
          const offset = DIR_OFFSETS[d];
          const nextTile = { x: tileX + offset.dx, y: tileY + offset.dy };
          const dist = distanceSq(nextTile, ghost.target);
          if (dist < bestDist) {
            bestDist = dist;
            bestDir = d;
          }
        }
        ghost.dir = bestDir;
      }

      ghost.x = centerTileX;
      ghost.y = centerTileY;
    }
  }

  // Move ghost in dir
  const currentSpeed = ghost.mode === 'EATEN' ? 3.8 : ghost.mode === 'FRIGHTENED' ? 1.05 : ghost.speed;
  const offset = DIR_OFFSETS[ghost.dir];
  ghost.x += offset.dx * currentSpeed;
  ghost.y += offset.dy * currentSpeed;

  if (ghost.dir === 'LEFT' || ghost.dir === 'RIGHT') {
    ghost.y = centerTileY;
  } else if (ghost.dir === 'UP' || ghost.dir === 'DOWN') {
    ghost.x = centerTileX;
  }

  // Tunnel wrap
  if (ghost.x < -TILE_SIZE / 2) {
    ghost.x = CANVAS_WIDTH + TILE_SIZE / 2;
  } else if (ghost.x > CANVAS_WIDTH + TILE_SIZE / 2) {
    ghost.x = -TILE_SIZE / 2;
  }
}

// Check collision between Pac-Man and ghosts
export function checkGhostCollisions(
  pacman: PacmanEntity,
  ghosts: GhostEntity[],
  gameState: PacmanGameState,
  floatingScores: FloatingScore[],
  particles: Particle[]
): { pacmanDied: boolean } {
  if (pacman.isDying) return { pacmanDied: false };

  for (const ghost of ghosts) {
    const dist = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);

    if (dist < TILE_SIZE * 0.75) {
      if (ghost.mode === 'FRIGHTENED') {
        // Pac-man eats ghost!
        ghost.mode = 'EATEN';
        ghost.frightenedTimer = 0;
        const points = gameState.ghostCombo;
        gameState.score += points;
        gameState.ghostCombo *= 2;

        floatingScores.push({
          id: Date.now() + Math.random(),
          x: ghost.x,
          y: ghost.y,
          text: `+${points}`,
          color: '#38bdf8',
          opacity: 1,
        });

        // Spark particles
        for (let i = 0; i < 16; i++) {
          const ang = (Math.PI * 2 * i) / 16;
          particles.push({
            x: ghost.x,
            y: ghost.y,
            vx: Math.cos(ang) * (2 + Math.random() * 2),
            vy: Math.sin(ang) * (2 + Math.random() * 2),
            life: 0,
            maxLife: 24,
            color: '#38bdf8',
            size: 2.5,
          });
        }

        pacmanAudio.playEatGhost();
      } else if (ghost.mode === 'CHASE' || ghost.mode === 'SCATTER') {
        // Ghost catches Pac-man!
        pacman.isDying = true;
        pacman.deathProgress = 0;
        gameState.status = 'pacman_dying';
        pacmanAudio.playDeath();
        return { pacmanDied: true };
      }
    }
  }

  return { pacmanDied: false };
}
