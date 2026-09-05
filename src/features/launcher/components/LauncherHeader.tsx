import React, { useState } from 'react';
import {
  Gamepad2,
  Settings,
  Shield,
  LayoutGrid,
  Columns2,
  Volume2,
  VolumeX,
  Activity,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  relaunchApp,
  AppUpdateInfo,
} from '@/services/updaterService';

export const LauncherHeader: React.FC = () => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const {
    commanderName,
    rankTitle,
    openSettings,
    launcherLayoutMode,
    setLauncherLayoutMode,
    isMuted,
    toggleMute,
  } = useLauncherStore();

  const handleModeChange = (mode: 'studio' | 'grid') => {
    soundManager.playClick();
    setLauncherLayoutMode(mode);
  };

  const handleCheckUpdate = async () => {
    soundManager.playClick();
    setIsCheckingUpdate(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    setUpdateModalOpen(true);
    try {
      const info = await checkForAppUpdate('0.1.0');
      setUpdateInfo(info);
    } catch (e: unknown) {
      setUpdateError(e instanceof Error ? e.message : 'Gagal menghubungi server MinIO.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    soundManager.playClick();
    setUpdateError(null);
    setUpdateProgress(0);
    try {
      await downloadAndInstallUpdate((downloaded, total) => {
        if (total > 0) {
          setUpdateProgress(Math.round((downloaded / total) * 100));
        }
      });
      setUpdateSuccess(true);
    } catch (e: unknown) {
      setUpdateError(e instanceof Error ? e.message : 'Gagal mengunduh paket pembaruan.');
    } finally {
      setUpdateProgress(null);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 shrink-0 select-none z-20 shadow-xl shadow-black/40">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
          <Gamepad2 className="w-5 h-5" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-slate-100 via-indigo-200 to-amber-200 bg-clip-text text-transparent">
              CEKCOK ARCADE DECK
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
              CORE v2.5
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Hardware Accelerated · 60 FPS Native</span>
          </p>
        </div>
      </div>

      {/* Center Console Layout Switcher */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner shadow-black/60">
        <button
          onClick={() => handleModeChange('studio')}
          title="Station Detail View"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            launcherLayoutMode === 'studio'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>STATION</span>
        </button>

        <button
          onClick={() => handleModeChange('grid')}
          title="Arcade Cover Grid"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            launcherLayoutMode === 'grid'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>LIBRARY</span>
        </button>
      </div>

      {/* Gamer Profile & Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Check Update Button */}
        <button
          onClick={handleCheckUpdate}
          title="Check Updates from MinIO"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition cursor-pointer shadow-md text-xs font-bold"
        >
          <CloudDownload className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline">UPDATE</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            toggleMute();
          }}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer shadow-md"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Gamer Profile Card */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-md">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black text-xs">
              <Shield className="w-3.5 h-3.5 fill-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-100 leading-none">
                {commanderName}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                LVL 42
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              {rankTitle}
            </span>
          </div>
        </div>

        {/* Settings Terminal Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            openSettings();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer shadow-md active:scale-95"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">SETTINGS</span>
        </button>
      </div>

      {/* MinIO Updater Modal */}
      {updateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-indigo-950/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CloudDownload className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                  MinIO S3 Auto-Updater
                </h3>
              </div>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              {isCheckingUpdate ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-300">Menghubungi releases.cekcok.my.id...</p>
                </div>
              ) : updateError ? (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Gagal memeriksa pembaruan</p>
                    <p className="text-rose-300/80 text-[11px] mt-0.5">{updateError}</p>
                  </div>
                </div>
              ) : updateSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">Pembaruan Berhasil Diinstal!</h4>
                  <p className="text-xs text-slate-400">
                    Aplikasi siap dimulai ulang dengan versi terbaru.
                  </p>
                  <button
                    onClick={() => relaunchApp()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition"
                  >
                    Restart Aplikasi Sekarang
                  </button>
                </div>
              ) : updateInfo && updateInfo.available ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">
                        Versi Baru Tersedia: v{updateInfo.version}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Saat ini: v{updateInfo.currentVersion}
                      </span>
                    </div>
                    {updateInfo.body && (
                      <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2 rounded border border-slate-800 font-mono text-[11px]">
                        {updateInfo.body}
                      </p>
                    )}
                  </div>

                  {updateProgress !== null ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Mengunduh paket...</span>
                        <span>{updateProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-150"
                          style={{ width: `${updateProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleDownloadUpdate}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-indigo-600/30"
                    >
                      Unduh & Pasang Pembaruan
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-200">
                    Cekcok Kotaku Sudah Versi Terbaru
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Versi saat ini v0.1.0 tersinkronisasi dengan server rilis MinIO.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
