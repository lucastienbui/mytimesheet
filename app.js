(function () {
  "use strict";

  var DATA_FILE_VERSION = 1;
  var DEFAULT_DATA_FILE_NAME = "timesheet-data.js";
  var DATA_GLOBAL_NAME = "MY_TIMESHEET_DATA";
  var NEW_PROJECT_VALUE = "__new_project__";
  var DEFAULT_PROJECT = "General";
  var VIEW_AUTO = "auto";
  var VIEW_CALENDAR = "calendar";
  var VIEW_AGENDA = "agenda";
  var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
  var longDateFormatter = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  var shortDateFormatter = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });

  var state = {
    viewedDate: startOfMonth(new Date()),
    viewPreference: VIEW_AUTO,
    viewMode: getSelectedViewMode(VIEW_AUTO),
    entries: {},
    projects: normalizeProjects([], {}),
    dataFileHandle: null,
    dataFilePath: "",
    dataFileName: DEFAULT_DATA_FILE_NAME,
    dataFileMode: "memory",
    selectedProject: DEFAULT_PROJECT,
    isCreatingProject: false,
    pendingDeleteProject: ""
  };

  var elements = {
    calendarTitle: document.getElementById("calendarTitle"),
    monthSummary: document.getElementById("monthSummary"),
    calendarView: document.getElementById("calendarView"),
    agendaView: document.getElementById("agendaView"),
    calendarWeekdays: document.getElementById("calendarWeekdays"),
    calendarDays: document.getElementById("calendarDays"),
    previousMonthButton: document.getElementById("previousMonthButton"),
    nextMonthButton: document.getElementById("nextMonthButton"),
    todayButton: document.getElementById("todayButton"),
    autoViewButton: document.getElementById("autoViewButton"),
    calendarViewButton: document.getElementById("calendarViewButton"),
    agendaViewButton: document.getElementById("agendaViewButton"),
    dataFileStatus: document.getElementById("dataFileStatus"),
    openDataFileButton: document.getElementById("openDataFileButton"),
    createDataFileButton: document.getElementById("createDataFileButton"),
    exportDataButton: document.getElementById("exportDataButton"),
    openReportButton: document.getElementById("openReportButton"),
    entryDialog: document.getElementById("entryDialog"),
    entryForm: document.getElementById("entryForm"),
    entryDialogTitle: document.getElementById("entryDialogTitle"),
    closeEntryButton: document.getElementById("closeEntryButton"),
    cancelEntryButton: document.getElementById("cancelEntryButton"),
    deleteEntryButton: document.getElementById("deleteEntryButton"),
    newEntryButton: document.getElementById("newEntryButton"),
    dayEntriesSection: document.getElementById("dayEntriesSection"),
    dayEntriesList: document.getElementById("dayEntriesList"),
    entryEditor: document.getElementById("entryEditor"),
    entryDate: document.getElementById("entryDate"),
    entryIndex: document.getElementById("entryIndex"),
    checkInInput: document.getElementById("checkInInput"),
    checkOutInput: document.getElementById("checkOutInput"),
    durationInput: document.getElementById("durationInput"),
    projectPicker: document.getElementById("projectPicker"),
    projectPickerTrigger: document.getElementById("projectPickerTrigger"),
    projectPickerValue: document.getElementById("projectPickerValue"),
    projectPickerMenu: document.getElementById("projectPickerMenu"),
    projectPickerList: document.getElementById("projectPickerList"),
    createProjectOption: document.getElementById("createProjectOption"),
    descriptionInput: document.getElementById("descriptionInput"),
    newProjectField: document.getElementById("newProjectField"),
    newProjectInput: document.getElementById("newProjectInput"),
    entryMessage: document.getElementById("entryMessage"),
    deleteProjectDialog: document.getElementById("deleteProjectDialog"),
    deleteProjectMessage: document.getElementById("deleteProjectMessage"),
    closeDeleteProjectButton: document.getElementById("closeDeleteProjectButton"),
    cancelDeleteProjectButton: document.getElementById("cancelDeleteProjectButton"),
    confirmDeleteProjectButton: document.getElementById("confirmDeleteProjectButton"),
    exportDialog: document.getElementById("exportDialog"),
    exportForm: document.getElementById("exportForm"),
    closeExportButton: document.getElementById("closeExportButton"),
    cancelExportButton: document.getElementById("cancelExportButton"),
    previewReportButton: document.getElementById("previewReportButton"),
    exportStartInput: document.getElementById("exportStartInput"),
    exportEndInput: document.getElementById("exportEndInput"),
    allProjectsCheckbox: document.getElementById("allProjectsCheckbox"),
    projectCheckboxes: document.getElementById("projectCheckboxes"),
    reportSummary: document.getElementById("reportSummary"),
    reportTotals: document.getElementById("reportTotals"),
    reportEntries: document.getElementById("reportEntries"),
    exportMessage: document.getElementById("exportMessage")
  };

  initialize();

  function initialize() {
    loadLocalDataFile();
    renderDataFileStatus();
    renderWeekdays();
    renderMainView();
    bindEvents();
    bindResponsiveViewMode();
    restoreRecentDesktopDataFile();
  }

  function bindEvents() {
    elements.previousMonthButton.addEventListener("click", function () {
      state.viewedDate = new Date(state.viewedDate.getFullYear(), state.viewedDate.getMonth() - 1, 1);
      renderMainView();
    });

    elements.nextMonthButton.addEventListener("click", function () {
      state.viewedDate = new Date(state.viewedDate.getFullYear(), state.viewedDate.getMonth() + 1, 1);
      renderMainView();
    });

    elements.todayButton.addEventListener("click", function () {
      state.viewedDate = startOfMonth(new Date());
      renderMainView();
    });

    elements.autoViewButton.addEventListener("click", function () {
      setViewPreference(VIEW_AUTO);
    });

    elements.calendarViewButton.addEventListener("click", function () {
      setViewPreference(VIEW_CALENDAR);
    });

    elements.agendaViewButton.addEventListener("click", function () {
      setViewPreference(VIEW_AGENDA);
    });

    elements.openDataFileButton.addEventListener("click", openDesktopDataFile);
    elements.createDataFileButton.addEventListener("click", createDesktopDataFile);
    elements.exportDataButton.addEventListener("click", exportDataFile);
    elements.openReportButton.addEventListener("click", openReportDialog);
    elements.closeEntryButton.addEventListener("click", closeEntryDialog);
    elements.cancelEntryButton.addEventListener("click", function () {
      showEntryListOnly(elements.entryDate.value);
    });
    elements.closeExportButton.addEventListener("click", closeReportDialog);
    elements.cancelExportButton.addEventListener("click", closeReportDialog);
    elements.newEntryButton.addEventListener("click", function () {
      resetEntryForm(elements.entryDate.value);
      elements.checkInInput.focus();
    });

    elements.checkInInput.addEventListener("input", updateDurationPreview);
    elements.checkOutInput.addEventListener("input", updateDurationPreview);
    elements.projectPickerTrigger.addEventListener("click", toggleProjectPickerMenu);
    elements.createProjectOption.addEventListener("click", chooseCreateProjectOption);
    elements.closeDeleteProjectButton.addEventListener("click", closeDeleteProjectDialog);
    elements.cancelDeleteProjectButton.addEventListener("click", closeDeleteProjectDialog);
    elements.confirmDeleteProjectButton.addEventListener("click", confirmDeleteProject);
    elements.deleteProjectDialog.addEventListener("click", function (event) {
      if (event.target === elements.deleteProjectDialog) {
        closeDeleteProjectDialog();
      }
    });
    elements.entryForm.addEventListener("submit", saveEntry);
    elements.deleteEntryButton.addEventListener("click", deleteSelectedEntry);

    document.addEventListener("click", function (event) {
      if (!elements.projectPicker.contains(event.target)) {
        closeProjectPickerMenu();
      }
    });

    elements.previewReportButton.addEventListener("click", showReportPreview);
    elements.exportForm.addEventListener("submit", exportCsv);
    elements.allProjectsCheckbox.addEventListener("change", renderProjectCheckboxAvailability);

    elements.entryDialog.addEventListener("click", function (event) {
      if (event.target === elements.entryDialog) {
        closeEntryDialog();
      }
    });

    elements.exportDialog.addEventListener("click", function (event) {
      if (event.target === elements.exportDialog) {
        closeReportDialog();
      }
    });
  }

  function renderWeekdays() {
    elements.calendarWeekdays.innerHTML = "";
    weekdays.forEach(function (weekday) {
      var weekdayElement = document.createElement("div");
      weekdayElement.className = "weekday";
      weekdayElement.textContent = weekday;
      elements.calendarWeekdays.appendChild(weekdayElement);
    });
  }

  function loadLocalDataFile() {
    var localData = typeof window !== "undefined" ? window[DATA_GLOBAL_NAME] : null;

    if (!localData) {
      renderDataFileStatus("No " + DEFAULT_DATA_FILE_NAME + " data was found. A blank timesheet is ready.");
      return;
    }

    try {
      applyDataFileData(localData);
      state.dataFileName = DEFAULT_DATA_FILE_NAME;
      state.dataFileMode = "loaded";
    } catch (error) {
      setDataFileStatus(DEFAULT_DATA_FILE_NAME + " could not be read. A blank timesheet is ready.", true);
    }
  }

  async function restoreRecentDesktopDataFile() {
    var result;

    if (!isDesktopApp()) {
      return;
    }

    result = await window.myTimesheetDesktop.loadRecentDataFile();

    if (!result || !result.ok) {
      renderDataFileStatus();
      return;
    }

    applyDesktopDataFile(result);
    renderDataFileStatus("Reopened " + state.dataFileName + ". Changes will save automatically.");
  }

  async function openDesktopDataFile() {
    var result;

    if (!isDesktopApp()) {
      await openBrowserDataFile();
      return;
    }

    result = await window.myTimesheetDesktop.openDataFile();

    if (!result || result.canceled) {
      return;
    }

    if (!result.ok) {
      setDataFileStatus(result.error || "Could not open data file.", true);
      return;
    }

    applyDesktopDataFile(result);
    renderDataFileStatus("Opened " + state.dataFileName + ". Changes will save automatically.");
  }

  async function createDesktopDataFile() {
    var result;
    var blankPayload = buildBlankDataFilePayload();

    applyDataFileData(blankPayload);
    updateLocalDataGlobal();

    if (!isDesktopApp()) {
      return createBrowserDataFile(blankPayload);
    }

    result = await window.myTimesheetDesktop.createDataFile(blankPayload);

    if (!result || result.canceled) {
      return false;
    }

    if (!result.ok) {
      setDataFileStatus(result.error || "Could not create data file.", true);
      return false;
    }

    applyDesktopDataFile(result);
    renderDataFileStatus("Created " + state.dataFileName + ". Changes will save automatically.");
    return true;
  }

  function applyDesktopDataFile(result) {
    applyDataFileData(result.data);
    updateLocalDataGlobal();
    state.dataFilePath = result.filePath || "";
    state.dataFileName = result.fileName || DEFAULT_DATA_FILE_NAME;
    state.dataFileMode = "connected";
    renderAfterDataChange();
  }

  function applyDataFileData(rawData) {
    var data = normalizeDataFile(rawData);

    state.entries = data.entries;
    state.projects = data.projects;
  }

  function normalizeDataFile(data) {
    var entriesSource;
    var projectsSource;
    var entries;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Invalid data file");
    }

    entriesSource = data.entries && typeof data.entries === "object" ? data.entries : data;
    projectsSource = Array.isArray(data.projects) ? data.projects : [];
    entries = normalizeEntries(entriesSource);

    return {
      entries: entries,
      projects: normalizeProjects(projectsSource, entries)
    };
  }

  async function persistData() {
    updateLocalDataGlobal();

    if (isDesktopApp()) {
      if (!state.dataFilePath) {
        return connectDesktopDataFileWithCurrentData();
      }

      await saveDesktopDataFile();
      return true;
    }

    if (state.dataFileHandle) {
      await writePayloadToHandle(state.dataFileHandle);
      state.dataFileMode = "connected";
      renderDataFileStatus("Saved to " + state.dataFileName + ".");
      return true;
    }

    if (supportsSavePicker()) {
      try {
        await connectDataFileForAutoSave();
        renderDataFileStatus("Saved to " + state.dataFileName + ". Future changes in this session will save automatically.");
        return true;
      } catch (error) {
        if (error && error.name === "AbortError") {
          state.dataFileMode = "changed";
          renderDataFileStatus("Save permission was cancelled. Changes are ready; click Export data to save " + DEFAULT_DATA_FILE_NAME + ".");
          return true;
        }

        throw error;
      }
    }

    state.dataFileMode = "changed";
    renderDataFileStatus("Changes are ready. Click Export data to save an updated " + DEFAULT_DATA_FILE_NAME + " file.");
    return true;
  }

  async function saveDesktopDataFile() {
    var result = await window.myTimesheetDesktop.saveDataFile({
      filePath: state.dataFilePath,
      payload: buildDataFilePayload()
    });

    if (!result || !result.ok) {
      setDataFileStatus(result && result.error ? result.error : "Could not save data file.", true);
      return false;
    }

    state.dataFilePath = result.filePath || state.dataFilePath;
    state.dataFileName = result.fileName || state.dataFileName;
    state.dataFileMode = "connected";
    renderDataFileStatus("Saved to " + state.dataFileName + ".");
    return true;
  }

  async function connectDataFileForAutoSave() {
    var handle = await window.showSaveFilePicker({
      suggestedName: DEFAULT_DATA_FILE_NAME,
      types: [dataFilePickerType()]
    });

    state.dataFileHandle = handle;
    state.dataFileName = handle.name || DEFAULT_DATA_FILE_NAME;
    state.dataFileMode = "connected";
    await writePayloadToHandle(handle);
  }

  async function exportDataFile() {
    var handle;
    var result;

    updateLocalDataGlobal();

    if (isDesktopApp()) {
      result = await window.myTimesheetDesktop.exportDataFile(buildDataFilePayload());

      if (!result || result.canceled) {
        return;
      }

      if (!result.ok) {
        setDataFileStatus(result.error || "Could not export data file.", true);
        return;
      }

      applyDesktopDataFile(result);
      renderDataFileStatus("Exported " + state.dataFileName + ". Changes will save automatically.");
      return;
    }

    if (supportsSavePicker()) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: DEFAULT_DATA_FILE_NAME,
          types: [dataFilePickerType()]
        });
        await writePayloadToHandle(handle);
        state.dataFileHandle = handle;
        state.dataFileName = handle.name || DEFAULT_DATA_FILE_NAME;
        state.dataFileMode = "connected";
        renderDataFileStatus("Exported " + state.dataFileName + ". Future changes in this session will save automatically.");
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }

        setDataFileStatus("Could not export " + DEFAULT_DATA_FILE_NAME + ". A download will be attempted instead.", true);
      }
    }

    downloadDataFile(DEFAULT_DATA_FILE_NAME);
    state.dataFileName = DEFAULT_DATA_FILE_NAME;
    state.dataFileMode = "exported";
    renderDataFileStatus("Downloaded " + DEFAULT_DATA_FILE_NAME + ". Replace the local file beside MyTimesheet.html with this copy.");
  }

  function updateLocalDataGlobal() {
    if (typeof window !== "undefined") {
      window[DATA_GLOBAL_NAME] = buildDataFilePayload();
    }
  }

  function isDesktopApp() {
    return Boolean(window.myTimesheetDesktop && window.myTimesheetDesktop.isDesktop);
  }

  async function openBrowserDataFile() {
    var handles;
    var file;
    var content;

    if (supportsOpenPicker()) {
      try {
        handles = await window.showOpenFilePicker({
          types: [dataFilePickerType()],
          multiple: false
        });
        file = await handles[0].getFile();
        content = await file.text();
        applyDataFileData(parseDataFileContent(content));
        state.dataFileHandle = handles[0];
        state.dataFilePath = "";
        state.dataFileName = handles[0].name || DEFAULT_DATA_FILE_NAME;
        state.dataFileMode = "connected";
        updateLocalDataGlobal();
        renderAfterDataChange();
        renderDataFileStatus("Opened " + state.dataFileName + ". Changes will save automatically.");
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }

        setDataFileStatus("Could not open data file.", true);
        return;
      }
    }

    await openBrowserDataFileWithInput();
  }

  function openBrowserDataFileWithInput() {
    return new Promise(function (resolve) {
      var input = ensureDataFileInput();

      input.onchange = async function () {
        var file = input.files && input.files[0];
        input.value = "";

        if (!file) {
          resolve();
          return;
        }

        try {
          applyDataFileData(parseDataFileContent(await file.text()));
          state.dataFileHandle = null;
          state.dataFilePath = "";
          state.dataFileName = file.name || DEFAULT_DATA_FILE_NAME;
          state.dataFileMode = "loaded";
          updateLocalDataGlobal();
          renderAfterDataChange();
          renderDataFileStatus("Opened " + state.dataFileName + ". Click Export data to save changes to a file.");
        } catch (error) {
          setDataFileStatus("Could not open data file.", true);
        }

        resolve();
      };

      input.click();
    });
  }

  async function createBrowserDataFile(blankPayload) {
    var handle;

    if (supportsSavePicker()) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: DEFAULT_DATA_FILE_NAME,
          types: [dataFilePickerType()]
        });
        await writePayloadToHandle(handle, blankPayload);
        state.dataFileHandle = handle;
        state.dataFilePath = "";
        state.dataFileName = handle.name || DEFAULT_DATA_FILE_NAME;
        state.dataFileMode = "connected";
        renderAfterDataChange();
        renderDataFileStatus("Created " + state.dataFileName + ". Changes will save automatically.");
        return true;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return false;
        }

        setDataFileStatus("Could not create data file.", true);
        return false;
      }
    }

    downloadDataFile(DEFAULT_DATA_FILE_NAME, blankPayload);
    state.dataFileHandle = null;
    state.dataFilePath = "";
    state.dataFileName = DEFAULT_DATA_FILE_NAME;
    state.dataFileMode = "exported";
    renderAfterDataChange();
    renderDataFileStatus("Created " + DEFAULT_DATA_FILE_NAME + ". Keep it beside MyTimesheet.html so it can be opened next time.");
    return true;
  }

  async function connectDesktopDataFileWithCurrentData() {
    var result = await window.myTimesheetDesktop.exportDataFile(buildDataFilePayload());

    if (!result || result.canceled) {
      return false;
    }

    if (!result.ok) {
      setDataFileStatus(result.error || "Could not save data file.", true);
      return false;
    }

    applyDesktopDataFile(result);
    renderDataFileStatus("Saved to " + state.dataFileName + ". Changes will save automatically.");
    return true;
  }

  async function writePayloadToHandle(fileHandle, payload) {
    var writable = await fileHandle.createWritable();

    await writable.write(buildDataFileContent(payload));
    await writable.close();
  }

  function downloadDataFile(fileName, payload) {
    var blob = new Blob([buildDataFileContent(payload)], { type: "application/javascript;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = fileName || state.dataFileName || DEFAULT_DATA_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function buildDataFilePayload() {
    return {
      version: DATA_FILE_VERSION,
      updatedAt: new Date().toISOString(),
      entries: state.entries,
      projects: state.projects
    };
  }

  function buildBlankDataFilePayload() {
    return {
      version: DATA_FILE_VERSION,
      updatedAt: null,
      entries: {},
      projects: [DEFAULT_PROJECT]
    };
  }

  function buildDataFileContent(payload) {
    var data = payload || buildDataFilePayload();

    return "window." + DATA_GLOBAL_NAME + " = " + JSON.stringify(data, null, 2) + ";\n";
  }

  function parseDataFileContent(content) {
    var trimmed = (content || "").trim();
    var assignmentPattern;
    var match;

    if (!trimmed) {
      return buildBlankDataFilePayload();
    }

    if (trimmed.charAt(0) === "{") {
      return JSON.parse(trimmed);
    }

    assignmentPattern = new RegExp(
      "^\\s*(?:window\\.)?" + DATA_GLOBAL_NAME + "\\s*=\\s*([\\s\\S]*?)\\s*;?\\s*$"
    );
    match = assignmentPattern.exec(trimmed);

    if (!match) {
      throw new Error("Data file must define window." + DATA_GLOBAL_NAME + ".");
    }

    return JSON.parse(match[1]);
  }

  function renderAfterDataChange() {
    state.projects = normalizeProjects(state.projects, state.entries);
    renderMainView();
  }

  function renderDataFileStatus(message) {
    if (message) {
      setDataFileStatus(message, false);
      return;
    }

    if (state.dataFileMode === "connected" && state.dataFileName) {
      setDataFileStatus("Connected to " + state.dataFileName + ". Changes save automatically in this session.", false);
    } else if (state.dataFileMode === "changed") {
      setDataFileStatus("Changes are ready. Click Export data to save an updated " + DEFAULT_DATA_FILE_NAME + " file.", false);
    } else if (state.dataFileMode === "exported" && state.dataFileName) {
      setDataFileStatus("Saved " + state.dataFileName + ". Keep it beside MyTimesheet.html so it loads next time.", false);
    } else {
      setDataFileStatus("Using " + DEFAULT_DATA_FILE_NAME + " from this folder. Save an entry to update that file.", false);
    }
  }

  function setDataFileStatus(message, isError) {
    elements.dataFileStatus.textContent = message;
    elements.dataFileStatus.classList.toggle("error", Boolean(isError));
  }

  function supportsSavePicker() {
    return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
  }

  function supportsOpenPicker() {
    return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
  }

  function ensureDataFileInput() {
    var input = document.getElementById("dataFileInput");

    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.id = "dataFileInput";
      input.accept = ".js,application/javascript,text/javascript";
      input.hidden = true;
      document.body.appendChild(input);
    }

    return input;
  }

  function dataFilePickerType() {
    return {
      description: "Timesheet JavaScript data",
      accept: {
        "application/javascript": [".js"],
        "text/javascript": [".js"]
      }
    };
  }

  function bindResponsiveViewMode() {
    var mediaQuery;

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    mediaQuery = window.matchMedia("(max-width: 760px)");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncResponsiveViewMode);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(syncResponsiveViewMode);
    }

    syncResponsiveViewMode();
  }

  function syncResponsiveViewMode() {
    if (state.viewPreference !== VIEW_AUTO) {
      return;
    }

    setViewMode(getResponsiveViewMode());
  }

  function setViewPreference(viewPreference) {
    state.viewPreference = viewPreference;
    setViewMode(getSelectedViewMode(viewPreference));
  }

  function setViewMode(nextViewMode) {
    if (state.viewMode === nextViewMode) {
      renderViewControls();
      return;
    }

    state.viewMode = nextViewMode;
    renderMainView();
  }

  function getResponsiveViewMode() {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 760px)").matches) {
      return VIEW_AGENDA;
    }

    return VIEW_CALENDAR;
  }

  function getSelectedViewMode(viewPreference) {
    if (viewPreference === VIEW_CALENDAR || viewPreference === VIEW_AGENDA) {
      return viewPreference;
    }

    return getResponsiveViewMode();
  }

  function renderMainView() {
    var year = state.viewedDate.getFullYear();
    var month = state.viewedDate.getMonth();
    var monthStart = new Date(year, month, 1);
    var monthEnd = new Date(year, month + 1, 0);
    var monthlyEntries = entriesForRange(monthStart, monthEnd);
    var monthlyHours = sumHours(monthlyEntries);

    elements.calendarTitle.textContent = monthFormatter.format(state.viewedDate);
    elements.monthSummary.textContent = monthlyEntries.length + " " + pluralize("entry", monthlyEntries.length) + " · " + formatHours(monthlyHours) + " hours";
    elements.calendarView.classList.toggle("hidden", state.viewMode !== VIEW_CALENDAR);
    elements.agendaView.classList.toggle("hidden", state.viewMode !== VIEW_AGENDA);
    renderViewControls();

    if (state.viewMode === VIEW_CALENDAR) {
      renderCalendar();
    } else {
      renderAgenda();
    }
  }

  function renderViewControls() {
    elements.autoViewButton.classList.toggle("is-active", state.viewPreference === VIEW_AUTO);
    elements.calendarViewButton.classList.toggle("is-active", state.viewPreference === VIEW_CALENDAR);
    elements.agendaViewButton.classList.toggle("is-active", state.viewPreference === VIEW_AGENDA);
  }

  function renderCalendar() {
    var year = state.viewedDate.getFullYear();
    var month = state.viewedDate.getMonth();
    var firstDay = new Date(year, month, 1);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var todayKey = dateToKey(new Date());

    elements.calendarDays.innerHTML = "";

    for (var blank = 0; blank < firstDay.getDay(); blank += 1) {
      var emptyCell = document.createElement("div");
      emptyCell.className = "day-cell is-empty";
      elements.calendarDays.appendChild(emptyCell);
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      var date = new Date(year, month, day);
      var dateKey = dateToKey(date);
      var entries = entriesForDate(dateKey);
      var dayButton = document.createElement("button");
      var classNames = ["day-cell"];

      if (dateKey === todayKey) {
        classNames.push("is-today");
      }

      if (entries.length > 0) {
        classNames.push("has-entry");
      }

      dayButton.type = "button";
      dayButton.className = classNames.join(" ");
      dayButton.setAttribute("aria-label", "Open " + longDateFormatter.format(date));
      dayButton.innerHTML =
        '<div class="day-number"><span>' +
        day +
        "</span>" +
        (dateKey === todayKey ? '<span class="today-pill">Today</span>' : "") +
        "</div>" +
        renderDayPreview(entries);
      dayButton.addEventListener("click", openEntryDialog.bind(null, dateKey, null));
      elements.calendarDays.appendChild(dayButton);
    }
  }

  function renderDayPreview(entries) {
    if (entries.length === 0) {
      return "";
    }

    return (
      '<div class="entry-preview">' +
      '<span class="entry-count">' +
      entries.length +
      " " +
      pluralize("entry", entries.length) +
      " · " +
      formatHours(sumHours(entries)) +
      " hours</span>" +
      "</div>"
    );
  }

  function renderAgenda() {
    var year = state.viewedDate.getFullYear();
    var month = state.viewedDate.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var defaultDay = getAgendaDefaultDay(year, month);

    elements.agendaView.innerHTML = "";

    for (var day = 1; day <= daysInMonth; day += 1) {
      var date = new Date(year, month, day);
      var dateKey = dateToKey(date);
      var entries = entriesForDate(dateKey);
      var row = document.createElement("article");
      var details = document.createElement("div");
      var openButton = document.createElement("button");

      row.className = "agenda-day" + (entries.length > 0 ? " has-entry" : "") + (day === defaultDay ? " is-agenda-scroll-target" : "");
      row.setAttribute("data-date", dateKey);
      row.innerHTML =
        '<div class="agenda-date">' +
        escapeHtml(shortDateFormatter.format(date)) +
        "</div>";

      details.className = entries.length > 0 ? "agenda-details" : "agenda-empty";
      if (entries.length > 0) {
        details.innerHTML =
          "<strong>" +
          entries.length +
          " " +
          pluralize("entry", entries.length) +
          " · " +
          formatHours(sumHours(entries)) +
          " hours</strong><br>" +
          entries.map(function (entry) {
            return escapeHtml(entry.checkIn) + " - " + escapeHtml(entry.checkOut) + " · " + escapeHtml(entry.project);
          }).join("<br>");
      } else {
        details.textContent = "";
      }

      openButton.className = "secondary-button compact-button";
      openButton.type = "button";
      openButton.textContent = "Open";
      openButton.addEventListener("click", openEntryDialog.bind(null, dateKey, null));

      row.appendChild(details);
      row.appendChild(openButton);
      elements.agendaView.appendChild(row);
    }

    scrollAgendaToDefaultDay(defaultDay);
  }

  function getAgendaDefaultDay(year, month) {
    var today = new Date();

    if (today.getFullYear() === year && today.getMonth() === month) {
      return today.getDate();
    }

    return 1;
  }

  function scrollAgendaToDefaultDay(day) {
    var targetRow = elements.agendaView.children[day - 1];

    if (!targetRow) {
      return;
    }

    if (typeof targetRow.scrollIntoView === "function") {
      targetRow.scrollIntoView({ block: "start" });
      return;
    }

    if (typeof targetRow.offsetTop === "number") {
      elements.agendaView.scrollTop = targetRow.offsetTop;
    }
  }

  function openEntryDialog(dateKey, entryIndex) {
    clearMessage(elements.entryMessage);
    elements.entryDate.value = dateKey;
    renderDayEntries(dateKey);

    if (entryIndex === null || entryIndex === undefined) {
      showEntryListOnly(dateKey);
    } else {
      loadEntryIntoForm(dateKey, entryIndex);
    }

    showDialog(elements.entryDialog);
    if (entryIndex !== null && entryIndex !== undefined) {
      elements.checkInInput.focus();
    }
  }

  function closeEntryDialog() {
    elements.entryDialog.close();
  }

  function showEntryListOnly(dateKey) {
    elements.entryForm.reset();
    clearMessage(elements.entryMessage);
    elements.entryDate.value = dateKey;
    elements.entryIndex.value = "";
    elements.entryDialogTitle.textContent = "Entries for " + formatDisplayDate(parseKey(dateKey));
    elements.entryEditor.classList.add("hidden");
    elements.newProjectField.classList.add("hidden");
    elements.newProjectInput.required = false;
    elements.deleteEntryButton.classList.add("hidden");
    closeProjectPickerMenu();
    state.isCreatingProject = false;
  }

  function resetEntryForm(dateKey) {
    elements.entryForm.reset();
    clearMessage(elements.entryMessage);
    elements.entryDate.value = dateKey;
    elements.entryIndex.value = "";
    elements.entryDialogTitle.textContent = "Add entry for " + formatDisplayDate(parseKey(dateKey));
    elements.entryEditor.classList.remove("hidden");
    state.isCreatingProject = false;
    renderProjectPicker("");
    elements.descriptionInput.value = "";
    elements.deleteEntryButton.classList.add("hidden");
    updateDurationPreview();
  }

  function loadEntryIntoForm(dateKey, entryIndex) {
    var entry = entriesForDate(dateKey)[entryIndex];

    if (!entry) {
      resetEntryForm(dateKey);
      return;
    }

    elements.entryForm.reset();
    clearMessage(elements.entryMessage);
    elements.entryDate.value = dateKey;
    elements.entryIndex.value = String(entryIndex);
    elements.entryDialogTitle.textContent = "Edit entry for " + formatDisplayDate(parseKey(dateKey));
    elements.entryEditor.classList.remove("hidden");
    renderProjectPicker(entry.project);
    elements.checkInInput.value = entry.checkIn;
    elements.checkOutInput.value = entry.checkOut;
    elements.descriptionInput.value = entry.description || "";
    elements.deleteEntryButton.classList.remove("hidden");
    updateDurationPreview();
    toggleNewProjectField();
  }

  function renderDayEntries(dateKey) {
    var entries = entriesForDate(dateKey);

    elements.dayEntriesList.innerHTML = "";

    if (entries.length === 0) {
      var empty = document.createElement("p");
      empty.className = "agenda-empty";
      empty.textContent = "No entries saved for this day yet.";
      elements.dayEntriesList.appendChild(empty);
      return;
    }

    entries.forEach(function (entry, index) {
      var card = document.createElement("article");
      var main = document.createElement("div");
      var actions = document.createElement("div");
      var editButton = document.createElement("button");
      var deleteButton = document.createElement("button");

      card.className = "day-entry-card";
      main.className = "day-entry-main";
      main.innerHTML =
        "<strong>" +
        escapeHtml(entry.checkIn) +
        " - " +
        escapeHtml(entry.checkOut) +
        "</strong><br>" +
        formatHours(entry.duration) +
        " hours · " +
        escapeHtml(entry.project) +
        (entry.description ? "<br><span class=\"entry-description\">" + escapeHtml(entry.description) + "</span>" : "");

      actions.className = "entry-card-actions";
      editButton.className = "secondary-button compact-button";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", loadEntryIntoForm.bind(null, dateKey, index));

      deleteButton.className = "danger-button compact-button";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        deleteEntryByIndex(dateKey, index);
      });

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
      card.appendChild(main);
      card.appendChild(actions);
      elements.dayEntriesList.appendChild(card);
    });
  }

  async function saveEntry(event) {
    event.preventDefault();
    clearMessage(elements.entryMessage);

    var dateKey = elements.entryDate.value;
    var checkIn = elements.checkInInput.value;
    var checkOut = elements.checkOutInput.value;
    var duration = calculateDuration(checkIn, checkOut);
    var project = getSelectedProject();
    var description = normalizeDescription(elements.descriptionInput.value);
    var entryIndex = elements.entryIndex.value === "" ? null : Number(elements.entryIndex.value);
    var entries;

    if (!dateKey || duration === null) {
      showMessage(elements.entryMessage, "Please enter valid check in and check out times.", true);
      return;
    }

    if (!project) {
      showMessage(elements.entryMessage, "Please choose a project or create a new one.", true);
      return;
    }

    if (state.projects.indexOf(project) === -1) {
      state.projects.push(project);
      state.projects.sort(caseInsensitiveSort);
    }

    entries = entriesForDate(dateKey).slice();

    if (entryIndex !== null && entries[entryIndex]) {
      entries[entryIndex] = createEntry(checkIn, checkOut, project, duration, entries[entryIndex].id, description);
    } else {
      entries.push(createEntry(checkIn, checkOut, project, duration, null, description));
    }

    entries.sort(compareEntriesByTime);
    state.entries[dateKey] = entries;
    try {
      await persistData();
    } catch (error) {
      showMessage(elements.entryMessage, "Entry was updated in memory, but the data file could not be saved.", true);
      setDataFileStatus("Could not save to " + (state.dataFileName || DEFAULT_DATA_FILE_NAME) + ". Save the generated " + DEFAULT_DATA_FILE_NAME + " beside MyTimesheet.html.", true);
      return;
    }
    renderDayEntries(dateKey);
    renderMainView();
    showEntryListOnly(dateKey);
  }

  function deleteSelectedEntry() {
    var dateKey = elements.entryDate.value;
    var entryIndex = Number(elements.entryIndex.value);

    if (dateKey && !Number.isNaN(entryIndex)) {
      deleteEntryByIndex(dateKey, entryIndex);
    }
  }

  async function deleteEntryByIndex(dateKey, entryIndex) {
    var entries = entriesForDate(dateKey).slice();

    if (!entries[entryIndex]) {
      return;
    }

    entries.splice(entryIndex, 1);

    if (entries.length > 0) {
      state.entries[dateKey] = entries;
    } else {
      delete state.entries[dateKey];
    }

    try {
      await persistData();
    } catch (error) {
      showMessage(elements.entryMessage, "Entry was deleted in memory, but the data file could not be saved.", true);
      setDataFileStatus("Could not save to " + (state.dataFileName || DEFAULT_DATA_FILE_NAME) + ". Save the generated " + DEFAULT_DATA_FILE_NAME + " beside MyTimesheet.html.", true);
      return;
    }
    renderDayEntries(dateKey);
    renderMainView();
    showEntryListOnly(dateKey);
  }

  function renderProjectPicker(selectedProject) {
    var activeProject = selectedProject && state.projects.indexOf(selectedProject) !== -1
      ? selectedProject
      : state.projects[0] || DEFAULT_PROJECT;

    if (state.isCreatingProject) {
      activeProject = NEW_PROJECT_VALUE;
    }

    state.selectedProject = activeProject;
    elements.projectPickerList.innerHTML = "";

    state.projects.forEach(function (project) {
      var row = document.createElement("div");
      var selectButton = document.createElement("button");
      var deleteButton = document.createElement("button");

      row.className = "project-picker-row" + (project === activeProject && !state.isCreatingProject ? " is-selected" : "");
      selectButton.className = "project-picker-name";
      selectButton.type = "button";
      selectButton.textContent = project;
      selectButton.addEventListener("click", function () {
        chooseProject(project);
      });

      deleteButton.className = "project-picker-delete";
      deleteButton.type = "button";
      deleteButton.setAttribute("aria-label", "Delete " + project);
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function (event) {
        event.stopPropagation();
        openDeleteProjectDialog(project);
      });

      row.appendChild(selectButton);
      row.appendChild(deleteButton);
      elements.projectPickerList.appendChild(row);
    });

    updateProjectPickerTrigger();
    toggleNewProjectField();
  }

  function updateProjectPickerTrigger() {
    if (state.isCreatingProject) {
      elements.projectPickerValue.textContent = "+ Create new project";
      return;
    }

    elements.projectPickerValue.textContent = state.selectedProject || state.projects[0] || DEFAULT_PROJECT;
  }

  function chooseProject(project) {
    state.isCreatingProject = false;
    state.selectedProject = project;
    closeProjectPickerMenu();
    renderProjectPicker(project);
  }

  function chooseCreateProjectOption() {
    state.isCreatingProject = true;
    state.selectedProject = NEW_PROJECT_VALUE;
    closeProjectPickerMenu();
    renderProjectPicker(NEW_PROJECT_VALUE);
    elements.newProjectInput.focus();
  }

  function toggleProjectPickerMenu() {
    if (elements.projectPickerMenu.classList.contains("hidden")) {
      openProjectPickerMenu();
    } else {
      closeProjectPickerMenu();
    }
  }

  function openProjectPickerMenu() {
    renderProjectPicker(state.selectedProject);
    elements.projectPickerMenu.classList.remove("hidden");
    elements.projectPickerTrigger.setAttribute("aria-expanded", "true");
  }

  function closeProjectPickerMenu() {
    elements.projectPickerMenu.classList.add("hidden");
    elements.projectPickerTrigger.setAttribute("aria-expanded", "false");
  }

  function toggleNewProjectField() {
    elements.newProjectField.classList.toggle("hidden", !state.isCreatingProject);
    elements.newProjectInput.required = state.isCreatingProject;

    if (!state.isCreatingProject) {
      elements.newProjectInput.value = "";
    }
  }

  function getSelectedProject() {
    if (!state.isCreatingProject) {
      return state.selectedProject;
    }

    return normalizeProjectName(elements.newProjectInput.value);
  }

  function countEntriesForProject(projectName) {
    return Object.keys(state.entries).reduce(function (count, dateKey) {
      return count + entriesForDate(dateKey).filter(function (entry) {
        return entry.project === projectName;
      }).length;
    }, 0);
  }

  function openDeleteProjectDialog(projectName) {
    var entryCount = countEntriesForProject(projectName);

    if (state.projects.length <= 1) {
      showMessage(elements.entryMessage, "You must keep at least one project.", true);
      return;
    }

    state.pendingDeleteProject = projectName;
    elements.deleteProjectMessage.textContent =
      "Deleting \"" +
      projectName +
      "\" will permanently delete " +
      entryCount +
      " " +
      pluralize("entry", entryCount) +
      " linked to this project. This cannot be undone.";
    closeProjectPickerMenu();
    showDialog(elements.deleteProjectDialog);
  }

  function closeDeleteProjectDialog() {
    elements.deleteProjectDialog.close();
    state.pendingDeleteProject = "";
  }

  async function confirmDeleteProject() {
    var projectName = state.pendingDeleteProject;

    if (!projectName) {
      closeDeleteProjectDialog();
      return;
    }

    state.projects = state.projects.filter(function (project) {
      return project !== projectName;
    });

    if (state.projects.length === 0) {
      state.projects = [DEFAULT_PROJECT];
    }

    Object.keys(state.entries).forEach(function (currentDateKey) {
      var entries = entriesForDate(currentDateKey).filter(function (entry) {
        return entry.project !== projectName;
      });

      if (entries.length > 0) {
        state.entries[currentDateKey] = entries;
      } else {
        delete state.entries[currentDateKey];
      }
    });

    if (state.isCreatingProject || state.selectedProject === projectName) {
      state.isCreatingProject = false;
      state.selectedProject = state.projects[0] || DEFAULT_PROJECT;
    }

    try {
      await persistData();
    } catch (error) {
      showMessage(elements.entryMessage, "Project was removed in memory, but the data file could not be saved.", true);
      closeDeleteProjectDialog();
      return;
    }

    renderProjectPicker(state.selectedProject);
    renderDayEntries(elements.entryDate.value);
    renderMainView();
    closeDeleteProjectDialog();
    showMessage(elements.entryMessage, "Deleted project \"" + projectName + "\" and its entries.", false);
  }

  function normalizeProjectName(projectName) {
    var trimmed = projectName.trim().replace(/\s+/g, " ");
    var existingProject = state.projects.find(function (project) {
      return project.toLowerCase() === trimmed.toLowerCase();
    });

    return existingProject || trimmed;
  }

  function updateDurationPreview() {
    var duration = calculateDuration(elements.checkInInput.value, elements.checkOutInput.value);
    elements.durationInput.value = duration === null ? "0.00 hours" : formatHours(duration) + " hours";
  }

  function calculateDuration(checkIn, checkOut) {
    var checkInMinutes = timeToMinutes(checkIn);
    var checkOutMinutes = timeToMinutes(checkOut);
    var difference;

    if (checkInMinutes === null || checkOutMinutes === null) {
      return null;
    }

    difference = checkOutMinutes - checkInMinutes;

    if (difference < 0) {
      difference += 24 * 60;
    }

    return difference / 60;
  }

  function timeToMinutes(time) {
    var match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time || "");

    if (!match) {
      return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
  }

  function openReportDialog() {
    var monthStart = state.viewedDate;
    var monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    clearMessage(elements.exportMessage);
    elements.exportStartInput.value = formatDisplayDate(monthStart);
    elements.exportEndInput.value = formatDisplayDate(monthEnd);
    elements.allProjectsCheckbox.checked = true;
    elements.reportSummary.classList.add("hidden");
    elements.reportTotals.innerHTML = "";
    elements.reportEntries.innerHTML = "";
    renderProjectCheckboxes();
    renderProjectCheckboxAvailability();
    showDialog(elements.exportDialog);
  }

  function closeReportDialog() {
    elements.exportDialog.close();
  }

  function renderProjectCheckboxes() {
    elements.projectCheckboxes.innerHTML = "";

    state.projects.forEach(function (project) {
      var label = document.createElement("label");
      label.className = "checkbox-row";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = project;
      checkbox.checked = true;
      checkbox.addEventListener("change", function () {
        if (!checkbox.checked) {
          elements.allProjectsCheckbox.checked = false;
        }
        renderProjectCheckboxAvailability();
      });

      var text = document.createElement("span");
      text.textContent = project;

      label.appendChild(checkbox);
      label.appendChild(text);
      elements.projectCheckboxes.appendChild(label);
    });
  }

  function renderProjectCheckboxAvailability() {
    var disabled = elements.allProjectsCheckbox.checked;
    Array.prototype.forEach.call(elements.projectCheckboxes.querySelectorAll("input"), function (checkbox) {
      checkbox.disabled = disabled;
      if (disabled) {
        checkbox.checked = true;
      }
    });
  }

  function showReportPreview() {
    var report = buildReportFromFilters();

    if (!report) {
      return;
    }

    renderReport(report.rows, report.totals);
  }

  function exportCsv(event) {
    event.preventDefault();

    var report = buildReportFromFilters();

    if (!report) {
      return;
    }

    renderReport(report.rows, report.totals);
    downloadCsv(report.rows, report.totals, report.startDate, report.endDate);
  }

  function buildReportFromFilters() {
    var startDate = parseDisplayDate(elements.exportStartInput.value);
    var endDate = parseDisplayDate(elements.exportEndInput.value);
    var selectedProjects = getSelectedExportProjects();
    var rows;
    var totals;

    clearMessage(elements.exportMessage);

    if (!startDate || !endDate) {
      showMessage(elements.exportMessage, "Please enter dates in DD/MM/YYYY format.", true);
      return null;
    }

    if (startDate > endDate) {
      showMessage(elements.exportMessage, "Start date must be before or equal to end date.", true);
      return null;
    }

    if (!elements.allProjectsCheckbox.checked && selectedProjects.length === 0) {
      showMessage(elements.exportMessage, "Please choose at least one project or select all projects.", true);
      return null;
    }

    rows = entriesForRange(startDate, endDate).filter(function (entry) {
      return elements.allProjectsCheckbox.checked || selectedProjects.indexOf(entry.project) !== -1;
    });

    if (rows.length === 0) {
      elements.reportSummary.classList.add("hidden");
      showMessage(elements.exportMessage, "No entries match this report filter.", true);
      return null;
    }

    totals = totalsByProject(rows);

    return {
      rows: rows,
      totals: totals,
      startDate: startDate,
      endDate: endDate
    };
  }

  function renderReport(rows, totals) {
    elements.reportTotals.innerHTML = renderTotalsTable(totals);
    elements.reportEntries.innerHTML = renderEntriesTable(rows);
    elements.reportSummary.classList.remove("hidden");
    showMessage(elements.exportMessage, "Report ready: " + rows.length + " " + pluralize("entry", rows.length) + " · " + formatHours(sumHours(rows)) + " hours.", false);
  }

  function renderTotalsTable(totals) {
    return (
      '<table class="report-table">' +
      "<thead><tr><th>Project</th><th>Total hours</th></tr></thead>" +
      "<tbody>" +
      totals.map(function (total) {
        return "<tr><td>" + escapeHtml(total.project) + "</td><td>" + formatHours(total.hours) + "</td></tr>";
      }).join("") +
      "</tbody></table>"
    );
  }

  function renderEntriesTable(rows) {
    return (
      '<table class="report-table">' +
      "<thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Project</th><th>Description</th></tr></thead>" +
      "<tbody>" +
      rows.map(function (row) {
        return (
          "<tr><td>" +
          formatDisplayDate(parseKey(row.date)) +
          "</td><td>" +
          escapeHtml(row.checkIn) +
          "</td><td>" +
          escapeHtml(row.checkOut) +
          "</td><td>" +
          formatHours(row.duration) +
          "</td><td>" +
          escapeHtml(row.project) +
          "</td><td>" +
          escapeHtml(row.description || "") +
          "</td></tr>"
        );
      }).join("") +
      "</tbody></table>"
    );
  }

  function getSelectedExportProjects() {
    return Array.prototype.slice.call(elements.projectCheckboxes.querySelectorAll("input:checked")).map(function (checkbox) {
      return checkbox.value;
    });
  }

  function entriesForDate(dateKey) {
    return Array.isArray(state.entries[dateKey]) ? state.entries[dateKey] : [];
  }

  function entriesForRange(startDate, endDate) {
    var startKey = dateToKey(startDate);
    var endKey = dateToKey(endDate);

    return Object.keys(state.entries)
      .filter(function (dateKey) {
        return dateKey >= startKey && dateKey <= endKey;
      })
      .sort()
      .reduce(function (rows, dateKey) {
        entriesForDate(dateKey).forEach(function (entry, index) {
          rows.push(Object.assign({ date: dateKey, entryIndex: index }, entry));
        });
        return rows;
      }, [])
      .sort(compareEntriesByDateAndTime);
  }

  function totalsByProject(rows) {
    var totals = rows.reduce(function (result, row) {
      result[row.project] = (result[row.project] || 0) + Number(row.duration || 0);
      return result;
    }, {});

    return Object.keys(totals).sort(caseInsensitiveSort).map(function (project) {
      return {
        project: project,
        hours: roundHours(totals[project])
      };
    });
  }

  function downloadCsv(rows, totals, startDate, endDate) {
    var csvRows = [["Project Totals"], ["Project", "Total Hours"]]
      .concat(totals.map(function (total) {
        return [total.project, formatHours(total.hours)];
      }))
      .concat([
        [],
        ["Entries By Day"],
        ["Date", "Check In", "Check Out", "Duration Hours", "Project", "Description"]
      ])
      .concat(rows.map(function (row) {
        return [formatDisplayDate(parseKey(row.date)), row.checkIn, row.checkOut, formatHours(row.duration), row.project, row.description || ""];
      }));
    var csvContent = csvRows.map(function (row) {
      return row.map(escapeCsvValue).join(",");
    }).join("\r\n");
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var filename = "timesheet-report-" + dateToKey(startDate) + "-to-" + dateToKey(endDate) + ".csv";

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function normalizeEntries(stored) {
    var normalized = {};

    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      return {};
    }

    Object.keys(stored).forEach(function (dateKey) {
      var value = stored[dateKey];
      var entries = Array.isArray(value) ? value : [value];
      var normalizedEntries = entries.map(function (entry, index) {
        return normalizeEntry(entry, dateKey, index);
      }).filter(Boolean).sort(compareEntriesByTime);

      if (normalizedEntries.length > 0) {
        normalized[dateKey] = normalizedEntries;
      }
    });

    return normalized;
  }

  function normalizeEntry(entry, dateKey, index) {
    var duration;

    if (!entry || typeof entry !== "object") {
      return null;
    }

    duration = calculateDuration(entry.checkIn, entry.checkOut);

    if (duration === null) {
      duration = Number(entry.duration || 0);
    }

    if (!entry.checkIn || !entry.checkOut || !entry.project) {
      return null;
    }

    return {
      id: entry.id || dateKey + "-" + index,
      checkIn: entry.checkIn,
      checkOut: entry.checkOut,
      duration: roundHours(duration),
      project: normalizeStoredProject(entry.project) || DEFAULT_PROJECT,
      description: normalizeDescription(entry.description)
    };
  }

  function normalizeProjects(projectList, entries) {
    var projects = (Array.isArray(projectList) ? projectList : []).concat(projectsFromEntries(entries));
    var normalized = projects.map(function (project) {
      return normalizeStoredProject(project);
    }).filter(Boolean);

    if (normalized.indexOf(DEFAULT_PROJECT) === -1) {
      normalized.unshift(DEFAULT_PROJECT);
    }

    return unique(normalized).sort(caseInsensitiveSort);
  }

  function projectsFromEntries(entries) {
    return Object.keys(entries || {}).reduce(function (projects, dateKey) {
      (entries[dateKey] || []).forEach(function (entry) {
        projects.push(entry.project);
      });
      return projects;
    }, []);
  }

  function createEntry(checkIn, checkOut, project, duration, existingId, description) {
    return {
      id: existingId || createEntryId(),
      checkIn: checkIn,
      checkOut: checkOut,
      duration: roundHours(duration),
      project: project,
      description: normalizeDescription(description)
    };
  }

  function createEntryId() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function compareEntriesByTime(left, right) {
    return left.checkIn.localeCompare(right.checkIn) || left.checkOut.localeCompare(right.checkOut) || left.project.localeCompare(right.project);
  }

  function compareEntriesByDateAndTime(left, right) {
    return left.date.localeCompare(right.date) || compareEntriesByTime(left, right);
  }

  function sumHours(entries) {
    return entries.reduce(function (total, entry) {
      return total + Number(entry.duration || 0);
    }, 0);
  }

  function normalizeStoredProject(project) {
    return typeof project === "string" ? project.trim().replace(/\s+/g, " ") : "";
  }

  function normalizeDescription(description) {
    return typeof description === "string" ? description.trim().replace(/\s+/g, " ") : "";
  }

  function unique(items) {
    return items.filter(function (item, index) {
      return items.indexOf(item) === index;
    });
  }

  function caseInsensitiveSort(left, right) {
    return left.localeCompare(right, undefined, { sensitivity: "base" });
  }

  function showDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function dateToKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function parseKey(dateKey) {
    var parts = dateKey.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function parseDisplayDate(value) {
    var match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((value || "").trim());
    var day;
    var month;
    var year;
    var date;

    if (!match) {
      return null;
    }

    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
    date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  function formatDisplayDate(date) {
    return [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      date.getFullYear()
    ].join("/");
  }

  function formatHours(value) {
    return Number(value || 0).toFixed(2);
  }

  function roundHours(value) {
    return Number(Number(value || 0).toFixed(2));
  }

  function pluralize(word, count) {
    if (count === 1) {
      return word;
    }

    if (/[^aeiou]y$/i.test(word)) {
      return word.slice(0, -1) + "ies";
    }

    return word + "s";
  }

  function escapeCsvValue(value) {
    var stringValue = String(value == null ? "" : value);

    if (/[",\r\n]/.test(stringValue)) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showMessage(element, message, isError) {
    element.textContent = message;
    element.classList.toggle("error", Boolean(isError));
  }

  function clearMessage(element) {
    showMessage(element, "", false);
  }
}());
