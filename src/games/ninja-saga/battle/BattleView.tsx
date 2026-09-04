import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sword,
  Zap,
  Sparkles,
  Heart,
  LogOut,
  Trophy,
  Skull,
  Feather,
} from 'lucide-react';
import { useNinjaSagaStore } from '../store/useNinjaSagaStore';
import { Jutsu, Item } from '../types';
import {
  calculateDamage,
  applyDamage,
  executeAITurn,
} from './battleEngine';
import { battleRenderer } from './battleRenderer';
import { ninjaAudio } from '../audio';

export const BattleView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeBattle, updateBattle, endBattle, gainRewards, character } =
    useNinjaSagaStore();

  const [activeTab, setActiveTab] = useState<'main' | 'jutsu' | 'items'>('main');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);

  // Canvas loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas || !activeBattle) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      battleRenderer.render(
        ctx,
        canvas.width,
        canvas.height,
        activeBattle.player,
        activeBattle.enemy
      );
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeBattle]);

  if (!activeBattle) return null;

  const { player, enemy, isOver, winner, logs, rewards } = activeBattle;

  // Handle Player Basic Attack
  const handleAttack = () => {
    if (activeBattle.currentTurn !== 'player' || isOver || isProcessingTurn) return;

    setIsProcessingTurn(true);
    ninjaAudio.playSlash();
    battleRenderer.spawnJutsuParticles(canvasRef.current?.width ? canvasRef.current.width * 0.76 : 600, 260, 'neutral');

    const res = calculateDamage(player, enemy, 1.0, 'neutral');
    let updatedEnemy = { ...enemy };

    if (res.isDodge) {
      ninjaAudio.playWind();
      updateBattle((b) => ({
        ...b,
        logs: [
          {
            id: Math.random().toString(),
            text: `You slashed at ${enemy.name}, but they dodged!`,
            type: 'system',
          },
          ...b.logs,
        ],
      }));
    } else {
      if (res.isCrit) {
        battleRenderer.triggerScreenShake(12);
      }
      const actualDmg = applyDamage(updatedEnemy, res.damage);
      updateBattle((b) => ({
        ...b,
        enemy: updatedEnemy,
        logs: [
          {
            id: Math.random().toString(),
            text: `You struck ${enemy.name} for ${actualDmg} damage! ${
              res.isCrit ? 'CRITICAL HIT!' : ''
            }`,
            type: res.isCrit ? 'crit' : 'player',
          },
          ...b.logs,
        ],
      }));
    }

    // Check if enemy died
    if (updatedEnemy.hp <= 0) {
      ninjaAudio.playVictory();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      updateBattle((b) => ({
        ...b,
        isOver: true,
        winner: 'player',
        logs: [
          {
            id: Math.random().toString(),
            text: `${enemy.name} has been defeated! Victory!`,
            type: 'system',
          },
          ...b.logs,
        ],
      }));
      setIsProcessingTurn(false);
      return;
    }

    // Switch to AI Turn
    setTimeout(() => {
      updateBattle((b) => {
        const nextBattle = { ...b, currentTurn: 'enemy' as const };
        executeAITurn(nextBattle);
        return nextBattle;
      });
      setIsProcessingTurn(false);
    }, 700);
  };

  // Handle Player Casting Jutsu
  const handleCastJutsu = (jutsu: Jutsu) => {
    if (
      activeBattle.currentTurn !== 'player' ||
      isOver ||
      isProcessingTurn ||
      player.cp < jutsu.cpCost ||
      (player.jutsuCooldowns[jutsu.id] || 0) > 0
    ) {
      return;
    }

    setIsProcessingTurn(true);
    setActiveTab('main');

    // Deduct CP & set cooldown
    const updatedPlayer = {
      ...player,
      cp: player.cp - jutsu.cpCost,
      jutsuCooldowns: {
        ...player.jutsuCooldowns,
        [jutsu.id]: jutsu.cooldown,
      },
    };

    let updatedEnemy = { ...enemy };

    // Play element audio & particle
    if (jutsu.element === 'fire') ninjaAudio.playFireball();
    else if (jutsu.element === 'lightning') ninjaAudio.playLightning();
    else if (jutsu.element === 'water') ninjaAudio.playWater();
    else if (jutsu.element === 'earth') ninjaAudio.playEarth();
    else ninjaAudio.playWind();

    battleRenderer.spawnJutsuParticles(canvasRef.current?.width ? canvasRef.current.width * 0.76 : 600, 250, jutsu.element);

    if (jutsu.damageMultiplier === 0 && jutsu.statusEffect?.type === 'shield') {
      // Shield / Support Jutsu
      updatedPlayer.shield += jutsu.statusEffect.value;
      updateBattle((b) => ({
        ...b,
        player: updatedPlayer,
        logs: [
          {
            id: Math.random().toString(),
            text: `You cast [${jutsu.name}] and erected a ${jutsu.statusEffect?.value} HP barrier!`,
            type: 'player',
          },
          ...b.logs,
        ],
      }));
    } else {
      // Offensive Jutsu
      const res = calculateDamage(player, enemy, jutsu.damageMultiplier, jutsu.element);

      if (res.isDodge) {
        ninjaAudio.playWind();
        updateBattle((b) => ({
          ...b,
          player: updatedPlayer,
          logs: [
            {
              id: Math.random().toString(),
              text: `You cast [${jutsu.name}], but ${enemy.name} dodged!`,
              type: 'system',
            },
            ...b.logs,
          ],
        }));
      } else {
        if (res.isCrit) battleRenderer.triggerScreenShake(14);
        const actualDmg = applyDamage(updatedEnemy, res.damage);

        // Apply status effect if chance hits
        if (jutsu.statusEffect && Math.random() < jutsu.statusEffect.chance) {
          updatedEnemy.statusEffects = [
            ...updatedEnemy.statusEffects,
            {
              type: jutsu.statusEffect.type,
              duration: jutsu.statusEffect.duration,
              value: jutsu.statusEffect.value,
              sourceName: jutsu.name,
            },
          ];
        }

        updateBattle((b) => ({
          ...b,
          player: updatedPlayer,
          enemy: updatedEnemy,
          logs: [
            {
              id: Math.random().toString(),
              text: `You cast [${jutsu.name}] dealing ${actualDmg} ${jutsu.element.toUpperCase()} damage! ${
                res.isCrit ? 'CRITICAL!' : ''
              }`,
              type: res.isCrit ? 'crit' : 'player',
            },
            ...b.logs,
          ],
        }));
      }
    }

    // Check if enemy died
    if (updatedEnemy.hp <= 0) {
      ninjaAudio.playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      updateBattle((b) => ({
        ...b,
        isOver: true,
        winner: 'player',
        logs: [
          {
            id: Math.random().toString(),
            text: `${enemy.name} has fallen in battle! Victory!`,
            type: 'system',
          },
          ...b.logs,
        ],
      }));
      setIsProcessingTurn(false);
      return;
    }

    // Switch to Enemy Turn
    setTimeout(() => {
      updateBattle((b) => {
        const nextBattle = { ...b, currentTurn: 'enemy' as const };
        executeAITurn(nextBattle);
        return nextBattle;
      });
      setIsProcessingTurn(false);
    }, 700);
  };

  // Handle Chakra Charge (+40% CP)
  const handleChargeChakra = () => {
    if (activeBattle.currentTurn !== 'player' || isOver || isProcessingTurn) return;

    setIsProcessingTurn(true);
    ninjaAudio.playChakraCharge();
    const recover = Math.round(player.maxCp * 0.4);
    const updatedPlayer = {
      ...player,
      cp: Math.min(player.maxCp, player.cp + recover),
    };

    updateBattle((b) => ({
      ...b,
      player: updatedPlayer,
      logs: [
        {
          id: Math.random().toString(),
          text: `You focused your breathing and recharged +${recover} Chakra Points!`,
          type: 'player',
        },
        ...b.logs,
      ],
    }));

    setTimeout(() => {
      updateBattle((b) => {
        const nextBattle = { ...b, currentTurn: 'enemy' as const };
        executeAITurn(nextBattle);
        return nextBattle;
      });
      setIsProcessingTurn(false);
    }, 600);
  };

  // Handle Pet Action
  const handlePetAction = () => {
    if (
      activeBattle.currentTurn !== 'player' ||
      isOver ||
      isProcessingTurn ||
      activeBattle.petCooldown > 0 ||
      !character?.activePet
    ) {
      return;
    }

    setIsProcessingTurn(true);
    const pet = character.activePet;
    ninjaAudio.playLevelUp();

    let updatedEnemy = { ...enemy };
    let updatedPlayer = { ...player };

    if (pet.species === 'dog') {
      // 120 damage + 1 turn stun
      const dmg = applyDamage(updatedEnemy, 120);
      updatedEnemy.statusEffects.push({
        type: 'stun',
        duration: 1,
        value: 0,
        sourceName: pet.skillName,
      });
      ninjaAudio.playSlash();
      updateBattle((b) => ({
        ...b,
        enemy: updatedEnemy,
        petCooldown: pet.cooldownTurns,
        logs: [
          {
            id: Math.random().toString(),
            text: `${pet.name} used [${pet.skillName}] dealing ${dmg} damage and stunning the enemy!`,
            type: 'player',
          },
          ...b.logs,
        ],
      }));
    } else if (pet.species === 'fox') {
      // Heal 250 HP + 150 CP
      updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + 250);
      updatedPlayer.cp = Math.min(updatedPlayer.maxCp, updatedPlayer.cp + 150);
      ninjaAudio.playWater();
      updateBattle((b) => ({
        ...b,
        player: updatedPlayer,
        petCooldown: pet.cooldownTurns,
        logs: [
          {
            id: Math.random().toString(),
            text: `${pet.name} used [${pet.skillName}] restoring 250 HP and 150 CP!`,
            type: 'heal',
          },
          ...b.logs,
        ],
      }));
    } else {
      // Crow / Dragon
      const dmg = applyDamage(updatedEnemy, 160);
      updatedPlayer.statusEffects.push({
        type: 'attack_buff',
        duration: 2,
        value: 25,
        sourceName: pet.skillName,
      });
      ninjaAudio.playFireball();
      updateBattle((b) => ({
        ...b,
        player: updatedPlayer,
        enemy: updatedEnemy,
        petCooldown: pet.cooldownTurns,
        logs: [
          {
            id: Math.random().toString(),
            text: `${pet.name} used [${pet.skillName}] dealing ${dmg} damage and boosting your Attack!`,
            type: 'player',
          },
          ...b.logs,
        ],
      }));
    }

    if (updatedEnemy.hp <= 0) {
      ninjaAudio.playVictory();
      updateBattle((b) => ({
        ...b,
        isOver: true,
        winner: 'player',
      }));
      setIsProcessingTurn(false);
      return;
    }

    setTimeout(() => {
      updateBattle((b) => {
        const nextBattle = { ...b, currentTurn: 'enemy' as const };
        executeAITurn(nextBattle);
        return nextBattle;
      });
      setIsProcessingTurn(false);
    }, 700);
  };

  // Handle using item from inventory
  const handleUseItem = (inventoryItem: { item: Item; quantity: number }) => {
    if (activeBattle.currentTurn !== 'player' || isOver || isProcessingTurn) return;
    if (inventoryItem.quantity <= 0 || !inventoryItem.item.consumableEffect) return;

    setIsProcessingTurn(true);
    setActiveTab('main');
    inventoryItem.quantity -= 1;

    let updatedPlayer = { ...player };
    const eff = inventoryItem.item.consumableEffect;

    if (eff.type === 'heal_hp') {
      updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + eff.amount);
      ninjaAudio.playWater();
      updateBattle((b) => ({
        ...b,
        player: updatedPlayer,
        logs: [
          {
            id: Math.random().toString(),
            text: `You drank [${inventoryItem.item.name}] and recovered ${eff.amount} HP!`,
            type: 'heal',
          },
          ...b.logs,
        ],
      }));
    } else if (eff.type === 'restore_cp') {
      updatedPlayer.cp = Math.min(updatedPlayer.maxCp, updatedPlayer.cp + eff.amount);
      ninjaAudio.playChakraCharge();
      updateBattle((b) => ({
        ...b,
        player: updatedPlayer,
        logs: [
          {
            id: Math.random().toString(),
            text: `You ingested [${inventoryItem.item.name}] and recovered ${eff.amount} CP!`,
            type: 'player',
          },
          ...b.logs,
        ],
      }));
    }

    setTimeout(() => {
      updateBattle((b) => {
        const nextBattle = { ...b, currentTurn: 'enemy' as const };
        executeAITurn(nextBattle);
        return nextBattle;
      });
      setIsProcessingTurn(false);
    }, 600);
  };

  // Claim Victory Rewards & Return to Village
  const handleClaimVictory = () => {
    if (rewards) {
      gainRewards(rewards.xp, rewards.gold, rewards.tokens, rewards.itemDrop);
    }
    endBattle();
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-950 text-white overflow-hidden select-none">
      {/* Top Combat Fighter HUD */}
      <div className="flex items-center justify-between px-6 py-2 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20">
        {/* Player Stats */}
        <div className="w-80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase text-amber-400">
              {player.name} (Lv.{player.level})
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              {player.hp} / {player.maxHp} HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-700 overflow-hidden mb-1">
            <div
              style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-200"
            />
          </div>

          {/* Chakra Bar */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-bold text-sky-400 uppercase">Chakra</span>
            <span className="text-[9px] font-mono text-slate-400">
              {player.cp} / {player.maxCp} CP
            </span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              style={{ width: `${Math.max(0, (player.cp / player.maxCp) * 100)}%` }}
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-200"
            />
          </div>

          {/* Player Active Buffs */}
          <div className="flex items-center gap-1 mt-1">
            {player.shield > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-900/80 border border-sky-400 text-sky-200 font-mono">
                Shield: {player.shield}
              </span>
            )}
            {player.statusEffects.map((se, idx) => (
              <span
                key={idx}
                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/80 border border-amber-500 text-amber-200 uppercase font-mono"
              >
                {se.type} ({se.duration})
              </span>
            ))}
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="flex flex-col items-center">
          <span
            className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${
              activeBattle.currentTurn === 'player'
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-rose-700 text-white'
            }`}
          >
            {activeBattle.currentTurn === 'player' ? 'YOUR TURN' : 'ENEMY TURN'}
          </span>
        </div>

        {/* Enemy Stats */}
        <div className="w-80 text-right">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-300">
              {enemy.hp} / {enemy.maxHp} HP
            </span>
            <span className="text-xs font-black uppercase text-rose-400">
              {enemy.name} (Lv.{enemy.level})
            </span>
          </div>

          {/* Enemy Health Bar */}
          <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-700 overflow-hidden mb-1">
            <div
              style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200 ml-auto"
            />
          </div>

          {/* Enemy Chakra */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-mono text-slate-400">
              {enemy.cp} / {enemy.maxCp} CP
            </span>
            <span className="text-[9px] font-bold text-sky-400 uppercase">Chakra</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              style={{ width: `${Math.max(0, (enemy.cp / enemy.maxCp) * 100)}%` }}
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-200 ml-auto"
            />
          </div>

          {/* Enemy Buffs / Debuffs */}
          <div className="flex items-center justify-end gap-1 mt-1">
            {enemy.shield > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-900/80 border border-lime-400 text-lime-200 font-mono">
                Shield: {enemy.shield}
              </span>
            )}
            {enemy.statusEffects.map((se, idx) => (
              <span
                key={idx}
                className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/80 border border-rose-500 text-rose-200 uppercase font-mono"
              >
                {se.type} ({se.duration})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Battle Canvas Theater */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={380}
          className="w-full h-full max-h-[50vh] object-cover"
        />
      </div>

      {/* Bottom Command Deck & Combat Log */}
      <div className="h-56 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex p-3 gap-3 z-20">
        {/* Combat Action Log Feed (Left) */}
        <div className="w-80 bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 overflow-y-auto flex flex-col-reverse text-[11px] font-mono select-text">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`py-0.5 ${
                log.type === 'crit'
                  ? 'text-amber-400 font-black'
                  : log.type === 'player'
                  ? 'text-emerald-300'
                  : log.type === 'enemy'
                  ? 'text-rose-400'
                  : log.type === 'heal'
                  ? 'text-teal-300'
                  : 'text-slate-400'
              }`}
            >
              {log.text}
            </div>
          ))}
        </div>

        {/* Action Controls Deck (Center & Right) */}
        <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          {/* Action Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'main' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Commands
            </button>
            <button
              onClick={() => setActiveTab('jutsu')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'jutsu' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Jutsu Deck ({player.equippedJutsus.length})
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'items' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Consumables
            </button>
          </div>

          {/* Action Sub-Panels */}
          <div className="flex-1 flex items-center justify-center py-2">
            {activeTab === 'main' && (
              <div className="grid grid-cols-5 gap-3 w-full max-w-2xl">
                {/* 1. Attack */}
                <button
                  onClick={handleAttack}
                  disabled={activeBattle.currentTurn !== 'player' || isProcessingTurn || isOver}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-lg"
                >
                  <Sword className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black uppercase">Attack</span>
                </button>

                {/* 2. Open Jutsu Grid */}
                <button
                  onClick={() => setActiveTab('jutsu')}
                  disabled={activeBattle.currentTurn !== 'player' || isProcessingTurn || isOver}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-800 border border-indigo-700/60 text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-lg"
                >
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-black uppercase">Jutsu</span>
                </button>

                {/* 3. Charge Chakra */}
                <button
                  onClick={handleChargeChakra}
                  disabled={activeBattle.currentTurn !== 'player' || isProcessingTurn || isOver}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-sky-950 to-slate-900 hover:from-sky-900 hover:to-slate-800 border border-sky-700/60 text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <span className="text-xs font-black uppercase">Charge CP</span>
                </button>

                {/* 4. Companion Pet Skill */}
                <button
                  onClick={handlePetAction}
                  disabled={
                    activeBattle.currentTurn !== 'player' ||
                    isProcessingTurn ||
                    isOver ||
                    activeBattle.petCooldown > 0 ||
                    !character?.activePet
                  }
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-emerald-950 to-slate-900 hover:from-emerald-900 hover:to-slate-800 border border-emerald-700/60 text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-lg"
                >
                  <Feather className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black uppercase">
                    {character?.activePet ? 'Pet Skill' : 'No Pet'}
                  </span>
                  {activeBattle.petCooldown > 0 && (
                    <span className="text-[9px] font-mono text-amber-400">
                      CD: {activeBattle.petCooldown}
                    </span>
                  )}
                </button>

                {/* 5. Flee */}
                <button
                  onClick={endBattle}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-rose-950 to-slate-900 hover:from-rose-900 hover:to-slate-800 border border-rose-700/60 text-slate-100 transition active:scale-95 cursor-pointer shadow-lg"
                >
                  <LogOut className="w-5 h-5 text-rose-400" />
                  <span className="text-xs font-black uppercase">Flee</span>
                </button>
              </div>
            )}

            {activeTab === 'jutsu' && (
              <div className="grid grid-cols-6 gap-2 w-full">
                {player.equippedJutsus.map((jutsu) => {
                  const cooldown = player.jutsuCooldowns[jutsu.id] || 0;
                  const canCast =
                    activeBattle.currentTurn === 'player' &&
                    !isProcessingTurn &&
                    !isOver &&
                    player.cp >= jutsu.cpCost &&
                    cooldown === 0;

                  return (
                    <button
                      key={jutsu.id}
                      onClick={() => handleCastJutsu(jutsu)}
                      disabled={!canCast}
                      className="relative flex flex-col justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-md h-24 overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          style={{ color: jutsu.iconColor }}
                          className="text-[10px] font-black uppercase tracking-wider truncate"
                        >
                          {jutsu.name}
                        </span>
                      </div>

                      <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight">
                        {jutsu.description}
                      </p>

                      <div className="flex items-center justify-between text-[9px] font-mono text-sky-400 w-full">
                        <span>{jutsu.cpCost} CP</span>
                        {cooldown > 0 ? (
                          <span className="text-rose-400 font-bold">CD: {cooldown}</span>
                        ) : (
                          <span className="text-emerald-400">Ready</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'items' && (
              <div className="flex items-center gap-3 overflow-x-auto w-full py-1">
                {character?.inventory
                  .filter((inv) => inv.item.type === 'consumable' && inv.quantity > 0)
                  .map((inv) => (
                    <button
                      key={inv.item.id}
                      onClick={() => handleUseItem(inv)}
                      disabled={activeBattle.currentTurn !== 'player' || isProcessingTurn || isOver}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer min-w-[200px]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/50 flex items-center justify-center text-teal-400">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate">{inv.item.name}</div>
                        <div className="text-[10px] text-slate-400">Qty: {inv.quantity}</div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Battle End Modal (Victory / Defeat) */}
      {isOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                winner === 'player'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
              }`}
            >
              {winner === 'player' ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-1">
              {winner === 'player' ? 'Mission Accomplished!' : 'Mission Failed!'}
            </h2>
            <p className="text-xs font-semibold text-slate-400 mb-6">
              {winner === 'player'
                ? 'Your shinobi skills proved superior in combat.'
                : 'Regroup in the village, train your jutsu, and enhance your equipment.'}
            </p>

            {winner === 'player' && rewards && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-left">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-2">
                  Battle Rewards
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="text-emerald-400 font-bold">+{rewards.xp} XP</div>
                  <div className="text-amber-400 font-bold">+{rewards.gold} Gold</div>
                  {rewards.tokens ? (
                    <div className="text-indigo-400 font-bold">+{rewards.tokens} Tokens</div>
                  ) : null}
                  {rewards.itemDrop && (
                    <div className="text-teal-300 col-span-2">
                      Drop: <strong className="text-white">{rewards.itemDrop.name}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleClaimVictory}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer"
            >
              Return to Village
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
