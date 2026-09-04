import React, { useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { poolAudio } from './audio';

interface SpinControlProps {
  spin: { x: number; y: number };
  onChange: (spin: { x: number; y: number }) => void;
}

export const SpinControl: React.FC<SpinControlProps> = ({ spin, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = rect.width / 2 - 4;

      const clientX = e.clientX;
      const clientY = e.clientY;

      let dx = clientX - (rect.left + centerX);
      let dy = clientY - (rect.top + centerY);

      // Distance from center
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > radius) {
        dx = (dx / d) * radius;
        dy = (dy / d) * radius;
      }

      // Normalized -1 to 1 (-1 bottom/left, +1 top/right)
      const normX = Math.round((dx / radius) * 100) / 100;
      const normY = Math.round((-dy / radius) * 100) / 100; // Invert Y so up is positive topspin

      poolAudio.playChalk();
      onChange({ x: normX, y: normY });
    },
    [onChange]
  );

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    poolAudio.playChalk();
    onChange({ x: 0, y: 0 });
  };

  // Visual position of red strike point
  const radius = 32; // Half of 64px width - padding
  const posX = 36 + spin.x * radius;
  const posY = 36 - spin.y * radius;

  return (
    <div className="flex flex-col items-center bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-2.5 rounded-2xl shadow-xl select-none">
      <div className="flex items-center justify-between w-full mb-1.5 px-1">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Cue Spin
        </span>
        <button
          onClick={handleReset}
          title="Reset spin to center"
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Interactive Cue Ball Sphere */}
      <div
        ref={containerRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointer(e);
        }}
        className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-300 shadow-inner border-2 border-slate-700/60 cursor-crosshair flex items-center justify-center overflow-hidden"
      >
        {/* Subtle grid crosshairs */}
        <div className="absolute w-full h-[1px] bg-slate-400/30" />
        <div className="absolute h-full w-[1px] bg-slate-400/30" />

        {/* Specular 3D ball highlight */}
        <div className="absolute top-1 left-2 w-4 h-3 rounded-full bg-white/70 blur-[1px] pointer-events-none" />

        {/* Red Chalk Strike Dot */}
        <div
          style={{
            transform: `translate(${posX - 36}px, ${posY - 36}px)`,
          }}
          className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-md transition-transform duration-75 pointer-events-none"
        />
      </div>

      {/* Status Label */}
      <span className="text-[9px] font-mono text-slate-400 mt-1.5 font-medium">
        {spin.y > 0.2
          ? 'Topspin'
          : spin.y < -0.2
          ? 'Draw/Back'
          : spin.x > 0.2
          ? 'Right Spin'
          : spin.x < -0.2
          ? 'Left Spin'
          : 'Center'}
      </span>
    </div>
  );
};
