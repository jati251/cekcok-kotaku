import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildCorrugatedRoof, buildFence } from '../architecture';
import { buildPenguinWaterTank, buildOutdoorAC, buildPLNMeter, buildRealisticScooter, buildDrainGutter, downpipe } from '../detail';
import { buildPlant, buildHedge } from '../vegetation';
export function buildGreenTankHouse(ctx: WorldContext, p: Property) {
  const { box, beam, sign, random, materials: m } = ctx;
  const { wood, roofGrey, white, dark, concrete, brightGreen, kamprot, brickWeathered } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);

  // Ceramic tile terrace porch
  for (let x = -w / 2 + 0.3; x < w / 2 - 1.8; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main house volume (Bright green facade)
  box(brightGreen, -0.6, h / 2, front + depth / 2, w - 1.4, h, depth);

  // Corner Alley Wall (facing Jl. H. Junen II) - Rough Pebble-Dash Stucco (Kamprot) & Weathered Brick
  const cornerWallX = w / 2 - 0.2;
  const cornerWallW = 0.26;
  // Lower rough pebble-dash wall (kamprot)
  box(kamprot ?? m.clay, cornerWallX, 1.1, (front + depth) / 2, cornerWallW, 2.2, front + depth);
  // Upper exposed weathered brick patches showing through peeling plaster
  for (let z = front + 0.3; z < front + depth; z += 0.75) {
    box(brickWeathered ?? m.rust, cornerWallX - 0.005, 1.6 + (z % 3) * 0.15, z, cornerWallW + 0.01, 0.38, 0.55);
  }
  // Slanted coping on the alley party wall
  beam(concrete, [cornerWallX, 2.25, -0.1], [cornerWallX, 1.85, front + depth], 0.08);

  // Side compound wall on the left
  box(brightGreen, -w / 2 + 0.06, 0.83, front / 2, 0.12, 1.65, front);

  // Corrugated Asbestos / Zinc Roof (Atap Seng/Asbes) sloping towards street
  const roofApexY = h + 0.95;
  const roofEaveY = h + 0.15;
  buildCorrugatedRoof(
    ctx,
    -w / 2 - 0.2,
    w / 2 - 1.2,
    roofApexY,
    roofEaveY,
    front - 0.35,
    front + depth + 0.35,
    roofGrey,
    wood,
  );

  // Additional rear hip roof cap
  const ridgeZ = front + depth * 0.65;
  beam(concrete, [-w / 2, roofApexY + 0.05, ridgeZ], [w / 2 - 1.2, roofApexY + 0.05, ridgeZ], 0.06);

  // Deep Recessed Wooden Windows with Security Grilles & Molded Sills
  buildDeepWindow(ctx, -2.4, 1.55, facadeZ, 1.35, 1.55, wood, dark, true);
  buildDeepWindow(ctx, -0.1, 1.5, facadeZ, 1.25, 1.75, wood, dark, true);

  // Paneled Wooden Front Door with Roster Breeze Block
  buildPaneledDoor(ctx, 1.4, facadeZ, 0.95, 2.35, wood, white);

  // Outdoor AC Condenser Unit on wall
  buildOutdoorAC(ctx, -3.2, 2.4, facadeZ - 0.15, -1);

  // PLN Digital Token Electricity Meter Box
  buildPLNMeter(ctx, 0.65, 1.55, facadeZ - 0.05, 0);

  // Rainwater Downpipe
  downpipe(ctx, -w / 2 + 0.25, facadeZ - 0.08, 2.6, m.clay);

  // Front porch canopy / awning on timber posts
  const propTransform = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(-0.8, 0, 0));
  buildAwning(ctx, w - 2.0, front + 0.2, 2.68, front, roofGrey, wood);
  ctx.transform.copy(propTransform);

  // Highly Detailed Automatic Scooters (Honda Beat / Vario style)
  buildRealisticScooter(ctx, 1.35, 1.15, 0.25, m.scooterPaint ?? dark);
  buildRealisticScooter(ctx, 2.45, 1.45, -0.18, m.cloth[1] ?? dark);

  // Potted plants along the terrace
  for (let i = 0; i < 7; i++) {
    buildPlant(ctx, -2.6 + i * 0.52, 1.85, 0.6 + random() * 0.45);
  }

  // 1000L Penguin Orange Water Tank on Steel Angle Tower (Jl. H. Junen II corner)
  const tx = w / 2 - 0.85;
  const tz = 0.85;
  buildPenguinWaterTank(ctx, tx, tz, 3.65, 0.58, 1.45, true);

  // "JL. H. JUNEN II" Street Name Sign
  sign('JL. H. JUNEN II', tx + 0.1, 3.1, -0.08, 1.18, 0.24, '#176455', '#e0e8d5');

  // "DILARANG BUANG SAMPAH" Trash Warning Sign on the alley corner wall
  sign('DILARANG\nBUANG SAMPAH', tx - 0.12, 1.15, -0.05, 0.48, 0.36, '#f1c40f', '#922b21');

  // Roadside hedge & shrub
  buildHedge(ctx, tx, 0.15, 1.4, 1.2);

  // Street Drainage Gutter along the property front & alley turn
  buildDrainGutter(ctx, -0.5, front + 0.5, -w / 2 - 0.25, 0.42);

  // Front Fence
  buildFence(ctx, w, 'green-tank', brightGreen);
}
