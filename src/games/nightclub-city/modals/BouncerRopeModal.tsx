import React from 'react';
import { ShieldAlert, X, Check, Ban, Star, Crown, AlertTriangle } from 'lucide-react';
import { useNightclubStore } from '../store/useNightclubStore';

export const BouncerRopeModal: React.FC = () => {
  const { closeModal, doorQueue, admitGuest, rejectGuest, guests, capacity } =
    useNightclubStore();

  const isClubFull = guests.length >= capacity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Velvet Rope Security
              </h2>
              <p className="text-xs text-slate-400">
                Admit stylish VIPs for entry fees and turn away troublemakers to maintain club hype
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

        {/* Capacity Banner */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-slate-400">Current Occupancy: </span>
            <strong className={isClubFull ? 'text-rose-400' : 'text-emerald-400'}>
              {guests.length} / {capacity} Guests
            </strong>
          </div>
          {isClubFull && (
            <span className="text-rose-400 font-bold text-[11px] animate-pulse">
              CLUB IS AT MAXIMUM CAPACITY
            </span>
          )}
        </div>

        {/* Queue Line */}
        <div className="p-6 space-y-3">
          {doorQueue.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic">
              The velvet rope line is currently clear. More partygoers are arriving shortly!
            </div>
          ) : (
            doorQueue.map((guest, idx) => (
              <div
                key={guest.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition shadow-md ${
                  guest.isVIP
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : guest.isTroublemaker
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: guest.avatarColor }}
                    className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center text-slate-950 font-black text-sm shadow-md"
                  >
                    {guest.isVIP ? <Crown className="w-5 h-5 text-amber-300" /> : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{guest.name}</h4>
                      {guest.isVIP && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                          VIP Guest
                        </span>
                      )}
                      {guest.isTroublemaker && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Troublemaker</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: guest.styleRating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-emerald-400 font-bold">
                        Pays: ${guest.entryFee}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => rejectGuest(idx)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-200 transition cursor-pointer"
                    title="Reject Entry"
                  >
                    <Ban className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => admitGuest(idx)}
                    disabled={isClubFull}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Admit</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
