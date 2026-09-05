// CekcokVille 2000 Retro Root Container
// Pure Unblurred Bottom Command Dock & Grounded 60fps Viewport

import React from 'react';
import { CityCanvas } from './city-builder/components/CityCanvas';
import { CityResourceHUD } from './economy/components/CityResourceHUD';
import { CityQuestHUD } from './quests/components/CityQuestHUD';
import { CityBottomDock } from './components/CityBottomDock';

export const CityVilleGame: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-neutral-950 text-neutral-100 overflow-hidden select-none font-arcade">
      {/* Top Retro Resource HUD & Controls */}
      <CityResourceHUD />

      {/* Main 60fps Isometric City Viewport with Grounded Architecture & Connected Roads */}
      <CityCanvas />

      {/* Quest Tracker & Unblurred Mayor Dialogue Box */}
      <CityQuestHUD />

      {/* Retro Bottom Command Dock (Unblurred Shelves for Build, Seeds, Freight & Gazette) */}
      <CityBottomDock />
    </div>
  );
};

export default CityVilleGame;
