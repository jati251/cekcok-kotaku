import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildBarrelTileRoof } from '../architecture';
import { buildCar } from '../vehicles';
import { stoneCourses, buildRealisticScooter, buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';

export function buildGreenCarHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, materials: m } = ctx;
  const { width: w, height: h, depth, setback: f } = p;
  const facadeZ = f - 0.08;

  // Foundation & Porch Pavement
  box(m.concrete, 0, -0.01, (f + depth) / 2, w, 0.15, f + depth);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < f; z += 0.4) {
      box(m.white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main house volume
  box(m.cream, 0, h / 2, f + depth / 2, w - 0.2, h, depth);

  // 3D Barrel Tile Roof with Ridge Caps & Lisplang
  buildBarrelTileRoof(ctx, 0, w, depth, h, 1.35, f, m.terracottaTile ?? m.tile, m.wood, m.cream);

  // Accent stone cladding wall section
  stoneCourses(ctx, 1.2, 0.08, f - 0.12, 3.4, 2.65, m.andesite ?? m.stone);
  for (const x of [-0.1, 1.2, 2.3]) {
    box(m.concrete, x, h - 0.35, f - 0.12, 0.12, 0.85, 0.14);
  }

  // Deep Recessed Windows with Security Grilles
  for (const x of [0.55, 1.85]) {
    buildDeepWindow(ctx, x, 1.45, facadeZ - 0.05, 0.72, 1.85, m.white, m.dark, true);
  }

  // Paneled Entrance Door
  buildPaneledDoor(ctx, 3.2, facadeZ, 0.95, 2.35, m.wood, m.white);

  // Outdoor AC Condenser Unit
  buildOutdoorAC(ctx, 2.8, 2.5, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter
  buildPLNMeter(ctx, -0.4, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.25, facadeZ - 0.08, 2.8, m.white);

  // Carport Awning
  buildAwning(ctx, w - 0.15, f, 2.95, f, m.roofGrey, m.dark);

  // Green car parked in carport
  buildCar(ctx, -1.8, f / 2, false, m.brightGreen);

  // Realistic automatic scooters parked on the porch
  buildRealisticScooter(ctx, 0.25, 1.9, 0.2, m.dark);
  buildRealisticScooter(ctx, 1.45, 2.0, -0.15, m.rust);

  // Front Fence with authentic black vertical bar sliding gate (matching sv_node5_laundry_greencar.png)
  const leftPostX = -w / 2 + 0.2;
  const rightPostX = w / 2 - 0.2;

  // White ceramic boundary pillars with andesite tile relief
  for (const px of [leftPostX, rightPostX]) {
    box(m.white, px, 0.85, 0, 0.38, 1.7, 0.38);
    box(m.andesite ?? m.dark, px, 0.85, -0.195, 0.24, 1.4, 0.02); // grey textured inlay
    box(m.white, px, 1.73, 0, 0.44, 0.06, 0.44); // pillar cap
  }

  // Indonesian flag (Bendera Merah Putih) mounted on left pillar angled towards the street
  beam(m.white, [leftPostX, 1.76, 0], [leftPostX + 0.15, 2.75, -0.65], 0.016);
  emit(new T.SphereGeometry(0.026, 8, 8), m.gold, leftPostX + 0.15, 2.76, -0.66);
  // Red upper stripe
  box(m.cloth[0], leftPostX + 0.15, 2.65, -0.45, 0.01, 0.14, 0.38);
  // White lower stripe
  box(m.white, leftPostX + 0.15, 2.51, -0.45, 0.01, 0.14, 0.38);

  // Modern black sliding gate with vertical slats
  const gateLeft = leftPostX + 0.22;
  const gateRight = rightPostX - 0.22;
  const gateW = gateRight - gateLeft;
  const gateMidX = (gateLeft + gateRight) / 2;
  const gateH = 1.6;

  // Black sliding gate frame
  box(m.dark, gateMidX, 0.1, 0, gateW, 0.06, 0.05);
  box(m.dark, gateMidX, gateH - 0.05, 0, gateW, 0.06, 0.05);
  box(m.dark, gateLeft + 0.03, gateH / 2, 0, 0.05, gateH, 0.05);
  box(m.dark, gateRight - 0.03, gateH / 2, 0, 0.05, gateH, 0.05);

  // Vertical black bars
  for (let gx = gateLeft + 0.08; gx < gateRight - 0.05; gx += 0.09) {
    box(m.dark, gx, gateH / 2, 0, 0.024, gateH - 0.1, 0.03);
  }

  // Ground sliding track
  box(m.dark, gateMidX, 0.015, 0, gateW + 0.4, 0.02, 0.07);

  // Stack of spare tires
  for (let i = 0; i < 4; i++) {
    emit(new T.TorusGeometry(0.27, 0.075, 10, 24), m.rubber, 3, 0.18 + i * 0.15, f - 0.55, 1, 1, 1, Math.PI / 2);
  }


  // Street Drainage Gutter
  buildDrainGutter(ctx, -f, depth, -w / 2 - 0.25, 0.42);
}
