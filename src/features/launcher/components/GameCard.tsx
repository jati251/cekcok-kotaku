import { Play, Clock, CheckCircle2 } from 'lucide-react';
import type { LauncherGame } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface GameCardProps {
  game: LauncherGame;
  onLaunch: (id: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onLaunch }) => {
  const isPlayable = game.status === 'playable';

  const getGradient = (id: string) => {
    switch (id) {
      case 'empires-and-allies':
        return 'from-amber-600/30 via-slate-900 to-slate-950 border-amber-500/40';
      case 'cityville':
        return 'from-blue-600/20 via-slate-900 to-slate-950 border-blue-500/30';
      default:
        return 'from-emerald-600/20 via-slate-900 to-slate-950 border-emerald-500/30';
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-6 rounded-2xl border bg-gradient-to-b ${getGradient(
        game.id
      )} shadow-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-2xl`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <Badge
            variant={isPlayable ? 'tactical' : 'default'}
            size="sm"
          >
            {isPlayable ? 'Ready to Play' : game.status === 'in_development' ? 'In Development' : 'Coming Soon'}
          </Badge>

          <span className="text-[11px] font-mono text-slate-400">
            {game.releaseYear}
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="mt-4">
          <h3 className="text-xl font-black text-slate-100 font-tactical tracking-wide">
            {game.title}
          </h3>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">
            {game.tagline}
          </p>
        </div>

        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          {game.description}
        </p>

        {/* Features Checklist */}
        <div className="mt-5 space-y-1.5">
          {game.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Action */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          Genre: <strong className="text-slate-200">{game.genre}</strong>
        </span>

        {isPlayable ? (
          <Button
            variant="tactical"
            size="md"
            icon={<Play className="w-4 h-4 fill-amber-50" />}
            onClick={() => onLaunch(game.id)}
            className="px-6 shadow-amber-500/30"
          >
            Launch Game
          </Button>
        ) : (
          <Button variant="secondary" size="md" disabled icon={<Clock className="w-4 h-4" />}>
            Stay Tuned
          </Button>
        )}
      </div>
    </div>
  );
};
