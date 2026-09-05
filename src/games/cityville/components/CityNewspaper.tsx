// CityVille Retro Newspaper Ticker & The Daily Gazette Modal

import React from 'react';
import { Newspaper, X, TrendingUp, Heart } from 'lucide-react';
import { useCityThemeStore } from '../stores/cityThemeStore';
import { useCityEconomyStore } from '../economy/stores/cityEconomyStore';
import { useCityStore } from '../city-builder/stores/cityStore';

export const CityNewspaper: React.FC = () => {
  const { isNewspaperOpen, setIsNewspaperOpen, approvalRating } = useCityThemeStore();
  const { population, goods, level, coins } = useCityEconomyStore();
  const { buildings } = useCityStore();

  const residentialCount = buildings.filter((b) =>
    ['cozy_cottage', 'brick_townhouse', 'manor_estate'].includes(b.buildingTypeId)
  ).length;

  const businessCount = buildings.filter((b) =>
    ['corner_bakery', 'general_store', 'coffee_house', 'retro_cinema'].includes(b.buildingTypeId)
  ).length;

  const farmCount = buildings.filter((b) => b.buildingTypeId === 'farm_plot').length;

  return (
    <>
      {/* Bottom Retro Scrolling Ticker */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between h-7 px-3 bg-neutral-950/95 border-t-2 border-amber-500/40 text-amber-300 font-pixel text-[9px] shadow-lg overflow-hidden">
        <button
          onClick={() => setIsNewspaperOpen(true)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0"
        >
          <Newspaper className="w-3 h-3" />
          <span>DAILY HERALD</span>
        </button>

        <div className="flex-1 mx-4 overflow-hidden relative">
          <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-neutral-200">
            <span className="text-amber-300 font-bold">
              ★ METROPOLIS CHRONICLE ★
            </span>
            <span>
              MAYOR APPROVAL AT {approvalRating}%! CITIZENS REJOICE OVER NEW DEVELOPMENTS!
            </span>
            <span className="text-emerald-400">
              POPULATION: {population.toLocaleString()} CITIZENS ENJOYING URBAN PARKS!
            </span>
            <span className="text-cyan-300">
              COMMERCE REPORT: {businessCount} LOCAL BUSINESSES THRIVING!
            </span>
            <span className="text-yellow-300">
              AGRICULTURE: {farmCount} HARVEST PLOTS ACTIVE IN SUBURBS!
            </span>
            <span className="text-amber-400">
              SUPPLY ALERT: FREIGHT PORT SHIPS READY FOR NEXT SHIPMENT!
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[8px] font-mono text-neutral-400 flex-shrink-0">
          <span className="text-emerald-400 font-bold">● SIM 60FPS</span>
          <span>EDITION #95</span>
        </div>
      </footer>

      {/* Retro Newspaper Modal: The Daily Pixel Gazette */}
      {isNewspaperOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#faf6ea] text-[#1c1917] border-4 border-[#78350f] shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm p-6 overflow-y-auto max-h-[88vh] font-serif">
            {/* Close button */}
            <button
              onClick={() => setIsNewspaperOpen(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-[#e7dec3] text-[#78350f] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Newspaper Masthead */}
            <div className="text-center border-b-4 border-double border-[#1c1917] pb-3 mb-4">
              <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-[#57534e] uppercase border-b border-[#1c1917] pb-1 mb-2">
                <span>VOL. XCVII No. 42</span>
                <span className="font-bold">THE INDEPENDENT URBAN JOURNAL</span>
                <span>PRICE: 10 CENTS</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight font-serif uppercase">
                The Daily Metropolis
              </h1>
              <p className="text-[10px] tracking-widest uppercase italic text-[#78350f] mt-0.5">
                "Honesty, Industry, and Prosperity for Every Citizen"
              </p>
            </div>

            {/* Main Headline */}
            <div className="border-b-2 border-[#1c1917] pb-4 mb-4">
              <span className="inline-block px-1.5 py-0.5 bg-[#78350f] text-[#faf6ea] font-pixel text-[8px] tracking-wider uppercase mb-1">
                SPECIAL MAYORAL REPORT
              </span>
              <h2 className="text-2xl font-black leading-tight tracking-tight uppercase">
                Metropolis Booms Under Visionary Mayor: Population Hits {population}!
              </h2>
              <p className="text-xs text-[#44403c] italic mt-1">
                By Charles Montgomery, Senior City Correspondent
              </p>
            </div>

            {/* Two-Column Newspaper Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
              {/* Left Column: Story & Photo */}
              <div className="space-y-3">
                <div className="p-3 bg-[#ede5d0] border border-[#a8a29e] rounded">
                  <div className="flex items-center justify-between font-mono text-[9px] text-[#57534e] mb-1">
                    <span>MAYORAL APPROVAL</span>
                    <span className="font-bold text-[#15803d]">{approvalRating}% FAVORABLE</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#d6cbaf] rounded-full overflow-hidden border border-[#a8a29e]">
                    <div
                      className="h-full bg-[#15803d] transition-all"
                      style={{ width: `${approvalRating}%` }}
                    />
                  </div>
                </div>

                <p className="first-letter:text-3xl first-letter:font-black first-letter:float-left first-letter:mr-2">
                  DOWNTOWN — Citizens took to the paved boulevards this morning in celebration as municipal revenues and food reserves reached historic highs. With {residentialCount} occupied homes and {businessCount} active storefronts, our city is now considered the jewel of the territory.
                </p>

                <p>
                  "The mayor's economic policy of pairing suburban agriculture with downtown commerce is pure genius," remarked Chief Alderman Hawthorne during the morning briefing at City Hall.
                </p>
              </div>

              {/* Right Column: Key Metrics & Letters to the Editor */}
              <div className="space-y-3">
                <div className="p-3 bg-[#ede5d0] border border-[#a8a29e] rounded">
                  <h4 className="font-pixel text-[9px] uppercase tracking-wider text-[#78350f] mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> CITY LEDGER
                  </h4>
                  <div className="space-y-1 text-[11px] font-mono text-[#292524]">
                    <div className="flex justify-between">
                      <span>Municipal Treasury:</span>
                      <span className="font-bold text-[#b45309]">{coins.toLocaleString()} Coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goods in Warehouse:</span>
                      <span className="font-bold text-[#15803d]">{goods} Units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mayoral Level:</span>
                      <span className="font-bold text-[#4338ca]">Rank {level} Executive</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#a8a29e] pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-600" /> Letters to the Mayor
                  </h4>
                  <div className="space-y-2 text-[11px] italic text-[#44403c]">
                    <p className="border-l-2 border-[#78350f] pl-2">
                      "The fresh strawberry harvests from the suburban plots are simply exquisite. Thank you for keeping our bakeries well stocked!" — <span className="not-italic font-bold">Chef Pierre</span>
                    </p>
                    <p className="border-l-2 border-[#78350f] pl-2">
                      "Looking forward to the next cargo ship at the freight port. Onward to greater prosperity!" — <span className="not-italic font-bold">Harbormaster Jenkins</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-[#1c1917] mt-5 pt-3 flex items-center justify-between text-[10px] font-mono text-[#57534e]">
              <span>Printed in Metropolis on 100% Recycled Vintage Newsprint</span>
              <button
                onClick={() => setIsNewspaperOpen(false)}
                className="px-4 py-1 bg-[#78350f] text-[#faf6ea] font-pixel text-[8px] uppercase tracking-wider hover:bg-[#572605] rounded-sm cursor-pointer shadow"
              >
                CLOSE DISPATCH [X]
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
