import React from 'react';
import { Map, Star, Lock, Swords, X, Skull, Award } from 'lucide-react';
import { useCombatStore } from '../stores/combatStore';
import { Button } from "@/components/ui/Button";

export const CampaignMapModal: React.FC = () => {
  const {
    isCampaignMapOpen,
    closeCampaignMap,
    campaignSectors,
    initiateBattle,
  } = useCombatStore();

  if (!isCampaignMapOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-wide font-tactical">
                Archipelago Campaign Map
              </h3>
              <p className="text-xs text-slate-400">
                Liberate island sectors from General Castor & Raven Syndicate occupation
              </p>
            </div>
          </div>

          <button
            onClick={closeCampaignMap}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sectors Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
          {campaignSectors.map((sector) => {
            const isBoss = sector.difficulty === 5;

            return (
              <div
                key={sector.id}
                className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all ${
                  !sector.isUnlocked
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : isBoss
                    ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40 shadow-xl'
                    : 'bg-slate-850/80 border-slate-700 hover:border-amber-500/40 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-400">
                      Tier {sector.difficulty}
                    </span>

                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= sector.stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 mt-2 font-tactical">
                    {sector.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {sector.subtitle}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                    {isBoss ? (
                      <Skull className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Award className="w-4 h-4 text-blue-400" />
                    )}
                    <span>Commander: <strong className="text-slate-200">{sector.enemyCommander}</strong></span>
                  </div>

                  {/* Rewards preview */}
                  <div className="mt-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                    <span className="text-amber-400">+{sector.rewards.coins} Gold</span>
                    <span className="text-cyan-400">+{sector.rewards.oil} Oil</span>
                    <span className="text-emerald-400">+{sector.rewards.rareMaterial}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800">
                  {sector.isUnlocked ? (
                    <Button
                      variant={isBoss ? 'danger' : 'tactical'}
                      size="sm"
                      icon={<Swords className="w-4 h-4" />}
                      onClick={() => initiateBattle(sector.id)}
                      className="w-full font-bold uppercase tracking-wider"
                    >
                      {sector.isCompleted ? 'Replay Sector' : 'Deploy Squad'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      icon={<Lock className="w-4 h-4" />}
                      className="w-full"
                    >
                      Complete Prior Sector
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
