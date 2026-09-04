import { SnowGameState, ObstacleType } from './types';
import { snowboardAudio } from './audio';

export function createInitialSnowState(w: number = 900, h: number = 600): SnowGameState {
  const groundY = Math.round(h * 0.76);
  const snowflakes = [];
  for (let i = 0; i < 45; i++) {
    snowflakes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 1.5 + Math.random() * 2.5,
      size: 1.5 + Math.random() * 2.5,
    });
  }

  return {
    player: {
      x: Math.round(w * 0.18),
      y: groundY - 14,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      isGrounded: true,
      crouching: false,
      alive: true,
      airTime: 0,
      spinsCompleted: 0,
    },
    obstacles: [],
    coins: [],
    particles: [],
    snowflakes,
    speed: 7,
    maxSpeed: 16,
    distance: 0,
    score: 0,
    trickMultiplier: 1,
    trickScoreCurrent: 0,
    lastTrickName: '',
    boostTimer: 0,
    groundY,
    started: false,
    gameOver: false,
    highScore: 0,
    nextId: 1,
    spawnTimer: 0,
    viewportWidth: w,
    viewportHeight: h,
  };
}

export function updateSnowPhysics(state: SnowGameState, keys: Set<string>) {
  if (!state.started || state.gameOver) return;

  const p = state.player;
  state.groundY = Math.round(state.viewportHeight * 0.76);

  // Speed & Boost
  if (state.boostTimer > 0) {
    state.boostTimer--;
    state.speed = 13.5;
  } else {
    // Gradual downhill acceleration
    state.speed = Math.min(state.maxSpeed, state.speed + 0.001);
  }

  // Player controls
  p.crouching = keys.has('ArrowDown') || keys.has('s');
  if (p.crouching && p.isGrounded) {
    state.speed = Math.min(state.maxSpeed, state.speed + 0.04); // Tuck for speed
  }

  // Jump
  if ((keys.has('ArrowUp') || keys.has('w') || keys.has(' ')) && p.isGrounded) {
    p.vy = -12.5;
    p.isGrounded = false;
    p.airTime = 0;
    p.spinsCompleted = 0;
    state.trickScoreCurrent = 0;
    snowboardAudio.playJump();
    spawnSnowSpray(state, p.x, p.y + 10, 12);
  }

  // Mid-air Rotation & Stunts
  if (!p.isGrounded) {
    p.airTime++;
    p.vy += 0.58; // Gravity
    p.y += p.vy;

    if (keys.has('ArrowRight') || keys.has('d')) {
      p.rotation += 0.12;
      checkSpins(state);
    } else if (keys.has('ArrowLeft') || keys.has('a')) {
      p.rotation -= 0.12;
      checkSpins(state);
    }

    // Ground landing check
    if (p.y >= state.groundY - 14) {
      p.y = state.groundY - 14;
      p.vy = 0;
      p.isGrounded = true;

      // Check alignment with slope (within ~32 degrees)
      const normRot = Math.atan2(Math.sin(p.rotation), Math.cos(p.rotation));
      if (Math.abs(normRot) < 0.55) {
        // Clean landing!
        p.rotation = 0;
        if (p.spinsCompleted > 0) {
          const landedPoints = state.trickScoreCurrent * state.trickMultiplier;
          state.score += landedPoints;
          state.trickMultiplier = Math.min(5, state.trickMultiplier + 1);
          snowboardAudio.playLand(true);
        } else {
          snowboardAudio.playLand(false);
        }
      } else {
        // WIPEOUT!
        p.alive = false;
        state.gameOver = true;
        snowboardAudio.playCrash();
        spawnSnowSpray(state, p.x, p.y, 45);
      }
      p.spinsCompleted = 0;
      state.trickScoreCurrent = 0;
    }
  } else {
    // Ground carve snow trail
    p.rotation = 0;
    if (Math.random() < 0.4) {
      spawnSnowSpray(state, p.x - 12, p.y + 10, 2);
    }
  }

  // Distance & base score
  state.distance += Math.round(state.speed * 0.2);
  state.score += Math.round(state.speed * 0.05);

  // Background Snowflakes Blizzard
  for (const s of state.snowflakes) {
    s.x -= state.speed * 0.4 + s.speed;
    s.y += s.speed * 0.7;
    if (s.x < -10) s.x = state.viewportWidth + 10;
    if (s.y > state.viewportHeight) s.y = -10;
  }

  // Spawning obstacles & coins
  state.spawnTimer++;
  if (state.spawnTimer > 70 - Math.min(30, Math.floor(state.speed * 2))) {
    state.spawnTimer = 0;
    spawnObstacleOrCoin(state);
  }

  // Update Obstacles
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obs = state.obstacles[i];
    obs.x -= state.speed;

    // Collision with player
    if (p.alive && Math.abs(obs.x - p.x) < obs.width / 2 + 16 && p.y + 10 > obs.y - obs.height / 2) {
      if (obs.type === 'ramp') {
        // Mega air ramp kick
        p.vy = -16.5;
        p.isGrounded = false;
        p.airTime = 0;
        snowboardAudio.playJump();
        spawnSnowSpray(state, p.x, p.y, 18);
        obs.passed = true;
      } else {
        // Crash into obstacle!
        p.alive = false;
        state.gameOver = true;
        snowboardAudio.playCrash();
        spawnSnowSpray(state, p.x, p.y, 40);
      }
    }

    if (obs.x < -100) {
      state.obstacles.splice(i, 1);
    }
  }

  // Update Coins
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    c.x -= state.speed;

    // Coin collection
    if (!c.collected && Math.hypot(c.x - p.x, c.y - p.y) < c.size + 18) {
      c.collected = true;
      if (c.isBoost) {
        state.boostTimer = 180; // 3 sec boost
        state.score += 200;
        snowboardAudio.playBoost();
      } else {
        state.score += 75;
        snowboardAudio.playCoin();
      }
    }

    if (c.x < -50 || c.collected) {
      state.coins.splice(i, 1);
    }
  }

  // Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life++;
    pt.x += pt.vx - state.speed * 0.3;
    pt.y += pt.vy;
    pt.vy += 0.15; // Gravity
    pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
    if (pt.life >= pt.maxLife) {
      state.particles.splice(i, 1);
    }
  }
}

function checkSpins(state: SnowGameState) {
  const p = state.player;
  const currentSpins = Math.floor(Math.abs(p.rotation) / (Math.PI * 2));
  if (currentSpins > p.spinsCompleted) {
    p.spinsCompleted = currentSpins;
    state.trickScoreCurrent += 150 * currentSpins;
    state.lastTrickName = currentSpins === 1 ? '360° SPIN!' : currentSpins === 2 ? '720° CORKSCREW!' : '1080° RODEO FLIP!';
    snowboardAudio.playTrick();
  }
}

function spawnObstacleOrCoin(state: SnowGameState) {
  const rand = Math.random();
  const spawnX = state.viewportWidth + 80;

  if (rand < 0.65) {
    // Obstacle
    let type: ObstacleType = 'rock';
    let width = 30;
    let height = 24;

    const sub = Math.random();
    if (sub < 0.35) {
      type = 'tree';
      width = 28;
      height = 55;
    } else if (sub < 0.65) {
      type = 'ramp';
      width = 44;
      height = 28;
    } else if (sub < 0.85) {
      type = 'snowman';
      width = 26;
      height = 38;
    }

    state.obstacles.push({
      id: state.nextId++,
      x: spawnX,
      y: state.groundY - height / 2,
      width,
      height,
      type,
      passed: false,
    });
  } else {
    // Snowflake Coin or Energy Can
    const isBoost = Math.random() < 0.2;
    state.coins.push({
      id: state.nextId++,
      x: spawnX,
      y: state.groundY - (isBoost ? 60 : 35 + Math.random() * 40),
      size: isBoost ? 14 : 10,
      collected: false,
      isBoost,
    });
  }
}

function spawnSnowSpray(state: SnowGameState, x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.7) * 4,
      vy: -1 - Math.random() * 3.5,
      color: '#ffffff',
      size: 2 + Math.random() * 3,
      alpha: 1,
      life: 0,
      maxLife: 20 + Math.random() * 15,
    });
  }
}
