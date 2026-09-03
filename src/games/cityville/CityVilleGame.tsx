// CityVille Retro Root Container

import React from 'react';
import { CityCanvas } from './city-builder/components/CityCanvas';
import { CityBuildMenu } from './city-builder/components/CityBuildMenu';
import { CropSeedModal } from './city-builder/components/CropSeedModal';
import { CityResourceHUD } from './economy/components/CityResourceHUD';
import { FreightModal } from './economy/components/FreightModal';
import { CityQuestHUD } from './quests/components/CityQuestHUD';

export const CityVilleGame: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Resource HUD */}
      <CityResourceHUD />

      {/* Main 60fps Isometric City Viewport */}
      <CityCanvas />

      {/* Quest Tracker & Mayor Briefings */}
      <CityQuestHUD />

      {/* Modals & Overlays */}
      <CityBuildMenu />
      <CropSeedModal />
      <FreightModal />
    </div>
  );
};

export default CityVilleGame;
