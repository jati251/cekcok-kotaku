import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { FaceKey, CubeTheme } from './types';
import type { RubikCubeHandle } from './RubikCube';
import { rubikAudio } from './audio';
import {
  RotateCcw,
  Shuffle,
  Trophy,
  Volume2,
  VolumeX,
  Timer,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlsProps {
  cubeRef: React.RefObject<RubikCubeHandle | null>;
  theme: CubeTheme;
  onThemeChange: (theme: CubeTheme) => void;
}

type MoveType = 'normal' | 'prime';

const FACE_BUTTONS: { face: FaceKey; label: string; color: string; key: string }[] = [
  { face: 'R', label: 'R', color: '#dc2626', key: 'r' },
  { face: 'L', label: 'L', color: '#ea580c', key: 'l' },
  { face: 'U', label: 'U', color: '#f8fafc', key: 'u' },
  { face: 'D', label: 'D', color: '#facc15', key: 'd' },
  { face: 'F', label: 'F', color: '#16a34a', key: 'f' },
  { face: 'B', label: 'B', color: '#2563eb', key: 'b' },
];

function formatTimeWithMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

export function Controls({ cubeRef, theme, onThemeChange }: ControlsProps) {
  const [moveType, setMoveType] = useState<MoveType>('normal');
  const [isScrambling, setIsScrambling] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [timerMs, setTimerMs] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [scrambleString, setScrambleString] = useState('');
  const [copiedScramble, setCopiedScramble] = useState(false);
  const [isMuted, setIsMuted] = useState(rubikAudio.getMuted());
  const [bestTimeMs, setBestTimeMs] = useState(() => {
    try {
      return parseInt(localStorage.getItem('rubikBestTimeMs') || '0', 10);
    } catch {
      return 0;
    }
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartedRef = useRef(false);
  const startTimeRef = useRef(0);

  // Live TPS (Turns per second)
  const currentTps = timerMs > 0 ? ((moveCount / (timerMs / 1000))).toFixed(1) : '0.0';

  useEffect(() => {
    if (!cubeRef.current) return;
    const unsub = cubeRef.current.onMove((count) => {
      setMoveCount(count);
      if (count > 0 && !timerStartedRef.current && !isScrambling) {
        timerStartedRef.current = true;
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setTimerMs(Date.now() - startTimeRef.current);
        }, 16);
      }

      // Check if solved after move
      if (count > 5 && cubeRef.current && !isScrambling) {
        setTimeout(() => {
          if (cubeRef.current?.checkIsSolved()) {
            handleSolved();
          }
        }, 180);
      }
    });
    return unsub;
  }, [cubeRef, isScrambling]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSolved = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerStartedRef.current = false;
    setIsSolved(true);
    rubikAudio.playSolvedFanfare();

    if (timerMs > 0 && (bestTimeMs === 0 || timerMs < bestTimeMs)) {
      setBestTimeMs(timerMs);
      try {
        localStorage.setItem('rubikBestTimeMs', timerMs.toString());
      } catch {}
    }
  };

  const handleRotate = useCallback((face: FaceKey) => {
    if (!cubeRef.current || isScrambling) return;
    cubeRef.current.rotateFace(face, moveType === 'prime');
  }, [cubeRef, isScrambling, moveType]);

  const handleScramble = useCallback(() => {
    if (!cubeRef.current) return;
    setIsScrambling(true);
    setIsSolved(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerStartedRef.current = false;
    setTimerMs(0);
    setMoveCount(0);

    const movesStr = cubeRef.current.scramble();
    setScrambleString(movesStr);

    const waitForFinish = () => {
      if (cubeRef.current && cubeRef.current.isAnimating) {
        requestAnimationFrame(waitForFinish);
      } else {
        setIsScrambling(false);
      }
    };
    requestAnimationFrame(waitForFinish);
  }, [cubeRef]);

  const handleReset = useCallback(() => {
    if (cubeRef.current) {
      cubeRef.current.reset();
      setIsScrambling(false);
      setIsSolved(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerStartedRef.current = false;
      setTimerMs(0);
      setMoveCount(0);
    }
  }, [cubeRef]);

  const copyScrambleToClipboard = () => {
    if (!scrambleString) return;
    navigator.clipboard.writeText(scrambleString).catch(() => {});
    setCopiedScramble(true);
    setTimeout(() => setCopiedScramble(false), 1500);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isScrambling || e.repeat) return;
      const key = e.key.toLowerCase();
      const faceMap: Record<string, FaceKey> = {
        r: 'R',
        l: 'L',
        u: 'U',
        d: 'D',
        f: 'F',
        b: 'B',
      };
      if (faceMap[key]) {
        e.preventDefault();
        cubeRef.current?.rotateFace(faceMap[key], e.shiftKey || moveType === 'prime');
      } else if (e.code === 'Space' && !timerStartedRef.current) {
        e.preventDefault();
        handleScramble();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cubeRef, isScrambling, moveType, handleScramble]);

  return (
    <>
      {/* Top Precision Speedcube HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-indigo-500/30 shadow-2xl select-none">
        {/* Stopwatch Timer */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
          <Timer className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xl font-black tracking-wider text-emerald-300">
            {formatTimeWithMs(timerMs)}
          </span>
        </div>

        {/* Moves Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <span className="text-slate-500 font-bold uppercase">Moves</span>
          <strong className="text-amber-400 font-black">{moveCount}</strong>
        </div>

        {/* Turns Per Second (TPS) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-bold">{currentTps} TPS</span>
        </div>

        {/* Best Record */}
        {bestTimeMs > 0 && (
          <div className="flex items-center gap-1.5 pl-2 text-xs font-mono text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>PB: {formatTimeWithMs(bestTimeMs)}</span>
          </div>
        )}
      </div>

      {/* Scramble Notation Strip (if generated) */}
      {scrambleString && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 max-w-xl w-full px-4">
          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 shadow-lg">
            <span className="truncate pr-2 font-bold text-slate-400">SCRAMBLE: <span className="text-indigo-300">{scrambleString}</span></span>
            <button
              onClick={copyScrambleToClipboard}
              title="Copy Scramble"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            >
              {copiedScramble ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Face Control Deck */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 select-none">
        {/* Prime Toggle & Theme Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
          {/* Normal vs Inverted Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setMoveType('normal')}
              className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                moveType === 'normal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clockwise (F)
            </button>
            <button
              onClick={() => setMoveType('prime')}
              className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                moveType === 'prime'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prime (F')
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Theme Selector */}
          <div className="flex items-center gap-1">
            {(['competition', 'cyberpunk', 'pastel'] as CubeTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => onThemeChange(t)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                  theme === t
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Mute Audio */}
          <button
            onClick={() => setIsMuted(rubikAudio.toggleMute())}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* 6 Face Rotation Buttons */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-indigo-500/30 shadow-2xl">
          {FACE_BUTTONS.map((btn) => (
            <motion.button
              key={btn.face}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleRotate(btn.face)}
              disabled={isScrambling}
              className="relative w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-40"
              style={{
                backgroundColor: `${btn.color}22`,
                border: `2px solid ${btn.color}`,
                color: btn.color === '#f8fafc' ? '#ffffff' : btn.color,
              }}
            >
              <span className="text-base leading-none">
                {btn.label}{moveType === 'prime' ? "'" : ''}
              </span>
              <span className="text-[9px] font-mono opacity-60 mt-0.5 uppercase">
                [{btn.key}]
              </span>
            </motion.button>
          ))}

          <div className="h-8 w-[1px] bg-slate-800 mx-1" />

          {/* Scramble Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleScramble}
            disabled={isScrambling}
            className="flex items-center gap-1.5 px-4 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Shuffle className={`w-4 h-4 ${isScrambling ? 'animate-spin' : ''}`} />
            <span>SCRAMBLE</span>
          </motion.button>

          {/* Reset / Solve Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </motion.button>
        </div>
      </div>

      {/* Solved Victory Celebration Modal */}
      <AnimatePresence>
        {isSolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 select-none"
          >
            <div className="max-w-md w-full bg-slate-900/95 border-2 border-emerald-500/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-emerald-950/60">
              <div className="space-y-1">
                <span className="text-5xl">🏆🎉💎</span>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  CUBE SOLVED!
                </h2>
                <p className="text-xs text-emerald-400 font-mono">Official Speedcube Solve Verified</p>
              </div>

              <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Solve Time:</span>
                  <span className="font-mono text-emerald-400 font-black text-xl">{formatTimeWithMs(timerMs)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Move Count:</span>
                  <span className="font-mono text-amber-400 font-bold text-base">{moveCount} Moves</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Turn Rate:</span>
                  <span className="font-mono text-cyan-400 font-bold text-base">{currentTps} TPS</span>
                </div>
                {bestTimeMs > 0 && (
                  <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                    <span>Personal Best:</span>
                    <span className="font-mono text-yellow-300 font-bold text-base">{formatTimeWithMs(bestTimeMs)}</span>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setIsSolved(false);
                  handleScramble();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-600/30 cursor-pointer"
              >
                SCRAMBLE AGAIN
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Controls;
