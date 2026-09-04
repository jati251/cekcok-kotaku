import React from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { ShoppingBag } from 'lucide-react';

export const QuickBuyBar: React.FC = () => {
  const { quickBuyItem, playerTelemetry, buyItem, toggleShop } = useMobaStore();

  if (!quickBuyItem) return null;

  const canAfford = playerTelemetry.gold >= quickBuyItem.cost;

  return (
    <div className="flex items-center gap-2">
      {/* Quick Buy Card */}
      <button
        onClick={() => buyItem(quickBuyItem.id)}
        disabled={!canAfford}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md transition shadow-lg active:scale-95 ${
          canAfford
            ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30 animate-pulse'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 opacity-60'
        }`}
      >
        <span className="text-xl">{quickBuyItem.icon}</span>
        <div className="text-left">
          <div className="text-[11px] font-bold leading-none">{quickBuyItem.name}</div>
          <div className="text-[10px] font-mono text-amber-400 font-bold">
            💰 {quickBuyItem.cost}
          </div>
        </div>
      </button>

      {/* Shop Opener Button */}
      <button
        onClick={toggleShop}
        className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-400 flex items-center justify-center text-amber-400 active:scale-95 transition shadow-lg"
      >
        <ShoppingBag size={18} />
      </button>
    </div>
  );
};
