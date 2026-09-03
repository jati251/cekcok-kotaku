import React from 'react';
import { Users, Eye, HandHelping } from 'lucide-react';
import { useAllyStore } from '../stores/allyStore';
import { Button } from '../../../components/ui/Button';

export const AllyBar: React.FC = () => {
  const {
    allies,
    activeVisitingAllyId,
    helperActionsRemaining,
    visitAlly,
  } = useAllyStore();

  if (activeVisitingAllyId) return null; // Hidden while visiting

  return (
    <div className="fixed bottom-4 right-5 z-20 flex items-center gap-3 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
      <div className="flex items-center gap-2 pl-2">
        <Users className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-slate-200 hidden sm:inline">
          Allies ({allies.length})
        </span>
      </div>

      <div className="w-px h-6 bg-slate-800" />

      {/* Ally Avatars */}
      <div className="flex items-center gap-2">
        {allies.map((ally) => (
          <div
            key={ally.id}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition cursor-pointer"
            onClick={() => visitAlly(ally.id)}
          >
            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white border border-blue-400/40">
              {ally.name.charAt(0)}
              <span className="absolute -bottom-1 -right-1 px-1 text-[8px] bg-slate-950 rounded text-amber-400 font-bold border border-slate-800">
                {ally.level}
              </span>
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100">{ally.name}</span>
              <span className="text-[9px] text-slate-400">{ally.title}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Eye className="w-3 h-3" />}
              className="text-[10px] px-2 py-0.5"
            >
              Visit
            </Button>
          </div>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-amber-400">
        <HandHelping className="w-3.5 h-3.5" />
        <span>{helperActionsRemaining}/5 Assists Left</span>
      </div>
    </div>
  );
};
