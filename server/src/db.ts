import Database from 'better-sqlite3';

export interface TimeEntry {
  id: number;
  project: string;
  task: string;
  date: string;
  hours: number;
  notes: string;
  createdAt: string;
}

export type NewTimeEntry = Omit<TimeEntry, 'id' | 'createdAt'>;

/**
 * Creates (and migrates) a SQLite-backed timesheet database.
 * Pass ':memory:' for an ephemeral database (used in tests).
 */
export function createDb(filename: string): Database.Database {
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL,
      task TEXT NOT NULL,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}
