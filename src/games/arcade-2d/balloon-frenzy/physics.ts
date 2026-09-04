import { Balloon, BalloonGameState, BalloonType, Dart } from './types';
import { balloonAudio } from './audio';

export function createInitialBalloonState(w: number = 900, h: number = 600): BalloonGameState {
  return {
    balloons: [],
    darts: [],
    particles: [],
    floatingTexts: [],
    crosshair: { x: w / 2, y: h / 2 },
    score: 0,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    totalHits: 0,
    totalShots: 0,
    timeLeft: 45,
    started: false,
    gameOver: false,
    freezeTimer: 0,
    nextId: 1,
    spawnTimer: 0,
    windSpeed: 0.3,
    viewportWidth: w,
    viewportHeight: h,
  };
}

export function spawnBalloon(state: BalloonGameState) {
  const rand = Math.random();
  let type: BalloonType = 'standard';
  let size = 26;
  let points = 25;
  let speed = 1.6 + Math.random() * 0.8;

  if (rand < 0.08) {
    type = 'golden';
    size = 22;
    points = 100;
    speed = 2.4;
  } else if (rand < 0.18) {
    type = 'bomb';
    size = 32;
    points = 40;
    speed = 1.3;
  } else if (rand < 0.28) {
    type = 'speed';
    size = 24;
    points = 50;
    speed = 2.0;
  } else if (rand < 0.40) {
    type = 'poison';
    size = 25;
    points = -50;
    speed = 1.2;
  }

  const margin = 60;
  const x = margin + Math.random() * (Math.max(200, state.viewportWidth - margin * 2));
  const y = state.viewportHeight + size + 20;

  const balloon: Balloon = {
    id: state.nextId++,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -speed,
    type,
    size,
    points,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.04 + Math.random() * 0.03,
    popped: false,
    popTimer: 0,
    stringPoints: [
      { x: 0, y: size * 1.1 },
      { x: (Math.random() - 0.5) * 6, y: size * 1.5 },
      { x: (Math.random() - 0.5) * 8, y: size * 2.0 },
    ],
  };

  state.balloons.push(balloon);
}

export function throwDart(state: BalloonGameState, targetX: number, targetY: number) {
  if (state.gameOver || !state.started) return;

  state.totalShots++;
  balloonAudio.playDartThrow();

  // Launch dart directly at clicked target point with immediate ray-check
  const dart: Dart = {
    id: state.nextId++,
    x: targetX,
    y: targetY,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 4,
    active: true,
  };

  // Check collision with balloons at target point
  let hit = false;
  // Sort reverse so top-rendered balloon gets hit
  for (let i = state.balloons.length - 1; i >= 0; i--) {
    const b = state.balloons[i];
    if (b.popped) continue;

    const dx = targetX - b.x;
    const dy = targetY - b.y;
    // Oval hit detection
    const distSq = (dx * dx) / (b.size * b.size) + (dy * dy) / ((b.size * 1.2) * (b.size * 1.2));

    if (distSq <= 1.0) {
      popBalloon(state, b, true);
      hit = true;
      break;
    }
  }

  if (hit) {
    state.totalHits++;
    state.combo++;
    state.comboTimer = 75; // frames to maintain combo
    state.comboMultiplier = Math.min(5, 1 + Math.floor(state.combo / 4));
    if (state.combo >= 4 && state.combo % 4 === 0) {
      balloonAudio.playCombo();
    }
  } else {
    // Missed
    state.combo = 0;
    state.comboMultiplier = 1;
    addFloatingText(state, 'MISS', targetX, targetY, '#94a3b8');
  }

  state.darts.push(dart);
}

export function popBalloon(state: BalloonGameState, balloon: Balloon, _directHit: boolean) {
  if (balloon.popped) return;
  balloon.popped = true;

  // Sound & Score
  let awardedPoints = balloon.points;
  if (balloon.type === 'poison') {
    balloonAudio.playPoison();
    state.score = Math.max(0, state.score + balloon.points);
    state.combo = 0;
    state.comboMultiplier = 1;
    addFloatingText(state, `${balloon.points}`, balloon.x, balloon.y, '#f43f5e');
  } else {
    if (balloon.type === 'golden') {
      balloonAudio.playGoldenChime();
      awardedPoints *= state.comboMultiplier;
      addFloatingText(state, `+${awardedPoints} GOLD!`, balloon.x, balloon.y, '#fbbf24', 1.3);
    } else if (balloon.type === 'speed') {
      balloonAudio.playPop(1.4);
      state.freezeTimer = 240; // 4 seconds slow motion
      awardedPoints *= state.comboMultiplier;
      addFloatingText(state, `SLOW-MO!`, balloon.x, balloon.y, '#38bdf8', 1.2);
    } else if (balloon.type === 'bomb') {
      balloonAudio.playBombExplosion();
      awardedPoints *= state.comboMultiplier;
      addFloatingText(state, `BOOM!`, balloon.x, balloon.y, '#f97316', 1.4);

      // Trigger radius detonation
      const blastRadius = 180;
      for (const other of state.balloons) {
        if (other.id !== balloon.id && !other.popped) {
          const d = Math.hypot(other.x - balloon.x, other.y - balloon.y);
          if (d <= blastRadius) {
            popBalloon(state, other, false);
          }
        }
      }
    } else {
      const pitch = 0.9 + Math.random() * 0.4;
      balloonAudio.playPop(pitch);
      awardedPoints *= state.comboMultiplier;
      addFloatingText(
        state,
        state.comboMultiplier > 1 ? `+${awardedPoints} (x${state.comboMultiplier})` : `+${awardedPoints}`,
        balloon.x,
        balloon.y,
        '#4ade80'
      );
    }
    state.score += awardedPoints;
  }

  // Spawn confetti particles
  spawnConfetti(state, balloon.x, balloon.y, balloon.type);
}

function spawnConfetti(state: BalloonGameState, x: number, y: number, type: BalloonType) {
  const colors = {
    standard: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
    golden: ['#fef08a', '#facc15', '#eab308', '#ca8a04', '#ffffff'],
    bomb: ['#f97316', '#ef4444', '#78716c', '#451a03', '#fbbf24'],
    speed: ['#38bdf8', '#0284c7', '#bae6fd', '#0369a1', '#ffffff'],
    poison: ['#881337', '#be123c', '#4c0519', '#991b1b', '#1c1917'],
  }[type];

  const count = type === 'bomb' ? 36 : type === 'golden' ? 28 : 16;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * (type === 'bomb' ? 8 : 4.5);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 5,
      alpha: 1,
      life: 0,
      maxLife: 30 + Math.random() * 25,
    });
  }
}

function addFloatingText(state: BalloonGameState, text: string, x: number, y: number, color: string, scale = 1.0) {
  state.floatingTexts.push({
    id: state.nextId++,
    text,
    x,
    y,
    color,
    alpha: 1,
    vy: -1.4,
    scale,
  });
}

export function updateBalloonGame(state: BalloonGameState) {
  if (!state.started || state.gameOver) return;

  const timeScale = state.freezeTimer > 0 ? 0.35 : 1.0;
  if (state.freezeTimer > 0) state.freezeTimer--;

  // Combo timer decay
  if (state.comboTimer > 0) {
    state.comboTimer--;
    if (state.comboTimer === 0) {
      state.combo = 0;
      state.comboMultiplier = 1;
    }
  }

  // Spawning
  state.spawnTimer++;
  const spawnRate = state.freezeTimer > 0 ? 80 : 35;
  if (state.spawnTimer >= spawnRate) {
    state.spawnTimer = 0;
    spawnBalloon(state);
    // Dynamic breeze
    state.windSpeed = Math.sin(Date.now() * 0.001) * 0.7;
  }

  // Update Balloons
  for (let i = state.balloons.length - 1; i >= 0; i--) {
    const b = state.balloons[i];
    if (b.popped) {
      b.popTimer++;
      if (b.popTimer > 15) {
        state.balloons.splice(i, 1);
      }
      continue;
    }

    b.wobblePhase += b.wobbleSpeed * timeScale;
    b.x += (Math.sin(b.wobblePhase) * 1.2 + state.windSpeed) * timeScale;
    b.y += b.vy * timeScale;

    // Despawn if ascended beyond top
    if (b.y < -b.size * 2) {
      state.balloons.splice(i, 1);
    }
  }

  // Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life++;
    p.x += p.vx * timeScale;
    p.y += p.vy * timeScale;
    p.vy += 0.12 * timeScale; // Gravity
    p.vx *= 0.97;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);

    if (p.life >= p.maxLife) {
      state.particles.splice(i, 1);
    }
  }

  // Update Floating Texts
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y += ft.vy;
    ft.alpha -= 0.025;
    if (ft.alpha <= 0) {
      state.floatingTexts.splice(i, 1);
    }
  }

  // Clean old darts
  if (state.darts.length > 20) {
    state.darts.splice(0, state.darts.length - 20);
  }
}
