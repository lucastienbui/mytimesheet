# Local Timesheet Calendar

A small HTML5 timesheet app that runs locally on macOS, Windows, and Linux. It automatically switches between calendar and agenda-style views based on window size, lets you enter multiple check in/check out records for each day, calculates duration automatically, tracks projects, saves data to a local JavaScript data file, and generates project reports with CSV export.

## Run locally

1. Download or clone this repository to your computer.
2. Double-click `MyTimesheet.html` to open it in your web browser.
3. The app loads `timesheet-data.js` from the same folder automatically.
4. Save an entry. When prompted, save/choose `timesheet-data.js`; future changes in that browser session will save to that file automatically. You can also click **Export data** to write/download an updated `timesheet-data.js`.
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
- Local JavaScript data file storage using `timesheet-data.js`.

## Data storage

Timesheet data is stored in `timesheet-data.js` on your computer, not in browser site cache.

Modern browsers do not allow a web page to silently write to files on your computer without permission. The app loads the local `timesheet-data.js` file automatically. On the first entry save, browsers that support the File System Access API prompt you to save/choose `timesheet-data.js`; after permission is granted, later changes in that session save automatically. If your browser does not support that API, use **Export data** to download an updated `timesheet-data.js`.

If you have an old data file, export it first and copy its data into the local `timesheet-data.js` file in this folder before using this version.

Keep `timesheet-data.js` in the same folder as `MyTimesheet.html`.
