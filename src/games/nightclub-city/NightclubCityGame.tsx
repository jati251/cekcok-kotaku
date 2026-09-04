import React, { useRef, useEffect, useCallback } from 'react';
import {
  GlassWater,
  Disc3,
  ShoppingBag,
  ShieldAlert,
  Users,
  Trophy,
  Volume2,
  Coins,
  Gem,
  Flame,
  Star,
} from 'lucide-react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { useLauncherStore } from '@/stores/launcherStore';
import { useNightclubStore } from './store/useNightclubStore';
import { nightclubRenderer } from './renderer';
import { nightclubAudio } from './audio';
import { FURNITURE } from './data/furniture';

// Modals
import { BarDrinkModal } from './modals/BarDrinkModal';
import { FurnitureShopModal } from './modals/FurnitureShopModal';
import { DJBoothModal } from './modals/DJBoothModal';
import { BouncerRopeModal } from './modals/BouncerRopeModal';
import { StaffModal } from './modals/StaffModal';
import { QuestsModal } from './modals/QuestsModal';

export const NightclubCityGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isMuted, sfxVolume } = useLauncherStore();

  const {
    clubName,
    level,
    xp,
    maxXp,
    cash,
    luxeCash,
    hype,
    starRating,
    capacity,
    floorSize,
    placedFurniture,
    activeBars,
    guests,
    isBeatActive,
    activeModal,
    openModal,
    toggleMusicBeat,
    tickSimulation,
    collectBarDrinkRevenue,
    collectTip,
  } = useNightclubStore();

  // Sync audio with launcher store
  useEffect(() => {
    nightclubAudio.setMuted(isMuted);
    nightclubAudio.setVolume(sfxVolume);
  }, [isMuted, sfxVolume]);

  // Simulation tick loop (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      tickSimulation();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickSimulation]);

  // Canvas animation render loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      nightclubRenderer.render(
        ctx,
        canvas.width,
        canvas.height,
        placedFurniture,
        activeBars,
        guests,
        floorSize
      );
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [placedFurniture, activeBars, guests, floorSize]);

  // Canvas Click Interaction: Tap bars to mix/collect, tap guests to collect tips
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const tileSize = Math.min(canvas.width / (floorSize + 4), canvas.height / (floorSize + 3));
      const offsetX = (canvas.width - floorSize * tileSize) / 2;
      const offsetY = (canvas.height - floorSize * tileSize) / 2 + 10;

      // 1. Check click on Guests (tip collection)
      for (const g of guests) {
        if (g.tipReady) {
          const gx = offsetX + g.x * tileSize + tileSize / 2;
          const gy = offsetY + g.y * tileSize + tileSize / 2;
          const dist = Math.hypot(clickX - gx, clickY - gy);
          if (dist < 28) {
            collectTip(g.id);
            return;
          }
        }
      }

      // 2. Check click on Bar stations
      for (const p of placedFurniture) {
        const item = FURNITURE.find((f) => f.id === p.furnitureId);
        if (item?.category === 'bar') {
          const bx = offsetX + p.gridX * tileSize;
          const by = offsetY + p.gridY * tileSize;
          const bw = item.width * tileSize;
          const bh = item.height * tileSize;

          if (clickX >= bx && clickX <= bx + bw && clickY >= by - 20 && clickY <= by + bh) {
            const station = activeBars[p.instanceId];
            if (station?.isReady) {
              collectBarDrinkRevenue(p.instanceId);
            } else {
              openModal('bar_menu', p.instanceId);
            }
            return;
          }
        }
      }

      // 3. Check click on DJ Booth
      for (const p of placedFurniture) {
        const item = FURNITURE.find((f) => f.id === p.furnitureId);
        if (item?.category === 'dj_booth') {
          const dx = offsetX + p.gridX * tileSize;
          const dy = offsetY + p.gridY * tileSize;
          const dw = item.width * tileSize;
          const dh = item.height * tileSize;

          if (clickX >= dx && clickX <= dx + dw && clickY >= dy && clickY <= dy + dh) {
            openModal('dj_booth');
            return;
          }
        }
      }
    },
    [
      floorSize,
      guests,
      placedFurniture,
      activeBars,
      collectTip,
      collectBarDrinkRevenue,
      openModal,
    ]
  );

  const renderActiveModal = () => {
    switch (activeModal) {
      case 'bar_menu':
        return <BarDrinkModal />;
      case 'shop_furniture':
        return <FurnitureShopModal />;
      case 'dj_booth':
        return <DJBoothModal />;
      case 'bouncer_rope':
        return <BouncerRopeModal />;
      case 'staff':
        return <StaffModal />;
      case 'quests':
        return <QuestsModal />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-[#050308] text-white overflow-hidden select-none">
      {/* Platform Arcade Header */}
      <ArcadeHeader title="Nightclub City" category="Social Club Tycoon" />

      {/* Pulsating Hot Magenta & Cyan Laser Neon Border Line */}
      <div className="w-full h-1 bg-gradient-to-r from-fuchsia-600 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(217,70,239,0.8)]" />

      {/* Top Club VIP Telemetry Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#0b0712]/95 backdrop-blur-lg border-b border-fuchsia-950/80 shadow-2xl z-20">
        {/* Club Profile & Level */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-950 border border-fuchsia-400/60 flex items-center justify-center text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.4)]">
            <Disc3 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase text-white tracking-widest font-sans drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                {clubName}
              </span>
              <div className="flex items-center text-amber-400">
                {Array.from({ length: starRating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
            </div>

            {/* Level & XP Progress Bar */}
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="font-bold text-fuchsia-400 font-mono">Lv.{level}</span>
              <div className="w-36 h-2 bg-black rounded-full border border-fuchsia-900/60 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-[0_0_8px_rgba(217,70,239,0.7)]"
                />
              </div>
              <span className="text-[10px] font-mono text-fuchsia-300/80">
                {xp} / {maxXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Club Buzz / Hype & Capacity */}
        <div className="flex items-center gap-5">
          {/* Hype Meter with Equalizer Animation */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-400 tracking-wider mb-0.5">
              <Flame className="w-3.5 h-3.5 fill-current text-orange-500 animate-pulse" />
              <span>CLUB HYPE</span>
              {/* Animated VU Equalizer bars */}
              <div className="flex items-end gap-0.5 h-2.5 ml-1">
                <span className="w-1 bg-cyan-400 rounded-sm animate-pulse h-full" />
                <span className="w-1 bg-fuchsia-500 rounded-sm animate-bounce h-2/3" />
                <span className="w-1 bg-amber-400 rounded-sm animate-pulse h-4/5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 h-3 bg-black rounded-full border border-fuchsia-900/60 overflow-hidden p-0.5">
                <div
                  style={{ width: `${hype}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                />
              </div>
              <span className="text-xs font-mono font-bold text-white">{hype}%</span>
            </div>
          </div>

          {/* Guest Capacity */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 rounded-lg border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>
              {guests.length} / {capacity} Guests
            </span>
          </div>

          {/* Currencies */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 rounded-lg border border-amber-500/40 text-amber-400 font-mono font-bold text-xs shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>${cash.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 rounded-lg border border-fuchsia-500/40 text-fuchsia-300 font-mono font-bold text-xs shadow-inner">
            <Gem className="w-4 h-4 text-fuchsia-400" />
            <span>{luxeCash} Luxe</span>
          </div>
        </div>
      </div>

      {/* Main Isometric Club Canvas Viewport */}
      <div className="relative flex-1 w-full overflow-hidden bg-black flex flex-col justify-center items-center">
        <canvas
          ref={canvasRef}
          width={960}
          height={520}
          onClick={handleCanvasClick}
          className="w-full h-full max-h-[72vh] object-contain cursor-pointer"
        />
      </div>

      {/* Bottom Command Dock Bar: Glossy DJ Controller Launchpads */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#08040d]/95 backdrop-blur-xl border-t border-fuchsia-950/80 shadow-2xl z-20">
        {/* Left: Club Operations Launchpads */}
        <div className="flex items-center gap-2.5 overflow-x-auto">
          {/* Cocktail Bar Mixing */}
          <button
            onClick={() => openModal('bar_menu')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 font-black text-xs uppercase tracking-wider text-white shadow-[0_0_12px_rgba(245,158,11,0.3)] border border-amber-400/60 transition active:scale-95 cursor-pointer"
          >
            <GlassWater className="w-4 h-4" />
            <span>Mix Drinks</span>
          </button>

          {/* DJ Music Booth */}
          <button
            onClick={() => openModal('dj_booth')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 font-black text-xs uppercase tracking-wider text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] border border-cyan-400/60 transition active:scale-95 cursor-pointer"
          >
            <Disc3 className="w-4 h-4" />
            <span>DJ Booth</span>
          </button>

          {/* Decorate Catalog */}
          <button
            onClick={() => openModal('shop_furniture')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-500 hover:to-fuchsia-600 font-black text-xs uppercase tracking-wider text-white shadow-[0_0_12px_rgba(217,70,239,0.3)] border border-fuchsia-400/60 transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Decorate</span>
          </button>

          {/* Bouncer Door Velvet Rope */}
          <button
            onClick={() => openModal('bouncer_rope')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-purple-700 to-purple-850 hover:from-purple-600 hover:to-purple-750 font-black text-xs uppercase tracking-wider text-white shadow-[0_0_12px_rgba(147,51,234,0.3)] border border-purple-400/60 transition active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Velvet Rope</span>
          </button>

          {/* Staff Roster */}
          <button
            onClick={() => openModal('staff')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#140c1e] hover:bg-[#1e132c] font-black text-xs uppercase tracking-wider text-fuchsia-200 hover:text-white border border-fuchsia-900/60 shadow transition active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Staff</span>
          </button>

          {/* Quests */}
          <button
            onClick={() => openModal('quests')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#140c1e] hover:bg-[#1e132c] font-black text-xs uppercase tracking-wider text-fuchsia-200 hover:text-white border border-fuchsia-900/60 shadow transition active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Milestones</span>
          </button>
        </div>

        {/* Right: Electronic Beat Sequencer Audio Toggle */}
        <div>
          <button
            onClick={toggleMusicBeat}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg border ${
              isBeatActive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse'
                : 'bg-[#140c1e] hover:bg-[#1e132c] text-slate-400 hover:text-white border-fuchsia-950'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isBeatActive ? 'Club Beat: ON' : 'Club Beat: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {renderActiveModal()}
    </div>
  );
};

export default NightclubCityGame;
