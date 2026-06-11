const form = document.getElementById("connection-form");
const ipInput = document.getElementById("ip-input");
const portInput = document.getElementById("port-input");
const formError = document.getElementById("form-error");
const setupPanel = document.getElementById("setup-panel");
const wallpaper = document.getElementById("wallpaper");
const serverButton = document.getElementById("server-btn");
const serverMenu = document.getElementById("server-menu");
const menuConnect = document.getElementById("menu-connect");
const menuReset = document.getElementById("menu-reset");
const menuSettings = document.getElementById("menu-settings");
const menuFullscreen = document.getElementById("menu-fullscreen");
const minimizeButton = document.getElementById("minimize-btn");
const maximizeButton = document.getElementById("maximize-btn");
const closeButton = document.getElementById("close-btn");
const content = document.querySelector(".content");
const webviewShell = document.getElementById("webview-shell");
const settingsModal = document.getElementById("settings-modal");
const settingsBackdrop = document.getElementById("settings-backdrop");
const settingsClose = document.getElementById("settings-close");
const dataPersistenceToggle = document.getElementById("data-persistence-toggle");
const titlebarActions = document.querySelector(".titlebar__actions");

let umbrelWebview = null;
let activeMode = "setup";
let appSettings = {
  dataPersistence: true
};

const backgroundImages = [
  "../../assets/backgrounds/1.jpg",
  "../../assets/backgrounds/2.jpg",
  "../../assets/backgrounds/3.jpg",
  "../../assets/backgrounds/4.jpg",
  "../../assets/backgrounds/5.jpg",
  "../../assets/backgrounds/6.jpg",
  "../../assets/backgrounds/7.jpg",
  "../../assets/backgrounds/8.jpg",
  "../../assets/backgrounds/9.jpg",
  "../../assets/backgrounds/10.jpg",
  "../../assets/backgrounds/11.jpg",
  "../../assets/backgrounds/12.jpg",
  "../../assets/backgrounds/13.jpg",
  "../../assets/backgrounds/14.jpg",
  "../../assets/backgrounds/15.jpg",
  "../../assets/backgrounds/16.jpg",
  "../../assets/backgrounds/17.jpg",
  "../../assets/backgrounds/18.jpg",
  "../../assets/backgrounds/19.jpg",
  "../../assets/backgrounds/20.jpg",
  "../../assets/backgrounds/21.jpg",
  "../../assets/backgrounds/22.jpg"
];

const ipv4Pattern =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)$/;

function showError(message) {
  formError.hidden = false;
  formError.textContent = message;
}

function clearError() {
  formError.hidden = true;
  formError.textContent = "";
}

function setLoadingState(isLoading) {
  setupPanel.dataset.loading = String(isLoading);
  ipInput.disabled = isLoading;
  portInput.disabled = isLoading;
}

function applyRandomBackground() {
  const backgroundPath = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
  wallpaper.style.backgroundImage = `url("${backgroundPath}")`;
}

function scheduleWindowControlsReveal() {
  titlebarActions.classList.remove("titlebar__actions--visible");
  window.setTimeout(() => {
    titlebarActions.classList.add("titlebar__actions--visible");
  }, 2000);
}

function validateConnection(ip, port) {
  if (!ipv4Pattern.test(ip)) {
    return "Insert a valid IPv4 address, for example 192.168.1.42.";
  }

  if (!port) {
    return null;
  }

  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return "The port must be between 1 and 65535.";
  }

  return null;
}

function openServerMenu() {
  serverMenu.classList.remove("titlebar__dropdown--closing");
  serverMenu.hidden = false;
  serverButton.setAttribute("aria-expanded", "true");
}

function closeServerMenu() {
  if (serverMenu.hidden) {
    return;
  }

  serverMenu.classList.add("titlebar__dropdown--closing");
  serverButton.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    serverMenu.hidden = true;
    serverMenu.classList.remove("titlebar__dropdown--closing");
  }, 180);
}

function toggleServerMenu() {
  if (serverMenu.hidden) {
    openServerMenu();
  } else {
    closeServerMenu();
  }
}

function openSettingsModal() {
  closeServerMenu();
  settingsModal.hidden = false;
}

function closeSettingsModal() {
  settingsModal.hidden = true;
}

function syncSettingsUi() {
  dataPersistenceToggle.setAttribute("aria-pressed", String(appSettings.dataPersistence));
  document.body.dataset.dataPersistence = String(appSettings.dataPersistence);
}

function getWebviewPartition() {
  return appSettings.dataPersistence ? "persist:umbrel" : "umbrel-temp";
}

function attachWebviewEvents(webview) {
  webview.addEventListener("page-title-updated", (event) => {
    if (event.title) {
      document.title = event.title;
    }
  });

  webview.addEventListener("did-fail-load", (event) => {
    if (!event.isMainFrame || event.errorCode === -3) {
      return;
    }

    showSetupMode({
      ip: ipInput.value.trim(),
      port: portInput.value.trim() || 80
    });
    showError(`Failed to load ${event.validatedURL}: ${event.errorDescription}`);
  });
}

function ensureWebview() {
  const expectedPartition = getWebviewPartition();

  if (umbrelWebview && umbrelWebview.getAttribute("partition") === expectedPartition) {
    return umbrelWebview;
  }

  if (umbrelWebview) {
    umbrelWebview.remove();
    umbrelWebview = null;
  }

  umbrelWebview = document.createElement("webview");
  umbrelWebview.id = "umbrel-webview";
  umbrelWebview.className = "umbrel-webview";
  umbrelWebview.setAttribute("partition", expectedPartition);
  webviewShell.replaceChildren(umbrelWebview);
  attachWebviewEvents(umbrelWebview);
  return umbrelWebview;
}

function showSetupMode(connection) {
  activeMode = "setup";
  document.body.dataset.mode = "setup";
  webviewShell.hidden = true;
  content.hidden = false;
  clearError();
  setLoadingState(false);
  ipInput.value = connection?.ip ?? "";
  portInput.value = connection?.port && Number(connection.port) !== 80 ? String(connection.port) : "";
}

function showWebviewMode(url) {
  activeMode = "webview";
  document.body.dataset.mode = "webview";
  content.hidden = true;
  webviewShell.hidden = false;
  const webview = ensureWebview();
  if (webview.src !== url) {
    webview.setAttribute("src", url);
  }
}

minimizeButton.addEventListener("click", () => {
  window.umbrelDesktop.minimize();
});

maximizeButton.addEventListener("click", async () => {
  const { isMaximized } = await window.umbrelDesktop.toggleMaximize();
  document.body.dataset.maximized = String(isMaximized);
});

closeButton.addEventListener("click", () => {
  window.umbrelDesktop.close();
});

serverButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleServerMenu();
});

menuConnect.addEventListener("click", async () => {
  closeServerMenu();
  showSetupMode(await window.umbrelDesktop.getConnection());
  await window.umbrelDesktop.openSettings();
});

menuReset.addEventListener("click", async () => {
  closeServerMenu();
  await window.umbrelDesktop.resetConnection();
  showSetupMode(null);
});

menuSettings.addEventListener("click", () => {
  openSettingsModal();
});

menuFullscreen.addEventListener("click", async () => {
  closeServerMenu();
  const { isFullscreen } = await window.umbrelDesktop.toggleFullscreen();
  document.body.dataset.fullscreen = String(isFullscreen);
});

settingsClose.addEventListener("click", closeSettingsModal);
settingsBackdrop.addEventListener("click", closeSettingsModal);

dataPersistenceToggle.addEventListener("click", async () => {
  appSettings = await window.umbrelDesktop.updateSettings({
    dataPersistence: !appSettings.dataPersistence
  });
  syncSettingsUi();

  if (activeMode === "webview") {
    const url = await window.umbrelDesktop.getConnectionUrl();
    if (url) {
      showWebviewMode(url);
    }
  }
});

document.addEventListener("click", (event) => {
  if (!serverMenu.hidden && !event.target.closest(".titlebar__menu")) {
    closeServerMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeServerMenu();
    closeSettingsModal();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const ip = ipInput.value.trim();
  const port = portInput.value.trim();
  const error = validateConnection(ip, port);

  if (error) {
    showError(error);
    return;
  }

  setLoadingState(true);

  try {
    const normalizedPort = port || 80;
    await window.umbrelDesktop.saveConnection({
      ip,
      port: normalizedPort
    });
    showWebviewMode(`http://${ip}:${normalizedPort}/`);
  } catch {
    setLoadingState(false);
    showError("Unable to connect to the selected server.");
  }
});

window.umbrelDesktop.onSetupState(({ connection }) => {
  if (activeMode === "webview") {
    return;
  }

  showSetupMode(connection);
});

window.addEventListener("DOMContentLoaded", async () => {
  applyRandomBackground();
  scheduleWindowControlsReveal();
  const windowState = await window.umbrelDesktop.getWindowState();
  document.body.dataset.maximized = String(windowState.isMaximized);
  document.body.dataset.fullscreen = String(windowState.isFullscreen);
  appSettings = await window.umbrelDesktop.getSettings();
  syncSettingsUi();

  const connection = await window.umbrelDesktop.getConnection();
  const url = await window.umbrelDesktop.getConnectionUrl();

  if (url) {
    showWebviewMode(url);
    return;
  }

  showSetupMode(connection);
});
