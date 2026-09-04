import React, { useState } from 'react';
import { Disc3, X, Volume2 } from 'lucide-react';
import { useNightclubStore } from '../store/useNightclubStore';
import { MUSIC_TRACKS } from '../data/music';

export const DJBoothModal: React.FC = () => {
  const { closeModal, currentTrack, selectTrack, scratchDJRecord, hype, isBeatActive, toggleMusicBeat } =
    useNightclubStore();

  const [scratchRotation, setScratchRotation] = useState(0);

  const handleScratch = () => {
    scratchDJRecord();
    setScratchRotation((prev) => prev + 45);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Disc3 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                DJ Stage Console
              </h2>
              <p className="text-xs text-slate-400">
                Select club music genres, drop basslines, and scratch vinyl records to pump crowd hype
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Scratch Platter & Hype Bar */}
        <div className="p-6 flex flex-col items-center bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center justify-between w-full max-w-md mb-4 text-xs font-mono">
            <span className="text-slate-400">Current Hype:</span>
            <strong className="text-amber-400 text-sm font-bold">{hype}% / 100%</strong>
          </div>

          {/* Interactive Turntable Platter */}
          <div
            onClick={handleScratch}
            style={{ transform: `rotate(${scratchRotation}deg)` }}
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-slate-950 via-zinc-900 to-black border-4 border-zinc-700 shadow-2xl cursor-pointer transition-transform duration-100 flex items-center justify-center hover:scale-105 active:scale-95 group"
          >
            {/* Vinyl Grooves */}
            <div className="w-32 h-32 rounded-full border border-zinc-800 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-zinc-800/80 flex items-center justify-center">
                {/* Center Label */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                </div>
              </div>
            </div>

            {/* Stylus arm indicator */}
            <div className="absolute top-2 right-4 text-[10px] font-black text-cyan-400 uppercase tracking-widest pointer-events-none group-hover:text-amber-300">
              SCRATCH!
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-3 italic">
            Click or tap the turntable platter to scratch vinyl and boost crowd hype!
          </span>
        </div>

        {/* Music Track Playlist */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Club Soundtracks
            </span>
            <button
              onClick={toggleMusicBeat}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                isBeatActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isBeatActive ? 'Beat: ON' : 'Beat: OFF'}</span>
            </button>
          </div>

          {MUSIC_TRACKS.map((track) => {
            const isPlaying = currentTrack.id === track.id;

            return (
              <div
                key={track.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  isPlaying
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                      {track.genre}
                    </span>
                    <h4 className="text-xs font-bold text-white">{track.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {track.bpm} BPM • Hype Multiplier x{track.hypeMultiplier}
                  </span>
                </div>

                <button
                  onClick={() => selectTrack(track)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    isPlaying
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isPlaying ? 'Playing' : 'Play Track'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
