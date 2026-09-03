// CityVille Retro Modular Game Container

import React from 'react';
import { Building2, Store, Users, Package, Home, ArrowLeft } from 'lucide-react';
import { useLauncherStore } from "@/stores/launcherStore";
import { Button } from "@/components/ui/Button";

export const CityVilleGame: React.FC = () => {
  const { exitToLauncher } = useLauncherStore();

  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-radial from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">CityVille Retro</h2>
            <span className="text-[10px] text-indigo-400 font-mono">Module Alpha Preview</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Home className="w-4 h-4" />}
          onClick={exitToLauncher}
        >
          Return to Launcher
        </Button>
      </header>

      {/* Main Roadmap & Teaser Card */}
      <div className="relative z-10 max-w-xl w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30">
          <Store className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
          Metropolis Under Construction
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The CityVille engine module is structured and ready for implementation. Franchise stores, goods delivery supply chains, community landmarks, and citizen happiness systems are primed for integration.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 text-left">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Citizens</span>
            </div>
            <p className="text-[10px] text-slate-400">Housing & population zoning</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
              <Store className="w-3.5 h-3.5" />
              <span>Franchises</span>
            </div>
            <p className="text-[10px] text-slate-400">Bakeries, toy stores & cafes</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
              <Package className="w-3.5 h-3.5" />
              <span>Goods</span>
            </div>
            <p className="text-[10px] text-slate-400">Trucks & train deliveries</p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            variant="tactical"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={exitToLauncher}
            className="w-full font-bold uppercase tracking-wider"
          >
            Back to Game Library
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CityVilleGame;
