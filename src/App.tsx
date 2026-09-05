import React, { Suspense, lazy } from 'react';
import { useLauncherStore } from './stores/launcherStore';
import {
  LauncherHeader,
  LauncherDashboard,
  SettingsModal,
  GameLoadingScreen,
} from './features/launcher';

// Dynamic Code-Split Lazy Game Components (Bundle Optimization)
const EmpiresAndAlliesGame = lazy(() =>
  import('./games/empires-and-allies/EmpiresAndAlliesGame').then((m) => ({
    default: m.EmpiresAndAlliesGame,
  }))
);
const CityVilleGame = lazy(() =>
  import('./games/cityville/CityVilleGame').then((m) => ({ default: m.CityVilleGame }))
);
const TetrisGame = lazy(() =>
  import('./games/tetris').then((m) => ({ default: m.TetrisGame }))
);
const DynastyLegendsGame = lazy(() =>
  import('./games/dynasty-legends').then((m) => ({ default: m.DynastyLegendsGame }))
);
const RubikGame = lazy(() =>
  import('./games/rubik-cube').then((m) => ({ default: m.RubikGame }))
);
const SkyRaid = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.SkyRaid }))
);
const SpaceBlast = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.SpaceBlast }))
);
const MotoRush = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.MotoRush }))
);
const CrazyWheels = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.CrazyWheels }))
);
const MiniGolf = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.MiniGolf }))
);
const BumperBrawl = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.BumperBrawl }))
);
const SnowboardRush = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.SnowboardRush }))
);
const BalloonFrenzy = lazy(() =>
  import('./games/arcade-2d').then((m) => ({ default: m.BalloonFrenzy }))
);
const FeedingFrenzy = lazy(() =>
  import('./games/feeding-frenzy/FeedingFrenzy').then((m) => ({ default: m.FeedingFrenzy }))
);
const PizzaFrenzy = lazy(() =>
  import('./games/pizza-frenzy/PizzaFrenzy').then((m) => ({ default: m.PizzaFrenzy }))
);
const SaloonShowdown = lazy(() =>
  import('./games/saloon-showdown/SaloonShowdown').then((m) => ({ default: m.SaloonShowdown }))
);
const Insaniquarium = lazy(() =>
  import('./games/insaniquarium/Insaniquarium').then((m) => ({ default: m.Insaniquarium }))
);
const EightBallPool = lazy(() =>
  import('./games/eight-ball-pool/EightBallPool').then((m) => ({ default: m.EightBallPool }))
);
const NinjaSagaGame = lazy(() =>
  import('./games/ninja-saga/NinjaSagaGame').then((m) => ({ default: m.NinjaSagaGame }))
);
const NightclubCityGame = lazy(() =>
  import('./games/nightclub-city/NightclubCityGame').then((m) => ({ default: m.NightclubCityGame }))
);
const CarTownGame = lazy(() =>
  import('./games/cartown/CarTownGame').then((m) => ({ default: m.CarTownGame }))
);
const SuperKartGame = lazy(() =>
  import('./games/super-kart').then((m) => ({ default: m.SuperKartGame }))
);
const MobileLegendsGame = lazy(() =>
  import('./games/mobile-legends').then((m) => ({ default: m.MobileLegendsGame }))
);
const PacmanGame = lazy(() =>
  import('./games/pacman').then((m) => ({ default: m.PacmanGame }))
);
const MortalKombatGame = lazy(() =>
  import('./games/mortal-kombat').then((m) => ({ default: m.MortalKombatGame }))
);

// 6 New Games
const FlappyBirdGame = lazy(() =>
  import('./games/flappy-bird').then((m) => ({ default: m.FlappyBirdGame }))
);
const AngryBirdsGame = lazy(() =>
  import('./games/angry-birds').then((m) => ({ default: m.AngryBirdsGame }))
);
const ZumaGame = lazy(() =>
  import('./games/zuma-deluxe').then((m) => ({ default: m.ZumaGame }))
);
const BejeweledGame = lazy(() =>
  import('./games/bejeweled').then((m) => ({ default: m.BejeweledGame }))
);
const PinballGame = lazy(() =>
  import('./games/pinball').then((m) => ({ default: m.PinballGame }))
);
const ChessGame = lazy(() =>
  import('./games/chess').then((m) => ({ default: m.ChessGame }))
);
const JudolSlotGame = lazy(() =>
  import('./games/judol-slot').then((m) => ({ default: m.JudolSlotGame }))
);
const PokerGame = lazy(() =>
  import('./games/poker').then((m) => ({ default: m.PokerGame }))
);

// Full Settings Page
const SettingsPage = lazy(() =>
  import('./features/settings').then((m) => ({ default: m.SettingsPage }))
);

export const App: React.FC = () => {
  const { activeTab } = useLauncherStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'launcher':
        return (
          <div className="flex flex-col w-full h-full">
            <LauncherHeader />
            <LauncherDashboard />
            <SettingsModal />
          </div>
        );
      case 'settings':
        return <SettingsPage />;
      case 'flappy-bird':
        return <FlappyBirdGame />;
      case 'angry-birds':
        return <AngryBirdsGame />;
      case 'zuma-deluxe':
        return <ZumaGame />;
      case 'bejeweled':
        return <BejeweledGame />;
      case 'pinball':
        return <PinballGame />;
      case 'chess':
        return <ChessGame />;
      case 'judol-slot':
        return <JudolSlotGame onBack={() => useLauncherStore.getState().setActiveTab('launcher')} />;
      case 'poker':
        return <PokerGame onBack={() => useLauncherStore.getState().setActiveTab('launcher')} />;
      case 'cityville':
        return <CityVilleGame />;
      case 'tetris':
        return <TetrisGame />;
      case 'dynasty-legends':
        return <DynastyLegendsGame />;
      case 'rubik-cube':
        return <RubikGame />;
      case 'sky-raid':
        return <SkyRaid />;
      case 'space-blast':
        return <SpaceBlast />;
      case 'moto-rush':
        return <MotoRush />;
      case 'crazy-wheels':
        return <CrazyWheels />;
      case 'mini-golf':
        return <MiniGolf />;
      case 'bumper-brawl':
        return <BumperBrawl />;
      case 'snowboard-rush':
        return <SnowboardRush />;
      case 'balloon-frenzy':
        return <BalloonFrenzy />;
      case 'feeding-frenzy':
        return <FeedingFrenzy />;
      case 'pizza-frenzy':
        return <PizzaFrenzy />;
      case 'saloon-showdown':
        return <SaloonShowdown />;
      case 'insaniquarium':
        return <Insaniquarium />;
      case 'eight-ball-pool':
        return <EightBallPool />;
      case 'ninja-saga':
        return <NinjaSagaGame />;
      case 'nightclub-city':
        return <NightclubCityGame />;
      case 'cartown':
        return <CarTownGame />;
      case 'super-kart':
        return <SuperKartGame />;
      case 'mobile-legends':
        return <MobileLegendsGame />;
      case 'pacman':
        return <PacmanGame />;
      case 'mortal-kombat':
        return <MortalKombatGame />;
      case 'game':
      case 'combat':
      case 'visiting_ally':
      default:
        return <EmpiresAndAlliesGame />;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans">
      <GameLoadingScreen />
      <Suspense
        fallback={
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-300">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-400">
              Loading Module...
            </p>
          </div>
        }
      >
        {renderContent()}
      </Suspense>
    </div>
  );
};

export default App;
