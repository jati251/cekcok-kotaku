import React, { useState, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD, MinimapData } from './components/GameHUD';
import { MenuOverlay } from './components/MenuOverlay';
import { MobileControls } from './components/MobileControls';
import { StoryDialogOverlay } from './components/StoryDialogOverlay';
import {
  GameStatus,
  HeroType,
  DifficultyLevel,
  MobileInputState,
  ComboRank,
  MissionObjective,
} from './types';
import * as Constants from './constants';
import { useLauncherStore } from '@/stores/launcherStore';
import { ArrowLeft } from 'lucide-react';

export const DynastyLegendsGame: React.FC = () => {
  const { exitToLauncher } = useLauncherStore();
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [selectedHero, setSelectedHero] = useState<HeroType>(HeroType.GUAN_YU);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);

  const currentScenario = Constants.SCENARIOS[selectedScenarioIndex] || Constants.SCENARIOS[0];

  const [stats, setStats] = useState<{
    hp: number;
    musou: number;
    ko: number;
    alliedMorale: number;
    enemyMorale: number;
    currentObjective?: MissionObjective;
    combo: number;
    comboRank: ComboRank;
    weaponName?: string;
  }>({
    hp: Constants.PLAYER_MAX_HP,
    musou: 0,
    ko: 0,
    alliedMorale: 50,
    enemyMorale: 50,
    combo: 0,
    comboRank: 'D',
  });

  const mobileInputRef = useRef<MobileInputState>({
    moveVector: { x: 0, y: 0 },
    isAttacking: false,
    isMusou: false,
    active: false,
  });

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index);
  };

  const handleStartGame = (hero: HeroType, difficulty: DifficultyLevel) => {
    setSelectedHero(hero);
    setSelectedDifficulty(difficulty);

    const maxHp = Constants.HERO_STATS[hero].hp;
    setStats({
      hp: maxHp,
      musou: 0,
      ko: 0,
      alliedMorale: 50,
      enemyMorale: 50,
      combo: 0,
      comboRank: 'D',
    });

    if (mobileInputRef.current) {
      mobileInputRef.current.active = false;
      mobileInputRef.current.moveVector = { x: 0, y: 0 };
      mobileInputRef.current.isAttacking = false;
      mobileInputRef.current.isMusou = false;
    }

    // Launch into Story Introduction Cutscene
    setStatus(GameStatus.STORY_INTRO);
  };

  const handleStoryComplete = () => {
    setStatus(GameStatus.PLAYING);
  };

  const handleGameOver = useCallback((victory: boolean) => {
    setStatus(victory ? GameStatus.VICTORY : GameStatus.DEFEAT);
  }, []);

  const handleUpdateStats = useCallback(
    (
      hp: number,
      musou: number,
      ko: number,
      alliedMorale: number,
      enemyMorale: number,
      currentObj?: MissionObjective,
      combo?: number,
      comboRank?: ComboRank,
      weaponName?: string
    ) => {
      setStats({
        hp,
        musou,
        ko,
        alliedMorale,
        enemyMorale,
        currentObjective: currentObj,
        combo: combo || 0,
        comboRank: comboRank || 'D',
        weaponName,
      });
    },
    []
  );

  const handleRestart = () => {
    setStatus(GameStatus.MENU);
  };

  const minimapData: MinimapData = {
    playerX: 600,
    playerY: 600,
    worldSize: Constants.WORLD_SIZE,
    enemies: [],
    bases: currentScenario.bases,
    items: [],
    cameraX: 600,
    cameraY: 600,
    viewWidth: window.innerWidth,
    viewHeight: window.innerHeight,
  };

  return (
    <div id="app-root" className="relative w-full h-screen bg-slate-950 overflow-hidden select-none touch-none font-sans">
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
        scenario={currentScenario}
        onUpdateStats={handleUpdateStats}
        onGameOver={handleGameOver}
        mobileInputRef={mobileInputRef}
      />

      {status === GameStatus.STORY_INTRO && (
        <StoryDialogOverlay
          dialogs={currentScenario.introDialogs}
          onComplete={handleStoryComplete}
        />
      )}

      {status === GameStatus.PLAYING && (
        <>
          <GameHUD
            health={stats.hp}
            maxHealth={Constants.HERO_STATS[selectedHero].hp}
            musou={stats.musou}
            musouMax={Constants.MUSOU_GAUGE_MAX}
            koCount={stats.ko}
            scenarioTitle={currentScenario.title}
            chapterTitle={currentScenario.chapter}
            difficulty={selectedDifficulty}
            alliedMorale={stats.alliedMorale}
            enemyMorale={stats.enemyMorale}
            currentObjective={stats.currentObjective}
            comboCount={stats.combo}
            comboRank={stats.comboRank}
            weaponName={stats.weaponName}
            minimapData={minimapData}
          />

          <MobileControls
            inputRef={mobileInputRef}
            isMusouReady={stats.musou >= Constants.MUSOU_GAUGE_MAX}
          />
        </>
      )}

      <MenuOverlay
        status={status}
        scenario={currentScenario}
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
