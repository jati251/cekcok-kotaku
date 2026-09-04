// Dynamic Procedural City Grid, Multi-District Maps, and Streetlight Generators for Pizza Frenzy Deluxe
import { Pizzeria, CityBuilding, StreetLight, DistrictDefinition, PizzaType, PIZZA_CONFIGS } from './types';

export class CityMapGenerator {
  public static getPizzerias(width: number, height: number, district: DistrictDefinition): Pizzeria[] {
    const padX = Math.max(65, width * 0.08);
    const padY = Math.max(65, height * 0.1);
    const midX = width / 2;

    const availableToppings = district.unlockedToppings;
    const pizzerias: Pizzeria[] = [];

    // Corner & Meridian Pizzeria hub coordinates
    const hubPositions: Array<{ quadrant: 'NW' | 'NE' | 'SW' | 'SE' | 'N' | 'S'; x: number; y: number; defaultType: PizzaType }> = [
      { quadrant: 'NW', x: padX, y: padY, defaultType: 'pepperoni' },
      { quadrant: 'NE', x: width - padX, y: padY, defaultType: 'margherita' },
      { quadrant: 'SW', x: padX, y: height - padY, defaultType: 'supreme' },
      { quadrant: 'SE', x: width - padX, y: height - padY, defaultType: 'veggie' },
      { quadrant: 'N', x: midX, y: padY, defaultType: 'hawaiian' },
      { quadrant: 'S', x: midX, y: height - padY, defaultType: 'bbq_chicken' },
    ];

    for (let i = 0; i < Math.min(hubPositions.length, availableToppings.length); i++) {
      const pos = hubPositions[i];
      const toppingType = availableToppings[i] || pos.defaultType;
      const conf = PIZZA_CONFIGS[toppingType];

      pizzerias.push({
        id: `pizzeria-${pos.quadrant.toLowerCase()}`,
        type: toppingType,
        name: conf.name,
        quadrant: pos.quadrant,
        x: pos.x,
        y: pos.y,
        color: conf.color,
        accentColor: conf.accentColor,
        icon: conf.icon,
      });
    }

    return pizzerias;
  }

  public static generateBuildings(width: number, height: number, district: DistrictDefinition): CityBuilding[] {
    const buildings: CityBuilding[] = [];
    const cols = 5;
    const rows = 4;
    const startX = width * 0.22;
    const endX = width * 0.78;
    const startY = height * 0.22;
    const endY = height * 0.78;

    const stepX = (endX - startX) / (cols - 1);
    const stepY = (endY - startY) / (rows - 1);

    const roofPalette = district.buildingRoofStyle;
    const basePalette = [
      '#1e293b', '#334155', '#374151', '#1f2937', '#0f172a',
    ];

    let idCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Leave central plaza open for the city fountain / monument
        if (r >= 1 && r <= 2 && c === 2) continue;

        const bx = startX + c * stepX;
        const by = startY + r * stepY;
        const roofCol = roofPalette[(r * cols + c) % roofPalette.length];
        const baseCol = basePalette[(r + c) % basePalette.length];
        const floors = 2 + ((r + c) % 4);

        // Pre-compute window lights state
        const windowLights: boolean[] = [];
        for (let w = 0; w < floors * 3; w++) {
          windowLights.push(Math.random() > 0.3);
        }

        buildings.push({
          id: `bld-${idCount++}`,
          x: bx,
          y: by,
          width: 52,
          height: 44,
          color: baseCol,
          roofColor: roofCol,
          name: `Block ${r + 1}-${c + 1}`,
          floors,
          windowLights,
        });
      }
    }

    return buildings;
  }

  public static generateStreetLights(width: number, height: number): StreetLight[] {
    const lights: StreetLight[] = [];
    const xs = [width * 0.2, width * 0.35, width * 0.5, width * 0.65, width * 0.8];
    const ys = [height * 0.2, height * 0.5, height * 0.8];

    for (const x of xs) {
      for (const y of ys) {
        lights.push({
          x,
          y,
          radius: 45,
        });
      }
    }
    return lights;
  }
}
