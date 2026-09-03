import { BumperGameState, Car } from './types';

export function renderBumperBrawl(ctx: CanvasRenderingContext2D, state: BumperGameState) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Camera Shake
  let shakeX = 0;
  let shakeY = 0;
  if (state.screenShake > 0) {
    shakeX = (Math.random() - 0.5) * state.screenShake * 1.5;
    shakeY = (Math.random() - 0.5) * state.screenShake * 1.5;
  }

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(shakeX, shakeY);

  // Deep dark void background
  ctx.fillStyle = '#060911';
  ctx.fillRect(-50, -50, width + 100, height + 100);

  const cx = state.arenaX;
  const cy = state.arenaY;
  const radius = state.arenaRadius;

  // 1. Arena Base & Metallic Grating
  const arenaGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  arenaGrad.addColorStop(0, '#1e293b');
  arenaGrad.addColorStop(0.75, '#0f172a');
  arenaGrad.addColorStop(1, '#020617');

  ctx.fillStyle = arenaGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Arena Center Decal
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  // Grid Crosshairs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.6, cy);
  ctx.lineTo(cx + radius * 0.6, cy);
  ctx.moveTo(cx, cy - radius * 0.6);
  ctx.lineTo(cx, cy + radius * 0.6);
  ctx.stroke();

  // 2. Skid Marks
  for (const sm of state.skidMarks) {
    ctx.fillStyle = `rgba(0, 0, 0, ${sm.alpha})`;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Glowing Elastic Perimeter Bumper Ropes
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 8;
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#fef08a';
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. PowerUps
  for (const pu of state.powerUps) {
    drawPowerUp(ctx, pu.x, pu.y, pu.type, pu.pulsePhase);
  }

  // 5. Cars
  for (const car of state.cars) {
    if (car.eliminated) continue;
    drawBumperCar(ctx, car);
  }

  // 6. Shockwaves
  for (const sw of state.shockwaves) {
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = sw.alpha;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 7. Particles
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 8. Floating Combat Text
  for (const ft of state.floatingTexts) {
    const alpha = ft.life / ft.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = '900 14px monospace';
    ctx.fillStyle = ft.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}

function drawBumperCar(ctx: CanvasRenderingContext2D, c: Car) {
  ctx.save();
  ctx.translate(c.x, c.y);

  // Car Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(2, 4, c.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(c.angle);

  // Outer Heavy Rubber Bumper Ring
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Super Bumper Flaming Spikes
  if (c.superBumperTimer > 0) {
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, c.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Car Body Chassis
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.roundRect(-16, -11, 32, 22, 6);
  ctx.fill();

  // Roof Accent
  ctx.fillStyle = c.accentColor;
  ctx.beginPath();
  ctx.roundRect(-7, -7, 14, 14, 3);
  ctx.fill();

  // Windshield (facing right in local coordinate)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(3, -8, 5, 16, 2);
  ctx.fill();

  // Dual Headlights
  ctx.fillStyle = '#fef08a';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#fef08a';
  ctx.fillRect(15, -9, 3, 4);
  ctx.fillRect(15, 5, 3, 4);
  ctx.shadowBlur = 0;

  // Rear Tail Lights
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-17, -9, 2, 4);
  ctx.fillRect(-17, 5, 2, 4);

  // Shield Bubble
  if (c.shieldTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, c.radius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Player Crown / Indicator
  if (c.isPlayer) {
    ctx.rotate(-c.angle); // Un-rotate for text
    ctx.textAlign = 'center';
    ctx.font = '900 11px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#facc15';
    ctx.fillText('YOU', 0, -c.radius - 8);
  }

  ctx.restore();
}

function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'boost' | 'shield' | 'shockwave' | 'superbumper',
  phase: number
) {
  const bob = Math.sin(phase) * 3;
  const pulse = 1 + Math.sin(phase * 1.5) * 0.15;

  const colorMap = {
    boost: '#22c55e',
    shield: '#3b82f6',
    shockwave: '#06b6d4',
    superbumper: '#f97316',
  };
  const color = colorMap[type];

  ctx.save();
  ctx.translate(x, y + bob);

  // Outer glow orb
  ctx.fillStyle = color;
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(0, 0, 13 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
