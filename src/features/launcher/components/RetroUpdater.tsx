import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  relaunchApp,
  AppUpdateInfo,
} from '@/services/updaterService';
import { soundManager } from '@/utils/audio';

interface RetroUpdaterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetroUpdater: React.FC<RetroUpdaterProps> = ({ isOpen, onClose }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger check when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsChecking(true);
    setErrorMessage(null);
    setIsSuccess(false);
    setDownloadProgress(null);
    setToastMessage(null);

    checkForAppUpdate('0.1.0')
      .then((info) => {
        if (!isMounted) return;
        setUpdateInfo(info);
        if (!info.available) {
          // Up to date! Show a toast and auto-close after 3.5 seconds
          setToastMessage('System is Up to Date (v0.1.0)');
          soundManager.playClick();
          const timer = setTimeout(() => {
            if (isMounted) onClose();
          }, 3500);
          return () => clearTimeout(timer);
        } else {
          soundManager.playHarvest();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err instanceof Error ? err.message : 'Failed to reach update server.');
        soundManager.playClick();
      })
      .finally(() => {
        if (isMounted) setIsChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    soundManager.playBuild();
    setErrorMessage(null);
    setDownloadProgress(0);

    try {
      await downloadAndInstallUpdate((downloaded, total) => {
        if (total > 0) {
          setDownloadProgress(Math.round((downloaded / total) * 100));
        }
      });
      setIsSuccess(true);
      soundManager.playVictory();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to download update package.');
      soundManager.playClick();
    } finally {
      setDownloadProgress(null);
    }
  };

  if (!isOpen) return null;

  // Render outside header via Portal to avoid any backdrop-blur containing block issue
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none font-mono">
      {/* If up to date: show a sleek compact retro notification */}
      {toastMessage && !updateInfo?.available && !isChecking && !errorMessage ? (
        <div className="bg-neutral-900 border-2 border-emerald-500/80 p-5 rounded-2xl max-w-sm w-full shadow-[0_0_40px_rgba(16,185,129,0.3)] text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-pixel text-[11px]">
            SYSTEM IS UP TO DATE
          </h3>
          <p className="text-xs text-neutral-300 mt-1.5 font-sans">
            Current version <span className="text-emerald-300 font-mono font-bold">v0.1.0</span> is synchronized with the MinIO release server.
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider transition border border-neutral-700 cursor-pointer"
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>
      ) : (
        /* Full dialog for Checking, Update Available, or Error */
        <div className="bg-neutral-950 border-2 border-amber-500/60 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Top Scanline accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <CloudDownload className="w-5 h-5 text-amber-400" />
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest font-pixel text-[10px]">
                ARCADE AUTO-UPDATER
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-5 space-y-4">
            {isChecking ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-neutral-300">Connecting to MinIO release server...</p>
                <span className="text-[10px] text-neutral-500">Checking releases.cekcok.my.id</span>
              </div>
            ) : errorMessage ? (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-200 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold text-red-300 uppercase">Update Check Failed</p>
                  <p className="text-red-300/80 text-[11px] mt-1 font-sans">{errorMessage}</p>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-3 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-pixel text-[11px]">
                  Update Installed Successfully!
                </h4>
                <p className="text-xs text-neutral-400 font-sans">
                  The latest version is installed. Restart the application now to apply updates.
                </p>
                <button
                  onClick={() => relaunchApp()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 cursor-pointer font-arcade"
                >
                  RESTART APPLICATION NOW
                </button>
              </div>
            ) : updateInfo && updateInfo.available ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      NEW VERSION: v{updateInfo.version}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Current: v{updateInfo.currentVersion}
                    </span>
                  </div>
                  {updateInfo.body && (
                    <p className="text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 font-sans leading-relaxed text-[11px]">
                      {updateInfo.body}
                    </p>
                  )}
                </div>

                {downloadProgress !== null ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Downloading update package...</span>
                      <span className="text-amber-400 font-bold">{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden border border-neutral-700">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-150 shadow-inner"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer font-arcade"
                  >
                    DOWNLOAD & INSTALL UPDATE
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer close button */}
          <div className="pt-2 border-t border-neutral-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider transition border border-neutral-800 cursor-pointer font-arcade"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
