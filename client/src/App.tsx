import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  createEntry,
  deleteEntry,
  fetchEntries,
  type NewTimeEntry,
  type TimeEntry,
} from './api';
import './App.css';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: NewTimeEntry = {
  project: '',
  task: '',
  date: today(),
  hours: 1,
  notes: '',
};

export default function App() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [form, setForm] = useState<NewTimeEntry>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await fetchEntries();
      setEntries(data.entries);
      setTotalHours(data.totalHours);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createEntry({ ...form, hours: Number(form.hours) });
      setForm({ ...emptyForm, date: form.date });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEntry(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  }

  const formattedTotal = useMemo(() => totalHours.toFixed(2), [totalHours]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>MyTimesheet</h1>
        <p>Track time across your projects.</p>
      </header>

      <main className="app__main">
        <section className="card">
          <h2>Log time</h2>
          <form className="entry-form" onSubmit={handleSubmit}>
            <label>
              Project
              <input
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                placeholder="Apollo"
                required
              />
            </label>
            <label>
              Task
              <input
                value={form.task}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                placeholder="Design review"
                required
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <label>
              Hours
              <input
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                required
              />
            </label>
            <label className="entry-form__notes">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
              />
            </label>
            <button type="submit">Add entry</button>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
        </section>

        <section className="card">
          <div className="entries__header">
            <h2>Entries</h2>
            <span className="total">Total: {formattedTotal} h</span>
          </div>
          {loading ? (
            <p>Loading…</p>
          ) : entries.length === 0 ? (
            <p className="empty">No entries yet. Log your first one above.</p>
          ) : (
            <table className="entries">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Task</th>
                  <th>Notes</th>
                  <th className="num">Hours</th>
                  <th aria-label="actions"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.project}</td>
                    <td>{e.task}</td>
                    <td className="notes">{e.notes}</td>
                    <td className="num">{e.hours.toFixed(2)}</td>
                    <td>
                      <button
                        className="delete"
                        onClick={() => handleDelete(e.id)}
                        aria-label={`Delete entry ${e.id}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
