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

export interface EntriesResponse {
  entries: TimeEntry[];
  totalHours: number;
}

const base = '/api';

export async function fetchEntries(): Promise<EntriesResponse> {
  const res = await fetch(`${base}/entries`);
  if (!res.ok) throw new Error('Failed to load entries');
  return res.json();
}

export async function createEntry(input: NewTimeEntry): Promise<TimeEntry> {
  const res = await fetch(`${base}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to create entry');
  }
  return res.json();
}

export async function deleteEntry(id: number): Promise<void> {
  const res = await fetch(`${base}/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
}
