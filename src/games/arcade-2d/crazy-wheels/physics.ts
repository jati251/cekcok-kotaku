import {
  CANVAS_W,
  GRAVITY,
  GROUND_FRICTION,
  AIR_FRICTION,
  MOVE_SPEED,
  JUMP_FORCE,
  MAX_SPEED,
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  GameState,
  PlayerState,
} from './types';
import { buildLevel } from './levels';

export function createPlayer(): PlayerState {
  return {
    x: 100,
    y: 350,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    wheelFront: { x: 100 + 22.5, y: 366 },
    wheelBack: { x: 100 - 22.5, y: 366 },
    wheelAngle: 0,
    onGround: false,
    alive: true,
    riderLean: 0,
    invincibleTimer: 0,
  };
}

export function createInitialState(): GameState {
  const level = buildLevel();
  return {
    player: createPlayer(),
    platforms: level.platforms,
    obstacles: level.obstacles,
    checkpoints: level.checkpoints,
    particles: [],
    bloodSplats: [],
    cameraX: 0,
    cameraY: 0,
    distance: 0,
    score: 0,
    deaths: 0,
    gameOver: false,
    started: false,
    paused: false,
    finishReached: false,
    highScore: 0,
  };
}

export function getLastCheckpoint(state: GameState): { x: number; y: number } {
  for (let i = state.checkpoints.length - 1; i >= 0; i--) {
    if (state.checkpoints[i].reached) {
      return { x: state.checkpoints[i].x, y: state.checkpoints[i].y };
    }
  }
  return { x: 100, y: 350 };
}

export function respawnPlayer(state: GameState) {
  const cp = getLastCheckpoint(state);
  const p = state.player;
  p.x = cp.x;
  p.y = cp.y - 50;
  p.vx = 0;
  p.vy = 0;
  p.angle = 0;
  p.angularVel = 0;
  p.wheelAngle = 0;
  p.onGround = false;
  p.alive = true;
  p.riderLean = 0;
  p.invincibleTimer = 90;
  state.deaths++;
}

export function killPlayer(state: GameState) {
  if (!state.player.alive || state.player.invincibleTimer > 0) return;
  state.player.alive = false;

  const px = state.player.x;
  const py = state.player.y - 15;
  for (let i = 0; i < 40; i++) {
    state.particles.push({
      x: px + (Math.random() - 0.5) * 30,
      y: py + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      life: 30 + Math.random() * 30,
      maxLife: 60,
      color: Math.random() > 0.5 ? '#e74c3c' : '#c0392b',
      size: 3 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    });
  }

  state.bloodSplats.push({
    x: px,
    y: py + 10,
    radius: 15 + Math.random() * 20,
    alpha: 0.7,
  });

  setTimeout(() => {
    respawnPlayer(state);
  }, 800);
}

export function rectsCollide(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  margin = 0
): boolean {
  return (
    ax + margin < bx + bw - margin &&
    ax + aw - margin > bx + margin &&
    ay + margin < by + bh - margin &&
    ay + ah - margin > by + margin
  );
}

export function circleRectCollide(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const distX = cx - closestX;
  const distY = cy - closestY;
  return distX * distX + distY * distY < r * r;
}

export function updateParticlesAndSplats(state: GameState) {
  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.rotation += p.rotSpeed;
    p.life--;
  }
  for (const s of state.bloodSplats) {
    s.alpha -= 0.005;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  state.bloodSplats = state.bloodSplats.filter((s) => s.alpha > 0);
}

export function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || state.paused || !state.started) return;

  const p = state.player;
  if (!p.alive) {
    updateParticlesAndSplats(state);
    return;
  }

  let moveDir = 0;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) moveDir = 1;
  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) moveDir = -1;
  const jumpPressed = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || keys.has(' ');

  p.riderLean += (moveDir - p.riderLean) * 0.15;
  p.vy += GRAVITY;

  if (p.onGround) {
    p.vx += moveDir * MOVE_SPEED;
    p.vx *= GROUND_FRICTION;
  } else {
    p.vx += moveDir * MOVE_SPEED * 0.5;
    p.vx *= AIR_FRICTION;
  }

  p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx));

  if (jumpPressed && p.onGround) {
    p.vy = JUMP_FORCE;
    p.onGround = false;
  }

  p.x += p.vx;
  p.y += p.vy;

  const targetAngle = p.vy * 0.02;
  p.angle += (targetAngle - p.angle) * 0.15;
  p.wheelAngle += p.vx * 0.15;

  p.onGround = false;
  const playerW = 45;
  const playerH = 30;

  for (const plat of state.platforms) {
    if (plat.type === 'crumbling' && plat.crumbled) continue;

    if (plat.type === 'ramp') {
      const rampLeft = plat.x;
      const rampRight = plat.x + plat.width;
      const rampBottom = plat.y + plat.height;

      if (p.x + playerW / 2 > rampLeft && p.x - playerW / 2 < rampRight) {
        const t = (p.x + playerW / 2 - rampLeft) / plat.width;
        const rampY = rampBottom - t * plat.height;

        if (p.y + playerH >= rampY && p.y + playerH <= rampY + 15 && p.vy >= 0) {
          p.y = rampY - playerH;
          p.vy = 0;
          p.onGround = true;
        }
      }
    } else {
      if (
        rectsCollide(
          p.x - playerW / 2,
          p.y - playerH / 2,
          playerW,
          playerH,
          plat.x,
          plat.y,
          plat.width,
          plat.height
        )
      ) {
        const prevBottom = p.y - p.vy + playerH / 2;
        if (prevBottom <= plat.y + 4 && p.vy >= 0) {
          p.y = plat.y - playerH / 2;
          p.vy = 0;
          p.onGround = true;
          if (plat.type === 'crumbling' && !plat.crumbleTimer) plat.crumbleTimer = 60;
        } else if (p.x - playerW / 2 < plat.x + plat.width / 2) {
          p.x = plat.x - playerW / 2;
          p.vx = Math.min(p.vx, 0);
        } else {
          p.x = plat.x + plat.width + playerW / 2;
          p.vx = Math.max(p.vx, 0);
        }
      }
    }
  }

  // Crumbling platforms
  for (const plat of state.platforms) {
    if (plat.type === 'crumbling' && plat.crumbleTimer !== undefined && plat.crumbleTimer > 0 && !plat.crumbled) {
      plat.crumbleTimer--;
      if (plat.crumbleTimer <= 0) {
        plat.crumbled = true;
        for (let i = 0; i < 15; i++) {
          state.particles.push({
            x: plat.x + Math.random() * plat.width,
            y: plat.y,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2,
            life: 20 + Math.random() * 20,
            maxLife: 40,
            color: '#8B7355',
            size: 3 + Math.random() * 4,
            rotation: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.2,
          });
        }
      }
    }
  }

  // Obstacles
  for (const obs of state.obstacles) {
    if (!obs.active) continue;
    if (obs.type === 'saw') {
      obs.angle = (obs.angle || 0) + (obs.speed || 0.06);
      const sawCx = obs.x + obs.width / 2;
      const sawCy = obs.y + obs.height / 2;
      const sawR = obs.width / 2 - 4;
      if (circleRectCollide(sawCx, sawCy, sawR, p.x - playerW / 2, p.y - playerH / 2, playerW, playerH)) {
        killPlayer(state);
        return;
      }
    } else if (obs.type === 'spikes') {
      if (
        rectsCollide(
          p.x - playerW / 2,
          p.y - playerH / 2,
          playerW,
          playerH,
          obs.x,
          obs.y - obs.height,
          obs.width,
          obs.height,
          -4
        )
      ) {
        killPlayer(state);
        return;
      }
    }
  }

  if (p.y > LEVEL_HEIGHT + 100) {
    killPlayer(state);
    return;
  }

  // Checkpoints
  for (const cp of state.checkpoints) {
    if (!cp.reached && Math.abs(p.x - cp.x) < 30 && p.y < cp.y + 30) {
      cp.reached = true;
      for (let i = 0; i < 10; i++) {
        state.particles.push({
          x: cp.x,
          y: cp.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 3,
          life: 20 + Math.random() * 20,
          maxLife: 40,
          color: '#f1c40f',
          size: 3 + Math.random() * 3,
          rotation: 0,
          rotSpeed: 0,
        });
      }
    }
  }

  // Finish line
  if (p.x > 5700 && !state.finishReached) {
    state.finishReached = true;
    state.gameOver = true;
    state.score = Math.max(0, 10000 - state.deaths * 500 - Math.floor(state.distance / 10));
    if (state.score > state.highScore) state.highScore = state.score;
  }

  if (p.invincibleTimer > 0) p.invincibleTimer--;

  state.distance = Math.max(state.distance, p.x);
  state.score = Math.floor(state.distance / 5) - state.deaths * 100;

  const targetCamX = p.x - CANVAS_W * 0.35;
  state.cameraX += (targetCamX - state.cameraX) * 0.1;
  state.cameraX = Math.max(0, Math.min(LEVEL_WIDTH - CANVAS_W, state.cameraX));
  state.cameraY = 0;

  updateParticlesAndSplats(state);
}
