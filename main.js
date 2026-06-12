const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs/promises");
const path = require("path");

const DEFAULT_DATA_FILE_NAME = "timesheet-data.js";
const DATA_GLOBAL_NAME = "MY_TIMESHEET_DATA";
const CONFIG_FILE_NAME = "mytimesheet-config.json";

function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 780,
    minHeight: 620,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, "MyTimesheet.html"));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function registerIpcHandlers() {
  ipcMain.handle("data:loadRecent", loadRecentDataFile);
  ipcMain.handle("data:loadAtPath", loadDataFileAtPath);
  ipcMain.handle("data:remember", rememberDataFilePathHandler);
  ipcMain.handle("data:bundledPath", () => bundledDataFilePath());
  ipcMain.handle("data:open", openDataFile);
  ipcMain.handle("data:create", createDataFile);
  ipcMain.handle("data:save", saveDataFile);
  ipcMain.handle("data:export", exportDataFile);
}

async function loadDataFileAtPath(_event, filePath) {
  if (!filePath || typeof filePath !== "string") {
    return { ok: false, error: "No data file path provided." };
  }

  return readDataFile(filePath);
}

async function rememberDataFilePathHandler(_event, filePath) {
  if (!filePath || typeof filePath !== "string") {
    return { ok: false, error: "No data file path provided." };
  }

  await rememberDataFilePath(filePath);
  return { ok: true, filePath };
}

async function loadRecentDataFile() {
  const config = await readConfig();

  if (!config.dataFilePath) {
    return { ok: false, reason: "missing" };
  }

  if (path.resolve(config.dataFilePath) === path.resolve(bundledDataFilePath())) {
    return { ok: false, reason: "bundled" };
  }

  return readDataFile(config.dataFilePath);
}

async function openDataFile() {
  const result = await dialog.showOpenDialog({
    title: "Open timesheet data file",
    properties: ["openFile"],
    filters: dataFileFilters()
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { ok: false, canceled: true };
  }

  const filePath = result.filePaths[0];
  const dataFile = await readDataFile(filePath);

  if (dataFile.ok) {
    await rememberDataFilePath(filePath);
  }

  return dataFile;
}

function defaultDataFilePath() {
  return path.join(app.getPath("documents"), DEFAULT_DATA_FILE_NAME);
}

function bundledDataFilePath() {
  return path.join(__dirname, DEFAULT_DATA_FILE_NAME);
}

async function createDataFile(_event, payload) {
  const result = await dialog.showSaveDialog({
    title: "Create timesheet data file",
    defaultPath: defaultDataFilePath(),
    filters: dataFileFilters()
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  await writeDataFile(result.filePath, payload);
  await rememberDataFilePath(result.filePath);
  return dataFileResponse(result.filePath, payload);
}

async function saveDataFile(_event, request) {
  if (!request || !request.filePath) {
    return { ok: false, error: "No data file path provided." };
  }

  await writeDataFile(request.filePath, request.payload);
  await rememberDataFilePath(request.filePath);
  return dataFileResponse(request.filePath, request.payload);
}

async function exportDataFile(_event, payload) {
  const config = await readConfig();
  const defaultPath = config.dataFilePath || defaultDataFilePath();
  const result = await dialog.showSaveDialog({
    title: "Export timesheet data file",
    defaultPath,
    filters: dataFileFilters()
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  await writeDataFile(result.filePath, payload);
  await rememberDataFilePath(result.filePath);
  return dataFileResponse(result.filePath, payload);
}

async function readDataFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const data = parseDataFileContent(content);
    await rememberDataFilePath(filePath);
    return dataFileResponse(filePath, data);
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Could not read data file."
    };
  }
}

async function writeDataFile(filePath, payload) {
  await fs.writeFile(filePath, serializeDataFile(payload), "utf8");
}

function parseDataFileContent(content) {
  const trimmed = content.trim();

  if (!trimmed) {
    return emptyDataFile();
  }

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  const assignmentPattern = new RegExp(
    "^\\s*(?:window\\.)?" + DATA_GLOBAL_NAME + "\\s*=\\s*([\\s\\S]*?)\\s*;?\\s*$"
  );
  const match = assignmentPattern.exec(trimmed);

  if (!match) {
    throw new Error("Data file must define window." + DATA_GLOBAL_NAME + ".");
  }

  return JSON.parse(match[1]);
}

function serializeDataFile(payload) {
  const data = payload && typeof payload === "object" ? payload : emptyDataFile();
  return "window." + DATA_GLOBAL_NAME + " = " + JSON.stringify(data, null, 2) + ";\n";
}

function emptyDataFile() {
  return {
    version: 1,
    updatedAt: null,
    entries: {},
    projects: []
  };
}

function dataFileResponse(filePath, payload) {
  const resolvedPath = path.resolve(filePath);

  return {
    ok: true,
    filePath: resolvedPath,
    fileName: path.basename(resolvedPath),
    data: payload
  };
}

function dataFileFilters() {
  return [
    { name: "Timesheet Data", extensions: ["js", "json"] },
    { name: "JavaScript Data", extensions: ["js"] },
    { name: "JSON Data", extensions: ["json"] }
  ];
}

function configPath() {
  return path.join(app.getPath("userData"), CONFIG_FILE_NAME);
}

async function readConfig() {
  try {
    const content = await fs.readFile(configPath(), "utf8");
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

async function writeConfig(config) {
  await fs.mkdir(path.dirname(configPath()), { recursive: true });
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), "utf8");
}

async function rememberDataFilePath(filePath) {
  const resolvedPath = path.resolve(filePath);

  if (resolvedPath === path.resolve(bundledDataFilePath())) {
    return;
  }

  const config = await readConfig();
  config.dataFilePath = resolvedPath;
  config.updatedAt = new Date().toISOString();
  await writeConfig(config);
}
