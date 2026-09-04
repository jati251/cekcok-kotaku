import { OwnedCar, CarModel, ActiveServiceBay } from './types';
import { CAR_CATALOG } from './data/cars';

export class CarTownRenderer {
  private animationFrame: number = 0;

  public renderGarage(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ownedCars: OwnedCar[],
    activeCarId: string,
    bays: ActiveServiceBay[],
    decor: { flooring: string; lift: string; neon: string; toolbox: string },
    garageLevel: number
  ) {
    this.animationFrame++;
    ctx.clearRect(0, 0, width, height);

    // 1. Garage Architecture (Walls & Flooring)
    this.drawGarageWalls(ctx, width, height, decor.neon, garageLevel);
    this.drawGarageFloor(ctx, width, height, decor.flooring);

    // 2. Garage Equipment & Decor (Toolboxes, Lifts, Tire Racks)
    this.drawToolboxesAndRacks(ctx, width, height, decor.toolbox);

    // 3. Service Bays & Parked Cars
    const bayCount = Math.min(4, 2 + Math.floor(garageLevel / 3));
    const bayWidth = width / (bayCount + 1);

    for (let i = 0; i < bayCount; i++) {
      const bayX = bayWidth * (i + 0.85);
      const bayY = height * 0.62;
      const bay = bays.find((b) => b.bayId === i);
      const car = ownedCars[i];

      // Draw Hydraulic Car Lift
      this.drawLift(ctx, bayX, bayY, decor.lift, bay?.currentJob !== null);

      if (car) {
        const model = CAR_CATALOG.find((m) => m.id === car.modelId);
        const isSelected = car.id === activeCarId;
        const carY = bay?.currentJob ? bayY - 35 : bayY; // elevated on lift if being serviced

        // Highlight ring if active car
        if (isSelected) {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(bayX, bayY + 30, 95, 30, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Draw Car
        this.drawStylizedCar(ctx, bayX, carY, car, model);

        // Name & Rating Tag
        ctx.save();
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(car.nickname || model?.name || 'Project Ride', bayX, carY + 45);

        // Status badge: Dirty or In Service
        if (bay?.currentJob) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = '10px Inter, sans-serif';
          ctx.fillText(`🔧 ${bay.currentJob.title}`, bayX, carY + 60);
        } else if (car.dirtLevel > 40) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '10px Inter, sans-serif';
          ctx.fillText(`🧼 Dusty (${car.dirtLevel}%)`, bayX, carY + 60);
        }
        ctx.restore();
      } else {
        // Empty Bay Marker
        ctx.save();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.ellipse(bayX, bayY + 15, 80, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(`Bay ${i + 1} (Empty)`, bayX, bayY + 18);
        ctx.restore();
      }
    }

    // 4. Floating Mechanic Bubbles
    this.drawMechanicWork(ctx, width, height, bays);
  }

  // Draw Garage Wall
  private drawGarageWalls(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    neonType: string,
    garageLevel: number
  ) {
    const wallHeight = height * 0.45;

    // Dark brick wall gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 0, wallHeight);
    wallGrad.addColorStop(0, '#0f172a');
    wallGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, wallHeight);

    // Subtle horizontal wall panel lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    for (let y = 30; y < wallHeight; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Top Overhead Steel Beam
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, 18);

    // Neon Signs on back wall
    ctx.save();
    const neonGlowPulse = Math.sin(this.animationFrame * 0.05) * 4 + 10;
    ctx.shadowBlur = neonGlowPulse;

    // Main Logo: "CAR TOWN"
    ctx.font = '900 24px Montserrat, Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText('⚡ CAR TOWN SPEED SHOP ⚡', width / 2, 55);

    // Subtitle Garage Prestige
    ctx.font = '600 11px Inter, sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`GARAGE LEVEL ${garageLevel} • PERFORMANCE HEADQUARTERS`, width / 2, 75);

    // Bonus Neon Decor
    if (neonType === 'neon_route66') {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#f59e0b';
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🇺🇸 ROUTE 66', width * 0.2, 100);
    } else if (neonType === 'neon_turbo') {
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#cffafe';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🌀 TWIN TURBO BOOST', width * 0.2, 100);
    }

    ctx.restore();
  }

  // Draw Garage Floor
  private drawGarageFloor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    floorType: string
  ) {
    const floorY = height * 0.45;
    const floorHeight = height - floorY;

    if (floorType === 'floor_checkered') {
      // Checkered Tile Floor
      const tileSize = 40;
      for (let y = floorY; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
          const isWhite = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#1e293b' : '#0f172a';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    } else if (floorType === 'floor_metallic') {
      // Diamond Plate Steel
      const grad = ctx.createLinearGradient(0, floorY, 0, height);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, floorY, width, floorHeight);

      // Steel grid lines
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, floorY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    } else {
      // Polished Concrete with Epoxy Reflection
      const grad = ctx.createLinearGradient(0, floorY, 0, height);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.3, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, floorY, width, floorHeight);
    }

    // Floor horizon line & caution striped curb
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, floorY - 3, width, 6);

    // Yellow/Black Caution tape along the wall base
    const stripeWidth = 20;
    for (let x = 0; x < width; x += stripeWidth * 2) {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(x, floorY - 6);
      ctx.lineTo(x + stripeWidth, floorY - 6);
      ctx.lineTo(x + stripeWidth - 6, floorY);
      ctx.lineTo(x - 6, floorY);
      ctx.fill();
    }
  }

  // Draw Toolboxes & Tire Racks
  private drawToolboxesAndRacks(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    toolboxType: string
  ) {
    const wallBaseY = height * 0.45;

    // Red or Black Rolling Toolbox on the left
    const boxColor = toolboxType === 'toolbox_black_pro' ? '#0f172a' : '#dc2626';
    const boxX = 35;
    const boxY = wallBaseY - 65;

    ctx.save();
    // Toolbox body
    ctx.fillStyle = boxColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, 55, 65);
    ctx.strokeRect(boxX, boxY, 55, 65);

    // Drawers with chrome handles
    for (let i = 0; i < 5; i++) {
      const drawerY = boxY + 8 + i * 11;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(boxX + 4, drawerY, 47, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(boxX + 18, drawerY + 3, 18, 2);
    }

    // Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(boxX + 4, boxY + 65, 8, 5);
    ctx.fillRect(boxX + 43, boxY + 65, 8, 5);

    // Tire Rack on the right wall
    const rackX = width - 85;
    const rackY = wallBaseY - 95;

    // Steel rack frame
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(rackX, rackY, 70, 95);
    ctx.beginPath();
    ctx.moveTo(rackX, rackY + 45);
    ctx.lineTo(rackX + 70, rackY + 45);
    ctx.stroke();

    // Stacked high-performance tires
    for (let tier = 0; tier < 2; tier++) {
      const tireY = rackY + 12 + tier * 45;
      for (let t = 0; t < 3; t++) {
        const tireX = rackX + 8 + t * 20;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(tireX, tireY + 15, 8, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner rim
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(tireX, tireY + 15, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Draw Hydraulic Car Lift
  private drawLift(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _liftType: string,
    isElevated: boolean
  ) {
    ctx.save();
    const liftArmY = isElevated ? y - 35 : y;

    // Two Blue Posts
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;

    // Left post
    ctx.fillRect(x - 90, y - 75, 12, 100);
    ctx.strokeRect(x - 90, y - 75, 12, 100);
    // Right post
    ctx.fillRect(x + 78, y - 75, 12, 100);
    ctx.strokeRect(x + 78, y - 75, 12, 100);

    // Steel base pads
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 96, y + 25, 24, 6);
    ctx.fillRect(x + 72, y + 25, 24, 6);

    // Cross beam top safety bar
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(x - 90, y - 75, 180, 8);

    // Adjustable Lift Arms holding car chassis
    ctx.fillStyle = '#eab308'; // Warning yellow lift arms
    ctx.fillRect(x - 78, liftArmY + 15, 45, 6);
    ctx.fillRect(x + 33, liftArmY + 15, 45, 6);
    ctx.restore();
  }

  // Stylized Car Drawing (Side / 3/4 Profile)
  public drawStylizedCar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    car: OwnedCar,
    model?: CarModel
  ) {
    ctx.save();
    const carColor = car.visuals.color || model?.defaultColor || '#dc2626';
    const underglow = car.visuals.neonUnderglow;

    // 1. Neon Underglow on Floor
    if (underglow !== 'none') {
      const glowColors: Record<string, string> = {
        neon_blue: '#38bdf8',
        neon_red: '#ef4444',
        neon_green: '#22c55e',
        neon_purple: '#c084fc',
      };
      const gColor = glowColors[underglow] || '#38bdf8';
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y + 22, 70, 14, 0, 0, Math.PI * 2);
      ctx.shadowColor = gColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = gColor;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.restore();
    }

    // 2. Drop Shadow under tires
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 68, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Lower Chassis / Side Skirt
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x - 62, y + 10, 124, 7);

    // 4. Main Car Body Shell
    ctx.fillStyle = carColor;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 65, y + 10); // Front bumper
    ctx.lineTo(x - 65, y + 3);
    ctx.quadraticCurveTo(x - 55, y - 6, x - 35, y - 6); // Hood
    ctx.lineTo(x - 18, y - 24); // Windshield slope
    ctx.lineTo(x + 22, y - 24); // Roofline
    ctx.quadraticCurveTo(x + 40, y - 20, x + 55, y - 4); // Rear glass & trunk
    ctx.lineTo(x + 65, y + 3); // Rear bumper
    ctx.lineTo(x + 65, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Visual Livery (Racing Stripes, Flames, Carbon Hood)
    if (car.visuals.livery === 'racing_stripes') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 45, y - 5, 85, 3);
      ctx.fillRect(x - 45, y - 1, 85, 3);
    } else if (car.visuals.livery === 'carbon_hood') {
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(x - 55, y + 3);
      ctx.lineTo(x - 35, y - 6);
      ctx.lineTo(x - 20, y - 7);
      ctx.lineTo(x - 40, y + 4);
      ctx.closePath();
      ctx.fill();
    } else if (car.visuals.livery === 'flames') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(x - 50, y + 4);
      ctx.lineTo(x - 25, y + 1);
      ctx.lineTo(x - 10, y + 7);
      ctx.lineTo(x - 20, y + 6);
      ctx.closePath();
      ctx.fill();
    }

    // 6. Tinted Glass & Windows
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 22);
    ctx.lineTo(x - 30, y - 8);
    ctx.lineTo(x + 35, y - 8);
    ctx.lineTo(x + 20, y - 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Window reflection gleam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 20);
    ctx.lineTo(x - 22, y - 10);
    ctx.stroke();

    // 7. Headlights & Taillights
    // Front xenon/LED headlight
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 64, y, 5, 5);
    // Rear crimson LED taillight
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 60, y - 1, 5, 6);

    // 8. Rear Spoiler / Wing
    if (car.visuals.spoiler === 'ducktail') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 55, y - 8, 8, 4);
    } else if (car.visuals.spoiler === 'gt_wing' || car.visuals.spoiler === 'carbon_race') {
      // Upright stanchions and high blade
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 48, y - 18, 3, 14);
      ctx.fillRect(x + 58, y - 18, 3, 14);
      // Wing blade
      ctx.fillStyle = car.visuals.spoiler === 'carbon_race' ? '#18181b' : '#3b82f6';
      ctx.fillRect(x + 44, y - 20, 22, 4);
    }

    // 9. Wheels & Rims (Front & Rear)
    this.drawWheel(ctx, x - 42, y + 14, car.visuals.rimStyle);
    this.drawWheel(ctx, x + 42, y + 14, car.visuals.rimStyle);

    // 10. Dirt / Grime Overlay if dirty
    if (car.dirtLevel > 10) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, car.dirtLevel / 100);
      ctx.fillStyle = '#78350f'; // Muddy brown
      ctx.beginPath();
      ctx.ellipse(x - 10, y + 8, 55, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Wheel & Rim Alloy
  private drawWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rimStyle: string
  ) {
    ctx.save();
    // Tire Rubber
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wheel Rim
    const rimColors: Record<string, string> = {
      stock: '#cbd5e1',
      sport_alloy: '#e2e8f0',
      deep_dish: '#f8fafc',
      gold_mesh: '#f59e0b',
      forged_black: '#18181b',
    };
    const rimColor = rimColors[rimStyle] || '#cbd5e1';

    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Rim spoke details
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();

    // Center cap
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Animated Mechanics & Active Job Indicator
  private drawMechanicWork(
    ctx: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    bays: ActiveServiceBay[]
  ) {
    bays.forEach((bay) => {
      if (bay.currentJob && bay.startedAt) {
        const elapsed = (Date.now() - bay.startedAt) / 1000;
        const remaining = Math.max(0, bay.currentJob.durationSeconds - elapsed);

        // Render tool icon and progress
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = remaining === 0 ? '#22c55e' : '#f59e0b';
        ctx.textAlign = 'center';
        // (Positioning handled in bay loop)
        ctx.restore();
      }
    });
  }

  // 1/4 Mile Drag Strip Race Renderer
  public renderDragRace(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerCar: OwnedCar,
    playerModel: CarModel | undefined,
    playerDist: number, // 0 to 402m
    playerSpeed: number,
    _playerRpm: number,
    isNitro: boolean,
    oppCarName: string,
    oppDist: number,
    oppSpeed: number,
    oppColor: string,
    countdownStep: number,
    lastShift: string | null
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Night Drag Strip Asphalt & Grandstand Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(1, '#111827');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.4);

    // Floodlights & Grandstand crowd silhouette
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, height * 0.35, width, height * 0.05);

    // Asphalt Track
    const trackY = height * 0.4;
    const trackGrad = ctx.createLinearGradient(0, trackY, 0, height);
    trackGrad.addColorStop(0, '#1e293b');
    trackGrad.addColorStop(0.5, '#0f172a');
    trackGrad.addColorStop(1, '#020617');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, trackY, width, height - trackY);

    // Moving lane divider dash marks (speed lines)
    const scrollOffset = (playerDist * 15) % 80;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 25]);
    ctx.beginPath();
    ctx.moveTo(-scrollOffset, height * 0.65);
    ctx.lineTo(width + 80, height * 0.65);
    ctx.stroke();
    ctx.setLineDash([]);

    // Finish Line Checkered Strip (at 402m)
    const trackLengthM = 402;
    const playerProgress = Math.min(1, playerDist / trackLengthM);
    const finishLineX = width * 0.85 + (1 - playerProgress) * 400;

    if (finishLineX < width + 50 && finishLineX > -50) {
      for (let y = trackY; y < height; y += 16) {
        for (let x = finishLineX; x < finishLineX + 24; x += 12) {
          const isWhite = (Math.floor(x / 12) + Math.floor(y / 16)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
          ctx.fillRect(x, y, 12, 16);
        }
      }
    }

    // 2. Opponent Car (Upper Lane)
    const oppX = width * 0.25 + ((oppDist - playerDist) / 10) * 12;
    const oppY = height * 0.52;
    const oppCarObj: OwnedCar = {
      id: 'opp_temp',
      modelId: 'opp_car',
      nickname: oppCarName,
      visuals: {
        color: oppColor,
        livery: 'none',
        rimStyle: 'sport_alloy',
        spoiler: 'gt_wing',
        neonUnderglow: 'none',
      },
      performance: {
        engineStage: 0,
        turboStage: 0,
        tiresStage: 0,
        nitroStage: 0,
        weightReductionStage: 0,
        gearboxStage: 0,
      },
      dirtLevel: 0,
      mileageMiles: 0,
      purchasedAt: 0,
    };
    this.drawStylizedCar(ctx, oppX, oppY, oppCarObj);

    // 3. Player Car (Lower Lane)
    const playerX = width * 0.25;
    const playerY = height * 0.78;

    // Nitro flame exhaust trail
    if (isNitro) {
      ctx.save();
      const flameGrad = ctx.createLinearGradient(playerX + 65, playerY, playerX + 110, playerY);
      flameGrad.addColorStop(0, '#38bdf8');
      flameGrad.addColorStop(0.5, '#60a5fa');
      flameGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(playerX + 65, playerY + 3);
      ctx.lineTo(playerX + 115 + Math.random() * 20, playerY + 5);
      ctx.lineTo(playerX + 65, playerY + 7);
      ctx.fill();
      ctx.restore();
    }

    this.drawStylizedCar(ctx, playerX, playerY, playerCar, playerModel);

    // 4. Drag Tree Countdown Staging Lights (if countdown)
    if (countdownStep > 0) {
      this.drawChristmasTree(ctx, width * 0.5, height * 0.25, countdownStep);
    }

    // 5. Shift Feedback Popup (Perfect! Good! Early! Redline!)
    if (lastShift) {
      ctx.save();
      ctx.font = 'bold 24px Impact, sans-serif';
      ctx.textAlign = 'center';
      if (lastShift === 'perfect') {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('✨ PERFECT SHIFT! ✨', width * 0.5, height * 0.38);
      } else if (lastShift === 'good') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('👍 GOOD SHIFT', width * 0.5, height * 0.38);
      } else if (lastShift === 'redline') {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⚠️ REDLINE PENALTY!', width * 0.5, height * 0.38);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('EARLY SHIFT', width * 0.5, height * 0.38);
      }
      ctx.restore();
    }

    // 6. HUD Telemetry Bar (Distance & Speeds)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.fillRect(width * 0.05, 15, width * 0.9, 45);
    ctx.strokeRect(width * 0.05, 15, width * 0.9, 45);

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`YOU: ${Math.floor(playerSpeed)} MPH (${Math.floor(playerDist)}m / 402m)`, width * 0.08, 42);

    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'right';
    ctx.fillText(`RIVAL: ${Math.floor(oppSpeed)} MPH (${Math.floor(oppDist)}m)`, width * 0.92, 42);
    ctx.restore();
  }

  // Draw NHRA Drag Racing Christmas Tree
  private drawChristmasTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    step: number // 3 = Top Yellow, 2 = Mid Yellow, 1 = Low Yellow, 0 = Green
  ) {
    ctx.save();
    // Tree black post
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 8, y - 60, 16, 120);

    // Amber staging lights
    const lights = [
      { yOffset: -40, active: step === 3, color: '#f59e0b' },
      { yOffset: -20, active: step === 2, color: '#f59e0b' },
      { yOffset: 0, active: step === 1, color: '#f59e0b' },
      { yOffset: 25, active: step === 0, color: '#22c55e' }, // Green
    ];

    lights.forEach((l) => {
      ctx.beginPath();
      ctx.arc(x, y + l.yOffset, 10, 0, Math.PI * 2);
      ctx.fillStyle = l.active ? l.color : '#334155';
      if (l.active) {
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    });
    ctx.restore();
  }
}

export const carTownRenderer = new CarTownRenderer();
