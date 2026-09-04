import React, { useState } from 'react';
import { Clock, X, Coins, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';
import { SERVICE_JOBS } from '../data/jobs';
import { ServiceJob } from '../types';

export const JobsModal: React.FC = () => {
  const { closeModal, bays, ownedCars, activeCarId, startJob, collectJob } = useCarTownStore();
  const [selectedBayId, setSelectedBayId] = useState<number>(0);

  const selectedBay = bays.find((b) => b.bayId === selectedBayId) || bays[0];
  const activeCar = ownedCars.find((c) => c.id === activeCarId) || ownedCars[0];

  const handleStart = (job: ServiceJob) => {
    if (!activeCar) return;
    startJob(selectedBayId, job, activeCar.id);
  };

  const getRemainingTime = (startedAt: number, durationSeconds: number) => {
    const elapsed = (Date.now() - startedAt) / 1000;
    return Math.max(0, Math.ceil(durationSeconds - elapsed));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                Service Bay Jobs
              </h2>
              <p className="text-xs text-slate-400">
                Put mechanics to work for instant and passive garage income
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

        {/* Bay Selection Bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/30">
          {bays.map((bay) => {
            const isSelected = selectedBayId === bay.bayId;
            const isBusy = !!bay.currentJob;
            const remaining = bay.startedAt && bay.currentJob ? getRemainingTime(bay.startedAt, bay.currentJob.durationSeconds) : 0;
            const isDone = isBusy && remaining === 0;

            return (
              <button
                key={bay.bayId}
                onClick={() => setSelectedBayId(bay.bayId)}
                className={`flex-1 p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Lift Station #{bay.bayId + 1}
                  </span>
                  <div className="text-xs font-bold text-slate-100 mt-0.5">
                    {isDone ? '✅ Finished!' : isBusy ? `⏳ ${remaining}s left` : '🟢 Available'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedBay?.currentJob ? (
            <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
                🔧
              </div>
              <h3 className="text-lg font-black text-slate-100">
                {selectedBay.currentJob.title}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                {selectedBay.currentJob.description}
              </p>

              {selectedBay.startedAt &&
              getRemainingTime(selectedBay.startedAt, selectedBay.currentJob.durationSeconds) === 0 ? (
                <button
                  onClick={() => collectJob(selectedBay.bayId)}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition animate-bounce"
                >
                  <CheckCircle2 className="w-5 h-5" /> Collect Payout ($
                  {selectedBay.currentJob.payoutCoins.toLocaleString()} + {selectedBay.currentJob.xpReward} XP)
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                  <Clock className="w-4 h-4 animate-spin" />
                  Service in progress... (
                  {selectedBay.startedAt
                    ? getRemainingTime(selectedBay.startedAt, selectedBay.currentJob.durationSeconds)
                    : 0}
                  s)
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Available Service Contracts for Bay #{selectedBayId + 1}
              </h4>
              {SERVICE_JOBS.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
                      🛠️
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100">{job.title}</h5>
                      <p className="text-xs text-slate-400">{job.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-slate-400">
                        <span className="flex items-center gap-1 text-sky-400">
                          <Clock className="w-3 h-3" /> {job.durationSeconds}s
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Coins className="w-3 h-3" /> +${job.payoutCoins.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Sparkles className="w-3 h-3" /> +{job.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStart(job)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-md shadow-amber-500/20"
                  >
                    Assign Job <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
