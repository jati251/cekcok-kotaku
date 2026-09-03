import {
  Entity,
  EntityType,
  Vector2,
  MapProp,
  PropType,
  Item,
  ItemType,
  HeroType,
  Projectile,
  TacticalBase,
  BaseAffiliation,
  Shockwave,
} from '../types';
import * as Constants from '../constants';
import {
  drawHeroGuanYu,
  drawHeroZhaoYun,
  drawHeroLuBu,
  drawHeroLuXun,
} from './heroRenderers';

export const ZOOM_LEVEL = 2.0;

export const LABEL_COLORS: Record<string, string> = {
  player: '#3b82f6',
  allied: '#38bdf8',
  grunt: '#ef4444',
  archer: '#f59e0b',
  captain: '#ec4899',
  cavalry: '#8b5cf6',
  boss: '#fbbf24',
};

export const drawShockwave = (ctx: CanvasRenderingContext2D, sw: Shockwave, camX: number, camY: number) => {
  const sx = (sw.x - camX) * ZOOM_LEVEL + ctx.canvas.width / 2;
  const sy = (sw.y - camY) * ZOOM_LEVEL + ctx.canvas.height / 2;
  const alpha = Math.max(0, 1 - sw.life / sw.maxLife);
  const r = sw.radius * ZOOM_LEVEL;

  ctx.save();
  ctx.strokeStyle = sw.color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 4 * (1 - sw.life / sw.maxLife);
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawTacticalBase = (
  ctx: CanvasRenderingContext2D,
  base: TacticalBase,
  camX: number,
  camY: number
) => {
  const sx = (base.x - camX) * ZOOM_LEVEL + ctx.canvas.width / 2;
  const sy = (base.y - camY) * ZOOM_LEVEL + ctx.canvas.height / 2;
  const r = base.radius * ZOOM_LEVEL;

  const isAllied = base.affiliation === BaseAffiliation.ALLIED;
  const ringColor = isAllied ? '#38bdf8' : '#ef4444';
  const fillColor = isAllied ? 'rgba(56, 189, 248, 0.08)' : 'rgba(239, 68, 68, 0.08)';

  // Territory Zone
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Base Center Fort
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(sx, sy, 30 * ZOOM_LEVEL, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Flag Pole
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(sx - 2, sy - 40 * ZOOM_LEVEL, 4, 40 * ZOOM_LEVEL);

  // Banner
  ctx.fillStyle = ringColor;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy - 40 * ZOOM_LEVEL);
  ctx.lineTo(sx + 28 * ZOOM_LEVEL, sy - 30 * ZOOM_LEVEL);
  ctx.lineTo(sx + 2, sy - 20 * ZOOM_LEVEL);
  ctx.closePath();
  ctx.fill();

  // Base Name & HP Bar
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(base.name, sx, sy - 46 * ZOOM_LEVEL);

  const hpWidth = 50 * ZOOM_LEVEL;
  const hpPct = Math.max(0, base.defenseHp / base.maxDefenseHp);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(sx - hpWidth / 2, sy - 12 * ZOOM_LEVEL, hpWidth, 6);
  ctx.fillStyle = ringColor;
  ctx.fillRect(sx - hpWidth / 2, sy - 12 * ZOOM_LEVEL, hpWidth * hpPct, 6);

  ctx.restore();
};

export const drawProjectile = (ctx: CanvasRenderingContext2D, proj: Projectile, pos: Vector2) => {
  const scale = ZOOM_LEVEL;
  ctx.save();
  ctx.translate(pos.x, pos.y - 25 * scale);
  ctx.rotate(Math.atan2(proj.vy, proj.vx));
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(-10 * scale, -1 * scale, 20 * scale, 2 * scale);
  ctx.fillStyle = '#d1d5db';
  ctx.beginPath();
  ctx.moveTo(10 * scale, -3 * scale);
  ctx.lineTo(14 * scale, 0);
  ctx.lineTo(10 * scale, 3 * scale);
  ctx.fill();
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 0);
  ctx.lineTo(-14 * scale, -3 * scale);
  ctx.lineTo(-12 * scale, 0);
  ctx.lineTo(-14 * scale, 3 * scale);
  ctx.fill();
  ctx.restore();
};

export const drawItem = (ctx: CanvasRenderingContext2D, item: Item, pos: Vector2) => {
  const scale = ZOOM_LEVEL;
  const bounce = Math.sin(item.bouncePhase) * 5 * scale;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(pos.x, pos.y - 15 * scale - bounce);

  if (item.type === ItemType.HEALTH_BUN) {
    const grad = ctx.createRadialGradient(0, -2 * scale, 2 * scale, 0, 0, 10 * scale);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(1, '#fcd34d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = Constants.COLORS.TEXT_HEAL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 2 * scale, 12 * scale + bounce / 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (item.type === ItemType.WINE_MUSOU) {
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-7 * scale, -8 * scale, 14 * scale, 16 * scale);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-8 * scale, -3 * scale, 16 * scale, 5 * scale);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7 * scale, -8 * scale, 14 * scale, 16 * scale);
  } else {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
};

export const drawProp = (
  ctx: CanvasRenderingContext2D,
  prop: MapProp,
  pos: Vector2,
  theme: Constants.MapThemeConfig,
  time: number
) => {
  const scale = prop.scale * ZOOM_LEVEL;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  const shadowW = prop.type === PropType.BUILDING ? 100 * scale : 22 * scale;
  const shadowH = prop.type === PropType.BUILDING ? 60 * scale : 11 * scale;
  ctx.beginPath();
  ctx.ellipse(pos.x + 8, pos.y + 4, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();

  if (prop.type === PropType.TREE) {
    ctx.fillStyle = theme.treeTrunk;
    const trunkW = 16 * scale;
    const trunkH = 35 * scale;
    ctx.fillRect(pos.x - trunkW / 2, pos.y - trunkH, trunkW, trunkH);

    const layers = 4;
    const sway = Math.sin(time * 1.5 + prop.x) * (3 * scale);
    for (let i = 0; i < layers; i++) {
      const size = prop.width * scale * (1.0 - i * 0.14);
      const yOffset = 35 * scale + i * (20 * scale);
      ctx.fillStyle = theme.treeLeavesShadow;
      ctx.beginPath();
      ctx.arc(pos.x + sway * (i + 1) * 0.4, pos.y - yOffset + 5, size / 2, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createRadialGradient(
        pos.x + sway,
        pos.y - yOffset - size / 4,
        0,
        pos.x + sway,
        pos.y - yOffset,
        size
      );
      grad.addColorStop(0, theme.treeLeavesLight);
      grad.addColorStop(1, theme.treeLeaves);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x + sway * (i + 1) * 0.4, pos.y - yOffset, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (prop.type === PropType.BUILDING) {
    const w = (prop.collisionWidth || 100) * ZOOM_LEVEL;
    const h = (prop.collisionDepth || 80) * ZOOM_LEVEL * 0.6;
    const height = 110 * ZOOM_LEVEL;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x - w / 2, pos.y - h / 2);
    ctx.lineTo(pos.x - w / 2, pos.y - h / 2 - 10 * ZOOM_LEVEL);
    ctx.lineTo(pos.x, pos.y - 10 * ZOOM_LEVEL);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = theme.buildingWall;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 10 * ZOOM_LEVEL);
    ctx.lineTo(pos.x - w / 2, pos.y - h / 2 - 10 * ZOOM_LEVEL);
    ctx.lineTo(pos.x - w / 2, pos.y - h / 2 - height);
    ctx.lineTo(pos.x, pos.y - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 10 * ZOOM_LEVEL);
    ctx.lineTo(pos.x + w / 2, pos.y - h / 2 - 10 * ZOOM_LEVEL);
    ctx.lineTo(pos.x + w / 2, pos.y - h / 2 - height);
    ctx.lineTo(pos.x, pos.y - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = theme.buildingRoof;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - height + 3);
    ctx.lineTo(pos.x - w / 2 - 6 * ZOOM_LEVEL, pos.y - h / 2 - height + 8);
    ctx.lineTo(pos.x, pos.y - height - 60 * ZOOM_LEVEL);
    ctx.lineTo(pos.x + w / 2 + 6 * ZOOM_LEVEL, pos.y - h / 2 - height + 8);
    ctx.closePath();
    ctx.fill();
  } else if (prop.type === PropType.TORCH) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(pos.x - 3 * scale, pos.y - 30 * scale, 6 * scale, 30 * scale);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(pos.x - 7 * scale, pos.y - 34 * scale, 14 * scale, 5 * scale);
    const fireFlicker = Math.sin(time * 12 + prop.x) * 3;
    const fireGrad = ctx.createRadialGradient(pos.x, pos.y - 38 * scale, 1, pos.x, pos.y - 38 * scale, 12 * scale);
    fireGrad.addColorStop(0, '#fef08a');
    fireGrad.addColorStop(0.5, '#f97316');
    fireGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - (38 + fireFlicker) * scale, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.type === PropType.BARRICADE) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(pos.x - 25 * scale, pos.y - 12 * scale, 50 * scale, 8 * scale);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pos.x - 20 * scale, pos.y);
    ctx.lineTo(pos.x - 10 * scale, pos.y - 20 * scale);
    ctx.moveTo(pos.x + 10 * scale, pos.y);
    ctx.lineTo(pos.x + 20 * scale, pos.y - 20 * scale);
    ctx.stroke();
  } else {
    const rw = prop.width * ZOOM_LEVEL;
    const rh = prop.width * 0.7 * ZOOM_LEVEL;
    ctx.fillStyle = theme.rockDark;
    ctx.beginPath();
    ctx.ellipse(pos.x + 2, pos.y + 2, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.rock;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - rh * 0.4, rw * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawEntity = (
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  pos: Vector2,
  time: number,
  isMusouActive: boolean
) => {
  const isPlayer = entity.type === EntityType.PLAYER;
  const isAllied = entity.isAllied || entity.type === EntityType.ALLIED_SOLDIER;
  const isBoss = entity.type === EntityType.BOSS;
  const isArcher = entity.type === EntityType.ENEMY_ARCHER;
  const scale = ZOOM_LEVEL;

  ctx.save();
  ctx.translate(pos.x, pos.y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (entity.isDead) {
    ctx.globalAlpha = Math.max(0, entity.deathTimer / 4);
    ctx.rotate(Math.PI / 2);
    ctx.translate(15 * scale, 0);
  }

  const facingX = Math.cos(entity.facing);
  ctx.scale(facingX > 0 ? 1 : -1, 1);
  const bounce = Math.abs(Math.sin(entity.walkFrame)) * (4 * scale);
  const idleBob = Math.sin(time * 2) * (1.5 * scale);

  // Musou Golden Flame Aura
  if (isPlayer && isMusouActive) {
    ctx.shadowBlur = 24;
    ctx.shadowColor = Constants.COLORS.MUSOU_ACTIVE;
    ctx.globalAlpha = 0.4 + Math.sin(time * 10) * 0.2;
    ctx.fillStyle = Constants.COLORS.MUSOU_ACTIVE;
    ctx.beginPath();
    ctx.arc(0, -20 * scale, 32 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  const bodyTop = -32 * scale + bounce + idleBob;
  const isAttacking = entity.attackProgress > 0;

  if (isPlayer && entity.heroType) {
    if (entity.heroType === HeroType.GUAN_YU) {
      drawHeroGuanYu(ctx, scale, bodyTop, isAttacking, entity.attackProgress);
    } else if (entity.heroType === HeroType.ZHAO_YUN) {
      drawHeroZhaoYun(ctx, scale, bodyTop, isAttacking, entity.attackProgress);
    } else if (entity.heroType === HeroType.LU_BU) {
      drawHeroLuBu(ctx, scale, bodyTop, isAttacking, entity.attackProgress);
    } else {
      drawHeroLuXun(ctx, scale, bodyTop, isAttacking, entity.attackProgress);
    }
  } else if (isBoss) {
    drawHeroLuBu(ctx, scale, bodyTop, isAttacking, entity.attackProgress);
  } else {
    const armorColor = isAllied ? '#0284c7' : isArcher ? '#ea580c' : '#dc2626';
    ctx.fillStyle = armorColor;
    ctx.fillRect(-7 * scale, bodyTop, 14 * scale, 20 * scale);

    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, bodyTop - 10 * scale, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isAllied ? '#0369a1' : '#991b1b';
    ctx.fillRect(-6 * scale, bodyTop - 16 * scale, 12 * scale, 6 * scale);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(7 * scale, bodyTop + 2 * scale, 2 * scale, 22 * scale);
  }

  // Health Bar for Officers / Boss
  if (isBoss || isPlayer) {
    const barW = isBoss ? 50 * scale : 40 * scale;
    const hpPct = Math.max(0, entity.health / entity.maxHealth);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barW / 2, bodyTop - 28 * scale, barW, 5);
    ctx.fillStyle = isPlayer ? '#38bdf8' : '#ef4444';
    ctx.fillRect(-barW / 2, bodyTop - 28 * scale, barW * hpPct, 5);
  }

  ctx.restore();
};
