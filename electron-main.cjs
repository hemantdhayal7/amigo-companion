const {
  app,
  BrowserWindow,
  screen,
  Tray,
  Menu,
  ipcMain,
  session,
  desktopCapturer,
  nativeImage,
  globalShortcut,
} = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('Amigo');

const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Linux GPU/Wayland fixes
if (isLinux) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('ozone-platform', 'x11');
  app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
}
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5173';

const iconPath = isLinux
  ? path.join(__dirname, 'src-tauri/icons/icon.png')
  : isMac
    ? path.join(__dirname, 'src-tauri/icons/icon.png')
    : path.join(__dirname, 'src-tauri/icons/icon.ico');

function createWindow() {
  const windowConfig = {
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: !isMac, // frameless on Mac (custom title bar), standard frame on Linux/Windows
    transparent: false,
    alwaysOnTop: false,
    resizable: true,
    hasShadow: true,
    skipTaskbar: false,
    backgroundColor: '#0F0F14',
    icon: iconPath,
    title: 'Amigo — Study Companion',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
    },
  };

  // Mac-specific: hidden title bar with traffic lights
  if (isMac) {
    windowConfig.titleBarStyle = 'hiddenInset';
    windowConfig.trafficLightPosition = { x: 16, y: 16 };
  }

  mainWindow = new BrowserWindow(windowConfig);
  mainWindow.center();

  // Grant media permissions
  const ses = mainWindow.webContents.session;
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'camera', 'microphone', 'notifications', 'display-capture'];
    callback(allowed.includes(permission));
  });
  ses.setPermissionCheckHandler(() => true);

  // Screen sharing
  ses.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer
      .getSources({ types: ['screen', 'window'] })
      .then((sources) => {
        if (sources.length > 0) {
          const primaryScreen = sources.find((s) => s.id.startsWith('screen:')) || sources[0];
          callback({ video: primaryScreen });
        } else {
          callback({});
        }
      })
      .catch((err) => {
        console.error('[Electron] Display media request error:', err);
        callback({});
      });
  });

  // Forward renderer console logs to Electron stdout for transparent debugging
  mainWindow.webContents.on('console-message', (event, ...args) => {
    let msg, line, sourceId;
    if (event && typeof event === 'object' && event.message !== undefined) {
      msg = event.message;
      line = event.line;
      sourceId = event.sourceId;
    } else {
      msg = args[1];
      line = args[2];
      sourceId = args[3];
    }
    const loc = sourceId ? ` [${sourceId.split('/').pop()}:${line}]` : '';
    console.log(`[Renderer]${loc} ${msg}`);
  });

  // Auto-retry if server is still binding port
  mainWindow.webContents.on('did-fail-load', (event, errorCode) => {
    console.log(`[Electron] Page failed to load (${errorCode}), retrying in 500ms...`);
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(APP_URL);
    }, 500);
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        if (mainWindow) mainWindow.loadURL(DEV_URL);
      }, 1000);
    });
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    let trayIcon;
    try {
      trayIcon = nativeImage.createFromPath(path.join(__dirname, 'src-tauri/icons/32x32.png'));
    } catch {
      trayIcon = nativeImage.createFromPath(iconPath);
    }

    // On Mac, resize tray icon to 16x16 for menu bar
    if (isMac) {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Amigo Study Companion');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide Amigo',
        click: () => {
          if (!mainWindow) { createWindow(); return; }
          mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus());
        },
      },
      { label: 'Reload', click: () => mainWindow?.reload() },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (!mainWindow) { createWindow(); return; }
      mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus());
    });
  } catch (err) {
    console.warn('[Amigo] Tray init warning:', err.message);
  }
}

// IPC handlers
ipcMain.handle('get-platform', () => process.platform);

ipcMain.on('resize-window', (event, mode) => {
  if (!mainWindow) return;
  if (mode === 'fullscreen' || mode === 'theater') {
    mainWindow.maximize();
  } else if (mode === 'compact') {
    mainWindow.unmaximize();
    mainWindow.setFullScreen(false);
    mainWindow.setSize(420, 740);
  }
});

ipcMain.on('set-app-mode', (event, mode) => {
  if (!mainWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  if (mode === 'desktop') {
    const deskWidth = Math.min(1280, Math.round(screenWidth * 0.9));
    const deskHeight = Math.min(850, Math.round(screenHeight * 0.9));
    const posX = Math.round((screenWidth - deskWidth) / 2);
    const posY = Math.round((screenHeight - deskHeight) / 2);
    mainWindow.unmaximize();
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSize(deskWidth, deskHeight);
    mainWindow.setPosition(posX, posY);
  } else if (mode === 'floating') {
    const floatWidth = 420;
    const floatHeight = 740;
    const posX = Math.max(10, screenWidth - floatWidth - 20);
    const posY = Math.max(10, screenHeight - floatHeight - 20);
    mainWindow.unmaximize();
    mainWindow.setSize(floatWidth, floatHeight);
    mainWindow.setPosition(posX, posY);
    mainWindow.setAlwaysOnTop(true);
  }
});

ipcMain.on('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle('is-maximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.handle('is-fullscreen', () => mainWindow?.isFullScreen() ?? false);

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
});

app.whenReady().then(async () => {
  if (isLinux) await new Promise((r) => setTimeout(r, 300));

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
