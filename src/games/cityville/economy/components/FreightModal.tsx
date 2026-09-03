// CityVille Freight Terminal: Cargo Ships & Freight Trains

import React from 'react';
import { X, Ship, Train, Coins, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useCityEconomyStore } from '../stores/cityEconomyStore';
import { Button } from '@/components/ui/Button';

export const FreightModal: React.FC = () => {
  const {
    isFreightModalOpen,
    closeFreightModal,
    freightContracts,
    orderFreight,
    claimFreight,
    coins,
  } = useCityEconomyStore();

  if (!isFreightModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Freight & Shipping Terminal</h3>
              <p className="text-xs text-slate-400">Order long-distance freight imports to supply your city stores</p>
            </div>
          </div>
          <button
            onClick={closeFreightModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contracts */}
        <div className="mt-5 space-y-4">
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
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
                    {contract.transportType === 'cargo_ship' ? (
                      <Ship className="w-6 h-6 text-cyan-400" />
                    ) : (
                      <Train className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{contract.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                      <span className="text-amber-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {contract.costCoins}
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        +{contract.goodsReward} Goods
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {contract.deliverySeconds}s
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {contract.isDelivering ? (
                    isReady ? (
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => claimFreight(contract.id)}
                        className="font-bold text-xs"
                      >
                        Unload Goods!
                      </Button>
                    ) : (
                      <span className="text-xs font-mono text-cyan-400 animate-pulse">
                        In Transit ({Math.ceil(contract.deliverySeconds - elapsed)}s)
                      </span>
                    )
                  ) : (
                    <Button
                      variant={canAfford ? 'tactical' : 'secondary'}
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => orderFreight(contract.id)}
                      className="font-bold text-xs"
                    >
                      Dispatch
                    </Button>
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
