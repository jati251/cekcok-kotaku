// Deluxe Canvas Renderer with Real-time Lighting, Volumetric Headlights, 3D Pizza Art, and Metropolitan Shaders
import {
  Pizzeria,
  CustomerOrder,
  DeliveryScooter,
  CityBuilding,
  StreetLight,
  Particle,
  DistrictDefinition,
  PIZZA_CONFIGS,
} from './types';

export class PizzaRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    district: DistrictDefinition,
    buildings: CityBuilding[],
    pizzerias: Pizzeria[],
    orders: CustomerOrder[],
    scooters: DeliveryScooter[],
    streetLights: StreetLight[],
    particles: Particle[],
    hoveredPizzeriaId: string | null,
    selectedPizzeriaId: string | null,
    isFrenzyActive: boolean,
    time: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Asphalt Ground with District Theme Gradient
    const groundGrad = ctx.createLinearGradient(0, 0, width, height);
    groundGrad.addColorStop(0, district.asphaltColor);
    groundGrad.addColorStop(1, '#020617');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. City Road Network, Lanes, and Pedestrian Crosswalks
    this.drawRoadGrid(ctx, width, height);

    // 3. Central Plaza / City Landmark (Fountain or Monument)
    this.drawCentralPlaza(ctx, width, height, district, time);

    // 4. Sidewalks & Decorative Foliage
    this.drawSidewalkTrees(ctx, width, height);

    // 5. 3D Architectural Buildings with Roof Equipment and Window Lights
    buildings.forEach((bld) => this.drawBuilding(ctx, bld, time));

    // 6. Stromboli Pizzeria Hubs with Bistro Awnings and Neon Emblems
    pizzerias.forEach((piz) =>
      this.drawPizzeria(
        ctx,
        piz,
        hoveredPizzeriaId === piz.id,
        selectedPizzeriaId === piz.id,
        time
      )
    );

    // 7. Active Customer Orders with Illustrated Pizza Slices & Patience Rings
    orders.forEach((ord) => this.drawOrder(ctx, ord, time));

    // 8. Delivery Fleet Vehicles (Scooters, Vans, Choppers)
    scooters.forEach((s) => this.drawVehicle(ctx, s, time));

    // 9. Real-time Volumetric Lighting Pass (Screen Composite)
    this.drawLightingPass(ctx, width, height, streetLights, scooters, pizzerias, orders, isFrenzyActive, time);

    // 10. Particle Floaters (Tips, Confetti, Exhaust Smoke, Steam)
    this.drawParticles(ctx, particles);

    // 11. Screen Vignette & Frenzy Mode Ambient Edge Glow
    this.drawScreenAtmosphere(ctx, width, height, isFrenzyActive, time);
  }

  // --- 1. Road Network & Crosswalks ---
  private static drawRoadGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const roadWidth = 46;

    // Road Bed
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, height / 2 - roadWidth / 2, width, roadWidth);
    ctx.fillRect(width / 2 - roadWidth / 2, 0, roadWidth, height);

    // Curbs
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, height / 2 - roadWidth / 2, width, roadWidth);
    ctx.strokeRect(width / 2 - roadWidth / 2, 0, roadWidth, height);

    // Double Yellow Center Lines
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(0, height / 2 - 2);
    ctx.lineTo(width, height / 2 - 2);
    ctx.moveTo(0, height / 2 + 2);
    ctx.lineTo(width, height / 2 + 2);
    // Vertical
    ctx.moveTo(width / 2 - 2, 0);
    ctx.lineTo(width / 2 - 2, height);
    ctx.moveTo(width / 2 + 2, 0);
    ctx.lineTo(width / 2 + 2, height);
    ctx.stroke();

    // Pedestrian Zebra Crosswalks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);

    // Crosswalk bands
    const cx = width / 2;
    const cy = height / 2;
    const offset = roadWidth / 2 + 18;

    // West crosswalk
    ctx.beginPath();
    ctx.moveTo(cx - offset, cy - 18);
    ctx.lineTo(cx - offset, cy + 18);
    // East crosswalk
    ctx.moveTo(cx + offset, cy - 18);
    ctx.lineTo(cx + offset, cy + 18);
    // North crosswalk
    ctx.moveTo(cx - 18, cy - offset);
    ctx.lineTo(cx + 18, cy - offset);
    // South crosswalk
    ctx.moveTo(cx - 18, cy + offset);
    ctx.lineTo(cx + 18, cy + offset);
    ctx.stroke();

    ctx.restore();
  }

  // --- 2. Central Park / Fountain ---
  private static drawCentralPlaza(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    district: DistrictDefinition,
    time: number
  ) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const size = 70;

    // Park Lawn
    ctx.fillStyle = district.grassColor;
    ctx.beginPath();
    ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 12);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Marble Fountain Basin
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Water Surface
    const waterGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
    waterGrad.addColorStop(0, '#7dd3fc');
    waterGrad.addColorStop(0.7, '#0284c7');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Fountain Ripple Waves
    const ripple1 = (Math.sin(time * 3) + 1) * 7;
    const ripple2 = (Math.sin(time * 3 + Math.PI) + 1) * 7;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4 + ripple1, 0, Math.PI * 2);
    ctx.arc(cx, cy, 4 + ripple2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- 3. Sidewalk Foliage & Trees ---
  private static drawSidewalkTrees(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const treePositions = [
      { x: width * 0.35, y: height * 0.42 },
      { x: width * 0.65, y: height * 0.42 },
      { x: width * 0.35, y: height * 0.58 },
      { x: width * 0.65, y: height * 0.58 },
    ];

    treePositions.forEach((tp) => {
      // Tree Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(tp.x + 3, tp.y + 3, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Foliage Crown
      const foliageGrad = ctx.createRadialGradient(tp.x - 2, tp.y - 2, 2, tp.x, tp.y, 11);
      foliageGrad.addColorStop(0, '#4ade80');
      foliageGrad.addColorStop(0.6, '#16a34a');
      foliageGrad.addColorStop(1, '#14532d');
      ctx.fillStyle = foliageGrad;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // --- 4. 3D Architectural Buildings ---
  private static drawBuilding(ctx: CanvasRenderingContext2D, bld: CityBuilding, time: number) {
    ctx.save();
    const bx = bld.x - bld.width / 2;
    const by = bld.y - bld.height / 2;

    // Building Isometric Cast Shadow
    ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.fillRect(bx + 6, by + 6, bld.width, bld.height);

    // Wall Facade
    const wallGrad = ctx.createLinearGradient(bx, by, bx, by + bld.height);
    wallGrad.addColorStop(0, bld.color);
    wallGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, bld.width, bld.height, 4);
    ctx.fill();

    // Roof Parapet Border
    ctx.fillStyle = bld.roofColor;
    ctx.beginPath();
    ctx.roundRect(bx + 3, by + 3, bld.width - 6, bld.height - 6, 3);
    ctx.fill();

    // Roof Center Air Unit / Water Tower
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + bld.width / 2 - 6, by + bld.height / 2 - 5, 12, 10);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(bx + bld.width / 2, by + bld.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Illuminated Office Windows
    const cols = 3;
    const rows = Math.min(3, bld.floors);
    const winW = 6;
    const winH = 5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const isLit = bld.windowLights[idx % bld.windowLights.length];
        const wx = bx + 7 + c * 14;
        const wy = by + 6 + r * 11;

        if (isLit) {
          const blink = Math.sin(time * 2 + idx) > 0.98;
          ctx.fillStyle = blink ? '#334155' : '#fef08a';
        } else {
          ctx.fillStyle = '#1e293b';
        }
        ctx.fillRect(wx, wy, winW, winH);
      }
    }

    ctx.restore();
  }

  // --- 5. Stromboli Pizzeria Hubs ---
  private static drawPizzeria(
    ctx: CanvasRenderingContext2D,
    piz: Pizzeria,
    isHovered: boolean,
    isSelected: boolean,
    time: number
  ) {
    ctx.save();
    ctx.translate(piz.x, piz.y);

    const pulse = isSelected ? 1 + Math.sin(time * 8) * 0.08 : isHovered ? 1.05 : 1;
    ctx.scale(pulse, pulse);

    // Selected Pulsing Neon Halo
    if (isSelected || isHovered) {
      ctx.fillStyle = piz.color;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Italian Bistro Striped Awning Base
    const r = 36;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Wood-fired Oven Stone Disk
    const stoneGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r - 3);
    stoneGrad.addColorStop(0, '#fef08a');
    stoneGrad.addColorStop(0.3, piz.color);
    stoneGrad.addColorStop(1, piz.accentColor);
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
    ctx.fill();

    // Red & White Striped Bistro Awning Arcs
    ctx.save();
    ctx.clip();
    for (let a = -r; a <= r; a += 10) {
      ctx.fillStyle = ((a + r) / 10) % 2 === 0 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(220, 38, 38, 0.35)';
      ctx.fillRect(a, -r, 10, r * 2);
    }
    ctx.restore();

    // Outer Rim Border
    ctx.strokeStyle = isSelected ? '#ffffff' : piz.color;
    ctx.lineWidth = isSelected ? 3.5 : 2;
    ctx.stroke();

    // Pizzeria Center Emblem Icon
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piz.icon, 0, -1);

    // Name Banner
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-42, 40, 84, 16, 4);
    ctx.fill();
    ctx.strokeStyle = piz.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piz.name.toUpperCase(), 0, 48);

    ctx.restore();
  }

  // --- 6. Customer Orders with Illustrated Pizza Slices ---
  private static drawOrder(ctx: CanvasRenderingContext2D, order: CustomerOrder, time: number) {
    ctx.save();
    ctx.translate(order.x, order.y - 34);

    // Soft floating bobbing
    const bob = Math.sin(time * 5 + order.x * 0.1) * 3.5;
    ctx.translate(0, bob);

    const config = PIZZA_CONFIGS[order.type];

    // Patience Progress Circle Ring
    const radius = 24;
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Patience Fill (Green -> Amber -> Red Warning)
    const patCol =
      order.patience > 0.5 ? '#10b981' : order.patience > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.strokeStyle = patCol;
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * order.patience);
    ctx.stroke();

    // Speech Bubble Background
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pointer tail to building
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-5, radius - 1);
    ctx.lineTo(0, radius + 7);
    ctx.lineTo(5, radius - 1);
    ctx.closePath();
    ctx.fill();

    // VIP Customer Gold Gleam
    if (order.customerKind === 'vip') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const starRot = time * 3;
      ctx.save();
      ctx.rotate(starRot);
      ctx.fillStyle = '#fde047';
      ctx.font = '10px sans-serif';
      ctx.fillText('✨', radius - 3, 0);
      ctx.restore();
    }

    // Avatar or Pizza Icon
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (order.customerKind === 'thief') {
      ctx.fillText('🦹', 0, -1);
    } else if (order.customerKind === 'prankster') {
      ctx.fillText('😈', 0, -1);
    } else {
      ctx.fillText(config.icon, 0, -1);
    }

    // Tag Label
    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = order.customerKind === 'vip' ? '#fbbf24' : config.color;
    ctx.textAlign = 'center';
    const label = order.customerKind === 'vip' ? '⭐ VIP' : config.name.toUpperCase();
    ctx.fillText(label, 0, 20);

    ctx.restore();
  }

  // --- 7. Delivery Vehicles (Scooter, Turbo, Van, Chopper) ---
  private static drawVehicle(ctx: CanvasRenderingContext2D, s: DeliveryScooter, time: number) {
    ctx.save();
    ctx.translate(s.x, s.y);

    const angle = Math.atan2(s.targetY - s.startY, s.targetX - s.startX);
    ctx.rotate(angle);

    if (s.tier === 'chopper') {
      // Stromboli Pizza Delivery Helicopter
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail boom & rotor
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-22, -2, 12, 4);
      ctx.fillRect(-24, -6, 3, 12);

      // Spinning Main Rotor (Motion Blur)
      ctx.save();
      ctx.rotate(time * 25);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();
      ctx.restore();

      // Searchlight beam straight down
      ctx.restore();
      return;
    }

    if (s.tier === 'van') {
      // Stromboli Express Delivery Van
      ctx.fillStyle = s.color;
      ctx.fillRect(-16, -9, 32, 18);

      // Windshield
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(8, -7, 6, 14);

      // Pizza roof logo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -7, 14, 14);
      ctx.fillStyle = '#dc2626';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍕', -3, 0);

      // Wheels
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-12, -11, 6, 3);
      ctx.fillRect(-12, 8, 6, 3);
      ctx.fillRect(8, -11, 6, 3);
      ctx.fillRect(8, 8, 6, 3);

      ctx.restore();
      return;
    }

    // Classic Vespa Scooter / Turbo Moped
    // Headlight Volumetric Cone
    const beamGrad = ctx.createLinearGradient(0, 0, 42, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(42, -14);
    ctx.lineTo(42, 14);
    ctx.closePath();
    ctx.fill();

    // Chassis body
    ctx.fillStyle = s.color;
    ctx.fillRect(-10, -5, 20, 10);

    // Pizza Box on Rear Rack with red thermal stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-13, -5, 8, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-11, -5, 4, 10);

    // Front handlebars & chrome light
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, -6, 2, 12);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(9, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(7, 0, 3.5, 0, Math.PI * 2);
    ctx.arc(-7, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 8. Real-time Volumetric Lighting Pass ---
  private static drawLightingPass(
    ctx: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    streetLights: StreetLight[],
    scooters: DeliveryScooter[],
    pizzerias: Pizzeria[],
    orders: CustomerOrder[],
    isFrenzyActive: boolean,
    time: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Street Lamp Illumination Cones
    streetLights.forEach((sl) => {
      const g = ctx.createRadialGradient(sl.x, sl.y, 2, sl.x, sl.y, sl.radius);
      g.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Vehicle Headlight Ambient Ground Reflections
    scooters.forEach((s) => {
      const g = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 35);
      g.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 35, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Pizzeria Neon Rings
    pizzerias.forEach((p) => {
      const g = ctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, 65);
      g.addColorStop(0, `${p.color}55`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 65, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. VIP Calling Card Golden Radiance
    orders.forEach((ord) => {
      if (ord.customerKind === 'vip') {
        const pulse = (Math.sin(time * 6) + 1) * 10;
        const g = ctx.createRadialGradient(ord.x, ord.y - 34, 2, ord.x, ord.y - 34, 45 + pulse);
        g.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ord.x, ord.y - 34, 45 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. Frenzy Screen Flash
    if (isFrenzyActive) {
      const flash = (Math.sin(time * 8) + 1) * 0.15;
      ctx.fillStyle = `rgba(249, 115, 22, ${flash})`;
      ctx.fillRect(0, 0, _width, _height);
    }

    ctx.restore();
  }

  // --- 9. Particle Floaters (Tips, Confetti, Smoke, Steam) ---
  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'text' && p.text) {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
      } else if (p.type === 'steam') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- 10. Screen Edge Vignette & Frenzy Lighting ---
  private static drawScreenAtmosphere(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isFrenzyActive: boolean,
    time: number
  ) {
    ctx.save();
    // Subtle cinematic vignette
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.45,
      width / 2,
      height / 2,
      width * 0.75
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(2, 6, 23, 0.6)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    // Frenzy Golden Border Pulse
    if (isFrenzyActive) {
      const pulse = (Math.sin(time * 10) + 1) * 0.5;
      ctx.strokeStyle = `rgba(249, 115, 22, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
    }

    ctx.restore();
  }
}
