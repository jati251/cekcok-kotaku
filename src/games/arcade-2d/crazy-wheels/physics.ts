import {
  GRAVITY,
  GROUND_FRICTION,
  AIR_FRICTION,
  GameState,
  PlayerState,
  VehicleType,
  VEHICLES,
  RagdollPart,
  Platform,
} from './types';
import { buildStage } from './levels';
import { crazyAudio } from './audio';

export function createPlayer(vehicleType: VehicleType = 'bmx'): PlayerState {
  const cfg = VEHICLES[vehicleType];
  const halfBase = cfg.wheelBase / 2;
  const startX = 120;
  const startY = 380;

  return {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    wheelBack: {
      x: startX - halfBase,
      y: startY + 12,
      vx: 0,
      vy: 0,
      radius: cfg.wheelRadius,
      onGround: false,
      spin: 0,
    },
    wheelFront: {
      x: startX + halfBase,
      y: startY + 12,
      vx: 0,
      vy: 0,
      radius: cfg.wheelRadius,
      onGround: false,
      spin: 0,
    },
    onGround: false,
    alive: true,
    riderLean: 0,
    invincibleTimer: 0,
    respawnTimer: 0,
    nitro: 100,
    maxNitro: 100,
    isBoosting: false,
    airTime: 0,
    accumulatedAngle: 0,
    flipsCompleted: 0,
    wheelieFrames: 0,
    vehicleType,
    ragdollParts: [],
  };
}

export function createInitialState(stageId = 1, vehicleType: VehicleType = 'bmx'): GameState {
  const stageData = buildStage(stageId);
  const totalCoins = stageData.obstacles.filter((o) => o.type === 'coin').length;

  return {
    stage: stageData.stage,
    player: createPlayer(vehicleType),
    platforms: stageData.platforms,
    obstacles: stageData.obstacles,
    checkpoints: stageData.checkpoints,
    particles: [],
    bloodSplats: [],
    stuntNotifications: [],
    cameraX: 0,
    cameraY: 0,
    cameraZoom: 1.0,
    shake: 0,
    viewportWidth: 1000,
    viewportHeight: 600,
    distance: 0,
    score: 0,
    coinsCollected: 0,
    totalCoins,
    flipsCount: 0,
    deaths: 0,
    gameOver: false,
    started: false,
    paused: false,
    finishReached: false,
    stars: 0,
    highScore: 0,
  };
}

export function getLastCheckpoint(state: GameState): { x: number; y: number } {
  for (let i = state.checkpoints.length - 1; i >= 0; i--) {
    if (state.checkpoints[i].reached) {
      return { x: state.checkpoints[i].x, y: state.checkpoints[i].y };
    }
  }
  return { x: 120, y: 380 };
}

export function respawnPlayer(state: GameState) {
  const cp = getLastCheckpoint(state);
  const p = state.player;
  const cfg = VEHICLES[p.vehicleType];
  const halfBase = cfg.wheelBase / 2;

  p.x = cp.x;
  p.y = cp.y - 45;
  p.vx = 0;
  p.vy = 0;
  p.angle = 0;
  p.angularVel = 0;
  p.wheelBack.x = p.x - halfBase;
  p.wheelBack.y = p.y + 12;
  p.wheelBack.vx = 0;
  p.wheelBack.vy = 0;
  p.wheelBack.onGround = false;
  p.wheelBack.spin = 0;
  p.wheelFront.x = p.x + halfBase;
  p.wheelFront.y = p.y + 12;
  p.wheelFront.vx = 0;
  p.wheelFront.vy = 0;
  p.wheelFront.onGround = false;
  p.wheelFront.spin = 0;
  p.onGround = false;
  p.alive = true;
  p.riderLean = 0;
  p.invincibleTimer = 90;
  p.respawnTimer = 0;
  p.nitro = Math.max(p.nitro, 60);
  p.isBoosting = false;
  p.airTime = 0;
  p.accumulatedAngle = 0;
  p.wheelieFrames = 0;
  p.ragdollParts = [];
}

export function killPlayer(state: GameState, _reason = 'crash') {
  const p = state.player;
  if (!p.alive || p.invincibleTimer > 0) return;

  p.alive = false;
  p.respawnTimer = 85;
  state.deaths++;
  state.shake = 16;
  crazyAudio.stopNitroSound();
  crazyAudio.playCrash();

  const cfg = VEHICLES[p.vehicleType];
  const parts: RagdollPart[] = [];

  // 1. Head & Helmet
  const headAngle = p.angle - Math.PI / 2;
  const headX = p.x + Math.cos(headAngle) * 32;
  const headY = p.y + Math.sin(headAngle) * 32;

  parts.push({
    type: 'head',
    x: headX,
    y: headY,
    vx: p.vx * 0.9 + (Math.random() - 0.5) * 5,
    vy: p.vy * 0.9 - 4 - Math.random() * 3,
    angle: p.angle,
    angularVel: (Math.random() - 0.5) * 0.4,
    radius: 7,
    color: '#fed7aa',
    bounces: 0,
  });

  parts.push({
    type: 'helmet',
    x: headX,
    y: headY - 4,
    vx: p.vx + (Math.random() - 0.5) * 8,
    vy: p.vy - 6 - Math.random() * 4,
    angle: p.angle,
    angularVel: (Math.random() - 0.5) * 0.5,
    radius: 8,
    color: cfg.color,
    bounces: 0,
  });

  // 2. Torso
  parts.push({
    type: 'torso',
    x: p.x,
    y: p.y - 12,
    vx: p.vx * 0.8 + (Math.random() - 0.5) * 4,
    vy: p.vy * 0.8 - 3 - Math.random() * 2,
    angle: p.angle,
    angularVel: (Math.random() - 0.5) * 0.3,
    radius: 10,
    color: cfg.accentColor,
    bounces: 0,
  });

  // 3. Limbs
  const limbTypes: Array<'arm_left' | 'arm_right' | 'leg_left' | 'leg_right'> = [
    'arm_left',
    'arm_right',
    'leg_left',
    'leg_right',
  ];
  limbTypes.forEach((lt, i) => {
    parts.push({
      type: lt,
      x: p.x + (i % 2 === 0 ? -8 : 8),
      y: p.y + (i < 2 ? -18 : 6),
      vx: p.vx * 0.7 + (Math.random() - 0.5) * 6,
      vy: p.vy * 0.7 - 2 - Math.random() * 3,
      angle: p.angle + i,
      angularVel: (Math.random() - 0.5) * 0.5,
      radius: 4.5,
      color: i < 2 ? cfg.accentColor : '#1e3a8a',
      bounces: 0,
    });
  });

  // 4. Vehicle Frame
  parts.push({
    type: 'frame',
    x: p.x,
    y: p.y,
    vx: p.vx * 0.6 + (Math.random() - 0.5) * 3,
    vy: p.vy * 0.6 - 2 - Math.random() * 2,
    angle: p.angle,
    angularVel: p.angularVel + (Math.random() - 0.5) * 0.2,
    radius: 14,
    color: cfg.color,
    bounces: 0,
  });

  // 5. Detached Wheels
  parts.push({
    type: 'wheel_front',
    x: p.wheelFront.x,
    y: p.wheelFront.y,
    vx: p.wheelFront.vx + 2 + Math.random() * 3,
    vy: p.wheelFront.vy - 3 - Math.random() * 3,
    angle: p.wheelFront.spin,
    angularVel: 0.25,
    radius: cfg.wheelRadius,
    color: '#334155',
    bounces: 0,
  });

  parts.push({
    type: 'wheel_back',
    x: p.wheelBack.x,
    y: p.wheelBack.y,
    vx: p.wheelBack.vx - 2 - Math.random() * 3,
    vy: p.wheelBack.vy - 3 - Math.random() * 3,
    angle: p.wheelBack.spin,
    angularVel: -0.25,
    radius: cfg.wheelRadius,
    color: '#334155',
    bounces: 0,
  });

  p.ragdollParts = parts;

  // Massive blood and shrapnel eruption
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 8.5;
    state.particles.push({
      x: p.x + (Math.random() - 0.5) * 24,
      y: p.y + (Math.random() - 0.5) * 24,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      life: 35 + Math.random() * 30,
      maxLife: 65,
      color: Math.random() > 0.35 ? '#dc2626' : '#991b1b',
      size: 3.5 + Math.random() * 4.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      type: 'blood',
    });
  }

  // Initial blood splat
  state.bloodSplats.push({
    x: p.x,
    y: p.y + 15,
    radius: 14 + Math.random() * 12,
    alpha: 0.9,
  });
}

export function addStuntNotification(
  state: GameState,
  text: string,
  scoreBonus: number,
  color = '#38bdf8'
) {
  state.score += scoreBonus;
  crazyAudio.playStunt();
  state.stuntNotifications.push({
    id: Date.now() + Math.random(),
    text,
    score: scoreBonus,
    color,
    life: 70,
    maxLife: 70,
    x: state.player.x,
    y: state.player.y - 45,
  });
}

function updateRagdoll(state: GameState) {
  const p = state.player;
  for (const part of p.ragdollParts) {
    part.x += part.vx;
    part.y += part.vy;
    part.vy += GRAVITY * 0.95;
    part.vx *= 0.985;
    part.angle += part.angularVel;

    // Platform collision for ragdoll
    for (const plat of state.platforms) {
      if (plat.type === 'crumbling' && plat.crumbled) continue;
      const left = plat.x;
      const right = plat.x + plat.width;
      const top = plat.y;
      const bottom = plat.y + plat.height;

      if (part.x >= left && part.x <= right && part.y + part.radius >= top && part.y - part.radius <= bottom) {
        if (part.vy > 0) {
          part.y = top - part.radius;
          part.vy = -part.vy * 0.45;
          part.vx *= 0.8;
          part.angularVel *= 0.7;
          part.bounces++;

          if (part.bounces < 4 && Math.random() > 0.4 && part.type !== 'helmet' && part.type !== 'frame') {
            state.bloodSplats.push({
              x: part.x,
              y: top,
              radius: 6 + Math.random() * 8,
              alpha: 0.75,
            });
          }
        }
      }
    }
  }
}

export function updateParticlesAndSplats(state: GameState) {
  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.type === 'blood') p.vy += 0.22;
    else if (p.type === 'smoke') p.vy -= 0.04;
    else if (p.type === 'spark') p.vy += 0.15;
    p.rotation += p.rotSpeed;
    p.life--;
  }

  for (const s of state.bloodSplats) {
    s.alpha -= 0.0008;
  }

  for (const sn of state.stuntNotifications) {
    sn.y -= 0.5;
    sn.life--;
  }

  state.particles = state.particles.filter((p) => p.life > 0);
  state.bloodSplats = state.bloodSplats.filter((s) => s.alpha > 0);
  state.stuntNotifications = state.stuntNotifications.filter((sn) => sn.life > 0);

  // Decay screen shake
  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - 0.8);
  }
}

export function updateObstacles(state: GameState) {
  for (const obs of state.obstacles) {
    if (!obs.active) continue;

    if (obs.type === 'saw') {
      obs.angle = (obs.angle || 0) + (obs.speed || 0.1);
    } else if (obs.type === 'swinging_saw') {
      obs.swingAngle = (obs.swingAngle || 0) + (obs.swingSpeed || 0.035);
      const pivotX = obs.pivotX || obs.x;
      const pivotY = obs.pivotY || 100;
      const chainLen = obs.chainLength || 160;
      obs.x = pivotX + Math.sin(obs.swingAngle) * chainLen;
      obs.y = pivotY + Math.cos(obs.swingAngle) * chainLen;
      obs.angle = (obs.angle || 0) + 0.15;
    } else if (obs.type === 'hydraulic_press') {
      obs.pressTimer = (obs.pressTimer || 0) + 1;
      const cycle = obs.pressTimer % 140;

      if (cycle < 60) {
        // Idle at top
        obs.pressProgress = 0;
      } else if (cycle < 80) {
        // Warning shake
        obs.pressProgress = Math.sin(cycle * 1.5) * 0.04;
      } else if (cycle < 92) {
        // Rapid slam down
        const t = (cycle - 80) / 12;
        obs.pressProgress = t * t;
        if (cycle === 91) {
          crazyAudio.playPiston();
          state.shake = Math.max(state.shake, 6);
        }
      } else {
        // Retract slowly
        const t = 1 - (cycle - 92) / 48;
        obs.pressProgress = Math.max(0, t);
      }
    }
  }
}

function getGroundSurface(
  x: number,
  platforms: GameState['platforms']
): { surfaceY: number; conveyorSpeed: number; isBoost: boolean; isCrumbling: boolean; platform: Platform } | null {
  let best: { surfaceY: number; conveyorSpeed: number; isBoost: boolean; isCrumbling: boolean; platform: Platform } | null = null;

  for (const plat of platforms) {
    if (plat.type === 'crumbling' && plat.crumbled) continue;

    if (plat.type === 'ramp') {
      const left = plat.x;
      const right = plat.x + plat.width;
      if (x >= left && x <= right) {
        const t = Math.max(0, Math.min(1, (x - left) / plat.width));
        const surfaceY = plat.y + plat.height - t * plat.height;
        if (!best || surfaceY < best.surfaceY) {
          best = { surfaceY, conveyorSpeed: 0, isBoost: false, isCrumbling: false, platform: plat };
        }
      }
    } else {
      const left = plat.x;
      const right = plat.x + plat.width;
      if (x >= left && x <= right) {
        const surfaceY = plat.y;
        if (!best || surfaceY < best.surfaceY) {
          best = {
            surfaceY,
            conveyorSpeed: plat.conveyorSpeed || 0,
            isBoost: plat.type === 'boost_strip',
            isCrumbling: plat.type === 'crumbling',
            platform: plat,
          };
        }
      }
    }
  }

  return best;
}

export function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || state.paused || !state.started) return;

  const p = state.player;
  const cfg = VEHICLES[p.vehicleType];

  // Dynamic Obstacle Routine
  updateObstacles(state);

  // If Crashed: Ragdoll Simulation
  if (!p.alive) {
    updateRagdoll(state);
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

  // Controls Reading
  let drive = 0;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) drive += 1;
  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) drive -= 1;

  let leanInput = 0;
  if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) leanInput -= 1; // Lean back
  if (keys.has('q') || keys.has('Q')) leanInput += 1; // Lean forward
  if (keys.has('e') || keys.has('E')) leanInput -= 1; // Lean back

  const jumpPressed = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
  const boostPressed = keys.has('Shift') || keys.has(' ') || keys.has('x') || keys.has('X');

  // Nitro Booster Logic
  p.isBoosting = false;
  if (boostPressed && p.nitro > 0) {
    p.isBoosting = true;
    p.nitro = Math.max(0, p.nitro - 0.45);
    crazyAudio.startNitroSound();

    // Balanced thrust acceleration
    const thrust = cfg.engineTorque * 0.55;
    p.vx += Math.cos(p.angle) * thrust;
    p.vy += Math.sin(p.angle) * thrust * 0.4;

    // Rocket exhaust particles
    const exhaustX = p.x - Math.cos(p.angle) * 24;
    const exhaustY = p.y - Math.sin(p.angle) * 24 + 4;
    for (let i = 0; i < 2; i++) {
      state.particles.push({
        x: exhaustX + (Math.random() - 0.5) * 5,
        y: exhaustY + (Math.random() - 0.5) * 5,
        vx: -Math.cos(p.angle) * (4 + Math.random() * 3) + (Math.random() - 0.5) * 2,
        vy: -Math.sin(p.angle) * 2 + (Math.random() - 0.5) * 2,
        life: 12 + Math.random() * 6,
        maxLife: 18,
        color: Math.random() > 0.5 ? '#f97316' : '#38bdf8',
        size: 3 + Math.random() * 3,
        rotation: 0,
        rotSpeed: 0,
        type: 'fire',
      });
    }
  } else {
    crazyAudio.stopNitroSound();
    p.nitro = Math.min(p.maxNitro, p.nitro + 0.08);
  }

  // Smooth visual rider lean
  p.riderLean += (drive + leanInput * 1.2 - p.riderLean) * 0.15;

  // Calculate wheel positions relative to chassis
  const halfBase = cfg.wheelBase / 2;
  const rearRelX = -Math.cos(p.angle) * halfBase;
  const rearRelY = -Math.sin(p.angle) * halfBase + 12;
  const frontRelX = Math.cos(p.angle) * halfBase;
  const frontRelY = Math.sin(p.angle) * halfBase + 12;

  const rearX = p.x + rearRelX;
  const rearY = p.y + rearRelY;
  const frontX = p.x + frontRelX;
  const frontY = p.y + frontRelY;

  // Query ground under both wheels
  const rearGround = getGroundSurface(rearX, state.platforms);
  const frontGround = getGroundSurface(frontX, state.platforms);

  const rearHit =
    rearGround &&
    rearY + cfg.wheelRadius >= rearGround.surfaceY - 2 &&
    rearY - cfg.wheelRadius <= rearGround.surfaceY + 22 &&
    p.vy >= -1.5;

  const frontHit =
    frontGround &&
    frontY + cfg.wheelRadius >= frontGround.surfaceY - 2 &&
    frontY - cfg.wheelRadius <= frontGround.surfaceY + 22 &&
    p.vy >= -1.5;

  p.wheelBack.onGround = !!rearHit;
  p.wheelFront.onGround = !!frontHit;
  const anyGrounded = p.wheelBack.onGround || p.wheelFront.onGround;
  p.onGround = anyGrounded;

  // Handle crumbling platforms
  if (rearHit && rearGround.isCrumbling && !rearGround.platform.crumbleTimer) {
    rearGround.platform.crumbleTimer = 45;
  }
  if (frontHit && frontGround.isCrumbling && !frontGround.platform.crumbleTimer) {
    frontGround.platform.crumbleTimer = 45;
  }

  // Handle conveyors & boost strips
  if (rearHit && rearGround.conveyorSpeed) p.vx += rearGround.conveyorSpeed * 0.12;
  if (frontHit && frontGround.conveyorSpeed) p.vx += frontGround.conveyorSpeed * 0.12;
  if ((rearHit && rearGround.isBoost) || (frontHit && frontGround.isBoost)) {
    p.vx = Math.min(cfg.maxSpeed * cfg.nitroMultiplier, Math.max(p.vx, 8.5));
    crazyAudio.startNitroSound();
  }

  if (anyGrounded) {
    p.airTime = 0;
    p.vy = 0; // Clear vertical velocity on ground

    if (p.wheelBack.onGround && p.wheelFront.onGround) {
      // Both wheels grounded: terrain conformity
      const targetRearY = rearGround!.surfaceY - cfg.wheelRadius;
      const targetFrontY = frontGround!.surfaceY - cfg.wheelRadius;
      const targetY = (targetRearY + targetFrontY) / 2 - 12;
      p.y += (targetY - p.y) * 0.45;

      const terrainAngle = Math.atan2(targetFrontY - targetRearY, frontX - rearX);
      p.angle += (terrainAngle - p.angle) * 0.25;
      p.angularVel *= 0.55;

      // Ground drive
      if (drive > 0) {
        p.vx += cfg.engineTorque;
      } else if (drive < 0) {
        p.vx -= cfg.engineTorque * 0.75;
      }

      // Ground lean
      if (leanInput !== 0) {
        p.angularVel += leanInput * 0.015;
      }
    } else if (p.wheelBack.onGround) {
      // Rear wheel only (Wheelie)
      const targetRearY = rearGround!.surfaceY - cfg.wheelRadius;
      const dy = targetRearY - rearY;
      p.y += dy * 0.45;

      if (drive > 0) p.vx += cfg.engineTorque * 0.95;
      else if (drive < 0) p.vx -= cfg.engineTorque * 0.6;

      p.angularVel += (drive * 0.01 - leanInput * 0.02);
      p.angularVel *= 0.85;

      // Wheelie stunt tracking
      if (Math.abs(p.vx) > 2.5) {
        p.wheelieFrames++;
        if (p.wheelieFrames === 45) {
          addStuntNotification(state, 'WHEELIE MASTER! +250', 250, '#f59e0b');
          p.nitro = Math.min(p.maxNitro, p.nitro + 25);
        }
      } else {
        p.wheelieFrames = 0;
      }
    } else if (p.wheelFront.onGround) {
      // Front wheel only (Stoppie / Nose dive)
      const targetFrontY = frontGround!.surfaceY - cfg.wheelRadius;
      const dy = targetFrontY - frontY;
      p.y += dy * 0.45;

      if (drive < 0) p.vx -= cfg.engineTorque * 0.6;
      p.angularVel += (leanInput * 0.02 - drive * 0.01);
      p.angularVel *= 0.85;
      p.wheelieFrames = 0;
    }

    p.vx *= GROUND_FRICTION;

    // Bunny Hop Jump
    if (jumpPressed) {
      p.vy = cfg.jumpImpulse;
      p.onGround = false;
      p.wheelBack.onGround = false;
      p.wheelFront.onGround = false;
      crazyAudio.playJump();

      // Jump dust puff
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: p.x + (Math.random() - 0.5) * 16,
          y: p.y + 16,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2 - 0.5,
          life: 18 + Math.random() * 8,
          maxLife: 26,
          color: '#cbd5e1',
          size: 3 + Math.random() * 2,
          rotation: 0,
          rotSpeed: 0,
          type: 'smoke',
        });
      }
    }
  } else {
    // Airborne Physics
    p.airTime++;
    p.vy += GRAVITY;
    p.vx *= AIR_FRICTION;
    p.wheelieFrames = 0;

    // Mid-air flip torque: smooth, controllable rotation
    if (drive !== 0) {
      p.angularVel += drive * cfg.leanTorque * 0.85;
    }
    p.angularVel = Math.max(-0.08, Math.min(0.08, p.angularVel));
    p.angularVel *= 0.96;
    p.angle += p.angularVel;

    // Flip tracking
    p.accumulatedAngle += p.angularVel;
    if (p.accumulatedAngle >= Math.PI * 2) {
      p.accumulatedAngle -= Math.PI * 2;
      p.flipsCompleted++;
      state.flipsCount++;
      addStuntNotification(state, 'FRONTFLIP! +750', 750, '#10b981');
      p.nitro = Math.min(p.maxNitro, p.nitro + 40);
    } else if (p.accumulatedAngle <= -Math.PI * 2) {
      p.accumulatedAngle += Math.PI * 2;
      p.flipsCompleted++;
      state.flipsCount++;
      addStuntNotification(state, 'BACKFLIP! +500', 500, '#38bdf8');
      p.nitro = Math.min(p.maxNitro, p.nitro + 40);
    }
  }

  // Speed Clamping
  const effectiveMaxSpeed = p.isBoosting ? cfg.maxSpeed * cfg.nitroMultiplier : cfg.maxSpeed;
  p.vx = Math.max(-effectiveMaxSpeed, Math.min(effectiveMaxSpeed, p.vx));

  // Advance Positions
  p.x += p.vx;
  p.y += p.vy;

  // Update wheel positions and spin
  p.wheelBack.x = p.x - Math.cos(p.angle) * halfBase;
  p.wheelBack.y = p.y - Math.sin(p.angle) * halfBase + 12;
  p.wheelFront.x = p.x + Math.cos(p.angle) * halfBase;
  p.wheelFront.y = p.y + Math.sin(p.angle) * halfBase + 12;

  p.wheelBack.spin += p.vx * 0.16;
  p.wheelFront.spin += p.vx * 0.16;

  // === ROLLOVER & HEAD COLLISION (CRASH DETECTION) ===
  const headAngle = p.angle - Math.PI / 2 + p.riderLean * 0.25;
  const headX = p.x + Math.cos(headAngle) * 30;
  const headY = p.y + Math.sin(headAngle) * 30;

  // Rollover check: only if rider is upside down and head crashes into platform
  const normalizedAngle = ((p.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const isUpsideDown = normalizedAngle > Math.PI * 0.42 && normalizedAngle < Math.PI * 1.58;

  if (isUpsideDown && p.vy >= -1) {
    const headGround = getGroundSurface(headX, state.platforms);
    if (headGround && headY >= headGround.surfaceY - 4 && headY <= headGround.surfaceY + 22) {
      killPlayer(state, 'head_impact');
      return;
    }
  }

  // === OBSTACLE COLLISIONS & INTERACTION ===
  for (const obs of state.obstacles) {
    if (!obs.active) continue;

    // Collectibles (Coins & Nitro Fuel)
    if (obs.type === 'coin' && !obs.collected) {
      const dist = Math.hypot(p.x - obs.x, p.y - obs.y);
      if (dist < 32) {
        obs.collected = true;
        obs.active = false;
        state.coinsCollected++;
        state.score += 250;
        crazyAudio.playCoin();

        // Sparkle burst
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          state.particles.push({
            x: obs.x,
            y: obs.y,
            vx: Math.cos(a) * 3.5,
            vy: Math.sin(a) * 3.5,
            life: 25,
            maxLife: 25,
            color: '#facc15',
            size: 3,
            rotation: 0,
            rotSpeed: 0,
            type: 'spark',
          });
        }
      }
      continue;
    }

    if (obs.type === 'nitro_fuel' && !obs.collected) {
      const dist = Math.hypot(p.x - obs.x, p.y - obs.y);
      if (dist < 34) {
        obs.collected = true;
        obs.active = false;
        p.nitro = p.maxNitro;
        crazyAudio.playCoin();
        addStuntNotification(state, 'NITRO REFILLED!', 100, '#38bdf8');
      }
      continue;
    }

    // Spring Launch Pad
    if (obs.type === 'spring_pad') {
      const inX = p.x >= obs.x - 10 && p.x <= obs.x + obs.width + 10;
      const inY = p.y + 16 >= obs.y && p.y <= obs.y + obs.height + 15;
      if (inX && inY && p.vy >= -2) {
        p.vy = -18.5;
        p.wheelBack.vy = -18.5;
        p.wheelFront.vy = -18.5;
        p.angularVel += (Math.random() - 0.5) * 0.15;
        state.shake = 8;
        crazyAudio.playSpring();
        addStuntNotification(state, 'SUPER SPRING! +300', 300, '#a855f7');
      }
      continue;
    }

    // Explosive TNT Crate
    if (obs.type === 'tnt_crate' && !obs.exploded) {
      const dist = Math.hypot(p.x - (obs.x + obs.width / 2), p.y - (obs.y + obs.height / 2));
      if (dist < 36) {
        obs.exploded = true;
        obs.active = false;
        crazyAudio.playExplosion();
        state.shake = 22;

        // Radial blast impulse
        const blastAngle = Math.atan2(p.y - obs.y, p.x - obs.x);
        p.vx += Math.cos(blastAngle) * 14;
        p.vy = -16;
        p.angularVel += (Math.random() - 0.5) * 0.3;

        // Fiery explosion
        for (let i = 0; i < 35; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 3 + Math.random() * 9;
          state.particles.push({
            x: obs.x + 18,
            y: obs.y + 18,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd - 2,
            life: 25 + Math.random() * 20,
            maxLife: 45,
            color: Math.random() > 0.4 ? '#ea580c' : '#fbbf24',
            size: 4 + Math.random() * 5,
            rotation: 0,
            rotSpeed: 0,
            type: 'fire',
          });
        }

        // If direct high-speed smash into TNT, trigger crash!
        if (Math.abs(p.vx) > 10) {
          killPlayer(state, 'tnt_blast');
          return;
        }
      }
      continue;
    }

    // Lethal Hazards (Saws, Spikes, Hydraulic Slammers)
    let hit = false;
    if (obs.type === 'saw' || obs.type === 'swinging_saw') {
      const radius = obs.width / 2;
      const sawCx = obs.x + radius;
      const sawCy = obs.y + radius;

      const dChassis = Math.hypot(p.x - sawCx, p.y - sawCy);
      const dRear = Math.hypot(p.wheelBack.x - sawCx, p.wheelBack.y - sawCy);
      const dFront = Math.hypot(p.wheelFront.x - sawCx, p.wheelFront.y - sawCy);
      const dHead = Math.hypot(headX - sawCx, headY - sawCy);

      if (
        dChassis < radius + 14 ||
        dRear < radius + cfg.wheelRadius ||
        dFront < radius + cfg.wheelRadius ||
        dHead < radius + 10
      ) {
        hit = true;
      }
    } else if (obs.type === 'spikes') {
      if (
        p.x >= obs.x - 14 &&
        p.x <= obs.x + obs.width + 14 &&
        p.y + 14 >= obs.y &&
        p.y - 14 <= obs.y + obs.height
      ) {
        hit = true;
      }
    } else if (obs.type === 'hydraulic_press') {
      const dropY = (obs.pressProgress || 0) * (obs.pressMaxDrop || 140);
      const headTop = obs.y + dropY;
      const headBottom = headTop + obs.height;

      if (
        p.x + 18 >= obs.x &&
        p.x - 18 <= obs.x + obs.width &&
        p.y - 20 <= headBottom &&
        p.y + 18 >= headTop
      ) {
        hit = true;
      }
    }

    if (hit) {
      killPlayer(state, 'hazard');
      return;
    }
  }

  // Pit Death
  if (p.y > 660) {
    killPlayer(state, 'pit');
    return;
  }

  // Crumbling platforms timer
  for (const plat of state.platforms) {
    if (
      plat.type === 'crumbling' &&
      plat.crumbleTimer !== undefined &&
      plat.crumbleTimer > 0 &&
      !plat.crumbled
    ) {
      plat.crumbleTimer--;
      if (plat.crumbleTimer <= 0) {
        plat.crumbled = true;
      }
    }
  }

  // Checkpoints
  for (const cp of state.checkpoints) {
    if (!cp.reached && Math.hypot(p.x - cp.x, p.y - cp.y) < 60) {
      cp.reached = true;
      state.score += 500;
      crazyAudio.playCheckpoint();
      addStuntNotification(state, 'CHECKPOINT! +500', 500, '#10b981');
    }
  }

  // Finish Line Reached
  const finishX = state.stage.length - 280;
  if (p.x >= finishX && !state.finishReached) {
    state.finishReached = true;
    state.gameOver = true;

    // Star calculation (1 to 3 stars)
    let earnedStars = 1;
    if (state.deaths <= 2) earnedStars++;
    if (state.coinsCollected >= Math.floor(state.totalCoins * 0.7) || state.flipsCount >= 2) {
      earnedStars++;
    }
    state.stars = Math.min(3, earnedStars);

    const finishBonus = Math.max(1500, 6000 - state.deaths * 400 + state.coinsCollected * 200);
    state.score += finishBonus;
    crazyAudio.playVictory();
  }

  // Smooth Camera Follow
  const targetCamX = Math.max(0, p.x - state.viewportWidth * 0.35);
  state.cameraX += (targetCamX - state.cameraX) * 0.08;
  const targetCamY = Math.max(-60, Math.min(80, (p.y - 380) * 0.2));
  state.cameraY += (targetCamY - state.cameraY) * 0.08;

  // Track progress score
  state.distance = Math.max(state.distance, p.x);
  state.score = Math.max(
    state.score,
    Math.floor(state.distance * 0.5) + state.coinsCollected * 250 - state.deaths * 250
  );

  updateParticlesAndSplats(state);
}
