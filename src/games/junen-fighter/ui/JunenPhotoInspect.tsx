import { useJunenStore } from '../store';
import { PHOTO_VIEWS } from '../neighborhood';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface JunenPhotoInspectProps {
  onInspect: (index: number | null) => void;
}

export const JunenPhotoInspect = ({ onInspect }: JunenPhotoInspectProps) => {
  const photoView = useJunenStore((s) => s.photoView);

  if (photoView === null) return null;

  const currentView = PHOTO_VIEWS[photoView];

  return (
    <div className="absolute left-5 right-5 bottom-6 sm:left-10 sm:right-10 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-stone-950/85 border border-stone-700/60 backdrop-blur-md shadow-2xl text-stone-100 z-30 select-none">
      <div className="flex-1 min-w-[200px]">
        <strong className="block text-sm sm:text-base font-semibold text-amber-200">
          Photo {currentView.photo}: {currentView.label}
        </strong>
        <span className="block text-[11px] text-stone-400 mt-0.5">
          Photo-based viewpoint estimation · reference camera view
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onInspect((photoView + PHOTO_VIEWS.length - 1) % PHOTO_VIEWS.length)}
          className="flex items-center gap-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600/60 rounded-lg text-xs font-medium transition cursor-pointer text-stone-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={() => onInspect((photoView + 1) % PHOTO_VIEWS.length)}
          className="flex items-center gap-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600/60 rounded-lg text-xs font-medium transition cursor-pointer text-stone-200"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onInspect(null)}
          className="flex items-center gap-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg text-xs font-medium transition cursor-pointer ml-2"
        >
          <X className="w-4 h-4" />
          Exit View
        </button>
      </div>
    </div>
  );
};
