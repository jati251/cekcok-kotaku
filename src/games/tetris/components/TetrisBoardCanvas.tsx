import React, { useRef, useEffect } from 'react';
import { useTetrisStore } from '../stores/tetrisStore';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  TETRIMINO_COLORS,
} from '../types';
import { getGhostY } from '../utils/tetrisEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: string;
  text: string;
  subText?: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
}

interface HardDropBeam {
  col: number;
  startY: number;
  endY: number;
  color: string;
  alpha: number;
}

interface LineFlash {
  row: number;
  timer: number;
}

export const TetrisBoardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth lerp coordinates for active piece
  const smoothXRef = useRef<number>(3);
  const smoothYRef = useRef<number>(0);
  const screenShakeRef = useRef<{ x: number; y: number; trauma: number }>({ x: 0, y: 0, trauma: 0 });

  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const hardDropBeamsRef = useRef<HardDropBeam[]>([]);
  const lineFlashesRef = useRef<LineFlash[]>([]);
  const lastProcessedClearRef = useRef<number>(0);
  const lastProcessedHardDropRef = useRef<number>(0);

  // Hook into store state
  const {
    board,
    currentPiece,
    currentX,
    currentY,
    lastClearEvent,
    lastHardDropEvent,
  } = useTetrisStore();

  // Handle line clear explosions & popups
  useEffect(() => {
    if (!lastClearEvent || lastClearEvent.timestamp === lastProcessedClearRef.current) return;
    lastProcessedClearRef.current = lastClearEvent.timestamp;

    const { lines, clearedRowIndices, scoreGain, combo } = lastClearEvent;

    // Trigger row flashes
    clearedRowIndices.forEach((row) => {
      lineFlashesRef.current.push({ row, timer: 12 });
      // Spawn bursting particles along the cleared line
      for (let c = 0; c < BOARD_WIDTH; c++) {
        for (let p = 0; p < 4; p++) {
          const angle = (Math.random() - 0.5) * Math.PI * 2;
          const speed = 2 + Math.random() * 5;
          particlesRef.current.push({
            x: c * CELL_SIZE + CELL_SIZE / 2,
            y: row * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            color: lines >= 4 ? '#fde047' : '#38bdf8',
            size: 2 + Math.random() * 3.5,
            life: 25 + Math.random() * 15,
            maxLife: 40,
          });
        }
      }
    });

    // Camera shake
    screenShakeRef.current.trauma = lines >= 4 ? 8 : lines * 2.5;

    // Floating combat popup
    const textLabel =
      lines >= 4
        ? '🔥 TETRIS!'
        : lines === 3
        ? 'TRIPLE!'
        : lines === 2
        ? 'DOUBLE!'
        : 'SINGLE!';

    const avgRow =
      clearedRowIndices.reduce((sum, r) => sum + r, 0) / (clearedRowIndices.length || 1);

    floatingTextsRef.current.push({
      id: `float_${Date.now()}`,
      text: `${textLabel} +${scoreGain}`,
      subText: combo > 1 ? `COMBO x${combo}` : undefined,
      x: (BOARD_WIDTH * CELL_SIZE) / 2,
      y: Math.max(40, avgRow * CELL_SIZE),
      life: 50,
      maxLife: 50,
      color: lines >= 4 ? '#facc15' : '#38bdf8',
    });
  }, [lastClearEvent]);

  // Handle hard drop beam & impact dust
  useEffect(() => {
    if (!lastHardDropEvent || lastHardDropEvent.timestamp === lastProcessedHardDropRef.current) return;
    lastProcessedHardDropRef.current = lastHardDropEvent.timestamp;

    const { cols, startY, endY, color } = lastHardDropEvent;
    cols.forEach((col) => {
      hardDropBeamsRef.current.push({
        col,
        startY,
        endY,
        color,
        alpha: 0.6,
      });

      // Impact sparks on the landing floor
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.8;
        const speed = 2 + Math.random() * 4;
        particlesRef.current.push({
          x: col * CELL_SIZE + CELL_SIZE / 2,
          y: (endY + 1) * CELL_SIZE,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 1.5 + Math.random() * 2.5,
          life: 18 + Math.random() * 10,
          maxLife: 28,
        });
      }
    });

    screenShakeRef.current.trauma = Math.max(screenShakeRef.current.trauma, 4);
  }, [lastHardDropEvent]);

  // Main 60 FPS Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.016;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = BOARD_WIDTH * CELL_SIZE;
      const height = BOARD_HEIGHT * CELL_SIZE;

      // Update screen shake
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current.trauma > 0) {
        const mag = screenShakeRef.current.trauma;
        shakeX = (Math.random() - 0.5) * mag;
        shakeY = (Math.random() - 0.5) * mag;
        screenShakeRef.current.trauma = Math.max(0, screenShakeRef.current.trauma - 0.35);
      }

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(shakeX, shakeY);

      // Background Grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, height);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(width, y * CELL_SIZE);
        ctx.stroke();
      }

      // Hard Drop Laser Beams
      for (let i = hardDropBeamsRef.current.length - 1; i >= 0; i--) {
        const beam = hardDropBeamsRef.current[i];
        beam.alpha -= 0.05;
        if (beam.alpha <= 0) {
          hardDropBeamsRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = beam.color;
        ctx.globalAlpha = beam.alpha * 0.35;
        ctx.fillRect(
          beam.col * CELL_SIZE + 2,
          beam.startY * CELL_SIZE,
          CELL_SIZE - 4,
          (beam.endY - beam.startY + 1) * CELL_SIZE
        );
        ctx.globalAlpha = 1;
      }

      // Draw Locked Board Cells
      for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
          const val = board[r][c];
          if (val) {
            drawBeveledBlock(ctx, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, TETRIMINO_COLORS[val]);
          }
        }
      }

      // Active & Ghost Piece Smooth Motion
      if (currentPiece) {
        // Smooth lerp interpolation
        smoothXRef.current += (currentX - smoothXRef.current) * 0.42;
        smoothYRef.current += (currentY - smoothYRef.current) * 0.46;

        const ghostY = getGhostY(board, currentPiece.cells, currentX, currentY);

        // Draw Pulsing Neon Ghost Piece
        const ghostPulse = 0.25 + Math.sin(time * 4) * 0.08;
        ctx.strokeStyle = currentPiece.color;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = `${currentPiece.color}18`;

        for (let r = 0; r < currentPiece.cells.length; r++) {
          for (let c = 0; c < currentPiece.cells[r].length; c++) {
            if (!currentPiece.cells[r][c]) continue;
            const gx = (currentX + c) * CELL_SIZE;
            const gy = (ghostY + r) * CELL_SIZE;
            if (gy >= 0 && gy < height) {
              ctx.globalAlpha = ghostPulse;
              ctx.fillRect(gx + 1, gy + 1, CELL_SIZE - 2, CELL_SIZE - 2);
              ctx.strokeRect(gx + 1.5, gy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
            }
          }
        }
        ctx.globalAlpha = 1;

        // Draw Smooth-Moving Active Piece
        for (let r = 0; r < currentPiece.cells.length; r++) {
          for (let c = 0; c < currentPiece.cells[r].length; c++) {
            if (!currentPiece.cells[r][c]) continue;
            const px = (smoothXRef.current + c) * CELL_SIZE;
            const py = (smoothYRef.current + r) * CELL_SIZE;
            if (py >= -CELL_SIZE && py < height) {
              drawBeveledBlock(ctx, px, py, CELL_SIZE, currentPiece.color, 1, true);
            }
          }
        }
      }

      // Line Flash Overlay
      for (let i = lineFlashesRef.current.length - 1; i >= 0; i--) {
        const flash = lineFlashesRef.current[i];
        flash.timer--;
        if (flash.timer <= 0) {
          lineFlashesRef.current.splice(i, 1);
          continue;
        }
        const alpha = flash.timer / 12;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillRect(0, flash.row * CELL_SIZE, width, CELL_SIZE);
        ctx.globalAlpha = 1;
      }

      // Particles (Shrapnel & Sparks)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life--;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.vx *= 0.96;

        const progress = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = progress;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating Score & Combo Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.life--;
        if (ft.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }
        ft.y -= 0.85; // Rise up
        const progress = ft.life / ft.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.5);
        ctx.textAlign = 'center';
        ctx.font = '900 16px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);

        if (ft.subText) {
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#fde047';
          ctx.fillText(ft.subText, ft.x, ft.y + 16);
        }
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [board, currentPiece, currentX, currentY]);

  return (
    <div className="relative rounded-2xl p-1 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl shadow-cyan-950/40">
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * CELL_SIZE}
        height={BOARD_HEIGHT * CELL_SIZE}
        className="block rounded-xl"
        style={{
          width: BOARD_WIDTH * CELL_SIZE,
          height: BOARD_HEIGHT * CELL_SIZE,
        }}
      />
    </div>
  );
};

// Helper: draw polished 3D beveled jewel block
function drawBeveledBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number = 1,
  isActive: boolean = false
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Active piece neon bloom
  if (isActive) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
  }

  // Base fill
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

  // Top and Left lighter bevel highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 1);
  ctx.lineTo(x + size - 1, y + 1);
  ctx.lineTo(x + size - 4, y + 4);
  ctx.lineTo(x + 4, y + 4);
  ctx.lineTo(x + 4, y + size - 4);
  ctx.lineTo(x + 1, y + size - 1);
  ctx.closePath();
  ctx.fill();

  // Bottom and Right deeper shadow bevel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(x + size - 1, y + 1);
  ctx.lineTo(x + size - 1, y + size - 1);
  ctx.lineTo(x + 1, y + size - 1);
  ctx.lineTo(x + 4, y + size - 4);
  ctx.lineTo(x + size - 4, y + size - 4);
  ctx.lineTo(x + size - 4, y + 4);
  ctx.closePath();
  ctx.fill();

  // Inner glossy jewel accent
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(x + 6, y + 6, size - 12, size - 12);

  ctx.restore();
}
