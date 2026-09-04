// Types and entity definitions for Pizza Frenzy Deluxe
export type PizzaType =
  | 'pepperoni'
  | 'margherita'
  | 'supreme'
  | 'veggie'
  | 'hawaiian'
  | 'bbq_chicken'
  | 'diablo';

export type CustomerKind = 'regular' | 'vip' | 'prankster' | 'thief' | 'police' | 'speedy';

export type VehicleTier = 'scooter' | 'turbo' | 'van' | 'chopper';

export interface Pizzeria {
  id: string;
  type: PizzaType;
  name: string;
  quadrant: 'NW' | 'NE' | 'SW' | 'SE' | 'N' | 'S';
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
  customerKind: CustomerKind;
  customerName: string;
  avatarIcon: string;
  x: number;
  y: number;
  patience: number; // 0 to 1
  maxPatience: number; // Seconds
  points: number;
  tipMultiplier: number;
}

export interface DeliveryScooter {
  id: string;
  pizzeriaId: string;
  orderId: string;
  tier: VehicleTier;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  trailTimer: number;
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
  floors: number;
  windowLights: boolean[];
}

export interface StreetLight {
  x: number;
  y: number;
  radius: number;
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
  type: 'coin' | 'smoke' | 'text' | 'confetti' | 'sparkle' | 'steam';
  size?: number;
}

export interface DistrictDefinition {
  id: string;
  districtNumber: number;
  name: string;
  theme: 'downtown' | 'beach' | 'suburb' | 'industrial' | 'megapolis';
  asphaltColor: string;
  grassColor: string;
  buildingRoofStyle: string[];
  unlockedToppings: PizzaType[];
  targetRevenue: number;
  availableVehicles: VehicleTier;
  customerSpawnRate: number;
  storyQuote: string;
}

export interface FleetUpgrades {
  vehicleTier: VehicleTier;
  ovenSpeed: number; // 1 to 3
  hotboxInsulation: number; // extra patience
  policeRadar: boolean; // reveals pranksters/thieves automatically
}

export interface PizzaGameState {
  score: number;
  cash: number;
  targetCash: number;
  day: number;
  currentDistrictIndex: number;
  comboStreak: number;
  ordersDelivered: number;
  ordersMissed: number;
  thievesBusted: number;
  maxMissedAllowed: number;
  isFrenzyActive: boolean;
  frenzyTimer: number;
  upgrades: FleetUpgrades;
  isDayComplete: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

export const PIZZA_CONFIGS: Record<
  PizzaType,
  { name: string; color: string; accentColor: string; basePoints: number; icon: string; ingredients: string }
> = {
  pepperoni: {
    name: 'Pepperoni',
    color: '#ef4444',
    accentColor: '#991b1b',
    basePoints: 120,
    icon: '🍕',
    ingredients: 'Tomato, Mozzarella, Spiced Salami',
  },
  margherita: {
    name: 'Margherita',
    color: '#eab308',
    accentColor: '#854d0e',
    basePoints: 100,
    icon: '🧀',
    ingredients: 'San Marzano Tomato, Fresh Basil, Bufala',
  },
  supreme: {
    name: 'Supreme Deluxe',
    color: '#8b5cf6',
    accentColor: '#5b21b6',
    basePoints: 160,
    icon: '🥓',
    ingredients: 'Italian Sausage, Bell Pepper, Olives, Bacon',
  },
  veggie: {
    name: 'Garden Veggie',
    color: '#10b981',
    accentColor: '#065f46',
    basePoints: 110,
    icon: '🥦',
    ingredients: 'Baby Spinach, Mushrooms, Zucchini, Artichoke',
  },
  hawaiian: {
    name: 'Hawaiian Island',
    color: '#f97316',
    accentColor: '#9a3412',
    basePoints: 140,
    icon: '🍍',
    ingredients: 'Smoked Ham, Caramelized Pineapple, Sweet Corn',
  },
  bbq_chicken: {
    name: 'BBQ Pollo',
    color: '#d97706',
    accentColor: '#78350f',
    basePoints: 175,
    icon: '🍗',
    ingredients: 'Grilled Chicken, Red Onions, Smoky BBQ Glaze',
  },
  diablo: {
    name: 'Spicy Diablo',
    color: '#dc2626',
    accentColor: '#450a0a',
    basePoints: 190,
    icon: '🌶️',
    ingredients: 'Calabrian Chili, Habanero Sauce, Ghost Pepper Gouda',
  },
};

export const DISTRICT_DEFINITIONS: DistrictDefinition[] = [
  {
    id: 'district-1',
    districtNumber: 1,
    name: 'Little Italy Downtown',
    theme: 'downtown',
    asphaltColor: '#1e293b',
    grassColor: '#065f46',
    buildingRoofStyle: ['#334155', '#1e293b', '#475569', '#3b82f6'],
    unlockedToppings: ['pepperoni', 'margherita', 'supreme', 'veggie'],
    targetRevenue: 600,
    availableVehicles: 'scooter',
    customerSpawnRate: 2.8,
    storyQuote: '“Welcome to the family business! Let’s show this city the true taste of Naples!” — Paula Stromboli',
  },
  {
    id: 'district-2',
    districtNumber: 2,
    name: 'Sunset Boardwalk & Beach',
    theme: 'beach',
    asphaltColor: '#0f172a',
    grassColor: '#0d9488',
    buildingRoofStyle: ['#0284c7', '#38bdf8', '#f59e0b', '#ec4899'],
    unlockedToppings: ['pepperoni', 'margherita', 'supreme', 'veggie', 'hawaiian'],
    targetRevenue: 1000,
    availableVehicles: 'turbo',
    customerSpawnRate: 2.3,
    storyQuote: '“Surfers and vacationers are lining up! Keep those pineapple slices sizzling!” — Bernardo Stromboli',
  },
  {
    id: 'district-3',
    districtNumber: 3,
    name: 'Suburbia Country Heights',
    theme: 'suburb',
    asphaltColor: '#1c1917',
    grassColor: '#15803d',
    buildingRoofStyle: ['#991b1b', '#b45309', '#065f46', '#4338ca'],
    unlockedToppings: ['pepperoni', 'margherita', 'supreme', 'veggie', 'hawaiian', 'bbq_chicken'],
    targetRevenue: 1500,
    availableVehicles: 'turbo',
    customerSpawnRate: 1.9,
    storyQuote: '“The mansion parties demand our BBQ Chicken specialties. Watch out for crafty pranksters!” — Nick Stromboli',
  },
  {
    id: 'district-4',
    districtNumber: 4,
    name: 'Industrial Iron Wharf',
    theme: 'industrial',
    asphaltColor: '#18181b',
    grassColor: '#3f3f46',
    buildingRoofStyle: ['#71717a', '#52525b', '#3f3f46', '#d97706'],
    unlockedToppings: ['pepperoni', 'margherita', 'supreme', 'veggie', 'bbq_chicken', 'diablo'],
    targetRevenue: 2200,
    availableVehicles: 'van',
    customerSpawnRate: 1.6,
    storyQuote: '“Heavy docks, hungry shipyard workers, and thieves sneaking about! Upgrade to our Express Vans!” — Guy Stromboli',
  },
  {
    id: 'district-5',
    districtNumber: 5,
    name: 'Megapolis Central Skylines',
    theme: 'megapolis',
    asphaltColor: '#09090b',
    grassColor: '#047857',
    buildingRoofStyle: ['#4f46e5', '#7c3aed', '#db2777', '#2563eb'],
    unlockedToppings: ['pepperoni', 'margherita', 'supreme', 'veggie', 'hawaiian', 'bbq_chicken', 'diablo'],
    targetRevenue: 3200,
    availableVehicles: 'chopper',
    customerSpawnRate: 1.3,
    storyQuote: '“The crowning achievement of the Stromboli dynasty! The whole metropolis is screaming for Pizza Frenzy!” — The Strombolis',
  },
];

export const VEHICLE_CONFIGS: Record<VehicleTier, { name: string; speed: number; cost: number; icon: string; desc: string }> = {
  scooter: {
    name: 'Vintage 50cc Vespa',
    speed: 130,
    cost: 0,
    icon: '🛵',
    desc: 'Agile city moped for narrow street maneuvers.',
  },
  turbo: {
    name: 'Nitro Turbo Moped',
    speed: 185,
    cost: 500,
    icon: '🏍️',
    desc: 'High-octane scooter with blazing straight-line acceleration.',
  },
  van: {
    name: 'Stromboli Express Van',
    speed: 240,
    cost: 1200,
    icon: '🚐',
    desc: 'Heavy-duty insulated van capable of carrying double pizza crates.',
  },
  chopper: {
    name: 'Pizza Delivery Chopper',
    speed: 320,
    cost: 2500,
    icon: '🚁',
    desc: 'Direct aerial flight — completely ignores city traffic and river obstacles!',
  },
};
