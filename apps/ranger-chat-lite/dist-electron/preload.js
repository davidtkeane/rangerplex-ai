"use strict";
const electron = require("electron");
window.electronAPI = {
  identity: {
    has: () => electron.ipcRenderer.invoke("identity:has"),
    load: () => electron.ipcRenderer.invoke("identity:load"),
    getOrCreate: (username) => electron.ipcRenderer.invoke("identity:getOrCreate", username),
    generateUsername: () => electron.ipcRenderer.invoke("identity:generateUsername"),
    updateUsername: (newUsername) => electron.ipcRenderer.invoke("identity:updateUsername", newUsername),
    recordMessage: () => electron.ipcRenderer.invoke("identity:recordMessage"),
    getPaths: () => electron.ipcRenderer.invoke("identity:getPaths"),
    export: () => electron.ipcRenderer.invoke("identity:export"),
    reset: () => electron.ipcRenderer.invoke("identity:reset")
  },
  ledger: {
    init: () => electron.ipcRenderer.invoke("ledger:init"),
    getStatus: () => electron.ipcRenderer.invoke("ledger:getStatus"),
    addMessage: (msg) => electron.ipcRenderer.invoke("ledger:addMessage", msg),
    getBlocks: (page, limit) => electron.ipcRenderer.invoke("ledger:getBlocks", page, limit),
    getBlock: (index) => electron.ipcRenderer.invoke("ledger:getBlock", index),
    mineBlock: (validatorId) => electron.ipcRenderer.invoke("ledger:mineBlock", validatorId),
    exportChain: () => electron.ipcRenderer.invoke("ledger:exportChain"),
    getBalance: (userId) => electron.ipcRenderer.invoke("ledger:getBalance", userId)
  },
  admin: {
    getStatus: () => electron.ipcRenderer.invoke("admin:getStatus"),
    checkUserId: (userId) => electron.ipcRenderer.invoke("admin:checkUserId", userId),
    getRegistryPath: () => electron.ipcRenderer.invoke("admin:getRegistryPath")
  }
};
console.log("RangerChat Lite preload loaded - Identity, Ledger & Admin API ready");
