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
  shockwaves: Shockwave[]
): {
  activeParticles: Particle[];
  activeSlashes: SlashArc[];
  activeShockwaves: Shockwave[];
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

  return {
    activeParticles: particles.filter((p) => p.life > 0),
    activeSlashes: slashes.filter((s) => s.life < s.maxLife),
    activeShockwaves: shockwaves.filter((sw) => sw.life < sw.maxLife),
  };
}

export function handleItemPickups(
  player: Entity,
  items: Item[],
  onMusouFull: () => void
): Item[] {
  return items.filter((item) => {
    if (Math.hypot(item.x - player.position.x, item.y - player.position.y) < 35) {
      if (item.type === ItemType.HEALTH_BUN) {
        player.health = Math.min(player.maxHealth, player.health + Constants.ITEM_HEAL_AMOUNT);
      } else if (item.type === ItemType.WINE_MUSOU) {
        onMusouFull();
      }
      return false;
    }
    item.bouncePhase += 0.08;
    return true;
  });
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
