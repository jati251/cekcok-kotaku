import React from 'react';
import { Droplets, X, Sparkles, Coins } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';
import { CAR_CATALOG } from '../data/cars';

export const CarWashModal: React.FC = () => {
  const { closeModal, activeCarId, ownedCars, carWashProgress, washCarStep } = useCarTownStore();

  const activeCar = ownedCars.find((c) => c.id === activeCarId) || ownedCars[0];
  const model = CAR_CATALOG.find((m) => m.id === activeCar?.modelId);

  if (!activeCar) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                Car Town Car Wash
              </h2>
              <p className="text-xs text-slate-400">
                Scrub off road grime, get high-gloss shine & earn bonus tips!
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-4">
            <h3 className="text-base font-black text-slate-100">
              {activeCar.nickname || model?.name}
            </h3>
            <p className="text-xs text-slate-400">
              Dirt Level: <span className="text-amber-400 font-bold">{activeCar.dirtLevel}%</span>
            </p>
          </div>

          {/* Interactive Scrubbing Bay */}
          <div
            onClick={washCarStep}
            className="w-full h-56 rounded-3xl bg-gradient-to-b from-cyan-950/40 to-slate-950 border-2 border-dashed border-cyan-500/40 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition relative overflow-hidden shadow-inner group"
          >
            {/* Bubble graphics overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-around">
              <span className="text-4xl animate-bounce">🫧</span>
              <span className="text-3xl animate-pulse">🫧</span>
              <span className="text-5xl animate-bounce">🫧</span>
            </div>

            {/* Stylized Car Silhouette */}
            <div
              className="w-48 h-20 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center text-4xl transform group-active:scale-95 transition"
              style={{ backgroundColor: activeCar.visuals.color }}
            >
              🏎️
            </div>

            <div className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" /> Tap / Click to Scrub Sponge!
            </div>
          </div>

          {/* Cleanliness Progress Bar */}
          <div className="w-full mt-6">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Wash & Polish Progress</span>
              <span className="text-cyan-400">{carWashProgress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${carWashProgress}%` }}
              />
            </div>
          </div>

          {/* Reward Guarantee */}
          <div className="flex items-center gap-4 mt-6 text-xs font-bold text-slate-300 bg-slate-800/40 px-5 py-2.5 rounded-2xl border border-slate-700/60">
            <span className="flex items-center gap-1 text-amber-400">
              <Coins className="w-4 h-4" /> +350 Coins Tip
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-4 h-4" /> +40 XP
            </span>
            <span>•</span>
            <span className="text-cyan-400">100% Mirror Finish</span>
          </div>
        </div>
      </div>
    </div>
  );
};
