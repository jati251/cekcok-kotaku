import { useJunenStore } from '../store';
import { ArrowRight, Eye } from 'lucide-react';

interface JunenIntroProps {
  onStart: () => void;
  onInspect: (index: number | null) => void;
}

export const JunenIntro = ({ onStart, onInspect }: JunenIntroProps) => {
  const ready = useJunenStore((s) => s.ready);

  return (
    <div className="absolute left-6 sm:left-14 top-1/2 -translate-y-1/2 max-w-lg sm:max-w-xl z-20 select-none">
      {/* Dark gradient backdrop */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-950/75 border border-stone-800/60 backdrop-blur-md shadow-2xl text-stone-100">
        <span className="block text-xs font-bold tracking-[0.25em] text-amber-300 uppercase">
          A Neighborhood Fight Story
        </span>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none my-3 text-stone-100">
          JUNEN
          <span className="block text-xl sm:text-2xl font-light tracking-[0.3em] text-amber-200/90 mt-1">
            LAST STAND
          </span>
        </h1>

        <p className="text-sm sm:text-base text-stone-300 leading-relaxed mb-6 font-normal">
          A familiar lane. One long evening.
          <br />
          Stand your ground, from the water tank to the pink house.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <button
            disabled={!ready}
            onClick={onStart}
            className="flex items-center justify-between gap-4 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-wait text-stone-950 font-bold text-sm rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <span>{ready ? 'Enter the neighborhood' : 'Building the neighborhood…'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            disabled={!ready}
            onClick={() => onInspect(0)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-stone-100 text-xs font-medium rounded-lg transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            Inspect map from photo viewpoints
          </button>
        </div>

        {/* Controls quick summary */}
        <div className="mt-6 pt-5 border-t border-stone-800/80 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 rounded font-mono text-amber-200 text-[10px]">W A S D</kbd>
            Move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 rounded font-mono text-amber-200 text-[10px]">J</kbd>
            Strike
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 rounded font-mono text-amber-200 text-[10px]">K</kbd>
            Kick
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 rounded font-mono text-amber-200 text-[10px]">E</kbd>
            Counter
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 rounded font-mono text-amber-200 text-[10px]">SPACE</kbd>
            Dodge
          </span>
        </div>

        <small className="block text-[10px] text-stone-500 mt-4 italic">
          An original, compact combat game inspired by Jl. H. Junen neighborhood photos.
        </small>
      </div>
    </div>
  );
};
