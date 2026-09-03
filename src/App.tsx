import React from 'react';
import { useLauncherStore } from './stores/launcherStore';
import { LauncherHeader, LauncherDashboard, SettingsModal } from './features/launcher';
import { IsometricCanvas, BuildMenu, BuildingInspector } from './features/city-builder';
import { ResourceHUD } from './features/economy';
import { QuestTrackerHUD, DialogueModal } from './features/quests';
import { CombatModal } from './features/combat';

export const App: React.FC = () => {
  const { activeTab } = useLauncherStore();

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans">
      {activeTab === 'launcher' ? (
        <div className="flex flex-col w-full h-full">
          <LauncherHeader />
          <LauncherDashboard />
          <SettingsModal />
        </div>
      ) : (
        <div className="relative w-full h-full">
          {/* Top Economy HUD */}
          <ResourceHUD />

          {/* Main 60fps Isometric Canvas Viewport */}
          <IsometricCanvas />

          {/* Overlays & Modals */}
          <BuildMenu />
          <BuildingInspector />
          <QuestTrackerHUD />
          <DialogueModal />
          <CombatModal />
          <SettingsModal />
        </div>
      )}
    </div>
  );
};

export default App;
