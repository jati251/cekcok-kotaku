import { GlassWater, X, Clock, Coins } from 'lucide-react';
import { useNightclubStore } from '../store/useNightclubStore';
import { DRINKS } from '../data/drinks';
import { DrinkRecipe } from '../types';

export const BarDrinkModal: React.FC = () => {
  const { closeModal, level, cash, selectedBarId, activeBars, startDrinkBatch } =
    useNightclubStore();

  const targetBarId = selectedBarId || Object.keys(activeBars)[0] || 'bar_1';
  const currentStation = activeBars[targetBarId];

  const handleStartDrink = (drink: DrinkRecipe) => {
    startDrinkBatch(targetBarId, drink);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <GlassWater className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Cocktail Bar Menu
              </h2>
              <p className="text-xs text-slate-400">
                Mix and serve signature drinks to keep partygoers energized and generate club profit
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drink Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {DRINKS.map((drink) => {
            const isUnlocked = level >= drink.levelReq;
            const canAfford = cash >= drink.cost;
            const isBrewing = currentStation?.activeDrinkId === drink.id;

            return (
              <div
                key={drink.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 style={{ color: drink.color }} className="text-sm font-black uppercase">
                      {drink.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Lv.{drink.levelReq}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{drink.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-4 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans font-bold">Cost</span>
                      <strong className="text-rose-400">${drink.cost}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans font-bold">Revenue</span>
                      <strong className="text-emerald-400">${drink.revenue}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans font-bold">Time</span>
                      <strong className="text-sky-400">{drink.prepTimeSec}s</strong>
                    </div>
                  </div>
                </div>

                {isBrewing ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-400 font-bold text-xs">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Currently Serving</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartDrink(drink)}
                    disabled={!isUnlocked || !canAfford}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>
                      {!isUnlocked
                        ? `Requires Lv.${drink.levelReq}`
                        : `Mix Batch ($${drink.cost})`}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
