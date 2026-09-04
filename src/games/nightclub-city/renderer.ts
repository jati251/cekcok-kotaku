import {
  PlacedFurniture,
  ActiveBarStation,
  Guest,
} from './types';
import { FURNITURE } from './data/furniture';

export class NightclubRenderer {
  private beatTick: number = 0;

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    placedFurniture: PlacedFurniture[],
    activeBars: Record<string, ActiveBarStation>,
    guests: Guest[],
    floorSize: number = 12
  ) {
    this.beatTick += 0.06;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Dark Club Ambience Background
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.1,
      width / 2,
      height / 2,
      width * 0.65
    );
    bgGrad.addColorStop(0, '#1e1b4b'); // Deep indigo nightclub core
    bgGrad.addColorStop(0.6, '#0f172a');
    bgGrad.addColorStop(1, '#020617');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Club Floor Grid Calculation
    // Scale and center the grid in the canvas
    const tileSize = Math.min(width / (floorSize + 4), height / (floorSize + 3));
    const offsetX = (width - floorSize * tileSize) / 2;
    const offsetY = (height - floorSize * tileSize) / 2 + 10;

    // Floor Base Tileboard
    ctx.fillStyle = '#090d16';
    ctx.fillRect(offsetX - 6, offsetY - 6, floorSize * tileSize + 12, floorSize * tileSize + 12);

    // Floor Grid Border Glow
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX - 6, offsetY - 6, floorSize * tileSize + 12, floorSize * tileSize + 12);

    // Subtle Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= floorSize; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * tileSize, offsetY);
      ctx.lineTo(offsetX + i * tileSize, offsetY + floorSize * tileSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * tileSize);
      ctx.lineTo(offsetX + floorSize * tileSize, offsetY + i * tileSize);
      ctx.stroke();
    }

    // 3. Render Dance Floors (Underneath furniture & guests)
    for (const p of placedFurniture) {
      const item = FURNITURE.find((f) => f.id === p.furnitureId);
      if (item?.category === 'dance_floor') {
        this.renderDanceFloor(ctx, offsetX, offsetY, tileSize, p, item);
      }
    }

    // 4. Sweeping Strobe Lasers from DJ Area
    this.renderLaserBeams(ctx, width, height, offsetX, offsetY, tileSize);

    // 5. Render Other Placed Furniture (Bars, DJ booths, Sofas, Speakers)
    for (const p of placedFurniture) {
      const item = FURNITURE.find((f) => f.id === p.furnitureId);
      if (item && item.category !== 'dance_floor') {
        this.renderFurnitureItem(ctx, offsetX, offsetY, tileSize, p, item, activeBars);
      }
    }

    // 6. Render Guests & Dancing Partygoers
    for (const g of guests) {
      this.renderGuest(ctx, offsetX, offsetY, tileSize, g);
    }

    // 7. Velvet Rope Entrance (Bottom Left Door)
    this.renderDoorEntrance(ctx, offsetX, offsetY, tileSize);

    ctx.restore();
  }

  private renderDanceFloor(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    placed: PlacedFurniture,
    item: typeof FURNITURE[0]
  ) {
    const x = offsetX + placed.gridX * tileSize;
    const y = offsetY + placed.gridY * tileSize;
    const w = item.width * tileSize;
    const h = item.height * tileSize;

    ctx.save();

    if (item.id === 'floor_led_rainbow') {
      // Pulsing Rainbow LED Tiles
      const pulse = (Math.sin(this.beatTick * 2) + 1) / 2;
      const hue = Math.floor((this.beatTick * 60) % 360);

      ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${0.35 + pulse * 0.4})`;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      // Neon Border Glow
      ctx.strokeStyle = `hsl(${hue}, 90%, 65%)`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    } else if (item.id === 'floor_laser_matrix') {
      // Cyber Matrix Grid
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    } else {
      // Checkered Retro Vinyl
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    }

    ctx.restore();
  }

  private renderLaserBeams(
    ctx: CanvasRenderingContext2D,
    w: number,
    _h: number,
    offsetX: number,
    offsetY: number,
    tileSize: number
  ) {
    ctx.save();
    const djX = offsetX + 7 * tileSize;
    const djY = offsetY + 1.5 * tileSize;

    // Laser sweeps with sine wave
    const sweep1 = Math.sin(this.beatTick * 1.5) * (w * 0.45);
    const sweep2 = Math.cos(this.beatTick * 1.8) * (w * 0.45);

    // Cyan Laser
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(djX, djY);
    ctx.lineTo(w / 2 + sweep1, djY + 320);
    ctx.stroke();

    // Magenta Laser
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(djX, djY);
    ctx.lineTo(w / 2 + sweep2, djY + 320);
    ctx.stroke();

    ctx.restore();
  }

  private renderFurnitureItem(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    placed: PlacedFurniture,
    item: typeof FURNITURE[0],
    activeBars: Record<string, ActiveBarStation>
  ) {
    const x = offsetX + placed.gridX * tileSize;
    const y = offsetY + placed.gridY * tileSize;
    const w = item.width * tileSize;
    const h = item.height * tileSize;

    ctx.save();

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 3, y + 3, w - 2, h - 2);

    if (item.category === 'bar') {
      // Bar Counter
      ctx.fillStyle = item.colorTheme;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
      ctx.fill();

      // Bar Rail Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bottles on bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 6, y + 5, 4, 8);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 12, y + 5, 4, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 18, y + 5, 4, 8);

      // Check if bar has active drink ready
      const station = activeBars[placed.instanceId];
      if (station) {
        if (station.isReady) {
          // Floating "Ready!" bubble
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.roundRect(x + w / 2 - 24, y - 18, 48, 16, 8);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('COLLECT!', x + w / 2, y - 7);
        } else {
          // Mixing in progress indicator
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(x + w / 2 - 20, y - 16, 40, 14, 7);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Mixing...', x + w / 2, y - 6);
        }
      }
    } else if (item.category === 'dj_booth') {
      // DJ Booth Platform
      ctx.fillStyle = item.colorTheme;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 8);
      ctx.fill();

      // Turntable platters
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + w * 0.3, y + h / 2, 10, 0, Math.PI * 2);
      ctx.arc(x + w * 0.7, y + h / 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Spinning vinyl record visual
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // DJ Figure bobbing behind decks
      const djBob = Math.sin(this.beatTick * 3) * 2;
      ctx.fillStyle = '#38bdf8'; // DJ Headphones & Shirt
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 8 + djBob, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.category === 'vip_lounge') {
      // Plush VIP Sofa
      ctx.fillStyle = item.colorTheme;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (item.category === 'audio') {
      // Subwoofer / Speaker box
      ctx.fillStyle = item.colorTheme;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 4);
      ctx.fill();

      // Speaker Cone Pulsing
      const conePulse = Math.sin(this.beatTick * 4) * 2;
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.max(4, 8 + conePulse), 0, Math.PI * 2);
      ctx.fill();
    } else if (item.id === 'light_disco_ball') {
      // Disco Ball
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 9, 0, Math.PI * 2);
      ctx.fill();

      // Mirror facets
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderGuest(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    guest: Guest
  ) {
    const x = offsetX + guest.x * tileSize + tileSize / 2;
    const y = offsetY + guest.y * tileSize + tileSize / 2;

    ctx.save();

    // Rhythmic head-bobbing animation
    const bob = Math.sin(this.beatTick * 3 + guest.danceStep) * 3;

    // Contact drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Outfit
    ctx.fillStyle = guest.color;
    ctx.beginPath();
    ctx.roundRect(x - 5, y - 8 + bob, 10, 14, 3);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, y - 14 + bob, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dancing arms
    ctx.strokeStyle = guest.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (guest.danceStep % 2 === 0) {
      ctx.moveTo(x - 6, y - 4 + bob);
      ctx.lineTo(x - 10, y - 12 + bob);
      ctx.moveTo(x + 6, y - 4 + bob);
      ctx.lineTo(x + 10, y - 2 + bob);
    } else {
      ctx.moveTo(x - 6, y - 4 + bob);
      ctx.lineTo(x - 10, y - 2 + bob);
      ctx.moveTo(x + 6, y - 4 + bob);
      ctx.lineTo(x + 10, y - 12 + bob);
    }
    ctx.stroke();

    // Floating Tip Bubble if ready to collect
    if (guest.tipReady) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y - 28, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'black 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', x, y - 28);
    }

    ctx.restore();
  }

  private renderDoorEntrance(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    tileSize: number
  ) {
    const doorX = offsetX + 1 * tileSize;
    const doorY = offsetY + 11 * tileSize;

    ctx.save();

    // Velvet Stanchions
    ctx.fillStyle = '#fbbf24'; // Brass post
    ctx.fillRect(doorX - 6, doorY, 4, 18);
    ctx.fillRect(doorX + 24, doorY, 4, 18);

    // Red Velvet Rope
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(doorX - 4, doorY + 6);
    ctx.quadraticCurveTo(doorX + 9, doorY + 12, doorX + 24, doorY + 6);
    ctx.stroke();

    // Door Bouncer Guard standing outside
    ctx.fillStyle = '#0f172a'; // Black suit
    ctx.beginPath();
    ctx.roundRect(doorX + 28, doorY - 4, 12, 18, 3);
    ctx.fill();

    // Sunglasses
    ctx.fillStyle = '#000000';
    ctx.fillRect(doorX + 31, doorY - 10, 6, 2);

    ctx.restore();
  }
}

export const nightclubRenderer = new NightclubRenderer();
