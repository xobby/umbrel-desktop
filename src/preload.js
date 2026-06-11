const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("umbrelDesktop", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  toggleFullscreen: () => ipcRenderer.invoke("window:toggle-fullscreen"),
  getWindowState: () => ipcRenderer.invoke("window:get-state"),
  saveConnection: (connection) => ipcRenderer.invoke("connection:save", connection),
  resetConnection: () => ipcRenderer.invoke("connection:reset"),
  openSettings: () => ipcRenderer.invoke("connection:open-settings"),
  getConnection: () => ipcRenderer.invoke("connection:get"),
  getConnectionUrl: () => ipcRenderer.invoke("connection:get-url"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (settings) => ipcRenderer.invoke("settings:update", settings),
  onSetupState: (callback) => ipcRenderer.on("setup-state", (_, payload) => callback(payload)),
  onWebviewError: (callback) => ipcRenderer.on("webview-error", (_, payload) => callback(payload)),
  onWebviewNewTab: (callback) => ipcRenderer.on("webview:new-tab", (_, payload) => callback(payload))
});
