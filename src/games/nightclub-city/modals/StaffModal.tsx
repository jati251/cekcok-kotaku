import React from 'react';
import { Users, X, Coins } from 'lucide-react';
import { useNightclubStore } from '../store/useNightclubStore';

export const StaffModal: React.FC = () => {
  const { closeModal, staff, cash, upgradeStaff } = useNightclubStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Nightclub Staff Roster
              </h2>
              <p className="text-xs text-slate-400">
                Train your mixologists, bouncers, dancers, and resident DJs to maximize club revenue
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

        {/* Staff Cards List */}
        <div className="p-6 space-y-3">
          {Object.values(staff).map((member) => {
            const isMax = member.level >= member.maxLevel;
            const canAfford = cash >= member.upgradeCost;

            return (
              <div
                key={member.role}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-white capitalize">{member.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                      Tier {member.level} / {member.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{member.benefit}</p>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Role: <strong className="capitalize text-white">{member.role}</strong>
                  </span>
                </div>

                {isMax ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                    Max Tier
                  </span>
                ) : (
                  <button
                    onClick={() => upgradeStaff(member.role)}
                    disabled={!canAfford}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Promote (${member.upgradeCost})</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
