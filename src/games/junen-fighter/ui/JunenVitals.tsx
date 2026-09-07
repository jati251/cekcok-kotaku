import { useJunenStore } from '../store';
import { JunenMinimap } from './JunenMinimap';

export const JunenVitals = () => {
  const hp = useJunenStore((s) => s.snapshot.hp);
  const stamina = useJunenStore((s) => s.snapshot.stamina);

  const displayHp = Math.ceil(hp);
  const displayStamina = Math.round(stamina);

  return (
    <footer className="absolute left-5 right-5 bottom-5 sm:left-9 sm:right-9 sm:bottom-6 flex items-end justify-between gap-6 pointer-events-none z-20 select-none">
      {/* Health & Stamina Meters */}
      <div className="w-48 sm:w-60 p-3 rounded-lg bg-stone-900/80 border border-stone-700/40 backdrop-blur-md shadow-xl text-stone-100">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <strong className="tracking-wider text-amber-100 font-bold">YOU</strong>
          <span className="font-mono text-stone-300 font-semibold">{displayHp} / 100</span>
        </div>

        {/* Health Bar */}
        <div
          className="h-2 w-full bg-stone-950/80 rounded-sm overflow-hidden border border-stone-800"
          role="meter"
          aria-label="Health"
          aria-valuenow={hp}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full transition-all duration-100 ease-out rounded-xs ${
              hp > 30 ? 'bg-gradient-to-r from-emerald-500 to-lime-400' : 'bg-gradient-to-r from-red-600 to-amber-500 animate-pulse'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
          />
        </div>

        {/* Stamina Bar */}
        <div
          className="h-1.5 w-full bg-stone-950/80 rounded-sm overflow-hidden mt-1.5 border border-stone-800"
          role="meter"
          aria-label="Stamina"
          aria-valuenow={displayStamina}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-75 rounded-xs"
            style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
          />
        </div>

        <div className="flex justify-between text-[8px] sm:text-[9px] tracking-wider text-stone-400 font-medium mt-1.5 uppercase">
          <span>Stamina</span>
          <span className="font-mono text-amber-200">{displayStamina}%</span>
        </div>
      </div>

      {/* Combat Keys & Controls Bar */}
      <div className="hidden md:flex flex-col items-center text-center px-4 py-2.5 rounded-lg bg-stone-900/70 border border-stone-700/40 backdrop-blur-md shadow-lg text-stone-200">
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-[10px] text-amber-200 font-mono shadow-xs">J</kbd>
            Strike
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-[10px] text-amber-200 font-mono shadow-xs">K</kbd>
            Kick
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-[10px] text-amber-200 font-mono shadow-xs">E</kbd>
            Counter
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-[10px] text-amber-200 font-mono shadow-xs">SPACE</kbd>
            Dodge
          </span>
        </div>
        <span className="text-[10px] text-stone-400 mt-1">
          WASD move · Shift sprint · Hold right mouse to look · P pause
        </span>
      </div>

      {/* Minimap */}
      <JunenMinimap />
    </footer>
  );
};
