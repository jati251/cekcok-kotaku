import { useRef, useState, useEffect, useCallback } from 'react';
import { GameStatus } from '../types';
import { audioEngine } from '../services/audioEngine';

interface UseDynastyControlsOptions {
  status: GameStatus;
  onTogglePause?: () => void;
  onTriggerAttack: () => void;
  onTriggerCharge: () => void;
  onTriggerMusou: () => void;
  onTriggerDash: () => void;
  getPlayerRotationY?: () => number;
}

export function useDynastyControls({
  status,
  onTogglePause,
  onTriggerAttack,
  onTriggerCharge,
  onTriggerMusou,
  onTriggerDash,
  getPlayerRotationY,
}: UseDynastyControlsOptions) {
  const keysRef = useRef<Record<string, boolean>>({});

  // Developer Tools & God Mode State
  const [godMode, setGodMode] = useState(false);
  const [oneHitKill, setOneHitKill] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  // Camera Orbit & Zoom State
  const cameraYawRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0.18);
  const targetYawRef = useRef<number>(0);
  const targetPitchRef = useRef<number>(0.18);
  const zoomDistRef = useRef<number>(7.2);

  // Drag interaction tracking
  const dragRef = useRef<{
    isDown: boolean;
    button: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    isDragging: boolean;
  }>({
    isDown: false,
    button: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
  });

  const touchDragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const resetCamera = useCallback(() => {
    if (getPlayerRotationY) {
      targetYawRef.current = getPlayerRotationY();
      targetPitchRef.current = 0.18;
    }
  }, [getPlayerRotationY]);

  // Keyboard, Mouse, and Touch Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      if (e.key === 'Escape') {
        e.preventDefault();
        onTogglePause?.();
      } else if (e.key === 'F1' || e.key === '`' || e.key === '~') {
        e.preventDefault();
        setDebugOpen((prev) => !prev);
      } else if (key === 'g') {
        e.preventDefault();
        setGodMode((prev) => {
          const next = !prev;
          audioEngine.playFanfare();
          return next;
        });
      } else if (key === 'h') {
        e.preventDefault();
        setOneHitKill((prev) => !prev);
      } else if (key === 'c') {
        e.preventDefault();
        resetCamera();
      } else if (key === 'j') {
        e.preventDefault();
        onTriggerAttack();
      } else if (key === 'k') {
        e.preventDefault();
        onTriggerCharge();
      } else if (e.key === ' ' || key === 'l') {
        e.preventDefault();
        onTriggerMusou();
      } else if (e.key === 'Shift') {
        e.preventDefault();
        onTriggerDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (status !== GameStatus.PLAYING) return;
      if ((e.target as HTMLElement)?.closest('button')) return;

      dragRef.current = {
        isDown: true,
        button: e.button,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        isDragging: false,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDown) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      if (Math.hypot(e.clientX - dragRef.current.startX, e.clientY - dragRef.current.startY) > 4) {
        dragRef.current.isDragging = true;
      }

      if (dragRef.current.isDragging) {
        targetYawRef.current -= dx * 0.0035;
        targetPitchRef.current = Math.max(-0.05, Math.min(0.52, targetPitchRef.current + dy * 0.002));
      }
    };

    const handleMouseUp = () => {
      if (!dragRef.current.isDown) return;
      const wasDragging = dragRef.current.isDragging;
      const btn = dragRef.current.button;
      dragRef.current.isDown = false;

      if (!wasDragging && status === GameStatus.PLAYING) {
        if (btn === 0) {
          onTriggerAttack();
        } else if (btn === 2) {
          onTriggerCharge();
        } else if (btn === 1) {
          resetCamera();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      zoomDistRef.current = Math.max(6.5, Math.min(22.0, zoomDistRef.current + e.deltaY * 0.012));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (status !== GameStatus.PLAYING) return;
      if (touchDragRef.current !== null) return;
      const touch = e.changedTouches[0];
      if ((e.target as HTMLElement)?.closest('button')) return;
      touchDragRef.current = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchDragRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchDragRef.current.id) {
          const dx = touch.clientX - touchDragRef.current.lastX;
          const dy = touch.clientY - touchDragRef.current.lastY;
          touchDragRef.current.lastX = touch.clientX;
          touchDragRef.current.lastY = touch.clientY;

          targetYawRef.current -= dx * 0.0045;
          targetPitchRef.current = Math.max(-0.05, Math.min(0.52, targetPitchRef.current + dy * 0.0025));
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchDragRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchDragRef.current.id) {
          touchDragRef.current = null;
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, onTogglePause, resetCamera, onTriggerAttack, onTriggerCharge, onTriggerMusou, onTriggerDash]);

  return {
    keysRef,
    cameraYawRef,
    cameraPitchRef,
    targetYawRef,
    targetPitchRef,
    zoomDistRef,
    godMode,
    setGodMode,
    oneHitKill,
    setOneHitKill,
    debugOpen,
    setDebugOpen,
    resetCamera,
  };
}
