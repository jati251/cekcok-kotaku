import { useMemo } from 'react';
import { CIRCUIT_WAYPOINTS } from '../engine/trackData';
import { type AIRacerData } from '../stores/kartStore';

interface MiniMapProps {
  playerPos: [number, number, number];
  playerAngle: number;
  aiRacers?: AIRacerData[];
}

export function MiniMap({ playerPos, playerAngle, aiRacers = [] }: MiniMapProps) {
  const { minX, maxX, minZ, maxZ, svgPoints } = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    CIRCUIT_WAYPOINTS.forEach(([x, _, z]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    minX -= 25;
    maxX += 25;
    minZ -= 25;
    maxZ += 25;

    const mapW = 140;
    const mapH = 140;

    const points = CIRCUIT_WAYPOINTS.map(([x, _, z]) => {
      const sx = ((x - minX) / (maxX - minX)) * mapW;
      const sy = ((z - minZ) / (maxZ - minZ)) * mapH;
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    }).join(' ');

    return { minX, maxX, minZ, maxZ, svgPoints: points };
  }, []);

  const mapW = 140;
  const mapH = 140;
  const px = ((playerPos[0] - minX) / (maxX - minX)) * mapW;
  const py = ((playerPos[2] - minZ) / (maxZ - minZ)) * mapH;

  return (
    <div className="relative w-40 h-40 bg-slate-900/85 backdrop-blur-md rounded-2xl border-2 border-white/20 p-2 shadow-2xl">
      <svg viewBox="0 0 140 140" className="w-full h-full">
        {/* Track Glow */}
        <polygon
          points={svgPoints}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeOpacity="0.25"
        />
        {/* Track Roadway */}
        <polygon
          points={svgPoints}
          fill="none"
          stroke="#334155"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        {/* Finish Line */}
        <circle cx="28" cy="74" r="3.5" fill="#facc15" />

        {/* AI Opponents */}
        {aiRacers.map((ai) => {
          const ax = ((ai.position[0] - minX) / (maxX - minX)) * mapW;
          const ay = ((ai.position[2] - minZ) / (maxZ - minZ)) * mapH;
          return (
            <circle
              key={ai.id}
              cx={ax}
              cy={ay}
              r="3.5"
              fill={ai.color}
              stroke="#0f172a"
              strokeWidth="1"
            />
          );
        })}

        {/* Player Blip (Red) */}
        <g transform={`translate(${px}, ${py}) rotate(${(-playerAngle * 180) / Math.PI})`}>
          <circle cx="0" cy="0" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
      <div className="absolute bottom-1 right-2 text-[9px] font-black text-white/50 tracking-wider">
        CIRCUIT
      </div>
    </div>
  );
}
