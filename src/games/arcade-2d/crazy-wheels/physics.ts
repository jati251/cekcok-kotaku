import {
  GRAVITY,
  GROUND_FRICTION,
  AIR_FRICTION,
  MOVE_SPEED,
  JUMP_FORCE,
  MAX_SPEED,
  LEVEL_WIDTH,
  GameState,
  PlayerState,
} from './types';
import { buildLevel } from './levels';
import { crazyAudio } from './audio';

export function createPlayer(): PlayerState {
  return {
    x: 100,
    y: 350,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    wheelFront: { x: 100 + 22, y: 364 },
    wheelBack: { x: 100 - 22, y: 364 },
    wheelAngle: 0,
    onGround: false,
    alive: true,
    riderLean: 0,
    invincibleTimer: 0,
    respawnTimer: 0,
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
    viewportWidth: 1000,
    viewportHeight: 600,
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
  p.y = cp.y - 40;
  p.vx = 0;
  p.vy = 0;
  p.angle = 0;
  p.angularVel = 0;
  p.wheelAngle = 0;
  p.onGround = false;
  p.alive = true;
  p.riderLean = 0;
  p.invincibleTimer = 90;
  p.respawnTimer = 0;
}

export function killPlayer(state: GameState) {
  const p = state.player;
  if (!p.alive || p.invincibleTimer > 0) return;

  p.alive = false;
  p.respawnTimer = 70; // ~1.15s death animation before auto-respawn
  state.deaths++;
  crazyAudio.playCrash();

  // Blood and shrapnel burst
  const px = p.x;
  const py = p.y - 10;
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    state.particles.push({
      x: px + (Math.random() - 0.5) * 20,
      y: py + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 30 + Math.random() * 25,
      maxLife: 55,
      color: Math.random() > 0.4 ? '#ef4444' : '#b91c1c',
      size: 3 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    });
  }

  // Blood splat on ground
  state.bloodSplats.push({
    x: px,
    y: py + 20,
    radius: 12 + Math.random() * 12,
    alpha: 0.85,
  });
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
  margin = 2
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
    p.vy += 0.2; // Gravity
    p.rotation += p.rotSpeed;
    p.life--;
  }
  for (const s of state.bloodSplats) {
    s.alpha -= 0.003;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  state.bloodSplats = state.bloodSplats.filter((s) => s.alpha > 0);
}

export function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || state.paused || !state.started) return;

  const p = state.player;

  // Handle death timer & auto-respawn
  if (!p.alive) {
    updateParticlesAndSplats(state);
    if (p.respawnTimer > 0) {
      p.respawnTimer--;
      if (p.respawnTimer <= 0) {
        if (state.deaths >= 10) {
          state.gameOver = true;
        } else {
          respawnPlayer(state);
        }
      }
    }
    return;
  }

  if (p.invincibleTimer > 0) p.invincibleTimer--;

  // Controls
  let moveDir = 0;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) moveDir = 1;
  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) moveDir = -1;
  const jumpPressed = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || keys.has(' ');

  p.riderLean += (moveDir - p.riderLean) * 0.15;
  p.vy += GRAVITY;

  // Mid-air leaning torque
  if (!p.onGround) {
    if (moveDir !== 0) {
      p.angle += moveDir * 0.045;
    }
    p.vx += moveDir * MOVE_SPEED * 0.45;
    p.vx *= AIR_FRICTION;
  } else {
    // Ground drive
    p.vx += moveDir * MOVE_SPEED;
    p.vx *= GROUND_FRICTION;
    // Align bike angle gently to horizontal
    p.angle += (0 - p.angle) * 0.12;
  }

  p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx));

  if (jumpPressed && p.onGround) {
    p.vy = JUMP_FORCE;
    p.onGround = false;
    crazyAudio.playJump();
  }

  const prevY = p.y;
  p.x += p.vx;
  p.y += p.vy;

  p.wheelAngle += p.vx * 0.18;

  // Update wheel positions
  p.wheelFront.x = p.x + Math.cos(p.angle) * 22;
  p.wheelFront.y = p.y + Math.sin(p.angle) * 22 + 12;
  p.wheelBack.x = p.x - Math.cos(p.angle) * 22;
  p.wheelBack.y = p.y - Math.sin(p.angle) * 22 + 12;

  // Platform collision sweep
  p.onGround = false;
  const halfW = 22;
  const wheelBottomOffset = 18;

  for (const plat of state.platforms) {
    if (plat.type === 'crumbling' && plat.crumbled) continue;

    if (plat.type === 'ramp') {
      const rampLeft = plat.x;
      const rampRight = plat.x + plat.width;
      const rampBottom = plat.y + plat.height;

      if (p.x + halfW > rampLeft && p.x - halfW < rampRight) {
        const t = Math.max(0, Math.min(1, (p.x - rampLeft) / plat.width));
        const rampSurfaceY = rampBottom - t * plat.height;

        if (p.y + wheelBottomOffset >= rampSurfaceY && prevY + wheelBottomOffset <= rampSurfaceY + 22 && p.vy >= 0) {
          p.y = rampSurfaceY - wheelBottomOffset;
          p.vy = 0;
          p.onGround = true;
          // Tilt bike with ramp incline
          const rampAngle = -Math.atan2(plat.height, plat.width);
          p.angle += (rampAngle - p.angle) * 0.2;
        }
      }
    } else {
      // Solid Ground Box
      const platLeft = plat.x;
      const platRight = plat.x + plat.width;
      const platTop = plat.y;
      const platBottom = plat.y + plat.height;

      if (p.x + halfW > platLeft && p.x - halfW < platRight) {
        // Falling onto platform top
        if (p.y + wheelBottomOffset >= platTop && prevY + wheelBottomOffset <= platTop + 20 && p.vy >= 0) {
          p.y = platTop - wheelBottomOffset;
          p.vy = 0;
          p.onGround = true;

          if (plat.type === 'crumbling' && !plat.crumbleTimer) {
            plat.crumbleTimer = 55;
          }
        }
        // Hitting ceiling from underneath
        else if (p.y - 18 <= platBottom && prevY - 18 >= platBottom - 15 && p.vy < 0) {
          p.y = platBottom + 18;
          p.vy = 0;
        }
      }
    }
  }

  // Crumbling platforms timer
  for (const plat of state.platforms) {
    if (plat.type === 'crumbling' && plat.crumbleTimer !== undefined && plat.crumbleTimer > 0 && !plat.crumbled) {
      plat.crumbleTimer--;
      if (plat.crumbleTimer <= 0) {
        plat.crumbled = true;
      }
    }
  }

  // Obstacle Collisions (Lethal)
  for (const obs of state.obstacles) {
    if (!obs.active) continue;

    let hit = false;
    if (obs.type === 'saw') {
      const radius = obs.width / 2;
      hit =
        circleRectCollide(obs.x + radius, obs.y + radius, radius, p.x - 18, p.y - 18, 36, 36) ||
        Math.hypot(p.wheelFront.x - (obs.x + radius), p.wheelFront.y - (obs.y + radius)) < radius + 8 ||
        Math.hypot(p.wheelBack.x - (obs.x + radius), p.wheelBack.y - (obs.y + radius)) < radius + 8;
    } else if (obs.type === 'spikes') {
      hit = rectsCollide(p.x - 16, p.y - 16, 32, 32, obs.x, obs.y, obs.width, obs.height);
    } else if (obs.type === 'crusher') {
      hit = rectsCollide(p.x - 16, p.y - 16, 32, 32, obs.x, obs.y, obs.width, obs.height);
    } else if (obs.type === 'gap') {
      if (p.y > obs.y && p.x > obs.x && p.x < obs.x + obs.width) {
        hit = true;
      }
    }

    if (hit) {
      killPlayer(state);
      return;
    }
  }

  // Pit Death (Fell out of map)
  if (p.y > 650) {
    killPlayer(state);
    return;
  }

  // Checkpoints
  for (const cp of state.checkpoints) {
    if (!cp.reached && Math.hypot(p.x - cp.x, p.y - cp.y) < 55) {
      cp.reached = true;
      state.score += 500;
      crazyAudio.playCheckpoint();
    }
  }

  // Finish Line Reached
  const finishX = LEVEL_WIDTH - 250;
  if (p.x >= finishX && !state.finishReached) {
    state.finishReached = true;
    state.gameOver = true;
    const finishBonus = Math.max(1000, 5000 - state.deaths * 350);
    state.score += finishBonus;
    crazyAudio.playVictory();
  }

  // Camera Smooth Follow
  const targetCamX = Math.max(0, p.x - state.viewportWidth * 0.35);
  state.cameraX += (targetCamX - state.cameraX) * 0.12;

  // Track progress score
  state.distance = Math.max(state.distance, p.x);
  state.score = Math.max(state.score, Math.floor(state.distance * 0.5) - state.deaths * 200);

  updateParticlesAndSplats(state);
}
