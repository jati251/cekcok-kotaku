import React from 'react';
import { Volume2, VolumeX, Grid, Save, RotateCcw, Shield } from 'lucide-react';
import { useLauncherStore } from "@/stores/launcherStore";
import { useCityStore, useEconomyStore, useQuestStore } from '@/games/empires-and-allies';
import { tauriBridge } from '@/services/tauriBridge';
import { Modal } from '@/components/ui/Modal';
import { Button } from "@/components/ui/Button";
import type { PlacedBuilding, Quest } from '@/types';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    closeSettings,
    sfxVolume,
    setSfxVolume,
    isMuted,
    toggleMute,
    showGridLines,
    toggleGridLines,
  } = useLauncherStore();

  const handleSaveGame = async () => {
    const city = useCityStore.getState();
    const economy = useEconomyStore.getState();
    const quests = useQuestStore.getState();

    const serializedState = {
      player: {
        commander_name: 'Commander Jati',
        rank_title: 'Brigadier General',
        avatar_id: 'commander_1',
      },
      resources: {
        coins: economy.coins,
        wood: economy.wood,
        oil: economy.oil,
        energy: economy.energy,
        max_energy: economy.maxEnergy,
        honor: economy.honor,
        xp: economy.xp,
        level: economy.level,
      },
      buildings: city.buildings.map((b: PlacedBuilding) => ({
        id: b.id,
        building_type: b.buildingTypeId,
        grid_x: b.gridX,
        grid_y: b.gridY,
        level: b.level,
        constructed_at: b.constructedAt,
        is_completed: b.isCompleted,
        last_harvest_at: b.lastHarvestAt,
      })),
      quests: quests.quests.map((q: Quest) => ({
        quest_id: q.id,
        current_count: q.currentCount,
        target_count: q.targetCount,
        is_completed: q.isCompleted,
      })),
      settings: {
        sfx_volume: sfxVolume,
        music_volume: 0.6,
        show_grid: showGridLines,
        zoom_level: 1.0,
      },
      last_saved_at: Math.floor(Date.now() / 1000),
      version: 1,
    };

    await tauriBridge.saveGame(serializedState);
    alert('Game save successfully synchronized to disk!');
  };

  const handleResetSave = async () => {
    if (confirm('Are you sure you want to reset your local save file and start fresh?')) {
      await tauriBridge.resetSave();
      window.location.reload();
    }
  };

  return (
    <Modal
      isOpen={isSettingsOpen}
      onClose={closeSettings}
      title="Launcher & Game Settings"
      subtitle="Configure audio, visual grid, and local persistence"
      icon={<Shield className="w-5 h-5" />}
    >
      <div className="space-y-6">
        {/* Audio Volume Slider */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-blue-400" />
              )}
              <span className="text-sm font-bold text-slate-200">Sound Effects Volume</span>
            </div>
            <button
              onClick={toggleMute}
              className={`text-xs px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isMuted ? 'Muted' : 'Mute'}
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0%</span>
            <span>{Math.round(sfxVolume * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Visual Settings */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Grid className="w-5 h-5 text-emerald-400" />
            <div>
              <h5 className="text-sm font-bold text-slate-200">Isometric Grid Overlay</h5>
              <p className="text-xs text-slate-400">Display diamond tile grid lines on the island</p>
            </div>
          </div>
          <button
            onClick={toggleGridLines}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              showGridLines
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showGridLines ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Persistence Actions */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Save File Management
          </h5>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveGame}
              className="flex-1"
            >
              Force Save Now
            </Button>

            <Button
              variant="danger"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleResetSave}
            >
              Reset Save
            </Button>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                closeSettings();
                useLauncherStore.getState().setActiveTab('settings');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>Open Full Station Settings</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
