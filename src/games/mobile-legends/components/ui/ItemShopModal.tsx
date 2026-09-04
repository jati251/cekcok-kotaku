import React, { useState } from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { ITEM_REGISTRY } from '../../constants/items';
import type { ItemCategory, ItemDefinition } from '../../types/item';
import { X, ShoppingBag, DollarSign } from 'lucide-react';

export const ItemShopModal: React.FC = () => {
  const { isShopOpen, closeShop, playerTelemetry, buyItem, sellItem } = useMobaStore();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('attack');
  const [selectedItem, setSelectedItem] = useState<ItemDefinition>(ITEM_REGISTRY.blade_of_despair);

  if (!isShopOpen) return null;

  const items = Object.values(ITEM_REGISTRY).filter((i) => i.category === activeCategory);

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[540px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Land of Dawn Armory</h2>
              <p className="text-xs font-mono text-amber-400 font-semibold">
                Gold Available: 💰 {Math.floor(playerTelemetry.gold)}
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(['attack', 'magic', 'defense', 'movement'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={closeShop}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Item Grid */}
          <div className="flex-1 p-6 overflow-y-auto grid grid-cols-3 gap-3">
            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const canAfford = playerTelemetry.gold >= item.cost;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700/60 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                    <div className={`text-xs font-mono font-bold ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                      💰 {item.cost}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Item Detail Panel */}
          <div className="w-80 border-l border-slate-800 bg-slate-950/50 p-6 flex flex-col justify-between">
            {selectedItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
                    {selectedItem.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{selectedItem.name}</h3>
                    <div className="text-xs font-mono font-bold text-amber-400">
                      Cost: 💰 {selectedItem.cost}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Stats & Effects
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                {selectedItem.passive && (
                  <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60">
                    <span className="text-[11px] font-bold text-amber-400 block mb-0.5">
                      Unique Passive: {selectedItem.passive.name}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {selectedItem.passive.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (selectedItem) buyItem(selectedItem.id);
              }}
              disabled={
                !selectedItem ||
                playerTelemetry.gold < selectedItem.cost ||
                playerTelemetry.items.length >= 6
              }
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                selectedItem && playerTelemetry.gold >= selectedItem.cost && playerTelemetry.items.length < 6
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <DollarSign size={16} /> Purchase Item
            </button>
          </div>
        </div>

        {/* Footer: 6-Slot Inventory */}
        <footer className="h-20 px-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Inventory ({playerTelemetry.items.length}/6):
            </span>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const itemId = playerTelemetry.items[idx];
                const item = itemId ? ITEM_REGISTRY[itemId] : null;
                return (
                  <div
                    key={idx}
                    className="relative group w-12 h-12 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center text-xl"
                  >
                    {item ? (
                      <>
                        <span>{item.icon}</span>
                        <button
                          onClick={() => sellItem(idx)}
                          title="Sell Item (60% refund)"
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-700 text-xs font-mono">{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
