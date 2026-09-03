
import React, { useRef, useState } from 'react';
import { MobileInputState, Vector2 } from '../types';
import { Sword, Zap } from 'lucide-react';

interface MobileControlsProps {
  inputRef: React.MutableRefObject<MobileInputState>;
  isMusouReady: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputRef, isMusouReady }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState<Vector2>({ x: 0, y: 0 });
  const [isJoysticking, setIsJoysticking] = useState(false);
  
  // Track specific touch ID for joystick to allow multi-touch with buttons
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
        
        // Initial move if they tapped off-center
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
            if (inputRef.current) inputRef.current.moveVector = { x: 0, y: 0 };
            break;
        }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
      const maxRadius = 40; // Max drag distance in pixels
      let dx = clientX - startPos.current.x;
      let dy = clientY - startPos.current.y;
      
      const distance = Math.hypot(dx, dy);
      if (distance > maxRadius) {
          const ratio = maxRadius / distance;
          dx *= ratio;
          dy *= ratio;
      }

      setJoystickPos({ x: dx, y: dy });
      
      // Normalize for game input
      if (inputRef.current) {
          const normX = dx / maxRadius;
          const normY = dy / maxRadius;
          // Apply a small deadzone
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
      e.preventDefault(); // Prevent ghost clicks
      if (inputRef.current) {
          inputRef.current.isAttacking = true;
          inputRef.current.active = true;
      }
  };
  const handleAttackEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      if (inputRef.current) inputRef.current.isAttacking = false;
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

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden touch-none select-none md:hidden">
        
        {/* Joystick Zone - Bottom Left */}
        <div 
            className="absolute bottom-8 left-8 w-40 h-40 pointer-events-auto flex items-center justify-center bg-black/10 rounded-full border border-white/10 backdrop-blur-[2px]"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
            ref={joystickRef}
        >
            {/* Joystick Visuals */}
            <div className={`w-24 h-24 rounded-full border-2 ${isJoysticking ? 'border-white/50 bg-white/10' : 'border-white/20 bg-black/20'} transition-colors relative`}>
                <div 
                    className="absolute w-10 h-10 bg-white/80 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                    style={{ 
                        left: '50%', 
                        top: '50%',
                        transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))` 
                    }}
                />
            </div>
        </div>

        {/* Buttons Zone - Bottom Right */}
        <div className="absolute bottom-8 right-8 flex items-end gap-6 pointer-events-auto">
            
            {/* Musou Button (Smaller) */}
            <button
                className={`w-20 h-20 mb-2 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${isMusouReady ? 'border-yellow-400 bg-yellow-500/30 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-gray-500 bg-gray-900/50 opacity-40'}`}
                onTouchStart={handleMusouStart}
                onTouchEnd={handleMusouEnd}
                onTouchCancel={handleMusouEnd}
            >
                <Zap size={32} className={isMusouReady ? 'text-yellow-400 fill-current' : 'text-gray-400'} />
            </button>

            {/* Attack Button (Larger) */}
            <button
                className="w-24 h-24 rounded-full border-2 border-blue-400 bg-blue-600/40 flex items-center justify-center active:bg-blue-600/60 active:scale-95 transition-all shadow-lg"
                onTouchStart={handleAttackStart}
                onTouchEnd={handleAttackEnd}
                onTouchCancel={handleAttackEnd}
            >
                <Sword size={40} className="text-white fill-current" />
            </button>

        </div>
    </div>
  );
};
