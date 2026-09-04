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
    <div className="relative flex flex-col w-full h-full bg-slate-950 text-white overflow-hidden select-none">
      {/* Platform Arcade Header */}
      <ArcadeHeader title="Nightclub City" category="Social Club Tycoon" />

      {/* Top Club Telemetry Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl z-20">
        {/* Club Profile & Level */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-purple-950 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-400 shadow-inner">
            <Disc3 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase text-white tracking-wide">
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
              <span className="font-bold text-amber-400">Lv.{level}</span>
              <div className="w-36 h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {xp} / {maxXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Club Buzz / Hype & Capacity */}
        <div className="flex items-center gap-5">
          {/* Hype Meter */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 tracking-wider mb-0.5">
              <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
              <span>Club Hype</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
                <div
                  style={{ width: `${hype}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 transition-all duration-300"
                />
              </div>
              <span className="text-xs font-mono font-bold text-white">{hype}%</span>
            </div>
          </div>

          {/* Guest Capacity */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              {guests.length} / {capacity} Guests
            </span>
          </div>

          {/* Currencies */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-amber-400 font-mono font-bold text-xs shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>${cash.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-amber-300 font-mono font-bold text-xs shadow-inner">
            <Gem className="w-4 h-4 text-fuchsia-400" />
            <span>{luxeCash} Luxe</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Club Floor Canvas */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={520}
          onClick={handleCanvasClick}
          className="w-full h-full max-h-[72vh] object-contain cursor-pointer"
        />
      </div>

      {/* Bottom Command Navigation Dock */}
      <div className="h-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between px-8 z-20">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Mix Drinks */}
          <button
            onClick={() => openModal('bar_menu')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 font-black text-xs uppercase tracking-wider text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <GlassWater className="w-4 h-4" />
            <span>Mix Drinks</span>
          </button>

          {/* DJ Music Booth */}
          <button
            onClick={() => openModal('dj_booth')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 font-black text-xs uppercase tracking-wider text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Disc3 className="w-4 h-4" />
            <span>DJ Booth</span>
          </button>

          {/* Decorate Catalog */}
          <button
            onClick={() => openModal('shop_furniture')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 font-black text-xs uppercase tracking-wider text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Decorate</span>
          </button>

          {/* Bouncer Door Velvet Rope */}
          <button
            onClick={() => openModal('bouncer_rope')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs uppercase tracking-wider text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Velvet Rope</span>
          </button>

          {/* Staff Roster */}
          <button
            onClick={() => openModal('staff')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-black text-xs uppercase tracking-wider text-slate-200 hover:text-white shadow-md transition active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Staff</span>
          </button>

          {/* Quests */}
          <button
            onClick={() => openModal('quests')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-black text-xs uppercase tracking-wider text-slate-200 hover:text-white shadow-md transition active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Quests</span>
          </button>
        </div>

        {/* Right: Electronic Beat Sequencer Audio Toggle */}
        <div>
          <button
            onClick={toggleMusicBeat}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg ${
              isBeatActive
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isBeatActive ? 'Club Beat: PLAYING' : 'Club Beat: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {renderActiveModal()}
    </div>
  );
};

export default NightclubCityGame;
