import React from 'react';
import { useLauncherStore } from './stores/launcherStore';
import {
  LauncherHeader,
  LauncherDashboard,
  SettingsModal,
  GameLoadingScreen,
} from './features/launcher';
import {
  EmpiresAndAlliesGame,
  CityVilleGame,
  TetrisGame,
  DynastyLegendsGame,
  RubikGame,
  SkyRaid,
  SpaceBlast,
  MotoRush,
  CrazyWheels,
  MiniGolf,
  BumperBrawl,
  SnowboardRush,
  BalloonFrenzy,
  FeedingFrenzy,
  PizzaFrenzy,
  SaloonShowdown,
  Insaniquarium,
  EightBallPool,
  NinjaSagaGame,
  NightclubCityGame,
  CarTownGame,
  SuperKartGame,
} from './games';

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
      {renderContent()}
    </div>
  );
};

export default App;
