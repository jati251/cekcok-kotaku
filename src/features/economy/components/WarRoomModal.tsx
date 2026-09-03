import React from 'react';
import { Radiation, Zap, Flame, Shield, X, Sparkles, Box } from 'lucide-react';
import { useWarRoomStore } from '../stores/warRoomStore';
import { SUPERWEAPONS } from '../../../config/gameData';
import { Button } from '../../../components/ui/Button';

export const WarRoomModal: React.FC = () => {
  const {
    isOpen,
    closeWarRoom,
    materials,
    superweaponsInventory,
    craftSuperweapon,
  } = useWarRoomStore();

  if (!isOpen) return null;

  const getWeaponIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radiation': return <Radiation className="w-6 h-6 text-amber-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-cyan-400" />;
      default: return <Flame className="w-6 h-6 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-wide font-tactical">
                HQ War Room & Superweapons Foundry
              </h3>
              <p className="text-xs text-slate-400">
                Synthesize rare battlefield materials into catastrophic tactical strikes
              </p>
            </div>
          </div>

          <button
            onClick={closeWarRoom}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* War Materials Inventory Strip */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Box className="w-4 h-4 text-amber-400" /> War Materials:
          </span>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Aluminum:</span>
              <strong className="text-slate-200">{materials.aluminum}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Steel:</span>
              <strong className="text-slate-200">{materials.steel}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Rubber:</span>
              <strong className="text-slate-200">{materials.rubber}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Copper:</span>
              <strong className="text-slate-200">{materials.copper}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Microchips:</span>
              <strong className="text-cyan-400 font-bold">{materials.microchips}</strong>
            </div>
          </div>
        </div>

        {/* Superweapons Catalog */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {SUPERWEAPONS.map((weapon) => {
            const currentStock = superweaponsInventory[weapon.id] || 0;

            const canCraft = Object.entries(weapon.cost).every(
              ([mat, req]) => materials[mat as keyof typeof materials] >= (req || 0)
            );

            return (
              <div
                key={weapon.id}
                className="p-4 rounded-xl bg-slate-850/90 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {getWeaponIcon(weapon.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{weapon.name}</h4>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
                        Stock: {currentStock} Ready
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {weapon.description}
                    </p>

                    {/* Cost pills */}
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-slate-500">Materials:</span>
                      {Object.entries(weapon.cost).map(([mat, req]) => (
                        <span
                          key={mat}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            materials[mat as keyof typeof materials] >= (req || 0)
                              ? 'bg-slate-800 text-emerald-300'
                              : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {req} {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant={canCraft ? 'tactical' : 'secondary'}
                  size="sm"
                  disabled={!canCraft}
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={() => craftSuperweapon(weapon.id)}
                  className="shrink-0"
                >
                  {canCraft ? 'Fabricate' : 'Lacking Parts'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
