import { GolfGameState, Ball } from './types';
import { COURSES, COURSE_WIDTH, COURSE_HEIGHT } from './courses';
import { miniGolfAudio } from './audio';

export const BALL_RADIUS = 7;

export function createInitialGolfState(w: number = 900, h: number = 600): GolfGameState {
  const currentCourse = COURSES[0];
  return {
    ball: {
      x: currentCourse.ballStart.x,
      y: currentCourse.ballStart.y,
      vx: 0,
      vy: 0,
      lastX: currentCourse.ballStart.x,
      lastY: currentCourse.ballStart.y,
      inHole: false,
      inWater: false,
      sinkAnim: 0,
    },
    currentHoleIndex: 0,
    strokes: 0,
    scorecard: new Array(COURSES.length).fill(0),
    aiming: false,
    aimAngle: 0,
    aimPower: 0,
    maxPower: 16,
    dragStartX: 0,
    dragStartY: 0,
    dragCurrentX: 0,
    dragCurrentY: 0,
    holeComplete: false,
    gameOver: false,
    started: false,
    particles: [],
    waterTimer: 0,
    courseScale: 1.0,
    offsetX: 0,
    offsetY: 0,
    viewportWidth: w,
    viewportHeight: h,
  };
}

export function loadHole(state: GolfGameState, index: number) {
  state.currentHoleIndex = index;
  const course = COURSES[index];
  state.ball = {
    x: course.ballStart.x,
    y: course.ballStart.y,
    vx: 0,
    vy: 0,
    lastX: course.ballStart.x,
    lastY: course.ballStart.y,
    inHole: false,
    inWater: false,
    sinkAnim: 0,
  };
  state.strokes = 0;
  state.holeComplete = false;
  state.aiming = false;
  state.particles = [];
}

export function executePutt(state: GolfGameState, power: number, angle: number) {
  if (state.holeComplete || state.gameOver) return;
  const speed = Math.min(state.maxPower, power);
  state.ball.vx = Math.cos(angle) * speed;
  state.ball.vy = Math.sin(angle) * speed;
  state.ball.lastX = state.ball.x;
  state.ball.lastY = state.ball.y;
  state.strokes++;

  miniGolfAudio.playPutt(speed / state.maxPower);
}

export function updateGolfPhysics(state: GolfGameState) {
  const ball = state.ball;
  const course = COURSES[state.currentHoleIndex];

  // Hole sink animation
  if (ball.inHole) {
    if (ball.sinkAnim < 1.0) {
      ball.sinkAnim += 0.05;
      ball.x += (course.hole.x - ball.x) * 0.2;
      ball.y += (course.hole.y - ball.y) * 0.2;
    } else if (!state.holeComplete) {
      state.holeComplete = true;
      state.scorecard[state.currentHoleIndex] = state.strokes;
      const scoreVsPar = state.strokes - course.par;
      miniGolfAudio.playHoleFanfare(scoreVsPar);

      // Spawn celebratory particles
      spawnCelebrationParticles(state, course.hole.x, course.hole.y);
    }
    updateParticles(state);
    return;
  }

  // Water hazard reset timer
  if (ball.inWater) {
    state.waterTimer++;
    if (state.waterTimer > 40) {
      ball.inWater = false;
      ball.x = ball.lastX;
      ball.y = ball.lastY;
      ball.vx = 0;
      ball.vy = 0;
      state.waterTimer = 0;
    }
    updateParticles(state);
    return;
  }

  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > 0.04) {
    // 1. Hazard friction & water test
    let friction = 0.985;
    let onSand = false;

    for (const h of course.hazards) {
      if (ball.x >= h.x && ball.x <= h.x + h.width && ball.y >= h.y && ball.y <= h.y + h.height) {
        if (h.type === 'sand') {
          friction = 0.91; // Heavy drag in bunker
          onSand = true;
        } else if (h.type === 'water') {
          ball.inWater = true;
          ball.vx = 0;
          ball.vy = 0;
          state.strokes++; // Water hazard penalty stroke
          miniGolfAudio.playWater();
          spawnWaterSplash(state, ball.x, ball.y);
          return;
        }
      }
    }

    if (onSand && Math.random() < 0.3) {
      miniGolfAudio.playSand();
    }

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= friction;
    ball.vy *= friction;

    // 2. Outer Course Boundary Collisions
    const pad = 12;
    if (ball.x - BALL_RADIUS < pad) {
      ball.x = pad + BALL_RADIUS;
      ball.vx = -ball.vx * 0.8;
      miniGolfAudio.playWallBounce(speed);
    } else if (ball.x + BALL_RADIUS > COURSE_WIDTH - pad) {
      ball.x = COURSE_WIDTH - pad - BALL_RADIUS;
      ball.vx = -ball.vx * 0.8;
      miniGolfAudio.playWallBounce(speed);
    }

    if (ball.y - BALL_RADIUS < pad) {
      ball.y = pad + BALL_RADIUS;
      ball.vy = -ball.vy * 0.8;
      miniGolfAudio.playWallBounce(speed);
    } else if (ball.y + BALL_RADIUS > COURSE_HEIGHT - pad) {
      ball.y = COURSE_HEIGHT - pad - BALL_RADIUS;
      ball.vy = -ball.vy * 0.8;
      miniGolfAudio.playWallBounce(speed);
    }

    // 3. Course Wall Collisions
    for (const wall of course.walls) {
      resolveWallCollision(ball, wall);
    }

    // 4. Hole Gravity Well & Capture
    const distToHole = Math.hypot(ball.x - course.hole.x, ball.y - course.hole.y);
    if (distToHole < course.hole.radius + 14) {
      // Pull toward center
      const pull = 0.15;
      const angle = Math.atan2(course.hole.y - ball.y, course.hole.x - ball.x);
      ball.vx += Math.cos(angle) * pull;
      ball.vy += Math.sin(angle) * pull;

      if (distToHole < course.hole.radius * 0.75 && speed < 5.8) {
        ball.inHole = true;
        ball.vx = 0;
        ball.vy = 0;
        miniGolfAudio.playCupDrop();
      }
    }
  } else {
    // Ball stopped
    ball.vx = 0;
    ball.vy = 0;
  }

  updateParticles(state);
}

function resolveWallCollision(ball: Ball, wall: { x: number; y: number; width: number; height: number; bouncy?: boolean }) {
  const closestX = Math.max(wall.x, Math.min(ball.x, wall.x + wall.width));
  const closestY = Math.max(wall.y, Math.min(ball.y, wall.y + wall.height));

  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const dist = Math.hypot(dx, dy);

  if (dist < BALL_RADIUS && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    // Push out
    ball.x = closestX + nx * BALL_RADIUS;
    ball.y = closestY + ny * BALL_RADIUS;

    // Reflect velocity
    const dot = ball.vx * nx + ball.vy * ny;
    const restitution = wall.bouncy ? 1.05 : 0.8;
    ball.vx = (ball.vx - 2 * dot * nx) * restitution;
    ball.vy = (ball.vy - 2 * dot * ny) * restitution;

    miniGolfAudio.playWallBounce(Math.hypot(ball.vx, ball.vy));
  }
}

function spawnWaterSplash(state: GolfGameState, x: number, y: number) {
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3.5;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#38bdf8',
      size: 3 + Math.random() * 3,
      alpha: 1,
      life: 0,
      maxLife: 25,
    });
  }
}

function spawnCelebrationParticles(state: GolfGameState, x: number, y: number) {
  const colors = ['#facc15', '#10b981', '#38bdf8', '#ec4899', '#f97316'];
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
      alpha: 1,
      life: 0,
      maxLife: 45,
    });
  }
}

function updateParticles(state: GolfGameState) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life++;
    p.x += p.vx;
    p.y += p.vy;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    if (p.life >= p.maxLife) {
      state.particles.splice(i, 1);
    }
  }
}
