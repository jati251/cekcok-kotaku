import { useJunenStore } from '../store';
import type { Quality } from '../runtime';
import { Pause } from 'lucide-react';

interface JunenHeaderProps {
  onPause: () => void;
  onQualityChange: (quality: Quality) => void;
  onInspect?: (index: number | null) => void;
}

export const JunenHeader = ({ onPause, onQualityChange, onInspect }: JunenHeaderProps) => {
  const quality = useJunenStore((s) => s.quality);
  const status = useJunenStore((s) => s.snapshot.status);
  const photoView = useJunenStore((s) => s.photoView);

  return (
    <header className="absolute left-5 right-5 top-5 sm:left-9 sm:right-9 sm:top-6 flex justify-between items-center pointer-events-none z-20 select-none">
      {/* Location Badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-10 border border-amber-100/60 flex items-center justify-center font-serif italic text-2xl text-amber-100 bg-stone-900/40 backdrop-blur-xs shadow-md">
          J
        </div>
        <div className="flex flex-col text-stone-100 drop-shadow-md">
          <span className="text-[9px] sm:text-[10px] tracking-[0.25em] font-bold text-amber-200/80">
            JAKARTA TIMUR
          </span>
          <strong className="text-sm sm:text-[17px] font-semibold tracking-wide">
            Jl. H. Junen
          </strong>
        </div>
      </div>

      {/* Options & Controls */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <select
          aria-label="Graphics quality"
          value={quality}
          onChange={(e) => onQualityChange(e.target.value as Quality)}
          className="bg-stone-900/80 hover:bg-stone-900 text-stone-200 text-xs px-3 py-1.5 border border-stone-600/50 rounded-md backdrop-blur-md transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <option value="cinematic">Cinematic</option>
          <option value="balanced">Balanced</option>
        </select>

        {photoView === null && onInspect && (
          <button
            onClick={() => onInspect(0)}
            aria-label="Inspect reference photos"
            className="flex items-center gap-1.5 bg-stone-900/80 hover:bg-stone-800 text-amber-300 text-xs px-3 py-1.5 border border-amber-600/50 rounded-md backdrop-blur-md transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <span>📷 Photos</span>
          </button>
        )}

        {status === 'playing' && (
          <button
            onClick={onPause}
            aria-label="Pause game"
            className="flex items-center gap-1.5 bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-xs px-3 py-1.5 border border-stone-600/50 rounded-md backdrop-blur-md transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Pause className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Pause</span>
          </button>
        )}
      </div>
    </header>
  );
};
