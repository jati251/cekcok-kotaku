import React, { useState } from 'react';
import { Hammer, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { Item } from '../../types';

export const BlacksmithModal: React.FC = () => {
  const { closeModal, character, upgradeWeaponAtBlacksmith } = useNinjaSagaStore();
  const [selectedWeapon, setSelectedWeapon] = useState<Item | null>(
    character?.equippedWeapon || null
  );
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    level: number;
  } | null>(null);

  if (!character) return null;

  const currentLevel = selectedWeapon?.upgradeLevel || 0;
  const upgradeCost = (currentLevel + 1) * 350;
  const stoneItem = character.inventory.find(
    (i) => i.item.id === 'mat_enhancement_stone' && i.quantity > 0
  );
  const stoneQty = stoneItem?.quantity || 0;

  const canUpgrade =
    selectedWeapon &&
    currentLevel < 10 &&
    character.gold >= upgradeCost &&
    stoneQty > 0;

  const handleUpgrade = () => {
    if (!selectedWeapon || !canUpgrade) return;
    const res = upgradeWeaponAtBlacksmith(selectedWeapon);
    setLastResult({ success: res.success, level: res.newLevel });

    if (res.success) {
      setSelectedWeapon({
        ...selectedWeapon,
        upgradeLevel: res.newLevel,
        stats: {
          ...selectedWeapon.stats,
          attack: Math.round((selectedWeapon.stats?.attack || 20) * 1.15),
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Village Blacksmith Forge
              </h2>
              <p className="text-xs text-slate-400">
                Enhance your weapons with meteoric stones to drastically amplify attack power
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

        {/* Forge Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Weapon Showcase */}
          {selectedWeapon ? (
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-3xl p-6 text-center mb-6 shadow-inner">
              <h3 className="text-lg font-black text-amber-400 mb-1">
                {selectedWeapon.name} {currentLevel > 0 ? `+${currentLevel}` : ''}
              </h3>
              <p className="text-xs text-slate-400 mb-4">{selectedWeapon.description}</p>

              <div className="flex items-center justify-center gap-6 text-sm font-mono mb-4">
                <div className="text-slate-300">
                  Current Attack:{' '}
                  <strong className="text-white">{selectedWeapon.stats?.attack || 0}</strong>
                </div>
                <div className="text-emerald-400 font-bold">
                  → Next Level:{' '}
                  <strong>{Math.round((selectedWeapon.stats?.attack || 20) * 1.15)}</strong>
                </div>
              </div>

              {/* Forge Status Message */}
              {lastResult && (
                <div
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-2 ${
                    lastResult.success
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                  }`}
                >
                  {lastResult.success ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Forge Succeeded! Weapon upgraded to +{lastResult.level}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Enhancement Failed! Enhancement stone shattered.</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-6 italic">
              No weapon equipped. Equip a weapon from Character menu to forge.
            </p>
          )}

          {/* Requirements Card */}
          <div className="w-full bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between mb-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">
                Gold Cost
              </span>
              <strong className="text-amber-400">{upgradeCost} Gold</strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">
                Enhancement Stones
              </span>
              <strong className={stoneQty > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {stoneQty} / 1 Required
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">
                Success Chance
              </span>
              <strong className="text-sky-400">
                {Math.round(Math.max(0.45, 1.0 - currentLevel * 0.06) * 100)}%
              </strong>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {currentLevel >= 10
                ? 'Max Level Reached (+10)'
                : `Forge Weapon (+${currentLevel + 1})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
