import React from 'react';
import { Feather, X } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { PETS } from '../../data/pets';

export const PetModal: React.FC = () => {
  const { closeModal, character, setActivePet, adoptPet } = useNinjaSagaStore();

  if (!character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Companion Pet Sanctuary
              </h2>
              <p className="text-xs text-slate-400">
                Bond with ninja pets that provide passive stat boosts and active battle skills
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pet List */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {PETS.map((pet) => {
            const isOwned = character.ownedPets.some((p) => p.id === pet.id);
            const isActive = character.activePet?.id === pet.id;
            const canAdopt = character.tokens >= 15;

            return (
              <div
                key={pet.id}
                className={`flex flex-col justify-between p-5 rounded-3xl border transition shadow-lg ${
                  isActive
                    ? 'bg-teal-950/40 border-teal-500/60 shadow-teal-950/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-white">{pet.name}</h3>
                    {isActive && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500 text-slate-950">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-teal-400 mb-1">
                    Skill: {pet.skillName}
                  </div>
                  <p className="text-[11px] text-slate-300 mb-3">{pet.skillDescription}</p>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mb-4">
                    {pet.bonusStats.attack && <span>+ATK {pet.bonusStats.attack}</span>}
                    {pet.bonusStats.agility && <span>+AGI {pet.bonusStats.agility}</span>}
                    {pet.bonusStats.critRate && <span>+CRIT {pet.bonusStats.critRate}%</span>}
                    {pet.bonusStats.dodgeRate && <span>+DODGE {pet.bonusStats.dodgeRate}%</span>}
                  </div>
                </div>

                {isOwned ? (
                  <button
                    onClick={() => setActivePet(isActive ? null : pet)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                    }`}
                  >
                    {isActive ? 'Unequip' : 'Equip as Companion'}
                  </button>
                ) : (
                  <button
                    onClick={() => adoptPet(pet)}
                    disabled={!canAdopt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 font-black text-xs uppercase tracking-wider text-white shadow-md transition cursor-pointer"
                  >
                    Adopt (15 Tokens)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
