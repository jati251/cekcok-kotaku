import React, { useState, useCallback, useRef } from 'react';
import { DynastyCanvas3D } from './components/3d/DynastyCanvas3D';
import { GameHUD, MinimapData } from './components/GameHUD';
import { MenuOverlay } from './components/MenuOverlay';
import { MobileControls } from './components/MobileControls';
import { StoryDialogOverlay } from './components/StoryDialogOverlay';
import { PauseMenuOverlay } from './components/PauseMenuOverlay';
import {
  GameStatus,
  HeroType,
  DifficultyLevel,
  MobileInputState,
  ComboRank,
  MissionObjective,
  BattleAnnouncement,
} from './types';
import * as Constants from './constants';
import { useLauncherStore } from '@/stores/launcherStore';
import { audioEngine } from './services/audioEngine';
import { ArrowLeft } from 'lucide-react';

export const DynastyLegendsGame: React.FC = () => {
  const { exitToLauncher } = useLauncherStore();

  React.useEffect(() => {
    return () => {
      audioEngine.stopBattleDrums();
    };
  }, []);

  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [selectedHero, setSelectedHero] = useState<HeroType>(HeroType.GUAN_YU);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<BattleAnnouncement | null>(null);

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
    liveMinimap?: MinimapData;
    isRustEngine?: boolean;
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

  const announcementTimerRef = useRef<number | null>(null);

  const handleAnnouncement = useCallback((newAnnouncement: BattleAnnouncement) => {
    setAnnouncement(newAnnouncement);
    if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
    announcementTimerRef.current = window.setTimeout(() => {
      setAnnouncement(null);
    }, 3800);
  }, []);

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

    setStatus(GameStatus.STORY_INTRO);
  };

  const handleStoryComplete = () => {
    setStatus(GameStatus.PLAYING);
  };

  const handleGameOver = useCallback((victory: boolean) => {
    setStatus(victory ? GameStatus.VICTORY : GameStatus.DEFEAT);
  }, []);

  const handleTogglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === GameStatus.PLAYING) return GameStatus.PAUSED;
      if (prev === GameStatus.PAUSED) return GameStatus.PLAYING;
      return prev;
    });
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
      weaponName?: string,
      minimap?: MinimapData,
      isRust?: boolean
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
        liveMinimap: minimap,
        isRustEngine: isRust,
      });
    },
    []
  );

  const handleRestart = () => {
    handleStartGame(selectedHero, selectedDifficulty);
  };

  const handleQuitToMenu = () => {
    setStatus(GameStatus.MENU);
  };

  const defaultMinimap: MinimapData = {
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

      <DynastyCanvas3D
        status={status}
        selectedHero={selectedHero}
        selectedDifficulty={selectedDifficulty}
        scenario={currentScenario}
        onUpdateStats={handleUpdateStats}
        onGameOver={handleGameOver}
        onTogglePause={handleTogglePause}
        onAnnouncement={handleAnnouncement}
        mobileInputRef={mobileInputRef}
      />

      {status === GameStatus.STORY_INTRO && (
        <StoryDialogOverlay
          dialogs={currentScenario.introDialogs}
          onComplete={handleStoryComplete}
        />
      )}

      {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
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
            minimapData={stats.liveMinimap || defaultMinimap}
            announcement={announcement}
            isRustEngine={stats.isRustEngine}
            onPause={handleTogglePause}
          />

          <MobileControls
            inputRef={mobileInputRef}
            isMusouReady={stats.musou >= Constants.MUSOU_GAUGE_MAX}
          />
        </>
      )}

      <PauseMenuOverlay
        isOpen={status === GameStatus.PAUSED}
        scenario={currentScenario}
        onResume={handleTogglePause}
        onRestart={handleRestart}
        onQuit={handleQuitToMenu}
      />

      <MenuOverlay
        status={status}
        scenario={currentScenario}
        onStart={handleStartGame}
        onRestart={handleQuitToMenu}
        koCount={stats.ko}
        onSelectScenario={handleSelectScenario}
        selectedScenarioIndex={selectedScenarioIndex}
      />
    </div>
  );
};

export default DynastyLegendsGame;
