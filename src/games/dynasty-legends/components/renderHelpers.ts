import {
  Vector2,
  MapProp,
  PropType,
  Item,
  ItemType,
  Projectile,
} from '../types';
import * as Constants from '../constants';

export const ZOOM_LEVEL = 2.2;

export const LABEL_COLORS: Record<string, string> = {
  player: '#3b82f6',
  grunt: '#ef4444',
  archer: '#f59e0b',
  captain: '#ec4899',
  cavalry: '#8b5cf6',
  boss: '#fbbf24',
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
  if (item.type === ItemType.HEALTH_BUN) {
    ctx.translate(pos.x, pos.y - 15 * scale - bounce);
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
    ctx.translate(-pos.x, -(pos.y - 15 * scale - bounce));
  }
};

export const drawProp = (
  ctx: CanvasRenderingContext2D,
  prop: MapProp,
  pos: Vector2,
  theme: Constants.MapThemeConfig,
  time: number
) => {
  const scale = prop.scale * ZOOM_LEVEL;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  const shadowW = prop.type === PropType.BUILDING ? 100 * scale : 20 * scale;
  const shadowH = prop.type === PropType.BUILDING ? 60 * scale : 10 * scale;
  ctx.beginPath();
  ctx.ellipse(pos.x + 10, pos.y + 5, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();

  if (prop.type === PropType.TREE) {
    ctx.fillStyle = theme.treeTrunk;
    const trunkW = 16 * scale;
    const trunkH = 35 * scale;
    ctx.fillRect(pos.x - trunkW / 2, pos.y - trunkH, trunkW, trunkH);
    ctx.fillStyle = theme.treeTrunk;
    ctx.beginPath();
    ctx.arc(pos.x - 6 * scale, pos.y - 2 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + 6 * scale, pos.y - 3 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    const layers = 5;
    const sway = Math.sin(time * 1.5 + prop.x) * (3 * scale);
    for (let i = 0; i < layers; i++) {
      const size = prop.width * scale * (1.0 - i * 0.12);
      const yOffset = 35 * scale + i * (22 * scale);
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
      ctx.arc(pos.x + sway * (i + 1) * 0.4 - size / 2.5, pos.y - yOffset + size / 4, size / 3, 0, Math.PI * 2);
      ctx.arc(pos.x + sway * (i + 1) * 0.4 + size / 2.5, pos.y - yOffset + size / 4, size / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (prop.type === PropType.BUILDING) {
    const w = (prop.collisionWidth || 100) * ZOOM_LEVEL;
    const h = (prop.collisionDepth || 80) * ZOOM_LEVEL * 0.6;
    const height = 110 * ZOOM_LEVEL;
    ctx.fillStyle = '#44403c';
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

    ctx.fillStyle = '#c8b8a8';
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
  } else if (prop.type === PropType.ROCK) {
    const rw = prop.width * ZOOM_LEVEL;
    const rh = prop.width * 0.7 * ZOOM_LEVEL;
    ctx.fillStyle = theme.rockDark;
    ctx.beginPath();
    ctx.ellipse(pos.x + 2, pos.y + 2, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createLinearGradient(pos.x, pos.y - rh, pos.x, pos.y + rh);
    grad.addColorStop(0, theme.rockLight);
    grad.addColorStop(1, theme.rock);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pos.x - rw, pos.y);
    ctx.lineTo(pos.x - rw / 2, pos.y - rh);
    ctx.lineTo(pos.x + rw / 2, pos.y - rh * 0.8);
    ctx.lineTo(pos.x + rw, pos.y);
    ctx.lineTo(pos.x + rw / 2, pos.y + rh * 0.8);
    ctx.lineTo(pos.x - rw / 2, pos.y + rh);
    ctx.fill();
  }
};
