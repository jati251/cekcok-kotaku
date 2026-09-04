import { Pizzeria, CityBuilding } from './types';

export class CityMapGenerator {
  public static getPizzerias(width: number, height: number): Pizzeria[] {
    const padX = Math.max(70, width * 0.1);
    const padY = Math.max(70, height * 0.12);

    return [
      {
        id: 'pizzeria-nw',
        type: 'pepperoni',
        name: 'Luigi’s Pepperoni',
        quadrant: 'NW',
        x: padX,
        y: padY,
        color: '#ef4444',
        accentColor: '#b91c1c',
        icon: '🍕',
      },
      {
        id: 'pizzeria-ne',
        type: 'margherita',
        name: 'Mama’s Margherita',
        quadrant: 'NE',
        x: width - padX,
        y: padY,
        color: '#eab308',
        accentColor: '#ca8a04',
        icon: '🧀',
      },
      {
        id: 'pizzeria-sw',
        type: 'supreme',
        name: 'Tony’s Supreme',
        quadrant: 'SW',
        x: padX,
        y: height - padY,
        color: '#8b5cf6',
        accentColor: '#6d28d9',
        icon: '🥓',
      },
      {
        id: 'pizzeria-se',
        type: 'veggie',
        name: 'Bella Veggie',
        quadrant: 'SE',
        x: width - padX,
        y: height - padY,
        color: '#10b981',
        accentColor: '#059669',
        icon: '🥦',
      },
    ];
  }

  public static generateBuildings(width: number, height: number): CityBuilding[] {
    const buildings: CityBuilding[] = [];
    const cols = 5;
    const rows = 4;
    const startX = width * 0.22;
    const endX = width * 0.78;
    const startY = height * 0.2;
    const endY = height * 0.8;

    const stepX = (endX - startX) / (cols - 1);
    const stepY = (endY - startY) / (rows - 1);

    const buildingColors = [
      { base: '#334155', roof: '#475569' },
      { base: '#1e293b', roof: '#3b82f6' },
      { base: '#374151', roof: '#ec4899' },
      { base: '#1f2937', roof: '#10b981' },
    ];

    let idCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip central plaza
        if (r >= 1 && r <= 2 && c === 2) continue;

        const bx = startX + c * stepX;
        const by = startY + r * stepY;
        const colorPair = buildingColors[(r + c) % buildingColors.length];

        buildings.push({
          id: `bld-${idCount++}`,
          x: bx,
          y: by,
          width: 50,
          height: 44,
          color: colorPair.base,
          roofColor: colorPair.roof,
          name: `Avenue ${r + 1}-${c + 1}`,
        });
      }
    }

    return buildings;
  }
}
