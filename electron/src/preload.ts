import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onProgress: (callback: (message: string) => void) => {
    ipcRenderer.on('progress', (_event, message: string) => callback(message));
  },
  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('error', (_event, error: string) => callback(error));
  },
  onReady: (callback: () => void) => {
    ipcRenderer.on('ready', () => callback());
  },
  retry: () => {
    ipcRenderer.send('retry');
  },
  openFolder: (folderKey: string) => {
    ipcRenderer.send('open-folder', folderKey);
  },
});
