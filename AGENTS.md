# mytimesheet

A small full-stack time-tracking app used to log hours against projects.

## Layout

- `server/` — Express + better-sqlite3 REST API (`@mytimesheet/server`). Endpoints under `/api` (`/health`, `/entries`). Data persists to a SQLite file (`server/timesheet.db`, gitignored).
- `client/` — React + Vite + TypeScript single-page UI (`@mytimesheet/client`).
- Root is an npm workspaces project; scripts fan out to both packages.

## Common commands (run from repo root)

- `npm run dev` — runs the API (port `3001`) and Vite dev server (port `5173`) together via `concurrently`.
- `npm run build` — type-checks/builds both packages.
- `npm test` — runs Vitest in both packages.
- `npm run lint` — runs ESLint in both packages.

Standard package scripts live in each `package.json`; see those for per-workspace commands.

## Cursor Cloud specific instructions

- Node 22 is required; dependencies install at the repo root with `npm install` (npm workspaces hoist `server/` and `client/` deps). The update script handles this.
- The Vite dev server proxies `/api` to `http://localhost:3001`, so the API must be running for the UI to load data. `npm run dev` starts both; do not start only the client.
- `server/timesheet.db` is created on first run and is gitignored. Tests use an in-memory DB (`createDb(':memory:')`) so they never touch this file. Delete `server/timesheet.db*` if you want a clean slate.
- The single root `eslint.config.js` (flat config) is resolved from each workspace via ancestor lookup, so `eslint .` works inside either package.
- `better-sqlite3` is a native module installed via prebuilt binaries; if Node's ABI changes, a fresh `npm install` rebuilds it.
