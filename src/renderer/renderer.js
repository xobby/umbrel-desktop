const form = document.getElementById("connection-form");
const ipInput = document.getElementById("ip-input");
const portInput = document.getElementById("port-input");
const formError = document.getElementById("form-error");
const setupPanel = document.getElementById("setup-panel");
const wallpaper = document.getElementById("wallpaper");
const serverButton = document.getElementById("server-btn");
const serverMenu = document.getElementById("server-menu");
const menuConnect = document.getElementById("menu-connect");
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
const settingsReset = document.getElementById("settings-reset");
const dataPersistenceToggle = document.getElementById("data-persistence-toggle");
const titlebarActions = document.querySelector(".titlebar__actions");
const titlebarTabs = document.getElementById("titlebar-tabs");
const resetConfirmModal = document.getElementById("reset-confirm-modal");
const resetConfirmBackdrop = document.getElementById("reset-confirm-backdrop");
const resetConfirmClose = document.getElementById("reset-confirm-close");
const resetConfirmCancel = document.getElementById("reset-confirm-cancel");
const resetConfirmOk = document.getElementById("reset-confirm-ok");
const externalLinkModal = document.getElementById("external-link-modal");
const externalLinkBackdrop = document.getElementById("external-link-backdrop");
const externalLinkClose = document.getElementById("external-link-close");
const externalLinkCancel = document.getElementById("external-link-cancel");
const externalLinkConfirm = document.getElementById("external-link-confirm");
const externalLinkUrl = document.getElementById("external-link-url");

let umbrelWebview = null;
let activeMode = "setup";
let appSettings = {
  dataPersistence: true
};
let tabs = [];
let activeTabId = null;
let tabSequence = 0;
let tabTransitionTimer = null;
let tabsHideTimer = null;
let pendingExternalUrl = null;

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

function getTabTitle(url, fallback = "Umbrel") {
  try {
    const parsed = new URL(url);
    return parsed.hostname || fallback;
  } catch {
    return fallback;
  }
}

function isIpv4Host(hostname) {
  return ipv4Pattern.test(hostname);
}

function shouldOpenExternally(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }

    return !isIpv4Host(parsed.hostname);
  } catch {
    return true;
  }
}

function openExternalLinkModal(url) {
  pendingExternalUrl = url;
  externalLinkUrl.textContent = url;
  externalLinkModal.hidden = false;
}

function closeExternalLinkModal() {
  pendingExternalUrl = null;
  externalLinkModal.hidden = true;
}

async function confirmExternalLink() {
  if (!pendingExternalUrl) {
    return;
  }

  const url = pendingExternalUrl;
  closeExternalLinkModal();
  await window.umbrelDesktop.openExternal(url);
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

function openResetConfirmModal() {
  resetConfirmModal.hidden = false;
}

function closeResetConfirmModal() {
  resetConfirmModal.hidden = true;
}

function syncSettingsUi() {
  dataPersistenceToggle.setAttribute("aria-pressed", String(appSettings.dataPersistence));
  document.body.dataset.dataPersistence = String(appSettings.dataPersistence);
}

function getWebviewPartition() {
  return appSettings.dataPersistence ? "persist:umbrel" : "umbrel-temp";
}

function updateTabsVisibility() {
  if (tabsHideTimer) {
    window.clearTimeout(tabsHideTimer);
    tabsHideTimer = null;
  }

  if (activeMode !== "webview" || tabs.length === 0) {
    titlebarTabs.classList.remove("titlebar__tabs--visible", "titlebar__tabs--single");
    titlebarTabs.hidden = true;
    return;
  }

  titlebarTabs.hidden = false;

  if (tabs.length === 1) {
    titlebarTabs.classList.add("titlebar__tabs--single", "titlebar__tabs--visible");
    tabsHideTimer = window.setTimeout(() => {
      if (tabs.length === 1 && activeMode === "webview") {
        titlebarTabs.classList.remove("titlebar__tabs--visible");
        window.setTimeout(() => {
          if (tabs.length === 1 && activeMode === "webview") {
            titlebarTabs.hidden = true;
          }
        }, 180);
      }
      tabsHideTimer = null;
    }, 2000);
    return;
  }

  titlebarTabs.classList.remove("titlebar__tabs--single");
  titlebarTabs.classList.add("titlebar__tabs--visible");
}

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) ?? null;
}

function setActiveTab(tabId) {
  const previousTab = getActiveTab();
  const nextTab = tabs.find((tab) => tab.id === tabId) ?? null;

  if (!nextTab) {
    return;
  }

  if (previousTab?.id === nextTab.id) {
    activeTabId = tabId;
    nextTab.button.dataset.active = "true";
    nextTab.webview.hidden = false;
    nextTab.webview.classList.add("umbrel-webview--active");
    updateTabsVisibility();
    return;
  }

  if (tabTransitionTimer) {
    window.clearTimeout(tabTransitionTimer);
    tabTransitionTimer = null;
  }

  activeTabId = tabId;
  const previousIndex = previousTab ? tabs.findIndex((tab) => tab.id === previousTab.id) : -1;
  const nextIndex = tabs.findIndex((tab) => tab.id === nextTab.id);
  const direction = previousIndex === -1 || nextIndex > previousIndex ? "forward" : "backward";

  for (const tab of tabs) {
    const isActive = tab.id === tabId;
    tab.button.dataset.active = String(isActive);
  }

  nextTab.webview.hidden = false;
  nextTab.webview.classList.remove(
    "umbrel-webview--active",
    "umbrel-webview--enter-from-right",
    "umbrel-webview--enter-from-left",
    "umbrel-webview--exit-to-left",
    "umbrel-webview--exit-to-right"
  );

  if (!previousTab) {
    nextTab.webview.classList.add("umbrel-webview--active");
    updateTabsVisibility();
    return;
  }

  previousTab.webview.hidden = false;
  previousTab.webview.classList.remove(
    "umbrel-webview--enter-from-right",
    "umbrel-webview--enter-from-left",
    "umbrel-webview--exit-to-left",
    "umbrel-webview--exit-to-right"
  );

  if (direction === "forward") {
    nextTab.webview.classList.remove("umbrel-webview--active");
    nextTab.webview.classList.add("umbrel-webview--enter-from-right");
    previousTab.webview.classList.add("umbrel-webview--exit-to-left");
  } else {
    nextTab.webview.classList.remove("umbrel-webview--active");
    nextTab.webview.classList.add("umbrel-webview--enter-from-left");
    previousTab.webview.classList.add("umbrel-webview--exit-to-right");
  }

  window.requestAnimationFrame(() => {
    nextTab.webview.classList.add("umbrel-webview--active");
  });

  tabTransitionTimer = window.setTimeout(() => {
    previousTab.webview.hidden = true;
    previousTab.webview.classList.remove("umbrel-webview--exit-to-left", "umbrel-webview--exit-to-right");
    nextTab.webview.classList.remove("umbrel-webview--enter-from-right", "umbrel-webview--enter-from-left");
    tabTransitionTimer = null;
  }, 320);

  updateTabsVisibility();
}

function updateTabButton(tab) {
  tab.button.innerHTML = "";

  const label = document.createElement("span");
  label.className = "titlebar__tab-label";
  label.textContent = tab.title;
  label.title = tab.url;
  tab.button.append(label);

  if (tab.closable) {
    const close = document.createElement("button");
    close.className = "titlebar__tab-close";
    close.type = "button";
    close.setAttribute("aria-label", `Close ${tab.title} tab`);
    close.innerHTML = "<span></span>";
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    tab.button.append(close);
  }

  tab.button.title = tab.url;
}

function closeTab(tabId) {
  const index = tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) {
    return;
  }

  const [tab] = tabs.splice(index, 1);
  const wasActive = activeTabId === tabId;

  tab.button.classList.add("titlebar__tab--closing");
  window.setTimeout(() => {
    tab.button.remove();
  }, 180);
  tab.webview.remove();

  if (tabs.length === 0) {
    activeTabId = null;
    umbrelWebview = null;
    updateTabsVisibility();
    return;
  }

  if (wasActive) {
    const fallbackTab = tabs[Math.max(index - 1, 0)] ?? tabs[0];
    setActiveTab(fallbackTab.id);
    umbrelWebview = fallbackTab.webview;
  } else {
    updateTabsVisibility();
  }
}

function createTab(url, { title, activateWhenReady = false } = {}) {
  const id = `tab-${++tabSequence}`;
  const button = document.createElement("button");
  button.className = "titlebar__tab";
  button.type = "button";

  const webview = document.createElement("webview");
  webview.id = `umbrel-webview-${id}`;
  webview.className = "umbrel-webview";
  webview.setAttribute("partition", getWebviewPartition());
  webview.setAttribute("allowpopups", "true");

  const tab = {
    id,
    url,
    title: title || getTabTitle(url),
    button,
    webview,
    closable: tabs.length > 0,
    pendingActivation: activateWhenReady
  };

  button.addEventListener("click", () => {
    setActiveTab(id);
  });

  updateTabButton(tab);
  titlebarTabs.appendChild(button);
  webviewShell.appendChild(webview);
  attachWebviewEvents(webview, tab);
  webview.setAttribute("src", url);
  tabs.push(tab);
  window.requestAnimationFrame(() => {
    button.classList.add("titlebar__tab--visible");
  });

  if (!activateWhenReady) {
    setActiveTab(id);
  } else {
    updateTabsVisibility();
  }

  return tab;
}

function resetTabs() {
  for (const tab of tabs) {
    tab.button.remove();
    tab.webview.remove();
  }

  tabs = [];
  activeTabId = null;
  umbrelWebview = null;
  titlebarTabs.replaceChildren();
  updateTabsVisibility();
}

function ensureTabForUrl(url, options = {}) {
  const existing = tabs.find((tab) => tab.url === url);
  if (existing) {
    setActiveTab(existing.id);
    return existing;
  }

  return createTab(url, options);
}

function attachWebviewEvents(webview, tab) {
  webview.addEventListener("new-window", (event) => {
    if (!event.url) {
      return;
    }

    if (shouldOpenExternally(event.url)) {
      openExternalLinkModal(event.url);
      return;
    }

    showWebviewMode(event.url, { activateWhenReady: true });
  });

  webview.addEventListener("did-stop-loading", () => {
    if (!tab.pendingActivation) {
      return;
    }

    tab.pendingActivation = false;
    setActiveTab(tab.id);
  });

  webview.addEventListener("page-title-updated", (event) => {
    if (event.title) {
      document.title = event.title;
      tab.title = event.title;
      updateTabButton(tab);
    }
  });

  webview.addEventListener("did-navigate", (event) => {
    if (!event.isMainFrame) {
      return;
    }

    tab.url = event.url;
    if (!tab.title || tab.title === "Umbrel" || tab.title === getTabTitle(tab.url)) {
      tab.title = getTabTitle(event.url);
      updateTabButton(tab);
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
  const activeTab = getActiveTab();
  umbrelWebview = activeTab?.webview ?? null;
  return umbrelWebview;
}

function showSetupMode(connection) {
  activeMode = "setup";
  document.body.dataset.mode = "setup";
  webviewShell.hidden = true;
  content.hidden = false;
  updateTabsVisibility();
  clearError();
  setLoadingState(false);
  ipInput.value = connection?.ip ?? "";
  portInput.value = connection?.port && Number(connection.port) !== 80 ? String(connection.port) : "";
}

function showWebviewMode(url, options = {}) {
  activeMode = "webview";
  document.body.dataset.mode = "webview";
  content.hidden = true;
  webviewShell.hidden = false;
  const activeTab = ensureTabForUrl(url, options);
  umbrelWebview = activeTab.webview;
  updateTabsVisibility();
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
settingsReset.addEventListener("click", () => {
  openResetConfirmModal();
});
resetConfirmClose.addEventListener("click", closeResetConfirmModal);
resetConfirmBackdrop.addEventListener("click", closeResetConfirmModal);
resetConfirmCancel.addEventListener("click", closeResetConfirmModal);
resetConfirmOk.addEventListener("click", async () => {
  closeResetConfirmModal();
  closeSettingsModal();
  await window.umbrelDesktop.resetConnection();
  showSetupMode(null);
});
externalLinkClose.addEventListener("click", closeExternalLinkModal);
externalLinkBackdrop.addEventListener("click", closeExternalLinkModal);
externalLinkCancel.addEventListener("click", closeExternalLinkModal);
externalLinkConfirm.addEventListener("click", () => {
  confirmExternalLink();
});

dataPersistenceToggle.addEventListener("click", async () => {
  appSettings = await window.umbrelDesktop.updateSettings({
    dataPersistence: !appSettings.dataPersistence
  });
  syncSettingsUi();

  if (activeMode === "webview") {
    const url = await window.umbrelDesktop.getConnectionUrl();
    if (url) {
      resetTabs();
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
    closeResetConfirmModal();
    closeExternalLinkModal();
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

window.umbrelDesktop.onWebviewNewTab(({ url }) => {
  if (!url) {
    return;
  }

  if (shouldOpenExternally(url)) {
    openExternalLinkModal(url);
    return;
  }

  showWebviewMode(url, { activateWhenReady: true });
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
    resetTabs();
    showWebviewMode(url);
    return;
  }

  showSetupMode(connection);
});
