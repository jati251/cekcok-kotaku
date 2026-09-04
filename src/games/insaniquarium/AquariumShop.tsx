// Deluxe Brass & Glass PopCap Aquarium Console Top Bar
import React from 'react';
import { Fish, Sparkles, Zap, Egg, Crown, Compass } from 'lucide-react';
import { TankDefinition } from './types';

interface AquariumShopProps {
  tank: TankDefinition;
  money: number;
  foodQuality: number;
  maxFoodOnScreen: number;
  laserLevel: number;
  eggCost: number;
  eggPieces: number;
  onBuyGuppy: () => void;
  onUpgradeFood: () => void;
  onUpgradeMaxFood: () => void;
  onBuyStarCatcher: () => void;
  onBuyCarnivore: () => void;
  onBuyUltravore: () => void;
  onUpgradeLaser: () => void;
  onBuyEggPiece: () => void;
}

export const AquariumShop: React.FC<AquariumShopProps> = ({
  tank,
  money,
  foodQuality,
  maxFoodOnScreen,
  laserLevel,
  eggCost,
  eggPieces,
  onBuyGuppy,
  onUpgradeFood,
  onUpgradeMaxFood,
  onBuyStarCatcher,
  onBuyCarnivore,
  onBuyUltravore,
  onUpgradeLaser,
  onBuyEggPiece,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-b-2 border-amber-600/50 shadow-xl shadow-black/50 z-20 overflow-x-auto text-xs font-mono select-none">
      {/* Left items: Fish & Upgrade buttons */}
      <div className="flex items-center gap-2">
        {/* 1. Guppy Button */}
        <button
          onClick={onBuyGuppy}
          disabled={money < 100}
          title="Buy Guppy ($100)"
          className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-400/60 hover:border-amber-300 text-amber-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md shadow-amber-950/50 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Fish className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] text-amber-200">Guppy</span>
          </div>
          <span className="text-[10px] text-amber-400/90 font-sans font-semibold">$100</span>
        </button>

        {/* 2. Food Quality Upgrade */}
        <button
          onClick={onUpgradeFood}
          disabled={money < 200 || foodQuality >= 3}
          title="Upgrade Food Nutrition ($200)"
          className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-emerald-900 to-emerald-950 border border-emerald-500/50 hover:border-emerald-400 text-emerald-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-[11px] text-emerald-200">Food Lv{foodQuality}</span>
          </div>
          <span className="text-[10px] text-emerald-400/90 font-sans font-semibold">
            {foodQuality >= 3 ? 'MAX' : '$200'}
          </span>
        </button>

        {/* 3. Max Food Count */}
        <button
          onClick={onUpgradeMaxFood}
          disabled={money < 300 || maxFoodOnScreen >= 5}
          title="Max Pellets Allowed ($300)"
          className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-sky-900 to-sky-950 border border-sky-500/50 hover:border-sky-400 text-sky-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-[11px] text-sky-200">Pellets ({maxFoodOnScreen})</span>
          </div>
          <span className="text-[10px] text-sky-400/90 font-sans font-semibold">
            {maxFoodOnScreen >= 5 ? 'MAX' : '$300'}
          </span>
        </button>

        {/* 4. Star Catcher (Tank 2+ Only) */}
        {tank.availableStarCatcher && (
          <button
            onClick={onBuyStarCatcher}
            disabled={money < 750}
            title="Star Catcher transforms stars into $250 Pearls ($750)"
            className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-cyan-900 to-cyan-950 border border-cyan-400/60 hover:border-cyan-300 text-cyan-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-bold text-[11px] text-cyan-200">StarCatcher</span>
            </div>
            <span className="text-[10px] text-cyan-400/90 font-sans font-semibold">$750</span>
          </button>
        )}

        {/* 5. Carnivore (Tank 1-2+ Only) */}
        {tank.availableCarnivore && (
          <button
            onClick={onBuyCarnivore}
            disabled={money < 1000}
            title="Carnivore eats small guppies and drops $200 Diamonds ($1000)"
            className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-purple-900 to-purple-950 border border-purple-500/60 hover:border-purple-400 text-purple-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <span className="font-bold text-[11px] text-purple-200">Carnivore</span>
            </div>
            <span className="text-[10px] text-purple-400/90 font-sans font-semibold">$1,000</span>
          </button>
        )}

        {/* 6. Ultravore (Tank 3+ Only) */}
        {tank.availableUltravore && (
          <button
            onClick={onBuyUltravore}
            disabled={money < 5000}
            title="Ultravore eats carnivores and drops $2,000 Treasure Chests ($5000)"
            className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-rose-900 to-rose-950 border border-rose-500/60 hover:border-rose-400 text-rose-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-[11px] text-rose-200">Ultravore</span>
            </div>
            <span className="text-[10px] text-rose-400/90 font-sans font-semibold">$5,000</span>
          </button>
        )}

        {/* 7. Laser Weapon Power */}
        <button
          onClick={onUpgradeLaser}
          disabled={money < 1000 || laserLevel >= 4}
          title="Upgrade Defense Laser ($1000)"
          className="group relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-b from-red-950 to-stone-950 border border-red-500/60 hover:border-red-400 text-red-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] text-red-200">Laser Lv{laserLevel}</span>
          </div>
          <span className="text-[10px] text-red-400/90 font-sans font-semibold">
            {laserLevel >= 4 ? 'MAX' : '$1,000'}
          </span>
        </button>
      </div>

      {/* Right side: Deluxe Egg Incubator Button */}
      <div className="flex items-center gap-3 pl-4">
        {/* Active Tank Indicator */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-[10px] uppercase font-bold text-amber-500/80 tracking-widest">
            {tank.levelNumber}
          </span>
          <span className="text-xs font-semibold text-stone-300 truncate max-w-[140px]">
            {tank.name}
          </span>
        </div>

        {/* Egg Assembly Button */}
        <button
          onClick={onBuyEggPiece}
          disabled={money < eggCost || eggPieces >= 3}
          className="group relative flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 border border-yellow-200/80 text-stone-950 font-black shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <Egg className="w-5 h-5 fill-stone-950 group-hover:rotate-12 transition-transform" />
            {eggPieces > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                {eggPieces}
              </span>
            )}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-stone-900 font-extrabold">
              Egg {eggPieces}/3
            </span>
            <span className="text-xs text-stone-950 font-mono">
              {eggPieces >= 3 ? 'HATCHED!' : `$${eggCost.toLocaleString()}`}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
