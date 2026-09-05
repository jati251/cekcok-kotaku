import { FighterDef, FighterId } from './types';

export const FIGHTERS: Record<FighterId, FighterDef> = {
  scorpion: {
    id: 'scorpion',
    name: 'SCORPION',
    title: 'Spectre of the Netherrealm',
    avatar: '🦂',
    color: '#eab308', // Yellow
    secondaryColor: '#18181b', // Charcoal black
    skinTone: '#d4a373',
    special1Name: 'Spear ("GET OVER HERE!")',
    special2Name: 'Teleport Punch',
    fatalityName: 'Toasty! (Spine Burner)',
  },
  subzero: {
    id: 'subzero',
    name: 'SUB-ZERO',
    title: 'Grandmaster of the Lin Kuei',
    avatar: '❄️',
    color: '#0284c7', // Ice Blue
    secondaryColor: '#09090b', // Deep night
    skinTone: '#e0b899',
    special1Name: 'Ice Blast (Freeze)',
    special2Name: 'Cold Slide',
    fatalityName: 'Spine Rip',
  },
  raiden: {
    id: 'raiden',
    name: 'RAIDEN',
    title: 'God of Thunder & Lightning',
    avatar: '⚡',
    color: '#f8fafc', // White silk & electric blue
    secondaryColor: '#2563eb', // Royal blue trim
    skinTone: '#ecd1bd',
    special1Name: 'Lightning Bolt',
    special2Name: 'Torpedo Dive',
    fatalityName: 'Electrocution Decapitation',
  },
  liukang: {
    id: 'liukang',
    name: 'LIU KANG',
    title: 'Shaolin Champion of Earthrealm',
    avatar: '🔥',
    color: '#dc2626', // Red headband & sash
    secondaryColor: '#171717', // Black pants
    skinTone: '#e3ad86',
    special1Name: 'Dragon Fireball',
    special2Name: 'Flying Kick',
    fatalityName: 'Shaolin Cartwheel Uppercut',
  },
  sonya: {
    id: 'sonya',
    name: 'SONYA BLADE',
    title: 'Special Forces Lieutenant',
    avatar: '🎖️',
    color: '#16a34a', // Military green
    secondaryColor: '#1e293b', // Tactical grey
    skinTone: '#f7d3b5',
    special1Name: 'Energy Ring Blast',
    special2Name: 'Square Wave Punch',
    fatalityName: 'Kiss of Death',
  },
  cage: {
    id: 'cage',
    name: 'JOHNNY CAGE',
    title: 'Action Movie Superstar',
    avatar: '🕶️',
    color: '#475569', // Slate & blue trunks
    secondaryColor: '#0284c7', // Cyan sash
    skinTone: '#f2c8a2',
    special1Name: 'Shadow Kick',
    special2Name: 'Nutcracker Punch',
    fatalityName: 'Decapitating Uppercut',
  },
};

export const FIGHTER_LIST: FighterDef[] = Object.values(FIGHTERS);
