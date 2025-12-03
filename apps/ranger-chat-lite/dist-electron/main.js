"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const electron = require("electron");
const path$1 = require("node:path");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const os = require("os");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const crypto__namespace = /* @__PURE__ */ _interopNamespaceDefault(crypto);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const ADJECTIVES = [
  "Cosmic",
  "Cyber",
  "Digital",
  "Electric",
  "Quantum",
  "Turbo",
  "Mega",
  "Ultra",
  "Neo",
  "Techno",
  "Laser",
  "Plasma",
  "Atomic",
  "Hyper",
  "Super",
  "Epic",
  "Mystic",
  "Shadow",
  "Thunder",
  "Storm",
  "Frost",
  "Fire",
  "Neon",
  "Pixel",
  "Stealth",
  "Swift",
  "Rapid",
  "Sonic",
  "Wild",
  "Brave",
  "Noble",
  "Bold"
];
const NOUNS = [
  "Ranger",
  "Phoenix",
  "Dragon",
  "Wolf",
  "Falcon",
  "Tiger",
  "Hawk",
  "Eagle",
  "Knight",
  "Ninja",
  "Samurai",
  "Wizard",
  "Pilot",
  "Hacker",
  "Coder",
  "Agent",
  "Pioneer",
  "Explorer",
  "Voyager",
  "Seeker",
  "Hunter",
  "Guardian",
  "Sentinel",
  "Phantom",
  "Specter",
  "Raven",
  "Cobra",
  "Viper",
  "Panther",
  "Lion",
  "Bear"
];
class IdentityService {
  // RangerPlex compatible .personal folder
  constructor() {
    __publicField(this, "storageDir");
    __publicField(this, "identityFile");
    __publicField(this, "personalDir");
    this.storageDir = path__namespace.join(electron.app.getPath("userData"), "identity");
    this.identityFile = path__namespace.join(this.storageDir, "user_identity.json");
    this.personalDir = path__namespace.join(electron.app.getPath("userData"), ".personal");
    this.ensureDirectories();
  }
  ensureDirectories() {
    if (!fs__namespace.existsSync(this.storageDir)) {
      fs__namespace.mkdirSync(this.storageDir, { recursive: true });
    }
    if (!fs__namespace.existsSync(this.personalDir)) {
      fs__namespace.mkdirSync(this.personalDir, { recursive: true });
    }
    const keysDir = path__namespace.join(this.personalDir, "keys");
    if (!fs__namespace.existsSync(keysDir)) {
      fs__namespace.mkdirSync(keysDir, { recursive: true });
    }
  }
  /**
   * Generate a fun random username
   */
  generateRandomUsername() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
  }
  /**
   * Detect hardware fingerprint (cross-platform)
   */
  getHardwareFingerprint() {
    const platform = os__namespace.platform();
    let hardwareId = "";
    let details = {
      system: platform,
      machine: os__namespace.arch(),
      hostname: os__namespace.hostname()
    };
    try {
      if (platform === "darwin") {
        const output = child_process.execSync("system_profiler SPHardwareDataType", { encoding: "utf8" });
        const match = output.match(/Hardware UUID:\s*(.+)/);
        if (match) hardwareId = match[1].trim();
        try {
          const cpuOutput = child_process.execSync("sysctl -n machdep.cpu.brand_string", { encoding: "utf8" });
          details.cpu = cpuOutput.trim();
        } catch {
        }
      } else if (platform === "win32") {
        try {
          const output = child_process.execSync("wmic csproduct get uuid", { encoding: "utf8" });
          const lines = output.trim().split("\n");
          if (lines.length > 1) {
            hardwareId = lines[1].trim();
          }
        } catch {
          hardwareId = `${os__namespace.hostname()}-${os__namespace.userInfo().username}`;
        }
        try {
          const cpuOutput = child_process.execSync("wmic cpu get name", { encoding: "utf8" });
          const cpuLines = cpuOutput.trim().split("\n");
          if (cpuLines.length > 1) details.cpu = cpuLines[1].trim();
        } catch {
        }
      } else {
        try {
          hardwareId = fs__namespace.readFileSync("/etc/machine-id", "utf8").trim();
        } catch {
          hardwareId = `${os__namespace.hostname()}-${os__namespace.userInfo().username}`;
        }
      }
    } catch (error) {
      console.error("Hardware detection error:", error);
      hardwareId = `fallback-${os__namespace.hostname()}-${Date.now()}`;
    }
    const fingerprint = crypto__namespace.createHash("sha256").update(hardwareId + os__namespace.hostname() + os__namespace.userInfo().username).digest("hex").substring(0, 32);
    return { fingerprint, details };
  }
  /**
   * Generate a new user identity
   */
  generateIdentity(username) {
    const { fingerprint, details } = this.getHardwareFingerprint();
    const displayName = username || this.generateRandomUsername();
    const nodeId = `rangerplex_${displayName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${crypto__namespace.randomBytes(4).toString("hex")}`;
    const userId = `rclite_${fingerprint.substring(0, 16)}`;
    const identity = {
      userId,
      nodeId,
      username: displayName,
      created: (/* @__PURE__ */ new Date()).toISOString(),
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      hardwareFingerprint: fingerprint,
      platform: {
        system: details.system,
        machine: details.machine,
        hostname: details.hostname
      },
      version: "1.2.0",
      appType: "ranger-chat-lite"
    };
    return identity;
  }
  /**
   * Generate RSA keypair for message signing (RangerPlex compatible)
   */
  generateKeypair(namePrefix) {
    const keysDir = path__namespace.join(this.personalDir, "keys");
    const privatePath = path__namespace.join(keysDir, `${namePrefix}_private_key.pem`);
    const publicPath = path__namespace.join(keysDir, `${namePrefix}_public_key.pem`);
    if (fs__namespace.existsSync(privatePath) && fs__namespace.existsSync(publicPath)) {
      return;
    }
    const { publicKey, privateKey } = crypto__namespace.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });
    fs__namespace.writeFileSync(privatePath, privateKey);
    fs__namespace.writeFileSync(publicPath, publicKey);
  }
  /**
   * Load existing identity or return null
   */
  loadIdentity() {
    try {
      if (fs__namespace.existsSync(this.identityFile)) {
        const data = fs__namespace.readFileSync(this.identityFile, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading identity:", error);
    }
    return null;
  }
  /**
   * Save identity to storage and create RangerPlex-compatible files
   */
  saveIdentity(identity, settings) {
    const storage = {
      identity,
      settings: settings || {
        theme: "classic",
        soundEnabled: true,
        notificationsEnabled: true
      },
      stats: {
        messagesSent: 0,
        sessionsCount: 1,
        firstSeen: identity.created
      }
    };
    storage.identity.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
    fs__namespace.writeFileSync(this.identityFile, JSON.stringify(storage, null, 2));
    const nodeIdentity = {
      nodeID: identity.nodeId,
      nodeName: identity.username,
      nodeType: "lite-client",
      created: identity.created,
      hardwareFingerprint: identity.hardwareFingerprint,
      platform: identity.platform,
      version: identity.version,
      blockchain: "rangerplex",
      network: "rangerplex_mainnet",
      source: "ranger-chat-lite",
      mission: {
        primary: "Transform disabilities into superpowers",
        philosophy: "One foot in front of the other - David Keane"
      }
    };
    const nodeIdentityPath = path__namespace.join(this.personalDir, "node_identity.json");
    fs__namespace.writeFileSync(nodeIdentityPath, JSON.stringify(nodeIdentity, null, 2));
    this.generateKeypair("rangercode_chat");
  }
  /**
   * Update just the username (keep same userId/nodeId)
   */
  updateUsername(newUsername) {
    const storage = this.loadIdentity();
    if (!storage) return null;
    storage.identity.username = newUsername;
    storage.identity.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
    this.saveIdentity(storage.identity, storage.settings);
    return storage.identity;
  }
  /**
   * Increment message count
   */
  recordMessage() {
    const storage = this.loadIdentity();
    if (storage) {
      storage.stats.messagesSent++;
      fs__namespace.writeFileSync(this.identityFile, JSON.stringify(storage, null, 2));
    }
  }
  /**
   * Get or create identity
   */
  getOrCreateIdentity(username) {
    const existing = this.loadIdentity();
    if (existing) {
      existing.identity.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
      existing.stats.sessionsCount++;
      fs__namespace.writeFileSync(this.identityFile, JSON.stringify(existing, null, 2));
      return existing.identity;
    }
    const identity = this.generateIdentity(username);
    this.saveIdentity(identity);
    return identity;
  }
  /**
   * Check if identity exists
   */
  hasIdentity() {
    return fs__namespace.existsSync(this.identityFile);
  }
  /**
   * Get storage paths (for Settings UI)
   */
  getPaths() {
    return {
      storageDir: this.storageDir,
      personalDir: this.personalDir,
      identityFile: this.identityFile
    };
  }
  /**
   * Export identity for backup
   */
  exportIdentity() {
    const storage = this.loadIdentity();
    if (!storage) return null;
    return JSON.stringify(storage, null, 2);
  }
  /**
   * Reset identity (for testing/debugging)
   */
  resetIdentity() {
    if (fs__namespace.existsSync(this.identityFile)) {
      fs__namespace.unlinkSync(this.identityFile);
    }
  }
}
const identityService = new IdentityService();
process.env.DIST = path$1.join(__dirname, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : path$1.join(__dirname, "../public");
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
      preload: path$1.join(__dirname, "preload.js"),
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
    win.loadFile(path$1.join(process.env.DIST || __dirname, "index.html"));
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
electron.ipcMain.handle("identity:has", () => {
  return identityService.hasIdentity();
});
electron.ipcMain.handle("identity:load", () => {
  return identityService.loadIdentity();
});
electron.ipcMain.handle("identity:getOrCreate", (_, username) => {
  return identityService.getOrCreateIdentity(username);
});
electron.ipcMain.handle("identity:generateUsername", () => {
  return identityService.generateRandomUsername();
});
electron.ipcMain.handle("identity:updateUsername", (_, newUsername) => {
  return identityService.updateUsername(newUsername);
});
electron.ipcMain.handle("identity:recordMessage", () => {
  identityService.recordMessage();
});
electron.ipcMain.handle("identity:getPaths", () => {
  return identityService.getPaths();
});
electron.ipcMain.handle("identity:export", () => {
  return identityService.exportIdentity();
});
electron.ipcMain.handle("identity:reset", () => {
  identityService.resetIdentity();
});
electron.app.whenReady().then(() => {
  createMenu();
  createWindow();
});
