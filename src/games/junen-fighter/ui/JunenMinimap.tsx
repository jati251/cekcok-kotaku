import { useJunenStore } from '../store';
import { LANDMARK_STAGES } from '../neighborhood';

export const JunenMinimap = () => {
  const x = useJunenStore((s) => s.snapshot.x);
  const z = useJunenStore((s) => s.snapshot.z);
  const enemies = useJunenStore((s) => s.snapshot.enemies);

  return (
    <div className="hidden sm:flex flex-col items-center p-2 rounded-lg bg-stone-900/80 border border-stone-600/40 backdrop-blur-md shadow-lg select-none">
      <svg
        viewBox="0 0 64 110"
        className="w-14 h-24 sm:w-16 sm:h-28"
        aria-label="Junen lane and tank-side junction with player and opponents"
      >
        {/* Lane outline */}
        <path
          d="M27 104V9 M37 9V88H56 M56 93H37V104"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />

        {/* Landmark checkpoints */}
        {LANDMARK_STAGES.map((lz) => (
          <path
            key={lz}
            d={`M24 ${104 - lz * 1.65}h16`}
            stroke="#64748b"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
        ))}

        {/* Enemies */}
        {enemies.map((e, i) => (
          <circle
            key={i}
            cx={32 - e.x * 3.4}
            cy={104 - e.z * 1.65}
            r="2.2"
            fill="#f97316"
            className="transition-all duration-75"
          />
        ))}

        {/* Player (triangle) */}
        <path
          d={`M${32 - x * 3.4} ${101 - z * 1.65}l-3.2 6.4h6.4z`}
          fill="#fef08a"
          className="transition-all duration-75 drop-shadow-[0_0_4px_rgba(254,240,138,0.8)]"
        />
      </svg>
      <span className="text-[8px] tracking-[0.25em] font-semibold text-stone-400 mt-1 uppercase">
        Junen
      </span>
    </div>
  );
};
