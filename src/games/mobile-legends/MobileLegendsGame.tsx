import React from 'react';
import { useMobaStore } from './stores/mobaStore';
import { HeroSelectModal } from './components/ui/HeroSelectModal';
import { MobaCanvas } from './components/3d/MobaCanvas';
import { MobaHUD } from './components/ui/MobaHUD';
import { ItemShopModal } from './components/ui/ItemShopModal';
import { ScoreboardModal } from './components/ui/ScoreboardModal';
import { GameOverModal } from './components/ui/GameOverModal';

export const MobileLegendsGame: React.FC = () => {
  const matchState = useMobaStore((state) => state.matchState);

  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. Hero Selection Lobby */}
      {matchState === 'hero_select' && <HeroSelectModal />}

      {/* 2. 3D Battlefield & Canvas */}
      {(matchState === 'battle' || matchState === 'victory' || matchState === 'defeat') && (
        <>
          <MobaCanvas />
          <MobaHUD />
          <ItemShopModal />
          <ScoreboardModal />
        </>
      )}

      {/* 3. Victory / Defeat Screen */}
      {(matchState === 'victory' || matchState === 'defeat') && <GameOverModal />}
    </div>
  );
};

export default MobileLegendsGame;
