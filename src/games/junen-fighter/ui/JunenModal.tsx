import { useJunenStore } from '../store';
import { ArrowRight, RotateCcw, Play } from 'lucide-react';

interface JunenModalProps {
  onResume: () => void;
  onRestart: () => void;
}

export const JunenModal = ({ onResume, onRestart }: JunenModalProps) => {
  const status = useJunenStore((s) => s.snapshot.status);
  const score = useJunenStore((s) => s.snapshot.score);
  const defeated = useJunenStore((s) => s.snapshot.defeated);
  const elapsed = useJunenStore((s) => s.snapshot.elapsed);
  const error = useJunenStore((s) => s.error);
  const reloadScene = useJunenStore((s) => s.reloadScene);

  if (error) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-stone-950/85 backdrop-blur-md p-6 z-50 select-none">
        <div className="max-w-md w-full p-8 rounded-2xl bg-stone-900 border border-stone-700/60 shadow-2xl text-stone-100 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Scene Unavailable</h2>
          <p className="text-stone-300 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={reloadScene}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg transition cursor-pointer shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Scene
          </button>
        </div>
      </div>
    );
  }

  if (status !== 'paused' && status !== 'won' && status !== 'lost') {
    return null;
  }

  const isPaused = status === 'paused';
  const isWon = status === 'won';

  const title = isPaused ? 'Take a breath.' : isWon ? 'The lane is yours.' : 'Back on your feet.';
  const description = isPaused
    ? 'Counter with E when the amber marker grows. Dodge to make space, then follow with a kick.'
    : isWon
      ? 'All three encounters cleared. The neighborhood settles into the evening.'
      : 'Keep an eye on stamina. Time your counters just before an opponent strikes.';

  const minutes = Math.floor(elapsed / 60);
  const seconds = String(Math.floor(elapsed % 60)).padStart(2, '0');

  return (
    <div className="absolute inset-0 grid place-items-center bg-stone-950/80 backdrop-blur-md p-6 z-40 select-none">
      <div className="max-w-lg w-full p-8 rounded-2xl bg-stone-900/90 border border-stone-700/60 shadow-2xl text-stone-100">
        <span className="text-[10px] tracking-[0.25em] font-bold text-amber-300 uppercase">
          Junen / Last Stand
        </span>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight my-2 text-stone-100">
          {title}
        </h2>

        <p className="text-sm text-stone-300 leading-relaxed mb-6 font-normal">
          {description}
        </p>

        {/* Results grid */}
        <div className="grid grid-cols-3 gap-4 py-4 px-5 rounded-xl bg-stone-950/60 border border-stone-800/80 mb-6 text-center">
          <div>
            <span className="block text-2xl font-bold text-amber-200 font-mono">
              {score.toLocaleString()}
            </span>
            <span className="text-[9px] tracking-widest text-stone-400 font-semibold uppercase">
              Score
            </span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-emerald-400 font-mono">
              {defeated} / 9
            </span>
            <span className="text-[9px] tracking-widest text-stone-400 font-semibold uppercase">
              Defeated
            </span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-stone-200 font-mono">
              {minutes}:{seconds}
            </span>
            <span className="text-[9px] tracking-widest text-stone-400 font-semibold uppercase">
              Time
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={isPaused ? onResume : onRestart}
            className="flex items-center justify-between px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg shadow-lg hover:shadow-amber-500/20 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <RotateCcw className="w-4 h-4" />}
              {isPaused ? 'Continue' : 'Play Again'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {isPaused && (
            <button
              onClick={onRestart}
              className="py-2.5 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer text-center"
            >
              Restart encounters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
