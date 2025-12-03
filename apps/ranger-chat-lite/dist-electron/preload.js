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
  }
};
console.log("RangerChat Lite preload loaded - Identity API ready");
