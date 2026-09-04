import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  ArrowLeft,
  Trophy,
  Zap,
  AlertTriangle,
  Disc3,
  Volume2,
  VolumeX,
  User,
  Gauge,
  X,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  useKartStore,
  RACER_PROFILES,
  type KartItemType,
  type SpeedClass,
} from '../stores/kartStore';
import { TRACK_DEFINITIONS, type TrackId } from '../engine/trackData';
import { kartAudio } from '../engine/kartAudio';
import { MiniMap } from './MiniMap';

interface HUDProps {
  onBackToLauncher: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis
    .toString()
    .padStart(2, '0')}`;
}

const ITEM_ICONS: Record<KartItemType, { emoji: string; name: string; color: string }> = {
  mushroom: { emoji: '🍄', name: 'Mushroom', color: 'from-amber-500 to-red-500' },
  banana: { emoji: '🍌', name: 'Banana', color: 'from-yellow-400 to-amber-500' },
  'green-shell': { emoji: '🐢', name: 'Green Shell', color: 'from-emerald-400 to-green-600' },
  'red-shell': { emoji: '🎯', name: 'Red Shell', color: 'from-rose-500 to-red-600' },
  star: { emoji: '⭐', name: 'Super Star', color: 'from-yellow-300 via-pink-400 to-cyan-400' },
};

export function HUD({ onBackToLauncher }: HUDProps) {
  const {
    raceState,
    setRaceState,
    speedClass,
    setSpeedClass,
    selectedRacerId,
    setSelectedRacerId,
    selectedTrackId,
    setSelectedTrackId,
    isBgmMuted,
    toggleBgmMuted,
    currentLap,
    totalLaps,
    currentLapTime,
    bestLapTime,
    totalRaceTime,
    playerRank,
    speedKmh,
    driftLevel,
    boostActive,
    isOffroad,
    isSpinningOut,
    hasStar,
    currentItem,
    isRouletteSpinning,
    coins,
    trickActive,
    triggerItemUse,
    playerPos,
    playerAngle,
    aiRacers,
    lapTimes,
    resetRace,
  } = useKartStore();

  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [rouletteIcon, setRouletteIcon] = useState('❓');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const activeRacer =
    RACER_PROFILES.find((r) => r.id === selectedRacerId) || RACER_PROFILES[0];

  // Fix Countdown: clean sequencing with procedural audio beeps
  useEffect(() => {
    if (raceState !== 'countdown') {
      setCountdownText(null);
      return;
    }

    setCountdownText('3');
    kartAudio.playCountdownBeep(false);

    const t1 = setTimeout(() => {
      setCountdownText('2');
      kartAudio.playCountdownBeep(false);
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdownText('1');
      kartAudio.playCountdownBeep(false);
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdownText('GO!');
      kartAudio.playCountdownBeep(true);
      setRaceState('racing');
    }, 3000);

    // Guaranteed removal of GO! banner after 1.2s
    const t4 = setTimeout(() => {
      setCountdownText(null);
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [raceState, setRaceState]);

  // Item Roulette cycle animation
  useEffect(() => {
    if (!isRouletteSpinning) return;

    const items: KartItemType[] = ['mushroom', 'banana', 'green-shell', 'red-shell', 'star'];
    let idx = 0;
    const interval = setInterval(() => {
      setRouletteIcon(ITEM_ICONS[items[idx % items.length]].emoji);
      idx++;
    }, 100);

    return () => clearInterval(interval);
  }, [isRouletteSpinning]);

  // Victory Fanfare & Confetti
  useEffect(() => {
    if (raceState === 'finished') {
      kartAudio.playVictoryFanfare();
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
      const timeout = setTimeout(() => {
        confetti({ particleCount: 90, angle: 60, spread: 60, origin: { x: 0 } });
        confetti({ particleCount: 90, angle: 120, spread: 60, origin: { x: 1 } });
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [raceState]);

  // Final Lap Sound Chime
  useEffect(() => {
    if (currentLap === totalLaps && raceState === 'racing') {
      kartAudio.playFinalLapWarning();
    }
  }, [currentLap, totalLaps, raceState]);

  const rankColors = {
    1: 'text-amber-400 border-amber-400/40 bg-amber-500/20',
    2: 'text-slate-200 border-slate-300/40 bg-slate-400/20',
    3: 'text-amber-600 border-amber-600/40 bg-amber-700/20',
    4: 'text-slate-400 border-slate-500/40 bg-slate-600/20',
  };

  const rankSuffix = ['1st', '2nd', '3rd', '4th'][playerRank - 1] || `${playerRank}th`;

  const driftColors = {
    0: 'bg-slate-700',
    1: 'bg-sky-400 shadow-[0_0_15px_#38bdf8]',
    2: 'bg-orange-500 shadow-[0_0_15px_#f97316]',
    3: 'bg-purple-500 shadow-[0_0_20px_#a855f7]',
  };

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* ===== TOP BAR (RANK, LAP, TIMERS, & ITEM ROULETTE) ===== */}
      <div className="absolute top-4 left-6 flex items-center gap-3">
        {/* Giant Rank Badge */}
        <div
          className={`px-4 py-2.5 rounded-2xl border-2 backdrop-blur-md shadow-xl flex flex-col items-center min-w-[70px] ${
            rankColors[playerRank as 1 | 2 | 3 | 4] || rankColors[4]
          }`}
        >
          <div className="text-[10px] font-black tracking-widest uppercase opacity-70">POS</div>
          <div className="text-3xl font-black italic tracking-tighter leading-none">
            {rankSuffix}
          </div>
        </div>

        {/* Lap Counter */}
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-white/20 shadow-xl flex flex-col">
          <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
            LAP
          </div>
          <div className="text-2xl font-black italic text-white flex items-baseline gap-1">
            <span className="text-3xl text-amber-400">{currentLap}</span>
            <span className="text-sm text-white/50">/ {totalLaps}</span>
          </div>
        </div>

        {/* Timers */}
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-white/20 shadow-xl min-w-[130px]">
          <div className="text-[10px] font-black tracking-widest text-sky-400 uppercase">TIME</div>
          <div className="text-xl font-mono font-bold text-white leading-tight">
            {formatTime(currentLapTime)}
          </div>
          {bestLapTime !== null && (
            <div className="text-[10px] text-emerald-400 font-mono font-semibold">
              Best: {formatTime(bestLapTime)}
            </div>
          )}
        </div>

        {/* Gold Coin Counter */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border-2 border-amber-400/30 shadow-xl flex items-center gap-2">
          <span className="text-2xl animate-pulse">🟡</span>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">COINS</span>
            <span className="text-lg font-mono font-black text-amber-300 leading-none">{coins}/10</span>
          </div>
        </div>

        {/* Item Slot (Mario Kart Roulette Box) */}
        <div
          onClick={() => triggerItemUse()}
          className={`pointer-events-auto cursor-pointer relative w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
            currentItem || isRouletteSpinning
              ? 'bg-gradient-to-br from-amber-500/40 to-red-500/40 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-105 active:scale-95'
              : 'bg-slate-900/80 border-white/20 shadow-lg'
          }`}
          title="Press [E] or Click to Use Item"
        >
          {isRouletteSpinning ? (
            <div className="text-3xl animate-spin">{rouletteIcon}</div>
          ) : currentItem ? (
            <div className="flex flex-col items-center">
              <span className="text-3xl animate-bounce">{ITEM_ICONS[currentItem].emoji}</span>
              <span className="text-[8px] font-black tracking-widest uppercase text-white/80 -mt-1">
                [E] USE
              </span>
            </div>
          ) : (
            <Disc3 className="w-6 h-6 text-white/20 animate-spin" />
          )}
        </div>
      </div>

      {/* Top Right Header Controls */}
      <div className="absolute top-4 right-6 pointer-events-auto flex items-center gap-2.5">
        {/* Racer / Class Customizer Button */}
        <button
          onClick={() => setIsCustomizerOpen(true)}
          className="flex items-center gap-2 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-white/20 shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Customize Racer & Speed Class"
        >
          <span className="text-base">{activeRacer.badge}</span>
          <span className="hidden sm:inline font-black tracking-wide">{activeRacer.name}</span>
          <span className="bg-amber-500/25 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            {speedClass}
          </span>
        </button>

        {/* BGM Toggle Button */}
        <button
          onClick={toggleBgmMuted}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${
            isBgmMuted
              ? 'bg-slate-900/80 border-white/20 text-white/40 hover:text-white'
              : 'bg-emerald-600/80 border-emerald-400/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
          }`}
          title={isBgmMuted ? 'Unmute Arcade BGM' : 'Mute Arcade BGM'}
        >
          {isBgmMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Restart Button */}
        <button
          onClick={() => resetRace()}
          className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-white/20 shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Restart</span>
        </button>

        {/* Exit Button */}
        <button
          onClick={onBackToLauncher}
          className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-500 text-white px-3 py-2 rounded-xl shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Exit</span>
        </button>
      </div>

      {/* ===== COUNTDOWN / ANNOUNCEMENTS ===== */}
      {countdownText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center transform animate-in zoom-in-75 duration-200">
            <span
              className={`text-8xl md:text-9xl font-black italic tracking-wider drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] ${
                countdownText === 'GO!' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {countdownText}
            </span>
          </div>
        </div>
      )}

      {/* Spinout Alert */}
      {isSpinningOut && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black text-2xl px-6 py-2 rounded-full tracking-widest shadow-2xl border-2 border-white">
            💥 SPINOUT! 💥
          </div>
        </div>
      )}

      {/* Star Invincibility Alert */}
      {hasStar && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center animate-pulse">
          <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 text-slate-950 font-black text-2xl px-6 py-2 rounded-full tracking-widest shadow-2xl border-2 border-white">
            ⭐ STAR POWER! ⭐
          </div>
        </div>
      )}

      {/* Jump Trick Boost Alert */}
      {trickActive && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center animate-bounce">
          <div className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black text-2xl px-6 py-2 rounded-full tracking-widest shadow-2xl border-2 border-white">
            ⚡ JUMP TRICK BOOST! ⚡
          </div>
        </div>
      )}

      {/* Offroad Slowdown Alert */}
      {isOffroad && !hasStar && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-600/90 text-white px-4 py-1.5 rounded-full font-bold text-sm tracking-wider shadow-lg border border-amber-300">
          <AlertTriangle className="w-4 h-4" />
          OFF-ROAD GRASS (SLOW)
        </div>
      )}

      {/* ===== BOTTOM LEFT (RADAR & CONTROLS GUIDE) ===== */}
      <div className="absolute bottom-6 left-6 flex items-end gap-4">
        <MiniMap playerPos={playerPos} playerAngle={playerAngle} aiRacers={aiRacers} />

        <div className="hidden md:block bg-slate-900/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-[11px] text-white/90 space-y-1 shadow-xl">
          <div>
            <span className="font-bold text-amber-400">[W / ↑]</span> Drive &nbsp;
            <span className="font-bold text-amber-400">[S / ↓]</span> Brake/Rev
          </div>
          <div>
            <span className="font-bold text-amber-400">[A / D / ← / →]</span> Steer
          </div>
          <div>
            <span className="font-bold text-sky-400">[Space / Shift]</span> Hop & Drift
          </div>
          <div>
            <span className="font-bold text-emerald-400">[E / Enter]</span> Use Item
          </div>
          <div>
            <span className="font-bold text-rose-400">[R]</span> Respawn on Track
          </div>
        </div>
      </div>

      {/* ===== BOTTOM RIGHT (SPEEDOMETER & NITRO GAUGE) ===== */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
        {boostActive && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black italic text-lg px-4 py-1.5 rounded-xl shadow-[0_0_20px_#38bdf8] animate-pulse">
            <Zap className="w-5 h-5 fill-current" />
            NITRO BOOST!
          </div>
        )}

        <div className="bg-slate-900/85 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-white/20 shadow-2xl flex flex-col items-end min-w-[210px]">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black italic tracking-tighter text-white">
              {speedKmh}
            </span>
            <span className="text-sm font-extrabold text-white/60 tracking-wider">KM/H</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-75 ${
                boostActive || hasStar
                  ? 'bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_12px_#38bdf8]'
                  : speedKmh > 90
                  ? 'bg-gradient-to-r from-amber-400 to-red-500'
                  : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min((speedKmh / 150) * 100, 100)}%` }}
            />
          </div>

          <div className="w-full mt-3 flex items-center justify-between gap-1">
            <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">
              Drift Spark
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  driftLevel >= 1 ? driftColors[1] : 'bg-slate-800'
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  driftLevel >= 2 ? driftColors[2] : 'bg-slate-800'
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  driftLevel >= 3 ? driftColors[3] : 'bg-slate-800'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== FINISH PODIUM MODAL ===== */}
      {raceState === 'finished' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/40 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(245,158,11,0.25)] text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-400/40">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <h2 className="text-3xl font-black italic text-white tracking-wide">
              {playerRank === 1 ? '🏆 1ST PLACE CHAMPION!' : playerRank === 2 ? '🥈 2ND PLACE PODIUM!' : playerRank === 3 ? '🥉 3RD PLACE PODIUM!' : '🎖️ RACE COMPLETED!'}
            </h2>
            <div className="text-amber-400 font-bold text-lg mt-1">
              Final Standing: <span className="text-2xl font-black">{rankSuffix}</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 my-5 space-y-2 text-left border border-white/10 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/60 font-sans">Total Race Time:</span>
                <span className="text-xl font-bold text-amber-400">
                  {formatTime(totalRaceTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 font-sans">Best Lap:</span>
                <span className="text-emerald-400 font-bold">
                  {bestLapTime ? formatTime(bestLapTime) : '--:--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 font-sans">Coins Collected:</span>
                <span className="text-amber-300 font-bold">🟡 {coins} / 10 (+{(coins * 1.5).toFixed(1)} km/h)</span>
              </div>
              <div className="border-t border-white/10 pt-2 space-y-1 text-xs text-white/80">
                {lapTimes.map((time, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>Lap {idx + 1}</span>
                    <span>{formatTime(time)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetRace}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-5 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                PLAY AGAIN
              </button>
              <button
                onClick={onBackToLauncher}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3.5 rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                LAUNCHER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RACER & SPEED CLASS CUSTOMIZER MODAL ===== */}
      {isCustomizerOpen && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏎️</span>
                <div>
                  <h3 className="text-xl font-black italic text-white tracking-wide">
                    CHOOSE YOUR RACER & CLASS
                  </h3>
                  <p className="text-xs text-white/60">Select driver personality and engine speed</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Speed Class Selector (50cc, 100cc, 150cc) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4" /> Engine Speed Class
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['50cc', '100cc', '150cc'] as SpeedClass[]).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setSpeedClass(sc)}
                    className={`py-3 px-2 rounded-2xl border-2 font-black text-center transition-all cursor-pointer ${
                      speedClass === sc
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="text-lg italic font-mono">{sc}</div>
                    <div className="text-[10px] font-normal opacity-70">
                      {sc === '50cc' ? 'Beginner' : sc === '100cc' ? 'Standard' : 'Hyper Pro'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Racer Grid */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" /> Select Racer & Kart Skin
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {RACER_PROFILES.map((racer) => {
                  const isSelected = selectedRacerId === racer.id;
                  return (
                    <button
                      key={racer.id}
                      onClick={() => setSelectedRacerId(racer.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{racer.badge}</span>
                        <div
                          className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: racer.kartColor }}
                        />
                      </div>
                      <div className="mt-2">
                        <div className="font-black text-sm text-white">{racer.name}</div>
                        <div className="text-[10px] text-amber-300 font-semibold">{racer.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Circuit Track Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Grand Prix Circuit Track
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.values(TRACK_DEFINITIONS) as { id: TrackId; name: string; badge: string; description: string }[]).map(
                  (track) => {
                    const isSelected = selectedTrackId === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => setSelectedTrackId(track.id)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-white/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl">{track.badge}</span>
                        <div>
                          <div className="font-black text-sm text-white">{track.name}</div>
                          <div className="text-[10px] text-white/60">{track.description}</div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Bottom Confirm Button */}
            <button
              onClick={() => {
                setIsCustomizerOpen(false);
                resetRace();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-center shadow-xl transition-all hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              CONFIRM & START RACE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
