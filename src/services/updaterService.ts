import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface AppUpdateInfo {
  available: boolean;
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
  rawUpdate?: Update | null;
}

let activeUpdateInstance: Update | null = null;

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const checkForAppUpdate = async (
  currentVersion = '0.1.0'
): Promise<AppUpdateInfo> => {
  if (!isTauriEnvironment()) {
    // Browser fallback simulation
    return {
      available: false,
      currentVersion,
      version: currentVersion,
      date: new Date().toISOString().split('T')[0],
      body: 'You are running the latest version of Cekcok Kotaku in web preview mode.',
      rawUpdate: null,
    };
  }

  try {
    const update = await check();

    if (update && update.available) {
      activeUpdateInstance = update;
      return {
        available: true,
        currentVersion: update.currentVersion,
        version: update.version,
        date: update.date,
        body: update.body || 'New game additions, engine performance enhancements, and bug fixes.',
        rawUpdate: update,
      };
    }

    activeUpdateInstance = null;
    return {
      available: false,
      currentVersion,
      version: currentVersion,
      date: new Date().toISOString().split('T')[0],
      body: 'Cekcok Kotaku is up to date.',
      rawUpdate: null,
    };
  } catch (err: unknown) {
    const errStr = String(err).toLowerCase();
    // If the MinIO server returns 404 or no valid release json exists yet, current is latest
    if (
      errStr.includes('valid release json') ||
      errStr.includes('404') ||
      errStr.includes('nosuchkey') ||
      errStr.includes('not found')
    ) {
      activeUpdateInstance = null;
      return {
        available: false,
        currentVersion,
        version: currentVersion,
        date: new Date().toISOString().split('T')[0],
        body: `Cekcok Kotaku v${currentVersion} is up to date.`,
        rawUpdate: null,
      };
    }

    console.error('Failed to check for updates from MinIO:', err);
    throw err;
  }
};

export const downloadAndInstallUpdate = async (
  onProgress?: (downloadedBytes: number, totalBytes: number) => void
): Promise<void> => {
  if (!isTauriEnvironment()) {
    // Simulated progressive download for browser UI testing
    let downloaded = 0;
    const total = 45 * 1024 * 1024; // 45 MB
    while (downloaded < total) {
      downloaded += 5 * 1024 * 1024;
      if (onProgress) onProgress(Math.min(downloaded, total), total);
      await new Promise((res) => setTimeout(res, 120));
    }
    return;
  }

  if (!activeUpdateInstance) {
    throw new Error('No pending update instance available to download.');
  }

  let totalBytes = 0;
  let downloadedBytes = 0;

  await activeUpdateInstance.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        totalBytes = event.data.contentLength || 0;
        downloadedBytes = 0;
        if (onProgress) onProgress(0, totalBytes);
        break;
      case 'Progress':
        downloadedBytes += event.data.chunkLength;
        if (onProgress) onProgress(downloadedBytes, totalBytes);
        break;
      case 'Finished':
        if (onProgress) onProgress(totalBytes, totalBytes);
        break;
    }
  });
};

export const relaunchApp = async (): Promise<void> => {
  if (!isTauriEnvironment()) {
    window.location.reload();
    return;
  }

  try {
    await relaunch();
  } catch {
    window.location.reload();
  }
};
