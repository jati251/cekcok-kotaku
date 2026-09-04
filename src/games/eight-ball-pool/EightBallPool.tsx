import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Bot,
  User,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  Palette,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { GameMenuOverlay, HowToPlayStep } from '../arcade-2d/GameMenuOverlay';
import { useLauncherStore } from '@/stores/launcherStore';
import {
  PoolGameState,
  GameMode,
  AIDifficulty,
  FeltTheme,
  ShotOutcome,
} from './types';
import {
  TABLE,
  stepPhysics,
  areBallsStopped,
  calculateAimTrajectory,
  isValidBallPlacement,
} from './physics';
import {
  createInitialPoolState,
  createRack,
  evaluateShot,
  BALL_COLORS,
} from './engine';
import { computeAIShot } from './ai';
import { poolRenderer } from './renderer';
import { poolAudio } from './audio';
import { SpinControl } from './SpinControl';

const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    title: 'Break & Assign Groups',
    desc: 'Break the rack from behind the head string. The table is open until the first player legally pockets a solid (1-7) or stripe (9-15) ball.',
    badge: 'Break',
  },
  {
    title: 'Pocket Your Assigned Balls',
    desc: 'Hit your group balls first. Sinking your balls legally keeps your turn alive. Missing or fouling passes the turn to your opponent.',
    badge: 'Turns',
  },
  {
    title: 'Fouls & Ball-in-Hand',
    desc: 'Scratching (cue ball pocketed), hitting the wrong ball first, or failing to hit a cushion gives your opponent free Ball-in-Hand placement anywhere!',
    badge: 'Fouls',
  },
  {
    title: 'Sink the 8-Ball to Win',
    desc: 'Once you clear all 7 of your group balls, pocket the 8-ball legally to win. Sinking the 8-ball early or scratching on the 8-ball results in immediate loss!',
    badge: 'Victory',
  },
];

const CONTROLS_LIST = [
  { key: 'Mouse Move / Drag', action: 'Aim Cue Stick Angle' },
  { key: 'Power Bar / Drag Stick', action: 'Adjust Shot Power' },
  { key: 'Spacebar / Shoot Button', action: 'Execute Shot' },
  { key: 'Arrow Keys [← / →]', action: 'Fine-Tune Aim (+/- 0.5°)' },
  { key: 'P / Header Button', action: 'Pause Menu' },
];

export const EightBallPool: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isMuted, sfxVolume } = useLauncherStore();

  // Master game state
  const stateRef = useRef<PoolGameState>(createInitialPoolState('ai', 'medium'));
  const [hudState, setHudState] = useState<PoolGameState>(stateRef.current);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Ball-In-Hand cursor position
  const [ballInHandPos, setBallInHandPos] = useState<{
    x: number;
    y: number;
    isValid: boolean;
  } | null>(null);

  // Sync audio with launcher store
  useEffect(() => {
    poolAudio.setMuted(isMuted);
    poolAudio.setVolume(sfxVolume);
  }, [isMuted, sfxVolume]);

  // Shot outcome accumulator
  const shotOutcomeRef = useRef<ShotOutcome>({
    firstBallHit: null,
    ballsPocketed: [],
    cushionHitAfterBallContact: false,
    cueBallPocketed: false,
  });

  // Execute a shot with current angle and power
  const executeShot = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'aiming') return;

    const cueBall = s.balls.find((b) => b.number === 0);
    if (!cueBall || cueBall.isPocketed) return;

    // Reset shot outcome tracker
    shotOutcomeRef.current = {
      firstBallHit: null,
      ballsPocketed: [],
      cushionHitAfterBallContact: false,
      cueBallPocketed: false,
    };

    // Calculate initial velocity vector
    const speed = s.cueStick.power * 24; // Max impulse speed
    cueBall.vx = Math.cos(s.cueStick.angle) * speed;
    cueBall.vy = Math.sin(s.cueStick.angle) * speed;

    // Transfer spin
    cueBall.spinX = s.cueStick.spin.x;
    cueBall.spinY = s.cueStick.spin.y;

    s.phase = 'simulating';
    poolAudio.playCueStrike(s.cueStick.power);

    setHudState({ ...s });
  }, []);

  // Fine-tune angle adjustment
  const adjustAngle = (deltaRad: number) => {
    const s = stateRef.current;
    if (s.phase !== 'aiming') return;
    s.cueStick.angle = (s.cueStick.angle + deltaRad) % (Math.PI * 2);
    setHudState({ ...s });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused || !isStarted) return;

      if (e.code === 'Space') {
        e.preventDefault();
        executeShot();
      } else if (e.key === 'ArrowLeft') {
        adjustAngle(e.shiftKey ? -0.05 : -0.01);
      } else if (e.key === 'ArrowRight') {
        adjustAngle(e.shiftKey ? 0.05 : 0.01);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isStarted, executeShot]);

  // AI turn automation
  useEffect(() => {
    const s = stateRef.current;
    if (!isStarted || isPaused || s.phase !== 'aiming') return;
    if (s.mode !== 'ai' || s.turn !== 'player2') return;

    s.isAIThinking = true;
    setHudState({ ...s });

    const timer = setTimeout(() => {
      if (stateRef.current.phase !== 'aiming') return;

      const plan = computeAIShot(stateRef.current, TABLE, stateRef.current.aiDifficulty);

      // Smooth aim animation
      stateRef.current.cueStick.angle = plan.angle;
      stateRef.current.cueStick.power = plan.power;
      stateRef.current.isAIThinking = false;
      setHudState({ ...stateRef.current });

      const shootTimer = setTimeout(() => {
        executeShot();
      }, 500);

      return () => clearTimeout(shootTimer);
    }, 900);

    return () => clearTimeout(timer);
  }, [hudState.turn, hudState.phase, isStarted, isPaused, executeShot]);

  // Trigger victory confetti on game over
  useEffect(() => {
    if (hudState.phase === 'game_over' && hudState.winner) {
      poolAudio.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [hudState.phase, hudState.winner]);

  // Animation & Physics Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const s = stateRef.current;
      const canvas = canvasRef.current;

      if (canvas && !isPaused) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Responsive canvas rendering
          ctx.clearRect(0, 0, TABLE.width, TABLE.height);

          // 1. Render Table Felt & Cushions
          poolRenderer.renderTable(ctx, TABLE, s.feltTheme);

          // 2. Physics Simulation Step (when balls are in motion)
          if (s.phase === 'simulating') {
            stepPhysics(s.balls, TABLE, {
              onBallHit: (b1, b2) => {
                if (shotOutcomeRef.current.firstBallHit === null) {
                  if (b1.number === 0) shotOutcomeRef.current.firstBallHit = b2.number;
                  else if (b2.number === 0) shotOutcomeRef.current.firstBallHit = b1.number;
                }
              },
              onCushionHit: () => {
                if (shotOutcomeRef.current.firstBallHit !== null) {
                  shotOutcomeRef.current.cushionHitAfterBallContact = true;
                }
              },
              onPocketed: (b) => {
                if (b.number === 0) {
                  shotOutcomeRef.current.cueBallPocketed = true;
                } else {
                  shotOutcomeRef.current.ballsPocketed.push(b.number);
                }
              },
            });

            // Check if all balls have stopped
            if (areBallsStopped(s.balls)) {
              s.phase = 'evaluating';
              evaluateShot(s, shotOutcomeRef.current, TABLE);
              setHudState({ ...s });
            }
          }

          // 3. Render Aim Guide & Cue Stick (when in aiming phase)
          const cueBall = s.balls.find((b) => b.number === 0);
          if (cueBall && s.phase === 'aiming' && (!s.isAIThinking || s.mode !== 'ai' || s.turn === 'player1')) {
            const trajectory = calculateAimTrajectory(cueBall, s.cueStick.angle, s.balls, TABLE);
            poolRenderer.renderAimGuide(ctx, trajectory, cueBall);
            poolRenderer.renderCueStick(ctx, cueBall, s.cueStick);
          }

          // 4. Render Balls
          // Render object balls first, then cue ball on top
          for (const b of s.balls) {
            if (b.number !== 0) poolRenderer.renderBall(ctx, b);
          }
          if (cueBall) {
            poolRenderer.renderBall(ctx, cueBall);
          }

          // 5. Render Ball-In-Hand placement ghost
          if (s.phase === 'ball_in_hand' && ballInHandPos) {
            poolRenderer.renderBallInHandIndicator(
              ctx,
              ballInHandPos.x,
              ballInHandPos.y,
              ballInHandPos.isValid
            );
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, ballInHandPos]);

  // Pointer interaction: Aiming with mouse drag and Ball-in-Hand placement
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isStarted || isPaused) return;
    const s = stateRef.current;
    if (s.mode === 'ai' && s.turn === 'player2') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = TABLE.width / rect.width;
    const scaleY = TABLE.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    if (s.phase === 'ball_in_hand') {
      const isValid = isValidBallPlacement(canvasX, canvasY, s.balls, TABLE, s.isBreakShot);
      if (isValid) {
        const cue = s.balls.find((b) => b.number === 0);
        if (cue) {
          cue.x = canvasX;
          cue.y = canvasY;
          cue.isPocketed = false;
          cue.scale = 1;
        }
        s.isBallInHand = false;
        s.phase = 'aiming';
        s.foul = null;
        setBallInHandPos(null);
        poolAudio.playBallHit(2);
        setHudState({ ...s });
      } else {
        poolAudio.playFoul();
      }
      return;
    }

    if (s.phase === 'aiming') {
      const cue = s.balls.find((b) => b.number === 0);
      if (cue) {
        s.cueStick.angle = Math.atan2(canvasY - cue.y, canvasX - cue.x);
        setHudState({ ...s });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isStarted || isPaused) return;
    const s = stateRef.current;
    if (s.mode === 'ai' && s.turn === 'player2') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = TABLE.width / rect.width;
    const scaleY = TABLE.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    if (s.phase === 'ball_in_hand') {
      const isValid = isValidBallPlacement(canvasX, canvasY, s.balls, TABLE, s.isBreakShot);
      setBallInHandPos({ x: canvasX, y: canvasY, isValid });
      return;
    }

    // Dragging mouse rotates cue stick
    if (s.phase === 'aiming' && e.buttons === 1) {
      const cue = s.balls.find((b) => b.number === 0);
      if (cue) {
        s.cueStick.angle = Math.atan2(canvasY - cue.y, canvasX - cue.x);
        setHudState({ ...s });
      }
    }
  };

  // Restart / Reset game
  const handleRestart = (
    mode: GameMode = hudState.mode,
    diff: AIDifficulty = hudState.aiDifficulty
  ) => {
    stateRef.current = createInitialPoolState(mode, diff);
    setHudState({ ...stateRef.current });
    setBallInHandPos(null);
    setIsPaused(false);
  };

  // Switch Theme
  const cycleTheme = () => {
    const themes: FeltTheme[] = ['emerald', 'navy', 'burgundy', 'midnight'];
    const nextIdx = (themes.indexOf(hudState.feltTheme) + 1) % themes.length;
    stateRef.current.feltTheme = themes[nextIdx];
    setHudState({ ...stateRef.current });
  };

  // Re-rack in Practice Mode
  const handleReRack = () => {
    const s = stateRef.current;
    s.balls = createRack(TABLE);
    s.phase = 'aiming';
    s.isBreakShot = true;
    s.isBallInHand = false;
    s.tableState = 'open';
    s.player1Group = null;
    s.player2Group = null;
    s.foul = null;
    poolAudio.playBallHit(8);
    setHudState({ ...s });
  };

  // Render mini ball rack for HUD
  const renderHUDGroupBalls = (group: 'solids' | 'stripes' | null) => {
    if (!group) {
      return <span className="text-[10px] text-slate-500 italic">Open Table</span>;
    }
    const isSolid = group === 'solids';
    const range = isSolid ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];

    return (
      <div className="flex items-center gap-1 mt-0.5">
        {range.map((num) => {
          const ball = hudState.balls.find((b) => b.number === num);
          const pocketed = ball?.isPocketed ?? false;
          return (
            <div
              key={num}
              title={`Ball ${num}`}
              style={{
                backgroundColor: BALL_COLORS[num].base,
                opacity: pocketed ? 0.25 : 1,
              }}
              className={`w-3.5 h-3.5 rounded-full border border-black/30 flex items-center justify-center text-[7px] font-black text-black shadow-xs ${
                pocketed ? 'line-through' : ''
              }`}
            >
              {num}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-[#06140e] text-slate-100 overflow-hidden select-none font-sans"
    >
      {/* Top Header */}
      <ArcadeHeader
        title="8 Ball Pool"
        category="Sports Simulation"
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
      />

      {/* Brass & Mahogany Top Rail Trim */}
      <div className="w-full h-1 bg-gradient-to-r from-[#78350f] via-[#d97706] to-[#78350f] shadow-md" />

      {/* Main Playing Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-3 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0c2419] to-[#040d09]">
        {/* Match HUD Top Bar: Polished Mahogany & Brass Salon Scoreboard */}
        <div className="w-full max-w-5xl flex items-center justify-between px-5 py-2.5 bg-gradient-to-b from-[#2e180d] to-[#1c0e07] rounded-lg border-2 border-[#5c3319] shadow-[0_10px_25px_rgba(0,0,0,0.8)] mb-3 relative">
          {/* Brass screws in corners */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 border border-amber-300" />
          <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 border border-amber-300" />
          <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 border border-amber-300" />
          <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 border border-amber-300" />

          {/* Player 1 Card (Brass Plaque) */}
          <div
            className={`flex items-center gap-3 px-3.5 py-1.5 rounded border transition-all ${
              hudState.turn === 'player1'
                ? 'bg-[#0f2e1f] border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-[#150a04] border-[#3d2010] opacity-75'
            }`}
          >
            <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200 font-serif">PLAYER 1</span>
                {hudState.turn === 'player1' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-400/90 font-mono">
                  {hudState.player1Group || 'Any Ball'}
                </span>
                {renderHUDGroupBalls(hudState.player1Group)}
              </div>
            </div>
          </div>

          {/* Center Match Banner / Foul Alert */}
          <div className="flex flex-col items-center justify-center text-center">
            {hudState.foul ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-950 border-2 border-rose-500 rounded text-rose-200 text-xs font-bold animate-pulse shadow">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{hudState.foul}</span>
              </div>
            ) : hudState.phase === 'ball_in_hand' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950 border-2 border-amber-500 rounded text-amber-200 text-xs font-bold shadow">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Ball in Hand: Click table to place cue ball</span>
              </div>
            ) : hudState.isAIThinking ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-950 border-2 border-sky-500 rounded text-sky-200 text-xs font-bold animate-pulse shadow">
                <Bot className="w-3.5 h-3.5 text-sky-400" />
                <span>AI is calculating cut shot angle...</span>
              </div>
            ) : (
              <div className="text-xs font-bold font-serif uppercase tracking-widest text-amber-300">
                {hudState.mode === 'practice'
                  ? 'PARLOR PRACTICE'
                  : hudState.turn === 'player1'
                  ? 'PLAYER 1 TO BREAK'
                  : hudState.mode === 'ai'
                  ? 'AI TURN'
                  : 'PLAYER 2 TURN'}
              </div>
            )}
          </div>

          {/* Player 2 / AI Card */}
          <div
            className={`flex items-center gap-3 px-3.5 py-1.5 rounded border transition-all ${
              hudState.turn === 'player2'
                ? 'bg-[#0a2336] border-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                : 'bg-[#150a04] border-[#3d2010] opacity-75'
            }`}
          >
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {hudState.turn === 'player2' && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                )}
                <span className="text-xs font-black uppercase tracking-wider text-amber-200 font-serif">
                  {hudState.mode === 'ai' ? `AI (${hudState.aiDifficulty})` : 'PLAYER 2'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                {renderHUDGroupBalls(hudState.player2Group)}
                <span className="text-[10px] uppercase font-bold text-amber-400/90 font-mono">
                  {hudState.player2Group || 'Any Ball'}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-sky-950 border border-sky-500/60 flex items-center justify-center text-sky-400">
              {hudState.mode === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Canvas & Interactive Cue Controls Container */}
        <div className="relative flex items-center justify-center gap-4 w-full max-w-5xl">
          {/* Left Side Floating Widgets: Spin Control & Table Theme */}
          <div className="flex flex-col gap-2.5 z-20">
            <SpinControl
              spin={hudState.cueStick.spin}
              onChange={(newSpin) => {
                stateRef.current.cueStick.spin = newSpin;
                setHudState({ ...stateRef.current });
              }}
            />

            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              title={`Current Theme: ${hudState.feltTheme}`}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span className="capitalize text-[10px]">{hudState.feltTheme}</span>
            </button>

            {/* Re-Rack Button in Practice Mode */}
            {hudState.mode === 'practice' && (
              <button
                onClick={handleReRack}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-400 hover:text-amber-300 transition shadow-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px]">Re-Rack</span>
              </button>
            )}
          </div>

          {/* 2D Canvas Table */}
          <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-950/70 bg-amber-950/40">
            <canvas
              ref={canvasRef}
              width={TABLE.width}
              height={TABLE.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              className={`block cursor-crosshair ${
                hudState.phase === 'ball_in_hand' ? 'cursor-move' : ''
              }`}
              style={{
                maxWidth: '100%',
                maxHeight: '68vh',
                aspectRatio: '2 / 1',
              }}
            />
          </div>

          {/* Right Side: Vertical Shot Power Gauge */}
          <div className="flex flex-col items-center bg-gradient-to-b from-[#2e180d] to-[#1a0c06] border-2 border-[#5c3319] p-2.5 rounded-lg shadow-2xl z-20 h-[360px] select-none">
            <span className="text-[10px] font-black uppercase text-amber-300 font-serif tracking-widest mb-0.5">
              POWER
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-200 mb-2">
              {Math.round(hudState.cueStick.power * 100)}%
            </span>

            {/* Power Vertical Slider Container: Brass Measure */}
            <div className="relative flex-1 w-6 bg-[#0e0703] rounded border border-amber-800/80 flex flex-col justify-end p-0.5 overflow-hidden shadow-inner">
              {/* Power Fill Bar */}
              <div
                style={{ height: `${hudState.cueStick.power * 100}%` }}
                className="w-full rounded-sm bg-gradient-to-t from-emerald-600 via-amber-500 to-rose-600 transition-all duration-75 shadow-lg"
              />

              {/* Invisible native range input rotated */}
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.02"
                value={hudState.cueStick.power}
                onChange={(e) => {
                  const p = parseFloat(e.target.value);
                  stateRef.current.cueStick.power = p;
                  setHudState({ ...stateRef.current });
                }}
                className="absolute inset-0 opacity-0 cursor-ns-resize h-full w-full"
              />
            </div>

            {/* Execute Shot Button: Brass Trigger */}
            <button
              onClick={executeShot}
              disabled={
                hudState.phase !== 'aiming' ||
                (hudState.mode === 'ai' && hudState.turn === 'player2')
              }
              className="mt-3 px-3 py-2 w-full rounded bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1 font-serif"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>STRIKE</span>
            </button>
          </div>
        </div>

        {/* Bottom Aim Fine-Tuning & Mode Selector Bar: Polished Mahogany Rail */}
        <div className="w-full max-w-5xl flex items-center justify-between px-4 py-2.5 mt-2 bg-[#180d07]/90 backdrop-blur-md rounded border border-amber-900/60 text-xs text-amber-200/90 shadow-lg">
          {/* Aim Fine-Tuning Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-serif font-bold text-amber-500 uppercase tracking-widest">
              Cue Fine-Tune:
            </span>
            <button
              onClick={() => adjustAngle(-0.04)}
              className="px-2.5 py-1 rounded bg-[#2b180d] hover:bg-[#3d2313] border border-amber-800/60 text-amber-300 transition cursor-pointer font-serif font-bold"
            >
              -2°
            </button>
            <button
              onClick={() => adjustAngle(-0.01)}
              className="px-2 py-1 rounded bg-[#2b180d] hover:bg-[#3d2313] border border-amber-800/60 text-amber-300 transition cursor-pointer font-serif font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => adjustAngle(0.01)}
              className="px-2 py-1 rounded bg-[#2b180d] hover:bg-[#3d2313] border border-amber-800/60 text-amber-300 transition cursor-pointer font-serif font-bold"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => adjustAngle(0.04)}
              className="px-2.5 py-1 rounded bg-[#2b180d] hover:bg-[#3d2313] border border-amber-800/60 text-amber-300 transition cursor-pointer font-serif font-bold"
            >
              +2°
            </button>
          </div>

          {/* Mode Selector Tabs: Brass Selector */}
          <div className="flex items-center gap-1.5 bg-[#0e0704] p-1 rounded border border-amber-900/60">
            <button
              onClick={() => handleRestart('ai', 'medium')}
              className={`px-3 py-1 rounded text-xs font-serif font-bold transition cursor-pointer ${
                hudState.mode === 'ai'
                  ? 'bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 border border-amber-500/60 shadow-sm'
                  : 'text-amber-500/60 hover:text-amber-300'
              }`}
            >
              vs AI
            </button>
            <button
              onClick={() => handleRestart('pvp')}
              className={`px-3 py-1 rounded text-xs font-serif font-bold transition cursor-pointer ${
                hudState.mode === 'pvp'
                  ? 'bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 border border-amber-500/60 shadow-sm'
                  : 'text-amber-500/60 hover:text-amber-300'
              }`}
            >
              Pass & Play
            </button>
            <button
              onClick={() => handleRestart('practice')}
              className={`px-3 py-1 rounded text-xs font-serif font-bold transition cursor-pointer ${
                hudState.mode === 'practice'
                  ? 'bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 border border-amber-500/60 shadow-sm'
                  : 'text-amber-500/60 hover:text-amber-300'
              }`}
            >
              Practice
            </button>
          </div>
        </div>
      </div>

      {/* Game Over Modal: Victorian Mahogany Plaque */}
      {hudState.phase === 'game_over' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-serif">
          <div className="w-full max-w-md bg-[#1a0e07] border-2 border-amber-600/80 rounded p-6 shadow-2xl text-center relative">
            <div className="w-16 h-16 rounded bg-amber-950/60 border border-amber-500/60 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black uppercase tracking-widest text-amber-200 mb-1">
              Match Concluded
            </h2>
            <p className="text-sm font-bold text-amber-400 mb-4">
              {hudState.winner === 'player1'
                ? 'Player 1 Claims Victory!'
                : hudState.mode === 'ai'
                ? 'AI Bot Claims Victory!'
                : 'Player 2 Claims Victory!'}
            </p>

            <div className="bg-[#0e0704] p-4 rounded border border-amber-900/60 text-xs text-amber-200/90 mb-6 font-mono">
              <p className="italic">{hudState.winReason}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleRestart()}
                className="flex-1 py-3 rounded bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 font-serif font-black text-xs uppercase tracking-wider text-amber-950 border border-amber-400 shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rematch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause & How to Play Overlay */}
      <GameMenuOverlay
        title="8 Ball Pool"
        subtitle="Classic Billiards Simulation"
        accentColor="#10b981"
        icon={<Target className="w-6 h-6 text-emerald-400" />}
        howToPlay={HOW_TO_PLAY_STEPS}
        controlsList={CONTROLS_LIST}
        isStarted={isStarted}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
        onStart={() => {
          setIsStarted(true);
          setIsPaused(false);
          poolAudio.playCueStrike(0.6);
        }}
        onRestart={() => {
          handleRestart();
          setIsStarted(true);
          setIsPaused(false);
        }}
      />
    </div>
  );
};

export default EightBallPool;
