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
      color: 'from-purple-600/30 to-purple-950/60 border-purple-500/40 hover:purple-400',
      badge: `${character.attributePoints} Stat Pts`,
    },
  ];

  return (
    <div className="relative flex flex-col w-full h-full bg-[#0d0a08] overflow-hidden select-none font-serif">
      {/* Top Village Status Bar: Ancient Dojo Wood & Gold Trim */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-b from-[#231812] to-[#150f0a] border-b-2 border-amber-900/80 shadow-2xl z-20">
        {/* Ninja Profile Card */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-[#2e1d13] border-2 border-amber-600/60 flex items-center justify-center text-amber-400 shadow-inner relative">
            <span className="text-xl font-black text-amber-300 font-sans">忍</span>
            <span className="absolute -bottom-1 -right-1 text-[9px] px-1 bg-red-950 text-red-400 border border-red-800 rounded font-mono font-bold">
              {character.element.toUpperCase().slice(0, 3)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-[#f5ebd7] font-serif">
                {character.name}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-300 tracking-wider">
                {character.rank.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-amber-400/90 uppercase font-bold">
                [{character.element}]
              </span>
            </div>

            {/* Level & XP Progress: Golden Scroll Chakra Bar */}
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="font-bold text-amber-400 font-mono">Lv.{character.level}</span>
              <div className="w-36 h-2 bg-[#120c08] rounded border border-amber-900/80 overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (character.xp / character.maxXp) * 100)}%`,
                  }}
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-500"
                />
              </div>
              <span className="text-[10px] font-mono text-[#c5b59f]">
                {character.xp} / {character.maxXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Currencies & Attribute Points Banner */}
        <div className="flex items-center gap-3.5">
          {character.attributePoints > 0 && (
            <button
              onClick={() => handleOpenBuilding('character')}
              className="px-3 py-1.5 rounded bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-amber-200 font-bold text-xs border border-red-600/80 shadow flex items-center gap-1.5 animate-pulse"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>+{character.attributePoints} Stat Points</span>
            </button>
          )}

          {/* Ryo (Gold Coins) */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#1e140d] border border-amber-800/60 text-amber-300 font-mono font-bold text-xs shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{character.gold.toLocaleString()} Ryo</span>
          </div>

          {/* Shinobi Tokens */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#1e140d] border border-red-800/60 text-red-300 font-mono font-bold text-xs shadow-inner">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>{character.tokens} Tokens</span>
          </div>
        </div>
      </div>

      {/* Main Village Plaza: Japanese Dojo Wooden Signboards */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center max-w-6xl mx-auto w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-serif tracking-widest uppercase mb-1">
            <span>木ノ葉の里 • LEAF SHINOBI VILLAGE</span>
          </div>
          <h2 className="text-2xl font-black text-[#f7eedd] tracking-wide font-serif">
            Konoha Shinobi Headquarters
          </h2>
          <p className="text-xs text-[#a8957e] mt-0.5">
            Select a facility to train jutsu, accept rank missions, or challenge arena champions
          </p>
        </div>

        {/* Building Cards Grid: Styled like Dojo Wooden Hanging Plaques (Ema) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BUILDINGS.map((b) => (
            <button
              key={b.id}
              onClick={() => handleOpenBuilding(b.id as VillageModalType)}
              className="group relative flex flex-col items-center justify-between p-5 rounded-lg bg-gradient-to-b from-[#241912] to-[#17100b] border-2 border-amber-900/60 hover:border-amber-500/80 shadow-lg cursor-pointer transition hover:-translate-y-1 active:translate-y-0 overflow-hidden text-center"
            >
              {/* Wood Grain subtle accent */}
              <div className="w-full flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-amber-500/90 tracking-wider">
                  {b.badge}
                </span>
                <span className="text-[10px] text-[#7a6a57] font-serif">館</span>
              </div>

              {/* Central Facility Icon */}
              <div className="w-14 h-14 rounded-lg bg-[#140e09] border border-amber-800/50 flex items-center justify-center my-2 shadow-inner group-hover:border-amber-400/80 transition">
                {b.icon}
              </div>

              {/* Title & Subtitle */}
              <div className="mt-1">
                <h3 className="text-base font-black text-[#f7eedd] group-hover:text-amber-300 transition-colors font-serif">
                  {b.title}
                </h3>
                <p className="text-xs text-[#a8957e] mt-0.5 font-serif">
                  {b.subtitle}
                </p>
              </div>

              {/* Bottom Decorative Kanji Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-700/40 to-transparent mt-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
