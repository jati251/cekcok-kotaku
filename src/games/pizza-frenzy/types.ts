// Types for Pizza Frenzy: Metro Express

export type PizzaType = 'pepperoni' | 'margherita' | 'supreme' | 'veggie';

export interface Pizzeria {
  id: string;
  type: PizzaType;
  name: string;
  quadrant: 'NW' | 'NE' | 'SW' | 'SE';
  x: number;
  y: number;
  color: string;
  accentColor: string;
  icon: string;
}

export interface CustomerOrder {
  id: string;
  buildingId: string;
  type: PizzaType;
  x: number;
  y: number;
  patience: number; // 0 to 1
  maxPatience: number; // Seconds
  points: number;
  isVIP?: boolean;
  isPrankster?: boolean;
}

export interface DeliveryScooter {
  id: string;
  pizzeriaId: string;
  orderId: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

export interface CityBuilding {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor: string;
  name: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  text?: string;
  type: 'coin' | 'smoke' | 'text' | 'confetti';
}

export interface PizzaGameState {
  score: number;
  cash: number;
  targetCash: number;
  day: number;
  comboStreak: number;
  ordersDelivered: number;
  ordersMissed: number;
  maxMissedAllowed: number;
  isDayComplete: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

export const PIZZA_CONFIGS: Record<PizzaType, { name: string; color: string; accentColor: string; basePoints: number }> = {
  pepperoni: {
    name: 'Pepperoni',
    color: '#ef4444',
    accentColor: '#b91c1c',
    basePoints: 120,
  },
  margherita: {
    name: 'Margherita',
    color: '#eab308',
    accentColor: '#ca8a04',
    basePoints: 100,
  },
  supreme: {
    name: 'Supreme Deluxe',
    color: '#8b5cf6',
    accentColor: '#6d28d9',
    basePoints: 160,
  },
  veggie: {
    name: 'Garden Veggie',
    color: '#10b981',
    accentColor: '#059669',
    basePoints: 110,
  },
};
