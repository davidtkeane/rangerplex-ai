"use strict";
const electron = require("electron");
const path = require("node:path");
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : path.join(__dirname, "../public");
let win;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  win = new electron.BrowserWindow({
    width: 450,
    height: 650,
    frame: true,
    // Enable native frame for menu bar
    transparent: false,
    backgroundColor: "#1a1a2e",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false
      // For easier prototyping of local node spawning
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST || __dirname, "index.html"));
  }
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
function createMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    // File Menu
    {
      label: "File",
      submenu: [
        {
          label: "New Connection",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            win == null ? void 0 : win.webContents.send("menu-action", "new-connection");
          }
        },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            win == null ? void 0 : win.webContents.send("menu-action", "settings");
          }
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    // Edit Menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    // View Menu
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    // Developer Menu
    {
      label: "Developer",
      submenu: [
        {
          role: "toggleDevTools",
          label: "Toggle Developer Tools",
          accelerator: "CmdOrCtrl+Shift+I"
        },
        { type: "separator" },
        {
          label: "View Console Logs",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => {
            win == null ? void 0 : win.webContents.openDevTools({ mode: "bottom" });
          }
        },
        {
          label: "Inspect Element",
          accelerator: "CmdOrCtrl+Shift+E",
          click: () => {
            win == null ? void 0 : win.webContents.inspectElement(0, 0);
          }
        },
        { type: "separator" },
        {
          label: "Clear Cache & Reload",
          click: async () => {
            if (win) {
              await win.webContents.session.clearCache();
              win.webContents.reload();
            }
          }
        }
      ]
    },
    // Help Menu
    {
      label: "Help",
      submenu: [
        {
          label: "About RangerChat Lite",
          click: () => {
            win == null ? void 0 : win.webContents.send("menu-action", "about");
          }
        },
        { type: "separator" },
        {
          label: "RangerPlex Website",
          click: async () => {
            await electron.shell.openExternal("https://rangerplex.com");
          }
        },
        {
          label: "Report Issue",
          click: async () => {
            await electron.shell.openExternal("https://github.com/anthropics/claude-code/issues");
          }
        }
      ]
    }
  ];
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}
electron.app.whenReady().then(() => {
  createMenu();
  createWindow();
});
