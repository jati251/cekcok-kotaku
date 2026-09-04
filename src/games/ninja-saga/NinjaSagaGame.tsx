import React, { useState, useEffect } from 'react';
import { Flame, Droplets, Mountain, Wind, Zap, UserPlus, Play } from 'lucide-react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { useLauncherStore } from '@/stores/launcherStore';
import { useNinjaSagaStore } from './store/useNinjaSagaStore';
import { NinjaElement } from './types';
import { ninjaAudio } from './audio';

// Views
import { VillageView } from './village/VillageView';
import { BattleView } from './battle/BattleView';

// Modals
import { KageRoomModal } from './village/modals/KageRoomModal';
import { AcademyModal } from './village/modals/AcademyModal';
import { ShopModal } from './village/modals/ShopModal';
import { BlacksmithModal } from './village/modals/BlacksmithModal';
import { HuntingHouseModal } from './village/modals/HuntingHouseModal';
import { ArenaModal } from './village/modals/ArenaModal';
import { PetModal } from './village/modals/PetModal';
import { CharacterModal } from './village/modals/CharacterModal';

export const NinjaSagaGame: React.FC = () => {
  const { isMuted, sfxVolume } = useLauncherStore();
  const { character, createCharacter, activeModal, activeBattle } = useNinjaSagaStore();

  // Character creation local form state
  const [ninjaName, setNinjaName] = useState('Shinobi Ren');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedElement, setSelectedElement] = useState<NinjaElement>('fire');

  // Sync audio settings
  useEffect(() => {
    ninjaAudio.setMuted(isMuted);
    ninjaAudio.setVolume(sfxVolume);
  }, [isMuted, sfxVolume]);

  const handleStartJourney = (e: React.FormEvent) => {
    e.preventDefault();
    createCharacter(ninjaName, selectedGender, selectedElement);
  };

  const renderActiveModal = () => {
    switch (activeModal) {
      case 'kage_room':
        return <KageRoomModal />;
      case 'academy':
        return <AcademyModal />;
      case 'shop':
        return <ShopModal />;
      case 'blacksmith':
        return <BlacksmithModal />;
      case 'hunting_house':
        return <HuntingHouseModal />;
      case 'arena':
        return <ArenaModal />;
      case 'pet_house':
        return <PetModal />;
      case 'character':
        return <CharacterModal />;
      default:
        return null;
    }
  };

  // 1. Character Creation Flow
  if (!character) {
    return (
      <div className="relative flex flex-col w-full h-full bg-slate-950 text-white overflow-hidden select-none">
        <ArcadeHeader title="Ninja Saga" category="Shinobi RPG" />

        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40">
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-white">
                  Ninja Saga
                </h1>
                <p className="text-xs text-slate-400">
                  Create your shinobi avatar and choose your primary elemental chakra nature
                </p>
              </div>
            </div>

            <form onSubmit={handleStartJourney} className="mt-6 space-y-6">
              {/* Ninja Name */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
                  Shinobi Name
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={ninjaName}
                  onChange={(e) => setNinjaName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:border-amber-500 focus:outline-hidden transition"
                  placeholder="Enter ninja name..."
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGender(g)}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                        selectedGender === g
                          ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Elemental Chakra Nature */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
                  Primary Elemental Affinity
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'fire', label: 'Fire', icon: <Flame className="w-4 h-4 text-orange-400" />, desc: 'High Burst' },
                      { id: 'water', label: 'Water', icon: <Droplets className="w-4 h-4 text-sky-400" />, desc: 'Heal & CP' },
                      { id: 'earth', label: 'Earth', icon: <Mountain className="w-4 h-4 text-lime-400" />, desc: 'Shield & Stun' },
                      { id: 'wind', label: 'Wind', icon: <Wind className="w-4 h-4 text-emerald-400" />, desc: 'Evasion & Bleed' },
                      { id: 'lightning', label: 'Lightning', icon: <Zap className="w-4 h-4 text-yellow-400" />, desc: 'High Crit' },
                    ] as const
                  ).map((el) => (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => setSelectedElement(el.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition cursor-pointer ${
                        selectedElement === el.id
                          ? 'bg-slate-800 border-amber-500 text-white shadow-lg'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="mb-1">{el.icon}</div>
                      <span className="text-[11px] font-bold">{el.label}</span>
                      <span className="text-[9px] text-slate-500">{el.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-sm uppercase tracking-wider shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Ninja Journey</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Game Screen: Battle or Village
  return (
    <div className="relative flex flex-col w-full h-full bg-slate-950 text-white overflow-hidden select-none">
      <ArcadeHeader title="Ninja Saga" category="Shinobi RPG" />

      {/* Renders Battle View if in combat, otherwise Village Hub */}
      {activeBattle ? <BattleView /> : <VillageView />}

      {/* Render Active Village Modal if any */}
      {!activeBattle && renderActiveModal()}
    </div>
  );
};

export default NinjaSagaGame;
