const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  resizeWindow: (mode) => ipcRenderer.send('resize-window-for-screenshare', mode),
  showWindow: () => ipcRenderer.send('show-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', { deltaX, deltaY }),
  startDrag: () => ipcRenderer.send('start-window-drag'),
  dragMove: (deltaX, deltaY) => ipcRenderer.send('drag-move', { deltaX, deltaY }),
  endDrag: () => ipcRenderer.send('end-window-drag'),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
});

// Flag for desktop app mode in React
window.__IS_DESKTOP__ = true;
