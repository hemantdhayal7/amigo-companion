const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  resizeWindow: (mode) => ipcRenderer.send('resize-window', mode),
  showWindow: () => ipcRenderer.send('show-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', { deltaX, deltaY }),
  startDrag: () => ipcRenderer.send('start-window-drag'),
  dragMove: (deltaX, deltaY) => ipcRenderer.send('drag-move', { deltaX, deltaY }),
  endDrag: () => ipcRenderer.send('end-window-drag'),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  setAppMode: (mode) => ipcRenderer.send('set-app-mode', mode),
});

window.__IS_DESKTOP__ = true;

window.addEventListener('error', (event) => {
  console.error('[UNCAUGHT ERROR TRACE]', event.error ? event.error.stack : event.message, 'at', event.filename, ':', event.lineno, ':', event.colno);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION TRACE]', event.reason ? (event.reason.stack || event.reason) : event);
});
