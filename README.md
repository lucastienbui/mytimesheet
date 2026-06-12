# Local Timesheet Calendar

A small HTML5 timesheet app that runs locally on macOS, Windows, and Linux. It automatically switches between calendar and agenda-style views based on window size, lets you enter multiple check in/check out records for each day, calculates duration automatically, tracks projects, saves data to a local JSON file, and generates project reports with CSV export.

## Run locally

1. Download or clone this repository to your computer.
2. Double-click `MyTimesheet.html` to open it in your web browser.
3. The app will try to load `timesheet-data.json` from the same folder automatically when your browser allows it.
4. If it does not load automatically, click **Open data file** and choose `timesheet-data.json`. You can also click **Create data file** and save a new `timesheet-data.json`.
5. Start entering timesheet records by clicking days on the calendar or agenda.

No server, build step, or internet connection is required.

## Features

- Auto, Calendar, and Agenda month view options with previous/next/today controls.
- Auto uses calendar on wider windows and agenda on smaller windows.
- Agenda view is scrollable and opens at today for the current month, or the first day for other months.
- Calendar day cells show only the number of entries and total hours; blank days do not show filler text.
- Click a day, then click **Add new entry** or **Edit** to show the entry form:
  - Check in time in 24-hour format.
  - Check out time in 24-hour format.
  - Duration, calculated automatically in hours.
  - Project, selected from a dropdown or created from the entry dialog.
- Report button on the main screen.
- Report filters:
  - Start and end dates in `DD/MM/YYYY` format.
  - One project, several projects, or all projects.
- Report preview showing total hours for each selected project.
- CSV export that starts with total working hours by project, then lists detailed entries by day.
- Local JSON data file storage using `timesheet-data.json`.

## Data storage

Timesheet data is stored in `timesheet-data.json` on your computer, not in browser site cache.

Modern browsers do not allow a web page to silently write to files on your computer. The app therefore tries to read `timesheet-data.json` from the app folder, then asks you to open or create the data file if needed. In browsers that support direct local file writing, changes are saved back to that JSON file automatically after you connect it. If your browser does not support direct writing, use **Download data file** after changes to save a new JSON copy.

If you select a differently named JSON file, the app warns you and lets you copy/save that data as `timesheet-data.json` so the app folder keeps a consistent data file.

Keep `timesheet-data.json` in the same folder as `MyTimesheet.html` if you want all app files together.
