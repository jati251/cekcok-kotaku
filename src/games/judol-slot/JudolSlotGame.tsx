import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Flame,
  Wallet,
  Play,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { JudolSlotEngine } from './engine';
import { slotAudio } from './audio';
import { SlotSymbolType } from './types';

const SYMBOL_EMOJIS: Record<SlotSymbolType, { icon: string; label: string; color: string }> = {
  crown: { icon: '👑', label: 'Mahkota', color: 'from-amber-400 to-yellow-500' },
  hourglass: { icon: '⏳', label: 'Jam Pasir', color: 'from-cyan-400 to-blue-500' },
  ring: { icon: '💍', label: 'Cincin', color: 'from-pink-400 to-rose-500' },
  chalice: { icon: '🏆', label: 'Cawan Emas', color: 'from-yellow-300 to-amber-500' },
  gem_red: { icon: '💎', label: 'Ruby', color: 'from-red-500 to-rose-600' },
  gem_purple: { icon: '🔮', label: 'Amethyst', color: 'from-purple-500 to-indigo-600' },
  gem_yellow: { icon: '🟡', label: 'Topaz', color: 'from-yellow-400 to-amber-500' },
  gem_green: { icon: '🟢', label: 'Emerald', color: 'from-emerald-400 to-green-600' },
  gem_blue: { icon: '🔷', label: 'Sapphire', color: 'from-sky-400 to-blue-600' },
  scatter: { icon: '⚡', label: 'SCATTER', color: 'from-amber-300 via-yellow-400 to-red-500' },
};

const BET_OPTIONS = [200, 400, 800, 1200, 2000, 5000, 10000, 25000, 50000];

interface JudolSlotGameProps {
  onBack?: () => void;
}

export const JudolSlotGame: React.FC<JudolSlotGameProps> = ({ onBack }) => {
  const engineRef = useRef<JudolSlotEngine>(new JudolSlotEngine());
  const { setActiveTab } = useLauncherStore();

  const [grid, setGrid] = useState(engineRef.current.grid);
  const [balance, setBalance] = useState(engineRef.current.virtualBalance);
  const [bet, setBet] = useState(engineRef.current.currentBet);
  const [lastWin, setLastWin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTumbling, setIsTumbling] = useState(false);
  const [isFreeSpins, setIsFreeSpins] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [globalMultiplier, setGlobalMultiplier] = useState(0);
  const [multipliers, setMultipliers] = useState(engineRef.current.multipliers);
  const [zeusPose, setZeusPose] = useState<'idle' | 'charge' | 'strike'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [polaModal, setPolaModal] = useState<string | null>(null);

  // Sync loop
  useEffect(() => {
    const engine = engineRef.current;

    const interval = setInterval(() => {
      setGrid([...engine.grid.map((c) => [...c])]);
      setBalance(engine.virtualBalance);
      setLastWin(engine.lastWin);
      setIsSpinning(engine.isSpinning);
      setIsTumbling(engine.isTumbling);
      setIsFreeSpins(engine.isFreeSpinsMode);
      setFreeSpinsLeft(engine.freeSpinsRemaining);
      setGlobalMultiplier(engine.globalFreeSpinsMultiplier);
      setMultipliers([...engine.multipliers]);
      setZeusPose(engine.zeusPose);
    }, 60);

    return () => {
      clearInterval(interval);
      slotAudio.cleanup();
    };
  }, []);

  const handleSpin = () => {
    const engine = engineRef.current;
    if (engine.virtualBalance < bet && !engine.isFreeSpinsMode) {
      engine.reloadVirtualCoins();
      return;
    }
    engine.currentBet = bet;
    engine.spin();
  };

  const handleBuySpin = () => {
    soundManager.playClick();
    const engine = engineRef.current;
    engine.currentBet = bet;
    engine.buyFreeSpins();
  };

  const handleReload = () => {
    soundManager.playClick();
    engineRef.current.reloadVirtualCoins();
  };

  const handleGeneratePola = () => {
    soundManager.playClick();
    const turbos = [10, 20, 30, 50];
    const manuals = [5, 7, 9, 11];
    const hours = ['01:45 WIB', '03:30 WIB', '14:20 WIB', '21:15 WIB'];
    const fakeRtp = (96.5 + Math.random() * 3).toFixed(1);

    const turbo = turbos[Math.floor(Math.random() * turbos.length)];
    const manual = manuals[Math.floor(Math.random() * manuals.length)];
    const hour = hours[Math.floor(Math.random() * hours.length)];

    setPolaModal(
      `🔥 POLA GACOR ZEUS (PARODI) 🔥\n• Jam Gacor: ${hour}\n• Turbo Spin: ${turbo}x (Centang Cepat)\n• Manual Spin: ${manual}x\n• RTP Live Palsu: ${fakeRtp}%\n\nIngat: Pola gacor adalah MITOS rekayasa marketing bandar! Jangan pernah percaya judol sungguhan.`
    );
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    slotAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    slotAudio.cleanup();
    if (onBack) {
      onBack();
    } else {
      setActiveTab('launcher');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Warning Banner (Anti-Judol Awareness) */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b border-red-500/40 px-6 py-2 flex items-center justify-between text-xs shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            100% SIMULATOR UANG MAINAN • Kemenangan slot adalah ilusi algoritma bandar! Jauhi judi online di dunia nyata demi masa depanmu!
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-black text-[11px] bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>0% REAL MONEY</span>
        </div>
      </div>

      {/* Top Header HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={handleGeneratePola}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-black uppercase transition cursor-pointer shadow-sm active:scale-95"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cek Pola Gacor (Meme)</span>
          </button>
        </div>

        {/* Title & Free Spins Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-red-400 bg-clip-text text-transparent">
              Judol Simulator: Kakek Zeus 88
            </h1>
          </div>

          {isFreeSpins && (
            <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg shadow-purple-600/40 animate-bounce flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FREE SPINS: {freeSpinsLeft} SISA</span>
              {globalMultiplier > 0 && <span>({globalMultiplier}X TOTAL)</span>}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Olympus Temple Arena */}
      <main className="flex-1 relative flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,#1e1b4b_0%,#0f172a_60%,#020617_100%)] overflow-hidden">
        {/* Zeus Character Mascot (Right Flank) */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center pointer-events-none select-none z-10">
          <div
            className={`relative flex flex-col items-center transition-transform duration-300 ${
              zeusPose === 'strike' ? 'scale-125 translate-y-[-10px]' : 'animate-bounce'
            }`}
          >
            {/* Lightning Staff Aura */}
            {zeusPose === 'strike' && (
              <div className="absolute -inset-8 bg-amber-400/30 rounded-full blur-2xl animate-pulse" />
            )}

            {/* Zeus Face / Figure Artwork */}
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border-4 border-yellow-300 flex items-center justify-center text-6xl shadow-2xl shadow-yellow-500/40">
              ⚡
              <div className="absolute -top-3 text-2xl">👑</div>
            </div>

            <div className="mt-3 px-3 py-1 bg-slate-950/80 border border-amber-500/50 rounded-xl text-center shadow-md">
              <span className="text-xs font-black text-amber-300 tracking-wider block">
                KAKEK ZEUS
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {zeusPose === 'strike' ? '⚡ PETIR MERAH x500! ⚡' : 'NUNGGUIN SCATTER'}
              </span>
            </div>
          </div>
        </div>

        {/* 6x5 Slot Matrix Stage */}
        <div className="relative max-w-2xl w-full bg-slate-950/80 border-4 border-amber-500/40 rounded-3xl p-4 shadow-2xl shadow-amber-950/40 backdrop-blur-xl">
          {/* Header Marquee in Slot */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl mb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-400">SALDO MAINAN:</span>
              <span className="font-mono font-black text-amber-400 text-sm">
                Rp {balance.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">MENANG:</span>
              <span className="font-mono font-black text-emerald-400 text-base">
                Rp {lastWin.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 6 Columns x 5 Rows Grid */}
          <div className="grid grid-cols-6 gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
            {grid.map((col, cIdx) => (
              <div key={cIdx} className="flex flex-col gap-2">
                {col.map((cell, rIdx) => {
                  const meta = SYMBOL_EMOJIS[cell.symbol];
                  const orb = multipliers.find((m) => m.col === cIdx && m.row === rIdx);

                  return (
                    <div
                      key={cell.id}
                      className={`relative aspect-square rounded-xl flex items-center justify-center border transition-all ${
                        cell.isWinning
                          ? 'bg-amber-500/30 border-yellow-400 scale-90 animate-pulse shadow-lg shadow-yellow-500/50'
                          : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Symbol Icon */}
                      <span className="text-3xl md:text-4xl drop-shadow-md select-none">
                        {meta.icon}
                      </span>

                      {/* Multiplier Badge if hit by lightning */}
                      {orb && (
                        <div
                          className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-lg border border-white/60 animate-bounce"
                          style={{ backgroundColor: orb.color }}
                        >
                          {orb.value}X
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Controls Panel */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {/* Bet Selector */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">TARUHAN:</span>
              <select
                value={bet}
                disabled={isSpinning || isTumbling || isFreeSpins}
                onChange={(e) => setBet(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-400 cursor-pointer"
              >
                {BET_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    Rp {opt.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Reload Balance Free */}
            <button
              onClick={handleReload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
              title="Tambah Saldo Mainan Gratis"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Rp 500k Mainan</span>
            </button>

            {/* Buy Free Spins Button */}
            <button
              onClick={handleBuySpin}
              disabled={isSpinning || isTumbling || isFreeSpins || balance < bet * 100}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Beli Spin (Rp {(bet * 100).toLocaleString()})</span>
            </button>

            {/* Main Spin Button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || isTumbling || isFreeSpins}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>PUTAR (SPIN)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Pola Gacor Meme Modal */}
      {polaModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPolaModal(null)}
        >
          <div
            className="bg-slate-900 border-2 border-amber-500/40 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-amber-400 uppercase mb-3 flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Bocoran Pola Gacor
            </h3>
            <pre className="text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-xl whitespace-pre-wrap text-left mb-4 border border-slate-800">
              {polaModal}
            </pre>
            <button
              onClick={() => setPolaModal(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase cursor-pointer"
            >
              Paham, Ini Cuma Satire!
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-amber-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Cara Bermain Judol Slot Sim
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• Game ini adalah <strong>parodi simulator 100% uang mainan</strong>.</li>
              <li>• Sistem <strong>Pay-Anywhere</strong>: 8+ simbol sejenis di mana saja pada layar akan pecah dan memicu *tumble*.</li>
              <li>• Simbol baru jatuh dari atas mengisi kekosongan.</li>
              <li>• 4+ Simbol <strong>SCATTER (⚡)</strong> memicu 15 Free Spins!</li>
              <li>• Kakek Zeus dapat menurunkan petir pengganda (hingga x500) yang melipatgandakan seluruh kemenangan runtuhan.</li>
              <li>• Jika saldo mainan habis, klik tombol <strong>+ Rp 500k Mainan</strong> untuk isi ulang instan gratis.</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs uppercase text-slate-200 cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
