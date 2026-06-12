const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("myTimesheetDesktop", {
  isDesktop: true,
  loadRecentDataFile: () => ipcRenderer.invoke("data:loadRecent"),
  loadDataFileAtPath: (filePath) => ipcRenderer.invoke("data:loadAtPath", filePath),
  rememberDataFilePath: (filePath) => ipcRenderer.invoke("data:remember", filePath),
  openDataFile: () => ipcRenderer.invoke("data:open"),
  createDataFile: (payload) => ipcRenderer.invoke("data:create", payload),
  saveDataFile: (request) => ipcRenderer.invoke("data:save", request),
  exportDataFile: (payload) => ipcRenderer.invoke("data:export", payload)
});
