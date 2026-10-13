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
} = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

app.setName('Amigo');

// 1. Prevent Linux GPU process crashes on Wayland/XWayland
// Transparent frameless windows on Linux can trigger SIGSEGV (exit code 139) in GPU acceleration.
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
}
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Enforce single instance so multiple launches focus the running floating companion
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;
let serverProcess = null;

const iconPath = process.platform === 'win32'
  ? path.join(__dirname, 'src-tauri/icons/icon.ico')
  : path.join(__dirname, 'src-tauri/icons/icon.png');
const APP_URL = process.env.AMIGO_URL || 'http://localhost:4000';

function ensureServerRunning() {
  return new Promise((resolve) => {
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    const req = http.get('http://127.0.0.1:4000/api/health', (res) => {
      if (res.statusCode === 200) {
        console.log('[Electron] Server already active on port 4000');
        return done();
      }
      spawnLocalServer(done);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      spawnLocalServer(done);
    });
    req.on('error', () => {
      spawnLocalServer(done);
    });
  });
}

function spawnLocalServer(callback) {
  console.log('[Electron] Spawning Amigo server.js child process...');
  const serverPath = path.join(__dirname, 'server.js');
  try {
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: '4000' },
    });
  } catch (err) {
    try {
      serverProcess = spawn('node', [serverPath], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env, PORT: '4000' },
      });
    } catch (e) {
      console.error('[Electron] Failed to spawn server.js:', e);
    }
  }

  if (serverProcess) {
    serverProcess.on('error', (err) => {
      console.warn('[Electron] serverProcess warning:', err.message);
    });
  }

  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    const req = http.get('http://127.0.0.1:4000/api/health', (res) => {
      if (res.statusCode === 200) {
        clearInterval(poll);
        callback();
      }
    });
    req.on('error', () => {});
    if (attempts > 25) {
      clearInterval(poll);
      callback();
    }
  }, 200);
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const initialWidth = 420;
  const initialHeight = 740;
  const posX = Math.max(10, screenWidth - initialWidth - 20);
  const posY = Math.max(10, screenHeight - initialHeight - 20);

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth: 320,
    minHeight: 480,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    icon: iconPath,
    title: 'Amigo Study Companion 🥬',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false, // Prevent timers and calls from freezing when unfocused
    },
  });

  // Keep floating overlay above all workspace windows
  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } else {
    mainWindow.setAlwaysOnTop(true);
  }

  // Grant camera, microphone, and screen share permissions seamlessly
  const ses = mainWindow.webContents.session;
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'camera', 'microphone', 'notifications', 'display-capture'];
    callback(allowed.includes(permission));
  });

  ses.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  // Handle getDisplayMedia (screen sharing)
  ses.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer
      .getSources({ types: ['screen', 'window'] })
      .then((sources) => {
        if (sources.length > 0) {
          // Prefer entire primary display over arbitrary windows for full screen sharing
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

  // Auto-retry if server is still binding port
  mainWindow.webContents.on('did-fail-load', (event, errorCode) => {
    console.log(`[Electron] Page failed to load (${errorCode}), retrying in 500ms...`);
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(APP_URL);
    }, 500);
  });

  mainWindow.loadURL(APP_URL);

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

    tray = new Tray(trayIcon);
    tray.setToolTip('Amigo Study Companion 🥬');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide Amigo 🥬',
        click: () => {
          if (!mainWindow) {
            createWindow();
            return;
          }
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Reload App',
        click: () => {
          if (mainWindow) mainWindow.reload();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Amigo',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (!mainWindow) {
        createWindow();
        return;
      }
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('[Electron] Tray initialization warning:', err.message);
  }
}

// IPC Handlers for Window Movement and Resizing
ipcMain.handle('get-window-position', () => {
  if (!mainWindow) return [0, 0];
  return mainWindow.getPosition();
});

ipcMain.on('set-window-position', (event, { x, y }) => {
  if (!mainWindow) return;
  mainWindow.setPosition(Math.round(x), Math.round(y));
});

ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
  if (!mainWindow) return;
  const [currentX, currentY] = mainWindow.getPosition();
  mainWindow.setPosition(Math.round(currentX + deltaX), Math.round(currentY + deltaY));
});

ipcMain.on('resize-window-for-screenshare', (event, mode) => {
  if (!mainWindow) return;
  if (mode === 'fullscreen') {
    mainWindow.maximize();
  } else if (mode === 'theater') {
    mainWindow.unmaximize();
    mainWindow.setFullScreen(false);
    mainWindow.setSize(1060, 720);
    mainWindow.center();
  } else if (mode === 'compact') {
    mainWindow.unmaximize();
    mainWindow.setFullScreen(false);
    mainWindow.setSize(420, 740);
  }
});

ipcMain.on('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('toggle-window', () => {
  if (!mainWindow) {
    createWindow();
    return true;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    return false;
  } else {
    mainWindow.show();
    mainWindow.focus();
    return true;
  }
});

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
  await ensureServerRunning();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
