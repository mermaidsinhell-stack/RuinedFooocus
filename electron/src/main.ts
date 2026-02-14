import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { PythonManager } from './python-manager';
import { initAutoUpdater } from './updater';

const DEFAULT_PORT = 7865;

let splashWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let pythonManager: PythonManager | null = null;

function createSplashWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 500,
    height: 380,
    frame: false,
    transparent: false,
    resizable: false,
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'src', 'splash.html'));
  return win;
}

function createMainWindow(port: number): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}`);

  win.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    win.show();
  });

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

async function startBackend(): Promise<void> {
  pythonManager = new PythonManager(DEFAULT_PORT, {
    onProgress: (message) => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('progress', message);
      }
    },
    onReady: (port) => {
      mainWindow = createMainWindow(port);
      if (app.isPackaged) {
        initAutoUpdater(mainWindow);
      }
    },
    onError: (error) => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('error', error);
      }
    },
  });

  await pythonManager.initializeUserData();
  await pythonManager.start();
}

// IPC handlers
ipcMain.on('retry', async () => {
  if (pythonManager) {
    await pythonManager.stop();
  }
  await startBackend();
});

ipcMain.on('open-folder', (_event, folderKey: string) => {
  if (!pythonManager) return;
  const userDataDir = pythonManager.getUserDataDir();
  const folderMap: Record<string, string> = {
    models: path.join(userDataDir, 'models'),
    checkpoints: path.join(userDataDir, 'models', 'checkpoints'),
    loras: path.join(userDataDir, 'models', 'loras'),
    vae: path.join(userDataDir, 'models', 'vae'),
    wildcards: path.join(userDataDir, 'wildcards'),
    chatbots: path.join(userDataDir, 'chatbots'),
    llamas: path.join(userDataDir, 'llamas'),
    outputs: path.join(userDataDir, 'outputs'),
    settings: path.join(userDataDir, 'settings'),
  };
  const folder = folderMap[folderKey] || userDataDir;
  shell.openPath(folder);
});

// App lifecycle
app.whenReady().then(async () => {
  splashWindow = createSplashWindow();
  await startBackend();
});

app.on('window-all-closed', async () => {
  if (pythonManager) {
    await pythonManager.stop();
  }
  app.quit();
});

app.on('before-quit', async () => {
  if (pythonManager) {
    await pythonManager.stop();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
