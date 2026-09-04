import React, { useState } from 'react';
import { Home, X, Coins, Gem, Check } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';
import { GARAGE_DECOR } from '../data/decor';
import { GarageDecorItem } from '../types';

export const GarageDecorModal: React.FC = () => {
  const { closeModal, coins, bucks, level, decor, buyDecor } = useCarTownStore();
  const [selectedCategory, setSelectedCategory] = useState<GarageDecorItem['category']>('flooring');

  const categories: { id: GarageDecorItem['category']; label: string }[] = [
    { id: 'flooring', label: 'Flooring' },
    { id: 'lift', label: 'Car Lifts' },
    { id: 'toolbox', label: 'Toolboxes' },
    { id: 'neon', label: 'Neon Signs' },
    { id: 'decoration', label: 'Trophies & Decor' },
  ];

  const filteredItems = GARAGE_DECOR.filter((item) => item.category === selectedCategory);

  const handleBuy = (item: GarageDecorItem) => {
    const success = buyDecor(item);
    if (!success) {
      alert('Not enough coins or Car Town bucks to unlock this item!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                Garage Workshop Upgrades
              </h2>
              <p className="text-xs text-slate-400">
                Customize your speed shop floor, tools, and neon atmosphere
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Decor Items Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isInstalled = (decor as Record<string, string>)[item.category] === item.id;
            const locked = level < item.levelRequired;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isInstalled
                    ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    {locked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        Level {item.levelRequired} Req
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  {item.bonusPercent > 0 && (
                    <p className="text-xs font-bold text-emerald-400 mt-2">
                      ⚡ +{item.bonusPercent}% Garage Prestige Bonus
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-black text-amber-400">
                    <Coins className="w-4 h-4" />
                    {item.priceCoins.toLocaleString()}
                    {item.priceBucks > 0 && (
                      <span className="ml-2 text-xs font-bold text-sky-400 flex items-center">
                        <Gem className="w-3 h-3 mr-0.5" /> {item.priceBucks}
                      </span>
                    )}
                  </div>

                  {isInstalled ? (
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Installed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={locked || coins < item.priceCoins || bucks < item.priceBucks}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition disabled:opacity-40"
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
