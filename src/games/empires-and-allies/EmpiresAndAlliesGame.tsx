// Empires & Allies Game Module Container

import React from 'react';
import {
  IsometricCanvas,
  BuildMenu,
  BuildingInspector,
  WildernessInspector,
  RecruitmentModal,
} from './city-builder';
import { ResourceHUD, WarRoomModal } from './economy';
import { QuestTrackerHUD, DialogueModal } from './quests';
import { CombatModal, CampaignMapModal } from './combat';
import { AllyBar, VisitingAllyBanner } from './allies';

export const EmpiresAndAlliesGame: React.FC = () => {
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Top Economy HUD */}
      <ResourceHUD />

      {/* Visiting Ally Top Banner */}
      <VisitingAllyBanner />

      {/* Main 60fps Isometric Canvas Viewport */}
      <IsometricCanvas />

      {/* Bottom Ally Friends Dock */}
      <AllyBar />

      {/* Overlays & Modals */}
      <BuildMenu />
      <BuildingInspector />
      <WildernessInspector />
      <RecruitmentModal />
      <QuestTrackerHUD />
      <DialogueModal />
      <CampaignMapModal />
      <CombatModal />
      <WarRoomModal />
    </div>
  );
};

export default EmpiresAndAlliesGame;
