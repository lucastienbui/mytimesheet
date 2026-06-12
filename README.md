# MyTimesheet Desktop

A local desktop timesheet app for macOS and Windows. It automatically switches between calendar and agenda-style views based on window size, lets you enter multiple check in/check out records for each day, calculates duration automatically, tracks projects, remembers the linked data file, and generates project reports with CSV export.

## Run locally from source

1. Download or clone this repository to your computer.
2. Install dependencies with `npm install`.
3. Start the desktop app with `npm start`.
4. Use **Open data file** to select an existing data file, or **Create data file** to create one.
5. Start entering timesheet records by clicking days on the calendar or agenda.

## Build desktop installers

- Build Windows artifacts: `npm run dist:win`
- Build macOS artifacts: `npm run dist:mac`
- Build unpacked app for the current platform: `npm run pack`

Build outputs are written to `dist/`.

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
- Local JavaScript data file storage using a `.js` data file.
- Desktop data file actions: **Open data file**, **Create data file**, and **Export data**.
- The app remembers the linked data file path and reopens it on the next launch.

## Data storage

Timesheet data is stored in the data file you open or create on your computer, not in browser site cache.

The desktop app uses native file access, so after a data file is opened or created, entry changes save directly to that file. The linked data file path is remembered in the app's desktop settings so it can be reopened automatically next time.

Use **Export data** when you want to save a copy to another location.

Data files use this JavaScript format:

```js
window.MY_TIMESHEET_DATA = {
  "version": 1,
  "updatedAt": null,
  "entries": {},
  "projects": ["General"]
};
```
