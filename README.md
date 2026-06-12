<p align="center">
  <h1 style="text-align:center;">
    <img src="./assets/logo.ico" alt="VoidOS Logo" width="40" style="vertical-align:middle;"> 
    Umbrel Desktop
  </h1>
  <p align="center">
    A desktop client for connecting to your UmbrelOS server from Windows and Linux
    <br />
    UmbrelOS is required:
    <a href="https://umbrel.com/umbrelos"><strong>umbrel.com/umbrelos »</strong></a>
    <br />
    <br />
    Built with Electron, with a custom desktop shell, saved server connection, session persistence, and packaging support for Windows and Linux.
    <br />
    <br />
    <a href="https://github.com/xobby/umbrel-desktop">
      <img src="https://img.shields.io/github/stars/xobby/umbrel-desktop?style=social" />
    </a>
    <a href="https://github.com/xobby/umbrel-desktop/issues">
      <img src="https://img.shields.io/github/issues/xobby/umbrel-desktop" />
    </a>
    <a href="https://github.com/xobby/umbrel-desktop/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-111111" />
    </a>
  </p>
</p>

<br />

<p align="center">
Umbrel Desktop is a standalone desktop interface for opening and using your existing UmbrelOS server without relying on a normal browser tab.
</p>

<p align="center">
It provides a dedicated desktop experience with a custom window shell, quick server switching, optional session persistence, and packaging for native Windows and Linux distribution.
</p>

<p align="center">
Think of it as a lightweight UmbrelOS companion app, not the server itself.
</p>

<br />

## Features

- Connect to any UmbrelOS server by IP and port
- Custom desktop shell built with Electron
- Session persistence for UmbrelOS login cookies
- Dropdown controls for switching server, reset, settings, and fullscreen
- Randomized Umbrel-style wallpaper background on startup
- Exportable builds for Windows and Linux

## Getting started

### Development

```bash
npm install
npm run dev
```

On first launch, the app asks for:

- Umbrel server IP
- Port, defaulting to `80` if left empty

It then opens your UmbrelOS instance directly inside the desktop client.

## Building the app

This project supports packaging for both Windows and Linux with `electron-builder`.

### Available build commands

- `npm run pack`
- `npm run dist`
- `npm run dist:win`
- `npm run dist:linux`

### Build output

Build artifacts are generated in:

```text
release/
```

### Targets

- Windows: `nsis`, `portable`
- Linux: `AppImage`, `deb`

## Settings

Umbrel Desktop currently includes:

- `Data persistence`

When enabled, UmbrelOS login data is stored in cookies so the client can keep your session available for automatic login on the current device.

## Project structure

```text
src/
  main.js
  preload.js
  renderer/
assets/
scripts/
```

## Tech stack

- Electron
- electron-store
- electron-builder

## Disclaimer

Umbrel Desktop is a client for connecting to umbrelOS. It does not install, provision, or run umbrelOS itself.

For installing the actual server OS, visit:

- [umbrel.com](https://umbrel.com)
- [umbrelOS](https://umbrel.com/umbrelos)

## Future updates

I'm gonna rework the app and move to Tauri V2 Due to Electron being too resource expensive
<br>
If you have the same problem, shut up.
<br>
I know your PC can handle Electron. Mine can't. So, we are switching to Tauri.
