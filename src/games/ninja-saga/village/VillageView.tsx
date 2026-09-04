import React from 'react';
import {
  Scroll,
  BookOpen,
  ShoppingBag,
  Hammer,
  Skull,
  Swords,
  Feather,
  User,
  Coins,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { useNinjaSagaStore } from '../store/useNinjaSagaStore';
import { VillageModalType } from '../types';
import { ninjaAudio } from '../audio';

export const VillageView: React.FC = () => {
  const { character, openModal } = useNinjaSagaStore();

  if (!character) return null;

  const handleOpenBuilding = (modal: VillageModalType) => {
    ninjaAudio.playChakraCharge();
    openModal(modal);
  };

  const BUILDINGS = [
    {
      id: 'kage_room',
      title: 'Kage Room',
      subtitle: 'Missions & Exams',
      icon: <Scroll className="w-7 h-7 text-amber-400" />,
      color: 'from-amber-600/30 to-amber-950/60 border-amber-500/40 hover:border-amber-400',
      badge: 'Main Story',
    },
    {
      id: 'academy',
      title: 'Ninja Academy',
      subtitle: '5-Element Jutsu',
      icon: <BookOpen className="w-7 h-7 text-indigo-400" />,
      color: 'from-indigo-600/30 to-indigo-950/60 border-indigo-500/40 hover:border-indigo-400',
      badge: 'Skill Trees',
    },
    {
      id: 'shop',
      title: 'Village Shop',
      subtitle: 'Weapons & Gear',
      icon: <ShoppingBag className="w-7 h-7 text-emerald-400" />,
      color: 'from-emerald-600/30 to-emerald-950/60 border-emerald-500/40 hover:border-emerald-400',
      badge: 'Merchant',
    },
    {
      id: 'blacksmith',
      title: 'Blacksmith',
      subtitle: 'Weapon Forge +10',
      icon: <Hammer className="w-7 h-7 text-orange-400" />,
      color: 'from-orange-600/30 to-orange-950/60 border-orange-500/40 hover:border-orange-400',
      badge: 'Upgrades',
    },
    {
      id: 'hunting_house',
      title: 'Hunting House',
      subtitle: 'World Boss Raids',
      icon: <Skull className="w-7 h-7 text-rose-400" />,
      color: 'from-rose-600/30 to-rose-950/60 border-rose-500/40 hover:border-rose-400',
      badge: 'Epic Bosses',
    },
    {
      id: 'arena',
      title: 'Ninja Arena',
      subtitle: 'PvP Ladder',
      icon: <Swords className="w-7 h-7 text-yellow-400" />,
      color: 'from-yellow-600/30 to-yellow-950/60 border-yellow-500/40 hover:border-yellow-400',
      badge: 'Ranked',
    },
    {
      id: 'pet_house',
      title: 'Pet Sanctuary',
      subtitle: 'Companion Beasts',
      icon: <Feather className="w-7 h-7 text-teal-400" />,
      color: 'from-teal-600/30 to-teal-950/60 border-teal-500/40 hover:border-teal-400',
      badge: character.activePet ? character.activePet.name : 'No Pet',
    },
    {
      id: 'character',
      title: 'Ninja Profile',
      subtitle: 'Stats & Jutsu Deck',
      icon: <User className="w-7 h-7 text-purple-400" />,
      color: 'from-purple-600/30 to-purple-950/60 border-purple-500/40 hover:border-purple-400',
      badge: `${character.attributePoints} Stat Pts`,
    },
  ];

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Village Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl z-20">
        {/* Ninja Profile Card */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase text-white tracking-wide">
                {character.name}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                {character.rank.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">
                [{character.element}]
              </span>
            </div>

            {/* Level & XP Progress */}
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="font-bold text-amber-400">Lv.{character.level}</span>
              <div className="w-36 h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (character.xp / character.maxXp) * 100)}%`,
                  }}
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {character.xp} / {character.maxXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Currencies & Attribute Points Banner */}
        <div className="flex items-center gap-4">
          {character.attributePoints > 0 && (
            <button
              onClick={() => handleOpenBuilding('character')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/30 border border-amber-500/60 text-amber-300 text-xs font-bold animate-pulse hover:bg-amber-600/50 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{character.attributePoints} Stat Points!</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-amber-400 font-mono font-bold text-xs shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{character.gold.toLocaleString()} Gold</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-indigo-400 font-mono font-bold text-xs shadow-inner">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>{character.tokens} Tokens</span>
          </div>
        </div>
      </div>

      {/* Village Landscape & Facilities Grid */}
      <div className="relative flex-1 flex flex-col justify-between p-8 overflow-y-auto z-10">
        {/* Atmospheric Village Title Banner */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <h1 className="text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
            Hidden Leaf Shinobi Village
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose a village district below to embark on missions, train elemental jutsu, enhance weaponry, or raid legendary world bosses.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-4 gap-5 max-w-5xl mx-auto w-full mb-8">
          {BUILDINGS.map((b) => (
            <button
              key={b.id}
              onClick={() => handleOpenBuilding(b.id as VillageModalType)}
              className={`group relative flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-br ${b.color} border shadow-xl backdrop-blur-md transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer text-left overflow-hidden`}
            >
              {/* Top Row: Icon & Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                  {b.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/70 text-slate-300 border border-slate-800">
                  {b.badge}
                </span>
              </div>

              {/* Bottom Row: Title & Subtitle */}
              <div>
                <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                  {b.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
