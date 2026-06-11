# mytimesheet

A simple full-stack time-tracking app. Log hours against projects and tasks, see daily/total hours.

- **Backend** (`server/`): Express + better-sqlite3 REST API.
- **Frontend** (`client/`): React + Vite + TypeScript single-page UI.

## Getting started

Requires Node.js 22+.

```bash
npm install      # installs all workspace dependencies
npm run dev      # API on http://localhost:3001, UI on http://localhost:5173
```

Open http://localhost:5173 and log your first entry.

## Scripts (run from the repo root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run API + Vite dev server together |
| `npm run build` | Type-check and build both packages |
| `npm test` | Run Vitest test suites |
| `npm run lint` | Run ESLint across the workspace |

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/entries` | List entries + total hours |
| `POST` | `/api/entries` | Create an entry (`project`, `task`, `date`, `hours`, `notes`) |
| `DELETE` | `/api/entries/:id` | Delete an entry |
