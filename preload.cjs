const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  resizeWindow: (mode) => ipcRenderer.send('resize-window', mode),
  showWindow: () => ipcRenderer.send('show-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
});

window.__IS_DESKTOP__ = true;
