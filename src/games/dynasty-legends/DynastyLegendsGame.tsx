import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD, MinimapData } from './components/GameHUD';
import { MenuOverlay } from './components/MenuOverlay';
import { MobileControls } from './components/MobileControls';
import { GameStatus, BattleScenario, HeroType, DifficultyLevel, MobileInputState } from './types';
import * as Constants from './constants';
import { useLauncherStore } from '@/stores/launcherStore';
import { ArrowLeft } from 'lucide-react';

export const DynastyLegendsGame: React.FC = () => {
  const { exitToLauncher } = useLauncherStore();
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [scenario, setScenario] = useState<BattleScenario | null>(null);
  const [selectedHero, setSelectedHero] = useState<HeroType>(HeroType.WARRIOR);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);

  const [stats, setStats] = useState({
    hp: Constants.PLAYER_MAX_HP,
    musou: 0,
    ko: 0,
  });

  const [bossState, setBossState] = useState<{ hp: number; maxHp: number; name: string } | null>(null);
  const [minimapData, setMinimapData] = useState<MinimapData | null>(null);

  const lastBossRef = useRef<string>('');
  const lastMinimapRef = useRef<string>('');

  const mobileInputRef = useRef<MobileInputState>({
    moveVector: { x: 0, y: 0 },
    isAttacking: false,
    isMusou: false,
    active: false,
  });

  useEffect(() => {
    const handleBossUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const key = JSON.stringify(detail);
      if (key !== lastBossRef.current) {
        lastBossRef.current = key;
        setBossState(detail);
      }
    };
    const handleMinimapUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const key = `${Math.round(detail.playerX / 50)}_${Math.round(detail.playerY / 50)}_${detail.enemies.length}`;
      if (key !== lastMinimapRef.current) {
        lastMinimapRef.current = key;
        setMinimapData(detail);
      }
    };
    window.addEventListener('bossUpdate', handleBossUpdate);
    window.addEventListener('minimapUpdate', handleMinimapUpdate);
    return () => {
      window.removeEventListener('bossUpdate', handleBossUpdate);
      window.removeEventListener('minimapUpdate', handleMinimapUpdate);
    };
  }, []);

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index);
  };

  const handleStartGame = (hero: HeroType, difficulty: DifficultyLevel) => {
    setSelectedHero(hero);
    setSelectedDifficulty(difficulty);
    setBossState(null);
    setMinimapData(null);
    setStatus(GameStatus.LOADING);

    setTimeout(() => {
      const chosenScenario = Constants.SCENARIOS[selectedScenarioIndex];
      setScenario(chosenScenario);
      setStatus(GameStatus.PLAYING);

      const maxHp = Constants.HERO_STATS[hero].hp;
      setStats({ hp: maxHp, musou: 0, ko: 0 });

      if (mobileInputRef.current) {
        mobileInputRef.current.active = false;
        mobileInputRef.current.moveVector = { x: 0, y: 0 };
        mobileInputRef.current.isAttacking = false;
        mobileInputRef.current.isMusou = false;
      }
    }, 1000);
  };

  const handleGameOver = useCallback((victory: boolean) => {
    setStatus(victory ? GameStatus.VICTORY : GameStatus.DEFEAT);
  }, []);

  const handleUpdateStats = useCallback((hp: number, musou: number, ko: number) => {
    setStats({ hp, musou, ko });
  }, []);

  const handleRestart = () => {
    setStatus(GameStatus.MENU);
  };

  return (
    <div id="app-root" className="relative w-full h-screen bg-neutral-950 overflow-hidden select-none touch-none">
      {/* Top Floating Exit Bar */}
      <div className="absolute top-3 left-4 z-50">
        <button
          onClick={exitToLauncher}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 backdrop-blur-sm transition cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Launcher
        </button>
      </div>

      <GameCanvas
        status={status}
        selectedHero={selectedHero}
        selectedDifficulty={selectedDifficulty}
        onUpdateStats={handleUpdateStats}
        onGameOver={handleGameOver}
        bossName={scenario?.bossName || 'The Enemy'}
        requiredKills={scenario?.requiredKills || 100}
        mobileInputRef={mobileInputRef}
        mapTheme={scenario?.mapTheme}
      />

      {status === GameStatus.PLAYING && (
        <>
          <GameHUD
            health={stats.hp}
            maxHealth={Constants.HERO_STATS[selectedHero].hp}
            musou={stats.musou}
            musouMax={Constants.MUSOU_GAUGE_MAX}
            koCount={stats.ko}
            scenarioTitle={scenario?.title || 'Battlefield'}
            difficulty={selectedDifficulty}
            bossHp={bossState?.hp}
            bossMaxHp={bossState?.maxHp}
            bossName={bossState?.name}
            minimapData={minimapData || undefined}
          />

          <MobileControls
            inputRef={mobileInputRef}
            isMusouReady={stats.musou >= Constants.MUSOU_GAUGE_MAX}
          />
        </>
      )}

      <MenuOverlay
        status={status}
        scenario={scenario}
        onStart={handleStartGame}
        onRestart={handleRestart}
        koCount={stats.ko}
        onSelectScenario={handleSelectScenario}
        selectedScenarioIndex={selectedScenarioIndex}
      />
    </div>
  );
};

export default DynastyLegendsGame;
