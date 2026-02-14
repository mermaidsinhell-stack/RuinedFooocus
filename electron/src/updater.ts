import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const INITIAL_CHECK_DELAY = 30 * 1000; // 30 seconds after startup

export function initAutoUpdater(mainWindow: BrowserWindow | null): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(
        `document.dispatchEvent(new CustomEvent('update-available', { detail: ${JSON.stringify({ version: info.version })} }))`
      );
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded and will be installed on next restart.`,
        buttons: ['Restart Now', 'Later'],
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err.message);
  });

  // Initial check after delay
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, INITIAL_CHECK_DELAY);

  // Periodic checks
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, UPDATE_CHECK_INTERVAL);
}
