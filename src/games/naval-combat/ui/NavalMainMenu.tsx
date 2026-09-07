import React from 'react';
import { Anchor, Compass, Play, ShieldAlert, Ship, Volume2, VolumeX } from 'lucide-react';
import { useNavalGameStore, SHIP_PRESETS } from '../stores/useNavalGameStore';
import { navalAudio } from '../services/navalAudio';

interface NavalMainMenuProps {
  onExitToLauncher: () => void;
}

export const NavalMainMenu: React.FC<NavalMainMenuProps> = ({ onExitToLauncher }) => {
  const initBattle = useNavalGameStore((state) => state.initBattle);
  const setStage = useNavalGameStore((state) => state.setStage);
  const selectedShipClass = useNavalGameStore((state) => state.selectedShipClass);
  const [isMuted, setIsMuted] = React.useState(false);

  const selectedShip = SHIP_PRESETS[selectedShipClass];

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    navalAudio.setMuted(next);
  };

  const handleStart = () => {
    navalAudio.playShipBell();
    initBattle();
  };

  const handleHangar = () => {
    navalAudio.playSailShift();
    setStage('SHIP_SELECT');
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 pointer-events-none select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center shadow-lg shadow-amber-950/60 border border-amber-500/40">
            <Anchor className="w-7 h-7 text-amber-100" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest font-black text-amber-400 drop-shadow">
              Caribbean Corsair Simulator
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider font-serif drop-shadow-md">
              BLACK FLAG LITE
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition cursor-pointer shadow-lg"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onExitToLauncher}
            className="px-4 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-700 backdrop-blur-md transition cursor-pointer shadow-lg"
          >
            Exit to Launcher
          </button>
        </div>
      </div>

      {/* Center Left Action Menu */}
      <div className="flex flex-col gap-4 max-w-md pointer-events-auto backdrop-blur-sm bg-slate-950/40 p-6 rounded-2xl border border-amber-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" /> High Seas Combat Ready
          </div>
          <h2 className="text-3xl font-black text-amber-100 font-serif drop-shadow">
            Set Sail, Captain
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Rule the open waves with authentic Gerstner wave buoyancy, synchronized broadside cannon salvos, and intelligent pirate flotillas.
          </p>
        </div>

        {/* Selected Ship Badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-amber-950/80 flex items-center justify-center border border-amber-600/40">
            <Ship className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Current Flagship</div>
            <div className="text-sm font-bold text-amber-200">{selectedShip.name}</div>
          </div>
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            {selectedShip.id}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={handleStart}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black tracking-wider text-base uppercase shadow-lg shadow-amber-500/30 transition transform active:scale-98 cursor-pointer border border-amber-300/40"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Engage Fleet (Set Sail)
          </button>

          <button
            onClick={handleHangar}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-200 font-bold text-sm tracking-wide border border-amber-500/30 transition cursor-pointer shadow-md"
          >
            <Ship className="w-4 h-4" />
            Shipyard & Fleet Hangar
          </button>
        </div>
      </div>

      {/* Bottom Controls Info Banner */}
      <div className="flex items-center justify-between text-xs text-slate-300 pointer-events-auto backdrop-blur-md bg-slate-950/60 px-5 py-3 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-mono text-amber-300">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">W</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">S</kbd> Sail States
          </span>
          <span className="flex items-center gap-1 font-mono text-amber-300">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">A</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">D</kbd> Rudder Steer
          </span>
          <span className="flex items-center gap-1 font-mono text-amber-300">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Q</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">E</kbd> Aim Port/Stbd
          </span>
          <span className="flex items-center gap-1 font-mono text-amber-300">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">SPACE</kbd> / Click Broadside Salvo
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <ShieldAlert className="w-4 h-4" /> 3 Pirate Warships Ambush
        </div>
      </div>
    </div>
  );
};
