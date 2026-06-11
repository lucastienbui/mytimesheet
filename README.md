# Local Timesheet Calendar

A small HTML5 timesheet app that runs locally on macOS, Windows, and Linux. It automatically switches between calendar and agenda-style views based on window size, lets you enter multiple check in/check out records for each day, calculates duration automatically, tracks projects, saves data to a local JSON file, and generates project reports with CSV export.

## Run locally

1. Download or clone this repository to your computer.
2. Double-click `index.html` to open it in your web browser.
3. Click **Open data file** and choose `timesheet-data.json`, or click **Create data file** and save a new `timesheet-data.json` in the same folder.
4. Start entering timesheet records by clicking days on the calendar or agenda.

No server, build step, or internet connection is required.

## Features

- Auto, Calendar, and Agenda month view options with previous/next/today controls.
- Auto uses calendar on wider windows and agenda on smaller windows.
- Calendar day cells show only the number of entries and total hours; blank days do not show filler text.
- Click a day, then click **Add new entry** or **Edit** to show the entry form:
  - Check in time in 24-hour format.
  - Check out time in 24-hour format.
  - Time pickers use 5-minute increments.
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

Modern browsers do not allow a web page to silently write to files on your computer. The app therefore asks you to open or create the data file first. In browsers that support direct local file writing, changes are saved back to that JSON file automatically after you connect it. If your browser does not support direct writing, use **Download data file** after changes to save a new JSON copy.

Keep `timesheet-data.json` in the same folder as `index.html` if you want all app files together.
