(function () {
  "use strict";

  var ENTRY_STORAGE_KEY = "local-timesheet.entries.v1";
  var PROJECT_STORAGE_KEY = "local-timesheet.projects.v1";
  var NEW_PROJECT_VALUE = "__new_project__";
  var DEFAULT_PROJECT = "General";
  var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
  var longDateFormatter = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  var storedEntries = loadEntries();
  var state = {
    viewedDate: startOfMonth(new Date()),
    entries: storedEntries,
    projects: loadProjects(storedEntries)
  };

  var elements = {
    calendarTitle: document.getElementById("calendarTitle"),
    monthSummary: document.getElementById("monthSummary"),
    calendarWeekdays: document.getElementById("calendarWeekdays"),
    calendarDays: document.getElementById("calendarDays"),
    previousMonthButton: document.getElementById("previousMonthButton"),
    nextMonthButton: document.getElementById("nextMonthButton"),
    todayButton: document.getElementById("todayButton"),
    openExportButton: document.getElementById("openExportButton"),
    entryDialog: document.getElementById("entryDialog"),
    entryForm: document.getElementById("entryForm"),
    entryDialogTitle: document.getElementById("entryDialogTitle"),
    closeEntryButton: document.getElementById("closeEntryButton"),
    cancelEntryButton: document.getElementById("cancelEntryButton"),
    deleteEntryButton: document.getElementById("deleteEntryButton"),
    entryDate: document.getElementById("entryDate"),
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
    exportStartInput: document.getElementById("exportStartInput"),
    exportEndInput: document.getElementById("exportEndInput"),
    allProjectsCheckbox: document.getElementById("allProjectsCheckbox"),
    projectCheckboxes: document.getElementById("projectCheckboxes"),
    exportMessage: document.getElementById("exportMessage")
  };

  initialize();

  function initialize() {
    renderWeekdays();
    renderCalendar();
    bindEvents();
  }

  function bindEvents() {
    elements.previousMonthButton.addEventListener("click", function () {
      state.viewedDate = new Date(state.viewedDate.getFullYear(), state.viewedDate.getMonth() - 1, 1);
      renderCalendar();
    });

    elements.nextMonthButton.addEventListener("click", function () {
      state.viewedDate = new Date(state.viewedDate.getFullYear(), state.viewedDate.getMonth() + 1, 1);
      renderCalendar();
    });

    elements.todayButton.addEventListener("click", function () {
      state.viewedDate = startOfMonth(new Date());
      renderCalendar();
    });

    elements.openExportButton.addEventListener("click", openExportDialog);
    elements.closeEntryButton.addEventListener("click", closeEntryDialog);
    elements.cancelEntryButton.addEventListener("click", closeEntryDialog);
    elements.closeExportButton.addEventListener("click", closeExportDialog);
    elements.cancelExportButton.addEventListener("click", closeExportDialog);

    elements.checkInInput.addEventListener("input", updateDurationPreview);
    elements.checkOutInput.addEventListener("input", updateDurationPreview);
    elements.projectSelect.addEventListener("change", toggleNewProjectField);
    elements.entryForm.addEventListener("submit", saveEntry);
    elements.deleteEntryButton.addEventListener("click", deleteEntry);

    elements.exportForm.addEventListener("submit", exportCsv);
    elements.allProjectsCheckbox.addEventListener("change", renderProjectCheckboxAvailability);

    elements.entryDialog.addEventListener("click", function (event) {
      if (event.target === elements.entryDialog) {
        closeEntryDialog();
      }
    });

    elements.exportDialog.addEventListener("click", function (event) {
      if (event.target === elements.exportDialog) {
        closeExportDialog();
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

  function renderCalendar() {
    var year = state.viewedDate.getFullYear();
    var month = state.viewedDate.getMonth();
    var firstDay = new Date(year, month, 1);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var todayKey = dateToKey(new Date());
    var monthlyEntries = entriesForRange(firstDay, new Date(year, month, daysInMonth));
    var monthlyHours = monthlyEntries.reduce(function (total, entry) {
      return total + Number(entry.duration || 0);
    }, 0);

    elements.calendarTitle.textContent = monthFormatter.format(state.viewedDate);
    elements.monthSummary.textContent = monthlyEntries.length + " " + pluralize("entry", monthlyEntries.length) + " · " + formatHours(monthlyHours) + " hours";
    elements.calendarDays.innerHTML = "";

    for (var blank = 0; blank < firstDay.getDay(); blank += 1) {
      var emptyCell = document.createElement("div");
      emptyCell.className = "day-cell is-empty";
      elements.calendarDays.appendChild(emptyCell);
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      var date = new Date(year, month, day);
      var dateKey = dateToKey(date);
      var entry = state.entries[dateKey];
      var dayButton = document.createElement("button");
      var classNames = ["day-cell"];
      var entryMarkup = '<div class="entry-preview">No entry yet</div>';

      if (dateKey === todayKey) {
        classNames.push("is-today");
      }

      if (entry) {
        classNames.push("has-entry");
        entryMarkup =
          '<div class="entry-preview">' +
          escapeHtml(entry.checkIn) +
          " - " +
          escapeHtml(entry.checkOut) +
          "<br>" +
          formatHours(entry.duration) +
          " hours" +
          '<br><span class="entry-project">' +
          escapeHtml(entry.project) +
          "</span></div>";
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
        entryMarkup;
      dayButton.addEventListener("click", openEntryDialog.bind(null, dateKey));
      elements.calendarDays.appendChild(dayButton);
    }
  }

  function openEntryDialog(dateKey) {
    var entry = state.entries[dateKey];

    elements.entryForm.reset();
    clearMessage(elements.entryMessage);
    elements.entryDate.value = dateKey;
    elements.entryDialogTitle.textContent = (entry ? "Edit entry for " : "Add entry for ") + formatDisplayDate(parseKey(dateKey));
    renderProjectOptions(entry ? entry.project : "");

    elements.checkInInput.value = entry ? entry.checkIn : "";
    elements.checkOutInput.value = entry ? entry.checkOut : "";
    elements.deleteEntryButton.classList.toggle("hidden", !entry);
    updateDurationPreview();
    toggleNewProjectField();
    showDialog(elements.entryDialog);
    elements.checkInInput.focus();
  }

  function closeEntryDialog() {
    elements.entryDialog.close();
  }

  function saveEntry(event) {
    event.preventDefault();
    clearMessage(elements.entryMessage);

    var dateKey = elements.entryDate.value;
    var checkIn = elements.checkInInput.value;
    var checkOut = elements.checkOutInput.value;
    var duration = calculateDuration(checkIn, checkOut);
    var project = getSelectedProject();

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
      saveProjects();
    }

    state.entries[dateKey] = {
      checkIn: checkIn,
      checkOut: checkOut,
      duration: roundHours(duration),
      project: project
    };
    saveEntries();
    closeEntryDialog();
    renderCalendar();
  }

  function deleteEntry() {
    var dateKey = elements.entryDate.value;

    if (dateKey && state.entries[dateKey]) {
      delete state.entries[dateKey];
      saveEntries();
      closeEntryDialog();
      renderCalendar();
    }
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

  function openExportDialog() {
    var monthStart = state.viewedDate;
    var monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    clearMessage(elements.exportMessage);
    elements.exportStartInput.value = formatDisplayDate(monthStart);
    elements.exportEndInput.value = formatDisplayDate(monthEnd);
    elements.allProjectsCheckbox.checked = true;
    renderProjectCheckboxes();
    renderProjectCheckboxAvailability();
    showDialog(elements.exportDialog);
  }

  function closeExportDialog() {
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
          renderProjectCheckboxAvailability();
        }
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
      checkbox.checked = disabled || checkbox.checked;
    });
  }

  function exportCsv(event) {
    event.preventDefault();
    clearMessage(elements.exportMessage);

    var startDate = parseDisplayDate(elements.exportStartInput.value);
    var endDate = parseDisplayDate(elements.exportEndInput.value);
    var selectedProjects = getSelectedExportProjects();
    var rows;

    if (!startDate || !endDate) {
      showMessage(elements.exportMessage, "Please enter dates in DD/MM/YYYY format.", true);
      return;
    }

    if (startDate > endDate) {
      showMessage(elements.exportMessage, "Start date must be before or equal to end date.", true);
      return;
    }

    if (!elements.allProjectsCheckbox.checked && selectedProjects.length === 0) {
      showMessage(elements.exportMessage, "Please choose at least one project or select all projects.", true);
      return;
    }

    rows = entriesForRange(startDate, endDate).filter(function (entry) {
      return elements.allProjectsCheckbox.checked || selectedProjects.indexOf(entry.project) !== -1;
    });

    if (rows.length === 0) {
      showMessage(elements.exportMessage, "No entries match this export filter.", true);
      return;
    }

    downloadCsv(rows, startDate, endDate);
    closeExportDialog();
  }

  function getSelectedExportProjects() {
    return Array.prototype.slice.call(elements.projectCheckboxes.querySelectorAll("input:checked")).map(function (checkbox) {
      return checkbox.value;
    });
  }

  function entriesForRange(startDate, endDate) {
    var startKey = dateToKey(startDate);
    var endKey = dateToKey(endDate);

    return Object.keys(state.entries)
      .filter(function (dateKey) {
        return dateKey >= startKey && dateKey <= endKey;
      })
      .sort()
      .map(function (dateKey) {
        return Object.assign({ date: dateKey }, state.entries[dateKey]);
      });
  }

  function downloadCsv(rows, startDate, endDate) {
    var header = ["Date", "Check In", "Check Out", "Duration Hours", "Project"];
    var csvRows = [header].concat(
      rows.map(function (row) {
        return [formatDisplayDate(parseKey(row.date)), row.checkIn, row.checkOut, formatHours(row.duration), row.project];
      })
    );
    var csvContent = csvRows.map(function (row) {
      return row.map(escapeCsvValue).join(",");
    }).join("\r\n");
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var filename = "timesheet-" + dateToKey(startDate) + "-to-" + dateToKey(endDate) + ".csv";

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function loadEntries() {
    var stored = safeJsonParse(localStorage.getItem(ENTRY_STORAGE_KEY), {});

    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  }

  function saveEntries() {
    localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(state.entries));
  }

  function loadProjects(entries) {
    var stored = safeJsonParse(localStorage.getItem(PROJECT_STORAGE_KEY), null);
    var projects = Array.isArray(stored) ? stored : projectsFromEntries(entries);
    var normalized = projects.map(function (project) {
      return normalizeStoredProject(project);
    }).filter(Boolean);

    if (normalized.indexOf(DEFAULT_PROJECT) === -1) {
      normalized.unshift(DEFAULT_PROJECT);
    }

    return unique(normalized).sort(caseInsensitiveSort);
  }

  function projectsFromEntries(entries) {
    return Object.keys(entries || {}).map(function (dateKey) {
      return entries[dateKey].project;
    });
  }

  function saveProjects() {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(state.projects));
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
    return count === 1 ? word : word + "s";
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
