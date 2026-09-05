// CityVille Retro Root Container

import React from 'react';
import { CityCanvas } from './city-builder/components/CityCanvas';
import { CityBuildMenu } from './city-builder/components/CityBuildMenu';
import { CropSeedModal } from './city-builder/components/CropSeedModal';
import { CityResourceHUD } from './economy/components/CityResourceHUD';
import { FreightModal } from './economy/components/FreightModal';
import { CityQuestHUD } from './quests/components/CityQuestHUD';
import { CityNewspaper } from './components/CityNewspaper';

export const CityVilleGame: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-neutral-950 text-neutral-100 overflow-hidden select-none font-arcade">
      {/* Top Retro Resource HUD & Controls */}
      <CityResourceHUD />

      {/* Main 60fps Isometric City Viewport with Atmosphere & Floating Text */}
      <CityCanvas />

      {/* Quest Tracker & Mayor Briefings */}
      <CityQuestHUD />

      {/* Bottom Newspaper Ticker & Vintage Dispatch Modal */}
      <CityNewspaper />

      {/* Modals & Overlays */}
      <CityBuildMenu />
      <CropSeedModal />
      <FreightModal />
    </div>
  );
};

export default CityVilleGame;
