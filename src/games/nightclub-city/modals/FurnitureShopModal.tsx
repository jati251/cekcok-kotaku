import React, { useState } from 'react';
import { ShoppingBag, X, Coins, Gem } from 'lucide-react';
import { useNightclubStore } from '../store/useNightclubStore';
import { FURNITURE } from '../data/furniture';
import { FurnitureCategory, FurnitureItem } from '../types';

export const FurnitureShopModal: React.FC = () => {
  const { closeModal, level, cash, luxeCash, buyAndPlaceFurniture, placedFurniture, floorSize } =
    useNightclubStore();

  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory>('dance_floor');

  const filteredItems = FURNITURE.filter((item) => item.category === selectedCategory);

  const handleBuyItem = (item: FurnitureItem) => {
    // Find an open grid slot
    const occupied = new Set(placedFurniture.map((f) => `${f.gridX},${f.gridY}`));
    let targetX = 4;
    let targetY = 6;

    for (let x = 2; x < floorSize - 2; x++) {
      for (let y = 2; y < floorSize - 2; y++) {
        if (!occupied.has(`${x},${y}`)) {
          targetX = x;
          targetY = y;
          break;
        }
      }
    }

    const ok = buyAndPlaceFurniture(item, targetX, targetY);
    if (ok) {
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Club Interior Catalog
              </h2>
              <p className="text-xs text-slate-400">
                Pave light-up dance floors, build cocktail bars, setup laser rigs and VIP lounges
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

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {(
            [
              { id: 'dance_floor', label: 'Dance Floors' },
              { id: 'bar', label: 'Bars' },
              { id: 'dj_booth', label: 'DJ Booths' },
              { id: 'vip_lounge', label: 'VIP Lounge' },
              { id: 'lighting', label: 'Lighting' },
              { id: 'audio', label: 'Sound Rig' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Furniture Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isUnlocked = level >= item.levelReq;
            const canAfford = item.luxePrice
              ? luxeCash >= item.luxePrice
              : cash >= item.price;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-black text-white">{item.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Lv.{item.levelReq}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] font-mono mb-4 text-emerald-400">
                    <span>+{item.hypeBonus}% Club Hype</span>
                    <span className="text-slate-400">
                      Size: {item.width}x{item.height}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuyItem(item)}
                  disabled={!isUnlocked || !canAfford}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {item.luxePrice ? (
                    <>
                      <Gem className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {!isUnlocked
                          ? `Requires Lv.${item.levelReq}`
                          : `Purchase (${item.luxePrice} Luxe)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {!isUnlocked
                          ? `Requires Lv.${item.levelReq}`
                          : `Buy ($${item.price.toLocaleString()})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
