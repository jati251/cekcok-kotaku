import React from 'react';
import { ArrowLeft, Check, Gauge, Shield, Swords, Zap } from 'lucide-react';
import { useNavalGameStore, SHIP_PRESETS } from '../stores/useNavalGameStore';
import type { ShipClass } from '../types';
import { navalAudio } from '../services/navalAudio';

export const ShipSelectModal: React.FC = () => {
  const selectedShipClass = useNavalGameStore((state) => state.selectedShipClass);
  const selectShipClass = useNavalGameStore((state) => state.selectShipClass);
  const setStage = useNavalGameStore((state) => state.setStage);
  const initBattle = useNavalGameStore((state) => state.initBattle);

  const ships: ShipClass[] = ['sloop', 'brig', 'frigate'];
  const current = SHIP_PRESETS[selectedShipClass];

  const handleSelect = (shipClass: ShipClass) => {
    navalAudio.playSailShift();
    selectShipClass(shipClass);
  };

  const handleConfirmAndSail = () => {
    navalAudio.playShipBell();
    initBattle();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 pointer-events-none select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={() => {
            navalAudio.playSailShift();
            setStage('MAIN_MENU');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-200 border border-slate-700 backdrop-blur-md transition cursor-pointer shadow-lg font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Port
        </button>

        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Harbor Drydock
          </div>
          <h2 className="text-xl font-black text-white font-serif tracking-wide">
            FLEET HANGAR & OUTFITTING
          </h2>
        </div>

        <div className="w-24" />
      </div>

      {/* Center 3D Instruction Hint */}
      <div className="text-center pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-amber-500/20 text-xs text-amber-200/80 backdrop-blur-md shadow-md">
          Drag cursor to rotate 3D turntable inspect
        </span>
      </div>

      {/* Bottom Selection Cards & Stat Specs */}
      <div className="pointer-events-auto flex flex-col md:flex-row items-end gap-6 max-w-5xl mx-auto w-full">
        {/* Ship Class Picker Tabs */}
        <div className="flex flex-col gap-2.5 w-full md:w-80 backdrop-blur-md bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Choose Hull Class
          </div>
          {ships.map((sClass) => {
            const ship = SHIP_PRESETS[sClass];
            const isSelected = selectedShipClass === sClass;
            return (
              <button
                key={sClass}
                onClick={() => handleSelect(sClass)}
                className={`flex items-center justify-between p-3 rounded-xl text-left transition border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400/80 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div>
                  <div className={`font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                    {ship.name}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">{ship.subtitle}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            );
          })}
        </div>

        {/* Detailed Specs Panel */}
        <div className="flex-1 backdrop-blur-md bg-slate-950/80 p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
                {current.subtitle}
              </div>
              <h3 className="text-2xl font-black text-amber-100 font-serif">
                {current.name}
              </h3>
            </div>
            <button
              onClick={handleConfirmAndSail}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black tracking-wide uppercase text-sm shadow-lg shadow-amber-500/30 transition transform active:scale-98 cursor-pointer border border-amber-300/40"
            >
              Select & Set Sail
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {current.description}
          </p>

          {/* Stat Meters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Hull Durability
              </div>
              <div className="text-lg font-bold text-emerald-300 font-mono">
                {current.maxHealth} HP
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(current.maxHealth / 1250) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Gauge className="w-3.5 h-3.5 text-sky-400" /> Top Speed
              </div>
              <div className="text-lg font-bold text-sky-300 font-mono">
                {current.topSpeed} Knots
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${(current.topSpeed / 14) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Swords className="w-3.5 h-3.5 text-rose-400" /> Broadside Guns
              </div>
              <div className="text-lg font-bold text-rose-300 font-mono">
                {current.cannonsPerSide} / side
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${(current.cannonsPerSide / 14) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Reload Rate
              </div>
              <div className="text-lg font-bold text-amber-300 font-mono">
                {current.reloadTime}s
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${((5 - current.reloadTime) / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
