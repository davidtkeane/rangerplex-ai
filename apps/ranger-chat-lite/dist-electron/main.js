"use strict";
const electron = require("electron");
const path$1 = require("node:path");
const https = require("node:https");
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
const RANGERBLOCK_HOME = path__namespace.join(os__namespace.homedir(), ".rangerblock");
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
  // NEW: Shared storage (all RangerBlock apps)
  sharedStorageDir;
  sharedIdentityFile;
  sharedKeysDir;
  sharedAppDir;
  // LEGACY: Electron userData (for backward compatibility)
  legacyStorageDir;
  legacyIdentityFile;
  personalDir;
  // RangerPlex compatible .personal folder
  constructor() {
    this.sharedStorageDir = path__namespace.join(RANGERBLOCK_HOME, "identity");
    this.sharedIdentityFile = path__namespace.join(this.sharedStorageDir, "master_identity.json");
    this.sharedKeysDir = path__namespace.join(RANGERBLOCK_HOME, "keys");
    this.sharedAppDir = path__namespace.join(RANGERBLOCK_HOME, "apps", "ranger-chat-lite");
    this.legacyStorageDir = path__namespace.join(electron.app.getPath("userData"), "identity");
    this.legacyIdentityFile = path__namespace.join(this.legacyStorageDir, "user_identity.json");
    this.personalDir = path__namespace.join(electron.app.getPath("userData"), ".personal");
    this.ensureDirectories();
    this.migrateFromLegacy();
  }
  ensureDirectories() {
    const sharedDirs = [
      RANGERBLOCK_HOME,
      this.sharedStorageDir,
      this.sharedKeysDir,
      this.sharedAppDir,
      path__namespace.join(RANGERBLOCK_HOME, "sync"),
      path__namespace.join(RANGERBLOCK_HOME, "security"),
      path__namespace.join(RANGERBLOCK_HOME, "sessions")
    ];
    for (const dir of sharedDirs) {
      if (!fs__namespace.existsSync(dir)) {
        fs__namespace.mkdirSync(dir, { recursive: true, mode: 448 });
      }
    }
    if (!fs__namespace.existsSync(this.legacyStorageDir)) {
      fs__namespace.mkdirSync(this.legacyStorageDir, { recursive: true });
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
   * Migrate from legacy Electron userData to shared ~/.rangerblock/
   */
  migrateFromLegacy() {
    if (fs__namespace.existsSync(this.legacyIdentityFile) && !fs__namespace.existsSync(this.sharedIdentityFile)) {
      try {
        console.log("[IdentityService] Migrating from legacy storage to ~/.rangerblock/");
        const legacyData = fs__namespace.readFileSync(this.legacyIdentityFile, "utf8");
        const legacyStorage = JSON.parse(legacyData);
        const identity = legacyStorage.identity || legacyStorage;
        fs__namespace.writeFileSync(this.sharedIdentityFile, JSON.stringify(identity, null, 2), { mode: 384 });
        const fingerprintFile = path__namespace.join(this.sharedStorageDir, "hardware_fingerprint.json");
        fs__namespace.writeFileSync(fingerprintFile, JSON.stringify({
          fingerprint: identity.hardwareFingerprint,
          recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platform: os__namespace.platform(),
          hostname: os__namespace.hostname()
        }, null, 2), { mode: 384 });
        const legacyKeysDir = path__namespace.join(this.personalDir, "keys");
        if (fs__namespace.existsSync(legacyKeysDir)) {
          const keyFiles = fs__namespace.readdirSync(legacyKeysDir);
          for (const keyFile of keyFiles) {
            const src = path__namespace.join(legacyKeysDir, keyFile);
            const dest = path__namespace.join(this.sharedKeysDir, keyFile.replace("rangercode_chat", "master"));
            if (!fs__namespace.existsSync(dest)) {
              fs__namespace.copyFileSync(src, dest);
              fs__namespace.chmodSync(dest, keyFile.includes("private") ? 384 : 420);
            }
          }
        }
        if (legacyStorage.settings) {
          const appSettingsFile = path__namespace.join(this.sharedAppDir, "settings.json");
          fs__namespace.writeFileSync(appSettingsFile, JSON.stringify(legacyStorage.settings, null, 2));
        }
        console.log("[IdentityService] Migration complete!");
      } catch (error) {
        console.error("[IdentityService] Migration failed:", error);
      }
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
   * Now supports both shared (~/.rangerblock/keys/) and legacy locations
   */
  generateKeypair(namePrefix) {
    const keysDir = namePrefix === "master" ? this.sharedKeysDir : path__namespace.join(this.personalDir, "keys");
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
    fs__namespace.writeFileSync(privatePath, privateKey, { mode: 384 });
    fs__namespace.writeFileSync(publicPath, publicKey, { mode: 420 });
  }
  /**
   * Load existing identity or return null
   * Checks shared storage first, then legacy
   */
  loadIdentity() {
    try {
      if (fs__namespace.existsSync(this.sharedIdentityFile)) {
        const data = fs__namespace.readFileSync(this.sharedIdentityFile, "utf8");
        const identity = JSON.parse(data);
        const settingsFile = path__namespace.join(this.sharedAppDir, "settings.json");
        let settings = {
          theme: "classic",
          soundEnabled: true,
          notificationsEnabled: true
        };
        if (fs__namespace.existsSync(settingsFile)) {
          settings = JSON.parse(fs__namespace.readFileSync(settingsFile, "utf8"));
        }
        let stats = {
          messagesSent: identity.messagesSent || 0,
          sessionsCount: identity.sessionsCount || 1,
          firstSeen: identity.created
        };
        return { identity, settings, stats };
      }
      if (fs__namespace.existsSync(this.legacyIdentityFile)) {
        const data = fs__namespace.readFileSync(this.legacyIdentityFile, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading identity:", error);
    }
    return null;
  }
  /**
   * Save identity to storage and create RangerPlex-compatible files
   * Now saves to shared ~/.rangerblock/ storage
   */
  saveIdentity(identity, settings) {
    const finalSettings = settings || {
      theme: "classic",
      soundEnabled: true,
      notificationsEnabled: true
    };
    identity.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
    const publicKeyPath = path__namespace.join(this.sharedKeysDir, "master_public_key.pem");
    if (fs__namespace.existsSync(publicKeyPath) && !identity.publicKey) {
      identity.publicKey = fs__namespace.readFileSync(publicKeyPath, "utf8");
    }
    fs__namespace.writeFileSync(this.sharedIdentityFile, JSON.stringify(identity, null, 2), { mode: 384 });
    const appSettingsFile = path__namespace.join(this.sharedAppDir, "settings.json");
    fs__namespace.writeFileSync(appSettingsFile, JSON.stringify(finalSettings, null, 2));
    const legacyStorage = {
      identity,
      settings: finalSettings,
      stats: {
        messagesSent: identity.messagesSent || 0,
        sessionsCount: identity.sessionsCount || 1,
        firstSeen: identity.created
      }
    };
    fs__namespace.writeFileSync(this.legacyIdentityFile, JSON.stringify(legacyStorage, null, 2));
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
      publicKey: identity.publicKey,
      mission: {
        primary: "Transform disabilities into superpowers",
        philosophy: "One foot in front of the other - David Keane"
      }
    };
    const nodeIdentityPath = path__namespace.join(this.personalDir, "node_identity.json");
    fs__namespace.writeFileSync(nodeIdentityPath, JSON.stringify(nodeIdentity, null, 2));
    this.generateKeypair("master");
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
      fs__namespace.writeFileSync(this.legacyIdentityFile, JSON.stringify(storage, null, 2));
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
      fs__namespace.writeFileSync(this.legacyIdentityFile, JSON.stringify(existing, null, 2));
      return existing.identity;
    }
    const identity = this.generateIdentity(username);
    this.saveIdentity(identity);
    return identity;
  }
  /**
   * Check if identity exists (in shared or legacy storage)
   */
  hasIdentity() {
    return fs__namespace.existsSync(this.sharedIdentityFile) || fs__namespace.existsSync(this.legacyIdentityFile);
  }
  /**
   * Get storage paths (for Settings UI)
   */
  getPaths() {
    return {
      storageDir: this.legacyStorageDir,
      personalDir: this.personalDir,
      identityFile: this.sharedIdentityFile,
      sharedDir: RANGERBLOCK_HOME,
      keysDir: this.sharedKeysDir
    };
  }
  /**
   * Check if RangerPlex is installed
   */
  isRangerPlexInstalled() {
    const rangerplexPaths = [
      path__namespace.join(os__namespace.homedir(), ".rangerplex"),
      path__namespace.join(RANGERBLOCK_HOME, "apps", "rangerplex", "settings.json")
    ];
    return rangerplexPaths.some((p) => fs__namespace.existsSync(p));
  }
  /**
   * Get the public key for signing
   */
  getPublicKey() {
    const publicKeyPath = path__namespace.join(this.sharedKeysDir, "master_public_key.pem");
    if (fs__namespace.existsSync(publicKeyPath)) {
      return fs__namespace.readFileSync(publicKeyPath, "utf8");
    }
    return null;
  }
  /**
   * Sign a message with the private key
   */
  signMessage(message) {
    const privateKeyPath = path__namespace.join(this.sharedKeysDir, "master_private_key.pem");
    if (!fs__namespace.existsSync(privateKeyPath)) {
      return null;
    }
    try {
      const privateKey = fs__namespace.readFileSync(privateKeyPath, "utf8");
      const sign = crypto__namespace.createSign("sha256");
      sign.update(message);
      sign.end();
      return sign.sign(privateKey).toString("base64");
    } catch (error) {
      console.error("Error signing message:", error);
      return null;
    }
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
    if (fs__namespace.existsSync(this.legacyIdentityFile)) {
      fs__namespace.unlinkSync(this.legacyIdentityFile);
    }
    if (fs__namespace.existsSync(this.sharedIdentityFile)) {
      fs__namespace.unlinkSync(this.sharedIdentityFile);
    }
  }
}
const identityService = new IdentityService();
const APP_VERSION = "1.4.1";
const VERSIONS_URL = "https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/versions.json";
async function checkForUpdates() {
  return new Promise((resolve) => {
    const result = {
      updateAvailable: false,
      currentVersion: APP_VERSION,
      latestVersion: null
    };
    const timeout = setTimeout(() => {
      resolve(result);
    }, 5e3);
    https.get(VERSIONS_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        clearTimeout(timeout);
        try {
          const versions = JSON.parse(data);
          const latest = versions.components?.["ranger-chat-lite"]?.version;
          if (latest) {
            result.latestVersion = latest;
            result.notes = versions.latest?.notes;
            const currentParts = APP_VERSION.split(".").map(Number);
            const latestParts = latest.split(".").map(Number);
            for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
              const c = currentParts[i] || 0;
              const l = latestParts[i] || 0;
              if (c < l) {
                result.updateAvailable = true;
                break;
              }
              if (c > l) break;
            }
          }
        } catch (e) {
        }
        resolve(result);
      });
    }).on("error", () => {
      clearTimeout(timeout);
      resolve(result);
    });
  });
}
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
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
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
            win?.webContents.send("menu-action", "new-connection");
          }
        },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            win?.webContents.send("menu-action", "settings");
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
            win?.webContents.openDevTools({ mode: "bottom" });
          }
        },
        {
          label: "Inspect Element",
          accelerator: "CmdOrCtrl+Shift+E",
          click: () => {
            win?.webContents.inspectElement(0, 0);
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
            win?.webContents.send("menu-action", "about");
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
electron.ipcMain.handle("app:checkForUpdates", async () => {
  return checkForUpdates();
});
electron.ipcMain.handle("app:getVersion", () => {
  return APP_VERSION;
});
electron.app.whenReady().then(async () => {
  createMenu();
  createWindow();
  setTimeout(async () => {
    const updateInfo = await checkForUpdates();
    if (updateInfo.updateAvailable && win) {
      win.webContents.send("update-available", updateInfo);
      if (electron.Notification.isSupported()) {
        const notification = new electron.Notification({
          title: "RangerChat Update Available",
          body: `Version ${updateInfo.latestVersion} is available (you have ${updateInfo.currentVersion})`
        });
        notification.show();
      }
    }
  }, 3e3);
});
