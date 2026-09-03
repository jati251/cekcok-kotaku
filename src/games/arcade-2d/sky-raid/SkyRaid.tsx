import { useEffect, useRef, useState } from 'react';
import { CANVAS_W, CANVAS_H, GameState } from './types';
import { createInitialState, gameTick } from './engine';
import { gameRender } from './renderer';
import { ArcadeHeader } from '../ArcadeHeader';
import '../arcade.css';

export function SkyRaid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHighScore, setUiHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('sky_raid_hs');
    if (saved) setUiHighScore(parseInt(saved, 10));
  }, []);

  const saveHighScore = (score: number) => {
    if (score > uiHighScore) {
      setUiHighScore(score);
      localStorage.setItem('sky_raid_hs', score.toString());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
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

      frameRef.current++;
      gameTick(state, keysRef.current);

      if (state.started) {
        setUiScore(state.score);
        setUiLives(state.lives);
        if (state.gameOver && !uiGameOver) {
          setUiGameOver(true);
          saveHighScore(state.score);
        }
      }

      gameRender(ctx, state, frameRef.current);
      animRef.current = requestAnimationFrame(run);
    };

    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
  }, [uiGameOver, uiHighScore]);

  const resetGame = () => {
    Object.assign(stateRef.current, createInitialState());
    stateRef.current.started = true;
    setUiScore(0);
    setUiLives(3);
    setUiGameOver(false);
    setUiStarted(true);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Sky Raid" category="Arcade River Shooter" score={uiScore} lives={uiLives} />

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
                <h2 className="text-2xl font-bold text-sky-400">SKY RAID</h2>
                <p className="text-xs text-slate-300">Shoot enemy aircraft, collect fuel, and navigate canyon rivers.</p>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <p>Arrow Keys / WASD — Steer combat jet</p>
                  <p>Space — Fire cannons</p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
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
                <h2 className="text-2xl font-bold text-red-400">MISSION TERMINATED</h2>
                <p className="text-sm text-slate-200">Final Score: {uiScore}</p>
                <p className="text-xs text-sky-400 font-mono">
                  {uiScore >= uiHighScore && uiHighScore > 0 ? 'New High Score!' : `High Score: ${uiHighScore}`}
                </p>
                <button
                  className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  onClick={resetGame}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SkyRaid;
