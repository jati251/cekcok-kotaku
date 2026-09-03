import React from 'react';
import { Gamepad2, Settings, ShieldCheck, LayoutGrid, Columns2 } from 'lucide-react';
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
    <header className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-wide">
            Cekcok Kotaku
          </h1>
          <p className="text-[10px] text-slate-400">
            Social game preservation launcher
          </p>
        </div>
      </div>

      {/* View toggle: meaningful because the two layouts serve different browsing tasks */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
        <button
          onClick={() => setLauncherLayoutMode('studio')}
          title="List view with details panel"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            launcherLayoutMode === 'studio'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          List
        </button>
        <button
          onClick={() => setLauncherLayoutMode('grid')}
          title="Grid view for browsing"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            launcherLayoutMode === 'grid'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Grid
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 leading-tight">{commanderName}</span>
            <span className="text-[10px] text-slate-400 leading-tight">{rankTitle}</span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Settings className="w-3.5 h-3.5" />}
          onClick={openSettings}
        >
          Settings
        </Button>
      </div>
    </header>
  );
};
