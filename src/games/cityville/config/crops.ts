import type { CropDefinition } from '../types';

export const CITY_CROPS: CropDefinition[] = [
  {
    id: 'strawberries',
    name: 'Sweet Strawberries',
    growthSeconds: 8,
    costCoins: 15,
    goodsYield: 30,
    xpYield: 8,
    icon: 'Cherry',
    description: 'Fast-ripening berries. Great for quick replenishment of bakery and cafe goods.',
  },
  {
    id: 'carrots',
    name: 'Crisp Carrots',
    growthSeconds: 20,
    costCoins: 35,
    goodsYield: 75,
    xpYield: 18,
    icon: 'Carrot',
    description: 'Reliable root vegetable delivering solid goods volume for grocery and restaurant shelves.',
  },
  {
    id: 'corn',
    name: 'Golden Sweet Corn',
    growthSeconds: 45,
    costCoins: 80,
    goodsYield: 180,
    xpYield: 35,
    icon: 'Wheat',
    description: 'High-yield grain staple. Essential for fueling large supermarkets and cinemas.',
  },
  {
    id: 'watermelon',
    name: 'Juicy Watermelon',
    growthSeconds: 90,
    costCoins: 160,
    goodsYield: 380,
    xpYield: 75,
    icon: 'Citrus',
    description: 'Commercial prize melons producing massive shipments of goods for busy downtown franchises.',
  },
];
