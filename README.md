# Local Timesheet Calendar

A small HTML5 timesheet app that runs locally on macOS, Windows, and Linux. It has a calendar-style UI, lets you enter check in/check out times for each day, calculates duration automatically, tracks projects, and exports filtered CSV files.

## Run locally

1. Download or clone this repository to your computer.
2. Double-click `index.html` to open it in your web browser.
3. Start entering timesheet records by clicking days on the calendar.

No server, build step, or internet connection is required.

## Features

- Calendar month view with previous/next/today controls.
- Click a day to add or edit:
  - Check in time in 24-hour format.
  - Check out time in 24-hour format.
  - Duration, calculated automatically in hours.
  - Project, selected from a dropdown or created from the entry dialog.
- Export button on the main screen.
- CSV export filters:
  - Start and end dates in `DD/MM/YYYY` format.
  - One project, several projects, or all projects.

## Data storage

Data is saved on your computer in your browser's `localStorage`. This keeps the app simple and fully local, but it also means:

- Use the same browser to see the same saved timesheet data.
- Clearing browser site data may delete the timesheet records.
- If you move the app to another computer or browser, export a CSV first if you need a copy of the records.
