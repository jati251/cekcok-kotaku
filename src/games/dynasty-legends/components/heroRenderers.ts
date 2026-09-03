export const drawHeroGuanYu = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  bodyTop: number,
  isAttacking: boolean,
  attackProg: number
) => {
  // Green Dragon Robe
  const bodyGrad = ctx.createLinearGradient(-11 * scale, bodyTop, 11 * scale, bodyTop + 26 * scale);
  bodyGrad.addColorStop(0, '#15803d');
  bodyGrad.addColorStop(0.7, '#166534');
  bodyGrad.addColorStop(1, '#14532d');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-10 * scale, bodyTop, 20 * scale, 26 * scale, 3 * scale);
  ctx.fill();

  // Gold Dragon Breastplate
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(0, bodyTop + 10 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Majestic Black Beard
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-5 * scale, bodyTop - 8 * scale);
  ctx.quadraticCurveTo(0, bodyTop + 18 * scale, 0, bodyTop + 22 * scale);
  ctx.quadraticCurveTo(0, bodyTop + 18 * scale, 5 * scale, bodyTop - 8 * scale);
  ctx.closePath();
  ctx.fill();

  // Head & Green Headdress
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(0, bodyTop - 14 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.roundRect(-8 * scale, bodyTop - 22 * scale, 16 * scale, 8 * scale, 2 * scale);
  ctx.fill();

  // Green Dragon Crescent Blade
  ctx.save();
  const swingAngle = isAttacking ? (attackProg - 0.5) * Math.PI * 1.5 : -Math.PI / 4;
  ctx.translate(10 * scale, bodyTop + 8 * scale);
  ctx.rotate(swingAngle);
  // Shaft
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-2 * scale, -45 * scale, 4 * scale, 65 * scale);
  // Dragon Curved Blade
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, -45 * scale);
  ctx.quadraticCurveTo(18 * scale, -60 * scale, 4 * scale, -80 * scale);
  ctx.quadraticCurveTo(-4 * scale, -60 * scale, 0, -45 * scale);
  ctx.closePath();
  ctx.fill();
  // Emerald Glow Trail on blade
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
};

export const drawHeroZhaoYun = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  bodyTop: number,
  isAttacking: boolean,
  attackProg: number
) => {
  // Silver Dragon Plate Armor
  const bodyGrad = ctx.createLinearGradient(-10 * scale, bodyTop, 10 * scale, bodyTop + 24 * scale);
  bodyGrad.addColorStop(0, '#f1f5f9');
  bodyGrad.addColorStop(0.5, '#cbd5e1');
  bodyGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-9 * scale, bodyTop, 18 * scale, 24 * scale, 3 * scale);
  ctx.fill();

  // Azure Silk Cape
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(-9 * scale, bodyTop + 2 * scale);
  ctx.lineTo(-16 * scale, bodyTop + 28 * scale);
  ctx.lineTo(-4 * scale, bodyTop + 26 * scale);
  ctx.closePath();
  ctx.fill();

  // Silver Helmet
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(0, bodyTop - 13 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(0, bodyTop - 16 * scale, 9 * scale, Math.PI, Math.PI * 2);
  ctx.fill();
  // Cyan Plume
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-2 * scale, bodyTop - 25 * scale, 4 * scale, 9 * scale);

  // Dragon Spear
  ctx.save();
  const spearAngle = isAttacking ? (attackProg - 0.5) * Math.PI : -Math.PI / 6;
  ctx.translate(8 * scale, bodyTop + 6 * scale);
  ctx.rotate(spearAngle);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-1.5 * scale, -55 * scale, 3 * scale, 75 * scale);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(-4 * scale, -55 * scale);
  ctx.lineTo(0, -78 * scale);
  ctx.lineTo(4 * scale, -55 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const drawHeroLuBu = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  bodyTop: number,
  isAttacking: boolean,
  attackProg: number
) => {
  // Dark Gold Dread Armor
  const bodyGrad = ctx.createLinearGradient(-13 * scale, bodyTop, 13 * scale, bodyTop + 28 * scale);
  bodyGrad.addColorStop(0, '#1e1b4b');
  bodyGrad.addColorStop(0.5, '#312e81');
  bodyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-12 * scale, bodyTop, 24 * scale, 28 * scale, 4 * scale);
  ctx.fill();

  // Gold Spiked Pauldrons
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(-14 * scale, bodyTop + 4 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.arc(14 * scale, bodyTop + 4 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Crimson Cape
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(-12 * scale, bodyTop + 3 * scale);
  ctx.lineTo(-20 * scale, bodyTop + 34 * scale);
  ctx.lineTo(0, bodyTop + 30 * scale);
  ctx.closePath();
  ctx.fill();

  // Head & Iconic Twin Pheasant Feathers
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(0, bodyTop - 14 * scale, 9 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Crown
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-7 * scale, bodyTop - 22 * scale, 14 * scale, 8 * scale);

  // Twin Red Pheasant Tail Feathers curving high
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-3 * scale, bodyTop - 22 * scale);
  ctx.quadraticCurveTo(-18 * scale, bodyTop - 50 * scale, -10 * scale, bodyTop - 65 * scale);
  ctx.moveTo(3 * scale, bodyTop - 22 * scale);
  ctx.quadraticCurveTo(18 * scale, bodyTop - 50 * scale, 10 * scale, bodyTop - 65 * scale);
  ctx.stroke();

  // Sky Piercer Halberd
  ctx.save();
  const swingAngle = isAttacking ? (attackProg - 0.5) * Math.PI * 1.8 : -Math.PI / 3;
  ctx.translate(12 * scale, bodyTop + 8 * scale);
  ctx.rotate(swingAngle);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-2.5 * scale, -55 * scale, 5 * scale, 80 * scale);
  // Halberd Spearhead & Crescent Blade
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-5 * scale, -55 * scale);
  ctx.lineTo(0, -85 * scale);
  ctx.lineTo(5 * scale, -55 * scale);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10 * scale, -65 * scale, 14 * scale, Math.PI * 0.7, Math.PI * 1.6);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#f87171';
  ctx.stroke();
  ctx.restore();
};

export const drawHeroLuXun = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  bodyTop: number,
  isAttacking: boolean,
  attackProg: number
) => {
  // Orange & White Strategist Tunic
  const bodyGrad = ctx.createLinearGradient(-9 * scale, bodyTop, 9 * scale, bodyTop + 24 * scale);
  bodyGrad.addColorStop(0, '#f97316');
  bodyGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-8 * scale, bodyTop, 16 * scale, 24 * scale, 3 * scale);
  ctx.fill();

  // Head & Scholar Cap
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(0, bodyTop - 13 * scale, 7.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c2410c';
  ctx.fillRect(-6 * scale, bodyTop - 20 * scale, 12 * scale, 7 * scale);

  // Twin Sabres
  ctx.save();
  const sAngle = isAttacking ? (attackProg - 0.5) * Math.PI * 2 : -Math.PI / 4;
  ctx.translate(6 * scale, bodyTop + 6 * scale);
  ctx.rotate(sAngle);
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(-1.5 * scale, -35 * scale, 3 * scale, 45 * scale);
  ctx.strokeStyle = '#fdba74';
  ctx.lineWidth = 2;
  ctx.strokeRect(-1.5 * scale, -35 * scale, 3 * scale, 45 * scale);
  ctx.restore();
};
