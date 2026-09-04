import React, { useState } from 'react';
import { ShoppingBag, X, Zap, Gauge, DollarSign, Gem, Shield } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';
import { CAR_CATALOG } from '../data/cars';
import { CarCategory, CarModel } from '../types';

export const DealershipModal: React.FC = () => {
  const { closeModal, coins, bucks, level, buyCar, ownedCars } = useCarTownStore();
  const [selectedCategory, setSelectedCategory] = useState<CarCategory>('jdm');
  const [previewCar, setPreviewCar] = useState<CarModel>(CAR_CATALOG[0]);

  const categories: { id: CarCategory; label: string }[] = [
    { id: 'jdm', label: 'JDM Tuners' },
    { id: 'muscle', label: 'American Muscle' },
    { id: 'supercar', label: 'Supercars' },
    { id: 'classic', label: 'Classics' },
    { id: 'utility', label: 'Trucks & Custom' },
  ];

  const filteredCars = CAR_CATALOG.filter((c) => c.category === selectedCategory);

  const handleBuy = (car: CarModel) => {
    const success = buyCar(car);
    if (!success) {
      alert('Not enough cash, level, or Car Town bucks to buy this ride!');
    }
  };

  const isAlreadyOwned = (modelId: string) => ownedCars.some((c) => c.modelId === modelId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                Car Town Dealership
              </h2>
              <p className="text-xs text-slate-400">
                Official Car Showroom • New & Legendary Classics
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                const firstInCat = CAR_CATALOG.find((c) => c.category === cat.id);
                if (firstInCat) setPreviewCar(firstInCat);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Showroom Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Car List (Left column) */}
          <div className="md:col-span-7 space-y-3">
            {filteredCars.map((car) => {
              const owned = isAlreadyOwned(car.id);
              const locked = level < car.levelRequired;
              const isSelected = previewCar.id === car.id;

              return (
                <div
                  key={car.id}
                  onClick={() => setPreviewCar(car)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-lg font-bold shadow-inner"
                      style={{ backgroundColor: car.defaultColor }}
                    >
                      🏎️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-400">{car.brand}</span>
                        {locked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            Lvl {car.levelRequired}
                          </span>
                        )}
                        {owned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            Owned
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-100">{car.name}</h4>
                      <p className="text-xs text-slate-400">
                        {car.baseHp} HP • {car.baseTopSpeedMph} MPH Top
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-black text-amber-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      {car.priceCoins.toLocaleString()}
                    </div>
                    {car.priceBucks > 0 && (
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-sky-400">
                        <Gem className="w-3 h-3" />
                        {car.priceBucks} Bucks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Car Spec Inspector (Right column) */}
          <div className="md:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="h-32 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 flex items-center justify-center relative overflow-hidden mb-4">
                <div
                  className="w-32 h-14 rounded-lg shadow-2xl flex items-center justify-center text-3xl font-black text-white"
                  style={{ backgroundColor: previewCar.defaultColor }}
                >
                  🏁
                </div>
                <span className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {previewCar.category} CLASS
                </span>
              </div>

              <div className="mb-4">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  {previewCar.brand}
                </span>
                <h3 className="text-lg font-black text-slate-100">{previewCar.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {previewCar.description}
                </p>
              </div>

              {/* Specs Telemetry */}
              <div className="space-y-2.5 mb-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Horsepower
                    </span>
                    <span>{previewCar.baseHp} HP</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, (previewCar.baseHp / 1200) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-400" /> Top Speed
                    </span>
                    <span>{previewCar.baseTopSpeedMph} MPH</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full"
                      style={{ width: `${Math.min(100, (previewCar.baseTopSpeedMph / 270) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400" /> 0-60 MPH Acceleration
                    </span>
                    <span>{previewCar.baseAccel060}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.max(10, 100 - previewCar.baseAccel060 * 6)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase CTA */}
            <div>
              {isAlreadyOwned(previewCar.id) ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed"
                >
                  Already in Garage Fleet
                </button>
              ) : level < previewCar.levelRequired ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-amber-900/30 border border-amber-500/30 text-amber-400 font-bold text-sm cursor-not-allowed"
                >
                  Unlocks at Garage Level {previewCar.levelRequired}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(previewCar)}
                  disabled={coins < previewCar.priceCoins || bucks < previewCar.priceBucks}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-sky-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Buy Ride ({previewCar.priceCoins.toLocaleString()} Coins
                  {previewCar.priceBucks > 0 ? ` + ${previewCar.priceBucks} Bucks` : ''})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
