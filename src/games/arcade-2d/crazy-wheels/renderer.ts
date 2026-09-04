import {
  Platform,
  Obstacle,
  Checkpoint,
  Particle,
  BloodSplat,
  PlayerState,
  GameState,
  RagdollPart,
  VEHICLES,
  StageTheme,
} from './types';

// Multi-layered Parallax Backgrounds
export function drawBackground(ctx: CanvasRenderingContext2D, state: GameState) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const camX = state.cameraX;
  const theme = state.stage.theme;

  if (theme === 'meadow') {
    // Sunny Meadow Sky
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.55, '#bae6fd');
    grad.addColorStop(1, '#86efac');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Distant Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const cloudOffset = camX * 0.18;
    for (let i = 0; i < 18; i++) {
      const cx = i * 420 - (cloudOffset % 420);
      const cy = 40 + ((i * 137) % 90);
      drawCloud(ctx, cx, cy, 34 + (i % 3) * 16);
    }

    // Distant Blue Mountains
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(0, h);
    const mtnOffset = camX * 0.35;
    for (let i = 0; i < 24; i++) {
      const mx = i * 360 - (mtnOffset % 360);
      const my = h - 220 + Math.sin(i * 1.8) * 65;
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Rolling Lush Green Hills
    ctx.fillStyle = '#4ade80';
    const hillOffset = camX * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 28; i++) {
      const hx = i * 300 - (hillOffset % 300);
      const hy = h - 160 + Math.sin(i * 1.5) * 48;
      ctx.lineTo(hx, hy);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

  } else if (theme === 'industrial') {
    // Grimy Dusk Smog Sky
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.6, '#334155');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Distant Factory Silhouettes & Smokestacks
    ctx.fillStyle = '#1e293b';
    const factoryOffset = camX * 0.3;
    for (let i = 0; i < 16; i++) {
      const fx = i * 400 - (factoryOffset % 400);
      ctx.fillRect(fx, h - 260, 110, 260);
      // Smokestack
      ctx.fillRect(fx + 75, h - 340, 22, 100);
      // Warning red beacon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(fx + 86, h - 345, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
    }

    // Midground Steel Girders & Piping
    ctx.fillStyle = '#1e293b';
    const girderOffset = camX * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 22; i++) {
      const gx = i * 280 - (girderOffset % 280);
      const gy = h - 180 + ((i * 37) % 60);
      ctx.lineTo(gx, gy);
      ctx.lineTo(gx + 120, gy - 20);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

  } else {
    // Volcanic Apex Sky
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#450a0a');
    grad.addColorStop(0.55, '#7f1d1d');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Distant Volcanic Jagged Crags
    ctx.fillStyle = '#1c1917';
    const cragOffset = camX * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 20; i++) {
      const cx = i * 340 - (cragOffset % 340);
      const cy = h - 250 + ((i * 73) % 90);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + 170, cy - 80);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Foreground Lava Glow
    const lavaGrad = ctx.createLinearGradient(0, h - 100, 0, h);
    lavaGrad.addColorStop(0, 'rgba(234, 88, 12, 0)');
    lavaGrad.addColorStop(1, 'rgba(234, 88, 12, 0.45)');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, h - 100, w, 100);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
  ctx.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

// Platforms Rendering with Theme Variations
export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  camX: number,
  camY: number,
  theme: StageTheme
) {
  const sx = p.x - camX;
  const sy = p.y - camY;
  const w = ctx.canvas.width;
  if (sx + p.width < -80 || sx > w + 80) return;

  if (p.type === 'ramp') {
    // Ramp Surface
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy + p.height);
    ctx.lineTo(sx + p.width, sy);
    ctx.lineTo(sx + p.width, sy + p.height);
    ctx.closePath();

    if (theme === 'industrial') {
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (theme === 'volcano') {
      ctx.fillStyle = '#292524';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

  } else if (p.type === 'crumbling') {
    if (p.crumbled) return;
    const alpha = p.crumbleTimer ? Math.max(0.2, p.crumbleTimer / 45) : 1;
    const shakeOffset = p.crumbleTimer ? (Math.random() - 0.5) * 4 : 0;

    ctx.save();
    ctx.translate(shakeOffset, 0);
    ctx.fillStyle = `rgba(120, 113, 108, ${alpha})`;
    ctx.fillRect(sx, sy, p.width, p.height);
    ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, p.width, p.height);

    // Cracks
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy + 3);
    ctx.lineTo(sx + 28, sy + p.height - 4);
    ctx.lineTo(sx + 45, sy + 5);
    ctx.stroke();
    ctx.restore();

  } else if (p.type === 'conveyor') {
    // Animated Conveyor Belt
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx, sy, p.width, p.height);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, p.width, p.height);

    // Rolling treads
    const speed = p.conveyorSpeed || 4;
    const offset = (Date.now() * 0.04 * speed) % 20;
    ctx.fillStyle = speed > 0 ? '#38bdf8' : '#fb923c';
    for (let cx = sx + offset; cx < sx + p.width - 5; cx += 20) {
      if (cx >= sx) {
        ctx.fillRect(cx, sy + 2, 6, p.height - 4);
      }
    }

  } else if (p.type === 'boost_strip') {
    // Hyper Boost Strip with glowing neon chevrons
    const grad = ctx.createLinearGradient(sx, sy, sx + p.width, sy);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, p.width, p.height);

    // Chevrons
    ctx.fillStyle = '#ffffff';
    const animOffset = (Date.now() * 0.08) % 30;
    for (let bx = sx + animOffset; bx < sx + p.width - 15; bx += 30) {
      if (bx >= sx) {
        ctx.beginPath();
        ctx.moveTo(bx, sy + 2);
        ctx.lineTo(bx + 12, sy + p.height / 2);
        ctx.lineTo(bx, sy + p.height - 2);
        ctx.closePath();
        ctx.fill();
      }
    }

  } else {
    // Standard Ground Box
    ctx.save();
    if (theme === 'industrial') {
      const grad = ctx.createLinearGradient(sx, sy, sx, sy + p.height);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, p.width, p.height);

      // Hazard caution stripes on top
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(sx, sy, p.width, 7);
      ctx.fillStyle = '#0f172a';
      for (let x = sx; x < sx + p.width; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, sy);
        ctx.lineTo(x + 9, sy);
        ctx.lineTo(x + 3, sy + 7);
        ctx.lineTo(x - 6, sy + 7);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'volcano') {
      const grad = ctx.createLinearGradient(sx, sy, sx, sy + p.height);
      grad.addColorStop(0, '#292524');
      grad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, p.width, p.height);

      // Lava border top
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx, sy, p.width, 5);
      ctx.fillStyle = '#ea580c';
      for (let x = sx; x < sx + p.width; x += 12) {
        ctx.fillRect(x, sy, 5, 8);
      }
    } else {
      // Meadow Green & Rich Soil
      const grad = ctx.createLinearGradient(sx, sy, sx, sy + p.height);
      grad.addColorStop(0, '#78350f');
      grad.addColorStop(0.2, '#854d0e');
      grad.addColorStop(1, '#451a03');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, p.width, p.height);

      // Grass top
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(sx, sy, p.width, 6);
      ctx.fillStyle = '#16a34a';
      for (let x = sx; x < sx + p.width; x += 8) {
        ctx.fillRect(x, sy - 4, 4, 6);
      }
    }
    ctx.restore();
  }
}

// Obstacles Rendering
export function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, camX: number, camY: number) {
  const sx = obs.x - camX;
  const sy = obs.y - camY;
  const w = ctx.canvas.width;
  if (sx + obs.width < -60 || sx > w + 60) return;

  if (obs.type === 'saw' || obs.type === 'swinging_saw') {
    const radius = obs.width / 2;
    const cx = sx + radius;
    const cy = sy + radius;

    // Draw chain for swinging saw
    if (obs.type === 'swinging_saw' && obs.pivotX && obs.pivotY) {
      const px = obs.pivotX - camX;
      const py = obs.pivotY - camY;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Pivot mount
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rotating Saw Blade
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(obs.angle || 0);

    // Inner blade
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sharp Teeth
    ctx.fillStyle = '#94a3b8';
    const teeth = 14;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (radius - 4), Math.sin(a) * (radius - 4));
      ctx.lineTo(Math.cos(a + 0.14) * radius, Math.sin(a + 0.14) * radius);
      ctx.lineTo(Math.cos(a + 0.28) * (radius - 4), Math.sin(a + 0.28) * (radius - 4));
      ctx.closePath();
      ctx.fill();
    }

    // Blood splatters on blade
    ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
    ctx.beginPath();
    ctx.arc(radius * 0.4, 0, 4, 0, Math.PI * 2);
    ctx.arc(-radius * 0.3, radius * 0.3, 5, 0, Math.PI * 2);
    ctx.fill();

    // Center Hub Bolt
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

  } else if (obs.type === 'spikes') {
    const count = Math.floor(obs.width / 14);
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    for (let i = 0; i < count; i++) {
      const bx = sx + i * 14;
      ctx.beginPath();
      ctx.moveTo(bx, sy + obs.height);
      ctx.lineTo(bx + 7, sy);
      ctx.lineTo(bx + 14, sy + obs.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blood-tipped red spike
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(bx + 4, sy + 7);
      ctx.lineTo(bx + 7, sy);
      ctx.lineTo(bx + 10, sy + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
    }

  } else if (obs.type === 'hydraulic_press') {
    const maxDrop = obs.pressMaxDrop || 140;
    const currentY = sy + (obs.pressProgress || 0) * maxDrop;

    // Fixed Top Mount
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx - 10, sy - 15, obs.width + 20, 20);

    // Steel Shaft
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(sx + obs.width / 2 - 12, sy, 24, currentY - sy + 10);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(sx + obs.width / 2 - 12, sy, 24, currentY - sy + 10);

    // Heavy Stomper Head
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx, currentY, obs.width, obs.height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, currentY, obs.width, obs.height);

    // Caution stripes on press head
    ctx.fillStyle = '#f59e0b';
    for (let cx = sx; cx < sx + obs.width; cx += 16) {
      ctx.fillRect(cx, currentY + 4, 8, obs.height - 8);
    }

    // Warning flashing strobe
    if ((obs.pressProgress || 0) < 0.2) {
      ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(sx + obs.width / 2, currentY + obs.height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (obs.type === 'spring_pad') {
    // Base plate
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx, sy + obs.height - 5, obs.width, 5);

    // Coiled spring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + obs.height - 5);
    ctx.lineTo(sx + obs.width - 8, sy + obs.height - 10);
    ctx.lineTo(sx + 8, sy + 5);
    ctx.lineTo(sx + obs.width - 8, sy + 3);
    ctx.stroke();

    // Top Bumper Pad
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(sx + 2, sy, obs.width - 4, 6);

  } else if (obs.type === 'tnt_crate' && !obs.exploded) {
    // Red Wooden TNT Crate
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(sx, sy, obs.width, obs.height);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, obs.width, obs.height);

    // TNT Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TNT', sx + obs.width / 2, sy + obs.height / 2 + 4);

    // Sparkling fuse
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + obs.width / 2, sy);
    ctx.quadraticCurveTo(sx + obs.width / 2 + 6, sy - 8, sx + obs.width / 2 + 10, sy - 6);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(sx + obs.width / 2 + 10, sy - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (obs.type === 'coin' && !obs.collected) {
    // Gleaming Star Coin
    const cx = sx + obs.width / 2;
    const cy = sy + obs.height / 2;
    const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, 1);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, 3.5);
    ctx.restore();

  } else if (obs.type === 'nitro_fuel' && !obs.collected) {
    // Glowing Nitro Canister
    const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
    ctx.save();
    ctx.translate(sx + obs.width / 2, sy + obs.height / 2);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-10, -14, 20, 28);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -14, 20, 28);

    // Cap
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-5, -17, 10, 3);

    // Lightning symbol
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(-2, 8);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Vehicle & Rider Rendering
export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState, camX: number, camY: number) {
  const px = p.x - camX;
  const py = p.y - camY;
  const cfg = VEHICLES[p.vehicleType];
  const halfBase = cfg.wheelBase / 2;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(p.angle);

  // Invincibility flashing
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 6) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  // Nitro Boost Exhaust Flame
  if (p.isBoosting) {
    ctx.save();
    const flameLen = 22 + Math.random() * 12;
    const flameGrad = ctx.createLinearGradient(-halfBase, 6, -halfBase - flameLen, 6);
    flameGrad.addColorStop(0, '#fde047');
    flameGrad.addColorStop(0.4, '#f97316');
    flameGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-halfBase, 0);
    ctx.lineTo(-halfBase - flameLen, 6);
    ctx.lineTo(-halfBase, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (p.vehicleType === 'bmx') {
    // === BMX DAREDEVIL ===
    // Bike Frame
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-halfBase, 12);
    ctx.lineTo(0, 4);
    ctx.lineTo(16, -10);
    ctx.lineTo(halfBase, 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-halfBase, 12);
    ctx.lineTo(-8, -12);
    ctx.lineTo(16, -10);
    ctx.stroke();

    // Saddle & Handlebars
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -15, 14, 5);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, -10);
    ctx.lineTo(14, -18);
    ctx.lineTo(20, -18);
    ctx.stroke();

  } else if (p.vehicleType === 'wheelchair') {
    // === ROCKET WHEELCHAIR ===
    // Metal Chair Structure
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -18, 26, 6); // Seat base
    ctx.fillRect(-18, -32, 6, 20); // Backrest

    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-halfBase, 12);
    ctx.lineTo(-14, -12);
    ctx.lineTo(halfBase, 12);
    ctx.stroke();

    // Dual Rocket Thrusters on Back
    ctx.fillStyle = '#475569';
    ctx.fillRect(-28, -26, 14, 8);
    ctx.fillRect(-28, -14, 14, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-30, -25, 3, 6);
    ctx.fillRect(-30, -13, 3, 6);

  } else {
    // === TURBO DIRT BIKE ===
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-halfBase, 12);
    ctx.lineTo(-4, 0);
    ctx.lineTo(18, -12);
    ctx.lineTo(halfBase, 12);
    ctx.stroke();

    // Body Fairing
    ctx.fillStyle = cfg.accentColor;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(18, -12);
    ctx.lineTo(12, 2);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();

    // Long Seat
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -15, 22, 5);

    // Front Headlight Plate & Bars
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.lineTo(16, -20);
    ctx.lineTo(22, -20);
    ctx.stroke();
  }

  // Draw Wheels
  drawWheel(ctx, -halfBase, 12, cfg.wheelRadius, p.wheelBack.spin);
  drawWheel(ctx, halfBase, 12, cfg.wheelRadius, p.wheelFront.spin);

  // Draw Animated Rider Stickman
  const lean = p.riderLean * 6;
  // Torso
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(4 + lean, -30);
  ctx.stroke();

  // Head & Helmet
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(6 + lean, -37, 7, 0, Math.PI * 2);
  ctx.fill();

  // Helmet with Visor
  ctx.fillStyle = cfg.accentColor;
  ctx.beginPath();
  ctx.arc(6 + lean, -39, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4 + lean, -41, 7, 4);

  // Arms to Handlebars
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4 + lean, -26);
  ctx.lineTo(18, -18);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(-1, -2);
  ctx.stroke();

  ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);

  // Tire rubber
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Metal rim
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.fill();

  // Spokes
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(a) * (r - 3), -Math.sin(a) * (r - 3));
    ctx.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
    ctx.stroke();
  }

  // Hub Center
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Ragdoll Dismemberment Rendering
export function drawRagdoll(ctx: CanvasRenderingContext2D, parts: RagdollPart[], camX: number, camY: number) {
  for (const part of parts) {
    const px = part.x - camX;
    const py = part.y - camY;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(part.angle);

    if (part.type === 'head') {
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(0, 0, part.radius, 0, Math.PI * 2);
      ctx.fill();

      // Shocked face
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(2, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(2, 2, 1.5, 0, Math.PI * 2);
      ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (part.type === 'helmet') {
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(0, 0, part.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, -part.radius, 4, part.radius * 2);

    } else if (part.type === 'wheel_front' || part.type === 'wheel_back') {
      drawWheel(ctx, 0, 0, part.radius, part.angle);

    } else if (part.type === 'frame') {
      ctx.strokeStyle = part.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, -10);
      ctx.closePath();
      ctx.stroke();

    } else {
      // Limbs & Torso
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.roundRect(-part.radius, -part.radius * 0.6, part.radius * 2, part.radius * 1.2, 3);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Checkpoint Rendering
export function drawCheckpoint(ctx: CanvasRenderingContext2D, cp: Checkpoint, camX: number, camY: number) {
  const sx = cp.x - camX;
  const sy = cp.y - camY;
  const w = ctx.canvas.width;
  if (sx < -40 || sx > w + 40) return;

  const color = cp.reached ? '#22c55e' : '#f59e0b';
  // Pole
  ctx.fillStyle = '#64748b';
  ctx.fillRect(sx - 2, sy - 54, 4, 54);

  // Flag
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy - 54);
  ctx.lineTo(sx + 30, sy - 42);
  ctx.lineTo(sx + 2, sy - 30);
  ctx.closePath();
  ctx.fill();

  if (cp.reached) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✓', sx + 14, sy - 39);
  }
}

// Particles Rendering
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camX: number, camY: number) {
  for (const particle of particles) {
    const px = particle.x - camX;
    const py = particle.y - camY;
    const alpha = particle.life / particle.maxLife;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;

    if (particle.type === 'blood') {
      ctx.beginPath();
      ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Blood Splats
export function drawBloodSplats(ctx: CanvasRenderingContext2D, splats: BloodSplat[], camX: number, camY: number) {
  for (const s of splats) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    ctx.fillStyle = `rgba(185, 28, 28, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Stunt Popups
export function drawStunts(ctx: CanvasRenderingContext2D, stunts: GameState['stuntNotifications'], camX: number, camY: number) {
  for (const st of stunts) {
    const sx = st.x - camX;
    const sy = st.y - camY;
    const alpha = Math.min(1, st.life / 20);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'black 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = st.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = st.color;
    ctx.fillText(st.text, sx, sy);
    ctx.restore();
  }
}

// Main Render Loop
export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Apply Screen Shake
  ctx.save();
  if (state.shake > 0) {
    const ox = (Math.random() - 0.5) * state.shake;
    const oy = (Math.random() - 0.5) * state.shake;
    ctx.translate(ox, oy);
  }

  const camX = state.cameraX;
  const camY = state.cameraY;

  drawBackground(ctx, state);
  drawBloodSplats(ctx, state.bloodSplats, camX, camY);

  for (const p of state.platforms) drawPlatform(ctx, p, camX, camY, state.stage.theme);
  for (const cp of state.checkpoints) drawCheckpoint(ctx, cp, camX, camY);
  for (const obs of state.obstacles) drawObstacle(ctx, obs, camX, camY);

  drawParticles(ctx, state.particles, camX, camY);

  if (state.player.alive) {
    drawPlayer(ctx, state.player, camX, camY);
  } else {
    drawRagdoll(ctx, state.player.ragdollParts, camX, camY);
    // Crash Respawn Text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.fillText('CRASHED! RESPAWNING...', w / 2, h / 2 - 25);
    ctx.restore();
  }

  drawStunts(ctx, state.stuntNotifications, camX, camY);
  ctx.restore(); // restore screen shake

  // Top Minimal In-Game Track Progress HUD
  const progress = Math.min(1, state.player.x / (state.stage.length - 280));
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(w / 2 - 120, 10, 240, 18);
  ctx.fillStyle = progress > 0.95 ? '#22c55e' : '#38bdf8';
  ctx.fillRect(w / 2 - 120, 10, 240 * progress, 18);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(w / 2 - 120, 10, 240, 18);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.stage.name.toUpperCase()} - ${Math.floor(progress * 100)}%`, w / 2, 23);

  // Nitro Meter HUD (Bottom Left)
  const nitroWidth = 140;
  const nitroRatio = state.player.nitro / state.player.maxNitro;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(20, h - 34, nitroWidth, 16);
  const nitroGrad = ctx.createLinearGradient(20, 0, 20 + nitroWidth, 0);
  nitroGrad.addColorStop(0, '#0284c7');
  nitroGrad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = nitroGrad;
  ctx.fillRect(20, h - 34, nitroWidth * nitroRatio, 16);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, h - 34, nitroWidth, 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`⚡ NITRO: ${Math.floor(nitroRatio * 100)}% [SHIFT/X]`, 26, h - 22);

  // Speedometer HUD (Bottom Right)
  const speedKmh = Math.floor(Math.abs(state.player.vx) * 7.5);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(w - 120, h - 34, 100, 16);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(w - 120, h - 34, 100, 16);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${speedKmh} KM/H`, w - 70, h - 22);
}
