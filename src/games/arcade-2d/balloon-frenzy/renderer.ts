import { Balloon, BalloonGameState } from './types';

export function renderBalloonGame(ctx: CanvasRenderingContext2D, state: BalloonGameState) {
  const w = state.viewportWidth;
  const h = state.viewportHeight;

  ctx.clearRect(0, 0, w, h);

  // 1. Festive Carnival Booth Background
  drawCarnivalBackdrop(ctx, w, h);

  // 2. Hanging Bunting & Glowing Fairy Lights
  drawCarnivalCanopy(ctx, w);

  // 3. Balloons
  for (const b of state.balloons) {
    drawBalloon(ctx, b);
  }

  // 4. Confetti Particles
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Floating Text FX
  for (const ft of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.font = `900 ${Math.round(18 * ft.scale)}px "Outfit", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // 6. Crosshair Reticle
  drawCrosshair(ctx, state.crosshair.x, state.crosshair.y, state.comboMultiplier > 1);

  // 7. Slow-Mo Freeze Vignette if active
  if (state.freezeTimer > 0) {
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function drawCarnivalBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Midnight carnival sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#090514');
  skyGrad.addColorStop(0.5, '#1e1035');
  skyGrad.addColorStop(1, '#2c124d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Warm wooden backboard vertical slats
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  const slatW = 40;
  for (let x = 0; x < w; x += slatW) {
    ctx.fillRect(x, 0, 2, h);
  }
  ctx.restore();
}

function drawCarnivalCanopy(ctx: CanvasRenderingContext2D, w: number) {
  ctx.save();
  // Carnival tent stripes at very top
  const stripeW = 35;
  const canopyH = 28;
  for (let i = 0; i * stripeW < w + stripeW; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#fef08a';
    ctx.beginPath();
    ctx.moveTo(i * stripeW, 0);
    ctx.lineTo((i + 1) * stripeW, 0);
    ctx.lineTo(i * stripeW + stripeW * 0.5, canopyH);
    ctx.closePath();
    ctx.fill();
  }

  // Fairy light string
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const time = Date.now() * 0.003;
  ctx.moveTo(0, canopyH);
  for (let x = 0; x <= w; x += 45) {
    const y = canopyH + Math.sin(x * 0.05 + time) * 6;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Light bulbs
  const bulbColors = ['#f59e0b', '#ec4899', '#10b981', '#38bdf8', '#fbbf24'];
  for (let x = 20; x < w; x += 45) {
    const y = canopyH + Math.sin(x * 0.05 + time) * 6;
    const colorIdx = Math.floor(x / 45) % bulbColors.length;
    const bulbColor = bulbColors[colorIdx];

    ctx.fillStyle = bulbColor;
    ctx.shadowColor = bulbColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y + 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBalloon(ctx: CanvasRenderingContext2D, b: Balloon) {
  if (b.popped) return;
  const { x, y, size, type } = b;

  ctx.save();

  // String
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 1.1);
  for (const pt of b.stringPoints) {
    ctx.lineTo(x + pt.x, y + pt.y);
  }
  ctx.stroke();

  // Balloon body gradient & theme
  ctx.shadowBlur = 10;
  if (type === 'golden') {
    ctx.shadowColor = '#facc15';
    const grad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, size * 0.1, x, y, size * 1.2);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#eab308');
    grad.addColorStop(1, '#a16207');
    ctx.fillStyle = grad;
  } else if (type === 'bomb') {
    ctx.shadowColor = '#f97316';
    const grad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, size * 0.1, x, y, size * 1.2);
    grad.addColorStop(0, '#78716c');
    grad.addColorStop(0.6, '#292524');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
  } else if (type === 'speed') {
    ctx.shadowColor = '#38bdf8';
    const grad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, size * 0.1, x, y, size * 1.2);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
  } else if (type === 'poison') {
    ctx.shadowColor = '#e11d48';
    const grad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, size * 0.1, x, y, size * 1.2);
    grad.addColorStop(0, '#fda4af');
    grad.addColorStop(0.5, '#be123c');
    grad.addColorStop(1, '#4c0519');
    ctx.fillStyle = grad;
  } else {
    // Standard rainbow ruby
    ctx.shadowColor = '#ec4899';
    const grad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, size * 0.1, x, y, size * 1.2);
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(0.5, '#db2777');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
  }

  // Draw oval balloon
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Knot at bottom
  ctx.beginPath();
  ctx.moveTo(x - 3, y + size * 1.2);
  ctx.lineTo(x + 3, y + size * 1.2);
  ctx.lineTo(x, y + size * 1.2 + 4);
  ctx.closePath();
  ctx.fill();

  // Specular glossy highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.35, y - size * 0.35, size * 0.22, size * 0.35, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Embellishments / Icons
  if (type === 'bomb') {
    ctx.fillStyle = '#f97316';
    ctx.font = `bold ${Math.round(size * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', x, y);
  } else if (type === 'golden') {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', x, y);
  } else if (type === 'speed') {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄️', x, y);
  } else if (type === 'poison') {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', x, y);
  }

  ctx.restore();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number, frenzy: boolean) {
  ctx.save();
  const ringColor = frenzy ? '#f59e0b' : '#38bdf8';
  ctx.strokeStyle = ringColor;
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;

  // Outer crosshair ring
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();

  // Reticle lines
  ctx.beginPath();
  ctx.moveTo(x - 22, y);
  ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x, y + 22);
  ctx.stroke();

  // Center laser point
  ctx.fillStyle = frenzy ? '#f59e0b' : '#ef4444';
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
