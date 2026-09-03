import { useEffect, useRef, useState } from 'react';
import { CANVAS_W, CANVAS_H, GameState } from './types';
import { createInitialState, gameTick } from './physics';
import { gameRender } from './renderer';
import { ArcadeHeader } from '../ArcadeHeader';
import '../arcade.css';

export function CrazyWheels() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiDeaths, setUiDeaths] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiFinishReached, setUiFinishReached] = useState(false);
  const [uiHighScore, setUiHighScore] = useState(() => {
    const saved = localStorage.getItem('crazyWheelsHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    stateRef.current.highScore = uiHighScore;
  }, [uiHighScore]);

  const saveHighScore = (score: number) => {
    if (score > uiHighScore) {
      setUiHighScore(score);
      localStorage.setItem('crazyWheelsHighScore', score.toString());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const run = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(run);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animRef.current = requestAnimationFrame(run);
        return;
      }

      gameTick(state, keysRef.current);

      if (state.started) {
        setUiScore(Math.max(0, state.score));
        setUiDeaths(state.deaths);

        if (state.gameOver && !uiGameOver) {
          setUiGameOver(true);
          setUiFinishReached(state.finishReached);
          saveHighScore(state.score);
        }
      }

      gameRender(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };

    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
  }, [uiGameOver, uiHighScore]);

  const resetGame = () => {
    Object.assign(stateRef.current, createInitialState());
    stateRef.current.started = true;
    setUiScore(0);
    setUiDeaths(0);
    setUiGameOver(false);
    setUiFinishReached(false);
    setUiStarted(true);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Crazy Wheels" category="Physics Obstacle Trial" score={uiScore} lives={Math.max(0, 10 - uiDeaths)} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="game-canvas rounded-xl border border-slate-800 shadow-2xl"
          />

          {!uiStarted && (
            <div className="overlay overlay-start absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="overlay-content text-center space-y-4 p-6">
                <h2 className="text-2xl font-bold text-rose-500">CRAZY WHEELS</h2>
                <p className="text-xs text-slate-300">Navigate the lethal obstacle course and reach the finish flag!</p>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <p>← / → or A / D — Accelerate & lean</p>
                  <p>↑ or Space — Jump</p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  onClick={resetGame}
                >
                  Start Game
                </button>
                <p className="text-xs font-mono text-slate-500">High Score: {uiHighScore}</p>
              </div>
            </div>
          )}

          {uiGameOver && (
            <div className="overlay overlay-gameover absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="overlay-content text-center space-y-4 p-6">
                <h2 className={`text-2xl font-bold ${uiFinishReached ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {uiFinishReached ? 'COURSE COMPLETED!' : 'CRASHED!'}
                </h2>
                <p className="text-sm text-slate-200">Final Score: {uiScore}</p>
                <p className="text-xs text-slate-400">Total Deaths: {uiDeaths}</p>
                <button
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  onClick={resetGame}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CrazyWheels;
