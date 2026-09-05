import React, { useEffect, useRef, useState } from 'react';
import { useLauncherStore } from '@/stores/launcherStore';
import { mkAudio } from './audio';
import { FIGHTER_LIST, FIGHTERS } from './characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH, InputState, KombatEngine } from './engine';
import { KombatRenderer } from './renderer';
import { ArenaId, FighterId } from './types';

export const MortalKombatGame: React.FC = () => {
  const { exitToLauncher } = useLauncherStore();

  // Screen State
  const [inSelectScreen, setInSelectScreen] = useState<boolean>(true);
  const [selectedP1, setSelectedP1] = useState<FighterId>('scorpion');
  const [selectedP2, setSelectedP2] = useState<FighterId>('subzero');
  const [selectedArena, setSelectedArena] = useState<ArenaId>('the_pit');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showMoves, setShowMoves] = useState<boolean>(false);

  // Canvas and Engine Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<KombatEngine | null>(null);
  const rendererRef = useRef<KombatRenderer | null>(null);

  // Input Ref
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    block: false,
    highPunch: false,
    lowPunch: false,
    highKick: false,
    lowKick: false,
    special1: false,
    special2: false,
    fatality: false,
  });

  // Start Combat
  const startCombat = () => {
    setInSelectScreen(false);
  };

  // Return to Select
  const returnToSelect = () => {
    setInSelectScreen(true);
    engineRef.current = null;
  };

  // Exit to Launcher
  const handleExit = () => {
    mkAudio.stopAll();
    exitToLauncher();
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    mkAudio.setMuted(next);
  };

  // Engine & Canvas Loop Effect
  useEffect(() => {
    if (inSelectScreen) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = new KombatEngine(selectedP1, selectedP2, selectedArena);
    const renderer = new KombatRenderer(ctx);
    engineRef.current = engine;
    rendererRef.current = renderer;

    let animId: number;

    const gameLoop = () => {
      if (engineRef.current && rendererRef.current) {
        engineRef.current.update(inputRef.current);
        rendererRef.current.render(engineRef.current);
      }
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const inp = inputRef.current;
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          inp.left = true;
          break;
        case 'd':
        case 'arrowright':
          inp.right = true;
          break;
        case 'w':
        case 'arrowup':
          inp.up = true;
          break;
        case 's':
        case 'arrowdown':
          inp.down = true;
          break;
        case ' ':
        case 'shift':
          inp.block = true;
          break;
        case 'j':
        case 'z':
          inp.highPunch = true;
          break;
        case 'u':
        case 'q':
          inp.lowPunch = true;
          break;
        case 'k':
        case 'x':
          inp.highKick = true;
          break;
        case 'i':
        case 'e':
          inp.lowKick = true;
          break;
        case 'f':
          inp.special1 = true;
          inp.fatality = true;
          break;
        case 'r':
          inp.special2 = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          inp.left = false;
          break;
        case 'd':
        case 'arrowright':
          inp.right = false;
          break;
        case 'w':
        case 'arrowup':
          inp.up = false;
          break;
        case 's':
        case 'arrowdown':
          inp.down = false;
          break;
        case ' ':
        case 'shift':
          inp.block = false;
          break;
        case 'j':
        case 'z':
          inp.highPunch = false;
          break;
        case 'u':
        case 'q':
          inp.lowPunch = false;
          break;
        case 'k':
        case 'x':
          inp.highKick = false;
          break;
        case 'i':
        case 'e':
          inp.lowKick = false;
          break;
        case 'f':
          inp.special1 = false;
          inp.fatality = false;
          break;
        case 'r':
          inp.special2 = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // CLEANUP RETURN: Absolute safety against leaks or lingering audio/speech/rAF
    return () => {
      cancelAnimationFrame(animId);
      mkAudio.stopAll();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engineRef.current = null;
      rendererRef.current = null;
    };
  }, [inSelectScreen, selectedP1, selectedP2, selectedArena]);

  // Touch / Onscreen button helpers
  const triggerTouch = (action: keyof InputState) => {
    inputRef.current[action] = true;
    setTimeout(() => {
      inputRef.current[action] = false;
    }, 120);
  };

  const p1Def = FIGHTERS[selectedP1];

  return (
    <div className="flex flex-col h-screen w-full bg-black select-none overflow-hidden font-sans text-white">
      {/* Top Arcade Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-zinc-950 border-b border-red-900/60 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/50 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            ← Launcher
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐉</span>
            <h1 className="text-base font-black tracking-widest text-red-500 uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              Mortal Kombat <span className="text-yellow-400 font-normal text-xs">CLASSIC</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMoves(!showMoves)}
            className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold tracking-wide transition-colors"
          >
            {showMoves ? 'Hide Moves' : 'Move List'}
          </button>
          <button
            onClick={toggleSound}
            className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold tracking-wide transition-colors"
          >
            {isMuted ? '🔇 Muted' : '🔊 Sound'}
          </button>
          {!inSelectScreen && (
            <button
              onClick={returnToSelect}
              className="px-3 py-1.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Choose Fighter
            </button>
          )}
        </div>
      </header>

      {/* Main Game Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
        {inSelectScreen ? (
          /* CHARACTER SELECTION SCREEN */
          <div className="flex flex-col items-center max-w-4xl w-full p-6 bg-zinc-950/90 rounded-2xl border-2 border-red-900/60 shadow-[0_0_50px_rgba(220,38,38,0.25)] backdrop-blur-md">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black tracking-widest text-red-500 uppercase drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                CHOOSE YOUR FIGHTER
              </h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">
                Earthrealm vs Outworld Tournament
              </p>
            </div>

            {/* Fighter Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6 w-full">
              {FIGHTER_LIST.map((f) => {
                const isSelectedP1 = selectedP1 === f.id;
                const isSelectedP2 = selectedP2 === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedP1(f.id)}
                    className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all transform hover:-translate-y-1 ${
                      isSelectedP1
                        ? 'border-yellow-400 bg-red-950/70 shadow-[0_0_20px_rgba(234,179,8,0.6)] scale-105'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-red-600'
                    }`}
                  >
                    <span className="text-4xl mb-2">{f.avatar}</span>
                    <span className="text-xs font-black tracking-wide text-zinc-200 uppercase">
                      {f.name}
                    </span>
                    {isSelectedP1 && (
                      <span className="absolute -top-2 -left-2 bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                        P1
                      </span>
                    )}
                    {isSelectedP2 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                        CPU
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Fighter Details & CPU Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full p-4 rounded-xl bg-black/60 border border-zinc-800 mb-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{p1Def.avatar}</span>
                  <div>
                    <h3 className="text-lg font-black text-yellow-400 uppercase">{p1Def.name}</h3>
                    <p className="text-xs text-zinc-400">{p1Def.title}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-zinc-300 mt-2">
                  <div>
                    <span className="text-zinc-500 font-bold">Special 1:</span> {p1Def.special1Name}
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold">Special 2:</span> {p1Def.special2Name}
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">Fatality:</span> {p1Def.fatalityName}
                  </div>
                </div>
              </div>

              {/* Arena & Opponent settings */}
              <div className="flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">
                    Opponent (CPU):
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {FIGHTER_LIST.filter((f) => f.id !== selectedP1).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedP2(f.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors ${
                          selectedP2 === f.id
                            ? 'bg-red-700 text-white border-red-500'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">
                    Battle Arena:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedArena('the_pit')}
                      className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
                        selectedArena === 'the_pit'
                          ? 'bg-blue-900/60 text-blue-200 border-blue-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      🌉 The Pit
                    </button>
                    <button
                      onClick={() => setSelectedArena('goros_lair')}
                      className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
                        selectedArena === 'goros_lair'
                          ? 'bg-amber-900/60 text-amber-200 border-amber-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      🔥 Goro's Lair
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startCombat}
              className="px-10 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:to-red-500 text-white font-black text-lg uppercase tracking-widest border border-red-400 shadow-[0_0_25px_rgba(220,38,38,0.7)] transform hover:scale-105 active:scale-95 transition-all"
            >
              FIGHT!
            </button>
          </div>
        ) : (
          /* COMBAT ARENA VIEW */
          <div className="flex flex-col items-center justify-center w-full max-w-4xl relative">
            <div className="relative rounded-xl overflow-hidden border-2 border-red-900/80 shadow-[0_0_35px_rgba(220,38,38,0.3)] bg-black">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full max-w-[800px] h-auto aspect-[5/3] block"
              />
            </div>

            {/* Touch / Quick Action Buttons for accessibility */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[800px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => triggerTouch('highPunch')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-yellow-700/60 rounded text-xs font-black uppercase"
                >
                  High Punch [J]
                </button>
                <button
                  onClick={() => triggerTouch('lowPunch')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-yellow-700/60 rounded text-xs font-black uppercase"
                >
                  Low Punch [U]
                </button>
                <button
                  onClick={() => triggerTouch('highKick')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-orange-700/60 rounded text-xs font-black uppercase"
                >
                  High Kick [K]
                </button>
                <button
                  onClick={() => triggerTouch('lowKick')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-orange-700/60 rounded text-xs font-black uppercase"
                >
                  Low Kick [I]
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => triggerTouch('block')}
                  className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700 rounded text-xs font-black uppercase"
                >
                  Block [Space]
                </button>
                <button
                  onClick={() => triggerTouch('special1')}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 rounded text-xs font-black uppercase"
                >
                  Special 1 [F]
                </button>
                <button
                  onClick={() => triggerTouch('special2')}
                  className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded text-xs font-black uppercase"
                >
                  Special 2 [R]
                </button>
                <button
                  onClick={() => triggerTouch('fatality')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white border border-red-400 rounded text-xs font-black uppercase animate-pulse"
                >
                  FATALITY [F]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Move List Modal Drawer */}
        {showMoves && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
            <div className="bg-zinc-950 border border-red-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-xl font-black text-red-500 uppercase tracking-wider">
                  KOMBAT MANUAL & COMMANDS
                </h3>
                <button
                  onClick={() => setShowMoves(false)}
                  className="text-zinc-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 text-xs text-zinc-300 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <h4 className="font-black text-yellow-400 uppercase mb-1">Standard Controls:</h4>
                  <ul className="grid grid-cols-2 gap-2">
                    <li><span className="text-white font-bold">Move:</span> A / D or Arrow Keys</li>
                    <li><span className="text-white font-bold">Jump:</span> W or Up</li>
                    <li><span className="text-white font-bold">Crouch:</span> S or Down</li>
                    <li><span className="text-white font-bold">Block:</span> Space or Shift</li>
                    <li><span className="text-white font-bold">High Punch:</span> J or Z</li>
                    <li><span className="text-white font-bold">Low Punch:</span> U or Q</li>
                    <li><span className="text-white font-bold">High Kick:</span> K or X</li>
                    <li><span className="text-white font-bold">Low Kick:</span> I or E</li>
                    <li><span className="text-white font-bold">Uppercut:</span> Down + Punch</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-black text-red-400 uppercase mb-1">Character Specials:</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-yellow-400">Scorpion:</span> Spear ("GET OVER HERE!") [F], Teleport Punch [R]
                    </div>
                    <div>
                      <span className="font-bold text-sky-400">Sub-Zero:</span> Ice Blast (Freeze) [F], Cold Slide [R]
                    </div>
                    <div>
                      <span className="font-bold text-blue-300">Raiden:</span> Lightning Bolt [F], Torpedo Dive [R]
                    </div>
                    <div>
                      <span className="font-bold text-red-400">Liu Kang:</span> Dragon Fireball [F], Bicycle Kick [R]
                    </div>
                    <div>
                      <span className="font-bold text-green-400">Sonya:</span> Energy Ring [F], Square Wave Punch [R]
                    </div>
                    <div>
                      <span className="font-bold text-cyan-400">Johnny Cage:</span> Shadow Kick [F], Nutcracker Punch [R]
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-red-500 uppercase mb-1">Fatality Finisher:</h4>
                  <p className="text-zinc-400">
                    When opponent is dazed with 0 HP during "FINISH HIM!", press <span className="text-white font-bold">[F]</span> or the FATALITY button to perform your fighter's signature execution with blood splatter and announcer fanfare!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
