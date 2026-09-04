import React from 'react';
import { useMobaStore } from '../../stores/mobaStore';

export const AnnouncerBanner: React.FC = () => {
  const activeBanners = useMobaStore((state) => state.activeBanners);

  if (activeBanners.length === 0) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30 select-none">
      {activeBanners.map((banner) => {
        const isBlue = banner.team === 'blue';
        return (
          <div
            key={banner.id}
            className="animate-in zoom-in-90 duration-200 flex flex-col items-center"
          >
            {/* Crown Embellishment */}
            <div className="text-xl -mb-1 animate-bounce">👑</div>

            <div
              className={`px-8 py-2 rounded-2xl border-2 shadow-2xl backdrop-blur-md flex flex-col items-center ${
                isBlue
                  ? 'bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 border-sky-400 text-sky-200 shadow-sky-500/30'
                  : 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-red-500 text-red-200 shadow-red-500/30'
              }`}
            >
              <div className="text-base font-black tracking-widest uppercase text-amber-400 drop-shadow-md">
                {banner.title}
              </div>
              <div className="text-xs font-semibold text-slate-300 drop-shadow">
                {banner.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
