import React, { useState } from 'react';
import { ShoppingBag, X, Coins } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { ITEMS } from '../../data/items';
import { ItemType } from '../../types';

export const ShopModal: React.FC = () => {
  const { closeModal, character, buyItem, sellItem } = useNinjaSagaStore();
  const [selectedType, setSelectedType] = useState<ItemType | 'sell'>('weapon');

  if (!character) return null;

  const filteredItems = ITEMS.filter((item) => item.type === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Village Merchant
              </h2>
              <p className="text-xs text-slate-400">
                Purchase weapons, defensive garments, tactical back gear, and medical scrolls
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 text-amber-400 font-mono font-bold text-xs">
              <Coins className="w-3.5 h-3.5" />
              <span>{character.gold} Gold</span>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          {(['weapon', 'armor', 'back_item', 'consumable', 'material'] as ItemType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                selectedType === type
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
          <button
            onClick={() => setSelectedType('sell')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ml-auto ${
              selectedType === 'sell'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Sell Gear
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedType === 'sell' ? (
            <div className="grid grid-cols-2 gap-3">
              {character.inventory.map((inv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {inv.item.name} {inv.quantity > 1 ? `x${inv.quantity}` : ''}
                    </h4>
                    <span className="text-[10px] text-amber-400 font-mono">
                      +{inv.item.sellPrice} Gold each
                    </span>
                  </div>
                  <button
                    onClick={() => sellItem(inv.item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Sell
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const canAfford = character.gold >= item.price;
                const meetsLevel = character.level >= item.levelReq;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          Lv.{item.levelReq}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">{item.description}</p>
                      {item.stats && (
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-emerald-400 mb-4">
                          {item.stats.attack && <span>+ATK {item.stats.attack}</span>}
                          {item.stats.defense && <span>+DEF {item.stats.defense}</span>}
                          {item.stats.hp && <span>+HP {item.stats.hp}</span>}
                          {item.stats.cp && <span>+CP {item.stats.cp}</span>}
                          {item.stats.critRate && <span>+CRIT {item.stats.critRate}%</span>}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => buyItem(item)}
                      disabled={!canAfford || !meetsLevel}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {!meetsLevel
                          ? `Requires Lv.${item.levelReq}`
                          : `Buy (${item.price} Gold)`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
