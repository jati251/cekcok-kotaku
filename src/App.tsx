import React from 'react';
import { useLauncherStore } from './stores/launcherStore';
import { LauncherHeader, LauncherDashboard, SettingsModal } from './features/launcher';
import { EmpiresAndAlliesGame, CityVilleGame } from './games';

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
      ) : activeTab === 'cityville' ? (
        <CityVilleGame />
      ) : (
        <EmpiresAndAlliesGame />
      )}
    </div>
  );
};

export default App;
