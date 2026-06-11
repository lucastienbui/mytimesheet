import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { createApp } from './app.js';
import { createDb } from './db.js';

describe('timesheet API', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createDb(':memory:');
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('reports health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('starts with no entries', async () => {
    const res = await request(app).get('/api/entries');
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
    expect(res.body.totalHours).toBe(0);
  });

  it('creates an entry and returns it in the list', async () => {
    const payload = {
      project: 'Apollo',
      task: 'Design review',
      date: '2026-06-11',
      hours: 2.5,
      notes: 'Reviewed mockups',
    };
    const created = await request(app).post('/api/entries').send(payload);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject(payload);
    expect(created.body.id).toBeTypeOf('number');

    const list = await request(app).get('/api/entries');
    expect(list.body.entries).toHaveLength(1);
    expect(list.body.totalHours).toBe(2.5);
  });

  it('rejects invalid entries', async () => {
    const res = await request(app)
      .post('/api/entries')
      .send({ project: '', task: 'x', date: 'nope', hours: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('deletes an entry', async () => {
    const created = await request(app)
      .post('/api/entries')
      .send({ project: 'P', task: 'T', date: '2026-01-01', hours: 1 });
    const id = created.body.id as number;

    const del = await request(app).delete(`/api/entries/${id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/api/entries');
    expect(list.body.entries).toHaveLength(0);
  });

  it('returns 404 when deleting a missing entry', async () => {
    const res = await request(app).delete('/api/entries/999');
    expect(res.status).toBe(404);
  });
});
