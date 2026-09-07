import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLauncherStore } from '../../stores/launcherStore';
import { useNavalGameStore } from './stores/useNavalGameStore';
import { NavalCanvas3D } from './components/3d/NavalCanvas3D';
import { NavalMainMenu } from './ui/NavalMainMenu';
import { ShipSelectModal } from './ui/ShipSelectModal';
import { BattleHUD } from './ui/BattleHUD';
import { GameOverModal } from './ui/GameOverModal';

export const NavalCombatGame: React.FC = () => {
  const exitToLauncher = useLauncherStore((state) => state.exitToLauncher);
  const stage = useNavalGameStore((state) => state.stage);
  const setStage = useNavalGameStore((state) => state.setStage);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D Scene */}
      <NavalCanvas3D />

      {/* Floating Back-to-Menu Button in Battle */}
      {stage === 'BATTLE' && (
        <div className="absolute top-4 left-4 z-30 pointer-events-auto">
          <button
            onClick={() => setStage('MAIN_MENU')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-xs font-bold text-amber-200 border border-amber-500/30 backdrop-blur-md transition cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Port Menu
          </button>
        </div>
      )}

      {/* UI Screens */}
      {stage === 'MAIN_MENU' && <NavalMainMenu onExitToLauncher={exitToLauncher} />}
      {stage === 'SHIP_SELECT' && <ShipSelectModal />}
      {(stage === 'BATTLE' || stage === 'VICTORY' || stage === 'DEFEAT') && <BattleHUD />}
      {(stage === 'VICTORY' || stage === 'DEFEAT') && <GameOverModal onExitToLauncher={exitToLauncher} />}
    </div>
  );
};

export default NavalCombatGame;
