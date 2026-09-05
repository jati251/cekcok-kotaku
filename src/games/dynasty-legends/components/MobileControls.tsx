import React, { useRef, useState } from 'react';
import { MobileInputState, Vector2 } from '../types';
import { Sword, Zap, Flame, Wind } from 'lucide-react';

interface MobileControlsProps {
  inputRef: React.MutableRefObject<MobileInputState>;
  isMusouReady: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputRef, isMusouReady }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState<Vector2>({ x: 0, y: 0 });
  const [isJoysticking, setIsJoysticking] = useState(false);

  const joystickTouchId = useRef<number | null>(null);
  const startPos = useRef<Vector2>({ x: 0, y: 0 });

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      startPos.current = { x: centerX, y: centerY };
      updateJoystick(touch.clientX, touch.clientY);
    }
    setIsJoysticking(true);
    if (inputRef.current) inputRef.current.active = true;
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (joystickTouchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setJoystickPos({ x: 0, y: 0 });
        setIsJoysticking(false);
        if (inputRef.current) {
          inputRef.current.moveVector = { x: 0, y: 0 };
          inputRef.current.active = false;
        }
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const maxRadius = 40;
    let dx = clientX - startPos.current.x;
    let dy = clientY - startPos.current.y;

    const distance = Math.hypot(dx, dy);
    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      dx *= ratio;
      dy *= ratio;
    }

    setJoystickPos({ x: dx, y: dy });

    if (inputRef.current) {
      const normX = dx / maxRadius;
      const normY = dy / maxRadius;
      const deadzone = 0.2;
      const mag = Math.hypot(normX, normY);
      if (mag < deadzone) {
        inputRef.current.moveVector = { x: 0, y: 0 };
      } else {
        inputRef.current.moveVector = { x: normX, y: normY };
        inputRef.current.active = true;
      }
    }
  };

  const handleAttackStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.isAttacking = true;
      inputRef.current.active = true;
    }
  };
  const handleAttackEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) inputRef.current.isAttacking = false;
  };

  const handleChargeStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.isCharge = true;
      inputRef.current.active = true;
    }
  };
  const handleChargeEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) inputRef.current.isCharge = false;
  };

  const handleMusouStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.isMusou = true;
      inputRef.current.active = true;
    }
  };
  const handleMusouEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) inputRef.current.isMusou = false;
  };

  const handleDashStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.isDashing = true;
      inputRef.current.active = true;
    }
  };
  const handleDashEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (inputRef.current) inputRef.current.isDashing = false;
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden touch-none select-none md:hidden">
      {/* Joystick Zone - Bottom Left */}
      <div
        className="absolute bottom-8 left-8 w-40 h-40 pointer-events-auto flex items-center justify-center bg-black/30 rounded-full border border-white/15 backdrop-blur-[2px]"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
        ref={joystickRef}
      >
        <div
          className={`w-24 h-24 rounded-full border-2 ${
            isJoysticking ? 'border-white/60 bg-white/15' : 'border-white/25 bg-black/30'
          } transition-colors relative`}
        >
          <div
            className="absolute w-10 h-10 bg-amber-400/90 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            }}
          />
        </div>
      </div>

      {/* Action Buttons Zone - Bottom Right */}
      <div className="absolute bottom-8 right-8 flex items-end gap-3 pointer-events-auto">
        {/* Dash Button */}
        <button
          className="w-14 h-14 rounded-full border-2 border-slate-400 bg-slate-800/70 flex items-center justify-center active:scale-90 transition-all shadow-lg"
          onTouchStart={handleDashStart}
          onTouchEnd={handleDashEnd}
          onTouchCancel={handleDashEnd}
          title="Dash"
        >
          <Wind size={22} className="text-slate-200" />
        </button>

        {/* Musou Ultimate Button */}
        <button
          className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
            isMusouReady
              ? 'border-yellow-400 bg-yellow-500/40 animate-pulse shadow-[0_0_25px_rgba(250,204,21,0.6)]'
              : 'border-zinc-600 bg-zinc-900/60 opacity-40'
          }`}
          onTouchStart={handleMusouStart}
          onTouchEnd={handleMusouEnd}
          onTouchCancel={handleMusouEnd}
          title="Musou"
        >
          <Zap
            size={28}
            className={isMusouReady ? 'text-yellow-400 fill-current' : 'text-zinc-500'}
          />
        </button>

        {/* Charge Heavy Finisher Button */}
        <button
          className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-600/40 flex items-center justify-center active:scale-90 transition-all shadow-lg"
          onTouchStart={handleChargeStart}
          onTouchEnd={handleChargeEnd}
          onTouchCancel={handleChargeEnd}
          title="Charge Finisher"
        >
          <Flame size={28} className="text-amber-300" />
        </button>

        {/* Normal Light Attack Button */}
        <button
          className="w-20 h-20 rounded-full border-2 border-rose-500 bg-rose-600/50 flex items-center justify-center active:scale-95 transition-all shadow-xl"
          onTouchStart={handleAttackStart}
          onTouchEnd={handleAttackEnd}
          onTouchCancel={handleAttackEnd}
          title="Normal Attack"
        >
          <Sword size={34} className="text-white fill-current" />
        </button>
      </div>
    </div>
  );
};
