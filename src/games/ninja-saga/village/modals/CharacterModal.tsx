import React, { useState } from 'react';
import { User, X, Plus } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { JUTSUS } from '../../data/jutsus';

export const CharacterModal: React.FC = () => {
  const {
    closeModal,
    character,
    allocateAttributePoint,
    equipItem,
    unequipItem,
    equipJutsuToDeck,
    unequipJutsuFromDeck,
  } = useNinjaSagaStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'equipment' | 'deck'>('stats');

  if (!character) return null;

  const learnedJutsus = JUTSUS.filter((j) => character.learnedJutsuIds.includes(j.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                {character.name} (Lv.{character.level} {character.rank.replace('_', ' ')})
              </h2>
              <p className="text-xs text-slate-400">
                Manage your attribute points, equipped gear, and active battle jutsu deck
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Attributes & Stats
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'equipment'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Equipment Inventory
          </button>
          <button
            onClick={() => setActiveTab('deck')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'deck'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Jutsu Deck ({character.equippedJutsuIds.length}/6)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Attribute Allocation */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Elemental Attributes
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    Points Available: {character.attributePoints}
                  </span>
                </div>

                <div className="space-y-3">
                  {(
                    [
                      { key: 'fire', label: 'Fire', desc: '+Attack & Crit Damage', color: 'text-orange-400' },
                      { key: 'water', label: 'Water', desc: '+Max CP & Healing Power', color: 'text-sky-400' },
                      { key: 'earth', label: 'Earth', desc: '+Max HP & Defense', color: 'text-lime-400' },
                      { key: 'wind', label: 'Wind', desc: '+Agility & Dodge Chance', color: 'text-emerald-400' },
                      { key: 'lightning', label: 'Lightning', desc: '+Critical Strike Rate', color: 'text-yellow-400' },
                    ] as const
                  ).map((attr) => (
                    <div
                      key={attr.key}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase ${attr.color}`}>
                            {attr.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-white">
                            Lv.{character.attributes[attr.key]}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{attr.desc}</span>
                      </div>

                      <button
                        onClick={() => allocateAttributePoint(attr.key)}
                        disabled={character.attributePoints <= 0}
                        className="p-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition active:scale-95 cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combat Summary Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-4">
                    Derived Combat Stats
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">Health Points</span>
                      <strong className="text-emerald-400 text-sm">
                        {300 + character.level * 45 + character.attributes.earth * 25}
                      </strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">Chakra Points</span>
                      <strong className="text-sky-400 text-sm">
                        {180 + character.level * 25 + character.attributes.water * 20}
                      </strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">Base Attack</span>
                      <strong className="text-amber-400 text-sm">
                        {25 + character.level * 7 + character.attributes.fire * 5}
                      </strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">Base Defense</span>
                      <strong className="text-indigo-400 text-sm">
                        {12 + character.level * 4 + character.attributes.earth * 4}
                      </strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">Agility / Speed</span>
                      <strong className="text-teal-400 text-sm">
                        {14 + character.level * 3 + character.attributes.wind * 4}
                      </strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">Crit / Dodge</span>
                      <strong className="text-yellow-400 text-sm">
                        {5 + character.attributes.lightning * 2}% / {3 + character.attributes.wind * 1.5}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
                  Level up by completing missions to gain attribute points and increase your combat rank!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Equipped Weapon */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-2">
                    Weapon Slot
                  </span>
                  {character.equippedWeapon ? (
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {character.equippedWeapon.name}{' '}
                        {character.equippedWeapon.upgradeLevel
                          ? `+${character.equippedWeapon.upgradeLevel}`
                          : ''}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 mb-2">
                        {character.equippedWeapon.description}
                      </p>
                      <div className="text-xs font-mono text-emerald-400">
                        +ATK {character.equippedWeapon.stats?.attack}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No weapon equipped</span>
                  )}
                </div>

                {character.equippedWeapon && (
                  <button
                    onClick={() => unequipItem('weapon')}
                    className="mt-4 w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                  >
                    Unequip
                  </button>
                )}
              </div>

              {/* Equipped Armor */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block mb-2">
                    Armor Slot
                  </span>
                  {character.equippedArmor ? (
                    <div>
                      <h4 className="text-sm font-bold text-white">{character.equippedArmor.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 mb-2">
                        {character.equippedArmor.description}
                      </p>
                      <div className="text-xs font-mono text-indigo-400">
                        +DEF {character.equippedArmor.stats?.defense}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No armor equipped</span>
                  )}
                </div>

                {character.equippedArmor && (
                  <button
                    onClick={() => unequipItem('armor')}
                    className="mt-4 w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                  >
                    Unequip
                  </button>
                )}
              </div>

              {/* Equipped Back Item */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider block mb-2">
                    Back Item Slot
                  </span>
                  {character.equippedBackItem ? (
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {character.equippedBackItem.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 mb-2">
                        {character.equippedBackItem.description}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No back item equipped</span>
                  )}
                </div>

                {character.equippedBackItem && (
                  <button
                    onClick={() => unequipItem('back_item')}
                    className="mt-4 w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                  >
                    Unequip
                  </button>
                )}
              </div>

              {/* Inventory Items List to Equip */}
              <div className="col-span-3 mt-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Bag Equipment
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {character.inventory
                    .filter((inv) =>
                      ['weapon', 'armor', 'back_item'].includes(inv.item.type)
                    )
                    .map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{inv.item.name}</h4>
                            <span className="text-[9px] uppercase px-1.5 rounded bg-slate-900 text-slate-400 font-mono">
                              {inv.item.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {inv.item.description}
                          </p>
                        </div>

                        <button
                          onClick={() => equipItem(inv.item)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer shrink-0 ml-2"
                        >
                          Equip
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deck' && (
            <div>
              {/* Active Deck Slots */}
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider block mb-3">
                Active Battle Deck (6 Slots)
              </span>

              <div className="grid grid-cols-6 gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, slotIdx) => {
                  const jutsuId = character.equippedJutsuIds[slotIdx];
                  const jutsu = JUTSUS.find((j) => j.id === jutsuId);

                  return (
                    <div
                      key={slotIdx}
                      className={`relative flex flex-col justify-between p-2.5 rounded-2xl border transition h-28 ${
                        jutsu
                          ? 'bg-slate-950/80 border-indigo-500/50 shadow-md'
                          : 'bg-slate-950/30 border-dashed border-slate-800'
                      }`}
                    >
                      {jutsu ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span
                              style={{ color: jutsu.iconColor }}
                              className="text-[10px] font-black uppercase truncate"
                            >
                              {jutsu.name}
                            </span>
                            <button
                              onClick={() => unequipJutsuFromDeck(slotIdx)}
                              className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[9px] font-mono text-sky-400">{jutsu.cpCost} CP</div>
                          <div className="text-[9px] font-mono text-slate-400">CD: {jutsu.cooldown}T</div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[10px] text-slate-600">
                          Empty Slot
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mastered Jutsu Library to Assign */}
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
                Mastered Jutsu Collection
              </span>

              <div className="grid grid-cols-3 gap-3">
                {learnedJutsus.map((jutsu) => {
                  const isEquipped = character.equippedJutsuIds.includes(jutsu.id);

                  return (
                    <div
                      key={jutsu.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 style={{ color: jutsu.iconColor }} className="text-xs font-black uppercase">
                          {jutsu.name}
                        </h4>
                        <span className="text-[10px] font-mono text-sky-400">{jutsu.cpCost} CP</span>
                      </div>

                      {isEquipped ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                          In Deck
                        </span>
                      ) : (
                        <button
                          onClick={() => equipJutsuToDeck(jutsu.id, character.equippedJutsuIds.length)}
                          disabled={character.equippedJutsuIds.length >= 6}
                          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold text-xs transition cursor-pointer"
                        >
                          Add to Deck
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
