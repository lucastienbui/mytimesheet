(function () {
  "use strict";

  var DATA_FILE_VERSION = 1;
  var DEFAULT_DATA_FILE_NAME = "timesheet-data.json";
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
    dataFileName: "",
    dataFileMode: "memory"
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
    viewModeNote: document.getElementById("viewModeNote"),
    dataFileStatus: document.getElementById("dataFileStatus"),
    openDataFileButton: document.getElementById("openDataFileButton"),
    createDataFileButton: document.getElementById("createDataFileButton"),
    downloadDataFileButton: document.getElementById("downloadDataFileButton"),
    dataFileInput: document.getElementById("dataFileInput"),
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
    projectSelect: document.getElementById("projectSelect"),
    newProjectField: document.getElementById("newProjectField"),
    newProjectInput: document.getElementById("newProjectInput"),
    entryMessage: document.getElementById("entryMessage"),
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
    renderDataFileStatus();
    renderWeekdays();
    renderMainView();
    bindEvents();
    bindResponsiveViewMode();
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

    elements.openDataFileButton.addEventListener("click", openDataFile);
    elements.createDataFileButton.addEventListener("click", createDataFile);
    elements.downloadDataFileButton.addEventListener("click", downloadDataFile);
    elements.dataFileInput.addEventListener("change", importDataFile);

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
    elements.projectSelect.addEventListener("change", toggleNewProjectField);
    elements.entryForm.addEventListener("submit", saveEntry);
    elements.deleteEntryButton.addEventListener("click", deleteSelectedEntry);

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

  async function openDataFile() {
    if (hasDirectFileAccess()) {
      await openDataFileWithPicker();
      return;
    }

    elements.dataFileInput.click();
  }

  async function openDataFileWithPicker() {
    var handles;

    try {
      handles = await window.showOpenFilePicker({
        multiple: false,
        types: [dataFilePickerType()]
      });

      if (!handles || handles.length === 0) {
        return;
      }

      await loadDataFromHandle(handles[0]);
    } catch (error) {
      handleDataFileError(error, "Could not open the selected data file.");
    }
  }

  async function createDataFile() {
    var handle;

    if (!hasDirectFileAccess()) {
      downloadDataFile();
      setDataFileStatus("Your browser does not allow direct file writing here. A JSON data file was downloaded instead.", false);
      return;
    }

    try {
      handle = await window.showSaveFilePicker({
        suggestedName: DEFAULT_DATA_FILE_NAME,
        types: [dataFilePickerType()]
      });
      state.dataFileHandle = handle;
      state.dataFileName = handle.name || DEFAULT_DATA_FILE_NAME;
      state.dataFileMode = "direct";
      await writeDataFile();
      renderDataFileStatus("Created and connected " + state.dataFileName + ".");
    } catch (error) {
      handleDataFileError(error, "Could not create the data file.");
    }
  }

  async function importDataFile(event) {
    var file = event.target.files && event.target.files[0];
    var text;

    if (!file) {
      return;
    }

    try {
      text = await file.text();
      applyDataFileText(text);
      state.dataFileHandle = null;
      state.dataFileName = file.name || DEFAULT_DATA_FILE_NAME;
      state.dataFileMode = "download";
      renderDataFileStatus("Imported " + state.dataFileName + ". Use Download data file after changes to save a new copy.");
      renderAfterDataChange();
    } catch (error) {
      setDataFileStatus("Could not import that data file. Please choose a valid JSON data file.", true);
    } finally {
      elements.dataFileInput.value = "";
    }
  }

  async function loadDataFromHandle(handle) {
    var file = await handle.getFile();
    var text = await file.text();

    applyDataFileText(text);
    state.dataFileHandle = handle;
    state.dataFileName = handle.name || file.name || DEFAULT_DATA_FILE_NAME;
    state.dataFileMode = "direct";
    renderDataFileStatus("Connected to " + state.dataFileName + ". Changes will save to this file.");
    renderAfterDataChange();
  }

  function applyDataFileText(text) {
    var parsed = safeJsonParse(text, null);
    var data = normalizeDataFile(parsed);

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
    if (state.dataFileMode === "direct" && state.dataFileHandle) {
      await writeDataFile();
      renderDataFileStatus("Saved to " + state.dataFileName + ".");
      return true;
    }

    renderDataFileStatus("Changes are in memory only. Click Download data file to save them on this PC.", false);
    return false;
  }

  async function writeDataFile() {
    var writable = await state.dataFileHandle.createWritable();

    await writable.write(JSON.stringify(buildDataFilePayload(), null, 2));
    await writable.close();
  }

  function downloadDataFile() {
    var blob = new Blob([JSON.stringify(buildDataFilePayload(), null, 2)], { type: "application/json;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = state.dataFileName || DEFAULT_DATA_FILE_NAME;
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

  function renderAfterDataChange() {
    state.projects = normalizeProjects(state.projects, state.entries);
    renderMainView();
  }

  function renderDataFileStatus(message) {
    if (message) {
      setDataFileStatus(message, false);
      return;
    }

    if (state.dataFileMode === "direct" && state.dataFileName) {
      setDataFileStatus("Connected to " + state.dataFileName + ". Changes save to this local file.", false);
    } else if (state.dataFileMode === "download" && state.dataFileName) {
      setDataFileStatus("Imported " + state.dataFileName + ". Use Download data file after changes to save a new copy.", false);
    } else {
      setDataFileStatus("No data file connected. Open or create " + DEFAULT_DATA_FILE_NAME + " to save entries on this PC.", false);
    }
  }

  function setDataFileStatus(message, isError) {
    elements.dataFileStatus.textContent = message;
    elements.dataFileStatus.classList.toggle("error", Boolean(isError));
  }

  function hasDirectFileAccess() {
    return typeof window !== "undefined" &&
      typeof window.showOpenFilePicker === "function" &&
      typeof window.showSaveFilePicker === "function";
  }

  function dataFilePickerType() {
    return {
      description: "Timesheet JSON data",
      accept: {
        "application/json": [".json"]
      }
    };
  }

  function handleDataFileError(error, fallbackMessage) {
    if (error && error.name === "AbortError") {
      return;
    }

    setDataFileStatus(fallbackMessage, true);
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

    if (state.viewPreference === VIEW_AUTO) {
      elements.viewModeNote.textContent = state.viewMode === VIEW_CALENDAR
        ? "Auto: calendar view for this window size."
        : "Auto: agenda view for this window size.";
    } else {
      elements.viewModeNote.textContent = state.viewMode === VIEW_CALENDAR
        ? "Calendar view selected."
        : "Agenda view selected.";
    }
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

    elements.agendaView.innerHTML = "";

    for (var day = 1; day <= daysInMonth; day += 1) {
      var date = new Date(year, month, day);
      var dateKey = dateToKey(date);
      var entries = entriesForDate(dateKey);
      var row = document.createElement("article");
      var details = document.createElement("div");
      var openButton = document.createElement("button");

      row.className = "agenda-day" + (entries.length > 0 ? " has-entry" : "");
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
  }

  function resetEntryForm(dateKey) {
    elements.entryForm.reset();
    clearMessage(elements.entryMessage);
    elements.entryDate.value = dateKey;
    elements.entryIndex.value = "";
    elements.entryDialogTitle.textContent = "Add entry for " + formatDisplayDate(parseKey(dateKey));
    elements.entryEditor.classList.remove("hidden");
    renderProjectOptions("");
    elements.deleteEntryButton.classList.add("hidden");
    updateDurationPreview();
    toggleNewProjectField();
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
    renderProjectOptions(entry.project);
    elements.checkInInput.value = entry.checkIn;
    elements.checkOutInput.value = entry.checkOut;
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
        escapeHtml(entry.project);

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
      entries[entryIndex] = createEntry(checkIn, checkOut, project, duration, entries[entryIndex].id);
    } else {
      entries.push(createEntry(checkIn, checkOut, project, duration));
    }

    entries.sort(compareEntriesByTime);
    state.entries[dateKey] = entries;
    try {
      await persistData();
    } catch (error) {
      showMessage(elements.entryMessage, "Entry was updated in memory, but the data file could not be saved.", true);
      setDataFileStatus("Could not save to " + (state.dataFileName || "the data file") + ". Use Download data file to keep a copy.", true);
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
      setDataFileStatus("Could not save to " + (state.dataFileName || "the data file") + ". Use Download data file to keep a copy.", true);
      return;
    }
    renderDayEntries(dateKey);
    renderMainView();
    showEntryListOnly(dateKey);
  }

  function renderProjectOptions(selectedProject) {
    elements.projectSelect.innerHTML = "";

    state.projects.forEach(function (project) {
      var option = document.createElement("option");
      option.value = project;
      option.textContent = project;
      elements.projectSelect.appendChild(option);
    });

    var newProjectOption = document.createElement("option");
    newProjectOption.value = NEW_PROJECT_VALUE;
    newProjectOption.textContent = "+ Create new project";
    elements.projectSelect.appendChild(newProjectOption);

    if (selectedProject && state.projects.indexOf(selectedProject) !== -1) {
      elements.projectSelect.value = selectedProject;
    } else {
      elements.projectSelect.value = state.projects[0] || DEFAULT_PROJECT;
    }
  }

  function toggleNewProjectField() {
    var isCreatingProject = elements.projectSelect.value === NEW_PROJECT_VALUE;
    elements.newProjectField.classList.toggle("hidden", !isCreatingProject);
    elements.newProjectInput.required = isCreatingProject;

    if (isCreatingProject) {
      elements.newProjectInput.focus();
    } else {
      elements.newProjectInput.value = "";
    }
  }

  function getSelectedProject() {
    var selectedProject = elements.projectSelect.value;

    if (selectedProject !== NEW_PROJECT_VALUE) {
      return selectedProject;
    }

    return normalizeProjectName(elements.newProjectInput.value);
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
      "<thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Project</th></tr></thead>" +
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
        ["Date", "Check In", "Check Out", "Duration Hours", "Project"]
      ])
      .concat(rows.map(function (row) {
        return [formatDisplayDate(parseKey(row.date)), row.checkIn, row.checkOut, formatHours(row.duration), row.project];
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
      project: normalizeStoredProject(entry.project) || DEFAULT_PROJECT
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

  function createEntry(checkIn, checkOut, project, duration, existingId) {
    return {
      id: existingId || createEntryId(),
      checkIn: checkIn,
      checkOut: checkOut,
      duration: roundHours(duration),
      project: project
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

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function normalizeStoredProject(project) {
    return typeof project === "string" ? project.trim().replace(/\s+/g, " ") : "";
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
