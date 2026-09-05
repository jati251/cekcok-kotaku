// CityVille Freight Terminal: Cargo Ships & Freight Trains with Retro Styling & Audio

import React from 'react';
import { X, Ship, Train, Coins, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useCityEconomyStore } from '../stores/cityEconomyStore';
import { useCityThemeStore } from '../../stores/cityThemeStore';
import { cityAudio } from '../../audio/cityAudio';

export const FreightModal: React.FC = () => {
  const {
    isFreightModalOpen,
    closeFreightModal,
    freightContracts,
    orderFreight,
    claimFreight,
    coins,
  } = useCityEconomyStore();

  const { addFloatingText } = useCityThemeStore();

  if (!isFreightModalOpen) return null;

  const handleOrder = (contractId: string) => {
    cityAudio.playClick();
    orderFreight(contractId);
  };

  const handleClaim = (contractId: string, goodsReward: number) => {
    cityAudio.playHarvest();
    claimFreight(contractId);
    addFloatingText(`+${goodsReward} FREIGHT GOODS!`, 9, 9, '#34d399');
  };

  const handleClose = () => {
    cityAudio.playClick();
    closeFreightModal();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-arcade select-none">
      <div className="relative w-full max-w-xl rounded bg-neutral-950 border-2 border-cyan-500/80 shadow-[0_0_35px_rgba(6,182,212,0.25)] p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-700">
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-pixel font-bold text-cyan-300">
                FREIGHT & DOCK TERMINAL '95
              </h3>
              <p className="text-[9px] text-neutral-400 mt-0.5">
                Dispatch long-distance cargo ships to import massive goods supplies
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contracts */}
        <div className="mt-4 space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {freightContracts.map((contract) => {
            const canAfford = coins >= contract.costCoins;
            let elapsed = 0;
            let isReady = false;

            if (contract.isDelivering && contract.orderedAt) {
              elapsed = (Date.now() - contract.orderedAt) / 1000;
              isReady = elapsed >= contract.deliverySeconds;
            }

            return (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 rounded bg-neutral-900 border border-neutral-800 hover:border-cyan-500/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-cyan-400">
                    {contract.transportType === 'cargo_ship' ? (
                      <Ship className="w-5 h-5" />
                    ) : (
                      <Train className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-100">{contract.title}</h4>
                    <div className="flex items-center gap-2.5 mt-1.5 font-pixel text-[8px]">
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Coins className="w-2.5 h-2.5" />
                        {contract.costCoins}
                      </span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Package className="w-2.5 h-2.5" />+{contract.goodsReward} GOODS
                      </span>
                      <span className="text-neutral-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {contract.deliverySeconds}S
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-3 flex-shrink-0">
                  {contract.isDelivering ? (
                    isReady ? (
                      <button
                        onClick={() => handleClaim(contract.id, contract.goodsReward)}
                        className="px-3 py-1.5 rounded font-pixel text-[8px] uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-400 transition cursor-pointer shadow flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>UNLOAD!</span>
                      </button>
                    ) : (
                      <span className="font-pixel text-[8px] text-cyan-400 animate-pulse">
                        IN TRANSIT ({Math.ceil(contract.deliverySeconds - elapsed)}S)
                      </span>
                    )
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => handleOrder(contract.id)}
                      className={`px-3 py-1.5 rounded font-pixel text-[8px] uppercase tracking-wider transition cursor-pointer border shadow ${
                        canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold border-cyan-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'DISPATCH' : 'NO COINS'}
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
