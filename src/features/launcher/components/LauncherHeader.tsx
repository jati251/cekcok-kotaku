import React from 'react';
import { Gamepad2, Settings, ShieldCheck } from 'lucide-react';
import { useLauncherStore } from "@/stores/launcherStore";
import { Button } from "@/components/ui/Button";

export const LauncherHeader: React.FC = () => {
  const { commanderName, rankTitle, openSettings } = useLauncherStore();

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-100 tracking-wider font-tactical">
              CEKCOK KOTAKU
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              Launcher v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Retro Social Strategy & Simulation Gaming Suite
          </p>
        </div>
      </div>

      {/* Profile & Settings */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200">{commanderName}</span>
            <span className="text-[10px] text-slate-400">{rankTitle}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Settings className="w-4 h-4" />}
          onClick={openSettings}
        >
          Settings
        </Button>
      </div>
    </header>
  );
};
