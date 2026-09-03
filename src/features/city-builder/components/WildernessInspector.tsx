import React from 'react';
import { Axe, Zap, Coins, Trees, X, Sparkles } from 'lucide-react';
import { useWildernessStore } from '../stores/wildernessStore';
import { Button } from '../../../components/ui/Button';

export const WildernessInspector: React.FC = () => {
  const {
    obstacles,
    selectedObstacleId,
    selectObstacle,
    clearObstacle,
  } = useWildernessStore();

  if (!selectedObstacleId) return null;

  const obstacle = obstacles.find((o) => o.id === selectedObstacleId);
  if (!obstacle) return null;

  return (
    <div className="fixed top-20 right-5 z-30 w-80 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Axe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{obstacle.name}</h4>
            <span className="text-[10px] text-slate-400 capitalize">
              Unclaimed Wilderness Plot
            </span>
          </div>
        </div>
        <button
          onClick={() => selectObstacle(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
        Clear this obstacle to reclaim island ground for military buildings and harvest valuable resources.
      </p>

      {/* Rewards preview */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Yields:
        </span>
        <div className="flex items-center gap-2">
          {obstacle.rewards.wood && (
            <span className="text-emerald-400 flex items-center gap-1">
              <Trees className="w-3 h-3" />+{obstacle.rewards.wood}
            </span>
          )}
          {obstacle.rewards.coins && (
            <span className="text-amber-400 flex items-center gap-1">
              <Coins className="w-3 h-3" />+{obstacle.rewards.coins}
            </span>
          )}
          {obstacle.rewards.materialItem && (
            <span className="text-cyan-400 font-bold uppercase">
              +{obstacle.rewards.materialItem}
            </span>
          )}
        </div>
      </div>

      {/* Clear action */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-blue-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-blue-400" />
            {obstacle.clearCost.energy} Energy
          </span>
          <span className="text-amber-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            {obstacle.clearCost.coins}
          </span>
        </div>

        <Button
          variant="tactical"
          size="sm"
          icon={<Axe className="w-3.5 h-3.5" />}
          onClick={() => clearObstacle(obstacle.id)}
        >
          Clear Land
        </Button>
      </div>
    </div>
  );
};
