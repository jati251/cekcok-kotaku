// Canvas renderer for Pizza Frenzy: Metro Express
import {
  Pizzeria,
  CustomerOrder,
  DeliveryScooter,
  CityBuilding,
  Particle,
  PIZZA_CONFIGS,
} from './types';

export class PizzaRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    buildings: CityBuilding[],
    pizzerias: Pizzeria[],
    orders: CustomerOrder[],
    scooters: DeliveryScooter[],
    particles: Particle[],
    hoveredPizzeriaId: string | null,
    selectedPizzeriaId: string | null,
    time: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Asphalt Ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // 2. City Road Grid Lines
    this.drawRoads(ctx, width, height);

    // 3. City Center Park
    this.drawCentralPlaza(ctx, width, height, time);

    // 4. City Buildings
    buildings.forEach((bld) => this.drawBuilding(ctx, bld));

    // 5. Four Corner Pizzerias
    pizzerias.forEach((piz) =>
      this.drawPizzeria(
        ctx,
        piz,
        hoveredPizzeriaId === piz.id,
        selectedPizzeriaId === piz.id,
        time
      )
    );

    // 6. Active Customer Orders
    orders.forEach((ord) => this.drawOrder(ctx, ord, time));

    // 7. Delivery Scooters
    scooters.forEach((s) => this.drawScooter(ctx, s));

    // 8. Particle Effects
    this.drawParticles(ctx, particles);
  }

  private static drawRoads(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 42;

    // Major Cross Highways
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Road dashed centerlines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 16]);

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.restore();
  }

  private static drawCentralPlaza(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const size = 64;

    // Green park grass
    ctx.fillStyle = '#065f46';
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

    // Park fountain
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Fountain ripple
    const ripple = (Math.sin(time * 3) + 1) * 6;
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + ripple, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private static drawBuilding(ctx: CanvasRenderingContext2D, bld: CityBuilding) {
    ctx.save();
    const bx = bld.x - bld.width / 2;
    const by = bld.y - bld.height / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(bx + 4, by + 4, bld.width, bld.height);

    // Base building
    ctx.fillStyle = bld.color;
    ctx.fillRect(bx, by, bld.width, bld.height);

    // Roof border
    ctx.fillStyle = bld.roofColor;
    ctx.fillRect(bx + 4, by + 4, bld.width - 8, bld.height - 8);

    // Windows
    ctx.fillStyle = '#fef08a';
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(bx + 8 + c * 13, by + 8 + r * 14, 6, 6);
      }
    }

    ctx.restore();
  }

  private static drawPizzeria(
    ctx: CanvasRenderingContext2D,
    piz: Pizzeria,
    isHovered: boolean,
    isSelected: boolean,
    time: number
  ) {
    ctx.save();
    ctx.translate(piz.x, piz.y);

    const pulse = isSelected ? 1 + Math.sin(time * 8) * 0.08 : 1;
    ctx.scale(pulse, pulse);

    // Outer Glow Ring
    if (isSelected || isHovered) {
      ctx.fillStyle = piz.color;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Pizzeria building disk
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 36);
    grad.addColorStop(0, piz.color);
    grad.addColorStop(1, piz.accentColor);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = isSelected ? '#ffffff' : piz.color;
    ctx.lineWidth = isSelected ? 3.5 : 2;
    ctx.stroke();

    // Pizza Icon
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piz.icon, 0, -2);

    // Pizzeria Name Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(piz.name.toUpperCase(), 0, 46);

    ctx.restore();
  }

  private static drawOrder(ctx: CanvasRenderingContext2D, order: CustomerOrder, time: number) {
    ctx.save();
    ctx.translate(order.x, order.y - 32);

    // Bounce animation
    const bounce = Math.sin(time * 6 + order.x) * 3;
    ctx.translate(0, bounce);

    const config = PIZZA_CONFIGS[order.type];

    // Patience Progress Circle Ring
    const radius = 22;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Patience Fill (Green -> Orange -> Red)
    ctx.strokeStyle =
      order.patience > 0.5 ? '#10b981' : order.patience > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * order.patience);
    ctx.stroke();

    // Speech bubble background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // VIP Sparkle Aura
    if (order.isVIP) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Pizza / Prank Icon
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (order.isPrankster) {
      ctx.fillText('😈', 0, 0);
    } else {
      const icons: Record<string, string> = {
        pepperoni: '🍕',
        margherita: '🧀',
        supreme: '🥓',
        veggie: '🥦',
      };
      ctx.fillText(icons[order.type] || '🍕', 0, 0);
    }

    // Indicator label
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = config.color;
    ctx.fillText(config.name.toUpperCase(), 0, 18);

    ctx.restore();
  }

  private static drawScooter(ctx: CanvasRenderingContext2D, s: DeliveryScooter) {
    ctx.save();
    ctx.translate(s.x, s.y);

    const angle = Math.atan2(s.targetY - s.startY, s.targetX - s.startX);
    ctx.rotate(angle);

    // Headlight beam
    const lightGrad = ctx.createLinearGradient(0, 0, 35, 0);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(35, -12);
    ctx.lineTo(35, 12);
    ctx.closePath();
    ctx.fill();

    // Scooter body
    ctx.fillStyle = s.color;
    ctx.fillRect(-10, -5, 20, 10);

    // Pizza box on rear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12, -4, 8, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-10, -2, 4, 4);

    // Wheels
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(8, 0, 4, 0, Math.PI * 2);
    ctx.arc(-8, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      if (p.type === 'text' && p.text) {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}
