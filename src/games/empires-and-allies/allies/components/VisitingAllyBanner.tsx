import React from 'react';
import { Home, HandHelping, ShieldCheck } from 'lucide-react';
import { useAllyStore } from '../stores/allyStore';
import { Button } from "@/components/ui/Button";

export const VisitingAllyBanner: React.FC = () => {
  const {
    activeVisitingAllyId,
    allies,
    helperActionsRemaining,
    returnHome,
  } = useAllyStore();

  if (!activeVisitingAllyId) return null;

  const ally = allies.find((a) => a.id === activeVisitingAllyId);
  if (!ally) return null;

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-2.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-blue-500/60 shadow-2xl animate-in slide-in-from-top-4 duration-200">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-blue-400" />
        <div>
          <h4 className="text-xs font-bold text-slate-100">
            Visiting Allied Base: <span className="text-blue-400">{ally.name}</span>
          </h4>
          <span className="text-[10px] text-slate-400">
            Click friend's buildings to assist operations (+25 Honor)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400">
        <HandHelping className="w-3.5 h-3.5" />
        <span>{helperActionsRemaining}/5 Actions Remaining</span>
      </div>

      <Button
        variant="primary"
        size="sm"
        icon={<Home className="w-4 h-4" />}
        onClick={returnHome}
      >
        Return to My Island
      </Button>
    </div>
  );
};
