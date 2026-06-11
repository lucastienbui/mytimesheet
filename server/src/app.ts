import express, { type Express, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import type { NewTimeEntry, TimeEntry } from './db.js';

function parseEntry(body: unknown): { value?: NewTimeEntry; error?: string } {
  if (typeof body !== 'object' || body === null) {
    return { error: 'Request body must be a JSON object' };
  }
  const { project, task, date, hours, notes } = body as Record<string, unknown>;

  if (typeof project !== 'string' || project.trim() === '') {
    return { error: 'project is required' };
  }
  if (typeof task !== 'string' || task.trim() === '') {
    return { error: 'task is required' };
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: 'date is required (YYYY-MM-DD)' };
  }
  const numericHours = typeof hours === 'number' ? hours : Number(hours);
  if (!Number.isFinite(numericHours) || numericHours <= 0 || numericHours > 24) {
    return { error: 'hours must be a number between 0 and 24' };
  }

  return {
    value: {
      project: project.trim(),
      task: task.trim(),
      date,
      hours: numericHours,
      notes: typeof notes === 'string' ? notes.trim() : '',
    },
  };
}

export function createApp(db: Database.Database): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/entries', (_req: Request, res: Response) => {
    const entries = db
      .prepare('SELECT * FROM entries ORDER BY date DESC, id DESC')
      .all() as TimeEntry[];
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    res.json({ entries, totalHours });
  });

  app.post('/api/entries', (req: Request, res: Response) => {
    const { value, error } = parseEntry(req.body);
    if (error || !value) {
      res.status(400).json({ error });
      return;
    }
    const result = db
      .prepare(
        'INSERT INTO entries (project, task, date, hours, notes) VALUES (?, ?, ?, ?, ?)',
      )
      .run(value.project, value.task, value.date, value.hours, value.notes);
    const created = db
      .prepare('SELECT * FROM entries WHERE id = ?')
      .get(result.lastInsertRowid) as TimeEntry;
    res.status(201).json(created);
  });

  app.delete('/api/entries/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }
    const result = db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'entry not found' });
      return;
    }
    res.status(204).end();
  });

  return app;
}
