import { Entity, EntityType } from '../types';

export const drawEnemyUnit = (
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  scale: number,
  bodyTop: number,
  time: number
) => {
  const isAttacking = entity.attackProgress > 0;
  const attackProg = entity.attackProgress;

  if (entity.type === EntityType.ENEMY_SHIELD) {
    // Heavy Tower Shield Guard
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8 * scale, bodyTop, 16 * scale, 22 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 10 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7 * scale, bodyTop - 17 * scale, 14 * scale, 7 * scale);

    // Large Tower Shield in Front
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(4 * scale, bodyTop - 5 * scale, 8 * scale, 28 * scale, 2 * scale);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Shield Boss / Emblem
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(8 * scale, bodyTop + 9 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.type === EntityType.ENEMY_CAVALRY) {
    // Mounted Cavalry Steed
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(0, bodyTop + 24 * scale, 18 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Steed Head
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(14 * scale, bodyTop + 14 * scale, 7 * scale, 4 * scale, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Rider
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-6 * scale, bodyTop + 2 * scale, 12 * scale, 16 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 6 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-5 * scale, bodyTop - 12 * scale, 10 * scale, 6 * scale);

    // Lance
    ctx.save();
    const lAngle = isAttacking ? (attackProg - 0.5) * Math.PI * 0.8 : -Math.PI / 8;
    ctx.translate(6 * scale, bodyTop + 8 * scale);
    ctx.rotate(lAngle);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -35 * scale, 2.5 * scale, 55 * scale);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-2 * scale, -35 * scale);
    ctx.lineTo(1.2 * scale, -52 * scale);
    ctx.lineTo(4 * scale, -35 * scale);
    ctx.fill();
    ctx.restore();
  } else if (entity.type === EntityType.ENEMY_BOMBER) {
    // Demolition Firepot Grenadier
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-7 * scale, bodyTop, 14 * scale, 20 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 10 * scale, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-6 * scale, bodyTop - 16 * scale, 12 * scale, 6 * scale);

    // Firepot in hand
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(10 * scale, bodyTop + 6 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Burning fuse
    const fuseSpark = Math.sin(time * 20) * 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(10 * scale + fuseSpark, bodyTop - 2 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.type === EntityType.ENEMY_SORCERER) {
    // Daoist Sorcerer
    ctx.fillStyle = '#581c87';
    ctx.fillRect(-7 * scale, bodyTop, 14 * scale, 22 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 11 * scale, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-5 * scale, bodyTop - 19 * scale, 10 * scale, 8 * scale);

    // Spell Staff with mystical orb
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8 * scale, bodyTop - 25 * scale, 2.5 * scale, 45 * scale);
    const orbGlow = 4 + Math.sin(time * 8) * 2;
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(9.2 * scale, bodyTop - 28 * scale, orbGlow * scale * 0.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.type === EntityType.ENEMY_CAPTAIN) {
    // Gate Captain with Gold Pauldrons
    ctx.fillStyle = '#831843';
    ctx.fillRect(-8 * scale, bodyTop, 16 * scale, 22 * scale);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-11 * scale, bodyTop + 2 * scale, 4 * scale, 7 * scale);
    ctx.fillRect(7 * scale, bodyTop + 2 * scale, 4 * scale, 7 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 11 * scale, 7.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9d174d';
    ctx.fillRect(-6 * scale, bodyTop - 18 * scale, 12 * scale, 7 * scale);

    // Officer Dao Sabre
    ctx.save();
    const swingAngle = isAttacking ? (attackProg - 0.5) * Math.PI * 1.5 : -Math.PI / 4;
    ctx.translate(9 * scale, bodyTop + 6 * scale);
    ctx.rotate(swingAngle);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-1.5 * scale, -32 * scale, 3 * scale, 40 * scale);
    ctx.restore();
  } else if (entity.type === EntityType.ENEMY_ARCHER) {
    // Rebel Archer with recurve bow
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-7 * scale, bodyTop, 14 * scale, 20 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 10 * scale, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(-6 * scale, bodyTop - 16 * scale, 12 * scale, 6 * scale);

    // Bow
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8 * scale, bodyTop + 4 * scale, 10 * scale, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else {
    // Rebel Grunt
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-7 * scale, bodyTop, 14 * scale, 20 * scale);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 10 * scale, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-6 * scale, bodyTop - 16 * scale, 12 * scale, 6 * scale);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(7 * scale, bodyTop + 2 * scale, 2 * scale, 22 * scale);
  }
};
