import { useJunenStore } from '../store';

export const JunenObjective = () => {
  const stage = useJunenStore((s) => s.snapshot.stage);
  const message = useJunenStore((s) => s.snapshot.message);
  const defeated = useJunenStore((s) => s.snapshot.defeated);
  const chain = useJunenStore((s) => s.snapshot.chain);

  return (
    <>
      {/* Current Objective Banner */}
      <div className="absolute left-5 sm:left-9 top-20 sm:top-24 max-w-[280px] sm:max-w-sm pointer-events-none z-10 text-stone-100 drop-shadow-md select-none">
        <span className="block text-[9px] sm:text-[10px] tracking-[0.2em] font-bold text-amber-300/90">
          ENCOUNTER {Math.min(3, Math.max(1, stage))} / 3
        </span>
        <strong className="block text-base sm:text-xl font-medium tracking-wide my-1 text-amber-100">
          {message}
        </strong>
        <span className="text-xs text-stone-300 font-normal">
          {defeated} / 9 opponents down
        </span>
      </div>

      {/* Hit Chain Combo Counter */}
      {chain > 1 && (
        <div className="absolute right-5 sm:right-9 top-20 sm:top-24 text-right pointer-events-none z-10 select-none animate-bounce">
          <div className="text-4xl sm:text-6xl font-black italic tracking-tighter text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
            {chain}
            <span className="text-2xl sm:text-3xl text-amber-400 not-italic ml-0.5">×</span>
          </div>
          <span className="block text-[9px] sm:text-[10px] tracking-[0.25em] font-bold text-stone-200 uppercase">
            Hit Chain
          </span>
        </div>
      )}
    </>
  );
};
