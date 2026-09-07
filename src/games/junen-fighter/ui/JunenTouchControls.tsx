interface JunenTouchControlsProps {
  onMove: (x: number, z: number) => void;
  onAction: (action: 'punch' | 'kick' | 'counter' | 'dodge') => void;
}

export const JunenTouchControls = ({ onMove, onAction }: JunenTouchControlsProps) => {
  const dpad = [
    { label: '↑', x: 0, z: 1, pos: 'col-start-2 row-start-1' },
    { label: '←', x: -1, z: 0, pos: 'col-start-1 row-start-2' },
    { label: '↓', x: 0, z: -1, pos: 'col-start-2 row-start-3' },
    { label: '→', x: 1, z: 0, pos: 'col-start-3 row-start-2' },
  ];

  const actions: { id: 'punch' | 'kick' | 'counter' | 'dodge'; label: string; color: string }[] = [
    { id: 'punch', label: 'Strike', color: 'bg-stone-800 border-stone-600 text-stone-100' },
    { id: 'kick', label: 'Kick', color: 'bg-stone-800 border-stone-600 text-amber-200' },
    { id: 'counter', label: 'Counter', color: 'bg-amber-900/60 border-amber-600/70 text-amber-100' },
    { id: 'dodge', label: 'Dodge', color: 'bg-stone-800 border-stone-600 text-stone-300' },
  ];

  return (
    <div className="flex md:hidden absolute left-4 right-4 bottom-24 justify-between items-end pointer-events-none z-30 select-none">
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-32 h-32 pointer-events-auto">
        {dpad.map(({ label, x, z, pos }) => (
          <button
            key={label}
            aria-label={`Move ${label}`}
            className={`${pos} flex items-center justify-center rounded-xl bg-stone-900/80 border border-stone-600/60 active:bg-amber-500/40 text-stone-200 font-bold text-lg backdrop-blur-md shadow-lg touch-none outline-none`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onMove(x, z);
            }}
            onPointerUp={() => onMove(0, 0)}
            onPointerCancel={() => onMove(0, 0)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pointer-events-auto">
        {actions.map(({ id, label, color }) => (
          <button
            key={id}
            className={`min-w-[70px] px-3 py-2.5 rounded-xl border ${color} active:scale-95 font-semibold text-xs backdrop-blur-md shadow-lg touch-none transition uppercase tracking-wider outline-none`}
            onPointerDown={() => onAction(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
