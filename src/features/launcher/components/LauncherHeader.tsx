// Desktop Launcher Header: Brand, Navigation View Switcher, Commander Rank, and Settings

import React from 'react';
import { Gamepad2, Settings, ShieldCheck, LayoutGrid, SplitSquareVertical } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { Button } from '@/components/ui/Button';

export const LauncherHeader: React.FC = () => {
  const {
    commanderName,
    rankTitle,
    openSettings,
    launcherLayoutMode,
    setLauncherLayoutMode,
  } = useLauncherStore();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shrink-0 select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white shadow-md border border-indigo-400/30">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-slate-100 tracking-wider font-tactical">
              CEKCOK KOTAKU
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest font-mono">
              Desktop Suite v2.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Social Strategy & Preservation Game Engine
          </p>
        </div>
      </div>

      {/* View Switcher: Studio (Split) vs Grid */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setLauncherLayoutMode('studio')}
          title="Split Library & Dossier View"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            launcherLayoutMode === 'studio'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>

        <button
          onClick={() => setLauncherLayoutMode('grid')}
          title="Poster Grid View"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            launcherLayoutMode === 'grid'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Vault Grid</span>
        </button>
      </div>

      {/* Profile & Settings */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200 leading-tight">{commanderName}</span>
            <span className="text-[10px] text-slate-400 leading-tight">{rankTitle}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Settings className="w-3.5 h-3.5" />}
          onClick={openSettings}
        >
          Config
        </Button>
      </div>
    </header>
  );
};
