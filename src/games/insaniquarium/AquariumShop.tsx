import React from 'react';
import { Fish, Sparkles, Zap, Egg } from 'lucide-react';

interface AquariumShopProps {
  money: number;
  foodQuality: number;
  maxFoodOnScreen: number;
  laserPower: number;
  eggCost: number;
  eggPieces: number;
  onBuyGuppy: () => void;
  onUpgradeFood: () => void;
  onUpgradeMaxFood: () => void;
  onBuyCarnivore: () => void;
  onUpgradeLaser: () => void;
  onBuyEggPiece: () => void;
}

export const AquariumShop: React.FC<AquariumShopProps> = ({
  money,
  foodQuality,
  maxFoodOnScreen,
  laserPower,
  eggCost,
  eggPieces,
  onBuyGuppy,
  onUpgradeFood,
  onUpgradeMaxFood,
  onBuyCarnivore,
  onUpgradeLaser,
  onBuyEggPiece,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-slate-900/95 border-b border-sky-500/20 backdrop-blur-md z-20 overflow-x-auto text-xs font-mono">
      <div className="flex items-center gap-2">
        {/* Buy Guppy */}
        <button
          onClick={onBuyGuppy}
          disabled={money < 100}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600/40 text-sky-200 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer"
        >
          <Fish className="w-3.5 h-3.5 text-amber-400" />
          <span>Guppy ($100)</span>
        </button>

        {/* Upgrade Food Quality */}
        <button
          onClick={onUpgradeFood}
          disabled={money < 200 || foodQuality >= 3}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Food Tier {foodQuality} ($200)</span>
        </button>

        {/* Max Food Count */}
        <button
          onClick={onUpgradeMaxFood}
          disabled={money < 300 || maxFoodOnScreen >= 5}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer"
        >
          <span>Max Food {maxFoodOnScreen} ($300)</span>
        </button>

        {/* Carnivore */}
        <button
          onClick={onBuyCarnivore}
          disabled={money < 1000}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/40 text-purple-200 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer"
        >
          <span>Carnivore ($1000)</span>
        </button>

        {/* Laser Weapon */}
        <button
          onClick={onUpgradeLaser}
          disabled={money < 1000}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-600/40 text-red-200 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span>Laser Lvl {Math.floor(laserPower / 25)} ($1000)</span>
        </button>
      </div>

      {/* Buy Egg Piece */}
      <button
        onClick={onBuyEggPiece}
        disabled={money < eggCost || eggPieces >= 3}
        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
      >
        <Egg className="w-4 h-4 fill-slate-950" />
        <span>Hatch Egg Piece (${eggCost})</span>
      </button>
    </div>
  );
};
