import React from 'react';
import {
  Swords,
  Flame,
  PlusCircle,
  X,
  Truck,
  UserCheck,
  Crosshair,
  Plane,
  Anchor,
  Shield,
  Coins,
  Fuel,
  Trophy,
} from 'lucide-react';
import { useCombatStore } from '../stores/combatStore';
import type { UnitClass } from '../../../types';
import { Button } from '../../../components/ui/Button';

export const CombatModal: React.FC = () => {
  const {
    phase,
    sectorName,
    playerUnits,
    enemyUnits,
    selectedPlayerSlot,
    selectedEnemySlot,
    airstrikesAvailable,
    medikitsAvailable,
    combatLog,
    activeDamageEffects,
    lootRewards,
    selectPlayerUnit,
    selectEnemyTarget,
    executePlayerAttack,
    executeAirstrike,
    executeMedikit,
    claimBattleVictory,
    exitBattle,
  } = useCombatStore();

  if (phase === 'idle') return null;

  const getClassIcon = (uClass: UnitClass) => {
    switch (uClass) {
      case 'armor': return <Truck className="w-5 h-5" />;
      case 'infantry': return <UserCheck className="w-5 h-5" />;
      case 'artillery': return <Crosshair className="w-5 h-5" />;
      case 'aircraft': return <Plane className="w-5 h-5" />;
      case 'naval': return <Anchor className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const selectedPlayerUnit = playerUnits.find((u) => u.slotIndex === selectedPlayerSlot);
  const selectedEnemyUnit = enemyUnits.find((u) => u.slotIndex === selectedEnemySlot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Arena Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-wider uppercase font-tactical">
                {sectorName}
              </h3>
              <span className="text-[11px] text-slate-400">
                Turn-Based Tactical Engagement • Rock-Paper-Scissors Advantage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tactical Powers */}
            <Button
              variant="tactical"
              size="sm"
              icon={<Flame className="w-4 h-4" />}
              onClick={executeAirstrike}
              disabled={phase !== 'player_turn' || airstrikesAvailable <= 0}
            >
              Airstrike ({airstrikesAvailable})
            </Button>

            <Button
              variant="success"
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={executeMedikit}
              disabled={phase !== 'player_turn' || medikitsAvailable <= 0}
            >
              Medikit ({medikitsAvailable})
            </Button>

            <button
              onClick={exitBattle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Battlefield Arena Canvas / Grid */}
        <div className="relative flex-1 p-6 bg-radial from-slate-900 to-slate-950 overflow-y-auto">
          {/* Turn Phase Banner */}
          <div className="text-center mb-6">
            <span
              className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md ${
                phase === 'player_turn'
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 animate-pulse'
                  : phase === 'enemy_turn' || phase === 'animating'
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                  : 'bg-amber-600/30 text-amber-300 border-amber-500/50'
              }`}
            >
              {phase === 'player_turn'
                ? 'Your Turn - Choose Squad & Target'
                : phase === 'animating'
                ? 'Resolving Combat Round...'
                : 'Raven Syndicate Turn...'}
            </span>
          </div>

          {/* 4v4 Grid Lanes */}
          <div className="grid grid-cols-2 gap-8 items-center">
            {/* Player Side */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Vanguard Squad (You)
              </h4>

              {playerUnits.map((unit) => {
                const isSelected = selectedPlayerSlot === unit.slotIndex;
                const isDead = unit.currentHp <= 0;
                const hpPercent = Math.max(0, Math.round((unit.currentHp / unit.maxHp) * 100));

                const dmgEffect = activeDamageEffects.find(
                  (d) => d.targetSlot === unit.slotIndex && d.isPlayerTarget
                );

                return (
                  <div
                    key={unit.instanceId}
                    onClick={() => !isDead && selectPlayerUnit(unit.slotIndex)}
                    className={`relative flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                      isDead
                        ? 'bg-slate-950/40 border-slate-800 opacity-40 grayscale'
                        : isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/20 scale-102'
                        : 'bg-slate-850 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    {/* Floating Damage Text */}
                    {dmgEffect && (
                      <div className="absolute -top-3 right-6 text-base font-black text-rose-400 animate-bounce font-mono">
                        -{dmgEffect.damage}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        {getClassIcon(unit.unitClass)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{unit.name}</span>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {unit.unitClass}
                          </span>
                        </div>

                        {/* Health Bar */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
                            {unit.currentHp}/{unit.maxHp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        ATK {unit.attackPower}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enemy Side */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Raven Syndicate Forces
              </h4>

              {enemyUnits.map((unit) => {
                const isSelected = selectedEnemySlot === unit.slotIndex;
                const isDead = unit.currentHp <= 0;
                const hpPercent = Math.max(0, Math.round((unit.currentHp / unit.maxHp) * 100));

                const dmgEffect = activeDamageEffects.find(
                  (d) => d.targetSlot === unit.slotIndex && !d.isPlayerTarget
                );

                return (
                  <div
                    key={unit.instanceId}
                    onClick={() => !isDead && selectEnemyTarget(unit.slotIndex)}
                    className={`relative flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                      isDead
                        ? 'bg-slate-950/40 border-slate-800 opacity-40 grayscale'
                        : isSelected
                        ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20 scale-102'
                        : 'bg-slate-850 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    {/* Floating Damage Text */}
                    {dmgEffect && (
                      <div className="absolute -top-3 left-6 text-base font-black text-amber-400 animate-bounce font-mono">
                        -{dmgEffect.damage}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                        {getClassIcon(unit.unitClass)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{unit.name}</span>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {unit.unitClass}
                          </span>
                        </div>

                        {/* Health Bar */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-rose-500 transition-all duration-300"
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-rose-400">
                            {unit.currentHp}/{unit.maxHp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        ATK {unit.attackPower}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Engagement Bar & Tactical Action */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-6">
          {/* Advantage Indicator */}
          <div className="flex-1 text-xs">
            {selectedPlayerUnit && selectedEnemyUnit ? (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold text-blue-400">{selectedPlayerUnit.name}</span>
                <span>targets</span>
                <span className="font-semibold text-rose-400">{selectedEnemyUnit.name}</span>
                <span className="text-slate-500">•</span>
                {selectedPlayerUnit.strongAgainst === selectedEnemyUnit.unitClass ? (
                  <span className="text-emerald-400 font-bold uppercase">
                    Critical Advantage! (+60% DMG)
                  </span>
                ) : selectedPlayerUnit.weakAgainst === selectedEnemyUnit.unitClass ? (
                  <span className="text-amber-400 font-semibold">
                    Weakened Target (-40% DMG)
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Standard Advantage</span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Select an attacker and a target to engage</span>
            )}

            {/* Combat Ticker */}
            <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
              {combatLog[0] || 'Ready for tactical orders.'}
            </p>
          </div>

          {/* Attack Command Button */}
          <Button
            variant="tactical"
            size="lg"
            icon={<Swords className="w-5 h-5" />}
            onClick={executePlayerAttack}
            disabled={phase !== 'player_turn' || !selectedPlayerUnit || !selectedEnemyUnit}
            className="px-8 shadow-amber-500/30"
          >
            FIRE!
          </Button>
        </div>

        {/* Victory Overlay Modal */}
        {phase === 'victory' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide font-tactical">
                Victory Achieved!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The Raven Syndicate forces in this sector have been vanquished!
              </p>

              {/* Loot Rewards */}
              <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-around">
                <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold">
                  <Coins className="w-4 h-4" />
                  +{lootRewards.coins}
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold">
                  <Fuel className="w-4 h-4" />
                  +{lootRewards.oil}
                </div>
                <div className="flex items-center gap-1.5 text-indigo-400 font-mono font-bold">
                  +{lootRewards.xp} XP
                </div>
              </div>

              <Button
                variant="tactical"
                size="lg"
                onClick={claimBattleVictory}
                className="w-full mt-6"
              >
                Claim Spoils & Return
              </Button>
            </div>
          </div>
        )}

        {/* Defeat Overlay Modal */}
        {phase === 'defeat' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/50 shadow-2xl text-center">
              <h2 className="text-2xl font-black text-rose-400 uppercase tracking-wide font-tactical">
                Squad Neutralized
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Our forces were overwhelmed. Regroup and reinforce your army at the base!
              </p>

              <Button
                variant="secondary"
                size="lg"
                onClick={exitBattle}
                className="w-full mt-6"
              >
                Retreat to Base
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
