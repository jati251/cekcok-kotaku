import type { LauncherGame } from '../types';

export const LAUNCHER_GAMES: LauncherGame[] = [
  {
    id: 'empires-and-allies',
    title: 'Empires & Allies',
    tagline: 'Retro Military Island RTS & Tactical Turn-Based Combat',
    genre: 'Isometric RTS / Strategy',
    status: 'playable',
    releaseYear: '2011 / 2026 Remaster',
    bannerImage: 'military-base',
    description:
      'Build your military island fortress, command infantry, tanks, and fighter jets, and battle the nefarious Raven Syndicate in iconic rock-paper-scissors turn-based combat.',
    features: [
      'Isometric Diamond Base Building & Wilderness Clearing',
      'Population, Housing & Unit Training Depot',
      'Interactive Campaign World Map (5 Sectors)',
      'Turn-Based Combat with Projectile Ballistics & Screen Shake',
      'Allies Dock: Visit Neighbor Islands & Earn Honor Points',
      'HQ War Room: Craft Tactical Nukes & Superweapons',
    ],
  },
  {
    id: 'cityville',
    title: 'CityVille Retro',
    tagline: 'The Ultimate Isometric Metropolis Builder & Franchise Tycoon',
    genre: 'City Simulator / Tycoon',
    status: 'in_development',
    releaseYear: '2010 Classic',
    bannerImage: 'city-skyline',
    description:
      'Pave downtown roads, construct townhomes, operate bakeries and toy shops, and run supply deliveries to grow your bustling island town into a thriving metropolis.',
    features: [
      'Franchise Stores & Goods Supply Deliveries',
      'Zoning: Residential, Commercial, and Public Landmarks',
      'Community Buildings & Population Caps',
      'Traffic Simulation & Citizen Happiness',
    ],
  },
  {
    id: 'farmville-retro',
    title: 'FarmVille Vintage',
    tagline: 'Plow, Plant, and Harvest Across Serene Pastoral Farmlands',
    genre: 'Farming Simulation',
    status: 'coming_soon',
    releaseYear: '2009 Classic',
    bannerImage: 'farm-landscape',
    description:
      'The legendary social farming experience. Plow plots, sow wheat, strawberries, and pumpkins, raise livestock, and harvest prize crops.',
    features: [
      'Tile Plowing & Crop Ripening Timers',
      'Barns, Tractors & Farm Animal Pens',
      'Marketplace Trading & Ribbon Achievements',
    ],
  },
];
