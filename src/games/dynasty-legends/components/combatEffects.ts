import {
  Particle,
  SlashArc,
  Shockwave,
  Entity,
  Item,
  ItemType,
  TacticalBase,
  MapProp,
  MapTheme,
  FireZone,
} from '../types';
import * as Constants from '../constants';
import {
  ZOOM_LEVEL,
  drawEntity,
  drawProp,
  drawItem,
  drawTacticalBase,
  drawShockwave,
  drawSlashArc,
  drawParticle,
} from './renderHelpers';

export function updateCombatEffects(
  particles: Particle[],
  slashes: SlashArc[],
  shockwaves: Shockwave[],
  fireZones: FireZone[],
  player: Entity | null
): {
  activeParticles: Particle[];
  activeSlashes: SlashArc[];
  activeShockwaves: Shockwave[];
  activeFireZones: FireZone[];
} {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }

  for (const s of slashes) {
    s.life++;
  }

  for (const sw of shockwaves) {
    sw.life++;
    sw.radius += (sw.maxRadius - sw.radius) * 0.15;
  }

  for (const fz of fireZones) {
    fz.life++;
    // If player stands in fire zone, tick damage
    if (player && !player.isDead && player.dashTimer === 0) {
      if (Math.hypot(player.position.x - fz.x, player.position.y - fz.y) < fz.radius) {
        if (fz.life % 25 === 0) {
          player.health = Math.max(0, player.health - 2);
          player.hitFlashTimer = 4;
        }
      }
    }
  }

  return {
    activeParticles: particles.filter((p) => p.life > 0),
    activeSlashes: slashes.filter((s) => s.life < s.maxLife),
    activeShockwaves: shockwaves.filter((sw) => sw.life < sw.maxLife),
    activeFireZones: fireZones.filter((fz) => fz.life < fz.maxLife),
  };
}

export function handleItemPickups(
  player: Entity,
  items: Item[],
  onMusouFull: () => void,
  onPickup?: () => void
): Item[] {
  return items.filter((item) => {
    if (Math.hypot(item.x - player.position.x, item.y - player.position.y) < 35) {
      if (item.type === ItemType.HEALTH_BUN) {
        player.health = Math.min(player.maxHealth, player.health + Constants.ITEM_HEAL_AMOUNT);
        onPickup?.();
      } else if (item.type === ItemType.WINE_MUSOU) {
        onMusouFull();
        onPickup?.();
      }
      return false;
    }
    item.bouncePhase += 0.08;
    return true;
  });
}

export function drawFireZone(
  ctx: CanvasRenderingContext2D,
  fz: FireZone,
  camX: number,
  camY: number,
  time: number
) {
  const sx = (fz.x - camX) * ZOOM_LEVEL + ctx.canvas.width / 2;
  const sy = (fz.y - camY) * ZOOM_LEVEL + ctx.canvas.height / 2;
  const alpha = Math.max(0, 1 - fz.life / fz.maxLife);
  const r = (fz.radius + Math.sin(time * 15 + fz.x) * 4) * ZOOM_LEVEL;

  ctx.save();
  const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
  grad.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.7})`);
  grad.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.5})`);
  grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderBattlefieldScene(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  bases: TacticalBase[],
  props: MapProp[],
  items: Item[],
  entities: Entity[],
  slashes: SlashArc[],
  particles: Particle[],
  shockwaves: Shockwave[],
  fireZones: FireZone[],
  mapTheme: MapTheme,
  time: number,
  isMusouActive: boolean
) {
  const halfW = ctx.canvas.width / 2;
  const halfH = ctx.canvas.height / 2;

  for (const base of bases) {
    drawTacticalBase(ctx, base, camX, camY);
  }

  const theme = Constants.MAP_THEMES[mapTheme];
  for (const prop of props) {
    const sx = (prop.x - camX) * ZOOM_LEVEL + halfW;
    const sy = (prop.y - camY) * ZOOM_LEVEL + halfH;
    if (sx < -100 || sx > ctx.canvas.width + 100 || sy < -100 || sy > ctx.canvas.height + 100) continue;
    drawProp(ctx, prop, { x: sx, y: sy }, theme, time);
  }

  // Draw burning fire zones
  for (const fz of fireZones) {
    drawFireZone(ctx, fz, camX, camY, time);
  }

  for (const item of items) {
    const sx = (item.x - camX) * ZOOM_LEVEL + halfW;
    const sy = (item.y - camY) * ZOOM_LEVEL + halfH;
    drawItem(ctx, item, { x: sx, y: sy });
  }

  const sorted = [...entities].sort((a, b) => a.position.y - b.position.y);
  for (const e of sorted) {
    const sx = (e.position.x - camX) * ZOOM_LEVEL + halfW;
    const sy = (e.position.y - camY) * ZOOM_LEVEL + halfH;
    if (sx < -100 || sx > ctx.canvas.width + 100 || sy < -100 || sy > ctx.canvas.height + 100) continue;
    drawEntity(ctx, e, { x: sx, y: sy }, time, isMusouActive);
  }

  for (const s of slashes) drawSlashArc(ctx, s, camX, camY);
  for (const p of particles) drawParticle(ctx, p, camX, camY);
  for (const sw of shockwaves) drawShockwave(ctx, sw, camX, camY);

  ctx.fillStyle = theme.fogColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
