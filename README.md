# Local Timesheet Calendar

A small HTML5 timesheet app that runs locally on macOS, Windows, and Linux. It has calendar and agenda-style views, lets you enter multiple check in/check out records for each day, calculates duration automatically, tracks projects, and generates project reports with CSV export.

## Run locally

1. Download or clone this repository to your computer.
2. Double-click `index.html` to open it in your web browser.
3. Start entering timesheet records by clicking days on the calendar.

No server, build step, or internet connection is required.

## Features

- Calendar and agenda month views with previous/next/today controls.
- Click a day to add, edit, or delete several entries for that date:
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

## Data storage

Data is saved on your computer in your browser's `localStorage`. This keeps the app simple and fully local, but it also means:

- Use the same browser to see the same saved timesheet data.
- Clearing browser site data may delete the timesheet records.
- If you move the app to another computer or browser, export a CSV first if you need a copy of the records.
