const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const StoreModule = require("electron-store");

const Store = StoreModule.default || StoreModule;
const store = new Store({
  defaults: {
    connection: null,
    settings: {
      dataPersistence: true
    }
  }
});

let mainWindow = null;

function buildUrl(connection) {
  const host = connection.ip.trim();
  const port = Number(connection.port) || 80;
  return `http://${host}:${port}/`;
}

function getConnection() {
  return store.get("connection");
}

function saveConnection(connection) {
  store.set("connection", {
    ip: connection.ip.trim(),
    port: Number(connection.port) || 80
  });
}

function clearConnection() {
  store.set("connection", null);
}

function getSettings() {
  return store.get("settings");
}

function saveSettings(settings) {
  const current = getSettings();
  const next = {
    ...current,
    ...settings,
    dataPersistence: settings.dataPersistence ?? current.dataPersistence
  };

  store.set("settings", next);
  return next;
}

async function clearPersistedSession() {
  const umbrelSession = session.fromPartition("persist:umbrel");
  await umbrelSession.clearStorageData();
  await umbrelSession.clearCache();
}

async function showSetup() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.getURL().startsWith("file://")) {
      mainWindow.webContents.send("setup-state", {
        connection: getConnection()
      });
      return;
    }

    await mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
    mainWindow.webContents.send("setup-state", {
      connection: getConnection()
    });
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    title: "Umbrel Desktop",
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0b111b",
    icon: path.join(__dirname, "..", "assets", "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpc() {
  ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.handle("window:toggle-maximize", () => {
    if (!mainWindow) {
      return { isMaximized: false };
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }

    return { isMaximized: mainWindow.isMaximized() };
  });

  ipcMain.handle("window:close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("window:get-state", () => ({
    isMaximized: mainWindow?.isMaximized() ?? false,
    isFullscreen: mainWindow?.isFullScreen() ?? false
  }));

  ipcMain.handle("window:toggle-fullscreen", () => {
    if (!mainWindow) {
      return { isFullscreen: false };
    }

    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return { isFullscreen: mainWindow.isFullScreen() };
  });

  ipcMain.handle("connection:save", (_, connection) => {
    saveConnection(connection);
    return { ok: true };
  });

  ipcMain.handle("connection:reset", async () => {
    clearConnection();
    await showSetup();
    return { ok: true };
  });

  ipcMain.handle("connection:get", () => getConnection());
  ipcMain.handle("connection:get-url", () => {
    const connection = getConnection();
    return connection ? buildUrl(connection) : null;
  });
  ipcMain.handle("settings:get", () => getSettings());
  ipcMain.handle("settings:update", async (_, settingsPatch) => {
    const previous = getSettings();
    const next = saveSettings(settingsPatch);

    if (previous.dataPersistence && !next.dataPersistence) {
      await clearPersistedSession();
    }

    return next;
  });

  ipcMain.handle("connection:open-settings", async () => {
    await showSetup();
    return { ok: true };
  });
}

app.whenReady().then(async () => {
  registerIpc();
  app.on("web-contents-created", (_, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  });
  createMainWindow();
  await showSetup();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      await showSetup();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
