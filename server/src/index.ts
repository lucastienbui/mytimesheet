import { createApp } from './app.js';
import { createDb } from './db.js';

const port = Number(process.env.PORT ?? 3001);
const dbPath = process.env.DB_PATH ?? 'timesheet.db';

const db = createDb(dbPath);
const app = createApp(db);

app.listen(port, () => {
  console.log(`Timesheet API listening on http://localhost:${port}`);
});
